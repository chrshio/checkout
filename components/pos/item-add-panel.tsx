"use client";

import { useRef, useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/pos-types";
import {
  type ModifierGroup,
  getModifierGroups,
  isGroupRequirementUnmet,
  computeNewModifiers,
} from "@/lib/modifiers";
import {
  type DraftItemOptions,
  CheckboxRow,
  FULFILLMENT_METHODS,
  TAX_OPTIONS,
  DISCOUNT_OPTIONS,
  SERVICE_CHARGE_OPTIONS,
} from "./item-edit-panel";
import { cn } from "@/lib/utils";

interface ItemAddPanelProps {
  item: MenuItem;
  onCancel: () => void;
  draftQuantity: number;
  draftModifiers: string[];
  draftOptions: DraftItemOptions;
  onQuantityChange: (q: number) => void;
  onModifiersChange: (m: string[]) => void;
  onOptionsChange: (o: DraftItemOptions) => void;
  scrollSignal?: { groupId: string; nonce: number } | null;
}

function ModifierTile({
  option,
  isSelected,
  onClick,
}: {
  option: { id: string; name: string; price?: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col justify-end h-[112px] w-full p-3 rounded-[12px] bg-[#f0f0f0] text-left transition-all active:scale-[0.97]"
    >
      {isSelected && (
        <div className="absolute inset-0 rounded-[12px] border-2 border-[#101010] pointer-events-none">
          <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_2px_white] pointer-events-none" />
        </div>
      )}
      <span className="text-[16px] font-medium text-[#101010] leading-6 truncate">
        {option.name}
      </span>
      {option.price !== undefined && (
        <span className="text-[12px] text-[#101010] leading-[18px]">
          +${option.price.toFixed(2)}
        </span>
      )}
    </button>
  );
}

export function ItemAddPanel({
  item,
  onCancel,
  draftQuantity,
  draftModifiers,
  draftOptions,
  onQuantityChange,
  onModifiersChange,
  onOptionsChange,
  scrollSignal,
}: ItemAddPanelProps) {

  const modifierGroups = getModifierGroups(item);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Scroll to the target section whenever a new scroll signal arrives.
  useEffect(() => {
    if (!scrollSignal) return;
    const el = sectionRefs.current[scrollSignal.groupId];
    if (el) {
      setActiveTabId(scrollSignal.groupId);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollSignal?.nonce]);

  const tabs = [
    ...modifierGroups.map((group) => ({
      id: group.id,
      label: group.name,
      required: !!(group.minSelect && group.minSelect > 0),
      alert: isGroupRequirementUnmet(group, draftModifiers),
    })),
    { id: "note", label: "Note", required: false, alert: false },
    { id: "options", label: "Options", required: false, alert: false },
  ];

  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  });

  const effectiveActiveTabId = activeTabId ?? tabs[0]?.id;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop } = container;
      const THRESHOLD = 80;
      let next: string | null = null;
      for (const { id } of tabsRef.current) {
        const el = sectionRefs.current[id];
        if (!el) continue;
        if (el.offsetTop - THRESHOLD <= scrollTop) next = id;
      }
      if (next !== null) setActiveTabId(next);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    const el = sectionRefs.current[tabId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleLineItem = (
    field: keyof Pick<DraftItemOptions, "taxes" | "discounts" | "serviceCharges">,
    id: string
  ) => {
    const current = draftOptions[field];
    onOptionsChange({
      ...draftOptions,
      [field]: current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    });
  };

  return (
    <div className="flex flex-col h-full bg-white px-6">
      {/* Header: item name + quantity stepper */}
      <div className="flex items-center gap-3 pt-4 pb-4">
        <h2 className="text-[25px] font-semibold text-[#101010] truncate flex-1">
          {item.name}
        </h2>

        {/* Quantity stepper */}
        <div className="flex items-center border border-[#dadada] rounded-full h-[56px] shrink-0">
          <button
            onClick={() => onQuantityChange(Math.max(1, draftQuantity - 1))}
            disabled={draftQuantity <= 1}
            className="flex items-center justify-center w-[56px] h-[56px] shrink-0 disabled:cursor-default"
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
              <Minus
                className={cn(
                  "w-4 h-4 transition-colors",
                  draftQuantity <= 1 ? "text-[#c8c8c8]" : "text-[#101010]"
                )}
              />
            </span>
          </button>
          <span
            className="text-[16px] text-[#101010] text-center min-w-[28px]"
            style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
          >
            {draftQuantity}
          </span>
          <button
            onClick={() => onQuantityChange(draftQuantity + 1)}
            className="flex items-center justify-center w-[56px] h-[56px] shrink-0"
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f0f0f0]">
              <Plus className="w-4 h-4 text-[#101010]" />
            </span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[#f0f0f0]">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-1.5 text-[14px] font-semibold pb-2.5 pt-1 border-b-2 transition-colors shrink-0",
                tab.id === effectiveActiveTabId
                  ? "text-[#101010] border-[#101010]"
                  : "text-[#666] border-transparent"
              )}
            >
              {tab.label}
              {tab.alert && (
                <span className="w-[8px] h-[8px] rounded-full shrink-0 bg-[#005ad9]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-6 relative"
      >
        {/* Modifier groups */}
        {modifierGroups.map((group) => {
          const requirementUnmet = isGroupRequirementUnmet(group, draftModifiers);
          return (
            <div
              key={group.id}
              ref={(el) => { sectionRefs.current[group.id] = el; }}
              className="pt-2"
            >
              <div className="flex items-center gap-2 min-h-[40px] py-2 w-full">
                <span className="text-[14px] font-medium text-[#101010]">
                  {group.name}
                </span>
                {requirementUnmet && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e5f0ff] text-[#005ad9] text-[12px] font-medium leading-[18px]">
                    Select {group.minSelect}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pb-2">
                {group.options.map((option) => (
                  <ModifierTile
                    key={option.id}
                    option={option}
                    isSelected={draftModifiers.includes(option.id)}
                    onClick={() =>
                      onModifiersChange(
                        computeNewModifiers(group, option.id, draftModifiers)
                      )
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Note section */}
        <div
          ref={(el) => { sectionRefs.current["note"] = el; }}
          className="pt-2"
        >
          <div className="flex items-center gap-2 min-h-[40px] py-2">
            <span className="text-[14px] font-medium text-[#101010]">Note</span>
          </div>
          <textarea
            value={draftOptions.note}
            onChange={(e) => onOptionsChange({ ...draftOptions, note: e.target.value })}
            placeholder="Add an item note..."
            rows={4}
            className={cn(
              "w-full resize-none rounded-[8px] border px-4 py-5 text-[15px] text-[#101010] leading-[22px]",
              "placeholder:text-[#b0b0b0]",
              "border-[#dadada]",
              "focus:border-2 focus:border-[#101010] focus:outline-none",
              "transition-colors"
            )}
          />
        </div>

        {/* Options section */}
        <div
          ref={(el) => { sectionRefs.current["options"] = el; }}
          className="pt-2"
        >
          {/* Fulfillment methods */}
          <div className="flex items-center gap-2 min-h-[40px] py-2">
            <span className="text-[14px] font-medium text-[#101010]">
              Fulfillment methods
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 pb-4">
            {FULFILLMENT_METHODS.map((method) => (
              <ModifierTile
                key={method.id}
                option={method}
                isSelected={draftOptions.fulfillmentMethod === method.id}
                onClick={() =>
                  onOptionsChange({
                    ...draftOptions,
                    fulfillmentMethod:
                      draftOptions.fulfillmentMethod === method.id
                        ? undefined
                        : method.id,
                  })
                }
              />
            ))}
          </div>

          {/* Taxes */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">Taxes</span>
          </div>
          <div className="mb-2">
            {TAX_OPTIONS.map((tax) => (
              <CheckboxRow
                key={tax.id}
                label={tax.name}
                value={tax.type === "percentage" ? `${tax.value}%` : `$${tax.value}`}
                checked={draftOptions.taxes.includes(tax.id)}
                onToggle={() => toggleLineItem("taxes", tax.id)}
              />
            ))}
          </div>

          {/* Discounts */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">Discounts</span>
          </div>
          <div className="mb-2">
            {DISCOUNT_OPTIONS.map((discount) => (
              <CheckboxRow
                key={discount.id}
                label={discount.name}
                value={
                  discount.type === "percentage"
                    ? `${discount.value}%`
                    : `$${discount.value}`
                }
                checked={draftOptions.discounts.includes(discount.id)}
                onToggle={() => toggleLineItem("discounts", discount.id)}
              />
            ))}
          </div>

          {/* Service charges */}
          <div className="flex items-center gap-2 min-h-[40px] py-2 border-t border-[#f0f0f0]">
            <span className="text-[14px] font-semibold text-[#101010]">
              Service charges
            </span>
          </div>
          <div className="mb-2">
            {SERVICE_CHARGE_OPTIONS.map((charge) => (
              <CheckboxRow
                key={charge.id}
                label={charge.name}
                value={
                  charge.type === "percentage"
                    ? `${charge.value}%`
                    : `$${charge.value}`
                }
                checked={draftOptions.serviceCharges.includes(charge.id)}
                onToggle={() => toggleLineItem("serviceCharges", charge.id)}
              />
            ))}
          </div>

          {/* Item description */}
          {item.description && (
            <div className="py-4 border-t border-[#f0f0f0]">
              <p className="text-[14px] font-semibold text-[#101010] mb-1">
                About
              </p>
              <p className="text-[14px] text-[#888] leading-[22px]">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

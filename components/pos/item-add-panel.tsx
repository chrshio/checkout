"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { MenuItem } from "@/lib/pos-types";
import { Stepper } from "@/components/ui/stepper";
import type { ComboDefinition, ComboSlotSelection } from "@/lib/pos-types";
import {
  type ModifierGroup,
  getModifierGroups,
  isGroupRequirementUnmet,
  computeNewModifiers,
  getVariationOptionPriceDisplay,
} from "@/lib/modifiers";
import {
  type DraftItemOptions,
  CheckboxRow,
  FULFILLMENT_METHODS,
  TAX_OPTIONS,
  DISCOUNT_OPTIONS,
  SERVICE_CHARGE_OPTIONS,
} from "./item-edit-panel";
import { ComboSection } from "./combo-section";
import { cn } from "@/lib/utils";

/** Seat option for the seat-selection section. */
export interface SeatOption {
  id: string;
  label: string;
}

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
  /** Combo/meal: when set, show combo slot section at top. */
  comboDefinition?: ComboDefinition | null;
  draftComboSelections?: Record<string, ComboSlotSelection>;
  onComboSelectionsChange?: (slotId: string, selection: ComboSlotSelection) => void;
  getCategoryItems?: (categoryId: string) => MenuItem[];
  getMenuItemById?: (itemId: string) => MenuItem | undefined;
  /** When set, show slot-detail view (parent > item header + slot item modifiers). */
  editingComboSlotId?: string | null;
  onBackFromSlotModify?: () => void;
  /** When provided, Modify on a combo slot opens the slot-detail view (call with slotId). */
  onModifySlot?: (slotId: string) => void;
  /** FSR seating: available seats. When provided, seat section appears at top. */
  seats?: SeatOption[];
  draftSeatId?: string | null;
  onSeatChange?: (seatId: string) => void;
  /** When provided, shows "Add seat" tile that adds a new seat and selects it. */
  onAddSeat?: () => void;
  /** When true, hide the header (title + stepper); used when parent renders a custom header (e.g. modal). */
  hideHeader?: boolean;
  /**
   * When true (e.g. briefly after failed Add), show red tab dots, coral “Select” pills,
   * and light-red tiles for unmet sections; parent clears after validation toast timing.
   */
  incompleteRequirementHighlightActive?: boolean;
}

function requirementPillClass(highlightActive: boolean | undefined, size: "sm" | "md") {
  return cn(
    "inline-flex items-center px-2 py-0.5 rounded-full font-medium transition-colors duration-500 ease-out",
    size === "sm" ? "text-[12px] leading-[18px]" : "text-[14px] leading-[22px]",
    highlightActive
      ? "bg-[#fde8e8] text-[#b42318]"
      : "bg-[#e5f0ff] text-[#005ad9]"
  );
}

function ModifierTile({
  option,
  isSelected,
  onClick,
  priceDisplay,
  incompleteSurface,
}: {
  option: { id: string; name: string; price?: number };
  isSelected: boolean;
  onClick: () => void;
  priceDisplay?: string | null;
  /** Light red tile background when this section still needs a selection. */
  incompleteSurface?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-end h-[112px] w-full p-3 rounded-[12px] text-left transition-colors duration-500 ease-out active:scale-[0.97] active:transition-transform active:duration-75",
        incompleteSurface ? "bg-[#fde8e8]" : "bg-[#f0f0f0]"
      )}
    >
      {isSelected && (
        <div className="absolute inset-0 rounded-[12px] border-2 border-[#101010] pointer-events-none">
          <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_2px_white] pointer-events-none" />
        </div>
      )}
      <span className="text-[16px] font-medium text-[#101010] leading-6 truncate">
        {option.name}
      </span>
      {priceDisplay && (
        <span className="text-[12px] text-[#101010] leading-[18px]">
          {priceDisplay}
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
  comboDefinition,
  draftComboSelections = {},
  onComboSelectionsChange,
  getCategoryItems = () => [],
  getMenuItemById = () => undefined,
  editingComboSlotId = null,
  onBackFromSlotModify,
  onModifySlot,
  seats,
  draftSeatId,
  onSeatChange,
  onAddSeat,
  hideHeader,
  incompleteRequirementHighlightActive = false,
}: ItemAddPanelProps) {
  const isCombo = !!comboDefinition;
  const activeSlot =
    isCombo && editingComboSlotId && comboDefinition
      ? comboDefinition.slots.find((s) => s.slotId === editingComboSlotId)
      : undefined;
  const activeSlotSelection =
    editingComboSlotId != null ? draftComboSelections[editingComboSlotId] : undefined;
  const activeSlotItemId =
    activeSlot?.type === "fixed" ? activeSlot.itemId : activeSlotSelection?.itemId;
  const activeSlotItem = activeSlotItemId ? getMenuItemById(activeSlotItemId) : undefined;
  const isSlotDetail =
    !!(isCombo && editingComboSlotId && activeSlot && activeSlotItem && onComboSelectionsChange);
  const effectiveItem = isSlotDetail ? activeSlotItem : null;
  const modifierGroups = isSlotDetail
    ? getModifierGroups(effectiveItem!)
    : isCombo
      ? []
      : getModifierGroups(item);
  const firstModifierGroupId = modifierGroups[0]?.id;
  const effectiveDraftModifiers = isSlotDetail
    ? activeSlotSelection?.modifiers ?? []
    : draftModifiers;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Combo add panel: default to Items tab so it matches initial scroll position at the items section.
  const [activeTabId, setActiveTabId] = useState<string | null>(() =>
    isCombo ? "items" : null
  );

  /** First required group that still has unmet selection, or null. */
  const getNextUnmetRequiredGroupId = (modifiers: string[]) => {
    return modifierGroups.find(
      (g) =>
        g.minSelect &&
        g.minSelect > 0 &&
        isGroupRequirementUnmet(g, modifiers)
    )?.id ?? null;
  };

  const handleModifierSelect = (group: ModifierGroup, optionId: string) => {
    const currentModifiers = isSlotDetail ? effectiveDraftModifiers : draftModifiers;
    const nextModifiers = computeNewModifiers(group, optionId, currentModifiers);
    if (isSlotDetail && editingComboSlotId && activeSlotItemId && onComboSelectionsChange) {
      onComboSelectionsChange(editingComboSlotId, {
        itemId: activeSlotItemId,
        modifiers: nextModifiers,
      });
    } else {
      onModifiersChange(nextModifiers);
    }
    const wasRequiredAndUnmet =
      group.minSelect &&
      group.minSelect > 0 &&
      isGroupRequirementUnmet(group, currentModifiers);
    const nowSatisfied = !isGroupRequirementUnmet(group, nextModifiers);
    if (wasRequiredAndUnmet && nowSatisfied) {
      const nextId = getNextUnmetRequiredGroupId(nextModifiers);
      if (nextId) {
        // Defer until after React commit and layout so refs and positions are correct (e.g. in modal)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToSection(nextId));
        });
      }
    }
  };

  /** Align section top to container top (no extra gap). */
  const SCROLL_SECTION_TOP_GAP = 0;

  const scrollToSection = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    const el = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (container && el) {
      // Use getBoundingClientRect so scrolling works when panel is inside a transformed container (e.g. modal)
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = Math.max(
        0,
        container.scrollTop + (elRect.top - containerRect.top) - SCROLL_SECTION_TOP_GAP
      );
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  // Scroll to the target section whenever a new scroll signal arrives.
  useEffect(() => {
    if (!scrollSignal) return;
    scrollToSection(scrollSignal.groupId);
  }, [scrollSignal?.nonce, scrollToSection, scrollSignal]);

  const hasSeatSection = !!(seats && seats.length > 0 && onSeatChange && !isSlotDetail);
  const seatTab = hasSeatSection
    ? { id: "__seat__", label: "Seat", required: true, alert: !draftSeatId }
    : null;

  const tabs = isCombo && !isSlotDetail
    ? [
        ...(seatTab ? [seatTab] : []),
        { id: "items", label: "Items", required: false, alert: false },
        { id: "note", label: "Note", required: false, alert: false },
        { id: "options", label: "Options", required: false, alert: false },
      ]
    : [
        ...(seatTab ? [seatTab] : []),
        ...modifierGroups.map((group) => ({
          id: group.id,
          label: group.name,
          required: !!(group.minSelect && group.minSelect > 0),
          alert: isGroupRequirementUnmet(group, effectiveDraftModifiers),
        })),
        { id: "note", label: "Note", required: false, alert: false },
        { id: "options", label: "Options", required: false, alert: false },
      ];

  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  });

  useEffect(() => {
    const defaultTabId =
      isCombo && !isSlotDetail ? "items" : (firstModifierGroupId ?? "note");
    setActiveTabId(defaultTabId);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [item.id, isCombo, isSlotDetail, editingComboSlotId, activeSlotItemId, firstModifierGroupId]);

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
    scrollToSection(tabId);
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
    <div className="flex flex-col flex-1 min-h-0 bg-white px-6">
      {!hideHeader && (
      <div className="flex items-center gap-6 pt-4 pb-4 h-[88px]">
        {isSlotDetail && activeSlotItem ? (
          <h2 className="min-w-0 flex-1 text-[25px] font-semibold leading-tight truncate">
            <button
              type="button"
              onClick={onBackFromSlotModify}
              className="text-[#666] active:opacity-70"
            >
              {item.name}
            </button>
            <span className="px-2 text-[#9a9a9a]">{">"}</span>
            <span className="text-[#101010]">{activeSlotItem.name}</span>
          </h2>
        ) : (
          <>
            <h2 className="text-[25px] font-semibold text-[#101010] truncate flex-1">
              {item.name}
            </h2>

            {/* Quantity stepper */}
            <Stepper value={draftQuantity} onChange={onQuantityChange} min={1} />
          </>
        )}
      </div>
      )}

      {/* Tab bar (Meal / Note / Options for combo; modifier groups + Note + Options otherwise) */}
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
                <span
                  className={cn(
                    "w-[8px] h-[8px] rounded-full shrink-0 transition-colors duration-500 ease-out",
                    incompleteRequirementHighlightActive ? "bg-[#cc0023]" : "bg-[#005ad9]"
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide pb-6 relative"
      >
        {/* Seat selection section */}
        {hasSeatSection && (
          <div
            ref={(el) => { sectionRefs.current["__seat__"] = el; }}
            className="pt-2"
          >
            <div className="flex items-center gap-2 min-h-[40px] py-2 w-full">
              <span className="text-[16px] font-medium text-[#101010]">Seat</span>
              {!draftSeatId && (
                <span
                  className={requirementPillClass(
                    incompleteRequirementHighlightActive,
                    "md"
                  )}
                >
                  Select 1
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 pb-2">
              {seats!.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => onSeatChange!(seat.id)}
                  className={cn(
                    "relative flex flex-col justify-end h-[112px] w-full p-3 rounded-[12px] text-left transition-colors duration-500 ease-out active:scale-[0.97] active:transition-transform active:duration-75",
                    incompleteRequirementHighlightActive && !draftSeatId
                      ? "bg-[#fde8e8]"
                      : "bg-[#f0f0f0]"
                  )}
                >
                  {draftSeatId === seat.id && (
                    <div className="absolute inset-0 rounded-[12px] border-2 border-[#101010] pointer-events-none">
                      <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_2px_white] pointer-events-none" />
                    </div>
                  )}
                  <span className="text-[16px] font-medium text-[#101010] leading-6 truncate">
                    {seat.label}
                  </span>
                </button>
              ))}
              {onAddSeat && (
                <button
                  onClick={onAddSeat}
                  className={cn(
                    "relative flex flex-col justify-end h-[112px] w-full p-3 rounded-[12px] text-left transition-colors duration-500 ease-out active:scale-[0.97] active:transition-transform active:duration-75",
                    incompleteRequirementHighlightActive && !draftSeatId
                      ? "bg-[#fde8e8]"
                      : "bg-[#f0f0f0]"
                  )}
                >
                  <span className="text-[16px] font-medium text-[#101010] leading-6 truncate">
                    Add seat
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meal section (combo slots) — same layout as other sections, with ref for tab scroll */}
        {isCombo && !isSlotDetail && comboDefinition && getCategoryItems && getMenuItemById && onComboSelectionsChange && (
          <div
            ref={(el) => { sectionRefs.current["items"] = el; }}
            className="pt-2"
          >
            <ComboSection
              comboDefinition={comboDefinition}
              selections={draftComboSelections}
              onSelectionsChange={onComboSelectionsChange}
              onModifySlot={onModifySlot}
              getCategoryItems={getCategoryItems}
              getMenuItemById={getMenuItemById}
            />
          </div>
        )}

        {/* Modifier groups */}
        {modifierGroups.map((group) => {
          const requirementUnmet = isGroupRequirementUnmet(group, effectiveDraftModifiers);
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
                  <span
                    className={requirementPillClass(
                      incompleteRequirementHighlightActive,
                      "sm"
                    )}
                  >
                    Select {group.minSelect}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pb-2">
                {group.options.map((option, optionIndex) => {
                  const priceDisplay =
                    group.id === "variations"
                      ? getVariationOptionPriceDisplay(
                          group,
                          option,
                          optionIndex
                        )
                      : option.price != null
                        ? `+$${option.price.toFixed(2)}`
                        : null;
                  return (
                    <ModifierTile
                      key={option.id}
                      option={option}
                      isSelected={effectiveDraftModifiers.includes(option.id)}
                      onClick={() => handleModifierSelect(group, option.id)}
                      priceDisplay={priceDisplay}
                      incompleteSurface={
                        incompleteRequirementHighlightActive && requirementUnmet
                      }
                    />
                  );
                })}
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
          {(effectiveItem?.description ?? item.description) && (
            <div className="py-4 border-t border-[#f0f0f0]">
              <p className="text-[14px] font-semibold text-[#101010] mb-1">
                About
              </p>
              <p className="text-[14px] text-[#888] leading-[22px]">
                {effectiveItem?.description ?? item.description}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { X, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import {
  type PrinterData,
  type PrinterGroup,
  type PrinterGroupSettings,
  type DeviceType,
  computePrinterStatus,
  getPrintsSummaryFromSettings,
  locationDevices,
  defaultPrinterGroupSettings,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";
import { getCategoriesSubcopy, type CategoriesSubcopy } from "@/lib/printer-categories-copy";
import type { TicketAppearance } from "@/lib/printer-data";

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

function getAppearanceSummary(a: TicketAppearance): string {
  const parts: string[] = [];
  if (a.compactTicket) parts.push("Compact ticket");
  if (a.singleItemPerTicket) parts.push("Single item per ticket");
  if (a.combineIdenticalItems) parts.push("Combined items");
  if (a.includeTopPadding) parts.push("Top padding");
  if (a.printKitchenNames) parts.push("Print kitchen names");
  return parts.length > 0 ? parts.join(", ") : "Default ticket style";
}

function renderCategoriesSubcopy(sub: CategoriesSubcopy): React.ReactNode {
  if (sub.type === "all") return sub.text;
  if (sub.type === "summary") return sub.text;
  if (sub.type === "list") {
    const visible = sub.categories.slice(0, 3);
    const overflow = sub.categories.length - 3;
    return (
      <span className="flex flex-col gap-2 pl-4">
        {visible.map((c) => (
          <span key={c.name} className="flex flex-col gap-0">
            <span className="font-medium text-[14px] leading-[20px] text-[#101010]">{c.name} ({c.itemCount} items)</span>
            {c.itemSnippet && (
              <span className="text-[14px] leading-[20px] text-[#666]">{c.itemSnippet}</span>
            )}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-[14px] font-medium text-[#101010] underline">+{overflow} more</span>
        )}
      </span>
    );
  }
  return null;
}

const settingsCardClass = "flex flex-col gap-4 pt-4 pb-4 px-6 rounded-2xl border border-black/10 bg-white";

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-[40px] h-[24px] rounded-[100px] shrink-0 transition-colors",
        enabled ? "bg-[#101010]" : "border-2 border-solid border-[#959595] bg-transparent"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full transition-transform",
          enabled ? "left-[calc(100%-18px)] bg-white" : "left-[3px] bg-[#959595]"
        )}
      />
    </button>
  );
}

function SectionBlock({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between py-4">
        <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">{title}</h3>
        {trailing}
      </div>
      {children && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

function Row({
  label,
  subtitle,
  trailing,
  largeGap,
  centerTrailing,
}: {
  label: string;
  subtitle?: React.ReactNode;
  trailing: React.ReactNode;
  largeGap?: boolean;
  centerTrailing?: boolean;
}) {
  return (
    <div className={cn("flex justify-between py-4 border-b border-black/5 last:border-b-0", centerTrailing ? "items-center" : "items-start")}>
      <div className={cn("flex flex-col min-w-0 flex-1 mr-4", largeGap ? "gap-4" : "gap-0")}>
        <span className="text-[16px] font-medium text-[#101010]">{label}</span>
        {subtitle != null && <span className="text-[14px] leading-[22px] text-[#666]">{subtitle}</span>}
      </div>
      {trailing}
    </div>
  );
}

export interface CreateGroupPageProps {
  selectedPrinterIds: string[];
  templatePrinterId: string | null;
  printers: PrinterData[];
  onSave: (group: PrinterGroup, updatedPrinters: PrinterData[]) => void;
  onBack: () => void;
}

function printerToGroupSettings(p: PrinterData): PrinterGroupSettings {
  return {
    receiptsEnabled: p.receiptsEnabled,
    autoPrintReceipts: p.autoPrintReceipts,
    receiptCopies: p.receiptCopies,
    inPersonEnabled: p.inPersonEnabled,
    inPersonCategories: p.inPersonCategories,
    inPersonCategoryIds: p.inPersonCategoryIds,
    onlineEnabled: p.onlineEnabled,
    sameAsInPerson: p.sameAsInPerson,
    ticketAppearance: { ...p.ticketAppearance },
    ticketStubsEnabled: p.ticketStubsEnabled,
    voidTicketsEnabled: p.voidTicketsEnabled,
  };
}

export function CreateGroupPage({
  selectedPrinterIds,
  templatePrinterId,
  printers,
  onSave,
  onBack,
}: CreateGroupPageProps) {
  const templatePrinter = templatePrinterId ? printers.find((p) => p.id === templatePrinterId) : null;
  const initialSettings = useMemo(
    () =>
      templatePrinter
        ? printerToGroupSettings(templatePrinter)
        : { ...defaultPrinterGroupSettings },
    [templatePrinter]
  );

  const [groupName, setGroupName] = useState("New printer group");
  const [settings, setSettings] = useState<PrinterGroupSettings>(initialSettings);

  const selectedPrinters = useMemo(
    () => printers.filter((p) => selectedPrinterIds.includes(p.id)),
    [printers, selectedPrinterIds]
  );

  const updateSettings = useCallback((partial: Partial<PrinterGroupSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(() => {
    const id = "group-" + Date.now();
    const group: PrinterGroup = {
      id,
      name: groupName.trim() || "New printer group",
      printerIds: [...selectedPrinterIds],
      settings,
    };
    const updatedPrinters = printers.map((p) =>
      selectedPrinterIds.includes(p.id)
        ? { ...p, groupId: id, ...settings }
        : p
    );
    onSave(group, updatedPrinters);
  }, [groupName, selectedPrinterIds, settings, printers, onSave]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center p-3 rounded-full bg-black/5"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-[#101010]" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 bg-[#101010] text-white"
        >
          Save
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="flex flex-col gap-2 w-[1032px] max-w-full mx-auto pb-4">
          <h1 className="font-semibold text-[25px] leading-8 text-[#101010]">
            Create printer group
          </h1>
          <p className="text-[14px] leading-[22px] text-[#666]">
            Edits made here will affect the settings on {selectedPrinters.length} printers.
          </p>
        </div>

        <div className="flex w-[1032px] max-w-full min-w-0 gap-8 mx-auto">
          {/* Left column: cards for group name + settings */}
          <div className="min-w-0 flex-1 flex flex-col gap-6">
            {/* Group name card */}
            <div className={settingsCardClass}>
              <label className="block text-[14px] font-medium leading-[22px] text-[#101010] mb-2">
                Group name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-black/15 text-[15px] leading-[22px] text-[#101010] placeholder:text-[#666] outline-none focus:border-[#101010]"
              />
            </div>

            {/* Receipts card */}
            <div className={settingsCardClass}>
              <SectionBlock
                title="Receipts"
                trailing={<ToggleSwitch enabled={settings.receiptsEnabled} onChange={(v) => updateSettings({ receiptsEnabled: v })} />}
              >
                {settings.receiptsEnabled && (
                  <>
                    <Row
                      label="Print receipts automatically"
                      trailing={<ToggleSwitch enabled={settings.autoPrintReceipts} onChange={(v) => updateSettings({ autoPrintReceipts: v })} />}
                    />
                    <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={settings.receiptCopies} onChange={(v) => updateSettings({ receiptCopies: v })} />} />
                  </>
                )}
              </SectionBlock>
            </div>

            {/* In-person order tickets card */}
            <div className={settingsCardClass}>
              <SectionBlock
                title="In-person order tickets"
                trailing={<ToggleSwitch enabled={settings.inPersonEnabled} onChange={(v) => updateSettings({ inPersonEnabled: v })} />}
              >
                {settings.inPersonEnabled && (
                  <>
                    <Row
                      label="Categories & items"
                      largeGap
                      subtitle={renderCategoriesSubcopy(getCategoriesSubcopy(settings.inPersonCategoryIds))}
                      trailing={<button type="button" className="text-[14px] font-semibold text-[#101010] underline">Edit</button>}
                    />
                    <Row
                      label="Appearance"
                      subtitle={getAppearanceSummary(settings.ticketAppearance)}
                      centerTrailing
                      trailing={<button type="button" className="text-[14px] font-semibold text-[#101010] underline">Edit</button>}
                    />
                    <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
                  </>
                )}
              </SectionBlock>
            </div>

            {/* Online and kiosk order tickets card */}
            <div className={settingsCardClass}>
              <SectionBlock
                title="Online and kiosk order tickets"
                trailing={<ToggleSwitch enabled={settings.onlineEnabled} onChange={(v) => updateSettings({ onlineEnabled: v })} />}
              >
                {settings.onlineEnabled && (
                  <>
                    <Row
                      label="Same as in-person order settings"
                      trailing={
                        <button
                          type="button"
                          onClick={() => updateSettings({ sameAsInPerson: !settings.sameAsInPerson })}
                          className={cn(
                            "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center",
                            settings.sameAsInPerson ? "bg-[#101010] border-[#101010]" : "border-[#959595]"
                          )}
                        >
                          {settings.sameAsInPerson && <span className="text-white text-[12px]">✓</span>}
                        </button>
                      }
                    />
                    {!settings.sameAsInPerson && (
                      <>
                        <Row
                          label="Categories & items"
                          largeGap
                          subtitle={renderCategoriesSubcopy(getCategoriesSubcopy(settings.inPersonCategoryIds))}
                          trailing={<button type="button" className="text-[14px] font-semibold text-[#101010] underline">Edit</button>}
                        />
                        <Row
                          label="Appearance"
                          subtitle={getAppearanceSummary(settings.ticketAppearance)}
                          centerTrailing
                          trailing={<button type="button" className="text-[14px] font-semibold text-[#101010] underline">Edit</button>}
                        />
                        <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
                      </>
                    )}
                  </>
                )}
              </SectionBlock>
            </div>

            {/* Ticket stubs card */}
            <div className={settingsCardClass}>
              <SectionBlock
                title="Ticket stubs"
                trailing={<ToggleSwitch enabled={settings.ticketStubsEnabled} onChange={(v) => updateSettings({ ticketStubsEnabled: v })} />}
              >
                {settings.ticketStubsEnabled && (
                  <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
                )}
              </SectionBlock>
            </div>

            {/* Void tickets card */}
            <div className={settingsCardClass}>
              <SectionBlock
                title="Void tickets"
                trailing={<ToggleSwitch enabled={settings.voidTicketsEnabled} onChange={(v) => updateSettings({ voidTicketsEnabled: v })} />}
              >
                {settings.voidTicketsEnabled && (
                  <>
                    <p className="text-[14px] leading-[22px] text-[#666]">
                      Print void tickets for in-person, kiosk and online orders.
                    </p>
                    <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
                  </>
                )}
              </SectionBlock>
            </div>
          </div>

          {/* Right column: Printers in group + Sources */}
          <div className="w-[400px] shrink-0 flex flex-col gap-6">
            {/* Printers in group card */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Printers in group</h3>
                <button type="button" className="text-[14px] font-semibold text-[#101010] underline">
                  Edit
                </button>
              </div>
              <div className="flex flex-col gap-0">
                {selectedPrinters.map((printer) => {
                  const status = computePrinterStatus(printer);
                  return (
                    <div
                      key={printer.id}
                      className="flex items-center gap-3 py-3 border-b border-black/5 last:border-b-0"
                    >
                      <img
                        src="/printer-image.png"
                        alt=""
                        className="w-9 h-9 object-contain shrink-0"
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-medium text-[#101010]">{printer.name}</p>
                        <p className="text-[14px] leading-[22px] text-[#666]">{printer.location ?? "—"}</p>
                      </div>
                      <StatusPill variant={status} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sources card (dummy) */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
              <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Sources</h3>
              <div className="flex items-center justify-between py-2">
                <span className="text-[15px] font-medium text-[#101010]">Select all</span>
                <ToggleSwitch enabled={false} onChange={() => {}} />
              </div>
              <p className="text-[14px] leading-[22px] text-[#666]">
                Print from every POS (per location)
              </p>
              <div className="flex flex-col gap-0">
                {locationDevices.slice(0, 2).map((source) => {
                  const Icon = deviceIcon[source.deviceType];
                  return (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 py-3 border-b border-black/5 last:border-b-0"
                    >
                      {Icon && (
                        <div className="flex items-center justify-center shrink-0 w-9 h-9">
                          <Icon className="w-6 h-6 text-[#101010]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-medium text-[#101010]">{source.name}</p>
                        <p className="text-[14px] leading-[22px] text-[#666]">{source.deviceType}</p>
                      </div>
                      <button type="button" className="text-[14px] font-semibold text-[#101010] underline">
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

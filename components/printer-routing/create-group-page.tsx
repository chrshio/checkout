"use client";

import { useState, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { X, Monitor, Smartphone, Tablet, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { TextField } from "@/components/ui/text-field";
import {
  type PrinterData,
  type PrinterGroup,
  type PrinterGroupSettings,
  type SourceDevice,
  type DeviceType,
  computePrinterStatus,
  getPrintsSummaryFromSettings,
  getDevicesForLocation,
  CURRENT_LOCATION_NAME,
  defaultPrinterGroupSettings,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";
import { EditAppearanceModal } from "@/components/printer-routing/edit-appearance-modal";
import { EditCategoriesModal } from "@/components/printer-routing/edit-categories-modal";
import { EditSourcesModal } from "@/components/printer-routing/edit-sources-modal";
import { getCategoriesSubcopy, type CategoriesSubcopy } from "@/lib/printer-categories-copy";
import type { TicketAppearance } from "@/lib/printer-data";

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

const APPEARANCE_LABELS: { key: keyof TicketAppearance; label: string }[] = [
  { key: "compactTicket", label: "Compact ticket" },
  { key: "singleItemPerTicket", label: "Single item per ticket" },
  { key: "combineIdenticalItems", label: "Combine identical items" },
  { key: "includeTopPadding", label: "Include top padding" },
  { key: "printKitchenNames", label: "Print kitchen names" },
];

/** Summary at the top; only list settings that are on. */
function getAppearanceSummary(a: TicketAppearance): string {
  const onLabels = APPEARANCE_LABELS.filter((row) => a[row.key]).map((row) => row.label);
  if (onLabels.length === 0) return "Default ticket settings";
  return "Default ticket settings. " + onLabels.join(", ") + ".";
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
}: {
  label: string;
  subtitle?: React.ReactNode;
  trailing: React.ReactNode;
  /** When true, use extra gap and top-align row (e.g. multi-line Categories list). Otherwise left/right are vertically centered. */
  largeGap?: boolean;
}) {
  return (
    <div className={cn("flex justify-between py-4 border-b border-black/5 last:border-b-0", largeGap ? "items-start" : "items-center")}>
      <div className={cn("flex flex-col min-w-0 flex-1 mr-4", largeGap ? "gap-4" : "gap-0")}>
        <span className="text-[16px] font-medium text-[#101010]">{label}</span>
        {subtitle != null && <span className="text-[14px] leading-[22px] text-[#666]">{subtitle}</span>}
      </div>
      {trailing}
    </div>
  );
}

export interface CreateGroupPageProps {
  /** When set, edit this group (same UI, save updates the group). */
  existingGroup?: PrinterGroup | null;
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
  existingGroup = null,
  selectedPrinterIds,
  templatePrinterId,
  printers,
  onSave,
  onBack,
}: CreateGroupPageProps) {
  const isEdit = existingGroup != null;
  const templatePrinter = templatePrinterId ? printers.find((p) => p.id === templatePrinterId) : null;
  const initialSettings = useMemo(
    () =>
      existingGroup
        ? { ...existingGroup.settings }
        : templatePrinter
          ? printerToGroupSettings(templatePrinter)
          : { ...defaultPrinterGroupSettings },
    [existingGroup, templatePrinter]
  );

  const [groupName, setGroupName] = useState(
    () => existingGroup?.name ?? "New printer group"
  );
  const [settings, setSettings] = useState<PrinterGroupSettings>(initialSettings);

  const selectedPrinters = useMemo(
    () => printers.filter((p) => selectedPrinterIds.includes(p.id)),
    [printers, selectedPrinterIds]
  );

  /** All unique POS sources across the printers in this group (deduplicated by source id). */
  const groupSources = useMemo(() => {
    const byId = new Map<string, SourceDevice>();
    for (const printer of selectedPrinters) {
      for (const source of printer.sources) {
        if (!byId.has(source.id)) byId.set(source.id, source);
      }
    }
    return Array.from(byId.values());
  }, [selectedPrinters]);

  /** Locations that the printers in this group belong to (used when "Select all" is on). */
  const groupLocations = useMemo(() => {
    const locations = new Set<string>();
    for (const p of selectedPrinters) {
      locations.add(p.location?.trim() || CURRENT_LOCATION_NAME);
    }
    return Array.from(locations);
  }, [selectedPrinters]);

  /** When "Select all" is on: all POS at every group location; Edit links for locations are disabled. Persisted with the group. */
  const [selectAllSources, setSelectAllSources] = useState(
    () => existingGroup?.selectAllSources ?? false
  );

  /** Which location's "Edit sources" modal is open (null = closed). */
  const [editSourcesLocation, setEditSourcesLocation] = useState<string | null>(null);
  /** Per-location source selection overrides (from Edit modal). When not set, use groupSources for that location. */
  const [sourceSelectionByLocation, setSourceSelectionByLocation] = useState<Record<string, Set<string>>>({});

  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false);
  const [editAppearanceOpen, setEditAppearanceOpen] = useState(false);

  /** Selected source IDs for a location: override if we edited, else from groupSources at that location. */
  const getSelectedSourceIdsForLocation = useCallback(
    (location: string): Set<string> => {
      const override = sourceSelectionByLocation[location];
      if (override) return override;
      const devices = getDevicesForLocation(location);
      return new Set(devices.filter((d) => groupSources.some((s) => s.id === d.id)).map((d) => d.id));
    },
    [sourceSelectionByLocation, groupSources]
  );

  const updateSettings = useCallback((partial: Partial<PrinterGroupSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(() => {
    const id = existingGroup?.id ?? "group-" + Date.now();
    const group: PrinterGroup = {
      id,
      name: groupName.trim() || "New printer group",
      printerIds: [...selectedPrinterIds],
      settings,
      selectAllSources,
    };
    const updatedPrinters = printers.map((p) => {
      if (!selectedPrinterIds.includes(p.id)) return p;
      const location = p.location?.trim() || CURRENT_LOCATION_NAME;
      const devices = getDevicesForLocation(location);
      const selectedIds =
        selectAllSources ? new Set(devices.map((d) => d.id)) : getSelectedSourceIdsForLocation(location);
      const sources = devices.filter((d) => selectedIds.has(d.id));
      return { ...p, groupId: id, ...settings, sources };
    });
    onSave(group, updatedPrinters);
  }, [existingGroup?.id, groupName, selectedPrinterIds, settings, printers, onSave, selectAllSources, getSelectedSourceIdsForLocation]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setIsHeaderCollapsed(el.scrollTop > 80);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header: sticky; expanded at top, collapses to single row on scroll (same as printer detail) */}
      <header className="sticky top-0 z-10 shrink-0 bg-white">
        {isHeaderCollapsed ? (
          <div className="flex items-center justify-between border-b border-black/5 px-6 pt-4 pb-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center p-3 rounded-full bg-black/5"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-[#101010]" />
            </button>
            <div className="flex flex-1 items-center justify-center min-w-0 px-4">
              <h1 className="font-semibold text-[19px] leading-[26px] text-[#101010] truncate text-center">
                {groupName.trim() || (isEdit ? "Edit printer group" : "Create printer group")}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 shrink-0 bg-[#101010] text-white"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between w-full px-6 pt-6">
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
                className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 shrink-0 bg-[#101010] text-white"
              >
                Save
              </button>
            </div>
            <div className="flex flex-col gap-2 w-[1032px] max-w-full mx-auto px-0 pb-4">
              <h1 className="font-semibold text-[25px] leading-8 text-[#101010] truncate">
                {isEdit ? "Edit printer group" : "Create printer group"}
              </h1>
              <p className="text-[14px] leading-[22px] text-[#666]">
                Edits made here will affect the settings on {selectedPrinters.length} printers.
              </p>
            </div>
          </div>
        )}
      </header>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 pt-4">
        <div className="h-0 w-0 shrink-0" aria-hidden />
        <div className="flex w-[1032px] max-w-full min-w-0 gap-8 mx-auto">
          {/* Left column: cards for group name + settings */}
          <div className="min-w-0 flex-1 flex flex-col gap-6">
            <TextField
              label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
            />

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
                      trailing={
                        <button
                          type="button"
                          onClick={() => setEditCategoriesOpen(true)}
                          className="text-[14px] font-semibold text-[#101010] underline"
                        >
                          Edit
                        </button>
                      }
                    />
                    <Row
                      label="Appearance"
                      subtitle={getAppearanceSummary(settings.ticketAppearance)}
                      trailing={
                        <button
                          type="button"
                          onClick={() => setEditAppearanceOpen(true)}
                          className="text-[14px] font-semibold text-[#101010] underline"
                        >
                          Edit
                        </button>
                      }
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
                          trailing={
                            <button
                              type="button"
                              onClick={() => setEditCategoriesOpen(true)}
                              className="text-[14px] font-semibold text-[#101010] underline"
                            >
                              Edit
                            </button>
                          }
                        />
                        <Row
                          label="Appearance"
                          subtitle={getAppearanceSummary(settings.ticketAppearance)}
                          trailing={
                            <button
                              type="button"
                              onClick={() => setEditAppearanceOpen(true)}
                              className="text-[14px] font-semibold text-[#101010] underline"
                            >
                              Edit
                            </button>
                          }
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
                        <p className="text-[14px] leading-[22px] text-[#666]">{printer.location ?? CURRENT_LOCATION_NAME}</p>
                      </div>
                      <StatusPill variant={status} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sources card — POS sources the printers in this group are printing from */}
            <div className="flex flex-col gap-0 p-6 rounded-2xl border border-black/10 bg-white">
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Sources</h3>
              </div>
              <div className="flex gap-4 items-center py-4">
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <p className="text-[16px] font-medium leading-6 text-[#101010]">Select all</p>
                  <p className="text-[14px] leading-[22px] text-[#666]">
                  Print from every POS (per location)
                  </p>
                </div>
                <ToggleSwitch
                  enabled={selectAllSources}
                  onChange={setSelectAllSources}
                />
              </div>
              <div className="h-px shrink-0 w-full bg-[#f0f0f0]" aria-hidden />
              <div className="flex flex-col">
                {groupLocations.length === 0 ? (
                  <p className="py-4 text-[14px] leading-[22px] text-[#666]">
                    No locations. Add printers to the group to see their locations.
                  </p>
                ) : (
                  groupLocations.map((location) => {
                    const devices = getDevicesForLocation(location);
                    const total = devices.length;
                    const selectedIds = getSelectedSourceIdsForLocation(location);
                    const selectedCount = selectAllSources ? total : selectedIds.size;
                    const subcopy =
                      total === 0
                        ? "No POS"
                        : selectAllSources || selectedCount === total
                          ? total === 1
                            ? "All POS (1)"
                            : `All POS (${total})`
                          : `${selectedCount} of ${total} sources`;
                    const editDisabled = selectAllSources;
                    return (
                      <div
                        key={location}
                        className="flex gap-4 items-center py-4 border-b border-black/5 last:border-b-0"
                      >
                        <div className="flex items-center justify-center shrink-0 size-6">
                          <Store className="w-6 h-6 text-[#101010]" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <p className="text-[16px] font-medium leading-6 text-[#101010]">
                            {location} ({total})
                          </p>
                          <p className="text-[14px] leading-[22px] text-[#666]">
                            {subcopy}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={editDisabled}
                          onClick={() => editDisabled || setEditSourcesLocation(location)}
                          className={cn(
                            "text-[14px] font-semibold underline shrink-0",
                            editDisabled
                              ? "text-[#999] cursor-not-allowed opacity-60"
                              : "text-[#101010]"
                          )}
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditAppearanceModal
        open={editAppearanceOpen}
        onOpenChange={(open) => !open && setEditAppearanceOpen(false)}
        appearance={settings.ticketAppearance}
        onSave={(appearance) => {
          updateSettings({ ticketAppearance: appearance });
          setEditAppearanceOpen(false);
        }}
      />
      <EditCategoriesModal
        key={editCategoriesOpen ? "categories-open" : "categories-closed"}
        open={editCategoriesOpen}
        onOpenChange={(open) => !open && setEditCategoriesOpen(false)}
        selectedIds={new Set(settings.inPersonCategoryIds ?? [])}
        onSave={(ids) => {
          updateSettings({ inPersonCategoryIds: Array.from(ids) });
          setEditCategoriesOpen(false);
        }}
      />
      <EditSourcesModal
        key={editSourcesLocation != null ? `sources-${editSourcesLocation}` : "sources-closed"}
        open={editSourcesLocation != null}
        onOpenChange={(open) => !open && setEditSourcesLocation(null)}
        location={editSourcesLocation ?? ""}
        selectedIds={editSourcesLocation ? getSelectedSourceIdsForLocation(editSourcesLocation) : new Set()}
        onSave={(selectedIds) => {
          if (editSourcesLocation) {
            setSourceSelectionByLocation((prev) => ({ ...prev, [editSourcesLocation]: selectedIds }));
            setEditSourcesLocation(null);
          }
        }}
      />
    </div>
  );
}

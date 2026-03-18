"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { X, Monitor, Smartphone, Tablet, AlertTriangle, AlertCircle, Pencil, FileText, FolderOpen, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import {
  type PrinterData,
  type PrinterGroup,
  type DeviceType,
  type TicketAppearance,
  computePrinterStatus,
  getPrintsSummaryFromSettings,
  getDevicesForLocation,
  CURRENT_LOCATION_NAME,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";
import { getCategoriesSubcopy, getCategoriesShortText, type CategoriesSubcopy } from "@/lib/printer-categories-copy";
import { EditAppearanceModal } from "./edit-appearance-modal";
import { EditCategoriesModal } from "./edit-categories-modal";
import { EditSourcesModal } from "./edit-sources-modal";
import { PaperSizeSheet } from "./paper-size-sheet";

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

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

interface PrinterDetailWebProps {
  printer: PrinterData;
  group?: PrinterGroup | null;
  onBack: () => void;
  onSave: (printer: PrinterData) => void;
  onEditCategories: () => void;
  /** When the user taps "Edit printer group", open the edit group page (sheet) with this group. */
  onEditPrinterGroup?: (group: PrinterGroup) => void;
  /** When the user taps "Remove from group", remove this printer from its group. */
  onRemoveFromGroup?: () => void;
}

export function PrinterDetailWeb({
  printer,
  group = null,
  onBack,
  onSave,
  onEditCategories,
  onEditPrinterGroup,
  onRemoveFromGroup,
}: PrinterDetailWebProps) {
  const [draft, setDraft] = useState<PrinterData>({
    ...printer,
    sources: printer.sources.map((s) => ({ ...s })),
    ticketAppearance: { ...printer.ticketAppearance },
    inPersonCategoryIds: printer.inPersonCategoryIds ?? [],
    onlineTicketAppearance: printer.onlineTicketAppearance ? { ...printer.onlineTicketAppearance } : undefined,
    onlineCopies: printer.onlineCopies ?? 1,
  });
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false);
  const [editCategoriesTarget, setEditCategoriesTarget] = useState<"inPerson" | "online" | null>(null);
  const [editAppearanceTarget, setEditAppearanceTarget] = useState<"inPerson" | "online" | null>(null);
  const [editSourcesOpen, setEditSourcesOpen] = useState(false);
  const [paperSizeSheetOpen, setPaperSizeSheetOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setIsHeaderCollapsed(el.scrollTop > 80);
    onScroll(); // set initial
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const updateDraft = useCallback((partial: Partial<PrinterData>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSaveAppearance = useCallback((appearance: TicketAppearance) => {
    setDraft((prev) => ({ ...prev, ticketAppearance: appearance }));
  }, []);

  const handleSaveSources = useCallback((selectedIds: Set<string>) => {
    setDraft((prev) => {
      const location = prev.location ?? CURRENT_LOCATION_NAME;
      const devices = getDevicesForLocation(location);
      return { ...prev, sources: devices.filter((d) => selectedIds.has(d.id)) };
    });
  }, []);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(printer);
  const printerStatus = computePrinterStatus(draft);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header: sticky; expanded at top, collapses to single row on scroll (Figma Header V2) */}
      <header className="sticky top-0 z-10 shrink-0 bg-white">
        {isHeaderCollapsed ? (
          <div className="flex h-fit gap-0 items-center justify-between border-b border-black/5 px-6 pt-4 pb-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center p-3 rounded-full bg-black/5"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-[#101010]" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-2 min-w-0 px-4">
              <h1 className="font-semibold text-[19px] leading-[26px] text-[#101010] truncate text-center">
                {draft.name}
              </h1>
              <StatusPill variant={printerStatus} />
            </div>
            <button
              type="button"
              onClick={() => hasChanges && onSave(draft)}
              disabled={!hasChanges}
              className={cn(
                "flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 shrink-0",
                hasChanges
                  ? "bg-[#101010] text-white"
                  : "bg-[#f0f0f0] text-[#101010] cursor-not-allowed"
              )}
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
                onClick={() => hasChanges && onSave(draft)}
                disabled={!hasChanges}
                className={cn(
                  "flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 shrink-0",
                  hasChanges
                    ? "bg-[#101010] text-white"
                    : "bg-[#f0f0f0] text-[#101010] cursor-not-allowed"
                )}
              >
                Save
              </button>
            </div>
            <div className="flex flex-col gap-2 w-[1032px] max-w-full mx-auto px-0 pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-semibold text-[25px] leading-8 text-[#101010] truncate">
                  {draft.name}
                </h1>
                <button
                  type="button"
                  className="flex items-center justify-center shrink-0 rounded-full p-1.5 text-[#999]"
                  aria-label="Edit printer name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <StatusPill variant={printerStatus} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[14px] leading-[22px] text-[#666]">
                  Last updated: {draft.lastUpdated ?? "—"}
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Not configured banner — inside sticky header so it doesn't scroll with content; hide when header collapsed */}
        {(printerStatus === "critical" || printerStatus === "not-configured") && !isHeaderCollapsed && (
          <div className="w-[1032px] max-w-full mx-auto mt-0 mb-2 shrink-0">
            <div className="flex gap-3 items-start min-h-[56px] p-4 rounded-[6px] bg-[#ffe5ea] border border-[#ffccd5]">
              <AlertTriangle className="w-6 h-6 text-[#bf0020] shrink-0" />
              <span className="text-[16px] leading-6 text-[#101010]">
                {printerStatus === "not-configured"
                  ? "Not configured"
                  : "All connected sources are offline"}
              </span>
            </div>
          </div>
        )}
        {group && !isHeaderCollapsed && (
          <div className="w-[1032px] max-w-full mx-auto mt-0 mb-2 shrink-0">
            <div className="flex gap-3 items-start min-h-[56px] p-4 rounded-[6px] bg-[#fff3e0] border border-[#ffe0b2]">
              <AlertTriangle className="w-6 h-6 text-[#c25400] shrink-0" />
              <span className="text-[16px] leading-6 text-[#101010]">
                Low on paper. Please refill.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Two columns: left = print settings or group view, right = Sources + Printer details (per Figma). Scroll drives header collapse. */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 pt-4">
        <div className="flex w-[1032px] max-w-full min-w-0 gap-8 mx-auto">
          {group ? (
            <>
              {/* Left: Group settings (read-only) */}
              <div className="min-w-0 flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Group settings</h3>
                    <button
                      type="button"
                      onClick={() => onEditPrinterGroup?.(group)}
                      className="text-[14px] font-semibold text-[#101010] underline"
                    >
                      Edit printer group
                    </button>
                  </div>
                  <p className="text-[14px] leading-[22px] text-[#666]">
                    To change ticket settings, edit the {group.name} group.
                  </p>
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#666] shrink-0" />
                      <span className="text-[15px] leading-[22px] text-[#101010]">
                        {getPrintsSummaryFromSettings(group.settings)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-[#666] shrink-0" />
                      <span className="text-[15px] leading-[22px] text-[#101010]">
                        {getCategoriesShortText(group.settings.inPersonCategoryIds) || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-[#666] shrink-0" />
                      <span className="text-[15px] leading-[22px] text-[#101010]">
                        {getAppearanceSummary(group.settings.ticketAppearance)}
                      </span>
                    </div>
                  </div>
                  {onRemoveFromGroup && (
                    <button
                      type="button"
                      onClick={onRemoveFromGroup}
                      className="mt-4 w-full flex items-center justify-center min-h-[48px] px-4 py-3 rounded-full font-medium text-[15px] leading-6 bg-[#f0f0f0] text-[#bf0020]"
                    >
                      Remove printer from group
                    </button>
                  )}
                </div>
              </div>
              {/* Right: Sources (read-only) + Printer details */}
              <div className="w-[380px] shrink-0 flex flex-col gap-6">
                <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Sources</h3>
                    <button
                      type="button"
                      onClick={() => onEditPrinterGroup?.(group)}
                      className="text-[14px] font-semibold text-[#101010] underline"
                    >
                      Edit printer group
                    </button>
                  </div>
                  <p className="text-[14px] leading-[22px] text-[#666]">
                    To change order sources, edit the {group.name} group.
                  </p>
                  {draft.sources.length > 0 ? (
                    <div className="flex flex-col gap-0">
                      {draft.sources.map((source) => {
                        const Icon = deviceIcon[source.deviceType];
                        const online = source.isOnline;
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
                            <StatusPill
                              variant={online ? "connected" : "offline"}
                              label={online ? "Online" : "Offline"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[14px] leading-[22px] text-[#666]">No sources</p>
                  )}
                </div>
                <WebPrinterDetailsCard
                  draft={draft}
                  onEditPaperSize={() => setPaperSizeSheetOpen(true)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Left: print settings */}
              <div className="min-w-0 flex-1 flex flex-col gap-6">
                <WebSettingsColumn
                  draft={draft}
                  updateDraft={updateDraft}
                  onEditCategories={() => {
                    setEditCategoriesTarget("inPerson");
                    setEditCategoriesOpen(true);
                  }}
                  onEditAppearance={() => {
                    setEditAppearanceTarget("inPerson");
                    setAppearanceOpen(true);
                  }}
                  onEditOnlineCategories={() => {
                    setEditCategoriesTarget("online");
                    setEditCategoriesOpen(true);
                  }}
                  onEditOnlineAppearance={() => {
                    setEditAppearanceTarget("online");
                    setAppearanceOpen(true);
                  }}
                />
              </div>

              {/* Right: Sources + Printer details cards */}
              <div className="w-[380px] shrink-0 flex flex-col gap-6">
                <WebSourcesCard
                  draft={draft}
                  onEditSources={() => setEditSourcesOpen(true)}
                />
                <WebPrinterDetailsCard
                  draft={draft}
                  onEditPaperSize={() => setPaperSizeSheetOpen(true)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <EditAppearanceModal
        open={appearanceOpen}
        onOpenChange={(open) => {
          if (!open) setEditAppearanceTarget(null);
          setAppearanceOpen(open);
        }}
        appearance={
          editAppearanceTarget === "online"
            ? (draft.onlineTicketAppearance ?? draft.ticketAppearance)
            : draft.ticketAppearance
        }
        onSave={(appearance) => {
          if (editAppearanceTarget === "online") {
            updateDraft({ onlineTicketAppearance: appearance });
          } else {
            updateDraft({ ticketAppearance: appearance });
          }
          setAppearanceOpen(false);
          setEditAppearanceTarget(null);
        }}
      />
      <EditCategoriesModal
        open={editCategoriesOpen}
        onOpenChange={(open) => {
          if (!open) setEditCategoriesTarget(null);
          setEditCategoriesOpen(open);
        }}
        selectedIds={new Set(
          editCategoriesTarget === "online"
            ? (draft.onlineCategoryIds ?? draft.inPersonCategoryIds ?? [])
            : (draft.inPersonCategoryIds ?? [])
        )}
        onSave={(ids) => {
          if (editCategoriesTarget === "online") {
            updateDraft({ onlineCategoryIds: Array.from(ids) });
          } else {
            updateDraft({ inPersonCategoryIds: Array.from(ids) });
          }
          setEditCategoriesOpen(false);
          setEditCategoriesTarget(null);
        }}
      />
      <EditSourcesModal
        open={editSourcesOpen}
        onOpenChange={setEditSourcesOpen}
        location={draft.location ?? CURRENT_LOCATION_NAME}
        selectedIds={new Set(draft.sources.map((s) => s.id))}
        onSave={handleSaveSources}
      />
      <PaperSizeSheet
        open={paperSizeSheetOpen}
        onOpenChange={setPaperSizeSheetOpen}
        paperSize={draft.paperSize}
        onSelect={(paperSize) => updateDraft({ paperSize })}
      />
    </div>
  );
}

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

const settingsCardClass = "flex flex-col gap-4 pt-4 pb-4 px-6 rounded-2xl border border-black/10 bg-white";

function WebSettingsColumn({
  draft,
  updateDraft,
  onEditCategories,
  onEditAppearance,
  onEditOnlineCategories,
  onEditOnlineAppearance,
}: {
  draft: PrinterData;
  updateDraft: (p: Partial<PrinterData>) => void;
  onEditCategories: () => void;
  onEditAppearance: () => void;
  onEditOnlineCategories: () => void;
  onEditOnlineAppearance: () => void;
}) {
  const onlineCategories = draft.onlineCategoryIds ?? draft.inPersonCategoryIds;
  const onlineAppearance = draft.onlineTicketAppearance ?? draft.ticketAppearance;
  const onlineCopies = draft.onlineCopies ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className={settingsCardClass}>
        <SectionBlock
          title="Receipts"
          trailing={<ToggleSwitch enabled={draft.receiptsEnabled} onChange={(v) => updateDraft({ receiptsEnabled: v })} />}
        >
          {draft.receiptsEnabled && (
            <>
              <Row
                label="Print receipts automatically"
                trailing={<ToggleSwitch enabled={draft.autoPrintReceipts} onChange={(v) => updateDraft({ autoPrintReceipts: v })} />}
              />
              <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={draft.receiptCopies} onChange={(v) => updateDraft({ receiptCopies: v })} />} />
            </>
          )}
        </SectionBlock>
      </div>

      <div className={settingsCardClass}>
        <SectionBlock
          title="In-person order tickets"
          trailing={<ToggleSwitch enabled={draft.inPersonEnabled} onChange={(v) => updateDraft({ inPersonEnabled: v })} />}
        >
          {draft.inPersonEnabled && (
            <>
              {(() => {
                const categoriesSubcopy = getCategoriesSubcopy(draft.inPersonCategoryIds);
                const isSimple = categoriesSubcopy.type !== "list";
                return (
                  <Row
                    label="Categories & items"
                    largeGap={!isSimple}
                    subtitle={renderCategoriesSubcopy(categoriesSubcopy)}
                    trailing={
                      <button type="button" onClick={onEditCategories} className="text-link text-[14px] font-semibold">
                        Edit
                      </button>
                    }
                  />
                );
              })()}
              <Row
                label="Appearance"
                subtitle={getAppearanceSummary(draft.ticketAppearance)}
                trailing={
                  <button type="button" onClick={onEditAppearance} className="text-link text-[14px] font-semibold">
                    Edit
                  </button>
                }
              />
              <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
            </>
          )}
        </SectionBlock>
      </div>

      <div className={settingsCardClass}>
        <SectionBlock
          title="Online and kiosk order tickets"
          trailing={
            <ToggleSwitch
              enabled={draft.onlineEnabled}
              onChange={(v) => updateDraft(v ? { onlineEnabled: true, sameAsInPerson: true } : { onlineEnabled: false })}
            />
          }
        >
          {draft.onlineEnabled && (
            <>
              <Row
                label="Same as in-person order settings"
                trailing={
                  <button
                    type="button"
                    onClick={() => updateDraft({ sameAsInPerson: !draft.sameAsInPerson })}
                    className={cn(
                      "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center",
                      draft.sameAsInPerson ? "bg-[#101010] border-[#101010]" : "border-[#959595]"
                    )}
                  >
                    {draft.sameAsInPerson && (
                      <span className="text-white text-[12px]">✓</span>
                    )}
                  </button>
                }
              />
              {!draft.sameAsInPerson && (
                <>
                  {(() => {
                    const categoriesSubcopy = getCategoriesSubcopy(onlineCategories);
                    const isSimple = categoriesSubcopy.type !== "list";
                    return (
                      <Row
                        label="Categories & items"
                        largeGap={!isSimple}
                        subtitle={renderCategoriesSubcopy(categoriesSubcopy)}
                        trailing={
                          <button type="button" onClick={onEditOnlineCategories} className="text-link text-[14px] font-semibold">
                            Edit
                          </button>
                        }
                      />
                    );
                  })()}
                  <Row
                    label="Appearance"
                    subtitle={getAppearanceSummary(onlineAppearance)}
                    trailing={
                      <button type="button" onClick={onEditOnlineAppearance} className="text-link text-[14px] font-semibold">
                        Edit
                      </button>
                    }
                  />
                  <Row
                    label="Number of copies"
                    trailing={
                      <Stepper
                        size="Small"
                        inRow
                        value={onlineCopies}
                        onChange={(v) => updateDraft({ onlineCopies: v })}
                      />
                    }
                  />
                </>
              )}
            </>
          )}
        </SectionBlock>
      </div>

      <div className={settingsCardClass}>
        <SectionBlock
          title="Ticket stubs"
          trailing={<ToggleSwitch enabled={draft.ticketStubsEnabled} onChange={(v) => updateDraft({ ticketStubsEnabled: v })} />}
        >
          {draft.ticketStubsEnabled && (
            <Row label="Number of copies" trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />} />
          )}
        </SectionBlock>
      </div>

      <div className={settingsCardClass}>
        <SectionBlock
          title="Void tickets"
          trailing={<ToggleSwitch enabled={draft.voidTicketsEnabled} onChange={(v) => updateDraft({ voidTicketsEnabled: v })} />}
        >
          {draft.voidTicketsEnabled && (
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

function WebSourcesCard({
  draft,
  onEditSources,
}: {
  draft: PrinterData;
  onEditSources: () => void;
}) {
  const hasSources = draft.sources.length > 0;
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Sources</h3>
        <button type="button" onClick={onEditSources} className="text-link text-[14px] font-semibold">
          Edit
        </button>
      </div>
      {hasSources ? (
        <div className="flex flex-col gap-0">
          {draft.sources.map((source) => {
            const Icon = deviceIcon[source.deviceType];
            const online = source.isOnline;
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
                <StatusPill
                  variant={online ? "connected" : "offline"}
                  label={online ? "Online" : "Offline"}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-3 items-start py-2">
          <AlertCircle className="w-6 h-6 text-[#bf0020] shrink-0" />
          <span className="text-[16px] leading-6 font-medium text-[#101010]">
            No order sources connected
          </span>
        </div>
      )}
    </div>
  );
}

function WebPrinterDetailsCard({
  draft,
  onEditPaperSize,
}: {
  draft: PrinterData;
  onEditPaperSize: () => void;
}) {
  const printerStatus = computePrinterStatus(draft);
  const isNetworkConnected = printerStatus === "connected" || printerStatus === "ready";
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/10 bg-white">
      <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">Printer details</h3>
      <div className="flex flex-col gap-0 text-[16px]">
        <div className="flex items-center justify-between py-3 border-b border-black/5">
          <span className="font-medium text-[#101010]">Network</span>
          <StatusPill
            variant={isNetworkConnected ? "connected" : "offline"}
            label={isNetworkConnected ? "Connected" : "Disconnected"}
          />
        </div>
        <DetailRow label="Location" value={draft.location ?? CURRENT_LOCATION_NAME} />
        <DetailRow label="Type" value={draft.paperType === "Thermal" ? "Receipt printer" : "Impact printer"} />
        <DetailRow label="Device ID" value={draft.serialNumber} />
        <DetailRow label="Model" value={draft.model} />
        <DetailRow label="Paper level" value="89%" />
        <DetailRow label="Paper type" value={draft.paperType} />
        <div className="flex items-center justify-between py-3 border-b border-black/5">
          <span className="font-medium text-[#101010]">Paper width</span>
          <button
            type="button"
            onClick={onEditPaperSize}
            className="text-link text-[16px]"
          >
            {draft.paperSize}
          </button>
        </div>
      </div>
      <p className="text-[12px] leading-[18px] text-[#666]">
        Changing paper widths from the default may cause damage to your printer. Check printer manufacturer guidelines before you make the update.
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/5">
      <span className="font-medium text-[#101010]">{label}</span>
      <span className="text-[15px] text-[#101010]">{value}</span>
    </div>
  );
}

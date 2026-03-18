"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Pencil, Monitor, Smartphone, Tablet, Receipt, Tag, Code, MapPin, Barcode, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import {
  type PrinterData,
  type PrinterStatus,
  type DeviceType,
  type TicketAppearance,
  computePrinterStatus,
  getDevicesForLocation,
  CURRENT_LOCATION_NAME,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";
import { getCategoriesSubcopy, type CategoriesSubcopy } from "@/lib/printer-categories-copy";
import { EditAppearanceModal } from "./edit-appearance-modal";
import { EditCategoriesModal } from "./edit-categories-modal";
import { EditSourcesModal } from "./edit-sources-modal";
import { PaperSizeSheet } from "./paper-size-sheet";

export type { PrinterData };

type Tab = "details" | "ticket-settings" | "print-history";

interface PrinterDetailProps {
  printer: PrinterData;
  onBack: () => void;
  onSave: (printer: PrinterData) => void;
  onEditCategories: () => void;
  /** When set, the detail view opens on this tab (e.g. after "Done" in new printer flow). */
  initialTab?: Tab;
}

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

export function PrinterDetail({ printer, onBack, onSave, onEditCategories, initialTab }: PrinterDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? "details");
  const [draft, setDraft] = useState<PrinterData>({
    ...printer,
    sources: printer.sources.map((s) => ({ ...s })),
    ticketAppearance: { ...printer.ticketAppearance },
    inPersonCategoryIds: printer.inPersonCategoryIds ?? [],
    onlineTicketAppearance: printer.onlineTicketAppearance
      ? { ...printer.onlineTicketAppearance }
      : undefined,
    onlineCopies: printer.onlineCopies ?? 1,
  });
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false);
  const [editCategoriesTarget, setEditCategoriesTarget] = useState<"inPerson" | "online" | null>(null);
  const [editAppearanceTarget, setEditAppearanceTarget] = useState<"inPerson" | "online" | null>(null);
  const [editSourcesOpen, setEditSourcesOpen] = useState(false);
  const [paperSizeSheetOpen, setPaperSizeSheetOpen] = useState(false);

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

  /** Normalize printer to same shape as draft so optional fields don't cause false-positive changes. */
  const normalizedPrinter: PrinterData = {
    ...printer,
    sources: printer.sources.map((s) => ({ ...s })),
    ticketAppearance: { ...printer.ticketAppearance },
    inPersonCategoryIds: printer.inPersonCategoryIds ?? [],
    onlineTicketAppearance: printer.onlineTicketAppearance
      ? { ...printer.onlineTicketAppearance }
      : undefined,
    onlineCopies: printer.onlineCopies ?? 1,
  };
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(normalizedPrinter);

  const printerStatus = computePrinterStatus(draft);

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "ticket-settings", label: "Ticket settings" },
    { id: "print-history", label: "Print history" },
  ];

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const scrollParent = sentinel.closest("[class*='overflow-y-auto']") as HTMLElement | null;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCollapsed(!entry.isIntersecting),
      { root: scrollParent, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-4 max-w-[800px]">
      {/* Scroll sentinel — when this scrolls out of view, header collapses */}
      <div ref={sentinelRef} className="h-0 w-0 shrink-0" aria-hidden />

      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex flex-col bg-white pb-0 -mt-6 pt-6">
        {/* Expanded state: two rows */}
        <div
          className={cn(
            "flex flex-col gap-6 transition-all duration-200 overflow-hidden",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[200px] opacity-100"
          )}
        >
          {/* Row 1: buttons */}
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
            >
              <ArrowLeft className="w-5 h-5 text-[#101010]" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
            >
              <MoreHorizontal className="w-5 h-5 text-[#101010]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#f0f0f0] text-[#101010] rounded-full"
            >
              <span className="font-medium text-[15px] leading-6">Test print</span>
            </button>
            <button
              type="button"
              onClick={() => hasChanges && onSave(draft)}
              disabled={!hasChanges}
              className={cn(
                "flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full",
                hasChanges
                  ? "bg-[#101010] text-white"
                  : "bg-[#f0f0f0] text-[#959595] cursor-not-allowed"
              )}
            >
              <span className="font-medium text-[15px] leading-6">Save</span>
            </button>
          </div>

          {/* Row 2: name + status */}
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-[25px] leading-8 text-[#101010]">
              {draft.name}
            </h2>
            <Pencil className="w-4 h-4 text-[#999]" />
            <StatusPill variant={printerStatus} />
          </div>
        </div>

        {/* Collapsed state: single merged row — title centered in header, unaffected by side buttons */}
        <div
          className={cn(
            "relative flex items-center gap-2 w-full transition-all duration-200 overflow-hidden min-h-[60px]",
            isCollapsed ? "max-h-[60px] opacity-100 mb-4" : "max-h-0 opacity-0 min-h-0"
          )}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
          >
            <ArrowLeft className="w-5 h-5 text-[#101010]" />
          </button>
          <div className="flex-1 shrink min-w-0" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-semibold text-[17px] leading-6 text-[#101010] truncate max-w-[calc(100%-12rem)]">
              {draft.name}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#f0f0f0] text-[#101010] rounded-full shrink-0"
          >
            <span className="font-medium text-[15px] leading-6">Test print</span>
          </button>
          <button
            type="button"
            onClick={() => hasChanges && onSave(draft)}
            disabled={!hasChanges}
            className={cn(
              "flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-full shrink-0",
              hasChanges
                ? "bg-[#101010] text-white"
                : "bg-[#f0f0f0] text-[#959595] cursor-not-allowed"
            )}
          >
            <span className="font-medium text-[15px] leading-6">Save</span>
          </button>
        </div>

        {/* Critical / not-configured banner */}
        {!isCollapsed && (printerStatus === "critical" || printerStatus === "not-configured") && (
          <div className="flex gap-3 items-start min-h-[56px] p-4 rounded-[6px] bg-[#ffe5ea] border border-[#ffccd5] mb-0 mt-4">
            <AlertCircle className="w-6 h-6 text-[#bf0020] shrink-0" />
            <span className="text-[16px] leading-6 text-[#101010]">
              {printerStatus === "not-configured"
                ? "Not configured"
                : "All connected sources are offline"}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex items-center gap-4 border-b border-[#e5e5e5]", !isCollapsed && "mt-6")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-2 text-[19px] leading-6 font-semibold border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-[#101010] text-[#101010]"
                  : "border-transparent text-[#666]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "ticket-settings" && (
        <TicketSettingsTab
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
      )}
      {activeTab === "details" && (
        <DetailsTab
          draft={draft}
          onEditSources={() => setEditSourcesOpen(true)}
          onEditPaperSize={() => setPaperSizeSheetOpen(true)}
        />
      )}
      {activeTab === "print-history" && (
        <div className="flex flex-col items-center justify-center py-16 text-[15px] text-[#666]">
          No print history available.
        </div>
      )}

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

/* ------------------------------------------------------------------ */

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
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
          enabled
            ? "left-[calc(100%-18px)] bg-white"
            : "left-[3px] bg-[#959595]"
        )}
      />
    </button>
  );
}

function SettingsRow({
  label,
  subtitle,
  trailing,
  hideDivider,
  largeGap,
  centerTrailing,
}: {
  label: string;
  subtitle?: React.ReactNode;
  trailing: React.ReactNode;
  hideDivider?: boolean;
  largeGap?: boolean;
  /** When true, vertically center the trailing (e.g. for simple single-line rows like "All categories, all items"). */
  centerTrailing?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between py-4 min-h-[48px]",
        centerTrailing ? "items-center" : largeGap ? "items-start" : "items-center",
        !hideDivider && "border-b border-[#f0f0f0]"
      )}
    >
      <div className={cn("flex flex-col min-w-0 flex-1 mr-4", largeGap ? "gap-4" : "gap-0")}>
        <span className="text-[15px] leading-[22px] font-medium text-[#101010]">{label}</span>
        {subtitle != null && (
          <span className="text-[13px] leading-[18px] text-[#666]">{subtitle}</span>
        )}
      </div>
      {trailing}
    </div>
  );
}

function SectionHeader({ label, trailing }: { label: string; trailing: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-2 pb-2 mb-2">
      <h3 className="text-[19px] leading-6 font-semibold text-[#101010]">{label}</h3>
      {trailing}
    </div>
  );
}

function SectionDivider() {
  return <div className="h-2 bg-black/5 rounded-[2px] w-full shrink-0" />;
}

function DetailsSectionHeader({
  label,
  onEdit,
}: {
  label: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between min-h-[40px] py-0">
      <h3 className="text-[19px] leading-[26px] font-semibold text-[#101010] flex-1 min-w-0">
        {label}
      </h3>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-link shrink-0 py-2 px-2 text-[14px] leading-[22px]"
        >
          Edit
        </button>
      )}
    </div>
  );
}

function SourceRow({
  icon: Icon,
  primary,
  secondary,
  statusVariant,
  statusLabel,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>;
  primary: string;
  secondary: string;
  statusVariant?: "connected" | "offline";
  statusLabel?: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 items-center py-4",
        !isLast && "border-b border-black/5"
      )}
    >
      <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-black/5">
        <Icon className="w-6 h-6 text-[#101010]" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[16px] leading-6 font-medium text-[#101010]">{primary}</span>
        <span className="text-[14px] leading-[22px] text-[#666]">{secondary}</span>
      </div>
      {statusVariant && (
        <StatusPill variant={statusVariant} label={statusLabel} />
      )}
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-center shrink-0 w-[200px]">
      <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-black/5">
        <Icon className="w-6 h-6 text-[#101010]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[16px] leading-6 font-semibold text-[#101010]">{label}</span>
        <span className="text-[14px] leading-[22px] text-[#101010]">{value}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DetailsTab({
  draft,
  onEditSources,
  onEditPaperSize,
}: {
  draft: PrinterData;
  onEditSources: () => void;
  onEditPaperSize: () => void;
}) {
  const hasSources = draft.sources.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full pt-4 pb-4">
      {/* Sources */}
      <div className="flex flex-col w-full">
        <DetailsSectionHeader label="Sources" onEdit={onEditSources} />
        <div className="flex flex-col w-full mt-0">
          {hasSources ? (
            draft.sources.map((source, i) => (
              <SourceRow
                key={source.id}
                icon={deviceIcon[source.deviceType]}
                primary={source.name}
                secondary={source.deviceType}
                statusVariant={source.isOnline ? "connected" : "offline"}
                statusLabel={source.isOnline ? "Online" : "Offline"}
                isLast={i === draft.sources.length - 1}
              />
            ))
          ) : (
            <div className="flex gap-2 items-center py-2">
              <AlertCircle className="w-6 h-6 text-[#bf0020] shrink-0" />
              <span className="text-[16px] leading-6 font-medium text-[#101010]">
                No order sources connected
              </span>
            </div>
          )}
        </div>
      </div>

      <SectionDivider />

      {/* Paper size */}
      <div className="flex flex-col w-full">
        <DetailsSectionHeader label="Paper size" onEdit={onEditPaperSize} />
        <div className="flex gap-4 items-center py-4">
          <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-black/5">
            <Receipt className="w-6 h-6 text-[#101010]" />
          </div>
          <span className="text-[16px] leading-6 font-medium text-[#101010]">{draft.paperSize}</span>
        </div>
      </div>

      <SectionDivider />

      {/* Printer details */}
      <div className="flex flex-col gap-8 w-full">
        <DetailsSectionHeader label="Printer details" />
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-x-6 gap-y-6 items-start justify-between">
            <DetailCard icon={Receipt} label="Type" value="Receipt printer" />
            <DetailCard icon={Tag} label="Model" value={draft.model} />
            <DetailCard icon={Code} label="Connection" value={draft.connection} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-6 items-start justify-between">
            <DetailCard icon={Receipt} label="Paper type" value={draft.paperType} />
            <DetailCard icon={MapPin} label="IP Address" value={draft.ipAddress} />
            <DetailCard icon={Barcode} label="Serial number" value={draft.serialNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

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
            <span className="font-medium text-[13px] leading-[18px] text-[#101010]">{c.name} ({c.itemCount} items)</span>
            {c.itemSnippet && (
              <span className="text-[13px] leading-[18px] text-[#666]">{c.itemSnippet}</span>
            )}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-link text-[13px] font-medium">+{overflow} more</span>
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

function TicketSettingsTab({
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
    <div className="flex flex-col pt-4">
      {/* Receipts */}
      <SectionHeader
        label="Receipts"
        trailing={<ToggleSwitch enabled={draft.receiptsEnabled} onChange={(v) => updateDraft({ receiptsEnabled: v })} />}
      />
      {draft.receiptsEnabled && (
        <>
          <SettingsRow
            label="Print receipts automatically"
            trailing={<ToggleSwitch enabled={draft.autoPrintReceipts} onChange={(v) => updateDraft({ autoPrintReceipts: v })} />}
          />
          <SettingsRow
            label="Number of copies"
            trailing={<Stepper size="Small" inRow value={draft.receiptCopies} onChange={(v) => updateDraft({ receiptCopies: v })} />}
            hideDivider
          />
        </>
      )}

      {/* Divider */}
      <div className="my-4 h-2 rounded-[2px] bg-black/5" />

      {/* In-person orders */}
      <SectionHeader
        label="In-person orders"
        trailing={<ToggleSwitch enabled={draft.inPersonEnabled} onChange={(v) => updateDraft({ inPersonEnabled: v })} />}
      />
      {draft.inPersonEnabled && (
        <>
          {(() => {
            const categoriesSubcopy = getCategoriesSubcopy(draft.inPersonCategoryIds);
            const isSimple = categoriesSubcopy.type !== "list";
            return (
              <SettingsRow
                label="Categories & items"
                largeGap={!isSimple}
                centerTrailing={isSimple}
                subtitle={renderCategoriesSubcopy(categoriesSubcopy)}
                trailing={
                  <button type="button" onClick={onEditCategories} className="text-link text-[15px]">
                    Edit
                  </button>
                }
              />
            );
          })()}
          <SettingsRow
            label="Appearance"
            subtitle={getAppearanceSummary(draft.ticketAppearance)}
            centerTrailing
            trailing={
              <button type="button" onClick={onEditAppearance} className="text-link text-[15px]">
                Edit
              </button>
            }
          />
          <SettingsRow
            label="Number of copies"
            trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />}
            hideDivider
          />
        </>
      )}

      {/* Divider */}
      <div className="my-4 h-2 rounded-[2px] bg-black/5" />

      {/* Online and kiosk orders */}
      <SectionHeader
        label="Online and kiosk orders"
        trailing={
          <ToggleSwitch
            enabled={draft.onlineEnabled}
            onChange={(v) => updateDraft(v ? { onlineEnabled: true, sameAsInPerson: true } : { onlineEnabled: false })}
          />
        }
      />
      {draft.onlineEnabled && (
        <>
          <SettingsRow
            label="Same as in-person order settings"
            hideDivider={draft.sameAsInPerson}
            trailing={
              <button
                type="button"
                onClick={() => updateDraft({ sameAsInPerson: !draft.sameAsInPerson })}
                className={cn(
                  "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center",
                  draft.sameAsInPerson ? "bg-[#101010] border-[#101010]" : "border-[#959595]"
                )}
              >
                {draft.sameAsInPerson && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
            }
          />
          {!draft.sameAsInPerson && (
            <>
              {(() => {
                const categoriesSubcopy = getCategoriesSubcopy(onlineCategories);
                const isSimple = categoriesSubcopy.type !== "list";
                return (
                  <SettingsRow
                    label="Categories & items"
                    largeGap={!isSimple}
                    centerTrailing={isSimple}
                    subtitle={renderCategoriesSubcopy(categoriesSubcopy)}
                    trailing={
                      <button type="button" onClick={onEditOnlineCategories} className="text-link text-[15px]">
                        Edit
                      </button>
                    }
                  />
                );
              })()}
              <SettingsRow
                label="Appearance"
                subtitle={getAppearanceSummary(onlineAppearance)}
                centerTrailing
                trailing={
                  <button type="button" onClick={onEditOnlineAppearance} className="text-link text-[15px]">
                    Edit
                  </button>
                }
              />
              <SettingsRow
                label="Number of copies"
                trailing={
                  <Stepper
                    size="Small"
                    inRow
                    value={onlineCopies}
                    onChange={(v) => updateDraft({ onlineCopies: v })}
                  />
                }
                hideDivider
              />
            </>
          )}
        </>
      )}

      {/* Divider */}
      <div className="my-4 h-2 rounded-[2px] bg-black/5" />

      {/* Ticket stubs */}
      <SectionHeader
        label="Ticket stubs"
        trailing={<ToggleSwitch enabled={draft.ticketStubsEnabled} onChange={(v) => updateDraft({ ticketStubsEnabled: v })} />}
      />
      {draft.ticketStubsEnabled && (
        <SettingsRow
          label="Number of copies"
          trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />}
          hideDivider
        />
      )}

      {/* Divider */}
      <div className="my-4 h-2 rounded-[2px] bg-black/5" />

      {/* Void tickets */}
      <SectionHeader
        label="Void tickets"
        trailing={<ToggleSwitch enabled={draft.voidTicketsEnabled} onChange={(v) => updateDraft({ voidTicketsEnabled: v })} />}
      />
      {draft.voidTicketsEnabled && (
        <>
          <p className="text-[14px] leading-[22px] text-[#666] pb-2">
            Print void tickets for in-person, kiosk and online orders.
          </p>
          <SettingsRow
            label="Number of copies"
            trailing={<Stepper size="Small" inRow value={1} onChange={() => {}} />}
            hideDivider
          />
        </>
      )}
    </div>
  );
}

function Check(props: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Check, ChevronDown, ChevronUp, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type PrinterData,
  type PrinterGroup,
  computePrinterStatus,
  getPrintsSummary,
  getPrintsSummaryFromSettings,
  getWorstStatus,
  getUniqueLocationCount,
  getGroupForPrinter,
  statusConfig,
  initialPrinters,
  initialGroups,
  defaultTicketAppearance,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";
import { PrinterDetailWeb } from "./printer-detail-web";
import { NewPrinterModal } from "./new-printer-modal";
import { CreateGroupModal } from "./create-group-modal";
import { CreateGroupPage } from "./create-group-page";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const deviceChildren = [
  { id: "all-devices", label: "All devices" },
  { id: "printers", label: "Printers" },
  { id: "barcode-scanners", label: "Barcode scanners" },
  { id: "kitchen-displays", label: "Kitchen displays" },
  { id: "kiosks", label: "Kiosks" },
  { id: "tablets", label: "Tablets" },
] as const;

const webSidebarItems = [
  { id: "devices", label: "Devices", children: deviceChildren },
  { id: "profiles", label: "Profiles" },
  { id: "floor-plans", label: "Floor plans" },
  { id: "sections", label: "Sections" },
  { id: "service-settings", label: "Service settings" },
];

function getSectionLabel(sectionId: string): string {
  const child = deviceChildren.find((c) => c.id === sectionId);
  if (child) return child.label;
  const top = webSidebarItems.find((i) => i.id === sectionId);
  return top?.label ?? sectionId;
}

function getStatusLabel(printer: PrinterData): string {
  return statusConfig[computePrinterStatus(printer)].label;
}

function getDeviceType(printer: PrinterData): string {
  return printer.model;
}

function uniqueValues(printers: PrinterData[], accessor: (p: PrinterData) => string): string[] {
  return Array.from(new Set(printers.map(accessor))).sort();
}

export function PrinterSettingsWebScreen() {
  const [printers, setPrinters] = useState<PrinterData[]>(initialPrinters);
  const [groups, setGroups] = useState<PrinterGroup[]>(initialGroups);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [newPrinterOpen, setNewPrinterOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupPageOpen, setCreateGroupPageOpen] = useState(false);
  const [createGroupPayload, setCreateGroupPayload] = useState<{
    selectedPrinterIds: string[];
    templatePrinterId: string | null;
  } | null>(null);
  const [devicesExpanded, setDevicesExpanded] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("printers");

  const allStatuses = useMemo(() => uniqueValues(printers, getStatusLabel), [printers]);
  const allLocations = useMemo(() => uniqueValues(printers, (p) => p.location ?? "—"), [printers]);
  const allDeviceTypes = useMemo(() => uniqueValues(printers, getDeviceType), [printers]);

  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(() => new Set(allStatuses));
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(() => new Set(allLocations));
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<string>>(() => new Set(allDeviceTypes));

  const filteredPrinters = useMemo(
    () =>
      printers.filter((p) => {
        if (!selectedStatuses.has(getStatusLabel(p))) return false;
        if (!selectedLocations.has(p.location ?? "—")) return false;
        if (!selectedDeviceTypes.has(getDeviceType(p))) return false;
        return true;
      }),
    [printers, selectedStatuses, selectedLocations, selectedDeviceTypes]
  );

  const selectedPrinter = printers.find((p) => p.id === selectedPrinterId) ?? null;

  const handleRowClick = useCallback((printer: PrinterData) => {
    setSelectedPrinterId(printer.id);
    setEditSheetOpen(true);
  }, []);

  const handleCloseEditSheet = useCallback(() => {
    setEditSheetOpen(false);
    setSelectedPrinterId(null);
  }, []);

  const handleSavePrinter = useCallback((updated: PrinterData) => {
    setPrinters((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditSheetOpen(false);
    setSelectedPrinterId(null);
  }, []);

  const handleNewPrinterDone = useCallback(
    (printerName: string, mode: string) => {
      const newPrinter: PrinterData = {
        id: `printer-${Date.now()}`,
        name: printerName || "New Printer",
        model: "Star Micronics TSP143IIIU",
        connection: "USB",
        ipAddress: "—",
        serialNumber: `NEW${Date.now()}`,
        paperSize: "80mm wide",
        paperType: "Thermal",
        sources: [],
        receiptsEnabled: mode !== "custom",
        autoPrintReceipts: false,
        receiptCopies: 1,
        inPersonEnabled: mode === "custom",
        inPersonCategories: "",
        onlineEnabled: false,
        sameAsInPerson: false,
        ticketAppearance: { ...defaultTicketAppearance },
        ticketStubsEnabled: false,
        voidTicketsEnabled: false,
      };
      setPrinters((prev) => [...prev, newPrinter]);
    },
    []
  );

  const handleCreateGroupComplete = useCallback(
    (result: { selectedPrinterIds: string[]; templatePrinterId: string | null }) => {
      setCreateGroupOpen(false);
      setCreateGroupPayload({
        selectedPrinterIds: result.selectedPrinterIds,
        templatePrinterId: result.templatePrinterId,
      });
      setCreateGroupPageOpen(true);
    },
    []
  );

  const handleCreateGroupSave = useCallback(
    (group: PrinterGroup, updatedPrinters: PrinterData[]) => {
      setGroups((prev) => [...prev, group]);
      setPrinters(updatedPrinters);
      setCreateGroupPageOpen(false);
      setCreateGroupPayload(null);
    },
    []
  );

  const handleCreateGroupPageBack = useCallback(() => {
    setCreateGroupPageOpen(false);
    setCreateGroupPayload(null);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <div className="flex flex-1 min-h-0">
        <aside className="flex flex-col h-full w-[300px] shrink-0 overflow-y-auto border-r border-black/5 bg-[#fafafa] pt-7 px-4 pb-6">
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search — matches Figma Navigation V1 */}
            <div className="flex items-center gap-3 h-10 min-h-10 px-3 py-2 rounded-[26px] bg-black/5 shrink-0">
              <Search className="w-6 h-6 text-[#666] shrink-0" />
              <span className="text-[14px] leading-[22px] text-[#666]">Search</span>
            </div>

            {/* Nav section — Side menu pattern from Figma */}
            <nav className="flex flex-col py-4 rounded-xl w-full">
              {webSidebarItems.map((item) => {
                const hasChildren = "children" in item && item.children;
                const isDevices = item.id === "devices";
                const isExpanded = isDevices && devicesExpanded;

                if (hasChildren && item.children) {
                  return (
                    <div key={item.id} className="flex flex-col w-full">
                      <button
                        type="button"
                        onClick={() => isDevices && setDevicesExpanded((e) => !e)}
                        className="flex items-center gap-2 min-h-[48px] py-3 w-full text-left px-2 rounded-md font-semibold text-[14px] leading-[22px] text-[#101010] bg-transparent"
                      >
                        <span className="flex-1 min-w-0 font-medium">{item.label}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 shrink-0 text-[#101010]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0 text-[#101010]" />
                        )}
                      </button>
                      {isExpanded &&
                        item.children.map((child) => {
                          const isChildActive = selectedSectionId === child.id;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setSelectedSectionId(child.id)}
                              className={cn(
                                "flex items-center gap-2 min-h-[48px] py-3 w-full text-left pl-8 pr-2 rounded-md font-semibold text-[14px] leading-[22px] text-[#101010]",
                                isChildActive ? "bg-[#e8e8e8]" : "bg-transparent"
                              )}
                            >
                              <span className="flex-1 min-w-0 font-medium">{child.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  );
                }

                const isActive = selectedSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSectionId(item.id)}
                    className={cn(
                      "flex items-center gap-2 min-h-[48px] py-3 w-full text-left px-2 rounded-md font-semibold text-[14px] leading-[22px] text-[#101010]",
                      isActive ? "bg-[#e8e8e8]" : "bg-transparent"
                    )}
                  >
                    <span className="flex-1 min-w-0 font-medium">{item.label}</span>
                    <ChevronDown className="w-4 h-4 shrink-0 text-[#101010]" />
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedSectionId === "printers" ? (
            <>
              <div className="flex flex-col gap-4 pt-6 px-6 pb-6">
                <div className="flex items-center justify-between min-h-10">
                  <h2 className="font-semibold text-[25px] leading-8 text-[#101010]">
                    Printers
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCreateGroupOpen(true)}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#101010] text-white rounded-full font-medium text-[15px] leading-6"
                  >
                    Create group
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-3 min-h-10 px-2 py-2 border border-black/15 rounded-[6px] min-w-[200px]">
                    <Search className="w-6 h-6 text-[#666] shrink-0" />
                    <span className="text-[14px] leading-[22px] text-[#666]">
                      Search printers
                    </span>
                  </div>
                  <FilterPopover
                    label="Status"
                    allValues={allStatuses}
                    selected={selectedStatuses}
                    onSelectedChange={setSelectedStatuses}
                  />
                  <FilterPopover
                    label="Location"
                    allValues={allLocations}
                    selected={selectedLocations}
                    onSelectedChange={setSelectedLocations}
                  />
                  <FilterPopover
                    label="Device type"
                    allValues={allDeviceTypes}
                    selected={selectedDeviceTypes}
                    onSelectedChange={setSelectedDeviceTypes}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6">
                <WebPrintersTable
                  printers={filteredPrinters}
                  groups={groups}
                  onRowClick={handleRowClick}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto px-6 pt-6">
              <h2 className="font-semibold text-[25px] leading-8 text-[#101010]">
                {getSectionLabel(selectedSectionId)}
              </h2>
              <p className="text-[15px] leading-6 text-[#666] mt-2">
                This section is not implemented yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-full max-h-full rounded-none border-0 p-0 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            {selectedPrinter && (
              <PrinterDetailWeb
                printer={selectedPrinter}
                group={getGroupForPrinter(selectedPrinter.id, groups)}
                onBack={handleCloseEditSheet}
                onSave={handleSavePrinter}
                onEditCategories={() => {}}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <NewPrinterModal
        open={newPrinterOpen}
        onOpenChange={setNewPrinterOpen}
        onDone={handleNewPrinterDone}
      />

      <CreateGroupModal
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        printers={printers}
        onComplete={handleCreateGroupComplete}
      />

      <Sheet open={createGroupPageOpen} onOpenChange={setCreateGroupPageOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-full max-h-full rounded-none border-0 p-0 overflow-hidden flex flex-col"
        >
          {createGroupPayload && (
            <CreateGroupPage
              selectedPrinterIds={createGroupPayload.selectedPrinterIds}
              templatePrinterId={createGroupPayload.templatePrinterId}
              printers={printers}
              onSave={handleCreateGroupSave}
              onBack={handleCreateGroupPageBack}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter popover                                                     */
/* ------------------------------------------------------------------ */

function FilterPopover({
  label,
  allValues,
  selected,
  onSelectedChange,
}: {
  label: string;
  allValues: string[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = allValues.length > 0 && allValues.every((v) => selected.has(v));

  const toggleValue = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onSelectedChange(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      onSelectedChange(new Set());
    } else {
      onSelectedChange(new Set(allValues));
    }
  };

  const chipLabel = allSelected
    ? "All"
    : selected.size === 0
      ? "None"
      : selected.size === 1
        ? Array.from(selected)[0]
        : `${selected.size} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 min-h-10 px-3 py-2 border rounded-[6px] font-normal text-[14px] leading-[22px] text-[#666]",
            !allSelected ? "border-[#101010]" : "border-black/15"
          )}
        >
          <span>{label}</span>
          <span className="font-semibold text-[#101010]">{chipLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[280px] p-0 rounded-2xl border border-black/10 shadow-lg"
      >
        <div className="flex flex-col">
          {/* Select all */}
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center justify-between px-4 py-3.5 border-b border-black/5"
          >
            <span className="text-[15px] font-medium text-[#101010]">Select all</span>
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-[#666]">{allValues.length}</span>
              <FilterCheckbox checked={allSelected} />
            </div>
          </button>

          {/* Individual values */}
          {allValues.map((value) => {
            const checked = selected.has(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleValue(value)}
                className="flex items-center justify-between px-4 py-3.5 border-b border-black/5 last:border-b-0"
              >
                <span className="text-[15px] font-medium text-[#101010]">{value}</span>
                <FilterCheckbox checked={checked} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors",
        checked
          ? "bg-[#101010] border-[#101010]"
          : "bg-white border-[#959595]"
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </div>
  );
}

function WebPrintersTable({
  printers,
  groups,
  onRowClick,
}: {
  printers: PrinterData[];
  groups: PrinterGroup[];
  onRowClick: (p: PrinterData) => void;
}) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const ungroupedPrinters = useMemo(
    () =>
      printers.filter(
        (p) => !p.groupId || !groups.some((g) => g.id === p.groupId)
      ),
    [printers, groups]
  );

  const groupToPrinters = useMemo(() => {
    const map = new Map<string, PrinterData[]>();
    for (const g of groups) {
      map.set(
        g.id,
        printers.filter((p) => p.groupId === g.id)
      );
    }
    return map;
  }, [groups, printers]);

  const allChecked =
    printers.length > 0 && printers.every((p) => checkedIds.has(p.id));
  const someChecked = printers.some((p) => checkedIds.has(p.id));

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(printers.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const gridCols = "24px 1fr 1fr 1fr 1fr 1fr";

  const renderPrinterRow = (printer: PrinterData, indented?: boolean) => {
    const printerStatus = computePrinterStatus(printer);
    const location = printer.location ?? "—";
    const checked = checkedIds.has(printer.id);
    return (
      <button
        key={printer.id}
        type="button"
        onClick={() => onRowClick(printer)}
        className="grid pr-2 py-4 border-b border-[#f0f0f0] w-full text-left gap-4 items-center"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleOne(printer.id)}
            className="size-5 rounded border-2 border-[rgba(0,0,0,0.42)]"
          />
        </div>
        <div
          className={cn(
            "min-w-0 flex items-center gap-3 text-left",
            indented && "pl-6"
          )}
        >
          <img
            src="/printer-image.png"
            alt=""
            className="w-5 h-5 object-contain shrink-0"
            aria-hidden
          />
          <p className="text-[15px] font-medium leading-[22px] text-[#101010] truncate min-w-0">
            {printer.name}
          </p>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[13px] leading-[18px] text-[#666] truncate">
            {location}
          </p>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[13px] leading-[18px] text-[#666] truncate">
            {getPrintsSummary(printer)}
          </p>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[13px] leading-[18px] text-[#666] truncate">
            {printer.inPersonCategories || "—"}
          </p>
        </div>
        <div className="min-w-0 flex items-center justify-start">
          <StatusPill variant={printerStatus} />
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className="grid min-h-12 pr-2 py-3 border-b border-[#959595] w-full gap-4 items-center"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={toggleAll}
            className="size-5 rounded border-2 border-[rgba(0,0,0,0.42)]"
          />
        </div>
        <div className="min-w-0 flex items-center gap-1 text-left">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            Name
          </span>
          <ChevronDown className="w-4 h-4 text-[#666] shrink-0" aria-hidden />
        </div>
        <div className="min-w-0 flex items-center gap-1 text-left">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            Locations
          </span>
          <ChevronDown className="w-4 h-4 text-[#666] shrink-0" aria-hidden />
        </div>
        <div className="min-w-0 text-left">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            Prints
          </span>
        </div>
        <div className="min-w-0 text-left">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            Categories
          </span>
        </div>
        <div className="min-w-0 flex items-center gap-1 text-left">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            Status
          </span>
          <ChevronDown className="w-4 h-4 text-[#666] shrink-0" aria-hidden />
        </div>
      </div>

      {groups.map((group) => {
        const groupPrinters = groupToPrinters.get(group.id) ?? [];
        const isExpanded = expandedGroupIds.has(group.id);
        const locationCount = getUniqueLocationCount(groupPrinters);
        const worstStatus = getWorstStatus(groupPrinters);
        const printsSummary = getPrintsSummaryFromSettings(group.settings);

        return (
          <div key={group.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleGroupExpanded(group.id)}
              className="grid pr-2 py-4 border-b border-[#f0f0f0] w-full text-left hover:bg-black/[0.02] gap-4 items-center"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="flex items-center justify-center">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#666]" aria-hidden />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#666]" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex items-center gap-3">
                <Network className="w-5 h-5 text-[#666] shrink-0" aria-hidden />
                <p className="text-[15px] font-medium leading-[22px] text-[#101010] truncate min-w-0">
                  {group.name} ({groupPrinters.length})
                </p>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[13px] leading-[18px] text-[#666] truncate">
                  {locationCount} location{locationCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[13px] leading-[18px] text-[#666] truncate">
                  {printsSummary}
                </p>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[13px] leading-[18px] text-[#666] truncate">
                  {group.settings.inPersonCategories || "—"}
                </p>
              </div>
              <div className="min-w-0 flex items-center justify-start">
                <StatusPill variant={worstStatus} />
              </div>
            </button>
            {isExpanded &&
              groupPrinters.map((printer) => renderPrinterRow(printer, true))}
          </div>
        );
      })}

      {ungroupedPrinters.map((printer) => renderPrinterRow(printer))}
    </div>
  );
}

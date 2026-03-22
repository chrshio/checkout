"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  getDevicesForLocation,
  statusConfig,
  defaultTicketAppearance,
  CURRENT_LOCATION_NAME,
  formatLastUpdated,
} from "@/lib/printer-data";
import { getCategoriesShortText } from "@/lib/printer-categories-copy";
import { usePrinterRouting } from "./printer-routing-context";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

/** Business locations for quick-add printer in this prototype. */
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
  const { printers, setPrinters, groups, setGroups } = usePrinterRouting();
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [newPrinterOpen, setNewPrinterOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createGroupPageOpen, setCreateGroupPageOpen] = useState(false);
  const [createGroupPayload, setCreateGroupPayload] = useState<{
    selectedPrinterIds: string[];
    templatePrinterId: string | null;
  } | null>(null);
  const [editGroup, setEditGroup] = useState<PrinterGroup | null>(null);
  const [pendingAddToGroup, setPendingAddToGroup] = useState<{
    printer: PrinterData;
    group: PrinterGroup;
  } | null>(null);
  const [devicesExpanded, setDevicesExpanded] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("printers");
  const [checkedPrinterIds, setCheckedPrinterIds] = useState<Set<string>>(new Set());

  const allStatuses = useMemo(() => uniqueValues(printers, getStatusLabel), [printers]);
  const allLocations = useMemo(() => uniqueValues(printers, (p) => p.location ?? CURRENT_LOCATION_NAME), [printers]);
  const allDeviceTypes = useMemo(() => uniqueValues(printers, getDeviceType), [printers]);

  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(() => new Set(allStatuses));
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(() => new Set(allLocations));
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<string>>(() => new Set(allDeviceTypes));

  // When printers are added (e.g. via Quick add), include new status/location/device-type values in the
  // selected filters so the new printers show in the list without requiring a navigation away and back.
  useEffect(() => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const v of allStatuses) if (!next.has(v)) { next.add(v); changed = true; }
      return changed ? next : prev;
    });
    setSelectedLocations((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const v of allLocations) if (!next.has(v)) { next.add(v); changed = true; }
      return changed ? next : prev;
    });
    setSelectedDeviceTypes((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const v of allDeviceTypes) if (!next.has(v)) { next.add(v); changed = true; }
      return changed ? next : prev;
    });
  }, [allStatuses, allLocations, allDeviceTypes]);

  const filteredPrinters = useMemo(
    () =>
      printers.filter((p) => {
        if (!selectedStatuses.has(getStatusLabel(p))) return false;
        if (!selectedLocations.has(p.location ?? CURRENT_LOCATION_NAME)) return false;
        if (!selectedDeviceTypes.has(getDeviceType(p))) return false;
        return true;
      }),
    [printers, selectedStatuses, selectedLocations, selectedDeviceTypes]
  );

  /** Only printers not in any group can be added to a new group. */
  const ungroupedPrintersForNewGroup = useMemo(
    () =>
      printers.filter(
        (p) => !p.groupId || !groups.some((g) => g.id === p.groupId)
      ),
    [printers, groups]
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
    const withLastUpdated = { ...updated, lastUpdated: formatLastUpdated() };
    setPrinters((prev) => prev.map((p) => (p.id === withLastUpdated.id ? withLastUpdated : p)));
    setEditSheetOpen(false);
    setSelectedPrinterId(null);
  }, []);

  const handleNewPrinterDone = useCallback(
    (printerName: string, mode: string, defaultProfile?: "receipts" | "kitchen" | "both") => {
      const isCustom = mode === "custom";
      const profile = defaultProfile ?? "receipts";
      const receipts =
        isCustom ? false : profile === "receipts" || profile === "both";
      const inPerson =
        isCustom ? true : profile === "kitchen" || profile === "both";
      const online =
        isCustom ? false : profile === "kitchen" || profile === "both";
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
        receiptsEnabled: receipts,
        autoPrintReceipts: false,
        receiptCopies: 1,
        inPersonEnabled: inPerson,
        inPersonCategories: "",
        onlineEnabled: online,
        sameAsInPerson: online,
        ticketAppearance: { ...defaultTicketAppearance },
        ticketStubsEnabled: false,
        voidTicketsEnabled: false,
        location: CURRENT_LOCATION_NAME,
        lastUpdated: formatLastUpdated(),
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

  const handleEditGroupSave = useCallback(
    (group: PrinterGroup, updatedPrinters: PrinterData[]) => {
      setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
      setPrinters(updatedPrinters);
      setEditGroup(null);
    },
    []
  );

  const handleEditGroupBack = useCallback(() => {
    setEditGroup(null);
  }, []);

  const handleRemovePrinterFromGroup = useCallback(() => {
    if (!selectedPrinter?.groupId) return;
    const group = groups.find((g) => g.id === selectedPrinter.groupId);
    if (!group) return;
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === selectedPrinter.id ? { ...p, groupId: undefined } : p
      )
    );
    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? { ...g, printerIds: g.printerIds.filter((id) => id !== selectedPrinter.id) }
          : g
      )
    );
  }, [selectedPrinter, groups, setPrinters, setGroups]);

  const handleAddPrinterToGroup = useCallback(
    (printer: PrinterData, group: PrinterGroup) => {
      if (group.printerIds.includes(printer.id)) return;
      const differences = getPrinterGroupSettingsDifferences(printer, group);
      if (differences.length > 0) {
        setPendingAddToGroup({ printer, group });
        return;
      }
      applyPrinterToGroup(printer, group);
    },
    []
  );

  const applyPrinterToGroup = useCallback(
    (printer: PrinterData, group: PrinterGroup) => {
      const location = printer.location?.trim() || CURRENT_LOCATION_NAME;
      const sources =
        group.selectAllSources === true
          ? getDevicesForLocation(location)
          : printer.sources;
      const updatedPrinter: PrinterData = {
        ...printer,
        groupId: group.id,
        ...group.settings,
        sources,
      };
      setPrinters((prev) =>
        prev.map((p) => (p.id === printer.id ? updatedPrinter : p))
      );
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === group.id) {
            return g.printerIds.includes(printer.id)
              ? g
              : { ...g, printerIds: [...g.printerIds, printer.id] };
          }
          if (g.printerIds.includes(printer.id)) {
            return { ...g, printerIds: g.printerIds.filter((id) => id !== printer.id) };
          }
          return g;
        })
      );
      setPendingAddToGroup(null);
    },
    [setPrinters, setGroups]
  );

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
                    disabled={printers.length === 0}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 bg-[#101010] text-white disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Create group
                  </button>
                </div>

                {printers.length > 0 && (
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
                )}
              </div>

              {printers.length === 0 && groups.length === 0 ? (
                <div className="flex-1 flex items-start justify-start px-0 mx-6">
                  <div className="w-full rounded-2xl border border-black/10 bg-white p-10 flex flex-col items-center justify-center text-center shadow-none">
                    <p className="text-[17px] font-semibold text-[#101010]">No printers connected.</p>
                    <p className="text-[15px] leading-6 text-[#666] mt-2">
                      Expecting a printer to be connected?{" "}
                      <a href="#" className="text-link">
                        Troubleshoot
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto px-6">
                  <WebPrintersTable
                    printers={filteredPrinters}
                    groups={groups}
                    onRowClick={handleRowClick}
                    onGroupClick={(group) => setEditGroup(group)}
                    onAddPrinterToGroup={handleAddPrinterToGroup}
                    checkedIds={checkedPrinterIds}
                    onCheckedIdsChange={setCheckedPrinterIds}
                  />
                </div>
              )}
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
                onEditPrinterGroup={(group) => setEditGroup(group)}
                onRemoveFromGroup={handleRemovePrinterFromGroup}
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
        printers={ungroupedPrintersForNewGroup}
        onComplete={handleCreateGroupComplete}
        initialSelectedIds={Array.from(checkedPrinterIds).filter((id) =>
          ungroupedPrintersForNewGroup.some((p) => p.id === id)
        )}
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

      <Sheet open={editGroup != null} onOpenChange={(open) => !open && setEditGroup(null)}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-full max-h-full rounded-none border-0 p-0 overflow-hidden flex flex-col"
        >
          {editGroup && (
            <CreateGroupPage
              existingGroup={editGroup}
              selectedPrinterIds={editGroup.printerIds}
              templatePrinterId={null}
              printers={printers}
              onSave={handleEditGroupSave}
              onBack={handleEditGroupBack}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingAddToGroup != null}
        onOpenChange={(open) => !open && setPendingAddToGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply group settings to this printer?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <p>
                  Adding <strong>{pendingAddToGroup?.printer.name}</strong> to{" "}
                  <strong>{pendingAddToGroup?.group.name}</strong> will apply the group's settings to this printer. The printer's location will be included in the group's sources.
                </p>
                <p className="text-[14px] font-medium text-[#101010]">The following will change:</p>
                <ul className="list-disc list-inside text-[14px] leading-[22px] text-[#666]">
                  {pendingAddToGroup &&
                    getPrinterGroupSettingsDifferences(
                      pendingAddToGroup.printer,
                      pendingAddToGroup.group
                    ).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                </ul>
                <p>Do you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAddToGroup) {
                  applyPrinterToGroup(pendingAddToGroup.printer, pendingAddToGroup.group);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

/** Returns human-readable labels for settings that differ between printer and group (for confirmation when adding printer to group). */
function getPrinterGroupSettingsDifferences(
  printer: PrinterData,
  group: PrinterGroup
): string[] {
  const s = group.settings;
  const diffs: string[] = [];

  if (
    printer.receiptsEnabled !== s.receiptsEnabled ||
    printer.autoPrintReceipts !== s.autoPrintReceipts ||
    printer.receiptCopies !== s.receiptCopies
  ) {
    diffs.push("Receipts");
  }
  if (printer.inPersonEnabled !== s.inPersonEnabled) {
    diffs.push("In-person order tickets");
  }
  const printerCatIds = new Set(printer.inPersonCategoryIds ?? []);
  const groupCatIds = new Set(s.inPersonCategoryIds ?? []);
  if (
    printerCatIds.size !== groupCatIds.size ||
    [...printerCatIds].some((id) => !groupCatIds.has(id))
  ) {
    diffs.push("Categories & items");
  }
  if (
    printer.ticketAppearance.compactTicket !== s.ticketAppearance.compactTicket ||
    printer.ticketAppearance.singleItemPerTicket !== s.ticketAppearance.singleItemPerTicket ||
    printer.ticketAppearance.combineIdenticalItems !== s.ticketAppearance.combineIdenticalItems ||
    printer.ticketAppearance.includeTopPadding !== s.ticketAppearance.includeTopPadding ||
    printer.ticketAppearance.printKitchenNames !== s.ticketAppearance.printKitchenNames
  ) {
    diffs.push("Ticket appearance");
  }
  if (
    printer.onlineEnabled !== s.onlineEnabled ||
    printer.sameAsInPerson !== s.sameAsInPerson
  ) {
    diffs.push("Online and kiosk order tickets");
  }
  if (printer.ticketStubsEnabled !== s.ticketStubsEnabled) {
    diffs.push("Ticket stubs");
  }
  if (printer.voidTicketsEnabled !== s.voidTicketsEnabled) {
    diffs.push("Void tickets");
  }
  return diffs;
}

type SortColumn = "name" | "location" | "prints" | "categories" | "status";
type SortDir = "asc" | "desc";

const STATUS_SORT_ORDER: Record<string, number> = {
  connected: 0,
  ready: 1,
  "not-configured": 2,
  critical: 3,
};

function sortPrinters(
  list: PrinterData[],
  sortBy: SortColumn,
  sortDir: SortDir
): PrinterData[] {
  const mult = sortDir === "asc" ? 1 : -1;
  const location = (p: PrinterData) => p.location ?? CURRENT_LOCATION_NAME;
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        break;
      case "location":
        cmp = location(a).localeCompare(location(b), undefined, { sensitivity: "base" });
        break;
      case "prints":
        cmp = getPrintsSummary(a).localeCompare(getPrintsSummary(b), undefined, { sensitivity: "base" });
        break;
      case "categories": {
        const catA = getCategoriesShortText(a.inPersonCategoryIds) || a.inPersonCategories || "—";
        const catB = getCategoriesShortText(b.inPersonCategoryIds) || b.inPersonCategories || "—";
        cmp = catA.localeCompare(catB, undefined, { sensitivity: "base" });
        break;
      }
      case "status": {
        const statusA = STATUS_SORT_ORDER[computePrinterStatus(a)] ?? 4;
        const statusB = STATUS_SORT_ORDER[computePrinterStatus(b)] ?? 4;
        cmp = statusA - statusB;
        break;
      }
      default:
        return 0;
    }
    return cmp * mult;
  });
}

const DRAG_TYPE_PRINTER_ID = "application/x-printer-id";

function WebPrintersTable({
  printers,
  groups,
  onRowClick,
  onGroupClick,
  onAddPrinterToGroup,
  checkedIds,
  onCheckedIdsChange,
}: {
  printers: PrinterData[];
  groups: PrinterGroup[];
  onRowClick: (p: PrinterData) => void;
  onGroupClick?: (group: PrinterGroup) => void;
  onAddPrinterToGroup?: (printer: PrinterData, group: PrinterGroup) => void;
  checkedIds: Set<string>;
  onCheckedIdsChange: (next: Set<string>) => void;
}) {
  const setCheckedIds = onCheckedIdsChange;
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

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

  const sortedUngrouped = useMemo(
    () => (sortBy ? sortPrinters(ungroupedPrinters, sortBy, sortDir) : ungroupedPrinters),
    [ungroupedPrinters, sortBy, sortDir]
  );

  const sortedGroupToPrinters = useMemo(() => {
    if (!sortBy) return groupToPrinters;
    const next = new Map<string, PrinterData[]>();
    groupToPrinters.forEach((list, id) => {
      next.set(id, sortPrinters(list, sortBy, sortDir));
    });
    return next;
  }, [groupToPrinters, sortBy, sortDir]);

  /** When sorting by name, also sort the order of groups by group name. */
  const sortedGroups = useMemo(() => {
    if (sortBy !== "name") return groups;
    const mult = sortDir === "asc" ? 1 : -1;
    return [...groups].sort((a, b) => mult * (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }, [groups, sortBy, sortDir]);

  const handleSort = (column: SortColumn) => {
    const isSameColumn = sortBy === column;
    const nextDir: SortDir = isSameColumn && sortDir === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortDir(nextDir);
  };

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

  const gridCols = "24px 1fr minmax(0, 0.65fr) minmax(0, 1.15fr) minmax(0, 1.4fr) minmax(0, 0.55fr)";

  const handlePrinterDragStart = (e: React.DragEvent, printer: PrinterData) => {
    e.dataTransfer.setData(DRAG_TYPE_PRINTER_ID, printer.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverGroupId(groupId);
  };

  const handleGroupDragLeave = () => {
    setDragOverGroupId(null);
  };

  const handleGroupDrop = (e: React.DragEvent, group: PrinterGroup) => {
    e.preventDefault();
    setDragOverGroupId(null);
    const printerId = e.dataTransfer.getData(DRAG_TYPE_PRINTER_ID);
    if (!printerId || !onAddPrinterToGroup) return;
    const printer = printers.find((p) => p.id === printerId);
    if (printer) onAddPrinterToGroup(printer, group);
  };

  const renderPrinterRow = (printer: PrinterData, indented?: boolean) => {
    const printerStatus = computePrinterStatus(printer);
    const location = printer.location ?? CURRENT_LOCATION_NAME;
    const checked = checkedIds.has(printer.id);
    return (
      <div
        key={printer.id}
        role="button"
        tabIndex={0}
        draggable={!!onAddPrinterToGroup}
        onDragStart={(e) => handlePrinterDragStart(e, printer)}
        onClick={() => onRowClick(printer)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowClick(printer);
          }
        }}
        className="grid pr-2 py-4 border-b border-[#f0f0f0] w-full text-left gap-4 items-center cursor-pointer hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101010] focus-visible:ring-inset min-h-0"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div
          className="flex items-center justify-center shrink-0"
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
            "min-w-0 flex items-center gap-3 text-left min-h-0",
            indented && "pl-6"
          )}
        >
          <img
            src="/printer-image.png"
            alt=""
            className="w-5 h-5 object-contain shrink-0"
            aria-hidden
          />
          <p className="text-[15px] font-medium leading-[22px] text-[#101010] min-w-0 line-clamp-2">
            {printer.name}
          </p>
        </div>
        <div className="min-w-0 text-left min-h-0">
          <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
            {location}
          </p>
        </div>
        <div className="min-w-0 text-left min-h-0">
          <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
            {getPrintsSummary(printer)}
          </p>
        </div>
        <div className="min-w-0 text-left min-h-0">
          <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
            {getCategoriesShortText(printer.inPersonCategoryIds) || printer.inPersonCategories || "—"}
          </p>
        </div>
        <div className="min-w-0 flex items-center justify-start min-h-0">
          <StatusPill variant={printerStatus} />
        </div>
      </div>
    );
  };

  const SortHeader = ({
    column,
    label,
    sortable = true,
  }: {
    column: SortColumn;
    label: string;
    sortable?: boolean;
  }) => {
    const isActive = sortBy === column;
    if (!sortable) {
      return (
        <div className="min-w-0 w-full flex items-center py-1 -my-1">
          <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
            {label}
          </span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="min-w-0 w-full flex items-center gap-1 text-left hover:opacity-80 py-1 -my-1"
      >
        <span className="text-[14px] font-medium leading-[22px] text-[#101010]">
          {label}
        </span>
        {isActive && sortDir === "asc" ? (
          <ChevronUp className="w-4 h-4 text-[#666] shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#666] shrink-0" aria-hidden />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className="grid pr-2 py-4 border-b border-[#959595] w-full gap-4 items-center"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={toggleAll}
            className="size-5 rounded border-2 border-[rgba(0,0,0,0.42)]"
          />
        </div>
        <SortHeader column="name" label="Name" />
        <SortHeader column="location" label="Locations" />
        <SortHeader column="prints" label="Prints" sortable={false} />
        <SortHeader column="categories" label="Categories" sortable={false} />
        <SortHeader column="status" label="Status" />
      </div>

      {sortedGroups.map((group) => {
        const groupPrinters = sortedGroupToPrinters.get(group.id) ?? [];
        const isExpanded = expandedGroupIds.has(group.id);
        const locationCount = getUniqueLocationCount(groupPrinters);
        const worstStatus = getWorstStatus(groupPrinters);
        const printsSummary = getPrintsSummaryFromSettings(group.settings);

        const isDropTarget = dragOverGroupId === group.id;
        return (
          <div key={group.id} className="flex flex-col">
            <div
              role="button"
              tabIndex={0}
              onClick={() => onGroupClick?.(group)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onGroupClick?.(group);
                }
              }}
              onDragOver={onAddPrinterToGroup ? (e) => handleGroupDragOver(e, group.id) : undefined}
              onDragLeave={onAddPrinterToGroup ? handleGroupDragLeave : undefined}
              onDrop={onAddPrinterToGroup ? (e) => handleGroupDrop(e, group) : undefined}
              className={cn(
                "grid pr-2 py-4 border-b border-[#f0f0f0] w-full gap-4 items-center text-left cursor-pointer hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101010] focus-visible:ring-inset min-h-0",
                isDropTarget && "bg-[#e8e8e8] ring-2 ring-[#101010] ring-inset"
              )}
              style={{ gridTemplateColumns: gridCols }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleGroupExpanded(group.id);
                }}
                className="flex items-center justify-center w-full h-full rounded hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101010] shrink-0"
                aria-label={isExpanded ? "Collapse group" : "Expand group"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#666]" aria-hidden />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#666]" aria-hidden />
                )}
              </button>
              <div className="min-w-0 flex items-center gap-3 min-h-0">
                <Network className="w-5 h-5 text-[#666] shrink-0" aria-hidden />
                <p className="text-[15px] font-medium leading-[22px] text-[#101010] min-w-0 line-clamp-2">
                  {group.name} ({groupPrinters.length})
                </p>
              </div>
              <div className="min-w-0 text-left min-h-0">
                <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
                  {locationCount} location{locationCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="min-w-0 text-left min-h-0">
                <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
                  {printsSummary}
                </p>
              </div>
              <div className="min-w-0 text-left min-h-0">
                <p className="text-[13px] leading-[18px] text-[#666] line-clamp-2">
                  {getCategoriesShortText(group.settings.inPersonCategoryIds) || group.settings.inPersonCategories || "—"}
                </p>
              </div>
              <div className="min-w-0 flex items-center justify-start min-h-0">
                <StatusPill variant={worstStatus} />
              </div>
            </div>
            {isExpanded &&
              groupPrinters.map((printer) => renderPrinterRow(printer, true))}
          </div>
        );
      })}

      {sortedUngrouped.map((printer) => renderPrinterRow(printer))}
    </div>
  );
}

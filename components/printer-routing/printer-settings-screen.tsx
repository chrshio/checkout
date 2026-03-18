"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "@/components/pos/status-bar";
import { BottomNavigation } from "@/components/pos/bottom-navigation";
import type { NavItem } from "@/lib/pos-types";
import { PrinterDetail } from "./printer-detail";
import { NewPrinterModal } from "./new-printer-modal";
import {
  type PrinterData,
  type PrinterStatus,
  computePrinterStatus,
  getPrintsSummary,
  defaultTicketAppearance,
  getDevicesForLocation,
  CURRENT_LOCATION_NAME,
  formatLastUpdated,
} from "@/lib/printer-data";
import { usePrinterRouting } from "./printer-routing-context";
import { getCategoriesShortText } from "@/lib/printer-categories-copy";
import { StatusPill } from "@/components/ui/status-pill";
import { PrinterRoutingToast } from "./toast";

const sidebarSections = [
  { id: "checkout", label: "Checkout", type: "heading" as const },
  {
    id: "hardware",
    label: "Hardware",
    type: "heading" as const,
    children: [
      { id: "this-device", label: "This device" },
      { id: "pos", label: "POS" },
      { id: "printers", label: "Printers" },
      { id: "barcode-scanners", label: "Barcode scanners" },
      { id: "cash-drawers", label: "Cash drawers" },
    ],
  },
  { id: "security", label: "Security", type: "heading" as const },
  { id: "account", label: "Account", type: "heading" as const },
];

type View = "list" | "detail";

export function PrinterSettingsScreen() {
  const { printers, setPrinters } = usePrinterRouting();
  const [activeSidebarItem, setActiveSidebarItem] = useState("printers");
  const [activeTab, setActiveTab] = useState<NavItem>("more");
  const [view, setView] = useState<View>("list");
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [newPrinterOpen, setNewPrinterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isDetailExiting, setIsDetailExiting] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<"details" | "ticket-settings" | "print-history" | null>(null);
  const exitCallbackRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  /** POS is at Brooklyn; only show and configure printers at this location. */
  const printersAtLocation = useMemo(
    () =>
      printers.filter(
        (p) => (p.location ?? CURRENT_LOCATION_NAME) === CURRENT_LOCATION_NAME
      ),
    [printers]
  );

  const selectedPrinter = printers.find((p) => p.id === selectedPrinterId) ?? null;

  const handleRowClick = useCallback((printer: PrinterData) => {
    setSelectedPrinterId(printer.id);
    setView("detail");
  }, []);

  const exitDetail = useCallback((after: () => void) => {
    exitCallbackRef.current = after;
    setIsDetailExiting(true);
  }, []);

  const handleDetailAnimationEnd = useCallback(() => {
    if (!isDetailExiting) return;
    setIsDetailExiting(false);
    setView("list");
    setSelectedPrinterId(null);
    exitCallbackRef.current?.();
    exitCallbackRef.current = null;
  }, [isDetailExiting]);

  const handleBackToList = useCallback(() => {
    setDetailInitialTab(null);
    exitDetail(() => {});
  }, [exitDetail]);

  const handleSavePrinter = useCallback(
    (updated: PrinterData) => {
      const withLastUpdated = { ...updated, lastUpdated: formatLastUpdated() };
      setPrinters((prev) => prev.map((p) => (p.id === withLastUpdated.id ? withLastUpdated : p)));
      exitDetail(() => showToast(`Printer settings saved for ${updated.name}.`));
    },
    [exitDetail, showToast]
  );

  const handleNewPrinterDone = useCallback(
    (printerName: string, mode: string, defaultProfile?: "receipts" | "kitchen" | "both") => {
      const currentDevice = getDevicesForLocation(CURRENT_LOCATION_NAME).find((d) => d.isCurrentDevice) ?? null;
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
        sources: currentDevice ? [currentDevice] : [],
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
      setSelectedPrinterId(newPrinter.id);
      setView("detail");
      setDetailInitialTab("ticket-settings");
    },
    []
  );

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="flex flex-1 min-h-0 bg-white">
          {/* Left sidebar */}
          <div className="flex flex-col gap-4 h-full shrink-0 overflow-y-auto scrollbar-hide border-r border-[#f0f0f0] pt-6 px-6 pb-6 w-[300px]">
            <div className="flex items-center gap-2 min-h-[36px]">
              <h1 className="font-semibold text-[25px] leading-8 text-[#101010]">
                Settings
              </h1>
            </div>

            <div className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 border border-[#dadada] rounded-full w-full">
              <Search className="w-5 h-5 text-[#666] shrink-0" />
              <span className="text-[15px] leading-6 text-[#666]">Search</span>
            </div>

            <div className="flex flex-col w-full">
              {sidebarSections.map((section) => {
                const isHardware = section.id === "hardware";
                return (
                  <div key={section.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => !isHardware && setActiveSidebarItem(section.id)}
                      className={cn(
                        "flex items-center gap-2 min-h-[44px] py-2.5 w-full text-left -mx-2 px-2 rounded-md",
                        !isHardware && activeSidebarItem === section.id
                          ? "bg-[#e8e8e8]"
                          : "bg-transparent"
                      )}
                    >
                      <p className="flex-1 text-[15px] leading-6 font-medium text-[#101010]">
                        {section.label}
                      </p>
                    </button>

                    {isHardware && section.children && (
                      <div className="flex flex-col">
                        {section.children.map((child) => {
                          const isActive = activeSidebarItem === child.id;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setActiveSidebarItem(child.id)}
                              className={cn(
                                "flex items-center gap-2 min-h-[44px] py-2.5 w-full text-left -mx-2 px-2 pl-4 rounded-md",
                                isActive
                                  ? "bg-[#e8e8e8] font-medium text-[#101010]"
                                  : "bg-transparent font-medium text-[#101010]"
                              )}
                            >
                              <p className="flex-1 text-[15px] leading-6">
                                {child.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 h-full min-w-0 relative overflow-hidden bg-white">
            {/* List — always rendered underneath */}
            <div className="h-full overflow-x-hidden overflow-y-auto scrollbar-hide pt-0 pl-8 pr-8 pb-6">
              <PrintersList printers={printersAtLocation} onRowClick={handleRowClick} onConnectPrinter={() => setNewPrinterOpen(true)} />
            </div>

            {/* Detail — slides in/out on top */}
            {(view === "detail" || isDetailExiting) && selectedPrinter && (
              <div
                key={selectedPrinterId}
                className={`absolute inset-0 bg-white overflow-x-hidden overflow-y-auto scrollbar-hide pt-0 pl-8 pr-8 pb-6 ${isDetailExiting ? "animate-slide-out-right" : "animate-slide-in-right"}`}
                onAnimationEnd={handleDetailAnimationEnd}
              >
                <PrinterDetail
                  printer={selectedPrinter}
                  onBack={handleBackToList}
                  onSave={handleSavePrinter}
                  onEditCategories={() => {}}
                  initialTab={detailInitialTab ?? undefined}
                />
              </div>
            )}
          </div>
        </div>

        <PrinterRoutingToast
          message={toastMessage}
          visible={toastVisible}
          onDismiss={dismissToast}
          bottom="1.5rem"
          durationMs={3000}
        />
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} enabledTabs={["more"]} />

      {/* Modals */}
      <NewPrinterModal open={newPrinterOpen} onOpenChange={setNewPrinterOpen} onDone={handleNewPrinterDone} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Printers List sub-view                                              */
/* ------------------------------------------------------------------ */

function PrintersList({
  printers,
  onRowClick,
  onConnectPrinter,
}: {
  printers: PrinterData[];
  onRowClick: (p: PrinterData) => void;
  onConnectPrinter: () => void;
}) {
  const isEmpty = printers.length === 0;

  return (
    <div className="flex flex-col gap-6 max-w-[800px] pt-6">
      {/* Header row */}
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 flex items-center gap-2 min-h-[48px] min-w-0">
          <h2 className="font-semibold text-[25px] leading-8 text-[#101010]">
            Printers
          </h2>
        </div>
        <button
          type="button"
          onClick={onConnectPrinter}
          className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#101010] text-white rounded-full"
        >
          <span className="font-medium text-[15px] leading-6 whitespace-nowrap">
            Connect printer
          </span>
        </button>
      </div>

      {/* Description */}
      <p className="text-[15px] leading-[22px] text-[#666] -mt-2">
        Set up printers to print receipts, order tickets or labels.{" "}
        <span className="text-link">Learn more</span>{" "}
        about supported printers.
      </p>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Search printers */}
          <div className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 border border-[#dadada] rounded-full w-full">
            <Search className="w-5 h-5 text-[#666] shrink-0" />
            <span className="text-[15px] leading-6 text-[#666]">Search printers</span>
          </div>

          {/* Table */}
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-4 min-h-[48px] pr-2 py-3 border-b border-[#959595]">
              <div className="w-[200px] shrink-0">
                <span className="text-[14px] font-medium leading-[22px] text-[#101010]">Name</span>
              </div>
              <div className="w-[120px] shrink-0">
                <span className="text-[14px] font-medium leading-[22px] text-[#101010]">Prints</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium leading-[22px] text-[#101010]">Categories & items</span>
              </div>
              <div className="w-[120px] shrink-0 text-left">
                <span className="text-[14px] font-medium leading-[22px] text-[#101010]">Status</span>
              </div>
            </div>

            {printers.map((printer) => {
              const printerStatus = computePrinterStatus(printer);
              const prints = getPrintsSummary(printer);
              const categories = getCategoriesShortText(printer.inPersonCategoryIds) || printer.inPersonCategories || "—";
              return (
                <button
                  key={printer.id}
                  type="button"
                  onClick={() => onRowClick(printer)}
                  className="flex items-center gap-4 pr-2 py-4 border-b border-[#f0f0f0] w-full text-left"
                >
                  <div className="w-[200px] shrink-0 min-w-0">
                    <div className="line-clamp-3">
                      <p className="text-[15px] font-medium leading-[22px] text-[#101010]">{printer.name}</p>
                      <p className="text-[13px] leading-[18px] text-[#666]">{printer.model}</p>
                    </div>
                  </div>
                  <div className="w-[120px] shrink-0 min-w-0">
                    <p className="text-[13px] leading-[18px] text-[#666] line-clamp-3">{prints}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-[18px] text-[#666] line-clamp-3">{categories}</p>
                  </div>
                  <div className="w-[120px] shrink-0 flex items-center justify-start">
                    <StatusPill variant={printerStatus} />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-start justify-start px-0">
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
  );
}

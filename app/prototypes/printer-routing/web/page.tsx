"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrowserMock } from "@/components/pos/browser-mock";
import { PrinterSettingsWebScreen } from "@/components/printer-routing/printer-settings-web-screen";
import { usePrinterRouting } from "@/components/printer-routing/printer-routing-context";
import {
  type PrinterData,
  defaultTicketAppearance,
  formatLastUpdated,
  getDevicesForLocation,
} from "@/lib/printer-data";
import { printerMenuGroups, getAllLeafIds } from "@/lib/printer-menu-library";

const BUSINESS_LOCATIONS = [
  "Brooklyn",
  "Flatiron",
  "Soho",
  "Lower Manhattan",
  "Upper East",
] as const;

/** Beverages = index 0, Food Items = index 1 (printerMenuGroups sorted A–Z). */
const BEVERAGE_CATEGORY_IDS = getAllLeafIds([printerMenuGroups[0]]);
const FOOD_CATEGORY_IDS = getAllLeafIds([printerMenuGroups[1]]);

const beverageSet = new Set(BEVERAGE_CATEGORY_IDS);
const foodSet = new Set(FOOD_CATEGORY_IDS);

function printerCategoryType(printer: PrinterData): "beverage" | "food" | null {
  const ids = printer.inPersonCategoryIds ?? [];
  if (ids.length === 0) return null;
  const set = new Set(ids);
  if (set.size === beverageSet.size && [...set].every((id) => beverageSet.has(id))) return "beverage";
  if (set.size === foodSet.size && [...set].every((id) => foodSet.has(id))) return "food";
  return null;
}

export default function PrinterRoutingWebPage() {
  const { printers, setPrinters } = usePrinterRouting();

  const handleQuickAdd = useCallback(() => {
    const existingKeys = new Set(
      printers
        .map((p) => {
          const type = printerCategoryType(p);
          if (!type) return null;
          return `${p.location ?? ""}|${type}`;
        })
        .filter((k): k is string => k != null)
    );

    const options: { location: string; useBeverages: boolean }[] = [];
    for (const location of BUSINESS_LOCATIONS) {
      const keyB = `${location}|beverage`;
      const keyF = `${location}|food`;
      if (!existingKeys.has(keyB)) options.push({ location, useBeverages: true });
      if (!existingKeys.has(keyF)) options.push({ location, useBeverages: false });
    }

    const chosen = options.length > 0
      ? options[Math.floor(Math.random() * options.length)]
      : {
          location: BUSINESS_LOCATIONS[Math.floor(Math.random() * BUSINESS_LOCATIONS.length)],
          useBeverages: Math.random() < 0.5,
        };
    const location = chosen.location;
    const useBeverages = chosen.useBeverages;
    const categoryIds = useBeverages ? BEVERAGE_CATEGORY_IDS : FOOD_CATEGORY_IDS;

    const newPrinter: PrinterData = {
      id: `printer-${Date.now()}`,
      name: useBeverages ? "Drink printer" : "Hot printer",
      model: "Star Micronics TSP143IIIU",
      connection: "USB",
      ipAddress: "—",
      serialNumber: `NEW${Date.now()}`,
      paperSize: "80mm wide",
      paperType: "Thermal",
      sources: getDevicesForLocation(location).map((d) => ({ ...d })),
      receiptsEnabled: false,
      autoPrintReceipts: false,
      receiptCopies: 1,
      inPersonEnabled: true,
      inPersonCategoryIds: [...categoryIds],
      inPersonCategories: "",
      onlineEnabled: true,
      sameAsInPerson: true,
      onlineCategoryIds: [...categoryIds],
      ticketAppearance: { ...defaultTicketAppearance },
      ticketStubsEnabled: false,
      voidTicketsEnabled: false,
      location,
      lastUpdated: formatLastUpdated(),
    };
    setPrinters((prev) => [...prev, newPrinter]);
  }, [printers, setPrinters]);

  return (
    <main className="h-full min-h-0 flex flex-col bg-[#1a1a1a] md:flex-row relative">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <BrowserMock fillContainer>
          <PrinterSettingsWebScreen />
        </BrowserMock>
      </div>

      {/* Right: Quick add – layered on top; hidden below 1400px, reveal on hover at right edge (mirrors left prototype selector) */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 z-40 w-[220px] overflow-visible pointer-events-none",
          "group"
        )}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-5 min-[1400px]:hidden pointer-events-auto"
          aria-hidden
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-[220px] min-[1400px]:hidden pointer-events-none max-[1399px]:group-hover:pointer-events-auto"
          aria-hidden
        />
        <button
          type="button"
          onClick={handleQuickAdd}
          className={cn(
            "absolute right-6 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors active:bg-white/10",
            "min-[1400px]:opacity-100 min-[1400px]:pointer-events-auto",
            "max-[1399px]:opacity-0 max-[1399px]:pointer-events-none max-[1399px]:transition-opacity max-[1399px]:duration-200",
            "max-[1399px]:group-hover:opacity-100 max-[1399px]:group-hover:pointer-events-auto"
          )}
        >
          <Plus className="w-4 h-4" />
          Quick add
        </button>
      </div>
    </main>
  );
}

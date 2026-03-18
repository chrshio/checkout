"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PrinterData, PrinterGroup } from "@/lib/printer-data";

interface PrinterRoutingState {
  printers: PrinterData[];
  setPrinters: React.Dispatch<React.SetStateAction<PrinterData[]>>;
  groups: PrinterGroup[];
  setGroups: React.Dispatch<React.SetStateAction<PrinterGroup[]>>;
}

const PrinterRoutingContext = createContext<PrinterRoutingState | null>(null);

export function PrinterRoutingProvider({ children }: { children: ReactNode }) {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [groups, setGroups] = useState<PrinterGroup[]>([]);

  return (
    <PrinterRoutingContext.Provider
      value={{ printers, setPrinters, groups, setGroups }}
    >
      {children}
    </PrinterRoutingContext.Provider>
  );
}

export function usePrinterRouting() {
  const ctx = useContext(PrinterRoutingContext);
  if (!ctx) {
    throw new Error("usePrinterRouting must be used within PrinterRoutingProvider");
  }
  return ctx;
}

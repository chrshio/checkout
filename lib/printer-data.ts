export type DeviceType = "Square Terminal" | "Square Stand" | "Square Handheld";

export interface SourceDevice {
  id: string;
  name: string;
  deviceType: DeviceType;
  codeName: string;
  isOnline: boolean;
  isCurrentDevice: boolean;
}

export type PrinterStatus = "connected" | "ready" | "critical" | "not-configured";

export interface TicketAppearance {
  compactTicket: boolean;
  singleItemPerTicket: boolean;
  combineIdenticalItems: boolean;
  includeTopPadding: boolean;
  printKitchenNames: boolean;
}

export const defaultTicketAppearance: TicketAppearance = {
  compactTicket: false,
  singleItemPerTicket: false,
  combineIdenticalItems: false,
  includeTopPadding: false,
  printKitchenNames: false,
};

/** Shared settings for a printer group (same shape as relevant PrinterData fields). */
export interface PrinterGroupSettings {
  receiptsEnabled: boolean;
  autoPrintReceipts: boolean;
  receiptCopies: number;
  inPersonEnabled: boolean;
  inPersonCategories: string;
  inPersonCategoryIds?: string[];
  onlineEnabled: boolean;
  sameAsInPerson: boolean;
  ticketAppearance: TicketAppearance;
  ticketStubsEnabled: boolean;
  voidTicketsEnabled: boolean;
}

export interface PrinterGroup {
  id: string;
  name: string;
  printerIds: string[];
  settings: PrinterGroupSettings;
}

export const defaultPrinterGroupSettings: PrinterGroupSettings = {
  receiptsEnabled: false,
  autoPrintReceipts: false,
  receiptCopies: 1,
  inPersonEnabled: false,
  inPersonCategories: "",
  onlineEnabled: false,
  sameAsInPerson: false,
  ticketAppearance: { ...defaultTicketAppearance },
  ticketStubsEnabled: false,
  voidTicketsEnabled: false,
};

export interface PrinterData {
  id: string;
  name: string;
  model: string;
  connection: string;
  ipAddress: string;
  serialNumber: string;
  paperSize: string;
  paperType: string;
  sources: SourceDevice[];
  receiptsEnabled: boolean;
  autoPrintReceipts: boolean;
  receiptCopies: number;
  inPersonEnabled: boolean;
  inPersonCategories: string;
  /** Selected category IDs for subcopy rules (all / N categories, M items / list). */
  inPersonCategoryIds?: string[];
  onlineEnabled: boolean;
  sameAsInPerson: boolean;
  ticketAppearance: TicketAppearance;
  ticketStubsEnabled: boolean;
  voidTicketsEnabled: boolean;
  /** Optional: ID of the printer group this printer belongs to. */
  groupId?: string;
  /** Optional display fields for web/dashboard (same source of truth) */
  location?: string;
  lastUpdated?: string;
}

/** All POS devices registered at this business location. */
export const locationDevices: SourceDevice[] = [
  {
    id: "src-counter",
    name: "Counter",
    deviceType: "Square Stand",
    codeName: "Counter iPad",
    isOnline: true,
    isCurrentDevice: true,
  },
  {
    id: "src-cafe-bar",
    name: "Cafe bar",
    deviceType: "Square Terminal",
    codeName: "Cafe bar Terminal",
    isOnline: true,
    isCurrentDevice: false,
  },
  {
    id: "src-kitchen",
    name: "Kitchen",
    deviceType: "Square Terminal",
    codeName: "Kitchen Terminal",
    isOnline: true,
    isCurrentDevice: false,
  },
  {
    id: "src-foh-handheld",
    name: "Host stand",
    deviceType: "Square Handheld",
    codeName: "Host Handheld",
    isOnline: false,
    isCurrentDevice: false,
  },
];

export function computePrinterStatus(printer: PrinterData): PrinterStatus {
  if (printer.sources.length === 0) return "not-configured";
  const hasOnlineSource = printer.sources.some((s) => s.isOnline);
  if (!hasOnlineSource) return "critical";
  const hasCurrentDevice = printer.sources.some((s) => s.isOnline && s.isCurrentDevice);
  if (hasCurrentDevice) return "connected";
  return "ready";
}

export function getPrintsSummary(printer: PrinterData): string {
  const parts: string[] = [];
  if (printer.receiptsEnabled) parts.push("Receipts");
  if (printer.inPersonEnabled) parts.push("In-person orders");
  if (printer.onlineEnabled) parts.push("Online & Kiosk orders");
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function getPrintsSummaryFromSettings(settings: PrinterGroupSettings): string {
  const parts: string[] = [];
  if (settings.receiptsEnabled) parts.push("Receipts");
  if (settings.inPersonEnabled) parts.push("In-person orders");
  if (settings.onlineEnabled) parts.push("Online & Kiosk orders");
  return parts.length > 0 ? parts.join(", ") : "—";
}

/** Worst status among printers (critical > not-configured > ready > connected). */
export function getWorstStatus(printers: PrinterData[]): PrinterStatus {
  const order: PrinterStatus[] = ["critical", "not-configured", "ready", "connected"];
  let worst: PrinterStatus = "connected";
  for (const p of printers) {
    const s = computePrinterStatus(p);
    if (order.indexOf(s) < order.indexOf(worst)) worst = s;
  }
  return worst;
}

export function getUniqueLocationCount(printers: PrinterData[]): number {
  const locations = new Set(printers.map((p) => p.location ?? "—").filter((l) => l !== "—"));
  return locations.size;
}

export function getGroupForPrinter(
  printerId: string,
  groups: PrinterGroup[]
): PrinterGroup | undefined {
  return groups.find((g) => g.printerIds.includes(printerId));
}

export const statusConfig: Record<PrinterStatus, { label: string; bg: string; text: string }> = {
  connected: { label: "Connected", bg: "bg-[#e0ffe3]", text: "text-[#008507]" },
  ready: { label: "Ready", bg: "bg-[#e0ffe3]", text: "text-[#008507]" },
  critical: { label: "Critical issue", bg: "bg-[#ffe5ea]", text: "text-[#bf0020]" },
  "not-configured": { label: "Not configured", bg: "bg-[#fff3e0]", text: "text-[#c25400]" },
};

/** Status pill variant for UI; includes "offline" for disconnected/offline states. */
export type StatusPillVariant = PrinterStatus | "offline";

export const statusPillConfig: Record<
  StatusPillVariant,
  { label: string; bg: string; text: string }
> = {
  ...statusConfig,
  offline: { label: "Offline", bg: "bg-black/5", text: "text-[#666]" },
};

/** Random time from yesterday for prototype "Last updated" display (stable per load). */
function randomLastUpdatedYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0
  );
  return yesterday.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const lastUpdatedYesterday = randomLastUpdatedYesterday();

export const initialPrinters: PrinterData[] = [
  {
    id: "cold-oak",
    name: "Cold Printer - OAK",
    model: "Star Micronics SP742ML",
    location: "Austin",
    lastUpdated: lastUpdatedYesterday,
    connection: "Ethernet",
    ipAddress: "192.168.1.40",
    serialNumber: "343667732434502",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-counter",
        name: "Counter",
        deviceType: "Square Stand",
        codeName: "Counter iPad",
        isOnline: true,
        isCurrentDevice: true,
      },
      {
        id: "src-cafe-bar",
        name: "Cafe bar",
        deviceType: "Square Terminal",
        codeName: "Cafe bar Terminal",
        isOnline: true,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: true,
    inPersonCategories: "Appetizers (4)",
    inPersonCategoryIds: ["coffee", "tea"],
    onlineEnabled: true,
    sameAsInPerson: true,
    ticketAppearance: {
      compactTicket: true,
      singleItemPerTicket: false,
      combineIdenticalItems: true,
      includeTopPadding: true,
      printKitchenNames: false,
    },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
    groupId: "cafe-printers",
  },
  {
    id: "hot-oak",
    name: "Hot Printer - OAK",
    model: "Star Micronics SP742ML",
    location: "Denver",
    lastUpdated: lastUpdatedYesterday,
    connection: "Ethernet",
    ipAddress: "192.168.1.41",
    serialNumber: "343667732434518",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-kitchen",
        name: "Kitchen",
        deviceType: "Square Terminal",
        codeName: "Kitchen Terminal",
        isOnline: true,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: true,
    inPersonCategories: "Mains (6), Appetizers (2)",
    inPersonCategoryIds: ["specialty", "kitchen", "uncategorized", "coffee", "tea"],
    onlineEnabled: true,
    sameAsInPerson: true,
    ticketAppearance: {
      compactTicket: false,
      singleItemPerTicket: true,
      combineIdenticalItems: false,
      includeTopPadding: true,
      printKitchenNames: true,
    },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
    groupId: "cafe-printers",
  },
  {
    id: "foh",
    name: "Front of house printer",
    model: "Epson TM-T88VII",
    location: "Austin, and 5 more",
    lastUpdated: lastUpdatedYesterday,
    connection: "USB",
    ipAddress: "—",
    serialNumber: "Y4J0200541",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-foh-handheld",
        name: "Host stand",
        deviceType: "Square Handheld",
        codeName: "Host Handheld",
        isOnline: false,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: true,
    autoPrintReceipts: true,
    receiptCopies: 2,
    inPersonEnabled: true,
    inPersonCategories: "Drinks (6)",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
    groupId: "cafe-printers",
  },
  {
    id: "cafe-oak",
    name: "Cafe Printer - OAK",
    model: "Star Micronics SP742ML",
    location: "Oakland, NY",
    lastUpdated: lastUpdatedYesterday,
    connection: "Ethernet",
    ipAddress: "192.168.1.42",
    serialNumber: "ee:ff:33:44:55:dd",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: false,
    inPersonCategories: "",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
    groupId: "cafe-printers",
  },
  {
    id: "bar",
    name: "Bar printer",
    model: "Star Micronics TSP143IIIU",
    location: "Oakland, NY",
    lastUpdated: lastUpdatedYesterday,
    connection: "Bluetooth",
    ipAddress: "—",
    serialNumber: "483920174625301",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: false,
    inPersonCategories: "",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
  },
  {
    id: "label-counter",
    name: "Label printer",
    model: "Star Micronics mC-Label3",
    location: "San Diego, and 1 more",
    lastUpdated: lastUpdatedYesterday,
    connection: "Ethernet",
    ipAddress: "192.168.1.55",
    serialNumber: "LBL902837465120",
    paperSize: "58mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-counter",
        name: "Counter",
        deviceType: "Square Stand",
        codeName: "Counter iPad",
        isOnline: true,
        isCurrentDevice: true,
      },
    ],
    receiptsEnabled: true,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: false,
    inPersonCategories: "",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
    ticketStubsEnabled: false,
    voidTicketsEnabled: false,
    groupId: "cafe-printers",
  },
];

/** Dummy initial printer groups for prototype. */
export const initialGroups: PrinterGroup[] = [
  {
    id: "cafe-printers",
    name: "Cafe printers",
    printerIds: ["cold-oak", "hot-oak", "foh", "cafe-oak", "label-counter"],
    settings: {
      receiptsEnabled: true,
      autoPrintReceipts: false,
      receiptCopies: 1,
      inPersonEnabled: true,
      inPersonCategories: "Non-Coffee Drinks (12), Coffee Drinks (17)",
      inPersonCategoryIds: ["coffee", "tea"],
      onlineEnabled: true,
      sameAsInPerson: true,
      ticketAppearance: {
        compactTicket: true,
        singleItemPerTicket: true,
        combineIdenticalItems: false,
        includeTopPadding: true,
        printKitchenNames: false,
      },
      ticketStubsEnabled: false,
      voidTicketsEnabled: false,
    },
  },
];

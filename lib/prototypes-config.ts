export interface PrototypeItem {
  id: string;
  name: string;
  path: string;
  ready: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  prototypes: PrototypeItem[];
}

export const projects: ProjectItem[] = [
  {
    id: "checkout-pos",
    name: "POS checkout",
    prototypes: [
      { id: "cafe", name: "Standard", path: "/prototypes/checkout-pos/cafe", ready: true },
      { id: "qsr", name: "QSR", path: "/prototypes/checkout-pos/qsr", ready: true },
      { id: "fsr", name: "FSR mode", path: "/prototypes/checkout-pos/fsr", ready: true },
      { id: "retail", name: "Retail mode", path: "/prototypes/checkout-pos/retail", ready: true },
      { id: "voice", name: "*Vision*", path: "/prototypes/checkout-pos/voice", ready: true },
      { id: "variant-a", name: "Variant A", path: "/prototypes/checkout-pos/variant-a", ready: true },
    ],
  },
  {
    id: "printer-routing",
    name: "Printer routing",
    prototypes: [
      { id: "main", name: "POS", path: "/prototypes/printer-routing/main", ready: true },
      { id: "web", name: "Dashboard", path: "/prototypes/printer-routing/web", ready: true },
    ],
  },
];

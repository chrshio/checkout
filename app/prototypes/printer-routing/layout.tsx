import { PrinterRoutingProvider } from "@/components/printer-routing/printer-routing-context";

export default function PrinterRoutingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrinterRoutingProvider>{children}</PrinterRoutingProvider>;
}

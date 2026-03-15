import { IPadMock } from "@/components/pos/ipad-mock";
import { PrinterSettingsScreen } from "@/components/printer-routing/printer-settings-screen";

export default function PrinterRoutingMainPage() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <PrinterSettingsScreen />
      </IPadMock>
    </main>
  );
}

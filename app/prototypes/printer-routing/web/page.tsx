import { BrowserMock } from "@/components/pos/browser-mock";
import { PrinterSettingsWebScreen } from "@/components/printer-routing/printer-settings-web-screen";

export default function PrinterRoutingWebPage() {
  return (
    <main className="h-full min-h-0 flex flex-col bg-[#1a1a1a]">
      <BrowserMock fillContainer>
        <PrinterSettingsWebScreen />
      </BrowserMock>
    </main>
  );
}

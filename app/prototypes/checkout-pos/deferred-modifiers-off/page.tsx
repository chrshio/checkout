import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenDeferredModifiersOff } from "@/components/pos-deferred-modifiers-off/pos-screen";

export default function CheckoutPOSDeferredModifiersOffPage() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenDeferredModifiersOff />
      </IPadMock>
    </main>
  );
}

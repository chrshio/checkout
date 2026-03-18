"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, X } from "lucide-react";

/** POS-style toast for printer routing: dark pill, slide-up, optional success icon. */
export function PrinterRoutingToast({
  message,
  visible,
  onDismiss,
  bottom = "1.5rem",
  durationMs = 3000,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  /** CSS bottom value (e.g. "4rem", "78px") */
  bottom?: string;
  durationMs?: number;
}) {
  const [toastVisible, setToastVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setToastVisible(true));
      });
    } else {
      setToastVisible(false);
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !message) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [visible, message, durationMs, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div
      className="absolute left-1/2 z-50 w-[600px] max-w-[calc(100%-32px)] transition-transform duration-300 ease-out"
      style={{
        bottom,
        transform: `translateX(-50%) translateY(${toastVisible ? "0" : "200%"})`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-4 rounded-[16px] shadow-xl bg-[#232323]">
        <CheckCircle className="w-6 h-6 text-[#00a63e] shrink-0" strokeWidth={2.5} />
        <p className="flex-1 text-[16px] text-white leading-6">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 active:opacity-80"
          aria-label="Dismiss"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

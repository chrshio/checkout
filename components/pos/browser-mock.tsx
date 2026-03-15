"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { DialogContainerProvider } from "@/components/ui/dialog-container-context";

interface BrowserMockProps {
  children: ReactNode;
  /** When true, fit within parent instead of min-h-screen. */
  fillContainer?: boolean;
}

export function BrowserMock({ children, fillContainer = false }: BrowserMockProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  return (
    <DialogContainerProvider
      value={{ containerRef: contentRef, contained: true }}
    >
      <div
        className={`flex w-full justify-center bg-[#1a1a1a] p-4 sm:p-6 md:p-8 ${fillContainer ? "min-h-0 flex-1 flex-col pt-12 pb-16 items-center" : "min-h-screen pt-28 pb-16 items-start"}`}
      >
        {/* Explicit spacer so there's always visible gap between variant selector and browser */}
        {fillContainer && <div className="w-full shrink-0 h-16" aria-hidden />}
        {/* Browser window - 1440px width; when fillContainer, flex-1 so it fills to 64px from bottom */}
        <div
          className={`relative flex w-[1440px] max-w-full flex-col overflow-hidden rounded-2xl border border-[#333] border-b-0 bg-[#e8e8e8] shadow-2xl ${fillContainer ? "min-h-0 flex-1" : ""}`}
          style={
            fillContainer
              ? undefined
              : { height: "calc(100vh - 64px - 112px)" }
          }
        >
          {/* Title bar */}
          <div className="relative flex h-10 shrink-0 items-center justify-center border-b border-[#ccc] bg-[#e0e0e0] px-3">
            {/* Window controls - absolute so URL bar can be centered */}
            <div className="absolute left-3 flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ed6a5e]" />
              <div className="h-3 w-3 rounded-full bg-[#f5bd4f]" />
              <div className="h-3 w-3 rounded-full bg-[#61c554]" />
            </div>
            <div className="flex max-w-[40%] items-center justify-center rounded-full px-4 py-1.5">
              <span className="truncate text-[13px] text-[#666]">squareup.com</span>
            </div>
          </div>
          {/* Content area — dialogs portal here */}
          <div
            ref={contentRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
          >
            {children}
          </div>
        </div>
      </div>
    </DialogContainerProvider>
  );
}

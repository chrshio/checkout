"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { DialogContainerProvider } from "@/components/ui/dialog-container-context";

interface IPadMockProps {
  children: ReactNode;
  /** When true, fit within parent instead of min-h-screen (e.g. when content below iPad must stay visible). */
  fillContainer?: boolean;
}

export function IPadMock({ children, fillContainer = false }: IPadMockProps) {
  const screenRef = React.useRef<HTMLDivElement>(null);
  return (
    <DialogContainerProvider
      value={{ containerRef: screenRef, contained: true }}
    >
      <div
        className={`relative flex w-full items-center justify-center bg-[#1a1a1a] p-4 sm:p-6 md:p-8 ${fillContainer ? "min-h-0 h-full" : "min-h-screen"}`}
      >
        {/* iPad device frame - scales responsively */}
        <div className="relative w-full max-w-[1100px] aspect-[4/3]" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {/* iPad outer bezel */}
          <div className="absolute inset-0 bg-[#080808] text-[#0a0a0a] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl">
            {/* iPad inner bezel — radius = outer radius − inset so corners meet flush */}
            <div className="absolute inset-[6px] sm:inset-[10px] md:inset-[12px] bg-[#101010] rounded-[calc(2rem-6px)] sm:rounded-[calc(2.5rem-10px)] md:rounded-[calc(2.5rem-12px)] overflow-hidden">
              {/* Screen content area — relative so dialogs portal here and position relative to iPad */}
              <div
                ref={screenRef}
                className="relative w-full h-full bg-[#080808] rounded-[calc(2rem-7px)] sm:rounded-[calc(2.5rem-11px)] md:rounded-[calc(2.5rem-13px)] overflow-hidden"
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContainerProvider>
  );
}

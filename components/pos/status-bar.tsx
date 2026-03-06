"use client";

import { useState, useEffect } from "react";
import { Check, Signal, Wifi, Battery } from "lucide-react";

export function StatusBar() {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const date = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      setDateTime(`${time} ${date}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col px-4 pt-2 pb-1 bg-[#080808] text-sm gap-0">
      {/* Line 1: iOS-style device status bar — time left, signal/wifi/battery right */}
      <div className="flex items-center justify-between min-h-[20px] text-[#ffffff]">
        <span className="font-medium text-xs" suppressHydrationWarning>
          {dateTime || "12:00 PM Mon Jan 1"}
        </span>
        <div className="flex items-center gap-1.5">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <span className="text-xs font-medium">100%</span>
          <Battery className="w-5 h-5 fill-[#ffffff]" />
        </div>
      </div>

      {/* Line 2: Square POS status — business name left, reader/printers/devices right */}
      <div className="flex items-center justify-between min-h-[20px] text-[#888888]">
        <span className="font-medium text-xs">Oliver & Co.</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Reader</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">2 printers</span>
          </div>
          <div className="flex items-center gap-1 border-l border-[#444444] pl-4">
            <span className="text-xs font-medium">My devices</span>
          </div>
        </div>
      </div>
    </div>
  );
}

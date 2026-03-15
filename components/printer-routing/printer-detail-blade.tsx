"use client";

import { X, ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react";
import {
  type PrinterData,
  type DeviceType,
  computePrinterStatus,
} from "@/lib/printer-data";
import { StatusPill } from "@/components/ui/status-pill";

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

interface PrinterDetailBladeProps {
  printer: PrinterData;
  onClose: () => void;
  onEditSettings: () => void;
  onForget?: () => void;
}

export function PrinterDetailBlade({
  printer,
  onClose,
  onEditSettings,
  onForget,
}: PrinterDetailBladeProps) {
  const printerStatus = computePrinterStatus(printer);
  const lastUpdated = printer.lastUpdated ?? "—";
  const isNetworkConnected = printer.connection === "Ethernet" && printer.ipAddress !== "—";

  return (
    <div className="flex flex-col h-full bg-white rounded-l-[14px] shadow-[0px_4px_9px_rgba(0,0,0,0.1),0px_2px_18px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-6 px-9 py-7 flex-1 min-h-0 overflow-y-auto">
        {/* Header: close + Edit printer settings */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center p-3 rounded-full bg-black/5"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-[#101010]" />
          </button>
          <button
            type="button"
            onClick={onEditSettings}
            className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#101010] text-white rounded-full font-medium text-[15px] leading-6"
          >
            Edit printer settings
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 shrink-0">
          <h2 className="font-semibold text-[25px] leading-8 text-[#101010] min-w-0 truncate">
            {printer.name}
          </h2>
          <StatusPill variant={printerStatus} />
        </div>

        <p className="text-[14px] leading-[22px] text-[#666] shrink-0">
          Last updated: {lastUpdated}
        </p>

        {/* Critical / not-configured banner */}
        {(printerStatus === "critical" || printerStatus === "not-configured") && (
          <div className="flex gap-3 items-start min-h-[56px] p-4 rounded-[6px] bg-[#ffe5ea] border border-[#ffccd5] shrink-0">
            <span className="text-[16px] leading-6 text-[#101010]">
              {printerStatus === "not-configured"
                ? "Not configured"
                : "All connected sources are offline"}
            </span>
          </div>
        )}

        <div className="h-2 bg-black/5 rounded-[2px] w-full shrink-0" />

        {/* Connected devices */}
        <div className="flex flex-col gap-4 shrink-0">
          <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">
            Connected devices
          </h3>
          {printer.sources.length > 0 ? (
            <div className="flex flex-col">
              {printer.sources.map((source) => {
                const Icon = deviceIcon[source.deviceType];
                return (
                  <div
                    key={source.id}
                    className="flex items-center gap-4 py-3.5 rounded-t-[14px]"
                  >
                    <div className="flex items-center justify-center shrink-0 w-[27px] h-[27px]">
                      {Icon && <Icon className="w-[27px] h-[27px] text-[#101010]" />}
                    </div>
                    <span className="flex-1 min-w-0 font-medium text-[16px] leading-6 text-[#101010]">
                      {source.name}
                    </span>
                    <StatusPill
                      variant={source.isOnline ? "connected" : "offline"}
                      label={source.isOnline ? "Connected" : "Offline"}
                    />
                    <ChevronRight className="w-[18px] h-[18px] text-[#666] shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[15px] leading-6 text-[#666]">No devices connected</p>
          )}
        </div>

        <div className="h-2 bg-black/5 rounded-[2px] w-full shrink-0" />

        {/* Connectivity */}
        <div className="flex flex-col gap-4 shrink-0">
          <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010]">
            Connectivity
          </h3>
          <div className="flex items-center justify-between py-3.5">
            <span className="font-medium text-[16px] leading-6 text-[#101010]">
              Network
            </span>
            <StatusPill
              variant={isNetworkConnected ? "connected" : "offline"}
              label={isNetworkConnected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>

        <div className="h-2 bg-black/5 rounded-[2px] w-full shrink-0" />

        {/* Printer details */}
        <div className="flex flex-col gap-0 shrink-0">
          <h3 className="font-semibold text-[19px] leading-[26px] text-[#101010] mb-1">
            Printer details
          </h3>
          <div className="flex flex-col text-[16px] leading-6 text-[#101010]">
            <DetailRow label="Type" value={printer.paperType === "Thermal" ? "Receipt printer" : "Impact printer"} />
            <DetailRow label="Paper width" value={printer.paperSize} />
            <DetailRow label="Model" value={printer.model} />
            <DetailRow label="Device ID" value={printer.serialNumber} hideBorder />
          </div>
        </div>

        {/* Forget printer */}
        {onForget && (
          <button
            type="button"
            onClick={onForget}
            className="flex items-center py-3.5 text-[18px] font-semibold text-[#bf0020] shrink-0"
          >
            Forget printer
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  hideBorder,
}: {
  label: string;
  value: string;
  hideBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 ${!hideBorder ? "border-b border-black/5" : ""}`}
    >
      <span className="font-medium text-[16px] leading-6 text-[#101010]">{label}</span>
      <span className="font-normal text-[15px] leading-6 text-[#101010] shrink-0">{value}</span>
    </div>
  );
}

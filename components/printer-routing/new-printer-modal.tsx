"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ArrowLeft, Receipt, ChefHat, PrinterCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";

type Step = "setup" | "select-default";
type SettingsMode = "default" | "custom";
type DefaultProfile = "receipts" | "kitchen" | "both";

interface NewPrinterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (printerName: string, mode: SettingsMode, defaultProfile?: DefaultProfile) => void;
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className="shrink-0 w-5 h-5">
      {selected ? (
        <div className="w-5 h-5 rounded-full border-[6px] border-[#101010]" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#959595]" />
      )}
    </div>
  );
}

const defaultProfiles: { id: DefaultProfile; label: string; icon: typeof Receipt; section?: string }[] = [
  { id: "receipts", label: "Print receipts", icon: Receipt },
  { id: "kitchen", label: "Print kitchen tickets", icon: ChefHat, section: "Great for restaurants" },
  { id: "both", label: "Print receipts and kitchen tickets", icon: PrinterCheck },
];

export function NewPrinterModal({ open, onOpenChange, onDone }: NewPrinterModalProps) {
  const [step, setStep] = useState<Step>("setup");
  const [printerName, setPrinterName] = useState("");
  const [settingsMode, setSettingsMode] = useState<SettingsMode>("default");
  const [selectedProfile, setSelectedProfile] = useState<DefaultProfile>("receipts");

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("setup");
      setPrinterName("");
      setSettingsMode("default");
      setSelectedProfile("receipts");
    }, 200);
  };

  const handleNext = () => {
    if (settingsMode === "default") {
      setStep("select-default");
    } else {
      onDone(printerName, "custom");
      handleClose();
    }
  };

  const handleDone = () => {
    onDone(printerName, settingsMode, selectedProfile);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[664px] max-w-[min(664px,calc(100%-2rem))] sm:max-w-[664px] flex flex-col border-0 p-0 shadow-xl bg-white rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        {step === "setup" ? (
          <div className="flex flex-col p-6 gap-6">
            {/* Header */}
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
              >
                <X className="w-5 h-5 text-[#101010]" />
              </button>
              <DialogTitle className="flex-1 text-center font-semibold text-[17px] leading-[24px] text-[#101010]">
                New printer connected
              </DialogTitle>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#101010] text-white rounded-full"
              >
                <span className="font-medium text-[15px] leading-6">
                  {settingsMode === "default" ? "Next" : "Done"}
                </span>
              </button>
            </div>

            {/* Printer image placeholder */}
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-[120px] h-[100px] rounded-lg bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
                <Image src="/printer-image.png" alt="Printer" width={60} height={50} className="w-[60px] h-[50px] object-contain" />
              </div>
              <p className="text-[15px] font-semibold text-[#101010]">Star Micronics TSP143IIIU</p>
              <p className="text-[13px] text-[#666]">USB, Receipt printer, 80mm thermal</p>
            </div>

            {/* Name input */}
            <div className="flex flex-col gap-1.5">
              <TextField
                label="Printer name"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                wrapperClassName="rounded-xl border-[#dadada]"
              />
              <p className="text-[13px] leading-[18px] text-[#666] px-1">
                This will help you remember and recognize your device.
              </p>
            </div>

            {/* Settings mode cards */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSettingsMode("default")}
                className={cn(
                  "flex-1 flex flex-col gap-1 p-4 rounded-xl border-2 text-left",
                  settingsMode === "default" ? "border-[#101010]" : "border-[#e5e5e5]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-semibold leading-[22px] text-[#101010]">Use default settings</span>
                  <RadioDot selected={settingsMode === "default"} />
                </div>
                <span className="text-[13px] leading-[18px] text-[#666]">
                  Select from a list of quick-start defaults.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsMode("custom")}
                className={cn(
                  "flex-1 flex flex-col gap-1 p-4 rounded-xl border-2 text-left",
                  settingsMode === "custom" ? "border-[#101010]" : "border-[#e5e5e5]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-semibold leading-[22px] text-[#101010]">Use custom settings</span>
                  <RadioDot selected={settingsMode === "custom"} />
                </div>
                <span className="text-[13px] leading-[18px] text-[#666]">
                  Customize to print specific items and ticket types in settings.
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col p-6 gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
              >
                <ArrowLeft className="w-5 h-5 text-[#101010]" />
              </button>
              <DialogTitle className="flex-1 text-center font-semibold text-[17px] leading-[24px] text-[#101010]">
                Select a default
              </DialogTitle>
              <button
                type="button"
                onClick={handleDone}
                className="flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#101010] text-white rounded-full"
              >
                <span className="font-medium text-[15px] leading-6">Done</span>
              </button>
            </div>

            {/* Profile options */}
            <div className="flex flex-col">
              {defaultProfiles.map((profile, idx) => (
                <div key={profile.id} className="flex flex-col">
                  {profile.section && (
                    <p className="text-[13px] font-semibold text-[#101010] pt-4 pb-2">
                      {profile.section}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedProfile(profile.id)}
                    className={cn(
                      "flex items-center gap-4 py-4 w-full text-left",
                      idx < defaultProfiles.length - 1 && "border-b border-[#f0f0f0]"
                    )}
                  >
                    <profile.icon className="w-5 h-5 text-[#101010] shrink-0" />
                    <span className="flex-1 text-[15px] leading-[22px] text-[#101010] font-medium">
                      {profile.label}
                    </span>
                    <RadioDot selected={selectedProfile === profile.id} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useMemo } from "react";
import { X, ChevronLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type PrinterData,
  getPrintsSummary,
} from "@/lib/printer-data";

type Step = "select-printers" | "select-template";

export interface CreateGroupModalResult {
  selectedPrinterIds: string[];
  templatePrinterId: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printers: PrinterData[];
  onComplete: (result: CreateGroupModalResult) => void;
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

export function CreateGroupModal({
  open,
  onOpenChange,
  printers,
  onComplete,
}: CreateGroupModalProps) {
  const [step, setStep] = useState<Step>("select-printers");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");

  const selectedPrinters = useMemo(
    () => printers.filter((p) => selectedIds.has(p.id)),
    [printers, selectedIds]
  );

  const filteredPrintersStep1 = useMemo(() => {
    let list = printers;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.model?.toLowerCase().includes(q) ?? false)
      );
    }
    if (locationFilter !== "All") {
      list = list.filter((p) => (p.location ?? "—") === locationFilter);
    }
    return list;
  }, [printers, searchQuery, locationFilter]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("select-printers");
      setSelectedIds(new Set());
      setTemplateId(null);
      setSearchQuery("");
      setLocationFilter("All");
    }, 200);
  };

  const handleNextFromStep1 = () => {
    if (selectedIds.size >= 2) setStep("select-template");
  };

  const handleBack = () => {
    setStep("select-printers");
    setTemplateId(null);
  };

  const handleSkip = () => {
    setTemplateId(null);
    onComplete({
      selectedPrinterIds: Array.from(selectedIds),
      templatePrinterId: null,
    });
    handleClose();
  };

  const handleNextFromStep2 = () => {
    onComplete({
      selectedPrinterIds: Array.from(selectedIds),
      templatePrinterId: templateId,
    });
    handleClose();
  };

  const togglePrinter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canProceedStep1 = selectedIds.size >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[664px] max-w-[min(664px,calc(100%-2rem))] flex flex-col border-0 p-0 shadow-xl bg-white rounded-xl overflow-hidden max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-4">
          {step === "select-printers" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 -m-2 rounded-md text-[#666] hover:text-[#101010]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                disabled={!canProceedStep1}
                className={cn(
                  "min-h-[44px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6",
                  canProceedStep1
                    ? "bg-[#101010] text-white"
                    : "bg-black/10 text-[#666] cursor-not-allowed"
                )}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="p-2 -m-2 rounded-md text-[#666] hover:text-[#101010] flex items-center gap-1"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="min-h-[44px] px-4 py-2.5 rounded-full font-medium text-[15px] leading-6 border border-[#dadada] bg-white text-[#101010]"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="min-h-[44px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 bg-[#101010] text-white"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 min-h-0 px-6 pb-6 overflow-hidden">
          {step === "select-printers" ? (
            <>
              <h2 className="text-[22px] font-semibold leading-7 text-[#101010]">
                Add printers to group
              </h2>
              <p className="text-[14px] leading-[22px] text-[#666] mt-1">
                Select printers that share the exact same settings.
              </p>
              <div className="flex items-center gap-3 mt-6 min-h-12 px-3 py-2 border border-black/15 rounded-[6px]">
                <Search className="w-5 h-5 text-[#666] shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-[14px] leading-[22px] text-[#101010] placeholder:text-[#666] border-0 outline-none"
                />
              </div>
              <button
                type="button"
                className="mt-3 flex items-center gap-2 min-h-10 px-3 py-2 border border-black/15 rounded-[6px] w-full max-w-[200px] text-left text-[14px] leading-[22px] text-[#666]"
              >
                <span>Location</span>
                <span className="font-semibold text-[#101010]">{locationFilter}</span>
              </button>
              <div className="flex-1 overflow-y-auto mt-4 border border-black/5 rounded-lg divide-y divide-black/5">
                {filteredPrintersStep1.map((printer) => {
                  const checked = selectedIds.has(printer.id);
                  return (
                    <button
                      key={printer.id}
                      type="button"
                      onClick={() => togglePrinter(printer.id)}
                      className="flex items-center gap-4 w-full px-4 py-4 text-left hover:bg-black/[0.02]"
                    >
                      <img
                        src="/printer-image.png"
                        alt=""
                        className="w-10 h-10 object-contain shrink-0"
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium leading-[22px] text-[#101010]">
                          {printer.name}
                        </p>
                        <p className="text-[13px] leading-[18px] text-[#666]">
                          {printer.model}
                        </p>
                        <p className="text-[13px] leading-[18px] text-[#666] mt-0.5 truncate">
                          Prints {getPrintsSummary(printer).toLowerCase()}
                        </p>
                      </div>
                      <p className="text-[13px] leading-[18px] text-[#666] shrink-0">
                        {printer.location ?? "—"}
                      </p>
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePrinter(printer.id)}
                          className="size-5 rounded border-2 border-[rgba(0,0,0,0.42)]"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold leading-7 text-[#101010]">
                Select a printer to use as a template
              </h2>
              <p className="text-[14px] leading-[22px] text-[#666] mt-1">
                The printer you select will apply its settings to the group. Skip
                this step to start settings from scratch.
              </p>
              <div className="flex items-center gap-3 mt-6 min-h-12 px-3 py-2 border border-black/15 rounded-[6px]">
                <Search className="w-5 h-5 text-[#666] shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  className="flex-1 min-w-0 bg-transparent text-[14px] leading-[22px] text-[#101010] placeholder:text-[#666] border-0 outline-none"
                />
              </div>
              <button
                type="button"
                className="mt-3 flex items-center gap-2 min-h-10 px-3 py-2 border border-black/15 rounded-[6px] w-full max-w-[200px] text-left text-[14px] leading-[22px] text-[#666]"
              >
                <span>Locations</span>
                <span className="font-semibold text-[#101010]">All</span>
              </button>
              <div className="flex-1 overflow-y-auto mt-4 border border-black/5 rounded-lg divide-y divide-black/5">
                {selectedPrinters.map((printer) => {
                  const selected = templateId === printer.id;
                  return (
                    <button
                      key={printer.id}
                      type="button"
                      onClick={() => setTemplateId(printer.id)}
                      className="flex items-center gap-4 w-full px-4 py-4 text-left hover:bg-black/[0.02]"
                    >
                      <img
                        src="/printer-image.png"
                        alt=""
                        className="w-10 h-10 object-contain shrink-0"
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium leading-[22px] text-[#101010]">
                          {printer.name}
                        </p>
                        <p className="text-[13px] leading-[18px] text-[#666]">
                          {printer.model}
                        </p>
                        <p className="text-[13px] leading-[18px] text-[#666] mt-0.5 truncate">
                          Prints{" "}
                          {getPrintsSummary(printer).toLowerCase()} and online and
                          kiosk order tic...
                        </p>
                      </div>
                      <p className="text-[13px] leading-[18px] text-[#666] shrink-0">
                        {printer.location ?? "—"}
                      </p>
                      <RadioDot selected={selected} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

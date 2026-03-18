"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchField } from "@/components/ui/search-field";
import {
  type PrinterData,
  getPrintsSummary,
  CURRENT_LOCATION_NAME,
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
  /** When the modal opens, pre-select these printer IDs (e.g. from table selection). */
  initialSelectedIds?: string[];
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
  initialSelectedIds,
}: CreateGroupModalProps) {
  const [step, setStep] = useState<Step>("select-printers");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");

  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened && initialSelectedIds?.length) {
      setSelectedIds(new Set(initialSelectedIds));
      // If user already selected 2+ printers from the list, skip to template step
      if (initialSelectedIds.length >= 2) {
        setStep("select-template");
      }
    }
  }, [open, initialSelectedIds]);

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
      list = list.filter((p) => (p.location ?? CURRENT_LOCATION_NAME) === locationFilter);
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
      setTemplateSearchQuery("");
      setLocationFilter("All");
    }, 200);
  };

  const filteredSelectedPrinters = useMemo(() => {
    if (!templateSearchQuery.trim()) return selectedPrinters;
    const q = templateSearchQuery.trim().toLowerCase();
    return selectedPrinters.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.model?.toLowerCase().includes(q) ?? false)
    );
  }, [selectedPrinters, templateSearchQuery]);

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
                className="flex items-center justify-center p-3 rounded-full bg-black/5"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-[#101010]" />
              </button>
              <button
                type="button"
                onClick={handleNextFromStep1}
                disabled={!canProceedStep1}
                className={cn(
                  "min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6",
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
                className="flex items-center justify-center p-3 rounded-full bg-black/5"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6 text-[#101010]" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="min-h-[48px] px-4 py-2.5 rounded-full font-medium text-[15px] leading-6 border border-[#dadada] bg-white text-[#101010]"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  disabled={!templateId}
                  className={cn(
                    "min-h-[48px] px-5 py-2.5 rounded-full font-medium text-[15px] leading-6 disabled:pointer-events-none",
                    templateId
                      ? "bg-[#101010] text-white"
                      : "bg-black/10 text-[#666] cursor-not-allowed"
                  )}
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
              {printers.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <p className="text-[17px] font-semibold text-[#101010]">
                    No printers available for new groups
                  </p>
                  <p className="text-[15px] leading-6 text-[#666] mt-2 max-w-[320px]">
                    All printers are currently in printer groups. Remove a printer from its group to add it to a new one.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 items-stretch mt-6">
                    <SearchField
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="medium"
                      wrapperClassName="flex-1 min-h-[52px]"
                    />
                    <button
                      type="button"
                      className="flex items-center gap-2 min-h-[52px] px-3 py-2 border border-black/15 rounded-[8px] w-full max-w-[200px] text-left text-[14px] leading-[22px] text-[#666] shrink-0"
                    >
                      <span>Location</span>
                      <span className="font-semibold text-[#101010]">{locationFilter}</span>
                    </button>
                  </div>
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
                            {printer.location ?? CURRENT_LOCATION_NAME}
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
              )}
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
              <div className="flex gap-3 items-stretch mt-6">
                <SearchField
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  size="medium"
                  wrapperClassName="flex-1 min-h-[52px]"
                />
                <button
                  type="button"
                  className="flex items-center gap-2 min-h-[52px] px-3 py-2 border border-black/15 rounded-[8px] w-full max-w-[200px] text-left text-[14px] leading-[22px] text-[#666] shrink-0"
                >
                  <span>Locations</span>
                  <span className="font-semibold text-[#101010]">All</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto mt-4 border border-black/5 rounded-lg divide-y divide-black/5">
                {filteredSelectedPrinters.map((printer) => {
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
                        {printer.location ?? CURRENT_LOCATION_NAME}
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

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TicketAppearance } from "@/lib/printer-data";

interface EditAppearanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appearance: TicketAppearance;
  onSave: (appearance: TicketAppearance) => void;
}

const rows: {
  key: keyof TicketAppearance;
  label: string;
  description?: string;
}[] = [
  {
    key: "compactTicket",
    label: "Compact ticket",
    description: "Alternative ticket format best used for conserving paper.",
  },
  {
    key: "singleItemPerTicket",
    label: "Single item per ticket",
  },
  {
    key: "combineIdenticalItems",
    label: "Combine identical items",
    description:
      "Items with the same details will be automatically combined together into one line item",
  },
  {
    key: "includeTopPadding",
    label: "Include top padding",
    description: "Best for hanging tickets on a rail",
  },
  {
    key: "printKitchenNames",
    label: "Print kitchen names",
    description:
      "Items, variations and modifiers printed from this station will print with their kitchen names. Kitchen names can be set up on Square Dashboard.",
  },
];

export function EditAppearanceModal({
  open,
  onOpenChange,
  appearance,
  onSave,
}: EditAppearanceModalProps) {
  const [draft, setDraft] = useState<TicketAppearance>({ ...appearance });

  const toggle = (key: keyof TicketAppearance) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft({ ...appearance });
    }
    onOpenChange(isOpen);
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(appearance);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[664px] max-w-[min(664px,calc(100%-2rem))] sm:max-w-[664px] flex flex-col border-0 p-0 shadow-xl bg-white rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col px-8 py-6 gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]"
            >
              <X className="w-5 h-5 text-[#101010]" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full",
                hasChanges
                  ? "bg-[#101010] text-white"
                  : "bg-[#f0f0f0] text-[#999] cursor-not-allowed"
              )}
            >
              <span className="font-medium text-[15px] leading-6">Save</span>
            </button>
          </div>

          {/* Title */}
          <DialogTitle className="font-semibold text-[25px] leading-8 text-[#101010]">
            Edit ticket appearance
          </DialogTitle>

          {/* Rows */}
          <div className="flex flex-col">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center gap-4 py-4 border-b border-black/5"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[16px] leading-6 font-medium text-[#101010]">
                    {row.label}
                  </span>
                  {row.description && (
                    <span className="text-[14px] leading-[22px] text-[#666]">
                      {row.description}
                    </span>
                  )}
                </div>
                <ToggleSwitch
                  enabled={draft[row.key]}
                  onChange={() => toggle(row.key)}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative w-[40px] h-[24px] rounded-[100px] shrink-0 transition-colors",
        enabled
          ? "bg-[#101010]"
          : "border-2 border-solid border-[#959595] bg-transparent"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full transition-transform",
          enabled
            ? "left-[calc(100%-18px)] bg-white"
            : "left-[3px] bg-[#959595]"
        )}
      />
    </button>
  );
}

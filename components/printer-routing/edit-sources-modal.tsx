"use client";

import { useState } from "react";
import { X, Search, Monitor, Smartphone, Tablet, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type SourceDevice, type DeviceType, locationDevices } from "@/lib/printer-data";

const deviceIcon: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  "Square Terminal": Monitor,
  "Square Stand": Tablet,
  "Square Handheld": Smartphone,
};

interface EditSourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs of devices currently connected to this printer */
  selectedIds: Set<string>;
  onSave: (selectedIds: Set<string>) => void;
}

export function EditSourcesModal({
  open,
  onOpenChange,
  selectedIds,
  onSave,
}: EditSourcesModalProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedIds));
  const [query, setQuery] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(new Set(selectedIds));
      setQuery("");
    }
    onOpenChange(isOpen);
  };

  const filtered = locationDevices.filter((d) => {
    const q = query.toLowerCase();
    return (
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.deviceType.toLowerCase().includes(q) ||
      d.codeName.toLowerCase().includes(q)
    );
  });

  const allChecked = filtered.length > 0 && filtered.every((d) => draft.has(d.id));
  const someChecked = filtered.some((d) => draft.has(d.id)) && !allChecked;

  const toggleAll = () => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        filtered.forEach((d) => next.delete(d.id));
      } else {
        filtered.forEach((d) => next.add(d.id));
      }
      return next;
    });
  };

  const toggleDevice = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasChanges =
    draft.size !== selectedIds.size ||
    [...draft].some((id) => !selectedIds.has(id));

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[664px] max-w-[min(664px,calc(100%-2rem))] sm:max-w-[664px] max-h-[calc(100%-4rem)] flex flex-col border-0 p-0 shadow-xl bg-white rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col px-8 py-6 gap-6 overflow-hidden">
          {/* Header row */}
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

          {/* Title + subtitle */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <DialogTitle className="font-semibold text-[25px] leading-8 text-[#101010]">
              Edit POS sources at Brooklyn
            </DialogTitle>
            <p className="text-[14px] leading-[22px] text-[#666]">
              Select which order sources you'd like to connect to this printer.
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 border border-[#dadada] rounded-full w-full shrink-0">
            <Search className="w-5 h-5 text-[#666] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 text-[15px] leading-6 text-[#101010] placeholder:text-[#666] outline-none bg-transparent"
            />
          </div>

          {/* Device list */}
          <div className="flex flex-col overflow-y-auto scrollbar-hide -mx-1 px-1">
            {/* All channels row */}
            <div className="flex items-center gap-4 py-4 border-b border-black/5">
              <div className="flex-1 min-w-0">
                <span className="text-[16px] leading-6 font-medium text-[#101010]">
                  All channels
                </span>
              </div>
              <CheckboxButton
                checked={allChecked}
                indeterminate={someChecked}
                onChange={toggleAll}
              />
            </div>

            {/* Individual device rows */}
            {filtered.map((device, i) => {
              const Icon = deviceIcon[device.deviceType];
              const checked = draft.has(device.id);
              return (
                <div
                  key={device.id}
                  className={cn(
                    "flex items-center gap-4 py-4",
                    i < filtered.length - 1 && "border-b border-black/5"
                  )}
                >
                  <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-black/5">
                    <Icon className="w-6 h-6 text-[#101010]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[16px] leading-6 font-medium text-[#101010]">
                      {device.name}
                    </span>
                    <span className="text-[14px] leading-[22px] text-[#666]">
                      {device.deviceType}
                    </span>
                    <span className="text-[14px] leading-[22px] text-[#666]">
                      {device.codeName}
                    </span>
                  </div>
                  <CheckboxButton
                    checked={checked}
                    onChange={() => toggleDevice(device.id)}
                  />
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-8 text-center text-[15px] text-[#666]">
                No devices match your search.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxButton({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
        checked || indeterminate
          ? "bg-[#101010] border-[#101010]"
          : "border-[#959595]"
      )}
    >
      {checked && !indeterminate && (
        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      )}
      {indeterminate && (
        <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      )}
    </button>
  );
}

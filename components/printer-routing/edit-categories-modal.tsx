"use client";

import { useState, useCallback } from "react";
import { X, Search, ChevronDown, ChevronUp, ImageIcon, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type CategoryItem,
  printerCategories as categories,
  allPrinterCategoryIds as allCategoryIds,
} from "@/lib/printer-categories-copy";

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onSave: (ids: Set<string>) => void;
}

export function EditCategoriesModal({ open, onOpenChange, selectedIds, onSave }: EditCategoriesModalProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedIds));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleId = useCallback((id: string, cat?: CategoryItem) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (cat?.children) {
          cat.children.forEach((c) => next.delete(c.id));
        }
      } else {
        next.add(id);
        if (cat?.children) {
          cat.children.forEach((c) => next.add(c.id));
        }
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setDraft((prev) => {
      if (prev.size === allCategoryIds.length) return new Set();
      return new Set(allCategoryIds);
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(new Set(selectedIds));
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  const allSelected = draft.size === allCategoryIds.length;
  const someSelected = draft.size > 0 && !allSelected;

  const isParentChecked = (cat: CategoryItem) => {
    if (!cat.children) return draft.has(cat.id);
    return cat.children.every((c) => draft.has(c.id));
  };

  const isParentIndeterminate = (cat: CategoryItem) => {
    if (!cat.children) return false;
    const count = cat.children.filter((c) => draft.has(c.id)).length;
    return count > 0 && count < cat.children.length;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[664px] max-w-[min(664px,calc(100%-2rem))] sm:max-w-[664px] max-h-[calc(100%-4rem)] flex flex-col border-0 p-0 shadow-xl bg-white rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col p-6 gap-5 overflow-hidden">
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
              className={cn(
                "flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full",
                draft.size > 0
                  ? "bg-[#101010] text-white"
                  : "bg-[#f0f0f0] text-[#999]"
              )}
            >
              <span className="font-medium text-[15px] leading-6">Save</span>
            </button>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <DialogTitle className="font-semibold text-[25px] leading-8 text-[#101010]">
              Edit categories
            </DialogTitle>
            <p className="text-[15px] leading-[22px] text-[#666]">
              Select which categories will be sent to this printer.
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 border border-[#dadada] rounded-full w-full shrink-0">
            <Search className="w-5 h-5 text-[#666] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 text-[15px] leading-6 text-[#101010] placeholder:text-[#666] outline-none bg-transparent"
            />
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between py-2 border-b border-[#e5e5e5] shrink-0">
            <span className="text-[15px] font-semibold leading-[22px] text-[#101010]">Select all</span>
            <CheckboxButton
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
            />
          </div>

          {/* Category list */}
          <div className="flex flex-col overflow-y-auto scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => {
              const hasChildren = !!cat.children?.length;
              const isExpanded = expanded.has(cat.id);
              const checked = isParentChecked(cat);
              const indeterminate = isParentIndeterminate(cat);

              return (
                <div key={cat.id} className="flex flex-col">
                  <div className="flex items-center gap-3 py-3 border-b border-[#f0f0f0]">
                    {hasChildren ? (
                      <button type="button" onClick={() => toggleExpand(cat.id)} className="shrink-0 w-5 h-5 flex items-center justify-center text-[#999]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="w-5 h-5 shrink-0" />
                    )}
                    <div className="w-9 h-9 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-[#999]" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[15px] font-medium leading-[22px] text-[#101010]">{cat.name}</span>
                      <span className="text-[13px] leading-[18px] text-[#666]">
                        {hasChildren
                          ? `${cat.children!.length} subcategories, ${cat.itemCount} items`
                          : `${cat.itemCount} items`}
                      </span>
                    </div>
                    <CheckboxButton
                      checked={checked}
                      indeterminate={indeterminate}
                      onChange={() => toggleId(cat.id, cat)}
                    />
                  </div>

                  {/* Subcategories */}
                  {hasChildren && isExpanded && cat.children!.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 py-3 pl-10 border-b border-[#f0f0f0]">
                      <div className="w-5 h-5 shrink-0" />
                      <div className="w-9 h-9 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-[#999]" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[15px] font-medium leading-[22px] text-[#101010]">{sub.name}</span>
                        <span className="text-[13px] leading-[18px] text-[#666]">{sub.itemCount} items</span>
                      </div>
                      <CheckboxButton
                        checked={draft.has(sub.id)}
                        onChange={() => toggleId(sub.id)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
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
        "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center",
        checked || indeterminate ? "bg-[#101010] border-[#101010]" : "border-[#959595]"
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      {indeterminate && !checked && <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </button>
  );
}

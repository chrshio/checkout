"use client";

import { useState, useCallback } from "react";
import { X, ChevronDown, ChevronUp, ImageIcon, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import {
  type CategoryItem,
  printerCategories as categories,
  allPrinterCategoryIds as allCategoryIds,
  normalizePrinterCategoryIds,
} from "@/lib/printer-categories-copy";

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onSave: (ids: Set<string>) => void;
}

/** All leaf category ids under this node (for parent toggle / check state). */
function getLeafIdsUnder(cat: CategoryItem): string[] {
  if (!cat.children?.length) return [cat.id];
  return cat.children.flatMap(getLeafIdsUnder);
}

export function EditCategoriesModal({ open, onOpenChange, selectedIds, onSave }: EditCategoriesModalProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedIds));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleId = useCallback((id: string, cat?: CategoryItem) => {
    setDraft((prev) => {
      const next = new Set(prev);
      const leafIds = cat ? getLeafIdsUnder(cat) : [id];
      const allIn = leafIds.every((lid) => prev.has(lid));
      if (allIn) leafIds.forEach((lid) => next.delete(lid));
      else leafIds.forEach((lid) => next.add(lid));
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
      // When printer has "all categories" (empty or full), show everything selected in the list
      const normalized = normalizePrinterCategoryIds(selectedIds);
      setDraft(
        normalized.size === 0 || normalized.size === allCategoryIds.length
          ? new Set(allCategoryIds)
          : normalized
      );
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  const allSelected = draft.size === allCategoryIds.length;
  const someSelected = draft.size > 0 && !allSelected;

  const isParentChecked = (cat: CategoryItem) => {
    const leafIds = getLeafIdsUnder(cat);
    return leafIds.length > 0 && leafIds.every((id) => draft.has(id));
  };

  const isParentIndeterminate = (cat: CategoryItem) => {
    if (!cat.children?.length) return false;
    const leafIds = getLeafIdsUnder(cat);
    const selected = leafIds.filter((id) => draft.has(id));
    return selected.length > 0 && selected.length < leafIds.length;
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
                "flex items-center justify-center min-h-[48px] px-5 py-2.5 rounded-full",
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
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="medium"
            wrapperClassName="shrink-0"
          />

          {/* Select all */}
          <div className="flex items-center justify-between py-2 border-b border-[#e5e5e5] shrink-0">
            <span className="text-[15px] font-semibold leading-[22px] text-[#101010]">Select all</span>
            <CheckboxButton
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
            />
          </div>

          {/* Category list (recursive for nested groups) */}
          <div className="flex flex-col overflow-y-auto scrollbar-hide -mx-1 px-1">
            {categories.map((cat, i) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                depth={0}
                expanded={expanded}
                draft={draft}
                onToggleExpand={toggleExpand}
                onToggleId={toggleId}
                isParentChecked={isParentChecked}
                isParentIndeterminate={isParentIndeterminate}
                isLast={i === categories.length - 1}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({
  cat,
  depth,
  expanded,
  draft,
  onToggleExpand,
  onToggleId,
  isParentChecked,
  isParentIndeterminate,
  isLast = false,
}: {
  cat: CategoryItem;
  depth: number;
  expanded: Set<string>;
  draft: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleId: (id: string, cat?: CategoryItem) => void;
  isParentChecked: (c: CategoryItem) => boolean;
  isParentIndeterminate: (c: CategoryItem) => boolean;
  isLast?: boolean;
}) {
  const hasChildren = !!cat.children?.length;
  const isExpanded = expanded.has(cat.id);
  const checked = isParentChecked(cat);
  const indeterminate = isParentIndeterminate(cat);
  const indentPl = depth === 0 ? 0 : 40 + (depth - 1) * 24;
  const children = cat.children ?? [];
  const lastChildIndex = children.length - 1;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-3 py-3",
          !isLast && "border-b border-[#f0f0f0]"
        )}
        style={indentPl > 0 ? { paddingLeft: indentPl } : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(cat.id)}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-[#999]"
          >
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
          onChange={() => onToggleId(cat.id, cat)}
        />
      </div>
      {hasChildren && isExpanded &&
        children.map((sub, j) => (
          <CategoryRow
            key={sub.id}
            cat={sub}
            depth={depth + 1}
            expanded={expanded}
            draft={draft}
            onToggleExpand={onToggleExpand}
            onToggleId={onToggleId}
            isParentChecked={isParentChecked}
            isParentIndeterminate={isParentIndeterminate}
            isLast={isLast && j === lastChildIndex}
          />
        ))}
    </div>
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

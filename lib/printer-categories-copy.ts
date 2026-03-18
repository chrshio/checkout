/**
 * Shared category tree and subcopy rules for printer settings.
 * Uses the combined printer menu library (Standard/Cafe + QSR from POS Checkout).
 * Guidelines: "Categories & items" — all → "All categories, all items";
 * >3 categories → "[#] categories, [#] items"; ≤3 → show category + item list snippets.
 */

import {
  printerMenuGroups,
  allPrinterMenuCategoryIds as allPrinterMenuCategoryIdsFromLibrary,
} from "@/lib/printer-menu-library";

export interface CategoryItem {
  id: string;
  name: string;
  itemCount: number;
  /** Sample item names for list subcopy (ellipsis when long). */
  itemSnippet?: string;
  children?: CategoryItem[];
}

/** Combined categories: Beverages, Mains + flat list, top-level A–Z. */
export const printerCategories: CategoryItem[] =
  printerMenuGroups as CategoryItem[];

export const allPrinterCategoryIds = allPrinterMenuCategoryIdsFromLibrary;

/** Map legacy ids (std-*, qsr-*, or unprefixed) to current pr-* ids. */
const LEGACY_ID_TO_CURRENT: Record<string, string> = {
  coffees: "pr-coffees",
  "hot-teas": "pr-hot-teas",
  "iced-teas": "pr-iced-teas",
  beans: "pr-beans",
  merch: "pr-merch",
  featured: "pr-featured",
  teas: "pr-teas",
  bakery: "pr-bakery",
  "std-coffees": "pr-coffees",
  "std-hot-teas": "pr-hot-teas",
  "std-iced-teas": "pr-iced-teas",
  "std-beans": "pr-beans",
  "std-merch": "pr-merch",
  "std-featured": "pr-featured",
  "std-teas": "pr-teas",
  "std-bakery": "pr-bakery",
  "qsr-meals": "pr-meals",
  "qsr-smash-burgers": "pr-smash-burgers",
  "qsr-mains": "pr-mains-items",
  "qsr-loaded-fries-mac": "pr-loaded-fries-mac",
  "qsr-wings-bites": "pr-wings-bites",
  "qsr-sides": "pr-sides",
  "qsr-drinks": "pr-drinks",
};

/** Normalize legacy category ids to current ids. */
export function normalizePrinterCategoryIds(ids: Set<string> | string[]): Set<string> {
  const set = ids instanceof Set ? ids : new Set(ids);
  const all = new Set(allPrinterCategoryIds);
  const out = new Set<string>();
  set.forEach((id) => {
    if (all.has(id)) {
      out.add(id);
    } else {
      const mapped = LEGACY_ID_TO_CURRENT[id];
      if (mapped && all.has(mapped)) out.add(mapped);
    }
  });
  return out;
}

/** Flatten to leaf categories only (for count and list); recurses into nested children. */
function getLeafCategories(cats: CategoryItem[], selectedIds: Set<string>): { name: string; itemCount: number; itemSnippet?: string }[] {
  const out: { name: string; itemCount: number; itemSnippet?: string }[] = [];
  for (const c of cats) {
    if (c.children) {
      out.push(...getLeafCategories(c.children, selectedIds));
    } else if (selectedIds.has(c.id)) {
      out.push({ name: c.name, itemCount: c.itemCount, itemSnippet: c.itemSnippet });
    }
  }
  return out;
}

export type CategoriesSubcopy =
  | { type: "all"; text: string }
  | { type: "summary"; text: string; categoryCount: number; itemCount: number }
  | { type: "list"; categories: { name: string; itemCount: number; itemSnippet?: string }[] };

/**
 * Rules for "Categories & items" subcopy:
 * - All categories and all items selected → "All categories, all items"
 * - More than 3 categories selected → "[#] categories, [#] items"
 * - 3 or fewer → list of category name (count) + item snippet (with ellipsis if >3 lines)
 */
export function getCategoriesSubcopy(selectedIds: Set<string> | undefined | string[]): CategoriesSubcopy {
  const raw = selectedIds instanceof Set ? selectedIds : new Set(selectedIds ?? []);
  const ids = normalizePrinterCategoryIds(raw);
  const allIds = new Set(allPrinterCategoryIds);

  if (ids.size === 0 || ids.size === allIds.size) {
    return { type: "all", text: "All categories, all items" };
  }

  const leaves = getLeafCategories(printerCategories, ids);
  const categoryCount = leaves.length;
  const itemCount = leaves.reduce((s, l) => s + l.itemCount, 0);

  return {
    type: "list",
    categories: leaves.map((l) => ({
      name: l.name,
      itemCount: l.itemCount,
      itemSnippet: l.itemSnippet,
    })),
  };
}

/** One-line text for table/list (e.g. "All categories, all items" or "7 categories, 60 items"). */
export function getCategoriesShortText(selectedIds: Set<string> | undefined | string[]): string {
  const sub = getCategoriesSubcopy(selectedIds);
  if (sub.type === "all") return sub.text;
  if (sub.type === "summary") return sub.text;
  if (sub.type === "list") {
    return sub.categories.map((c) => `${c.name} (${c.itemCount})`).join(", ");
  }
  return "";
}

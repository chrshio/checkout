/**
 * Shared category tree and subcopy rules for printer settings.
 * Guidelines: "Categories & items" — all → "All categories, all items";
 * >3 categories → "[#] categories, [#] items"; ≤3 → show category + item list snippets.
 */

export interface CategoryItem {
  id: string;
  name: string;
  itemCount: number;
  /** Sample item names for list subcopy (ellipsis when long). */
  itemSnippet?: string;
  children?: CategoryItem[];
}

export const printerCategories: CategoryItem[] = [
  {
    id: "beverage",
    name: "Beverage",
    itemCount: 14,
    itemSnippet: "Drip coffee, Cold brew, Cafe au lait, Americano, Espresso, Macchiato",
    children: [
      { id: "coffee", name: "Coffee", itemCount: 7, itemSnippet: "Drip coffee, Cold brew, Cafe au lait, Americano, Espresso, Macchiato" },
      { id: "tea", name: "Tea", itemCount: 7, itemSnippet: "Iced tea, Hot tea, Matcha latte, London fog" },
    ],
  },
  { id: "specialty", name: "Specialty", itemCount: 6, itemSnippet: "Chai latte, Dirty chai, Matcha latte, Mocha, Hot chocolate" },
  { id: "kitchen", name: "Kitchen", itemCount: 6, itemSnippet: "Kitchen items" },
  { id: "uncategorized", name: "Uncategorized", itemCount: 6, itemSnippet: "Other items" },
];

function getAllIds(cats: CategoryItem[]): string[] {
  return cats.flatMap((c) => [c.id, ...(c.children ? getAllIds(c.children) : [])]);
}

export const allPrinterCategoryIds = getAllIds(printerCategories);

/** Flatten to leaf categories only (for count and list). */
function getLeafCategories(cats: CategoryItem[], selectedIds: Set<string>): { name: string; itemCount: number; itemSnippet?: string }[] {
  const out: { name: string; itemCount: number; itemSnippet?: string }[] = [];
  for (const c of cats) {
    if (c.children) {
      const selectedChildren = c.children.filter((ch) => selectedIds.has(ch.id));
      for (const ch of selectedChildren) {
        out.push({ name: ch.name, itemCount: ch.itemCount, itemSnippet: ch.itemSnippet });
      }
    } else {
      if (selectedIds.has(c.id)) {
        out.push({ name: c.name, itemCount: c.itemCount, itemSnippet: c.itemSnippet });
      }
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
  const ids = selectedIds instanceof Set ? selectedIds : new Set(selectedIds ?? []);
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

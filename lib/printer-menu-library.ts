/**
 * Combined menu library for printer routing: Standard (Cafe) + QSR from POS Checkout.
 * Used only when editing "categories and items" for printers. POS Checkout prototypes
 * keep their own menu-library and menu-library-qsr unchanged.
 *
 * Structure: two top-level groups.
 * - Beverages: all drink-related (Coffees, Hot teas, Iced teas, Drinks from QSR).
 * - Food Items: all food categories (Bakery, Beans, Featured, Loaded Fries & Mac, Mains, Meals, Merch, Sides, Teas, Wings & Bites).
 * Top-level sorted A–Z.
 */

import type { MenuCategory, MenuItem } from "./pos-types";
import {
  categories as stdCategories,
  featuredItems,
  teaItems,
  bakeryItems,
} from "./menu-library";
import {
  categoriesQSR,
  drinksItemsQSR,
  mainsItemsQSR,
  smashBurgerItemsQSR,
} from "./menu-library-qsr";

/** Single category or item group for the printer picker (leaf = selectable). */
export interface PrinterCategoryNode {
  id: string;
  name: string;
  itemCount: number;
  itemSnippet?: string;
  children?: PrinterCategoryNode[];
}

const P = "pr";

function toNode(
  cat: MenuCategory,
  id: string,
  name?: string
): PrinterCategoryNode {
  const items = cat.items ?? [];
  return {
    id,
    name: name ?? cat.name,
    itemCount: items.length,
    itemSnippet: items.slice(0, 6).map((i) => i.name).join(", "),
  };
}

function toNodeFromItems(
  id: string,
  name: string,
  items: MenuItem[]
): PrinterCategoryNode {
  return {
    id: `${P}-${id}`,
    name,
    itemCount: items.length,
    itemSnippet: items.slice(0, 6).map((i) => i.name).join(", "),
  };
}

// Standard (cafe) categories we use
const stdCoffees = stdCategories.find((c) => c.id === "coffees")!;
const stdHotTeas = stdCategories.find((c) => c.id === "hot-teas")!;
const stdIcedTeas = stdCategories.find((c) => c.id === "iced-teas")!;
const stdBeans = stdCategories.find((c) => c.id === "beans")!;
const stdMerch = stdCategories.find((c) => c.id === "merch")!;

/** Beverages: Coffees, Hot teas, Iced teas (Standard) + Drinks (QSR). */
const beveragesNode: PrinterCategoryNode = {
  id: `${P}-beverages`,
  name: "Beverages",
  itemCount:
    (stdCoffees.items?.length ?? 0) +
    (stdHotTeas.items?.length ?? 0) +
    (stdIcedTeas.items?.length ?? 0) +
    drinksItemsQSR.length,
  children: [
    toNode(stdCoffees, `${P}-coffees`, "Coffees"),
    toNode(stdHotTeas, `${P}-hot-teas`, "Hot teas"),
    toNode(stdIcedTeas, `${P}-iced-teas`, "Iced teas"),
    toNode(
      { id: "drinks", name: "Drinks", type: "category", items: drinksItemsQSR },
      `${P}-drinks`,
      "Drinks"
    ),
  ],
};

/** Mains: QSR Mains + Smash Burgers as subcategories. */
const mainsNode: PrinterCategoryNode = {
  id: `${P}-mains`,
  name: "Mains",
  itemCount: mainsItemsQSR.length + smashBurgerItemsQSR.length,
  children: [
    toNode(
      { id: "mains", name: "Mains", type: "category", items: mainsItemsQSR },
      `${P}-mains-items`,
      "Mains"
    ),
    toNode(
      {
        id: "smash-burgers",
        name: "Smash Burgers",
        type: "category",
        items: smashBurgerItemsQSR,
      },
      `${P}-smash-burgers`,
      "Smash Burgers"
    ),
  ],
};

/** All food categories (to nest under Food Items). */
const mealsCat = categoriesQSR.find((c) => c.id === "meals")!;
const loadedCat = categoriesQSR.find((c) => c.id === "loaded-fries-mac")!;
const wingsCat = categoriesQSR.find((c) => c.id === "wings-bites")!;
const sidesCat = categoriesQSR.find((c) => c.id === "sides")!;

const foodCategoryNodes: PrinterCategoryNode[] = [
  toNodeFromItems("bakery", "Bakery", bakeryItems),
  toNode(stdBeans, `${P}-beans`, "Beans"),
  toNodeFromItems("featured", "Featured", featuredItems),
  toNode(loadedCat, `${P}-loaded-fries-mac`, loadedCat.name),
  mainsNode,
  toNode(mealsCat, `${P}-meals`, mealsCat.name),
  toNode(stdMerch, `${P}-merch`, "Merch"),
  toNode(sidesCat, `${P}-sides`, sidesCat.name),
  toNodeFromItems("teas", "Teas", teaItems),
  toNode(wingsCat, `${P}-wings-bites`, wingsCat.name),
];

/** Sum of item counts for all leaves under these nodes. */
function sumLeafItemCount(nodes: PrinterCategoryNode[]): number {
  return nodes.reduce(
    (sum, n) =>
      sum + (n.children ? sumLeafItemCount(n.children) : n.itemCount),
    0
  );
}

/** All leaf category ids (for "Select all" and subcopy). */
export function getAllLeafIds(nodes: PrinterCategoryNode[]): string[] {
  return nodes.flatMap((n) =>
    n.children ? getAllLeafIds(n.children) : [n.id]
  );
}

/** Food Items: one top-level group containing all food categories (incl. Mains with its subcategories). */
const foodItemsNode: PrinterCategoryNode = {
  id: `${P}-food-items`,
  name: "Food Items",
  itemCount: sumLeafItemCount(foodCategoryNodes),
  children: foodCategoryNodes,
};

/** Top-level: Beverages and Food Items, sorted A–Z by name. */
const unsortedTopLevel: PrinterCategoryNode[] = [
  beveragesNode,
  foodItemsNode,
];

export const printerMenuGroups: PrinterCategoryNode[] = [...unsortedTopLevel].sort(
  (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
);

export const allPrinterMenuCategoryIds = getAllLeafIds(printerMenuGroups);

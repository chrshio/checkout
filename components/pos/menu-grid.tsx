"use client";

import { useState } from "react";
import { Search, Pencil, ArrowLeft, ChevronRight } from "lucide-react";
import { MenuTile } from "./menu-tile";
import type { Tile, TabType, MenuItem, MenuCategory } from "@/lib/pos-types";
import {
  featuredItems,
  categories,
  teaItems,
  bakeryItems,
  discountTiles,
} from "@/lib/menu-library";
import { cn } from "@/lib/utils";

interface MenuGridProps {
  onAddItem: (item: MenuItem) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: "keypad", label: "Keypad" },
  { id: "library", label: "Library" },
  { id: "cafe", label: "Cafe" },
];

// Flat list of all tiles shown on the root Cafe grid.
const rootTiles: Tile[] = [
  ...featuredItems,
  ...categories,
  ...teaItems,
  ...bakeryItems,
  ...discountTiles,
];

export function MenuGrid({ onAddItem }: MenuGridProps) {
  const [activeTab, setActiveTab] = useState<TabType>("cafe");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);

  const handleTileClick = (tile: Tile) => {
    if (tile.type === "item") {
      onAddItem(tile as MenuItem);
    } else if (tile.type === "category") {
      const cat = tile as MenuCategory;
      if (cat.items && cat.items.length > 0) {
        setSelectedCategory(cat);
      }
    }
  };

  const gridTiles: Tile[] = selectedCategory
    ? (selectedCategory.items ?? [])
    : rootTiles;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-end gap-4 pl-6 pr-6 pt-4 pb-4">
        {selectedCategory ? (
          /* ── Breadcrumb mode ─────────────────────────────────── */
          <>
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f0f0f0] shrink-0 transition-colors active:bg-[#e0e0e0]"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#101010]" />
            </button>

            <div className="flex items-end gap-2 flex-1 border-b border-[#f2f2f2]">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[19px] font-semibold text-[#959595] pb-2 transition-colors hover:text-[#666]"
              >
                Cafe
              </button>
              <ChevronRight className="w-4 h-4 text-[#c8c8c8] shrink-0 mb-[9px]" />
              <span className="text-[19px] font-semibold text-[#101010] pb-2 border-b-2 border-[#101010] -mb-px">
                {selectedCategory.name}
              </span>
            </div>
          </>
        ) : (
          /* ── Tabs mode ───────────────────────────────────────── */
          <div className="flex items-end gap-4 flex-1 border-b border-[#f2f2f2]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-[19px] font-semibold pb-2 transition-colors border-b-2",
                  activeTab === tab.id
                    ? "text-[#101010] border-[#101010]"
                    : "text-[#959595] border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons — always visible */}
        <div className="flex items-center gap-4">
          <button className="w-14 h-14 flex flex-col justify-center items-center rounded-full bg-[#f0f0f0] transition-colors">
            <Search className="w-5 h-5 text-[#101010]" />
          </button>
          <button className="w-14 h-14 flex flex-col justify-center items-center rounded-full bg-[#f0f0f0] transition-colors">
            <Pencil className="w-5 h-5 text-[#101010]" />
          </button>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto pl-4 pr-6 pb-4">
        <div className="grid grid-cols-5 gap-3">
          {gridTiles.map((tile) => (
            <MenuTile key={tile.id} tile={tile} onClick={handleTileClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

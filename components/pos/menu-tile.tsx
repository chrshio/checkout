"use client";

import Image from "next/image";
import type { Tile, MenuItem, MenuCategory, ActionTile, DiscountTile } from "@/lib/pos-types";
import { cn } from "@/lib/utils";

interface MenuTileProps {
  tile: Tile;
  onClick?: (tile: Tile) => void;
}

export function MenuTile({ tile, onClick }: MenuTileProps) {
  const handleClick = () => {
    if (tile.type === "item" && (tile as MenuItem).soldOut) return;
    onClick?.(tile);
  };

  // Get tile styling based on type
  const getTileStyles = () => {
    switch (tile.type) {
      case "category":
        return "bg-[#101010] text-[#ffffff]";
      case "action":
        const actionTile = tile as ActionTile;
        if (actionTile.variant === "success") {
          return "bg-[#00b23b] text-[#ffffff]";
        }
        return "bg-[#f0f0f0] text-[#101010]";
      case "discount":
        const discountTile = tile as DiscountTile;
        if (discountTile.variant === "success") {
          return "bg-[#e5ffea] text-[#007d2a]";
        }
        return "bg-[#e5ffea] text-[#101010]";
      case "item":
        const itemTile = tile as MenuItem;
        if (itemTile.soldOut) {
          return "bg-[#f0f0f0] text-[#959595] cursor-not-allowed opacity-60";
        }
        if (itemTile.image) {
          return "bg-[#f3f3f3] text-[#ffffff] overflow-hidden";
        }
        if (itemTile.category === "bakery") {
          return "bg-[#fff9e5] text-[#101010]";
        }
        return "bg-[#f0f0f0] text-[#101010]";
      default:
        return "bg-[#f0f0f0] text-[#101010]";
    }
  };

  // Shared content wrapper: same padding and alignment as first row (featured image tiles)
  const contentWrapperClass = "p-3 flex flex-col justify-end h-full";
  const mainLineClass = "font-medium text-sm text-left";

  const renderContent = () => {
    if (tile.type === "item") {
      const item = tile as MenuItem;
      if (item.image) {
        return (
          <div className="relative w-full h-full">
            <Image
              src={item.image}
              alt={item.name}
              fill
              loading="eager"
              className="object-cover"
            />
            {/* Gradient overlay per Figma: dark at bottom for text legibility */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
              aria-hidden
            />
            <div className={contentWrapperClass}>
              <p className={`${mainLineClass} text-white drop-shadow-sm`}>
                {item.name}
              </p>
              <p className="text-xs text-white/90 drop-shadow-sm text-left">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>
        );
      }
      // Item without image: name + price (or Sold out), same layout as image tiles
      return (
        <div className={contentWrapperClass}>
          <p className={mainLineClass}>{item.name}</p>
          <p className={item.soldOut ? "text-xs text-[#959595] line-through text-left" : "text-xs text-left opacity-90"}>
            {item.soldOut ? "Sold out" : `$${item.price.toFixed(2)}`}
          </p>
        </div>
      );
    }

    // Category: single line (menu group name only)
    if (tile.type === "category") {
      return (
        <div className={contentWrapperClass}>
          <p className={mainLineClass}>{tile.name}</p>
        </div>
      );
    }

    // Action / discount: single line only (no extra line)
    if (tile.type === "action" || tile.type === "discount") {
      return (
        <div className={contentWrapperClass}>
          <p className={mainLineClass}>{tile.name}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <button
      onClick={handleClick}
      disabled={tile.type === "item" && (tile as MenuItem).soldOut}
      className={cn(
        "relative rounded-lg aspect-[1.2] min-h-[110px] w-full transition-all overflow-hidden",
        "active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006aff] focus-visible:ring-offset-2",
        getTileStyles()
      )}
    >
      {renderContent()}
    </button>
  );
}

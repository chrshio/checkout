"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartHeaderProps {
  itemCount: number;
  disabled?: boolean;
}

export function CartHeader({ itemCount, disabled }: CartHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <h2 className="text-[19px] font-semibold text-[#101010]">
        {itemCount === 0
          ? "No items"
          : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      </h2>
      <button
        disabled={disabled}
        className={cn(
          "w-14 h-14 flex flex-col justify-center items-center p-4 rounded-full bg-[#f0f0f0] transition-colors",
          disabled && "opacity-40 cursor-default"
        )}
      >
        <MoreHorizontal className="w-5 h-5 text-[#101010]" />
      </button>
    </div>
  );
}

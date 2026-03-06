"use client";

import { cn } from "@/lib/utils";

interface PricingSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  isFaded?: boolean;
}

export function PricingSummary({ subtotal, tax, total, isFaded }: PricingSummaryProps) {
  return (
    <div className={cn("bg-[#ffffff] border border-[#e5e5e5] rounded-2xl py-3 px-4 transition-opacity", isFaded && "opacity-40")}>
      <div className="space-y-4">
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Subtotal</span>
          <span className="text-base">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Tax</span>
          <span className="text-base">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#101010]">
          <span className="font-medium text-base">Total</span>
          <span className="text-base">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

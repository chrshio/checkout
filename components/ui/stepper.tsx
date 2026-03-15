"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Stepper — quantity/counter control from Market Design System.
 * Figma: 01-Market-Design-System, node 29033:9412
 */
export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "Medium" | "Small";
  /** When true (e.g. inside a settings row), use narrower width 120px instead of 140px */
  inRow?: boolean;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = "Medium",
  inRow = false,
  className,
}: StepperProps) {
  const atMin = value <= min;
  const atMax = max != null && value >= max;
  const isSmall = size === "Small";

  const handleDecrease = () => {
    if (atMin) return;
    onChange(Math.max(min, value - 1));
  };

  const handleIncrease = () => {
    if (atMax) return;
    onChange(max != null ? Math.min(max, value + 1) : value + 1);
  };

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn(
        "flex items-center justify-between border rounded-full shrink-0 overflow-hidden",
        "w-[120px]",
        isSmall ? "min-h-[40px]" : "min-h-[48px]",
        disabled
          ? "border-[#f0f0f0] bg-[#f0f0f0]"
          : "border-[#dadada] bg-transparent",
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || atMin}
        aria-label="Decrease"
        className={cn(
          "flex items-center justify-center shrink-0 disabled:cursor-default",
          isSmall ? "min-h-[40px] px-[9px] py-2" : "min-h-[48px] p-3"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center min-w-6 min-h-6 rounded-full shrink-0",
            "bg-[#f0f0f0]"
          )}
        >
          <Minus
            className={cn(
              "w-4 h-4",
              disabled || atMin ? "text-[#959595]" : "text-[#101010]"
            )}
          />
        </span>
      </button>
      <span
        className={cn(
          "flex flex-col justify-center text-center text-[16px] leading-6 tabular-nums shrink-0",
          disabled ? "text-[#959595]" : "text-[#101010]"
        )}
        style={{ fontFeatureSettings: "'lnum' 1, 'tnum' 1" }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || atMax}
        aria-label="Increase"
        className={cn(
          "flex items-center justify-center shrink-0 disabled:cursor-default",
          isSmall ? "min-h-[40px] px-[9px] py-2" : "min-h-[48px] p-3"
        )}
      >
        <span className="flex items-center justify-center min-w-6 min-h-6 rounded-full shrink-0 bg-[#f0f0f0]">
          <Plus
            className={cn(
              "w-4 h-4",
              disabled || atMax ? "text-[#959595]" : "text-[#101010]"
            )}
          />
        </span>
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type StatusPillVariant,
  statusPillConfig,
} from "@/lib/printer-data";

export type { StatusPillVariant };

export interface StatusPillProps {
  variant: StatusPillVariant;
  /** Override the default label for this variant (e.g. "Disconnected" for offline). */
  label?: string;
  className?: string;
}

/** Shared status pill used for printer and connection status across prototypes. */
export function StatusPill({ variant, label, className }: StatusPillProps) {
  const config = statusPillConfig[variant];
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[13px] font-medium shrink-0",
        config.bg,
        config.text,
        className
      )}
    >
      {label ?? config.label}
    </span>
  );
}

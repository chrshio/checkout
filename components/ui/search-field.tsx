"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFieldProps extends Omit<React.ComponentProps<"input">, "className"> {
  /** "small" = 40px height, "medium" = 48px height. Default medium. */
  size?: "small" | "medium";
  /** Show clear (X) button when value is not empty. Default true. */
  clearable?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
}

/**
 * Search field per Market Design System (Figma): pill shape, search icon, "Search" placeholder.
 * Separate from TextField — no floating label; placeholder-only search input.
 */
function SearchField({
  size = "medium",
  clearable = true,
  wrapperClassName,
  inputClassName,
  value,
  onChange,
  onFocus,
  onBlur,
  ...inputProps
}: SearchFieldProps) {
  const [focused, setFocused] = React.useState(false);
  const hasValue = value != null && String(value).trim() !== "";

  const handleClear = () => {
    onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
  };

  const sizeClasses =
    size === "small"
      ? "min-h-[40px] px-4 py-2 gap-3"
      : "min-h-[48px] px-5 py-3 gap-3";

  return (
    <div
      className={cn(
        "flex items-center w-full rounded-full border border-[#dadada] bg-transparent transition-[border-color]",
        "focus-within:border-2 focus-within:border-[#101010]",
        sizeClasses,
        wrapperClassName
      )}
    >
      <Search
        className={cn(
          "shrink-0 text-[#666]",
          size === "small" ? "w-5 h-5" : "w-6 h-6"
        )}
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholder="Search"
        data-slot="search-field-input"
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none border-0 p-0",
          "text-[#101010] placeholder:text-[#666]",
          size === "small"
            ? "text-[14px] leading-[22px]"
            : "text-[16px] leading-[24px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        )}
        {...inputProps}
      />
      {clearable && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded-full p-1 text-[#666] active:opacity-80"
          aria-label="Clear search"
        >
          <X className={size === "small" ? "w-5 h-5" : "w-6 h-6"} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export { SearchField };

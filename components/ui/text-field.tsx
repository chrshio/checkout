"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends Omit<React.ComponentProps<"input">, "className"> {
  /** Label. When provided: empty state shows this text in the field; on focus or when filled, label moves above. When label is set, placeholder is not used for the empty state. */
  label?: string;
  /** Optional start adornment (e.g. Search icon). */
  startAdornment?: React.ReactNode;
  /** Used only when no label is provided. */
  placeholder?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

/**
 * Text field with native floating-label behavior. When label is provided: empty = label text in field; focus/filled = label above. Same behavior every time.
 */
function TextField({
  label,
  startAdornment,
  wrapperClassName,
  inputClassName,
  id: idProp,
  value,
  onFocus,
  onBlur,
  placeholder,
  ...inputProps
}: TextFieldProps) {
  const id = React.useId();
  const inputId = idProp ?? id;
  const [focused, setFocused] = useState(false);
  const hasValue = value != null && String(value).trim() !== "";
  const showLabelAbove = focused || hasValue;
  /** With label: empty state always shows label in the field. Without label: use placeholder. */
  const effectivePlaceholder = showLabelAbove ? undefined : (label != null ? label : (placeholder ?? ""));

  return (
    <div
      className={cn(
        "group flex items-center gap-3 w-full min-h-[64px] pl-4 pr-3 rounded-[8px] border border-[#dadada] transition-[border-color,padding]",
        "focus-within:border-[#101010] focus-within:border-2",
        showLabelAbove && label != null ? "py-2" : "py-3",
        wrapperClassName
      )}
    >
      {startAdornment != null && <div className="shrink-0">{startAdornment}</div>}
      <div className="flex flex-col flex-1 min-w-0 gap-0.5 justify-center">
        {label != null && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-[14px] font-medium leading-[22px] text-[#101010] shrink-0 transition-opacity",
              showLabelAbove ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none"
            )}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type="text"
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={effectivePlaceholder}
          data-slot="text-field-input"
          className={cn(
            "w-full min-w-0 bg-transparent text-[16px] leading-[24px] text-[#101010]",
            "placeholder:text-[#666] outline-none border-0 p-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
          {...inputProps}
        />
      </div>
    </div>
  );
}

export { TextField };

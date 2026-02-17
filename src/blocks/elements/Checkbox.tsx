"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "relative inline-flex cursor-pointer items-center justify-center",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
            "border-[#ddd] bg-white dark:border-slate-600 dark:bg-slate-900",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/50 peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            checked
              ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500"
              : !disabled && "hover:border-violet-500 dark:hover:border-violet-400",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 stroke-[2.5]" />}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

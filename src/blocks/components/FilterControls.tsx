"use client";

import { cn } from "@/lib/utils";

/** Responsive filter row - full width on mobile, wraps naturally, no min-width overflow */
export function FilterControls({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end",
        "min-w-0", // prevent overflow
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

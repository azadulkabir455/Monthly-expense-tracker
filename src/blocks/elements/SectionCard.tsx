"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional: use when children need theme-aware styling via parent */
  as?: "div" | "section";
}

/** Reusable section container with consistent border, shadow, padding - responsive by default */
const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ className, as: Comp = "div", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        "rounded-xl border p-3 shadow-card-lg sm:rounded-2xl sm:p-5 md:p-6",
        "border-[#ddd] bg-white",
        "dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl",
        className
      )}
      {...props}
    />
  )
);
SectionCard.displayName = "SectionCard";

/** Responsive section header - stacks on mobile, row on desktop */
export function SectionHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  );
}

/** Responsive section title - smaller on mobile */
export function SectionTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-bold capitalize sm:text-xl md:text-2xl",
        "text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

/** Section subtitle */
export function SectionSubtitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base",
        className
      )}
      {...props}
    />
  );
}

export { SectionCard };

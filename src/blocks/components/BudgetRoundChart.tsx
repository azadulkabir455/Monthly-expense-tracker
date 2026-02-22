"use client";

import { cn } from "@/lib/utils";
import { formatMoneyK } from "@/lib/utils";

interface BudgetRoundChartProps {
  label: string;
  value: number;
  /** Ring color - tailwind class or CSS variable */
  ringColor: string;
  /** Fill ratio 0-1 for partial ring, or 1 for full ring */
  fillRatio?: number;
  /** Optional subtitle */
  subtitle?: string;
  /** Size in px */
  size?: number;
  /** No shadow/bg - minimal chart */
  minimal?: boolean;
}

const STROKE = 8;

export function BudgetRoundChart({
  label,
  value,
  ringColor,
  fillRatio = 1,
  subtitle,
  size = 110,
  minimal = false,
}: BudgetRoundChartProps) {
  const strokeWidth = minimal ? 6 : STROKE;
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * Math.min(1, Math.max(0, fillRatio));

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        !minimal &&
          "rounded-xl border border-[#ddd] bg-white p-3 shadow-card-lg dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl sm:rounded-2xl sm:p-4"
      )}
    >
      <p className={cn("text-xs font-medium uppercase tracking-wider text-muted-foreground", minimal ? "mb-1" : "mb-2")}>
        {label}
      </p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-white/10"
          />
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            className={cn("transition-all duration-700 ease-out", ringColor)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-lg font-bold sm:text-xl",
              value >= 0 ? "text-foreground" : "text-red-600 dark:text-red-400"
            )}
          >
            {formatMoneyK(value)}
          </span>
          {subtitle && (
            <span className="mt-0.5 text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}

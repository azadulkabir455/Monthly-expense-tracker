"use client";

import { useAppSelector } from "@/store/hooks";
import { selectCurrentMonthSummary } from "@/store/slices/expensesSlice";
import { cn } from "@/lib/utils";

/** e.g. 25000 → 25k ৳ */
function formatMoneyK(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    const formatted = new Intl.NumberFormat("en", {
      minimumFractionDigits: k % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(k);
    return `${sign}${formatted}k ৳`;
  }
  return (
    sign +
    new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(abs) +
    " ৳"
  );
}

/** Short month name: February → Feb */
function shortMonth(monthLabel: string) {
  const parts = monthLabel.split(" ");
  if (parts[0]) return parts[0].slice(0, 3);
  return monthLabel;
}

/** Circle color: balance ratio (balance/income). High = green, low = red. */
function getCircleColor(totalIncome: number, balance: number) {
  if (totalIncome <= 0) return "rgb(239, 68, 68)"; // red
  const ratio = balance / totalIncome;
  if (ratio >= 0.6) return "rgb(34, 197, 94)"; // green
  if (ratio >= 0.3) return "rgb(234, 179, 8)"; // amber
  return "rgb(239, 68, 68)"; // red
}

const CIRCLE_SIZE = 140;
const STROKE = 10;
const R = (CIRCLE_SIZE - STROKE) / 2;
const C = CIRCLE_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function MonthlySummaryCardSection() {
  const monthly = useAppSelector(selectCurrentMonthSummary);
  if (!monthly) return null;

  const monthShort = shortMonth(monthly.monthLabel);
  const totalIncome = monthly.totalIncome;
  const balance = monthly.balance;
  const fillRatio =
    totalIncome > 0 ? Math.min(1, Math.max(0, balance / totalIncome)) : 0;
  const strokeDash = CIRCUMFERENCE * fillRatio;
  const circleColor = getCircleColor(totalIncome, balance);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-card-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      {/* Top: month name */}
      <div className="border-b border-white/10 px-6 py-4">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Month
        </p>
        <p className="text-2xl font-bold text-foreground">{monthShort}</p>
      </div>

      <div className="p-6">
        {/* Circle: fill = balance/income, color green → red as money runs out */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
            <svg
              width={CIRCLE_SIZE}
              height={CIRCLE_SIZE}
              className="-rotate-90"
              aria-hidden
            >
              {/* Background ring */}
              <circle
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="text-white/10 dark:text-white/5"
              />
              {/* Fill ring - color based on balance ratio */}
              <circle
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke={circleColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                Due
              </span>
              <span
                className={cn(
                  "text-xl font-bold",
                  balance >= 0
                    ? "text-violet-400 dark:text-violet-300"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {formatMoneyK(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats below circle */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/5 px-4 py-3 dark:bg-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total credit
            </p>
            <p className="mt-0.5 text-lg font-semibold text-violet-400 dark:text-violet-300">
              {formatMoneyK(monthly.totalIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 dark:bg-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total debit
            </p>
            <p className="mt-0.5 text-lg font-semibold text-red-600 dark:text-red-400">
              {formatMoneyK(monthly.totalExpense)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 dark:bg-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Due taka
            </p>
            <p
              className={cn(
                "mt-0.5 text-lg font-semibold",
                monthly.balance >= 0
                  ? "text-violet-400 dark:text-violet-300"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatMoneyK(monthly.balance)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3 dark:bg-white/5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Transactions
            </p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">
              {monthly.transactionCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

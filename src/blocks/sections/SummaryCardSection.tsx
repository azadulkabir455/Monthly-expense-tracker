"use client";

import { TrendingUp, TrendingDown, Wallet, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/blocks/elements/Card";
import type { Summary } from "@/types/expense";
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

/** e.g. 8 → 8 transactions */
function formatCount(c: number) {
  return new Intl.NumberFormat("en").format(c) + " transactions";
}

interface SummaryCardSectionProps {
  title: string;
  summary: Summary;
  className?: string;
}

export function SummaryCardSection({ title, summary, className }: SummaryCardSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Total credit
          </span>
          <span className="font-semibold text-violet-400 dark:text-violet-300">
            {formatMoneyK(summary.totalIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Total debit
          </span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatMoneyK(summary.totalExpense)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4 text-violet-500" />
            Balance
          </span>
          <span
            className={cn(
              "font-semibold",
              summary.balance >= 0 ? "text-violet-400 dark:text-violet-300" : "text-red-600 dark:text-red-400"
            )}
          >
            {formatMoneyK(summary.balance)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4" />
            Total transactions
          </span>
          <span className="font-medium text-foreground">
            {formatCount(summary.transactionCount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

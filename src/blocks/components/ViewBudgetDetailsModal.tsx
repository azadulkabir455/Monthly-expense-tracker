"use client";

import { createPortal } from "react-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/blocks/elements/Card";
import { Button } from "@/blocks/elements/Button";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import type { BudgetItem } from "@/types/budget";
import { X } from "lucide-react";

interface ViewBudgetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  year: number;
  month: number;
  items: BudgetItem[];
  /** Per expenseTypeId: total expense this month (for Month expense / Due columns) */
  expenseByTypeId?: Record<string, number>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ViewBudgetDetailsModal({
  open,
  onClose,
  categoryName,
  year,
  month,
  items,
  expenseByTypeId = {},
}: ViewBudgetDetailsModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const monthLabel = MONTH_NAMES[month - 1] ?? "";

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-budget-details-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <Card
        className={cn(
          "relative z-10 w-full max-w-md max-h-[85vh] flex flex-col",
          isDark && "border-white/10"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0 shrink-0">
          <CardTitle id="view-budget-details-title" className="text-lg">
            Budget details — {categoryName}
          </CardTitle>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pt-0 space-y-2">
          <p className="text-sm text-muted-foreground">
            {monthLabel} {year}
          </p>
          <div
            className={cn(
              "overflow-x-auto rounded-xl border",
              isDark ? "border-white/10" : "border-[#ddd]"
            )}
          >
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr
                  className={cn(
                    "border-b",
                    isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/80"
                  )}
                >
                  <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Budget (৳)</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Cost (৳)</th>
                  <th className="px-4 py-3 font-semibold text-foreground text-right">Due (৳)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const monthExpense = item.expenseTypeId ? (expenseByTypeId[item.expenseTypeId] ?? 0) : 0;
                  const due = item.amount - monthExpense;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b last:border-b-0",
                        isDark ? "border-white/5" : "border-slate-100"
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-right text-violet-600 dark:text-violet-400">
                        {formatMoneyK(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatMoneyK(monthExpense)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-medium",
                          due >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}
                      >
                        {formatMoneyK(due, { withSign: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}

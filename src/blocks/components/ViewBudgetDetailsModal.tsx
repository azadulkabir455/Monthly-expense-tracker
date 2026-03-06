"use client";

import { useState, useMemo } from "react";
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

/** Minimal shape for expense entries passed to modal (date, amount, type, name) */
export interface BudgetModalExpenseEntry {
  date: string;
  amount: number;
  expenseTypeId?: string;
  description?: string;
}

interface ViewBudgetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  year: number;
  month: number;
  items: BudgetItem[];
  /** Per expenseTypeId: total expense this month (for Month expense / Due columns) */
  expenseByTypeId?: Record<string, number>;
  /** All expense entries for this category this month (for per-type date-wise breakdown) */
  expenseEntries?: BudgetModalExpenseEntry[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function ViewBudgetDetailsModal({
  open,
  onClose,
  categoryName,
  year,
  month,
  items,
  expenseByTypeId = {},
  expenseEntries = [],
}: ViewBudgetDetailsModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const monthLabel = MONTH_NAMES[month - 1] ?? "";
  /** When set, show a modal with date-wise table for this type */
  const [detailType, setDetailType] = useState<{ typeId: string; typeName: string } | null>(null);

  /** Group entries by expenseTypeId then by day (only days with at least one entry) */
  const entriesByTypeId = useMemo(() => {
    const byType = new Map<string, Map<number, { name: string; amount: number }[]>>();
    for (const e of expenseEntries) {
      if (!e.expenseTypeId) continue;
      if (!byType.has(e.expenseTypeId)) byType.set(e.expenseTypeId, new Map());
      const byDay = byType.get(e.expenseTypeId)!;
      const day = new Date(e.date).getDate();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push({
        name: (e.description ?? "").trim() || "—",
        amount: e.amount,
      });
    }
    return byType;
  }, [expenseEntries]);

  /** For detail modal: rows per date (Date, Items list, Qty, Total) - only days with data */
  const detailTableRows = useMemo(() => {
    if (!detailType) return [];
    const byDay = entriesByTypeId.get(detailType.typeId);
    if (!byDay) return [];
    return Array.from(byDay.keys())
      .sort((a, b) => a - b)
      .map((day) => {
        const entries = byDay.get(day)!;
        const total = entries.reduce((s, x) => s + x.amount, 0);
        return { day, entries, qty: entries.length, total };
      });
  }, [detailType, entriesByTypeId]);

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
              "overflow-x-auto rounded-xl border overflow-y-auto max-h-[60vh]",
              isDark ? "border-white/10" : "border-[#ddd]"
            )}
          >
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="sticky top-0 z-20">
                <tr
                  className={cn(
                    "border-b",
                    isDark ? "border-white/10 bg-violet-950" : "border-[#ddd] bg-slate-100"
                  )}
                >
                  <th
                    className={cn(
                      "px-4 py-3 font-semibold text-foreground whitespace-nowrap",
                      isDark ? "bg-violet-950" : "bg-slate-100"
                    )}
                  >
                    Name
                  </th>
                  <th
                    className={cn(
                      "px-4 py-3 font-semibold text-foreground text-right whitespace-nowrap",
                      isDark ? "bg-violet-950" : "bg-slate-100"
                    )}
                  >
                    Budget (৳)
                  </th>
                  <th
                    className={cn(
                      "px-4 py-3 font-semibold text-foreground text-right whitespace-nowrap",
                      isDark ? "bg-violet-950" : "bg-slate-100"
                    )}
                  >
                    Cost (৳)
                  </th>
                  <th
                    className={cn(
                      "px-4 py-3 font-semibold text-foreground text-right whitespace-nowrap",
                      isDark ? "bg-violet-950" : "bg-slate-100"
                    )}
                  >
                    Due (৳)
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const monthExpense = item.expenseTypeId ? (expenseByTypeId[item.expenseTypeId] ?? 0) : 0;
                  const due = item.amount - monthExpense;
                  const isEqual = item.amount > 0 && item.amount === monthExpense;
                  const isOver = monthExpense > item.amount;
                  const canOpenDetail = !!item.expenseTypeId;
                  return (
                    <tr
                      key={item.id}
                      role={canOpenDetail ? "button" : undefined}
                      tabIndex={canOpenDetail ? 0 : undefined}
                      onClick={() =>
                        canOpenDetail &&
                        setDetailType({ typeId: item.expenseTypeId!, typeName: item.name })
                      }
                      onKeyDown={(e) => {
                        if (canOpenDetail && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setDetailType({ typeId: item.expenseTypeId!, typeName: item.name });
                        }
                      }}
                      className={cn(
                        "border-b last:border-b-0",
                        isDark ? "border-white/5" : "border-slate-100",
                        isEqual && (isDark ? "bg-emerald-500/20" : "bg-emerald-500/15"),
                        isOver && (isDark ? "bg-red-500/20" : "bg-red-500/15"),
                        canOpenDetail && (isDark ? "cursor-pointer hover:bg-white/5" : "cursor-pointer hover:bg-slate-50")
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-right text-violet-600 dark:text-violet-400 whitespace-nowrap">
                        {formatMoneyK(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                        {formatMoneyK(monthExpense)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-medium whitespace-nowrap",
                          due >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}
                      >
                        {formatMoneyK(due, { withSign: true })}
                      </td>
                    </tr>
                  );
                })}
                {items.length > 0 && (() => {
                  const totalBudget = items.reduce((s, i) => s + i.amount, 0);
                  const totalCost = items.reduce((s, i) => {
                    const exp = i.expenseTypeId ? (expenseByTypeId[i.expenseTypeId] ?? 0) : 0;
                    return s + exp;
                  }, 0);
                  const totalDue = totalBudget - totalCost;
                  return (
                    <tr
                      className={cn(
                        "border-t-2 font-semibold",
                        isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"
                      )}
                    >
                      <td className="px-4 py-3 text-foreground">Total</td>
                      <td className="px-4 py-3 text-right text-violet-600 dark:text-violet-400">
                        {formatMoneyK(totalBudget)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatMoneyK(totalCost)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right",
                          totalDue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}
                      >
                        {formatMoneyK(totalDue, { withSign: true })}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail modal: date-wise table for selected type (Date, Items, Qty, Total) */}
      {detailType &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-budget-type-detail-title"
          >
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailType(null)}
              aria-hidden
            />
            <Card
              className={cn(
                "relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col",
                isDark && "border-white/10"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                <CardTitle id="view-budget-type-detail-title" className="text-base">
                  {detailType.typeName} — {monthLabel} {year}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailType(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pt-0">
                {detailTableRows.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No expenses this month</p>
                ) : (
                  <div className="space-y-3">
                    {detailTableRows.map(({ day, entries, total }) => (
                      <div
                        key={day}
                        className={cn(
                          "rounded-xl border overflow-hidden",
                          isDark ? "border-white/15 bg-white/5" : "border-[#ddd] bg-slate-50/50"
                        )}
                      >
                        {/* Header: date */}
                        <div
                          className={cn(
                            "px-4 py-2.5 font-semibold text-foreground",
                            isDark ? "bg-violet-950/60 border-b border-white/10" : "bg-slate-100 border-b border-[#ddd]"
                          )}
                        >
                          {day} {monthLabel}
                        </div>
                        {/* Body: item name left, amount right */}
                        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
                          {entries.map((x, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                            >
                              <span className="text-foreground min-w-0 truncate">{x.name}</span>
                              <span className="font-medium text-foreground whitespace-nowrap shrink-0">
                                {formatMoneyK(x.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Footer: total left, total amount right */}
                        <div
                          className={cn(
                            "flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold border-t",
                            isDark ? "border-white/10 bg-white/5 text-foreground" : "border-[#ddd] bg-slate-100/80 text-foreground"
                          )}
                        >
                          <span>Total</span>
                          <span className="whitespace-nowrap">{formatMoneyK(total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>,
          document.body
        )}
    </div>,
    document.body
  );
}

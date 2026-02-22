"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectExpensesFiltered } from "@/store/slices/expensesSlice";
import { useExpenseCategories, useExpenseTypes, useExpenseEntries } from "@/lib/firebase/expenses";
import { useBudgetItems } from "@/lib/firebase/budget";
import { useThemeContext } from "@/context/ThemeContext";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { useStartYear } from "@/hooks/useStartYear";
import { useClientDate } from "@/hooks/useClientDate";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
import { DynamicIcon } from "lucide-react/dynamic";
import { FolderOpen } from "lucide-react";
import type { ExpenseCategory } from "@/types/expenseCategory";
import { Skeleton } from "@/blocks/elements/Skeleton";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Circle color: high monthly spend in this category = red, low = green */
function getCircleColor(ratio: number) {
  if (ratio >= 0.7) return "rgb(239, 68, 68)";
  if (ratio >= 0.4) return "rgb(234, 179, 8)";
  return "rgb(34, 197, 94)";
}

const CIRCLE_SIZE = 80;
const STROKE = 8;
const getR = (size: number) => (size - STROKE) / 2;
const getC = (size: number) => size / 2;
const getCircumference = (size: number) => 2 * Math.PI * getR(size);

interface CategoryCardData {
  category: ExpenseCategory;
  debit: number;
  credit: number;
  due: number;
  monthTransaction: number;
}

export function CategoryWiseSummarySection() {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const startYear = useStartYear();
  const { year: currentYear, month: currentMonth0, isClient } = useClientDate();
  const currentMonth = currentMonth0 + 1;
  const years = useMemo(
    () =>
      Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i),
    [currentYear, startYear]
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const { categories: expenseCategories, loading: categoriesLoading } = useExpenseCategories();
  const { types: expenseTypes, loading: typesLoading } = useExpenseTypes();
  useExpenseEntries();
  const { items: budgetItems, loading: budgetLoading } = useBudgetItems(selectedYear, selectedMonth);

  const monthExpenseItems = useAppSelector((state) =>
    selectExpensesFiltered(state, selectedYear, selectedMonth)
  );

  useEffect(() => {
    if (isClient) {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    }
  }, [isClient, currentYear, currentMonth]);

  const selectedMonthLabel = MONTH_NAMES[selectedMonth - 1] ?? "Jan";

  /** Per category: debit (budget), credit (current month expense entries total), due = debit - credit, monthTransaction (days with transaction) */
  const categoryCardData = useMemo((): CategoryCardData[] => {
    return expenseCategories.map((category) => {
      const typeIds = expenseTypes
        .filter((t) => t.categoryId === category.id)
        .map((t) => t.id);
      const debit = budgetItems
        .filter((b) => b.categoryId === category.id)
        .reduce((s, b) => s + b.amount, 0);
      const entriesInCategory = monthExpenseItems.filter(
        (e) => e.type === "expense" && e.expenseTypeId && typeIds.includes(e.expenseTypeId)
      );
      const credit = entriesInCategory.reduce((s, e) => s + e.amount, 0);
      const due = debit - credit;
      const daysWithTransaction = new Set(
        entriesInCategory.map((e) => new Date(e.date).getDate())
      ).size;

      return {
        category,
        debit,
        credit,
        due,
        monthTransaction: daysWithTransaction,
      };
    });
  }, [expenseCategories, expenseTypes, budgetItems, monthExpenseItems]);

  const loading = categoriesLoading || typesLoading || budgetLoading;

  return (
    <SectionCard>
      <SectionHeader>
        <div className="min-w-0 flex-1">
          <SectionTitle>Expense By Category</SectionTitle>
          <SectionSubtitle className="hidden sm:block">
            View Your Spending Breakdown By Grocery, Business, Study, Medicine & More
          </SectionSubtitle>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px] sm:shrink-0">
          <MonthYearDatePicker
            years={years}
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            label=""
            className="w-full"
          />
        </div>
      </SectionHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl sm:rounded-2xl" />
          ))}
        </div>
      ) : categoryCardData.length === 0 ? (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No expense categories yet. Add categories from the Expense Category page.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categoryCardData.map((item) => {
            const preset = GRADIENT_PRESETS[item.category.gradientPreset as keyof typeof GRADIENT_PRESETS] ?? GRADIENT_PRESETS.violet;
            const gradientStyle = {
              background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
            };
            const fillRatio =
              item.debit > 0 ? Math.min(1, item.credit / item.debit) : (item.credit > 0 ? 1 : 0);
            const size = CIRCLE_SIZE;
            const R = getR(size);
            const C = getC(size);
            const circumference = getCircumference(size);
            const strokeDash = circumference * fillRatio;
            const circleColor = getCircleColor(fillRatio);

            return (
              <div
                key={item.category.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl text-white shadow-float sm:rounded-2xl"
                style={gradientStyle}
              >
                {/* Top: Year + Month */}
                <div className="border-b border-white/20 px-3 py-2 sm:px-4 sm:py-2">
                  <p className="text-xs font-medium capitalize tracking-wider opacity-90">
                    Year · Month
                  </p>
                  <p className="text-base font-bold sm:text-lg">{selectedYear}</p>
                  <p className="text-xs font-medium opacity-90 sm:text-sm">{selectedMonthLabel}</p>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  {/* Category icon + label */}
                  <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 sm:h-9 sm:w-9">
                      <DynamicIcon
                        name={(item.category.icon as string) || "folder"}
                        fallback={FolderOpen}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        strokeWidth={2}
                      />
                    </span>
                    <p className="truncate text-sm font-semibold capitalize opacity-95 sm:text-base">
                      {item.category.name}
                    </p>
                  </div>

                  {/* Circle */}
                  <div className="flex justify-center">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg
                        width={size}
                        height={size}
                        className="-rotate-90"
                        aria-hidden
                      >
                        <circle
                          cx={C}
                          cy={C}
                          r={R}
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth={STROKE}
                        />
                        <circle
                          cx={C}
                          cy={C}
                          r={R}
                          fill="none"
                          stroke={circleColor}
                          strokeWidth={STROKE}
                          strokeLinecap="round"
                          strokeDasharray={`${strokeDash} ${circumference}`}
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Stats: Debit, Credit, Due, Month transaction – 2×2 */}
                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                        Debit
                      </p>
                      <p className="truncate text-xs font-semibold sm:text-sm">
                        {formatMoneyK(item.debit)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                        Credit
                      </p>
                      <p className="truncate text-xs font-semibold sm:text-sm">
                        {formatMoneyK(item.credit)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                        Due
                      </p>
                      <p className="truncate text-xs font-semibold sm:text-sm">
                        {formatMoneyK(item.due, { withSign: true })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                        Month transaction
                      </p>
                      <p className="truncate text-xs font-semibold sm:text-sm">
                        {item.monthTransaction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

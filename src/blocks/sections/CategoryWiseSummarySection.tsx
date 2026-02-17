"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useThemeContext } from "@/context/ThemeContext";
import {
  selectCategoryWiseByYearAndMonth,
  selectBudgetItemsForMonth,
} from "@/store/slices/expensesSlice";
import { ShoppingCart, Briefcase, BookOpen, Pill, FolderOpen } from "lucide-react";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { useStartYear } from "@/hooks/useStartYear";
import { useClientDate } from "@/hooks/useClientDate";
import type { LucideIcon } from "lucide-react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { formatMoneyK } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  basar: ShoppingCart,
  bebosar: Briefcase,
  study: BookOpen,
  medicine: Pill,
  other: FolderOpen,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  basar: "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700",
  bebosar: "bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600",
  study: "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500",
  medicine: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600",
  other: "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Budget item name (lowercase) -> MAIN_EXPENSE_CATEGORIES id for baki taka */
const BUDGET_NAME_TO_CATEGORY: Record<string, string> = {
  bazar: "basar",
  grocery: "basar",
  basar: "basar",
  business: "bebosar",
  bebosar: "bebosar",
  study: "study",
  medicine: "medicine",
  "house rent": "other",
  utilities: "other",
  rent: "other",
  other: "other",
};

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

  useEffect(() => {
    if (isClient) {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    }
  }, [isClient, currentYear, currentMonth]);

  const categoryWise = useAppSelector((state) =>
    selectCategoryWiseByYearAndMonth(state, selectedYear, selectedMonth)
  );
  const budgetItems = useAppSelector((state) =>
    selectBudgetItemsForMonth(state, selectedYear, selectedMonth)
  );
  const selectedMonthLabel = MONTH_NAMES[selectedMonth - 1] ?? "Jan";

  /** Budget amount for category (sum of budget items whose name maps to this category) */
  const getBudgetForCategory = (categoryId: string) => {
    return budgetItems.reduce((sum, b) => {
      const key = b.name.toLowerCase().trim().replace(/\s+/g, " ");
      const mapped = BUDGET_NAME_TO_CATEGORY[key];
      if (mapped === categoryId) return sum + b.amount;
      return sum;
    }, 0);
  };

  const maxMonthly = useMemo(() => {
    return Math.max(...categoryWise.map((c) => c.monthlyTotal), 1);
  }, [categoryWise]);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categoryWise.map((item) => {
          const Icon = CATEGORY_ICONS[item.categoryId] ?? FolderOpen;
          const gradient = CATEGORY_GRADIENTS[item.categoryId] ?? CATEGORY_GRADIENTS.other;
          const fillRatio = maxMonthly > 0 ? Math.min(1, item.monthlyTotal / maxMonthly) : 0;
          const size = CIRCLE_SIZE;
          const R = getR(size);
          const C = getC(size);
          const circumference = getCircumference(size);
          const strokeDash = circumference * fillRatio;
          const circleColor = getCircleColor(fillRatio);

          return (
            <div
              key={item.categoryId}
              className={`${gradient} flex min-w-0 flex-col overflow-hidden rounded-xl text-white shadow-float sm:rounded-2xl`}
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
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                  </span>
                  <p className="truncate text-sm font-semibold capitalize opacity-95 sm:text-base">
                    {item.label}
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

                {/* Stats: Debit, Credit, Balance, Transaction – 2×2 */}
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
                  <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                    <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                      Debit
                    </p>
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {formatMoneyK(item.total)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                    <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                      Credit
                    </p>
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {formatMoneyK(item.monthlyTotal)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                    <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                      Balance
                    </p>
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {formatMoneyK(
                        Math.max(0, getBudgetForCategory(item.categoryId) - item.monthlyTotal)
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                    <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">
                      Transaction
                    </p>
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {item.count}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

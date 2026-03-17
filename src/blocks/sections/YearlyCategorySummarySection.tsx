"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useExpenseCategories, useExpenseTypes, useExpenseEntries } from "@/lib/firebase/expenses";
import { useYearlyCategories, useYearlyTypes } from "@/lib/firebase/yearly";
import { useYearlyBudgetDebitDoc } from "@/lib/firebase/budget";
import { useThemeContext } from "@/context/ThemeContext";
import { useCalendarYears } from "@/hooks/useCalendarYears";
import { useClientDate } from "@/hooks/useClientDate";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { useLanguage } from "@/context/LanguageContext";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
import { DynamicIcon } from "lucide-react/dynamic";
import { FolderOpen } from "lucide-react";
import type { ExpenseCategory } from "@/types/expenseCategory";
import { Skeleton } from "@/blocks/elements/Skeleton";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";

/** Circle color: high spend ratio = red, low = green */
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

interface YearlyCategoryCardData {
  category: ExpenseCategory;
  debit: number;
  credit: number;
  due: number;
  transaction: number;
}

export function YearlyCategorySummarySection() {
  const { theme } = useThemeContext();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  const { year: currentYear, isClient } = useClientDate();
  const years = useCalendarYears(currentYear);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { categories: monthlyCategories } = useExpenseCategories();
  const { types: monthlyTypes } = useExpenseTypes();
  const { categories: yearlyCategories, loading: categoriesLoading } = useYearlyCategories();
  const { types: yearlyTypes, loading: typesLoading } = useYearlyTypes();
  useExpenseEntries();
  const { amounts: yearlyDebitAmounts } = useYearlyBudgetDebitDoc(selectedYear);

  const allExpensesForYear = useAppSelector((state) =>
    state.expenses.items.filter((e) => e.type === "expense" && e.year === selectedYear)
  );

  useEffect(() => {
    if (isClient) setSelectedYear(currentYear);
  }, [isClient, currentYear]);

  const yearlyCardData = useMemo((): YearlyCategoryCardData[] => {
    return yearlyCategories.map((category) => {
      const debit = typeof yearlyDebitAmounts[category.id] === "number" ? yearlyDebitAmounts[category.id]! : 0;
      const linkedMonthlyIds = new Set(
        monthlyCategories.filter((c) => c.yearlyCategoryId === category.id).map((c) => c.id)
      );
      const monthlyTypeIdsByCat = new Map<string, Set<string>>();
      for (const c of monthlyCategories) {
        if (!linkedMonthlyIds.has(c.id)) continue;
        monthlyTypeIdsByCat.set(c.id, new Set(monthlyTypes.filter((t) => t.categoryId === c.id).map((t) => t.id)));
      }
      const yearlyTypeIds = new Set(yearlyTypes.filter((t) => t.categoryId === category.id).map((t) => t.id));
      let credit = 0;
      const daysWithTransaction = new Set<string>();
      for (const e of allExpensesForYear) {
        if (!e.expenseTypeId) continue;
        const typeIds = monthlyTypeIdsByCat.get(e.category);
        if (typeIds?.has(e.expenseTypeId)) {
          credit += e.amount ?? 0;
          daysWithTransaction.add(e.date);
          continue;
        }
        if (e.category === category.id && yearlyTypeIds.has(e.expenseTypeId)) {
          credit += e.amount ?? 0;
          daysWithTransaction.add(e.date);
        }
      }
      const transaction = daysWithTransaction.size;
      const due = debit - credit;
      return { category, debit, credit, due, transaction };
    });
  }, [yearlyCategories, yearlyDebitAmounts, monthlyCategories, monthlyTypes, yearlyTypes, allExpensesForYear]);

  const loading = categoriesLoading || typesLoading;

  return (
    <SectionCard>
      <SectionHeader>
        <div className="min-w-0 flex-1">
          <SectionTitle>{t("yearlyCategorySummary_title")}</SectionTitle>
          <SectionSubtitle className="hidden sm:block">
            {t("yearlyCategorySummary_subtitle")}
          </SectionSubtitle>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[120px] sm:shrink-0">
          <MonthYearDatePicker
            years={years}
            year={selectedYear}
            onYearChange={setSelectedYear}
            mode="year-only"
            label=""
            className="w-full"
          />
        </div>
      </SectionHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: Math.max(yearlyCategories.length, 2) }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl sm:rounded-2xl" />
          ))}
        </div>
      ) : yearlyCardData.length === 0 ? (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No yearly categories yet. Add from Yearly Expense → Category.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {yearlyCardData.map((item) => {
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
                <div className="border-b border-white/20 px-3 py-2 sm:px-4 sm:py-2">
                  <p className="text-xs font-medium capitalize tracking-wider opacity-90">
                    Year
                  </p>
                  <p className="text-base font-bold sm:text-lg">{selectedYear}</p>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
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

                  <div className="flex justify-center">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg width={size} height={size} className="-rotate-90" aria-hidden>
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

                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">Debit</p>
                      <p className="truncate text-xs font-semibold sm:text-sm">{formatMoneyK(item.debit)}</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">Cost</p>
                      <p className="truncate text-xs font-semibold sm:text-sm">{formatMoneyK(item.credit)}</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">Due</p>
                      <p className="truncate text-xs font-semibold sm:text-sm">{formatMoneyK(item.due, { withSign: true })}</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-1.5 py-1 sm:px-2 sm:py-1.5">
                      <p className="truncate text-[10px] font-medium capitalize tracking-wider opacity-90 sm:text-xs">Transaction</p>
                      <p className="truncate text-xs font-semibold sm:text-sm">{item.transaction}</p>
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

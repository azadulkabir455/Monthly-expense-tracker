"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useAppSelector } from "@/store/hooks";
import { useExpenseCategories, useExpenseTypes, useExpenseEntries } from "@/lib/firebase/expenses";
import { useBudgetDebitForYear, useBudgetItemsForYear } from "@/lib/firebase/budget";
import { useThemeContext } from "@/context/ThemeContext";
import { useStartYear } from "@/hooks/useStartYear";
import { useClientDate } from "@/hooks/useClientDate";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { FilterControls } from "@/blocks/components/FilterControls";
import { Checkbox } from "@/blocks/elements/Checkbox";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { formatK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MONTH_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Months" },
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CreditDebitChartSection() {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const startYear = useStartYear();
  const { year: currentYear, month: currentMonth0 } = useClientDate();
  const currentMonth = currentMonth0 + 1;
  const years = useMemo(
    () =>
      Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i),
    [currentYear, startYear]
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [viewAllMonths, setViewAllMonths] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { categories: expenseCategories } = useExpenseCategories();
  const { types: expenseTypes } = useExpenseTypes();
  useExpenseEntries();
  const { debitByMonth: budgetDebitByMonth } = useBudgetDebitForYear(selectedYear);
  const { items: budgetItemsForYear } = useBudgetItemsForYear(selectedYear);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [expenseCategories]
  );

  const typeIdsForCategory = useMemo(
    () =>
      selectedCategory === "all"
        ? null
        : expenseTypes.filter((t) => t.categoryId === selectedCategory).map((t) => t.id),
    [selectedCategory, expenseTypes]
  );

  const allItems = useAppSelector((state) => state.expenses.items);

  const filteredItems = useMemo(() => {
    if (typeIdsForCategory === null) return allItems;
    return allItems.filter(
      (e) =>
        e.type === "expense" &&
        e.expenseTypeId &&
        typeIdsForCategory.includes(e.expenseTypeId)
    );
  }, [allItems, typeIdsForCategory]);

  const showDaily = !viewAllMonths;
  const monthNum = selectedMonth;
  const daysInMonth = new Date(selectedYear, monthNum, 0).getDate();

  const dailyData = useMemo(() => {
    if (!showDaily) return [];
    const byDay = new Map<number, number>();
    for (let d = 1; d <= daysInMonth; d++) byDay.set(d, 0);
    for (const e of filteredItems) {
      if (e.type !== "expense" || e.year !== selectedYear || e.month !== monthNum) continue;
      const day = new Date(e.date).getDate();
      byDay.set(day, (byDay.get(day) ?? 0) + e.amount);
    }
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      credit: byDay.get(i + 1) ?? 0,
    }));
  }, [showDaily, filteredItems, selectedYear, monthNum, daysInMonth]);

  const monthlyData = useMemo(() => {
    const expenseForYear = filteredItems.filter((e) => e.year === selectedYear);
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const debit =
        selectedCategory === "all"
          ? (budgetDebitByMonth[m] ?? 0)
          : budgetItemsForYear
              .filter((b) => b.month === m && b.categoryId === selectedCategory)
              .reduce((s, b) => s + b.amount, 0);
      const credit = expenseForYear.filter((e) => e.month === m).reduce((s, e) => s + e.amount, 0);
      return {
        month: m,
        debit,
        credit,
        label: MONTH_LABELS[i] ?? "",
      };
    });
  }, [filteredItems, selectedYear, budgetDebitByMonth, budgetItemsForYear, selectedCategory]);

  useEffect(() => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (filterModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [filterModalOpen]);

  const barRadius = 8;
  const finalChartData = useMemo(() => {
    if (showDaily) {
      return {
        labels: dailyData.map((x) => `Day ${x.day}`),
        datasets: [
          {
            label: "Credit (Expense)",
            data: dailyData.map((x) => x.credit),
            backgroundColor: isDark ? "rgba(249, 115, 22, 0.6)" : "rgba(249, 115, 22, 0.7)",
            borderColor: "rgb(249, 115, 22)",
            borderWidth: 1,
            borderRadius: barRadius,
          },
        ],
      };
    }
    return {
      labels: monthlyData.map((x) => x.label),
      datasets: [
        {
          label: "Debit (Income)",
          data: monthlyData.map((x) => x.debit),
          backgroundColor: isDark ? "rgba(148, 163, 184, 0.7)" : "rgba(30, 41, 59, 0.8)",
          borderColor: isDark ? "rgb(148, 163, 184)" : "rgb(30, 41, 59)",
          borderWidth: 1,
          borderRadius: barRadius,
        },
        {
          label: "Credit (Expense)",
          data: monthlyData.map((x) => x.credit),
          backgroundColor: "rgba(249, 115, 22, 0.7)",
          borderColor: "rgb(249, 115, 22)",
          borderWidth: 1,
          borderRadius: barRadius,
        },
      ],
    };
  }, [showDaily, monthlyData, dailyData, isDark]);

  const chartYMax = useMemo(() => {
    const MONTHLY_DEFAULT_MAX = 15000; // 15k for single month (daily) chart
    const YEARLY_DEFAULT_MAX = 50000; // 50k for yearly debit/credit chart
    if (showDaily) {
      const dataMax = dailyData.length ? Math.max(...dailyData.map((x) => x.credit)) : 0;
      return Math.max(MONTHLY_DEFAULT_MAX, dataMax);
    }
    const dataMax = monthlyData.length
      ? Math.max(
          ...monthlyData.flatMap((x) => [x.debit, x.credit])
        )
      : 0;
    return Math.max(YEARLY_DEFAULT_MAX, dataMax);
  }, [showDaily, dailyData, monthlyData]);

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "x" as const,
      scales: {
        x: {
          stacked: false,
          grid: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
          ticks: { color: isDark ? "#94a3b8" : "#64748b", maxRotation: 45 },
        },
        y: {
          stacked: false,
          min: 0,
          max: chartYMax,
          grid: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
          ticks: {
            color: isDark ? "#94a3b8" : "#64748b",
            callback: (v) => formatK(v as number) + " ৳",
          },
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: isDark ? "#cbd5e1" : "#334155",
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatK(ctx.raw as number)} ৳`,
          },
        },
      },
    }),
    [isDark, chartYMax]
  );

  const filterContent = (
    <>
      <SelectDropdown
        options={categoryOptions}
        value={selectedCategory}
        onChange={(v) => setSelectedCategory(String(v))}
        label=""
        className="w-full md:w-auto md:min-w-[140px]"
      />
      <MonthYearDatePicker
        years={years}
        year={selectedYear}
        month={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        label=""
        className="w-full md:w-auto md:min-w-[140px]"
      />
      <label
        className={cn(
          "flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-medium",
          isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50"
        )}
      >
        <Checkbox
          checked={viewAllMonths}
          onCheckedChange={(checked) => setViewAllMonths(!!checked)}
        />
        <span className={isDark ? "text-slate-300" : "text-slate-700"}>All months</span>
      </label>
    </>
  );

  const filterModal =
    typeof document !== "undefined" &&
    filterModalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[10%] px-4 pb-4 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
          onClick={() => setFilterModalOpen(false)}
          role="presentation"
          aria-hidden
        />
        <div
          className={cn(
            "relative z-10 flex w-full max-w-sm flex-col rounded-2xl shadow-float",
            isDark ? "border border-white/10 bg-violet-950/95" : "border border-[#ddd] bg-white"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ddd] dark:border-white/10">
            <span id="filter-modal-title" className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>Filters</span>
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className={cn(
                "rounded-xl p-2 transition",
                isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col gap-3 p-4 overflow-hidden">
            {filterContent}
          </div>
          <div className="border-t border-[#ddd] p-4 dark:border-white/10">
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className={cn(
                "w-full rounded-xl py-2.5 text-sm font-semibold transition",
                isDark
                  ? "bg-violet-500 text-white hover:bg-violet-600"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              )}
            >
              OK
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <SectionCard>
      {filterModal}

      <SectionHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        {/* Left: title upore, description niche */}
        <div className="min-w-0 flex-1">
          <SectionTitle>Profit and Loss</SectionTitle>
          <SectionSubtitle>
            {showDaily
              ? `Daily credit (expense) for ${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
              : `Month-wise debit (income) and credit (expense) for ${selectedYear}`}
          </SectionSubtitle>
        </div>
        {/* Right: mobile filter icon / desktop filters */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition md:hidden",
              isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-[#ddd] bg-slate-50 hover:bg-slate-100"
            )}
            aria-label="Open filters"
          >
            <Filter className={cn("h-5 w-5", isDark ? "text-slate-400" : "text-slate-600")} />
          </button>
          <FilterControls className="hidden shrink-0 md:flex md:flex-row md:items-center md:gap-3">
            {filterContent}
          </FilterControls>
        </div>
      </SectionHeader>

      <div className="h-[280px] min-h-0 w-full max-w-full sm:h-[320px] md:h-[400px]">
        <Bar data={finalChartData} options={options} />
      </div>
    </SectionCard>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useYearlyBudgetDebitDoc } from "@/lib/firebase/budget";
import { useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { useYearlyCategories, useYearlyTypes } from "@/lib/firebase/yearly";
import { useThemeContext } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCalendarYears } from "@/hooks/useCalendarYears";
import { useClientDate } from "@/hooks/useClientDate";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { formatK, formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function YearlyCreditDebitChartSection() {
  const { theme } = useThemeContext();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  const { year: currentYear, isClient } = useClientDate();
  const years = useCalendarYears(currentYear);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { categories: yearlyCategories } = useYearlyCategories();
  const { types: yearlyTypes } = useYearlyTypes();
  const { categories: monthlyCategories } = useExpenseCategories();
  const { types: monthlyTypes } = useExpenseTypes();
  const { amounts: yearlyDebitAmounts } = useYearlyBudgetDebitDoc(selectedYear);
  const allItems = useAppSelector((state) => state.expenses.items);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: t("pnl_allYearlyCategories") },
      ...yearlyCategories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [yearlyCategories, t]
  );

  /** When "all", only expenses that belong to any yearly category (direct or via linked monthly). */
  const filteredExpenses = useMemo(() => {
    const forYear = allItems.filter((e) => e.type === "expense" && e.year === selectedYear);
    const linkedMonthlyByYearly = new Map<string, Set<string>>();
    for (const c of monthlyCategories) {
      if (!c.yearlyCategoryId) continue;
      const set = linkedMonthlyByYearly.get(c.yearlyCategoryId) ?? new Set();
      set.add(c.id);
      linkedMonthlyByYearly.set(c.yearlyCategoryId, set);
    }
    const monthlyTypeIdsByCat = new Map<string, Set<string>>();
    for (const c of monthlyCategories) {
      monthlyTypeIdsByCat.set(c.id, new Set(monthlyTypes.filter((t) => t.categoryId === c.id).map((t) => t.id)));
    }
    const belongsToYearlyCategory = (e: (typeof forYear)[0]) => {
      if (!e.expenseTypeId) return false;
      const yearlyCat = yearlyCategories.find((yc) => yc.id === e.category);
      if (yearlyCat) {
        const typeIds = new Set(yearlyTypes.filter((t) => t.categoryId === yearlyCat.id).map((t) => t.id));
        if (typeIds.has(e.expenseTypeId)) return true;
      }
      const linkedMonthlyIds = linkedMonthlyByYearly.get(
        monthlyCategories.find((mc) => mc.id === e.category)?.yearlyCategoryId ?? ""
      );
      if (linkedMonthlyIds?.has(e.category)) {
        const typeIds = monthlyTypeIdsByCat.get(e.category);
        if (typeIds?.has(e.expenseTypeId)) return true;
      }
      return false;
    };
    if (selectedCategory === "all") {
      return forYear.filter(belongsToYearlyCategory);
    }
    const yearlyTypeIds = new Set(yearlyTypes.filter((t) => t.categoryId === selectedCategory).map((t) => t.id));
    const linkedMonthlyIds = linkedMonthlyByYearly.get(selectedCategory) ?? new Set();
    return forYear.filter((e) => {
      if (!e.expenseTypeId) return false;
      if (e.category === selectedCategory && yearlyTypeIds.has(e.expenseTypeId)) return true;
      const typeIds = linkedMonthlyIds.has(e.category) ? monthlyTypeIdsByCat.get(e.category) : undefined;
      return typeIds?.has(e.expenseTypeId) ?? false;
    });
  }, [allItems, selectedYear, selectedCategory, yearlyTypes, yearlyCategories, monthlyCategories, monthlyTypes]);

  const yearlySummary = useMemo(() => {
    const credit = filteredExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
    let debit = 0;
    if (selectedCategory === "all") {
      debit = Object.values(yearlyDebitAmounts).reduce((s, amt) => s + (amt ?? 0), 0);
    } else {
      debit = typeof yearlyDebitAmounts[selectedCategory] === "number" ? yearlyDebitAmounts[selectedCategory]! : 0;
    }
    return { debit, credit, label: String(selectedYear) };
  }, [selectedYear, selectedCategory, yearlyDebitAmounts, filteredExpenses]);

  useEffect(() => {
    if (isClient) setSelectedYear(currentYear);
  }, [isClient, currentYear]);

  const barRadius = 8;
  const debitLabel = selectedCategory === "all" ? t("pnl_yearlyDebit") : t("pnl_categoryDebit");
  const costLabel = selectedCategory === "all" ? t("pnl_yearlyCost") : t("pnl_categoryCost");
  const chartData = useMemo(
    () => ({
      labels: [yearlySummary.label],
      datasets: [
        {
          label: debitLabel,
          data: [yearlySummary.debit],
          backgroundColor: isDark ? "rgba(148, 163, 184, 0.7)" : "rgba(30, 41, 59, 0.8)",
          borderColor: isDark ? "rgb(148, 163, 184)" : "rgb(30, 41, 59)",
          borderWidth: 1,
          borderRadius: barRadius,
        },
        {
          label: costLabel,
          data: [yearlySummary.credit],
          backgroundColor: "rgba(249, 115, 22, 0.7)",
          borderColor: "rgb(249, 115, 22)",
          borderWidth: 1,
          borderRadius: barRadius,
        },
      ],
    }),
    [yearlySummary, isDark, debitLabel, costLabel]
  );

  const CHART_STEP = 5000;
  const chartYMax = (() => {
    const raw = Math.max(20000, yearlySummary.debit, yearlySummary.credit);
    return Math.ceil(raw / CHART_STEP) * CHART_STEP;
  })();

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "x" as const,
      scales: {
        x: {
          stacked: false,
          grid: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
          ticks: { color: isDark ? "#94a3b8" : "#64748b" },
        },
        y: {
          stacked: false,
          min: 0,
          max: chartYMax,
          grid: { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
          ticks: {
            color: isDark ? "#94a3b8" : "#64748b",
            stepSize: CHART_STEP,
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

  return (
    <SectionCard>
      <SectionHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SectionTitle>{t("pnl_yearlyTitle")}</SectionTitle>
          <SectionSubtitle>
            {t("pnl_yearlySubtitle2", { year: String(selectedYear) })}
            {selectedCategory !== "all" ? ` · ${yearlyCategories.find((c) => c.id === selectedCategory)?.name ?? ""}` : ""}
          </SectionSubtitle>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <SelectDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(String(v))}
            label=""
            className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
          />
          <MonthYearDatePicker
            years={years}
            year={selectedYear}
            onYearChange={setSelectedYear}
            mode="year-only"
            label=""
            className="w-full sm:w-auto sm:min-w-[120px]"
          />
        </div>
      </SectionHeader>

      <div className="h-[280px] min-h-0 w-full max-w-full sm:h-[320px] md:h-[400px]">
        <Bar data={chartData} options={options} />
      </div>

      <div className={cn(
        "mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border px-3 py-2 text-sm",
        isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/80"
      )}>
        <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
          {t("pnl_yearlyDebit")}: <strong className={cn("text-foreground", isDark ? "text-slate-100" : "text-slate-900")}>{formatMoneyK(yearlySummary.debit)}</strong>
        </span>
        <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
          {costLabel}: <strong className={cn("text-foreground", isDark ? "text-orange-300" : "text-orange-600")}>{formatMoneyK(yearlySummary.credit)}</strong>
          {selectedCategory !== "all" && (
            <span className={cn("ml-1 opacity-80", isDark ? "text-slate-400" : "text-slate-500")}>
              ({yearlyCategories.find((c) => c.id === selectedCategory)?.name})
            </span>
          )}
        </span>
      </div>
    </SectionCard>
  );
}

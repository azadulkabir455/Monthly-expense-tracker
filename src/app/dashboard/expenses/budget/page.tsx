"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useBudgetDebit, useBudgetItems, useYearlyBudgetDebitDoc } from "@/lib/firebase/budget";
import { BudgetRoundChart } from "@/blocks/components/BudgetRoundChart";
import { BudgetItemTableSection } from "@/blocks/sections/BudgetItemTableSection";
import { Button } from "@/blocks/elements/Button";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { useYearlyCategories, useYearlyTypes } from "@/lib/firebase/yearly";
import { useClientDate } from "@/hooks/useClientDate";
import { useCalendarYears } from "@/hooks/useCalendarYears";
import { useLanguage } from "@/context/LanguageContext";
import { useAppSelector } from "@/store/hooks";
import { selectExpensesFiltered } from "@/store/slices/expensesSlice";
import { Wallet, Plus, AlertTriangle, TrendingUp } from "lucide-react";
import { AddDebitAmountModal } from "@/blocks/components/AddDebitAmountModal";
import { AddBudgetItemModal } from "@/blocks/components/AddBudgetItemModal";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/blocks/elements/Skeleton";

const MONTH_OPTIONS: SelectOption[] = [
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

export default function MonthlyBudgetPage() {
  const searchParams = useSearchParams();
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const { t } = useLanguage();

  const { year: currentYear, month: currentMonth0, isClient } = useClientDate();
  const years = useCalendarYears(currentYear);
  const minYear = years.at(-1) ?? 2020;
  const maxYear = years[0] ?? currentYear;

  const yearFromUrl = searchParams.get("year");
  const monthFromUrl = searchParams.get("month");
  const initialYear =
    yearFromUrl != null && !Number.isNaN(Number(yearFromUrl))
      ? Math.min(maxYear, Math.max(minYear, Number(yearFromUrl)))
      : currentYear;
  const initialMonth =
    monthFromUrl != null && !Number.isNaN(Number(monthFromUrl))
      ? Math.min(12, Math.max(1, Number(monthFromUrl)))
      : currentMonth0 + 1;

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { categories } = useExpenseCategories();
  const { types: expenseTypes } = useExpenseTypes();
  const { categories: yearlyCategories } = useYearlyCategories();
  const { types: yearlyTypes } = useYearlyTypes();
  const { amounts: yearlyDebitAmounts } = useYearlyBudgetDebitDoc(selectedYear);
  const allExpensesForMonth = useAppSelector((state) =>
    selectExpensesFiltered(state, selectedYear, selectedMonth)
  );
  /** All expense entries for the selected year (for YTD sum) */
  const allExpensesForYear = useAppSelector((state) =>
    state.expenses.items.filter(
      (e) => e.type === "expense" && e.year === selectedYear
    )
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  /** When selected category has a parent (yearly), its yearly budget; for simple formula: yearly − monthly total cost = remaining */
  const parentBudgetInfo = useMemo(() => {
    if (!selectedCategoryId) return null;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    const parentId = cat?.yearlyCategoryId;
    if (!parentId || typeof yearlyDebitAmounts[parentId] !== "number") return null;
    const yearly = yearlyDebitAmounts[parentId];
    const parentName = yearlyCategories.find((c) => c.id === parentId)?.name ?? "Parent";
    return { parentName, yearly, parentId };
  }, [selectedCategoryId, categories, yearlyCategories, yearlyDebitAmounts]);

  /** Cost by month (Jan, Feb, …) for parent; monthly total cost = sum of these (e.g. Mar 8.7k + Apr 7k = 15.7k) */
  const parentCostByMonth = useMemo(() => {
    const byMonth: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
    if (!parentBudgetInfo) return { byMonth, total: 0 };
    const parentId = parentBudgetInfo.parentId;
    const linkedIds = new Set(categories.filter((c) => c.yearlyCategoryId === parentId).map((c) => c.id));
    const monthlyTypeIdsByCat = new Map<string, Set<string>>();
    for (const c of categories) {
      if (!linkedIds.has(c.id)) continue;
      monthlyTypeIdsByCat.set(c.id, new Set(expenseTypes.filter((t) => t.categoryId === c.id).map((t) => t.id)));
    }
    const yearlyTypeIds = new Set(yearlyTypes.filter((t) => t.categoryId === parentId).map((t) => t.id));
    let total = 0;
    for (const e of allExpensesForYear) {
      if (!e.expenseTypeId || e.month < 1 || e.month > 12) continue;
      let add = 0;
      const typeIds = monthlyTypeIdsByCat.get(e.category);
      if (typeIds?.has(e.expenseTypeId)) add = e.amount ?? 0;
      else if (e.category === parentId && yearlyTypeIds.has(e.expenseTypeId)) add = e.amount ?? 0;
      if (add > 0) {
        byMonth[e.month] += add;
        total += add;
      }
    }
    return { byMonth, total };
  }, [parentBudgetInfo, categories, expenseTypes, yearlyTypes, allExpensesForYear]);

  const monthlyTotalCost = parentCostByMonth.total;
  const remainingForNextMonthBudget = parentBudgetInfo ? parentBudgetInfo.yearly - monthlyTotalCost : 0;

  /** Year-to-date expense total for selected category — for yearly budget warning */
  const ytdExpenseTotal = useMemo(() => {
    if (!selectedCategoryId) return 0;
    const typeIds = new Set(
      expenseTypes.filter((t) => t.categoryId === selectedCategoryId).map((t) => t.id)
    );
    return allExpensesForYear
      .filter(
        (e) =>
          e.month >= 1 &&
          e.month <= selectedMonth &&
          e.expenseTypeId &&
          typeIds.has(e.expenseTypeId)
      )
      .reduce((s, e) => s + (e.amount ?? 0), 0);
  }, [selectedCategoryId, expenseTypes, allExpensesForYear, selectedMonth]);

  const { debit: budgetDebit, setDebit, loading: budgetDebitLoading } = useBudgetDebit(
    selectedYear,
    selectedMonth,
    selectedCategoryId
  );
  const {
    items: budgetItemsAll,
    loading: budgetItemsLoading,
    addItem,
    updateItem,
    deleteItem,
  } = useBudgetItems(selectedYear, selectedMonth);

  const budgetChartsLoading = budgetDebitLoading || budgetItemsLoading;

  const budgetItems = useMemo(
    () =>
      selectedCategoryId
        ? budgetItemsAll.filter((b) => b.categoryId === selectedCategoryId)
        : budgetItemsAll,
    [budgetItemsAll, selectedCategoryId]
  );

  const debit = budgetDebit ?? 0;
  const credit = budgetItems.reduce((s, b) => s + b.amount, 0);
  const balance = debit - credit;

  const hasDebitAmount = budgetDebit != null;

  /** Yearly (parent) budget exceeded: YTD expense > parent yearly budget — show warning below chart */
  const isYearlyBudgetExceeded =
    parentBudgetInfo &&
    parentBudgetInfo.yearly > 0 &&
    ytdExpenseTotal > parentBudgetInfo.yearly;

  /** Default to first category in list when categories load; keep selection if still in list */
  useEffect(() => {
    if (categories.length === 0) return;
    const firstId = categories[0]?.id ?? "";
    setSelectedCategoryId((prev) =>
      prev && categories.some((c) => c.id === prev) ? prev : firstId
    );
  }, [categories]);

  useEffect(() => {
    if (!isClient) return;
    const y = yearFromUrl != null && !Number.isNaN(Number(yearFromUrl)) ? Number(yearFromUrl) : null;
    const m = monthFromUrl != null && !Number.isNaN(Number(monthFromUrl)) ? Number(monthFromUrl) : null;
    if (y != null && m != null) {
      setSelectedYear(Math.min(maxYear, Math.max(minYear, y)));
      setSelectedMonth(Math.min(12, Math.max(1, m)));
      return;
    }
    const id = setTimeout(() => {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth0 + 1);
    }, 0);
    return () => clearTimeout(id);
  }, [isClient, currentYear, currentMonth0, minYear, maxYear, yearFromUrl, monthFromUrl]);

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? "";

  const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? "";

  /** Balance as ratio of debit (for ring fill) — positive = green, negative = red */
  const balanceRatio = debit > 0 ? Math.min(1, Math.max(0, balance / debit)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-[#ddd] bg-white px-4 py-4 shadow-card-lg dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 shrink-0 max-w-2xl">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t("monthlyBudget_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("monthlyBudget_subtitle")}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-row flex-nowrap items-center gap-2 sm:gap-3 sm:w-auto">
          <Button
            type="button"
            size="default"
            className="h-11 min-w-0 flex-1 border border-[#ddd] shadow-card dark:border-white/10 sm:flex-initial"
            onClick={() => setDebitModalOpen(true)}
            disabled={!selectedCategoryId}
          >
            <Wallet className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{hasDebitAmount ? t("monthlyBudget_editDebit") : t("monthlyBudget_addDebit")}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 min-w-0 flex-1 border border-[#ddd] shadow-card dark:border-white/10 sm:flex-initial"
            onClick={() => setBudgetModalOpen(true)}
            disabled={!selectedCategoryId}
          >
            <Plus className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{t("monthlyBudget_addDailyBudget")}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {budgetChartsLoading ? (
          <>
            <Skeleton className="aspect-square w-full max-w-[130px] rounded-full justify-self-center sm:max-w-[120px]" />
            <Skeleton className="aspect-square w-full max-w-[130px] rounded-full justify-self-center sm:max-w-[120px]" />
            <Skeleton className="aspect-square w-full max-w-[130px] rounded-full justify-self-center sm:max-w-[120px]" />
          </>
        ) : (
          <>
            <BudgetRoundChart
              label="Total Debit"
              value={debit}
              ringColor="text-violet-500 dark:text-violet-400"
              fillRatio={1}
              subtitle={`${selectedMonthLabel}-${selectedYear}`}
              size={100}
            />
            <BudgetRoundChart
              label="Total Credit"
              value={credit}
              ringColor="text-red-500 dark:text-red-400"
              fillRatio={1}
              subtitle="Expense"
              size={100}
            />
            <BudgetRoundChart
              label="Balance"
              value={balance}
              ringColor={
                balance >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              }
              fillRatio={balance >= 0 ? balanceRatio : 1}
              subtitle="due"
              size={100}
            />
          </>
        )}
      </div>

      {parentBudgetInfo && (
        <div
          className={cn(
            "rounded-xl border shadow-sm overflow-hidden",
            "border-violet-200/80 bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/50 dark:to-indigo-950/30 dark:border-violet-500/25"
          )}
        >
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 dark:bg-violet-400/15">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </span>
            <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">
              Parent (Yearly): {parentBudgetInfo.parentName}
            </span>
          </div>
          <div className="px-4 pb-4 pt-1 space-y-2">
            <p className="text-sm text-violet-700/90 dark:text-violet-300/90">
              Yearly budget {formatMoneyK(parentBudgetInfo.yearly)} − Monthly total cost {formatMoneyK(monthlyTotalCost)} ={" "}
              <span className={cn(
                "font-semibold",
                remainingForNextMonthBudget >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatMoneyK(remainingForNextMonthBudget)}
              </span>{" "}
              remaining for next month budget
            </p>
            <div className="border-t border-violet-200/60 dark:border-violet-500/20 pt-2">
              <p className="text-xs font-medium text-violet-600/90 dark:text-violet-400/90 mb-1">Cost by month (adds up)</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {(MONTH_OPTIONS as { value: number; label: string }[]).map(({ value: m, label }) => {
                  const amt = parentCostByMonth.byMonth[m] ?? 0;
                  if (amt === 0) return null;
                  return (
                    <span key={m} className="text-violet-800 dark:text-violet-200">
                      {label}: <span className="font-medium">{formatMoneyK(amt)}</span>
                    </span>
                  );
                })}
                {monthlyTotalCost === 0 && (
                  <span className="text-violet-500 dark:text-violet-400">No cost this year yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isYearlyBudgetExceeded && parentBudgetInfo && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-200"
          )}
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Warning: Year-to-date cost {formatMoneyK(ytdExpenseTotal)} (Jan–{MONTH_OPTIONS[selectedMonth - 1]?.label ?? selectedMonth}) exceeds yearly budget {formatMoneyK(parentBudgetInfo.yearly)}. Reduce spending or increase yearly budget.
          </p>
        </div>
      )}

      <AddDebitAmountModal
        open={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
        categoryId={selectedCategoryId}
        categoryName={selectedCategoryName}
        currentAmount={budgetDebit ?? undefined}
        onSave={setDebit}
      />
      <AddBudgetItemModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
        categoryId={selectedCategoryId}
        existingBudgetTypeIds={budgetItemsAll
          .filter((b) => b.categoryId === selectedCategoryId && b.expenseTypeId)
          .map((b) => b.expenseTypeId!)}
        onAdd={async (data) => {
          await addItem(data);
        }}
      />

      <BudgetItemTableSection
        year={selectedYear}
        month={selectedMonth}
        categoryId={selectedCategoryId}
        items={budgetItems}
        loading={budgetItemsLoading}
        onDeleteItem={deleteItem}
        onUpdateItem={async (item) => {
          await updateItem(item.id, {
            name: item.name,
            amount: item.amount,
            year: item.year,
            month: item.month,
            categoryId: item.categoryId,
            expenseTypeId: item.expenseTypeId,
          });
        }}
        headerRight={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <MonthYearDatePicker
              years={years}
              year={selectedYear}
              month={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
              label=""
              className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
            />
            {categoryOptions.length > 0 && (
              <SelectDropdown
                options={categoryOptions}
                value={selectedCategoryId}
                onChange={(v) => setSelectedCategoryId(String(v))}
                label=""
                className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
              />
            )}
          </div>
        }
      />
    </motion.div>
  );
}

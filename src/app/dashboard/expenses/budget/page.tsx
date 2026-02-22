"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import { selectMonthlySummaryForMonth } from "@/store/slices/expensesSlice";
import { useBudgetDebit, useBudgetItems } from "@/lib/firebase/budget";
import { BudgetRoundChart } from "@/blocks/components/BudgetRoundChart";
import { BudgetItemTableSection } from "@/blocks/sections/BudgetItemTableSection";
import { Button } from "@/blocks/elements/Button";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { useExpenseCategories } from "@/lib/firebase/expenses";
import { useStartYear } from "@/hooks/useStartYear";
import { useClientDate } from "@/hooks/useClientDate";
import { Wallet, Plus } from "lucide-react";
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
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const startYear = useStartYear();
  const { year: currentYear, month: currentMonth0, isClient } = useClientDate();
  const years = useMemo(
    () =>
      Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i),
    [currentYear, startYear]
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth0 + 1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { categories } = useExpenseCategories();
  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

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
    const id = setTimeout(() => {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth0 + 1);
    }, 0);
    return () => clearTimeout(id);
  }, [isClient, currentYear, currentMonth0]);

  const { debit: budgetDebit, setDebit, loading: budgetDebitLoading } = useBudgetDebit(
    selectedYear,
    selectedMonth
  );
  const {
    items: budgetItemsAll,
    loading: budgetItemsLoading,
    addItem,
    updateItem,
    deleteItem,
  } = useBudgetItems(selectedYear, selectedMonth);

  const budgetChartsLoading = budgetDebitLoading || budgetItemsLoading;
  const monthlySummary = useAppSelector((s) =>
    selectMonthlySummaryForMonth(s, selectedYear, selectedMonth)
  );

  const budgetItems = useMemo(
    () =>
      selectedCategoryId
        ? budgetItemsAll.filter((b) => b.categoryId === selectedCategoryId)
        : budgetItemsAll,
    [budgetItemsAll, selectedCategoryId]
  );

  const debit = budgetDebit ?? monthlySummary?.totalIncome ?? 0;
  const credit = budgetItems.reduce((s, b) => s + b.amount, 0);
  const balance = debit - credit;

  const hasDebitAmount = budgetDebit != null;

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
      <div className="flex flex-col gap-4 rounded-xl border border-[#ddd] bg-white px-4 py-4 shadow-card-lg dark:border-white/10 dark:bg-white/5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Monthly Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Debit = total maser taka, Credit = daily budget items total, Balance = baki.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-row flex-nowrap items-center gap-2 sm:gap-3 sm:w-auto">
          <Button
            type="button"
            size="default"
            className="h-11 min-w-0 flex-1 border border-[#ddd] shadow-card dark:border-white/10 sm:flex-initial"
            onClick={() => setDebitModalOpen(true)}
          >
            <Wallet className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{hasDebitAmount ? "Edit Debit Amount" : "Add Debit Amount"}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 min-w-0 flex-1 border border-[#ddd] shadow-card dark:border-white/10 sm:flex-initial"
            onClick={() => setBudgetModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">Add Daily Budget</span>
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

      <AddDebitAmountModal
        open={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
        currentAmount={budgetDebit ?? undefined}
        onSave={setDebit}
      />
      <AddBudgetItemModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
        categoryId={selectedCategoryId}
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

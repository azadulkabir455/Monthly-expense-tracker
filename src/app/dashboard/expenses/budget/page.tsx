"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import {
  selectBudgetDebitForMonth,
  selectBudgetItemsForMonth,
  selectMonthlySummaryForMonth,
} from "@/store/slices/expensesSlice";
import { BudgetRoundChart } from "@/blocks/components/BudgetRoundChart";
import { BudgetItemTableSection } from "@/blocks/sections/BudgetItemTableSection";
import { Button } from "@/blocks/elements/Button";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import type { SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { useStartYear } from "@/hooks/useStartYear";
import { useClientDate } from "@/hooks/useClientDate";
import { Wallet, Plus } from "lucide-react";
import { AddDebitAmountModal } from "@/blocks/components/AddDebitAmountModal";
import { AddBudgetItemModal } from "@/blocks/components/AddBudgetItemModal";

const MONTH_OPTIONS: SelectOption[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
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

  useEffect(() => {
    if (!isClient) return;
    const id = setTimeout(() => {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth0 + 1);
    }, 0);
    return () => clearTimeout(id);
  }, [isClient, currentYear, currentMonth0]);

  const budgetDebit = useAppSelector((s) =>
    selectBudgetDebitForMonth(s, selectedYear, selectedMonth)
  );
  const monthlySummary = useAppSelector((s) =>
    selectMonthlySummaryForMonth(s, selectedYear, selectedMonth)
  );
  const budgetItems = useAppSelector((s) =>
    selectBudgetItemsForMonth(s, selectedYear, selectedMonth)
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
        <div className="flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:shrink-0 sm:items-center">
          <MonthYearDatePicker
            years={years}
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            label=""
            className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
          />
          <Button
            type="button"
            size="default"
            className="h-11 shrink-0 border border-[#ddd] shadow-card dark:border-white/10"
            onClick={() => setDebitModalOpen(true)}
          >
            <Wallet className="mr-1.5 h-4 w-4" />
            {hasDebitAmount ? "Edit Debit Amount" : "Add Debit Amount"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 shrink-0 border border-[#ddd] shadow-card dark:border-white/10"
            onClick={() => setBudgetModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Daily Budget
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BudgetRoundChart
          label="Total Debit"
          value={debit}
          ringColor="text-violet-500 dark:text-violet-400"
          fillRatio={1}
          subtitle={`${selectedMonthLabel} ${selectedYear}`}
        />
        <BudgetRoundChart
          label="Total Credit"
          value={credit}
          ringColor="text-red-500 dark:text-red-400"
          fillRatio={1}
          subtitle="Expense"
        />
        <BudgetRoundChart
          label="Balance"
          value={balance}
          ringColor={
            balance >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }
          fillRatio={balance >= 0 ? balanceRatio : 1}
          subtitle="Debit − Credit"
        />
      </div>

      <AddDebitAmountModal
        open={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
      />
      <AddBudgetItemModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        year={selectedYear}
        month={selectedMonth}
      />

      <BudgetItemTableSection year={selectedYear} month={selectedMonth} />
    </motion.div>
  );
}

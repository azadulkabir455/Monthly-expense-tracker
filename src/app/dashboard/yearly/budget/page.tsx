"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useYearlyBudgetDebit, useYearlyBudgetItems } from "@/lib/firebase/budget";
import { BudgetRoundChart } from "@/blocks/components/BudgetRoundChart";
import { YearlyBudgetItemTableSection } from "@/blocks/sections/YearlyBudgetItemTableSection";
import { Button } from "@/blocks/elements/Button";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { useYearlyCategories } from "@/lib/firebase/yearly";
import { useClientDate } from "@/hooks/useClientDate";
import { useCalendarYears } from "@/hooks/useCalendarYears";
import { useLanguage } from "@/context/LanguageContext";
import { Wallet, Plus } from "lucide-react";
import { AddDebitAmountModal } from "@/blocks/components/AddDebitAmountModal";
import { AddBudgetItemModal } from "@/blocks/components/AddBudgetItemModal";
import { Skeleton } from "@/blocks/elements/Skeleton";

export default function YearlyBudgetPage() {
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const { t } = useLanguage();

  const { year: currentYear, isClient } = useClientDate();
  const years = useCalendarYears(currentYear);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { categories } = useYearlyCategories();
  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (categories.length === 0) return;
    setSelectedCategoryId((prev) =>
      prev && categories.some((c) => c.id === prev) ? prev : categories[0]?.id ?? ""
    );
  }, [categories]);

  useEffect(() => {
    if (!isClient) return;
    setSelectedYear(currentYear);
  }, [isClient, currentYear]);

  const { debit: budgetDebit, setDebit, loading: budgetDebitLoading } = useYearlyBudgetDebit(
    selectedYear,
    selectedCategoryId
  );
  const {
    items: budgetItemsAll,
    loading: budgetItemsLoading,
    addItem,
    updateItem,
    deleteItem,
  } = useYearlyBudgetItems(selectedYear);

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

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? "";

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
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t("yearlyBudget_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("yearlyBudget_subtitle")}
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
            <span className="min-w-0 truncate">
              {hasDebitAmount ? t("yearlyBudget_editDebit") : t("yearlyBudget_addDebit")}
            </span>
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
            <span className="min-w-0 truncate">{t("yearlyBudget_addItem")}</span>
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
              subtitle={String(selectedYear)}
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
                balance >= 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
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
        categoryId={selectedCategoryId}
        categoryName={selectedCategoryName}
        variant="yearly"
        currentAmount={budgetDebit ?? undefined}
        onSave={setDebit}
      />
      <AddBudgetItemModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        year={selectedYear}
        categoryId={selectedCategoryId}
        variant="yearly"
        existingBudgetTypeIds={budgetItemsAll
          .filter(
            (b) => b.categoryId === selectedCategoryId && b.expenseTypeId
          )
          .map((b) => b.expenseTypeId!)}
        onAdd={async (data) => {
          await addItem({
            name: data.name,
            amount: data.amount,
            year: data.year,
            categoryId: data.categoryId,
            expenseTypeId: data.expenseTypeId,
          });
        }}
      />

      <YearlyBudgetItemTableSection
        year={selectedYear}
        categoryId={selectedCategoryId}
        items={budgetItems}
        loading={budgetItemsLoading}
        onDeleteItem={deleteItem}
        onUpdateItem={async (item) => {
          await updateItem(item.id, {
            name: item.name,
            amount: item.amount,
            year: item.year,
            categoryId: item.categoryId,
            expenseTypeId: item.expenseTypeId,
          });
        }}
        headerRight={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <MonthYearDatePicker
              years={years}
              year={selectedYear}
              onYearChange={setSelectedYear}
              mode="year-only"
              label=""
              className="w-full min-w-0 sm:w-auto sm:min-w-[120px]"
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectExpensesFiltered, removeExpense } from "@/store/slices/expensesSlice";
import { useExpenseEntries, useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { useYearlyCategories, useYearlyTypes } from "@/lib/firebase/yearly";
import { useBudgetDebitDocForYear, useBudgetItemsForYear, useYearlyBudgetDebitDoc } from "@/lib/firebase/budget";
import { Button } from "@/blocks/elements/Button";
import { SectionCard } from "@/blocks/elements/SectionCard";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { ConfirmModal } from "@/blocks/components/shared/ConfirmModal";
import { EditDayExpensesModal } from "@/blocks/components/EditDayExpensesModal";
import { ViewBudgetDetailsModal } from "@/blocks/components/ViewBudgetDetailsModal";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useClientDate } from "@/hooks/useClientDate";
import { useCalendarYears } from "@/hooks/useCalendarYears";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
import type { BudgetItem } from "@/types/budget";
import { Skeleton } from "@/blocks/elements/Skeleton";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Trash2,
  MoreVertical,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DEFAULT_AMOUNT_COLOR = "text-violet-600 dark:text-violet-400";

export function YearlyExpensesSection() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  const { year: currentYear, isClient } = useClientDate();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    if (isClient) setSelectedYear(currentYear);
  }, [isClient, currentYear]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [editingRowDay, setEditingRowDay] = useState<number | null>(null);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [deleteConfirmDay, setDeleteConfirmDay] = useState<number | null>(null);
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<number | null>(null);
  const [openActionDay, setOpenActionDay] = useState<number | null>(null);
  const [openActionMonth, setOpenActionMonth] = useState<number | null>(null);
  const [typesPopover, setTypesPopover] = useState<{
    month: number;
    day: number;
    types: string[];
    rect: DOMRect;
  } | null>(null);
  const [notePopup, setNotePopup] = useState<{ month: number; day: number; note: string } | null>(null);
  const [viewBudgetCategoryId, setViewBudgetCategoryId] = useState<string | null>(null);
  const [viewBudgetMonth, setViewBudgetMonth] = useState<number>(1);

  const years = useCalendarYears(currentYear);

  const { categories: expenseCategories, loading: categoriesLoading } = useYearlyCategories();
  const { types: expenseTypes, loading: typesLoading } = useYearlyTypes();
  const { categories: monthlyCategories } = useExpenseCategories();
  const { types: monthlyTypes } = useExpenseTypes();
  const { addEntry, updateEntry, removeEntry, isAuthenticated: hasFirestoreExpenses } = useExpenseEntries();
  const { byMonth: debitByMonth, loading: budgetDebitLoading } = useBudgetDebitDocForYear(selectedYear);
  const { amounts: yearlyDebitAmounts } = useYearlyBudgetDebitDoc(selectedYear);
  const { items: budgetItems } = useBudgetItemsForYear(selectedYear);

  const entriesLoading = categoriesLoading || typesLoading || budgetDebitLoading;

  /** When a yearly category is selected, include entries from monthly categories linked to it (yearlyCategoryId). Entries use monthly expenseTypeId. */
  const monthlyTypeIdsForYearlyCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    const monthlyCatIds = new Set(
      monthlyCategories.filter((c) => c.yearlyCategoryId === selectedCategoryId).map((c) => c.id)
    );
    return monthlyTypes.filter((t) => monthlyCatIds.has(t.categoryId)).map((t) => t.id);
  }, [selectedCategoryId, monthlyCategories, monthlyTypes]);

  const categoryTypes = useMemo(
    () =>
      selectedCategoryId
        ? expenseTypes.filter((t) => t.categoryId === selectedCategoryId)
        : expenseTypes,
    [expenseTypes, selectedCategoryId]
  );
  const typeOptions: SelectOption[] = [
    { value: "", label: "All Types" },
    ...categoryTypes.map((t) => ({ value: t.id, label: t.name })),
  ];
  /** Filter entries by these type ids. Use monthly type ids when yearly category is linked from monthly (so expense entries show up). */
  const typeIdsForSelectedCategory = useMemo(
    () =>
      selectedCategoryId
        ? (monthlyTypeIdsForYearlyCategory && monthlyTypeIdsForYearlyCategory.length > 0
            ? monthlyTypeIdsForYearlyCategory
            : expenseTypes.filter((t) => t.categoryId === selectedCategoryId).map((t) => t.id))
        : null,
    [selectedCategoryId, monthlyTypeIdsForYearlyCategory, expenseTypes]
  );

  /** Resolve type name for display: entry has monthly type id; prefer yearly type name if synced, else monthly. */
  const getTypeName = (typeId: string) =>
    expenseTypes.find((t) => t.sourceMonthlyTypeId === typeId)?.name ??
    monthlyTypes.find((t) => t.id === typeId)?.name ??
    "";

  /** Monthly type ids for a yearly category (for View Budget modal — entries use monthly type ids). */
  const monthlyTypeIdsForViewBudgetCategory = useMemo(() => {
    if (!viewBudgetCategoryId) return null;
    const monthlyCatIds = new Set(
      monthlyCategories.filter((c) => c.yearlyCategoryId === viewBudgetCategoryId).map((c) => c.id)
    );
    return monthlyTypes.filter((t) => monthlyCatIds.has(t.categoryId)).map((t) => t.id);
  }, [viewBudgetCategoryId, monthlyCategories, monthlyTypes]);

  const allItemsForYear = useAppSelector((state) =>
    state.expenses.items.filter((e) => e.year === selectedYear)
  );

  useEffect(() => {
    setSelectedTypeId("");
  }, [selectedCategoryId]);

  useEffect(() => {
    if (expenseCategories.length === 0) return;
    setSelectedCategoryId((prev) =>
      prev && expenseCategories.some((c) => c.id === prev) ? prev : expenseCategories[0]?.id ?? ""
    );
  }, [expenseCategories]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-expense-entry-action-menu]")) {
        setOpenActionDay(null);
        setOpenActionMonth(null);
      }
    }
    if (openActionDay != null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionDay]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-expense-entry-types-popover]")) setTypesPopover(null);
    }
    if (typesPopover != null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [typesPopover]);

  /** Per yearly category: debit = yearly budget debit; credit = expense entries from linked monthly categories. */
  const categorySummary = useMemo(() => {
    const byCat = new Map<string, { debit: number; credit: number }>();
    for (const cat of expenseCategories) {
      const monthlyCatIds = new Set(
        monthlyCategories.filter((c) => c.yearlyCategoryId === cat.id).map((c) => c.id)
      );
      const monthlyTypeIds = new Set(
        monthlyTypes.filter((t) => monthlyCatIds.has(t.categoryId)).map((t) => t.id)
      );
      const credit = allItemsForYear.reduce(
        (s, e) =>
          e.type === "expense" && e.expenseTypeId && monthlyTypeIds.has(e.expenseTypeId) ? s + (e.amount ?? 0) : s,
        0
      );
      const debit = typeof yearlyDebitAmounts[cat.id] === "number" ? yearlyDebitAmounts[cat.id] : 0;
      byCat.set(cat.id, { debit, credit });
    }
    return byCat;
  }, [expenseCategories, yearlyDebitAmounts, monthlyCategories, monthlyTypes, allItemsForYear]);

  function getAllExpensesForMonth(month: number) {
    const base = allItemsForYear.filter((e) => e.month === month);
    if (!selectedCategoryId || !typeIdsForSelectedCategory?.length) return base;
    return base.filter((e) => e.expenseTypeId && typeIdsForSelectedCategory.includes(e.expenseTypeId));
  }

  function getTableRowsForMonth(month: number) {
    const allExpensesForMonth = getAllExpensesForMonth(month);
    const baseExpensesForMonth = allItemsForYear.filter((e) => e.month === month && e.type === "expense");
    const daysInMonth = new Date(selectedYear, month, 0).getDate();
    const byDay = new Map<
      number,
      { types: Set<string>; debit: number; credit: number; dayNote: string }
    >();
    for (let d = 1; d <= daysInMonth; d++) {
      byDay.set(d, { types: new Set(), debit: 0, credit: 0, dayNote: "" });
    }
    for (const e of allExpensesForMonth) {
      if (e.type !== "expense") continue;
      if (e.amount === 0 && !e.expenseTypeId) continue;
      const day = new Date(e.date).getDate();
      const cur = byDay.get(day)!;
      cur.credit += e.amount;
      if (e.expenseTypeId) {
        const name = getTypeName(e.expenseTypeId);
        if (name) cur.types.add(name);
      }
    }
    const noteCategory = selectedCategoryId || "other";
    for (const e of baseExpensesForMonth) {
      if (
        e.type !== "expense" ||
        e.amount !== 0 ||
        e.expenseTypeId ||
        e.category !== noteCategory
      )
        continue;
      const desc = (e.description ?? "").trim();
      const day = new Date(e.date).getDate();
      const cur = byDay.get(day);
      if (cur) cur.dayNote = desc === "hello dear" ? "" : desc;
    }
    const allItemsForMonth = allItemsForYear.filter((e) => e.month === month);
    for (const e of allItemsForMonth) {
      if (e.type !== "income" || e.amount === 0) continue;
      const day = new Date(e.date).getDate();
      const cur = byDay.get(day);
      if (cur) cur.debit += e.amount;
    }
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const { types, debit, credit, dayNote } = byDay.get(day)!;
      return { day, types: Array.from(types), debit, credit, dayNote };
    });
  }

  const handleEditRow = (month: number, day: number) => {
    setEditingMonth(month);
    setEditingRowDay(day);
  };

  const handleDeleteRow = (month: number, day: number) => {
    setDeleteConfirmMonth(month);
    setDeleteConfirmDay(day);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmDay == null || deleteConfirmMonth == null) return;
    const toDelete = allItemsForYear.filter(
      (e) =>
        e.month === deleteConfirmMonth && new Date(e.date).getDate() === deleteConfirmDay
    );
    try {
      if (hasFirestoreExpenses) {
        for (const e of toDelete) {
          await removeEntry(e.id);
          dispatch(removeExpense(e.id));
        }
        toast.success("Day expenses deleted.");
      } else {
        toDelete.forEach((e) => dispatch(removeExpense(e.id)));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete day expenses.");
      return;
    }
    setDeleteConfirmDay(null);
    setDeleteConfirmMonth(null);
  };

  /** Download yearly expense entries as Excel (CSV) — date-wise transactions like monthly. */
  const handleDownloadYearExpenseExcel = () => {
    const expenses = [...allItemsForYear]
      .filter((e) => e.type === "expense" && (e.amount !== 0 || !!e.expenseTypeId))
      .filter(
        (e) =>
          !selectedCategoryId ||
          !typeIdsForSelectedCategory?.length ||
          (e.expenseTypeId && typeIdsForSelectedCategory.includes(e.expenseTypeId))
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const escape = (v: string) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = "Date,Month,Type,Item Name,Amount";
    let lastDate = "";
    let lastType = "";
    const rows = expenses.map((e) => {
      const dateStr = e.date
        ? (() => {
            const d = new Date(e.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })()
        : "";
      const monthLabel = e.month ? MONTH_NAMES[e.month - 1] ?? "" : "";
      const typeName = e.expenseTypeId ? getTypeName(e.expenseTypeId) : "";
      const itemName = (e.description ?? "").trim();
      const amount = Number(e.amount) ?? 0;
      const showDate = dateStr !== lastDate || typeName !== lastType;
      if (showDate) {
        lastDate = dateStr;
        lastType = typeName;
      }
      const dateCol = showDate ? escape(dateStr) : "";
      const monthCol = showDate ? escape(monthLabel) : "";
      const typeCol = showDate ? escape(typeName) : "";
      return [dateCol, monthCol, typeCol, escape(itemName), amount].join(",");
    });
    const csv = [header, ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yearly-expense-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started.");
  };

  const openViewBudget = (categoryId: string, month: number) => {
    setViewBudgetCategoryId(categoryId);
    setViewBudgetMonth(month);
  };

  const expenseByTypeIdForModal = useMemo(() => {
    if (!viewBudgetCategoryId) return {} as Record<string, number>;
    const typeIds =
      monthlyTypeIdsForViewBudgetCategory && monthlyTypeIdsForViewBudgetCategory.length > 0
        ? monthlyTypeIdsForViewBudgetCategory
        : expenseTypes.filter((t) => t.categoryId === viewBudgetCategoryId).map((t) => t.id);
    const record: Record<string, number> = {};
    const monthItems = allItemsForYear.filter((e) => e.month === viewBudgetMonth);
    for (const e of monthItems) {
      if (
        e.type !== "expense" ||
        !e.expenseTypeId ||
        !typeIds.includes(e.expenseTypeId)
      )
        continue;
      record[e.expenseTypeId] = (record[e.expenseTypeId] ?? 0) + e.amount;
    }
    return record;
  }, [viewBudgetCategoryId, viewBudgetMonth, monthlyTypeIdsForViewBudgetCategory, expenseTypes, allItemsForYear]);

  /** Map to yearly type ids so ViewBudgetDetailsModal (items use yearly type id) can look up amount. */
  const expenseByTypeIdForModalByYearlyType = useMemo(() => {
    if (!viewBudgetCategoryId) return {} as Record<string, number>;
    const yearlyTypesInCat = expenseTypes.filter((t) => t.categoryId === viewBudgetCategoryId);
    const result: Record<string, number> = {};
    for (const t of yearlyTypesInCat) {
      const key = t.sourceMonthlyTypeId ?? t.id;
      result[t.id] = expenseByTypeIdForModal[key] ?? 0;
    }
    return result;
  }, [viewBudgetCategoryId, expenseTypes, expenseByTypeIdForModal]);

  const expenseEntriesForBudgetModal = useMemo(() => {
    if (!viewBudgetCategoryId) return [];
    const typeIds =
      monthlyTypeIdsForViewBudgetCategory && monthlyTypeIdsForViewBudgetCategory.length > 0
        ? monthlyTypeIdsForViewBudgetCategory
        : expenseTypes.filter((t) => t.categoryId === viewBudgetCategoryId).map((t) => t.id);
    return allItemsForYear.filter(
      (e) =>
        e.month === viewBudgetMonth &&
        e.type === "expense" &&
        e.expenseTypeId &&
        typeIds.includes(e.expenseTypeId) &&
        (e.amount !== 0 || !!e.expenseTypeId)
    );
  }, [viewBudgetCategoryId, viewBudgetMonth, monthlyTypeIdsForViewBudgetCategory, expenseTypes, allItemsForYear]);

  /** Entries with expenseTypeId mapped to yearly type id when synced, so modal can group by yearly type. */
  const expenseEntriesForBudgetModalWithYearlyTypeId = useMemo(() => {
    return expenseEntriesForBudgetModal.map((e) => ({
      ...e,
      expenseTypeId:
        e.expenseTypeId
          ? (expenseTypes.find((t) => t.sourceMonthlyTypeId === e.expenseTypeId)?.id ?? e.expenseTypeId)
          : undefined,
    }));
  }, [expenseEntriesForBudgetModal, expenseTypes]);

  const budgetModalItems = useMemo(() => {
    if (!viewBudgetCategoryId) return [];
    const categoryTypesList = expenseTypes.filter((t) => t.categoryId === viewBudgetCategoryId);
    const budgetForMonth = budgetItems.filter(
      (b) => b.categoryId === viewBudgetCategoryId && b.month === viewBudgetMonth
    );
    const budgetByType = new Map<string, BudgetItem>();
    for (const b of budgetForMonth) {
      if (b.expenseTypeId) budgetByType.set(b.expenseTypeId, b);
    }
    return categoryTypesList.map((t) => {
      const existing = budgetByType.get(t.id);
      if (existing) return existing;
      return {
        id: `type-${t.id}`,
        name: t.name,
        amount: 0,
        year: selectedYear,
        month: viewBudgetMonth,
        categoryId: viewBudgetCategoryId,
        expenseTypeId: t.id,
      } as BudgetItem;
    });
  }, [viewBudgetCategoryId, viewBudgetMonth, expenseTypes, budgetItems, selectedYear]);

  const baseExpensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(
      state,
      selectedYear,
      editingMonth ?? 1,
      editingRowDay ?? undefined,
      undefined,
      selectedTypeId || undefined
    )
  );

  const expensesForEditingDay = useMemo(() => {
    if (!selectedCategoryId || !typeIdsForSelectedCategory?.length)
      return baseExpensesForEditingDay;
    return baseExpensesForEditingDay.filter(
      (e) => e.expenseTypeId && typeIdsForSelectedCategory.includes(e.expenseTypeId)
    );
  }, [baseExpensesForEditingDay, selectedCategoryId, typeIdsForSelectedCategory]);

  /** For modal: map monthly type ids to yearly so items show under yearly types. Monthly-sourced types become view-only. */
  const expensesForEditingDayMapped = useMemo(() => {
    if ((monthlyTypeIdsForYearlyCategory?.length ?? 0) === 0) return expensesForEditingDay;
    return expensesForEditingDay.map((e) => ({
      ...e,
      expenseTypeId: e.expenseTypeId
        ? (expenseTypes.find((t) => t.sourceMonthlyTypeId === e.expenseTypeId)?.id ?? e.expenseTypeId)
        : undefined,
    }));
  }, [expensesForEditingDay, monthlyTypeIdsForYearlyCategory?.length, expenseTypes]);

  /** Yearly type ids that are synced from monthly — view-only in modal. */
  const readOnlyTypeIdsForModal = useMemo(() => {
    if (!selectedCategoryId || (monthlyTypeIdsForYearlyCategory?.length ?? 0) === 0) return undefined;
    return expenseTypes
      .filter((t) => t.categoryId === selectedCategoryId && t.sourceMonthlyTypeId)
      .map((t) => t.id);
  }, [selectedCategoryId, monthlyTypeIdsForYearlyCategory?.length, expenseTypes]);

  const allExpensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(state, selectedYear, editingMonth ?? 1, editingRowDay ?? undefined)
  );

  const selectedCategoryLabel = selectedCategoryId
    ? (expenseCategories.find((c) => c.id === selectedCategoryId)?.name ?? "—")
    : "All";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      <SectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0 shrink-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t("yearlyEntries_title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("yearlyEntries_subtitle")}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:shrink-0 sm:items-center sm:justify-end">
            <MonthYearDatePicker
              years={years}
              year={selectedYear}
              onYearChange={setSelectedYear}
              mode="year-only"
              label=""
              className="w-full min-w-0 sm:w-auto sm:min-w-[120px]"
            />
            <SelectDropdown
              options={typeOptions}
              value={selectedTypeId}
              onChange={(v) => setSelectedTypeId(String(v))}
              label=""
              className="min-w-[130px]"
            />
          </div>
        </div>
      </SectionCard>

      {entriesLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 1 + Math.max(expenseCategories.length, 1) }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] min-h-[100px] w-full rounded-xl sm:rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {expenseCategories.map((cat) => {
            const preset = GRADIENT_PRESETS[cat.gradientPreset] ?? GRADIENT_PRESETS.violet;
            const summary = categorySummary.get(cat.id) ?? { debit: 0, credit: 0 };
            const isOverBudget = summary.credit > summary.debit;
            const isEqual = summary.debit > 0 && summary.debit === summary.credit;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                className={cn(
                  "flex min-w-0 flex-col overflow-hidden rounded-xl text-white shadow-float transition-all sm:rounded-2xl ring-2 ring-white/20 ring-offset-2 ring-offset-slate-900",
                  isSelected && "ring-2 ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900",
                  isEqual && "ring-2 ring-green-400/50 ring-offset-2 ring-offset-slate-900",
                  isOverBudget && "ring-2 ring-red-400/50 ring-offset-2 ring-offset-slate-900"
                )}
                style={{
                  background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
                }}
              >
                <div
                  className={cn(
                    "flex flex-1 flex-col rounded-lg p-3 sm:p-4",
                    isEqual && "bg-green-500/20",
                    isOverBudget && "bg-red-500/20"
                  )}
                >
                  <div className="mb-2 flex w-full items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <DynamicIcon
                          name={(cat.icon as IconName) || "folder"}
                          fallback={() => <FolderOpen className="h-4 w-4" strokeWidth={2} />}
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                      </span>
                      <p className="truncate text-sm font-semibold capitalize">{cat.name}</p>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white/15 px-2 py-1.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">Debit</p>
                      <p className="truncate text-xs font-semibold whitespace-nowrap">{formatMoneyK(summary.debit)}</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-2 py-1.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">Cost</p>
                      <p className="truncate text-xs font-semibold whitespace-nowrap">{formatMoneyK(summary.credit)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
          {t("entries_categoryLabel")}: <span className="font-semibold text-foreground">{selectedCategoryLabel}</span>
        </p>
        {selectedCategoryId && (() => {
          const selectedCat = expenseCategories.find((c) => c.id === selectedCategoryId);
          const preset = selectedCat ? (GRADIENT_PRESETS[selectedCat.gradientPreset as keyof typeof GRADIENT_PRESETS] ?? GRADIENT_PRESETS.violet) : GRADIENT_PRESETS.violet;
          return (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadYearExpenseExcel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 text-white transition hover:opacity-90"
                style={{
                  background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
                }}
                aria-label="Download yearly expense (Excel/CSV)"
                title="Download as Excel"
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 border-0 text-white hover:opacity-90"
                style={{
                  background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
                }}
                onClick={() => openViewBudget(selectedCategoryId, expandedMonth ?? 1)}
              >
                {t("entries_viewBudgetDetails")}
              </Button>
            </div>
          );
        })()}
      </div>

      <div className="space-y-1">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((monthNum) => {
          const isExpanded = expandedMonth === monthNum;
          const monthLabel = MONTH_NAMES[monthNum - 1];
          const tableRows = getTableRowsForMonth(monthNum);
          const monthTotal = tableRows.reduce((s, r) => s + r.credit, 0);
          return (
            <div
              key={monthNum}
              className={cn(
                "overflow-hidden rounded-xl border",
                isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/60"
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedMonth(isExpanded ? null : monthNum)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition",
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-100/80"
                )}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>
                    {monthLabel} {selectedYear}
                  </span>
                </div>
                <span className={cn("text-sm font-medium", DEFAULT_AMOUNT_COLOR)}>
                  {formatMoneyK(monthTotal)}
                </span>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#ddd] dark:border-white/10">
                      <div className="min-w-0 overflow-x-auto">
                        <div className={cn("min-w-[520px] overflow-hidden", isDark ? "border-white/10" : "border-[#ddd]")}>
                          <div
                            className={cn(
                              "grid gap-0 border-b p-2.5 text-xs font-semibold grid-cols-[minmax(70px,0.9fr)_minmax(60px,0.35fr)_minmax(0,2.65fr)_minmax(60px,0.7fr)_minmax(60px,0.6fr)] md:grid-cols-[minmax(85px,1fr)_minmax(88px,1fr)_minmax(120px,2.8fr)_minmax(70px,0.8fr)_minmax(70px,0.7fr)]",
                              isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50"
                            )}
                          >
                            <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>{t("entries_date")}</div>
                            <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>{t("entries_note")}</div>
                            <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>{t("entries_type")}</div>
                            <div className={cn("p-2.5 text-left", DEFAULT_AMOUNT_COLOR)}>{t("entries_amount")}</div>
                            <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>{t("entries_action")}</div>
                          </div>
                          <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-[#ddd]")}>
                            {tableRows.map(({ day, types, credit, dayNote }) => {
                              const hasData = credit > 0 || types.length > 0;
                              return (
                                <div
                                  key={day}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleEditRow(monthNum, day)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleEditRow(monthNum, day);
                                    }
                                  }}
                                  className={cn(
                                    "relative grid gap-0 cursor-pointer items-center overflow-visible p-2.5 text-sm grid-cols-[minmax(70px,0.9fr)_minmax(60px,0.35fr)_minmax(0,2.65fr)_minmax(60px,0.7fr)_minmax(60px,0.6fr)] md:grid-cols-[minmax(85px,1fr)_minmax(88px,1fr)_minmax(120px,2.8fr)_minmax(70px,0.8fr)_minmax(70px,0.7fr)]",
                                    isDark ? "hover:bg-white/5" : "hover:bg-slate-50/80"
                                  )}
                                >
                                  <div className={cn("truncate p-2.5 text-left font-medium whitespace-nowrap", isDark ? "text-slate-200" : "text-slate-800")}>
                                    {day} {monthLabel} {selectedYear}
                                  </div>
                                  <div className="flex items-center justify-center p-2.5 text-left md:justify-start">
                                    <div className={cn("hidden min-w-0 flex-1 truncate text-sm md:block", isDark ? "text-slate-400" : "text-slate-600")}>
                                      {dayNote || "—"}
                                    </div>
                                    <div className="flex md:hidden">
                                      {dayNote ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNotePopup({ month: monthNum, day, note: dayNote });
                                          }}
                                          className={cn("rounded-lg p-1.5 transition", isDark ? "text-violet-400 hover:bg-white/10" : "text-violet-600 hover:bg-violet-100")}
                                          aria-label={t("entries_viewNote")}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </button>
                                      ) : (
                                        <span className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>—</span>
                                      )}
                                    </div>
                                  </div>
                                  <div data-expense-entry-types-popover className="flex flex-wrap items-center justify-start gap-1 p-2.5 text-left">
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 md:hidden">
                                      {types.length > 0 ? (
                                        types.length > 1 ? (
                                          <button
                                            type="button"
                                            data-types-trigger-day={day}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setTypesPopover((prev) =>
                                                prev?.day === day && prev?.month === monthNum ? null : { month: monthNum, day, types, rect }
                                              );
                                            }}
                                            className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800")}
                                          >
                                            {types[0]} +{types.length - 1}
                                          </button>
                                        ) : (
                                          <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800")}>
                                            {types[0]}
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </div>
                                    <div className="hidden flex-wrap items-center gap-1 md:flex">
                                      {types.length > 0 ? (
                                        types.map((t) => (
                                          <span key={t} className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800")}>
                                            {t}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className={cn("truncate p-2.5 text-left font-medium whitespace-nowrap", DEFAULT_AMOUNT_COLOR)}>
                                    {credit > 0 ? formatMoneyK(credit) : "—"}
                                  </div>
                                  <div
                                    data-expense-entry-action-menu
                                    className="relative flex items-center justify-start gap-1 p-2.5 text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Same Action column as monthly: Edit/Add + Delete. Modal uses readOnlyTypeIds for monthly-sourced view-only. */}
                                    <div className="sm:hidden">
                                      {hasData ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenActionDay(openActionDay === day && openActionMonth === monthNum ? null : day);
                                              setOpenActionMonth(openActionDay === day && openActionMonth === monthNum ? null : monthNum);
                                            }}
                                            className={cn("rounded-lg p-2 transition", isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800")}
                                            aria-label="Actions"
                                          >
                                            <MoreVertical className="h-5 w-5" />
                                          </button>
                                          {openActionDay === day && openActionMonth === monthNum && (
                                            <div
                                              onClick={(e) => e.stopPropagation()}
                                              className={cn("absolute right-0 top-full z-[100] mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg", isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white")}
                                            >
                                              <button type="button" onClick={() => { handleEditRow(monthNum, day); setOpenActionDay(null); setOpenActionMonth(null); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition", isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100")}>
                                                <Pencil className="h-4 w-4" /> {t("common_edit")}
                                              </button>
                                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteRow(monthNum, day); setOpenActionDay(null); setOpenActionMonth(null); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition", isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50")}>
                                                <Trash2 className="h-4 w-4" /> {t("common_delete")}
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <button type="button" onClick={() => handleEditRow(monthNum, day)} className={cn("rounded-lg p-2 transition", isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800")} aria-label={t("common_add")}>
                                          <Plus className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="hidden sm:flex sm:items-center sm:gap-1">
                                      <button type="button" onClick={() => handleEditRow(monthNum, day)} className={cn("rounded p-1.5 transition", editingRowDay === day && editingMonth === monthNum ? "bg-violet-500/30 text-violet-400" : isDark ? "text-slate-400 hover:bg-white/10 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700")} aria-label={hasData ? t("common_edit") : t("common_add")}>
                                        {hasData ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                      </button>
                                      {hasData && (
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteRow(monthNum, day); }} className={cn("rounded p-1.5 transition", isDark ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400" : "text-slate-500 hover:bg-red-100 hover:text-red-600")} aria-label={t("common_delete")}>
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={deleteConfirmDay != null}
        onClose={() => {
          setDeleteConfirmDay(null);
          setDeleteConfirmMonth(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("entries_deleteExpensesTitle")}
        message={t("entries_deleteExpensesMessage")}
        confirmLabel={t("common_delete")}
      />

      {notePopup != null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-label={t("entries_note")}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setNotePopup(null)}
          >
            <div
              className={cn(
                "max-h-[60vh] max-w-sm overflow-auto rounded-xl border p-4 shadow-lg",
                isDark ? "border-white/20 bg-violet-950/95" : "border-[#ddd] bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={cn("mb-1 text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("entries_note")} — {notePopup.day} {MONTH_NAMES[notePopup.month - 1]} {selectedYear}
              </p>
              <p className={cn("whitespace-pre-wrap text-sm", isDark ? "text-slate-200" : "text-slate-800")}>
                {notePopup.note}
              </p>
            </div>
          </div>,
          document.body
        )}

      {editingRowDay != null && editingMonth != null && (
        <EditDayExpensesModal
          open={true}
          onClose={() => {
            setEditingRowDay(null);
            setEditingMonth(null);
          }}
          day={editingRowDay}
          year={selectedYear}
          month={editingMonth}
          selectedCategoryId={selectedCategoryId || ""}
          selectedTypeId={selectedTypeId}
          expensesForDay={expensesForEditingDayMapped}
          allExpensesForDay={allExpensesForEditingDay}
          categoryTypes={categoryTypes.map((t) => ({ id: t.id, name: t.name, mainCategoryId: t.mainCategoryId }))}
          readOnlyTypeIds={readOnlyTypeIdsForModal}
          firestoreApi={hasFirestoreExpenses ? { addEntry, updateEntry, removeEntry } : undefined}
        />
      )}

      {viewBudgetCategoryId != null && (
        <ViewBudgetDetailsModal
          open={true}
          onClose={() => setViewBudgetCategoryId(null)}
          categoryName={expenseCategories.find((c) => c.id === viewBudgetCategoryId)?.name ?? ""}
          year={selectedYear}
          month={viewBudgetMonth}
          items={budgetModalItems}
          expenseByTypeId={expenseByTypeIdForModalByYearlyType}
          expenseEntries={expenseEntriesForBudgetModalWithYearlyTypeId}
        />
      )}
    </motion.div>
  );
}

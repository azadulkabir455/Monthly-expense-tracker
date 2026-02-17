"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectExpensesFiltered,
  selectExpenseTypes,
  removeExpense,
} from "@/store/slices/expensesSlice";
import { MAIN_EXPENSE_CATEGORIES } from "@/types/expense";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/SelectDropdown";
import { ConfirmModal } from "@/blocks/components/ConfirmModal";
import { EditDayExpensesModal } from "@/blocks/components/EditDayExpensesModal";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { useClientDate } from "@/hooks/useClientDate";
import { useStartYear } from "@/hooks/useStartYear";
import type { LucideIcon } from "lucide-react";
import { Pencil, Plus, Trash2, MoreVertical, ShoppingCart, Briefcase, BookOpen, Pill, FolderOpen } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  basar: ShoppingCart,
  bebosar: Briefcase,
  study: BookOpen,
  medicine: Pill,
  other: FolderOpen,
};

/** Gradient backgrounds matching the summary cards */
const CATEGORY_GRADIENTS: Record<string, string> = {
  basar: "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700",
  bebosar: "bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600",
  study: "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500",
  medicine: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600",
  other: "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700",
};

/** Category colors for Debit/Credit in table */
const CATEGORY_COLORS: Record<string, { debit: string; credit: string }> = {
  basar: { debit: "text-emerald-600 dark:text-emerald-400", credit: "text-emerald-700 dark:text-emerald-300" },
  bebosar: { debit: "text-blue-600 dark:text-blue-400", credit: "text-blue-700 dark:text-blue-300" },
  study: { debit: "text-amber-600 dark:text-amber-400", credit: "text-amber-700 dark:text-amber-300" },
  medicine: { debit: "text-rose-600 dark:text-rose-400", credit: "text-rose-700 dark:text-rose-300" },
  other: { debit: "text-violet-600 dark:text-violet-400", credit: "text-violet-700 dark:text-violet-300" },
};

export function ExpensesEntriesSection() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { year: currentYear, month: currentMonth0, isClient } = useClientDate();
  const currentMonth = currentMonth0 + 1;
  const startYear = useStartYear();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    MAIN_EXPENSE_CATEGORIES[0]?.id ?? "basar"
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [editingRowDay, setEditingRowDay] = useState<number | null>(null);
  const [deleteConfirmDay, setDeleteConfirmDay] = useState<number | null>(null);
  const [openActionDay, setOpenActionDay] = useState<number | null>(null);

  const years = useMemo(
    () => Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i),
    [currentYear, startYear]
  );

  const expenseTypes = useAppSelector(selectExpenseTypes);
  const categoryTypes = useMemo(
    () => expenseTypes.filter((t) => t.mainCategoryId === selectedCategoryId),
    [expenseTypes, selectedCategoryId]
  );
  const typeOptions: SelectOption[] = [
    { value: "", label: "All Types" },
    ...categoryTypes.map((t) => ({ value: t.id, label: t.name })),
  ];

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  useEffect(() => {
    if (isClient) {
      setSelectedDate(new Date(currentYear, currentMonth0, 1));
    }
  }, [isClient, currentYear, currentMonth0]);

  useEffect(() => {
    setSelectedTypeId("");
  }, [selectedCategoryId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-expense-entry-action-menu]")) setOpenActionDay(null);
    }
    if (openActionDay != null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionDay]);

  const allItemsForMonth = useAppSelector((state) =>
    state.expenses.items.filter((e) => e.year === year && e.month === month)
  );

  const categorySummary = useMemo(() => {
    const byCat = new Map<string, { debit: number; credit: number }>();
    for (const cat of MAIN_EXPENSE_CATEGORIES) {
      byCat.set(cat.id, { debit: 0, credit: 0 });
    }
    for (const e of allItemsForMonth) {
      const key = MAIN_EXPENSE_CATEGORIES.some((c) => c.id === e.category) ? e.category : "other";
      const cur = byCat.get(key)!;
      if (e.type === "income" && e.amount > 0) cur.debit += e.amount;
      else if (e.type === "expense" && e.amount > 0) cur.credit += e.amount;
    }
    return byCat;
  }, [allItemsForMonth]);

  const allExpensesForMonth = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, undefined, selectedCategoryId, selectedTypeId || undefined)
  );

  const tableRows = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
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
        const t = expenseTypes.find((x) => x.id === e.expenseTypeId);
        if (t) cur.types.add(t.name);
      }
    }
    for (const e of allExpensesForMonth) {
      if (e.type !== "expense" || e.amount !== 0 || e.expenseTypeId) continue;
      const day = new Date(e.date).getDate();
      const cur = byDay.get(day);
      if (cur) cur.dayNote = e.description ?? "";
    }
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
  }, [allExpensesForMonth, allItemsForMonth, year, month, expenseTypes]);

  const handleEditRow = (day: number) => {
    setEditingRowDay(day);
  };

  const handleDeleteRow = (day: number) => {
    setDeleteConfirmDay(day);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmDay == null) return;
    const toDelete = allExpensesForMonth.filter((e) => {
      if (e.type !== "expense") return false;
      const c = MAIN_EXPENSE_CATEGORIES.some((c2) => c2.id === e.category)
        ? e.category
        : "other";
      if (c !== selectedCategoryId) return false;
      if (selectedTypeId && e.expenseTypeId !== selectedTypeId) return false;
      return new Date(e.date).getDate() === deleteConfirmDay;
    });
    toDelete.forEach((e) => dispatch(removeExpense(e.id)));
    setDeleteConfirmDay(null);
  };

  const expensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, editingRowDay ?? undefined, selectedCategoryId, selectedTypeId || undefined)
  );

  const allExpensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, editingRowDay ?? undefined)
  );

  const monthLabel = MONTH_NAMES[month - 1] ?? "";
  const catColors = CATEGORY_COLORS[selectedCategoryId] ?? CATEGORY_COLORS.other;
  const selectedCategoryLabel = MAIN_EXPENSE_CATEGORIES.find((c) => c.id === selectedCategoryId)?.label ?? "Grocery";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      {/* Title area */}
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-[#ddd] bg-white px-4 py-4 shadow-card-lg dark:border-white/10 dark:bg-white/5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        )}
      >
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Expenses Entries
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage your expense transactions by date and category.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:shrink-0 sm:items-center sm:justify-end">
          <MonthYearDatePicker
            years={years}
            year={year}
            month={month}
            onYearChange={(y) => setSelectedDate(new Date(y, month - 1, 1))}
            onMonthChange={(m) => setSelectedDate(new Date(year, m - 1, 1))}
            label=""
            className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
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

      {/* Category cards - gradient bg, title, debit & credit */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {MAIN_EXPENSE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] ?? FolderOpen;
          const gradient = CATEGORY_GRADIENTS[cat.id] ?? CATEGORY_GRADIENTS.other;
          const summary = categorySummary.get(cat.id) ?? { debit: 0, credit: 0 };
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "flex min-w-0 flex-col overflow-hidden rounded-xl text-left text-white shadow-float transition-all sm:rounded-2xl",
                gradient,
                isSelected && "ring-2 ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900"
              )}
            >
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="truncate text-sm font-semibold capitalize">{cat.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-white/15 px-2 py-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">Debit</p>
                    <p className="truncate text-xs font-semibold">{formatMoneyK(summary.debit)}</p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-2 py-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">Credit</p>
                    <p className="truncate text-xs font-semibold">{formatMoneyK(summary.credit)}</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected category label + Table */}
      <div className="space-y-2">
        <p className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
          Category: <span className="font-semibold text-foreground">{selectedCategoryLabel}</span>
        </p>
        <div className="min-w-0 overflow-x-auto rounded-xl">
        <div
          className={cn(
            "min-w-[520px] overflow-hidden rounded-xl border",
            isDark ? "border-white/10" : "border-[#ddd]"
          )}
        >
        <div
          className={cn(
            "grid gap-0 border-b p-2.5 text-xs font-semibold",
            "grid-cols-[minmax(85px,1fr)_minmax(120px,2.5fr)_minmax(100px,2fr)_minmax(70px,0.8fr)_minmax(70px,0.7fr)]",
            isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50"
          )}
        >
          <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>Date</div>
          <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>Note</div>
          <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>Type</div>
          <div className={cn("p-2.5 text-left", catColors.credit)}>Amount</div>
          <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>Action</div>
        </div>

        <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-[#ddd]")}>
          {tableRows.map(({ day, types, debit, credit, dayNote }) => {
            const hasData = credit > 0 || debit > 0 || types.length > 0;
            return (
              <div
                key={day}
                className={cn(
                  "relative grid gap-0 items-center overflow-visible p-2.5 text-sm",
                  "grid-cols-[minmax(85px,1fr)_minmax(120px,2.5fr)_minmax(100px,2fr)_minmax(70px,0.8fr)_minmax(70px,0.7fr)]",
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-50/80"
                )}
              >
                <div className={cn("truncate p-2.5 text-left font-medium whitespace-nowrap", isDark ? "text-slate-200" : "text-slate-800")}>
                  {day} {monthLabel} {year}
                </div>
                <div className={cn("truncate p-2.5 text-left text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                  {dayNote || "—"}
                </div>
                <div className="flex flex-nowrap items-center justify-start gap-1 overflow-hidden p-2.5 text-left">
                  {types.length > 0 ? (
                    types.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                          isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800"
                        )}
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className={cn("truncate p-2.5 text-left font-medium", catColors.credit)}>
                  {credit > 0 ? formatMoneyK(credit) : "—"}
                </div>
                <div data-expense-entry-action-menu className="relative flex items-center justify-start gap-1 p-2.5 text-left">
                  {/* Mobile: 3 dots for Edit/Delete, Add icon for Add */}
                  <div className="sm:hidden">
                    {hasData ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenActionDay(openActionDay === day ? null : day)}
                          className={cn(
                            "rounded-lg p-2 transition",
                            isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          )}
                          aria-label="Actions"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openActionDay === day && (
                      <div
                        className={cn(
                          "absolute right-0 top-full z-[100] mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg",
                          isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleEditRow(day);
                            setOpenActionDay(null);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                            isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        {hasData && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteRow(day);
                              setOpenActionDay(null);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                              isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </div>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEditRow(day)}
                        className={cn(
                          "rounded-lg p-2 transition",
                          isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                        )}
                        aria-label="Add"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  {/* Desktop: edit + delete buttons */}
                  <div className="hidden sm:flex sm:items-center sm:gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditRow(day)}
                      className={cn(
                        "rounded p-1.5 transition",
                        editingRowDay === day
                          ? "bg-violet-500/30 text-violet-400"
                          : isDark
                            ? "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      )}
                      aria-label={hasData ? "Edit" : "Add"}
                    >
                      {hasData ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                    {hasData && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(day)}
                        className={cn(
                          "rounded p-1.5 transition",
                          isDark
                            ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                            : "text-slate-500 hover:bg-red-100 hover:text-red-600"
                        )}
                        aria-label="Delete"
                      >
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

      <ConfirmModal
        open={deleteConfirmDay != null}
        onClose={() => setDeleteConfirmDay(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expenses"
        message="Are you sure you want to delete these expenses?"
        confirmLabel="Delete"
      />

      {editingRowDay != null && (
        <EditDayExpensesModal
          open={true}
          onClose={() => setEditingRowDay(null)}
          day={editingRowDay}
          year={year}
          month={month}
          selectedCategoryId={selectedCategoryId}
          selectedTypeId={selectedTypeId}
          expensesForDay={expensesForEditingDay}
          allExpensesForDay={allExpensesForEditingDay}
          categoryTypes={categoryTypes.map((t) => ({ id: t.id, name: t.name, mainCategoryId: t.mainCategoryId }))}
        />
      )}
    </motion.div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectExpensesFiltered, removeExpense } from "@/store/slices/expensesSlice";
import { useExpenseCategories, useExpenseTypes, useExpenseEntries } from "@/lib/firebase/expenses";
import { useBudgetDebit, useBudgetItems } from "@/lib/firebase/budget";
import { Button } from "@/blocks/elements/Button";
import { MonthYearDatePicker } from "@/blocks/components/MonthYearDatePicker";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { ConfirmModal } from "@/blocks/components/shared/ConfirmModal";
import { EditDayExpensesModal } from "@/blocks/components/EditDayExpensesModal";
import { ViewBudgetDetailsModal } from "@/blocks/components/ViewBudgetDetailsModal";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { useClientDate } from "@/hooks/useClientDate";
import { useStartYear } from "@/hooks/useStartYear";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
import { Skeleton } from "@/blocks/elements/Skeleton";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, MoreVertical, FolderOpen, FileSpreadsheet } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Default color for amount column when a category is selected */
const DEFAULT_AMOUNT_COLOR = "text-violet-600 dark:text-violet-400";

export function ExpensesEntriesSection() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { year: currentYear, month: currentMonth0, isClient } = useClientDate();
  const currentMonth = currentMonth0 + 1;
  const startYear = useStartYear();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [editingRowDay, setEditingRowDay] = useState<number | null>(null);
  const [deleteConfirmDay, setDeleteConfirmDay] = useState<number | null>(null);
  const [openActionDay, setOpenActionDay] = useState<number | null>(null);
  const [typesPopover, setTypesPopover] = useState<{
    day: number;
    types: string[];
    rect: DOMRect;
  } | null>(null);
  const [viewBudgetCategoryId, setViewBudgetCategoryId] = useState<string | null>(null);

  const years = useMemo(
    () => Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i),
    [currentYear, startYear]
  );

  const { categories: expenseCategories, loading: categoriesLoading } = useExpenseCategories();
  const { types: expenseTypes, loading: typesLoading } = useExpenseTypes();
  const { addEntry, updateEntry, removeEntry, isAuthenticated: hasFirestoreExpenses } = useExpenseEntries();
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
  const typeIdsForSelectedCategory = useMemo(
    () =>
      selectedCategoryId
        ? expenseTypes.filter((t) => t.categoryId === selectedCategoryId).map((t) => t.id)
        : null,
    [expenseTypes, selectedCategoryId]
  );

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

  /** Default to first category; keep selection when switching date if still in list */
  useEffect(() => {
    if (expenseCategories.length === 0) return;
    const firstId = expenseCategories[0]?.id ?? "";
    setSelectedCategoryId((prev) =>
      prev && expenseCategories.some((c) => c.id === prev) ? prev : firstId
    );
  }, [expenseCategories]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-expense-entry-action-menu]")) setOpenActionDay(null);
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

  useEffect(() => {
    if (typesPopover == null) return;
    const day = typesPopover.day;
    function updateRect() {
      const el = document.querySelector<HTMLElement>(`[data-types-trigger-day="${day}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTypesPopover((prev) => (prev ? { ...prev, rect } : null));
      }
    }
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [typesPopover?.day]);

  const allItemsForMonth = useAppSelector((state) =>
    state.expenses.items.filter((e) => e.year === year && e.month === month)
  );

  const baseExpensesForMonth = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, undefined, undefined, selectedTypeId || undefined)
  );

  const allExpensesForMonth = useMemo(() => {
    if (!selectedCategoryId || !typeIdsForSelectedCategory?.length)
      return baseExpensesForMonth;
    return baseExpensesForMonth.filter(
      (e) => e.expenseTypeId && typeIdsForSelectedCategory.includes(e.expenseTypeId)
    );
  }, [baseExpensesForMonth, selectedCategoryId, typeIdsForSelectedCategory]);

  const { debit: budgetDebit, loading: budgetDebitLoading } = useBudgetDebit(year, month);
  const { items: budgetItems, loading: budgetItemsLoading } = useBudgetItems(year, month);

  const entriesLoading =
    categoriesLoading || typesLoading || budgetDebitLoading || budgetItemsLoading;

  const categorySummary = useMemo(() => {
    const byCat = new Map<string, { debit: number; credit: number }>();
    const totalDebit = budgetDebit ?? 0;
    for (const cat of expenseCategories) {
      const credit = budgetItems
        .filter((b) => b.categoryId === cat.id)
        .reduce((s, b) => s + b.amount, 0);
      byCat.set(cat.id, { debit: totalDebit, credit });
    }
    return byCat;
  }, [expenseCategories, budgetItems, budgetDebit]);

  /** Per category: budget total (from budget list), expense this month, remaining = budget - expense */
  const categoryBudgetRemaining = useMemo(() => {
    const map = new Map<string, { budgetTotal: number; totalExpense: number; remaining: number }>();
    for (const cat of expenseCategories) {
      const budgetTotal = budgetItems
        .filter((b) => b.categoryId === cat.id)
        .reduce((s, b) => s + b.amount, 0);
      const typeIds = expenseTypes
        .filter((t) => t.categoryId === cat.id)
        .map((t) => t.id);
      const totalExpense =
        typeIds.length === 0
          ? 0
          : allItemsForMonth
              .filter(
                (e) =>
                  e.type === "expense" &&
                  e.expenseTypeId &&
                  typeIds.includes(e.expenseTypeId)
              )
              .reduce((s, e) => s + e.amount, 0);
      const remaining = budgetTotal - totalExpense;
      map.set(cat.id, { budgetTotal, totalExpense, remaining });
    }
    return map;
  }, [expenseCategories, budgetItems, expenseTypes, allItemsForMonth]);

  /** Per expense-type total for the category shown in budget modal (for Month expense / Due columns) */
  const expenseByTypeIdForModal = useMemo(() => {
    if (!viewBudgetCategoryId) return {} as Record<string, number>;
    const typeIds = expenseTypes
      .filter((t) => t.categoryId === viewBudgetCategoryId)
      .map((t) => t.id);
    const record: Record<string, number> = {};
    for (const e of allItemsForMonth) {
      if (e.type !== "expense" || !e.expenseTypeId || !typeIds.includes(e.expenseTypeId)) continue;
      record[e.expenseTypeId] = (record[e.expenseTypeId] ?? 0) + e.amount;
    }
    return record;
  }, [viewBudgetCategoryId, expenseTypes, allItemsForMonth]);

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
    // Day notes are per category: show only the note for the selected category for each day (if any)
    const noteCategory = selectedCategoryId || "other";
    for (const e of baseExpensesForMonth) {
      if (e.type !== "expense" || e.amount !== 0 || e.expenseTypeId || e.category !== noteCategory) continue;
      const desc = (e.description ?? "").trim();
      const day = new Date(e.date).getDate();
      const cur = byDay.get(day);
      if (cur) cur.dayNote = desc === "hello dear" ? "" : desc;
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
  }, [allExpensesForMonth, baseExpensesForMonth, allItemsForMonth, year, month, expenseTypes, selectedCategoryId]);

  const handleDownloadMonthExpenseExcel = () => {
    // Use same list as table (current view); exclude note-only rows (amount 0, no type)
    const expenses = [...allExpensesForMonth]
      .filter((e) => e.type === "expense" && (e.amount !== 0 || !!e.expenseTypeId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const escape = (v: string) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    // Column order: Date, Type, Item Name, Amount — date & type only on first row of each group (no repeat)
    const header = "Date,Type,Item Name,Amount";
    let lastDate = "";
    let lastType = "";
    const rows = expenses.map((e) => {
      const dateStr = e.date
        ? (() => {
            const d = new Date(e.date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
          })()
        : "";
      const typeName = e.expenseTypeId
        ? (expenseTypes.find((t) => t.id === e.expenseTypeId)?.name ?? "")
        : "";
      const itemName = (e.description ?? "").trim();
      const amount = Number(e.amount) ?? 0;
      const showDate = dateStr !== lastDate || typeName !== lastType;
      if (showDate) {
        lastDate = dateStr;
        lastType = typeName;
      }
      const dateCol = showDate ? escape(dateStr) : "";
      const typeCol = showDate ? escape(typeName) : "";
      return [dateCol, typeCol, escape(itemName), amount].join(",");
    });
    const csv = [header, ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-expense-${MONTH_NAMES[month - 1]}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started.");
  };

  const handleEditRow = (day: number) => {
    setEditingRowDay(day);
  };

  const handleDeleteRow = (day: number) => {
    setDeleteConfirmDay(day);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmDay == null) return;
    const toDelete = allExpensesForMonth.filter(
      (e) => new Date(e.date).getDate() === deleteConfirmDay
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
  };

  const baseExpensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, editingRowDay ?? undefined, undefined, selectedTypeId || undefined)
  );

  const expensesForEditingDay = useMemo(() => {
    if (!selectedCategoryId || !typeIdsForSelectedCategory?.length)
      return baseExpensesForEditingDay;
    return baseExpensesForEditingDay.filter(
      (e) => e.expenseTypeId && typeIdsForSelectedCategory.includes(e.expenseTypeId)
    );
  }, [baseExpensesForEditingDay, selectedCategoryId, typeIdsForSelectedCategory]);

  const allExpensesForEditingDay = useAppSelector((state) =>
    selectExpensesFiltered(state, year, month, editingRowDay ?? undefined)
  );

  const monthLabel = MONTH_NAMES[month - 1] ?? "";
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

      {/* Category cards: Firestore categories – name on top, debit/credit */}
      {entriesLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] min-h-[100px] w-full rounded-xl sm:rounded-2xl" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {expenseCategories.map((cat) => {
          const preset = GRADIENT_PRESETS[cat.gradientPreset] ?? GRADIENT_PRESETS.violet;
          const gradientStyle = {
            background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
          };
          const summary = categorySummary.get(cat.id) ?? { debit: 0, credit: 0 };
          const isSelected = selectedCategoryId === cat.id;
          return (
            <div
              key={cat.id}
              className={cn(
                "flex min-w-0 flex-col overflow-hidden rounded-xl text-white shadow-float transition-all sm:rounded-2xl",
                "ring-2 ring-white/20 ring-offset-2 ring-offset-slate-900",
                isSelected && "ring-2 ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900"
              )}
              style={gradientStyle}
            >
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                {/* Row 1: Category text (icon + name) left, Baki + button right */}
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
                    <p className="truncate text-xs font-semibold">{formatMoneyK(summary.debit)}</p>
                  </div>
                  <div className="rounded-lg bg-white/15 px-2 py-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">Budget</p>
                    <p className="truncate text-xs font-semibold">{formatMoneyK(summary.credit)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {entriesLoading ? (
        <Skeleton className="h-5 w-48" />
      ) : (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
          Category: <span className="font-semibold text-foreground">{selectedCategoryLabel}</span>
        </p>
        {selectedCategoryId && (() => {
          const selectedCat = expenseCategories.find((c) => c.id === selectedCategoryId);
          const preset = selectedCat ? (GRADIENT_PRESETS[selectedCat.gradientPreset as keyof typeof GRADIENT_PRESETS] ?? GRADIENT_PRESETS.violet) : GRADIENT_PRESETS.violet;
          return (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMonthExpenseExcel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 text-white transition hover:opacity-90"
                style={{
                  background: `linear-gradient(to bottom right, ${preset.fromColor}, ${preset.toColor})`,
                }}
                aria-label="Download monthly expense (Excel/CSV)"
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
                onClick={() => setViewBudgetCategoryId(selectedCategoryId)}
              >
                View budget details
              </Button>
            </div>
          );
        })()}
      </div>
      )}

      <div className="space-y-2">
        {entriesLoading ? (
          <div className="min-w-0 overflow-hidden rounded-xl border border-[#ddd] dark:border-white/10">
            <div className={cn("border-b p-2.5", isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50")}>
              <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
            <div className={cn("divide-y p-2.5", isDark ? "divide-white/10" : "divide-[#ddd]")}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex gap-2 py-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1 max-w-[120px]" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        ) : (
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
          <div className={cn("p-2.5 text-left", DEFAULT_AMOUNT_COLOR)}>Amount</div>
          <div className={cn("p-2.5 text-left", isDark ? "text-slate-300" : "text-slate-700")}>Action</div>
        </div>

        <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-[#ddd]")}>
          {tableRows.map(({ day, types, debit, credit, dayNote }) => {
            const hasData = credit > 0 || debit > 0 || types.length > 0;
            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => handleEditRow(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleEditRow(day);
                  }
                }}
                className={cn(
                  "relative grid gap-0 cursor-pointer items-center overflow-visible p-2.5 text-sm",
                  "grid-cols-[minmax(85px,1fr)_minmax(120px,2.5fr)_minmax(100px,2fr)_minmax(70px,0.8fr)_minmax(70px,0.7fr)]",
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-50/80"
                )}
              >
                <div className={cn("truncate p-2.5 text-left font-medium whitespace-nowrap", isDark ? "text-slate-200" : "text-slate-800")}>
                  {day} {monthLabel}{" "}
                  <span className="hidden sm:inline">{year}</span>
                </div>
                <div className={cn("truncate p-2.5 text-left text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                  {dayNote || "—"}
                </div>
                <div
                  data-expense-entry-types-popover
                  className="flex flex-nowrap items-center justify-start gap-1 overflow-hidden p-2.5 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Mobile / narrow: abbreviated "type +N" with popover for all */}
                  <div className="flex min-w-0 flex-1 items-center gap-1 md:hidden">
                    {types.length > 0 ? (
                      types.length > 1 ? (
                        <button
                          type="button"
                          data-types-trigger-day={day}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTypesPopover((prev) =>
                              prev?.day === day ? null : { day, types, rect }
                            );
                          }}
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-left",
                            isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800"
                          )}
                        >
                          {types[0]} +{types.length - 1}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                            isDark ? "bg-violet-500/30 text-violet-200" : "bg-violet-100 text-violet-800"
                          )}
                        >
                          {types[0]}
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  {/* Desktop / wide: show all types */}
                  <div className="hidden flex-nowrap items-center gap-1 overflow-hidden md:flex">
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
                </div>
                <div className={cn("truncate p-2.5 text-left font-medium", DEFAULT_AMOUNT_COLOR)}>
                  {credit > 0 ? formatMoneyK(credit) : "—"}
                </div>
                <div data-expense-entry-action-menu className="relative flex items-center justify-start gap-1 p-2.5 text-left">
                  {/* Mobile: 3 dots for Edit/Delete, Add icon for Add */}
                  <div className="sm:hidden">
                    {hasData ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionDay(openActionDay === day ? null : day);
                          }}
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
                        onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => {
                              e.stopPropagation();
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
                  <div className="hidden sm:flex sm:items-center sm:gap-1" onClick={(e) => e.stopPropagation()}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(day);
                        }}
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
        )}
      </div>

      <ConfirmModal
        open={deleteConfirmDay != null}
        onClose={() => setDeleteConfirmDay(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expenses"
        message="Are you sure you want to delete these expenses?"
        confirmLabel="Delete"
      />

      {typesPopover != null &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            const rect = typesPopover.rect;
            const popupMinWidth = 140;
            const gap = 4;
            let left = rect.left;
            if (left + popupMinWidth > window.innerWidth - 8) left = window.innerWidth - popupMinWidth - 8;
            if (left < 8) left = 8;
            return (
          <div
            role="dialog"
            aria-label="Types"
            className={cn(
              "fixed z-[200] max-h-40 min-w-[140px] overflow-auto rounded-xl border py-2 shadow-lg",
              isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
            )}
            style={{
              position: "fixed",
              top: rect.bottom + gap,
              left,
            }}
          >
            {typesPopover.types.map((t) => (
              <div
                key={t}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium",
                  isDark ? "text-violet-200" : "text-violet-800"
                )}
              >
                {t}
              </div>
            ))}
          </div>
            );
          })(),
          document.body
        )}

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
          firestoreApi={hasFirestoreExpenses ? { addEntry, updateEntry, removeEntry } : undefined}
        />
      )}

      {viewBudgetCategoryId != null && (
        <ViewBudgetDetailsModal
          open={true}
          onClose={() => setViewBudgetCategoryId(null)}
          categoryName={expenseCategories.find((c) => c.id === viewBudgetCategoryId)?.name ?? ""}
          year={year}
          month={month}
          items={budgetItems.filter((b) => b.categoryId === viewBudgetCategoryId)}
          expenseByTypeId={expenseByTypeIdForModal}
        />
      )}
    </motion.div>
  );
}

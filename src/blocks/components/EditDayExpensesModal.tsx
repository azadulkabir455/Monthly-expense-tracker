"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch } from "@/store/hooks";
import {
  addExpense,
  removeExpense,
  updateExpense,
} from "@/store/slices/expensesSlice";
import type { Expense } from "@/types/expense";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/blocks/elements/Card";
import { Button } from "@/blocks/elements/Button";
import { Input } from "@/blocks/elements/Input";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { toast } from "sonner";

interface ExpenseItem {
  id: string | null;
  name: string;
  amount: number;
}

interface EditDayExpensesModalProps {
  open: boolean;
  onClose: () => void;
  day: number;
  year: number;
  month: number;
  selectedCategoryId: string;
  selectedTypeId: string;
  expensesForDay: Expense[];
  allExpensesForDay: Expense[];
  categoryTypes: { id: string; name: string; mainCategoryId?: string }[];
  /** When set, add/edit/delete use Firestore instead of Redux */
  firestoreApi?: {
    addEntry: (data: Omit<Expense, "id" | "createdAt">) => Promise<Expense | void>;
    updateEntry: (id: string, data: Partial<Pick<Expense, "amount" | "type" | "category" | "expenseTypeId" | "description" | "date" | "month" | "year">>) => Promise<void>;
    removeEntry: (id: string) => Promise<void>;
  };
}

export function EditDayExpensesModal({
  open,
  onClose,
  day,
  year,
  month,
  selectedCategoryId,
  selectedTypeId,
  expensesForDay,
  allExpensesForDay,
  categoryTypes,
  firestoreApi,
}: EditDayExpensesModalProps) {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthLabel = MONTH_NAMES[month - 1] ?? "";

  const typesToShow = useMemo(() => {
    if (selectedTypeId) return categoryTypes.filter((t) => t.id === selectedTypeId);
    return categoryTypes;
  }, [categoryTypes, selectedTypeId]);

  const typeOptions: SelectOption[] = typesToShow.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const buildInitialItems = (): Map<string, ExpenseItem[]> => {
    const map = new Map<string, ExpenseItem[]>();
    for (const e of expensesForDay) {
      if (e.type !== "expense" || !e.expenseTypeId) continue;
      if (!typesToShow.some((t) => t.id === e.expenseTypeId)) continue;
      if (e.amount === 0) continue; // Notes (amount 0) handled separately
      const list = map.get(e.expenseTypeId) ?? [];
      list.push({
        id: e.id,
        name: e.description ?? "",
        amount: e.amount,
      });
      map.set(e.expenseTypeId, list);
    }
    return map;
  };

  const [itemsByType, setItemsByType] = useState<Map<string, ExpenseItem[]>>(buildInitialItems);
  const [activeTypeId, setActiveTypeId] = useState<string>(String(typeOptions[0]?.value ?? ""));
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [editingIdx, setEditingIdx] = useState<{ typeId: string; idx: number } | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [dayNote, setDayNote] = useState("");
  const [sectionExpandedTypeIds, setSectionExpandedTypeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const initial = buildInitialItems();
      setItemsByType(initial);
      const firstTypeId = String(typeOptions[0]?.value ?? "");
      setActiveTypeId(firstTypeId);
      setAddName("");
      setAddAmount("");
      setEditingIdx(null);
      const typesWithItems = Array.from(initial.keys()).filter(
        (id) => (initial.get(id)?.length ?? 0) > 0
      );
      setSectionExpandedTypeIds(typesWithItems.length > 0 ? typesWithItems : []);
      const noteCategory = selectedCategoryId || "other";
      const note = allExpensesForDay.find(
        (e) => e.type === "expense" && e.amount === 0 && !e.expenseTypeId && e.category === noteCategory
      );
      const desc = (note?.description ?? "").trim();
      setDayNote(desc === "hello dear" ? "" : desc);
    }
  }, [open, day, year, month, selectedCategoryId, selectedTypeId, allExpensesForDay]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const ensureTypeSection = (typeId: string) => {
    setItemsByType((prev) => {
      if (prev.has(typeId)) return prev;
      const next = new Map(prev);
      next.set(typeId, []);
      return next;
    });
  };

  const handleTypeSelect = (typeId: string | number) => {
    const id = String(typeId);
    setActiveTypeId(id);
    ensureTypeSection(id);
  };

  const handleAddClick = () => {
    if (!activeTypeId) return;
    ensureTypeSection(activeTypeId);
    const alreadyExpanded = sectionExpandedTypeIds.includes(activeTypeId);
    setSectionExpandedTypeIds((prev) =>
      alreadyExpanded ? prev : [...prev, activeTypeId]
    );
    if (alreadyExpanded) {
      requestAnimationFrame(() => itemNameInputRef.current?.focus());
    } else {
      setTimeout(() => itemNameInputRef.current?.focus(), 50);
    }
  };

  const addItem = () => {
    if (!activeTypeId || (!addName.trim() && !addAmount)) return;
    const amt = Number(addAmount) || 0;
    if (amt < 0) return;
    setItemsByType((prev) => {
      const next = new Map(prev);
      const list = next.get(activeTypeId) ?? [];
      next.set(activeTypeId, [...list, { id: null, name: addName.trim(), amount: amt }]);
      return next;
    });
    setAddName("");
    setAddAmount("");
  };

  const startEdit = (typeId: string, idx: number) => {
    const list = itemsByType.get(typeId) ?? [];
    const item = list[idx];
    if (item) {
      setEditingIdx({ typeId, idx });
      setEditName(item.name);
      setEditAmount(item.amount);
    }
  };

  const saveEdit = () => {
    if (!editingIdx) return;
    const { typeId, idx } = editingIdx;
    setItemsByType((prev) => {
      const next = new Map(prev);
      const list = [...(next.get(typeId) ?? [])];
      const item = list[idx];
      if (item) {
        list[idx] = { ...item, name: editName.trim(), amount: editAmount };
        next.set(typeId, list);
      }
      return next;
    });
    setEditingIdx(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const removeItem = (typeId: string, index: number) => {
    if (editingIdx?.typeId === typeId && editingIdx.idx === index) setEditingIdx(null);
    setItemsByType((prev) => {
      const next = new Map(prev);
      const list = (next.get(typeId) ?? []).filter((_, i) => i !== index);
      next.set(typeId, list);
      return next;
    });
  };

  const handleSave = async () => {
    const api = firestoreApi;
    if (api) {
      if (isSaving) return;
      setIsSaving(true);
      try {
        let hadAdd = false;
        let hadUpdate = false;
        for (const [typeId, list] of itemsByType) {
          for (const item of list) {
            if (!item.name.trim() && item.amount <= 0) continue;
            const typeMeta = categoryTypes.find((t) => t.id === typeId);
            const category = selectedCategoryId || (typeMeta?.mainCategoryId ?? "other");
            if (item.id) {
              const orig = expensesForDay.find((e) => e.id === item.id);
              if (orig && (orig.description !== item.name.trim() || orig.amount !== item.amount)) {
                await api.updateEntry(orig.id, {
                  description: item.name.trim(),
                  amount: item.amount,
                });
                dispatch(updateExpense({ ...orig, description: item.name.trim(), amount: item.amount }));
                hadUpdate = true;
              }
            } else {
              await api.addEntry({
                type: "expense",
                category,
                expenseTypeId: typeId,
                description: item.name.trim(),
                amount: item.amount,
                date: dateStr,
                month,
                year,
              });
              hadAdd = true;
            }
          }
        }
        const keptIds = new Set<string>();
        for (const list of itemsByType.values()) {
          for (const item of list) {
            if (item.id && item.name.trim() && item.amount > 0) keptIds.add(item.id);
          }
        }
        for (const e of expensesForDay) {
          if (e.type === "expense" && e.amount !== 0 && !keptIds.has(e.id)) {
            await api.removeEntry(e.id);
            dispatch(removeExpense(e.id));
          }
        }
        let note = dayNote.trim();
        if (note === "hello dear") note = "";
        const noteCategory = selectedCategoryId || "other";
        const existingDayNote = allExpensesForDay.find(
          (e) => e.type === "expense" && e.amount === 0 && !e.expenseTypeId && e.category === noteCategory
        );
        if (note) {
          if (existingDayNote) {
            if (existingDayNote.description !== note) {
              await api.updateEntry(existingDayNote.id, { description: note });
              dispatch(updateExpense({ ...existingDayNote, description: note }));
              hadUpdate = true;
            }
          } else {
            await api.addEntry({
              type: "expense",
              category: noteCategory,
              description: note,
              amount: 0,
              date: dateStr,
              month,
              year,
            });
            hadAdd = true;
          }
        } else if (existingDayNote) {
          await api.removeEntry(existingDayNote.id);
          dispatch(removeExpense(existingDayNote.id));
        }
        if (hadAdd && hadUpdate) toast.success("Expenses added & updated.");
        else if (hadAdd) toast.success("Expense added.");
        else if (hadUpdate) toast.success("Expense updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save expenses.");
        return;
      } finally {
        setIsSaving(false);
      }
    } else {
      for (const [typeId, list] of itemsByType) {
        for (const item of list) {
          if (!item.name.trim() && item.amount <= 0) continue;
          if (item.id) {
            const orig = expensesForDay.find((e) => e.id === item.id);
            if (orig && (orig.description !== item.name || orig.amount !== item.amount)) {
              dispatch(updateExpense({
                ...orig,
                description: item.name.trim(),
                amount: item.amount,
              }));
            }
          } else {
            const typeMeta = categoryTypes.find((t) => t.id === typeId);
            const category = selectedCategoryId || typeMeta?.mainCategoryId || "other";
            dispatch(addExpense({
              type: "expense",
              category,
              expenseTypeId: typeId,
              description: item.name.trim(),
              amount: item.amount,
              date: dateStr,
              month,
              year,
            }));
          }
        }
      }
      const keptIds = new Set<string>();
      for (const list of itemsByType.values()) {
        for (const item of list) {
          if (item.id && item.name.trim() && item.amount > 0) keptIds.add(item.id);
        }
      }
      for (const e of expensesForDay) {
        if (e.type === "expense" && e.amount !== 0 && !keptIds.has(e.id)) {
          dispatch(removeExpense(e.id));
        }
      }
      let note = dayNote.trim();
      if (note === "hello dear") note = "";
      const noteCategory = selectedCategoryId || "other";
      const existingDayNote = allExpensesForDay.find(
        (e) => e.type === "expense" && e.amount === 0 && !e.expenseTypeId && e.category === noteCategory
      );
      if (note) {
        if (existingDayNote) {
          if (existingDayNote.description !== note) {
            dispatch(updateExpense({ ...existingDayNote, description: note }));
          }
        } else {
          dispatch(addExpense({
            type: "expense",
            category: noteCategory,
            description: note,
            amount: 0,
            date: dateStr,
            month,
            year,
          }));
        }
      } else if (existingDayNote) {
        dispatch(removeExpense(existingDayNote.id));
      }
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-day-expenses-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 shrink-0">
          <div>
            <CardTitle id="edit-day-expenses-title">
              Edit expenses — {day} {monthLabel} {year}
            </CardTitle>
            <CardDescription>
              Select expense type, click Add items, then the section below appears to add or edit items.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-5 pb-4">
          {/* 1. Type selector + Add button side by side (pasapasi) on mobile and desktop */}
          <div className="flex flex-nowrap items-end gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Select expense type</label>
              <SelectDropdown
                options={typeOptions}
                value={activeTypeId}
                onChange={handleTypeSelect}
                label=""
                className="w-full"
              />
            </div>
            {activeTypeId && (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleAddClick}
                className="shrink-0 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add items
              </Button>
            )}
          </div>

          {/* 3. Item sections – each stays visible once added; type change doesn’t remove them */}
          {sectionExpandedTypeIds.map((typeId) => {
            const typeInfo = typesToShow.find((t) => t.id === typeId);
            const typeName = typeInfo?.name ?? typeId;
            const list = itemsByType.get(typeId) ?? [];
            const isActive = activeTypeId === typeId;

            return (
              <div
                key={typeId}
                className={cn(
                  "rounded-xl border p-4 space-y-3",
                  isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/50"
                )}
              >
                <h4 className="font-semibold text-foreground">{typeName}</h4>

                {isActive && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      ref={itemNameInputRef}
                      placeholder="Item name (e.g. electricity, gas bill)"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Amount"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">৳</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="h-11 w-full gap-1 shrink-0 sm:w-auto"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">No items yet.</p>
                  ) : (
                    <>
                      <ol className="divide-y dark:divide-white/10 list-decimal list-outside pl-6 ml-1">
                        {list.map((item, idx) => {
                        const isEditing = editingIdx?.typeId === typeId && editingIdx?.idx === idx;
                        return (
                          <li
                            key={item.id ?? `new-${idx}`}
                            className={cn(
                              "py-2",
                              isDark ? "border-white/5" : "border-[#ddd]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <div className="flex flex-1 min-w-0 gap-2">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="min-w-0 flex-[85_0_0]"
                                  />
                                  <Input
                                    type="number"
                                    min={0}
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                                    className="min-w-0 flex-[35_0_0]"
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground shrink-0">৳</span>
                                <Button type="button" size="sm" onClick={saveEdit}>
                                  Save
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 truncate text-sm">{item.name || "—"}</span>
                                <span className="font-medium text-violet-600 dark:text-violet-400">
                                  {item.amount} ৳
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(typeId, idx)}
                                  className="shrink-0 h-8 w-8"
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(typeId, idx)}
                                  className="shrink-0 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#ddd] pt-3 dark:border-white/10">
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                      <span className="text-base font-semibold text-violet-600 dark:text-violet-400">
                        {list.reduce((s, i) => s + i.amount, 0)} ৳
                      </span>
                    </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Global note input at bottom */}
          <div className="pt-4 pb-2 border-t border-[#ddd] dark:border-white/10">
            <Input
              placeholder="Note (optional)"
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 shrink-0 border-t border-[#ddd] pt-6 dark:border-white/10">
          <Button type="button" onClick={handleSave} className="w-full" disabled={!!firestoreApi && isSaving}>
            {firestoreApi && isSaving ? "Saving…" : "Save Changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body
  );
}

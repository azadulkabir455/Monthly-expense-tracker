"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectBudgetItemsForMonth, removeBudgetItem } from "@/store/slices/expensesSlice";
import type { BudgetItem } from "@/types/budget";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { ConfirmModal } from "@/blocks/components/ConfirmModal";
import { EditBudgetItemModal } from "@/blocks/components/EditBudgetItemModal";

interface BudgetItemTableSectionProps {
  year: number;
  month: number;
}

export function BudgetItemTableSection({ year, month }: BudgetItemTableSectionProps) {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const items = useAppSelector((s) => selectBudgetItemsForMonth(s, year, month));
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-budget-action-menu]")) setOpenActionId(null);
    }
    if (openActionId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionId]);

  const total = items.reduce((s, b) => s + b.amount, 0);

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (item: BudgetItem) => {
    setDeleteTarget(item);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatch(removeBudgetItem(deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Budget List</SectionTitle>
          <SectionSubtitle>Name and amount in table format.</SectionSubtitle>
        </div>
      </SectionHeader>

      {items.length === 0 ? (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No budget items yet. Add one above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#ddd] shadow-card dark:border-white/10">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr
                className={cn(
                  "border-b",
                  isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/80"
                )}
              >
                <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                <th className="px-4 py-3 font-semibold text-foreground text-right">Money (৳)</th>
                <th className="w-24 px-2 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b last:border-b-0",
                    isDark ? "border-white/5 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50/60"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-violet-600 dark:text-violet-400">
                    {formatMoneyK(item.amount)}
                  </td>
                  <td className="px-2 py-3">
                    <div data-budget-action-menu className="relative flex justify-end gap-1">
                      {/* Mobile: 3 dots dropdown */}
                      <div className="sm:hidden">
                        <button
                          type="button"
                          onClick={() => setOpenActionId(openActionId === item.id ? null : item.id)}
                          className={cn(
                            "rounded-lg p-2 transition",
                            isDark
                              ? "text-slate-400 hover:bg-white/10 hover:text-white"
                              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          )}
                          aria-label="Actions"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openActionId === item.id && (
                          <div
                            className={cn(
                              "absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg",
                              isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleEdit(item);
                                setOpenActionId(null);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                                isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(item);
                                setOpenActionId(null);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                                isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Desktop: edit + delete buttons */}
                      <div className="hidden sm:flex sm:gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className={cn(
                            "rounded-lg p-2 transition",
                            isDark
                              ? "text-slate-400 hover:bg-white/10 hover:text-white"
                              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          )}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className={cn(
                            "rounded-lg p-2 transition",
                            isDark
                              ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                              : "text-slate-500 hover:bg-red-100 hover:text-red-600"
                          )}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                className={cn(
                  "border-t-2 font-bold",
                  isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50/80"
                )}
              >
                <td className="px-4 py-3 text-foreground">Total</td>
                <td className="px-4 py-3 text-right text-violet-600 dark:text-violet-400">
                  {formatMoneyK(total)}
                </td>
                <td className="px-2 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <EditBudgetItemModal
        item={editingItem}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
      />
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Budget Item"
        message={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        confirmLabel="Sure"
        cancelLabel="Cancel"
      />
    </SectionCard>
  );
}

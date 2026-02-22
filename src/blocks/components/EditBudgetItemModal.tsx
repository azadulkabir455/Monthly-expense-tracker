"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { BudgetItem } from "@/types/budget";
import { useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { getWishlistErrorMessage } from "@/lib/firebase/wishlist/errors";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
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
import { Label } from "@/blocks/elements/Label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface EditBudgetItemModalProps {
  item: BudgetItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (item: BudgetItem) => Promise<void>;
}

export function EditBudgetItemModal({ item, open, onClose, onUpdate }: EditBudgetItemModalProps) {
  const { categories } = useExpenseCategories();
  const { types: expenseTypes } = useExpenseTypes();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [amount, setAmount] = useState("");
  const [expenseTypeId, setExpenseTypeId] = useState("");

  const categoryName = item
    ? (categories.find((c) => c.id === item.categoryId)?.name ?? "")
    : "";

  const typesInCategory = useMemo(
    () => (item ? expenseTypes.filter((t) => t.categoryId === item.categoryId) : []),
    [expenseTypes, item]
  );
  const typeOptions: SelectOption[] = useMemo(
    () => typesInCategory.map((t) => ({ value: t.id, label: t.name })),
    [typesInCategory]
  );
  const selectedTypeName = typesInCategory.find((t) => t.id === expenseTypeId)?.name ?? "";

  useEffect(() => {
    if (item) {
      setAmount(String(item.amount));
      const typeId = item.expenseTypeId ?? typesInCategory[0]?.id ?? "";
      setExpenseTypeId(typesInCategory.some((t) => t.id === typeId) ? typeId : (typesInCategory[0]?.id ?? ""));
    }
  }, [item, typesInCategory]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !expenseTypeId) return;
    const amt = Number.parseInt(amount, 10);
    if (Number.isNaN(amt) || amt < 0) return;
    try {
      await onUpdate({
        ...item,
        name: selectedTypeName,
        amount: amt,
        expenseTypeId: expenseTypeId || undefined,
      });
      toast.success("Budget item updated.");
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "update", "budgetItem"));
    }
  };

  if (!open || !item) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-budget-item-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="edit-budget-item-title">Edit Budget Item</CardTitle>
            <CardDescription>Update type and amount.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label>Category type</Label>
                {categoryName ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                      isDark
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-violet-100 text-violet-700"
                    )}
                  >
                    {categoryName}
                  </span>
                ) : null}
              </div>
              {typeOptions.length > 0 ? (
                <SelectDropdown
                  options={typeOptions}
                  value={expenseTypeId}
                  onChange={(v) => setExpenseTypeId(String(v))}
                  label=""
                  className="w-full"
                />
              ) : (
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                  No types in this category.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budget-amount">Amount (৳)</Label>
              <Input
                id="edit-budget-amount"
                type="number"
                min={0}
                placeholder="e.g. 12000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>,
    document.body
  );
}

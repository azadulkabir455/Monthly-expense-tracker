"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateExpenseType, selectExpenseCategories } from "@/store/slices/expensesSlice";
import { MAIN_EXPENSE_CATEGORIES } from "@/types/expense";
import type { ExpenseType } from "@/types/expenseCategory";
import { SelectDropdown, type SelectOption } from "@/blocks/components/SelectDropdown";
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

interface EditExpenseTypeModalProps {
  expenseType: ExpenseType | null;
  open: boolean;
  onClose: () => void;
}

export function EditExpenseTypeModal({ expenseType, open, onClose }: EditExpenseTypeModalProps) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectExpenseCategories);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mainCategoryId, setMainCategoryId] = useState("");

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const mainCategoryOptions: SelectOption[] = MAIN_EXPENSE_CATEGORIES.map((c) => ({
    value: c.id,
    label: c.label,
  }));

  useEffect(() => {
    if (expenseType) {
      setName(expenseType.name);
      setCategoryId(expenseType.categoryId ?? categories[0]?.id ?? "");
      setMainCategoryId(expenseType.mainCategoryId ?? MAIN_EXPENSE_CATEGORIES[0]?.id ?? "");
    }
  }, [expenseType, categories]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseType || !name.trim() || !categoryId) return;
    dispatch(
      updateExpenseType({
        ...expenseType,
        name: name.trim(),
        categoryId,
        mainCategoryId: mainCategoryId || undefined,
      })
    );
    onClose();
  };

  if (!open || !expenseType) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-type-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="edit-expense-type-title">Edit Expense Type</CardTitle>
            <CardDescription>Update the type name and category.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-exp-type-name">Type Name</Label>
              <Input
                id="edit-exp-type-name"
                placeholder="e.g. Bazar, House Rent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <SelectDropdown
                options={categoryOptions}
                value={categoryId}
                onChange={(v) => setCategoryId(String(v))}
                label=""
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Main Category (for filter)</Label>
              <SelectDropdown
                options={mainCategoryOptions}
                value={mainCategoryId}
                onChange={(v) => setMainCategoryId(String(v))}
                label=""
                className="w-full"
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

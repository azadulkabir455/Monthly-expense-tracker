"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { getWishlistErrorMessage } from "@/lib/firebase/wishlist/errors";
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
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface AddExpenseTypeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseTypeModal({ open, onClose }: AddExpenseTypeModalProps) {
  const { categories } = useExpenseCategories();
  const { addType } = useExpenseTypes();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (open) {
      setName("");
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [open, categories]);

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
    if (!name.trim() || !categoryId) return;
    try {
      await addType({ name: name.trim(), categoryId });
      toast.success("Expense type added.");
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "add", "expenseType"));
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-type-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="add-expense-type-title">Add Expense Type</CardTitle>
            <CardDescription>Link type to a main category — e.g. Bazar, House Rent.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-type-name">Type Name</Label>
              <Input
                id="exp-type-name"
                placeholder="e.g. Bazar, House Rent, Utilities"
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
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto">
              Add Type
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

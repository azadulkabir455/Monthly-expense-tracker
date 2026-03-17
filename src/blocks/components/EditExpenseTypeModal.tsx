"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useExpenseCategories, useExpenseTypes } from "@/lib/firebase/expenses";
import { getWishlistErrorMessage } from "@/lib/firebase/wishlist/errors";
import type { ExpenseCategory, ExpenseType } from "@/types/expenseCategory";
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
import { useLanguage } from "@/context/LanguageContext";

interface EditExpenseTypeModalProps {
  expenseType: ExpenseType | null;
  open: boolean;
  onClose: () => void;
  /** When provided, use these for yearly category page. */
  scope?: "monthly" | "yearly";
  scopeCategories?: ExpenseCategory[];
  scopeUpdateType?: (id: string, data: Partial<Omit<ExpenseType, "id">>) => Promise<void>;
}

export function EditExpenseTypeModal({
  expenseType,
  open,
  onClose,
  scope = "monthly",
  scopeCategories,
  scopeUpdateType,
}: EditExpenseTypeModalProps) {
  const monthlyCategories = useExpenseCategories();
  const monthlyTypes = useExpenseTypes();
  const categories = scope === "yearly" && scopeCategories ? scopeCategories : monthlyCategories.categories;
  const updateTypeFn = scope === "yearly" && scopeUpdateType ? scopeUpdateType : monthlyTypes.updateType;
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (expenseType) {
      setName(expenseType.name);
      setCategoryId(expenseType.categoryId ?? categories[0]?.id ?? "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseType || !name.trim() || !categoryId) return;
    try {
      await updateTypeFn(expenseType.id, {
        name: name.trim(),
        categoryId,
      });
      toast.success(t("expenseType_updated"));
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "update", "expenseType"));
    }
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
            <CardTitle id="edit-expense-type-title">
              {t("expenseType_editTitle")}
            </CardTitle>
            <CardDescription>
              {t("expenseType_editDescription")}
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-exp-type-name">
                {t("expenseType_typeNameLabel")}
              </Label>
              <Input
                id="edit-exp-type-name"
                placeholder={t("expenseType_typeNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("expenseType_categoryLabel")}</Label>
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
              {t("expenseType_saveChanges")}
            </Button>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
              {t("common_cancel")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>,
    document.body
  );
}

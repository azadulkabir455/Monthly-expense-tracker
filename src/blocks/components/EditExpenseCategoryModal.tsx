"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { ExpenseCategory, ExpenseCategoryIconType, GradientPresetId } from "@/types/expenseCategory";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
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
import { IconSearchInput } from "@/blocks/components/shared/IconSearchInput";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { useYearlyCategories } from "@/lib/firebase/yearly";

interface EditExpenseCategoryModalProps {
  category: ExpenseCategory | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    name: string,
    icon: string,
    gradientPreset: string,
    yearlyCategoryId?: string | null
  ) => Promise<void>;
  /** When "yearly", hide "Child of yearly category" (only for monthly category form). */
  scope?: "monthly" | "yearly";
}

const GRADIENT_IDS = Object.keys(GRADIENT_PRESETS) as GradientPresetId[];

export function EditExpenseCategoryModal({
  category,
  open,
  onClose,
  onUpdate,
  scope = "monthly",
}: EditExpenseCategoryModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { categories: yearlyCategories } = useYearlyCategories();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<ExpenseCategoryIconType>("home");
  const [gradientPreset, setGradientPreset] = useState<GradientPresetId>("violet");
  const [yearlyCategoryId, setYearlyCategoryId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const yearlyOptions: SelectOption[] = [
    { value: "", label: "None" },
    ...yearlyCategories.map((c) => ({ value: c.id, label: c.name })),
  ];

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setGradientPreset(category.gradientPreset);
      setYearlyCategoryId(scope === "monthly" ? (category.yearlyCategoryId ?? "") : "");
    }
  }, [category, scope]);

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
    if (!category || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onUpdate(
        category.id,
        name.trim(),
        icon,
        gradientPreset,
        scope === "monthly" ? yearlyCategoryId || null : undefined
      );
      toast.success("Expense category updated.");
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "update", "expenseCategory"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !category) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-category-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="edit-expense-category-title">Edit Expense Category</CardTitle>
            <CardDescription>Update name, icon and color.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-exp-cat-name">Category Name</Label>
              <Input
                id="edit-exp-cat-name"
                placeholder="e.g. House, Business"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {scope === "monthly" && (
              <div className="space-y-2">
                <Label>Child of yearly category</Label>
                <SelectDropdown
                  options={yearlyOptions}
                  value={yearlyCategoryId}
                  onChange={(v) => setYearlyCategoryId(String(v))}
                  label=""
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <IconSearchInput value={icon} onChange={(v) => setIcon(v)} label="Icon" id="edit-exp-cat-icon" />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {GRADIENT_IDS.map((id) => {
                  const preset = GRADIENT_PRESETS[id];
                  const isSelected = gradientPreset === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGradientPreset(id)}
                      style={{
                        background: `linear-gradient(135deg, ${preset.fromColor}, ${preset.toColor})`,
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full transition ring-2 shrink-0",
                        isSelected ? "ring-offset-2 ring-white dark:ring-offset-slate-950 ring-2 scale-110" : "ring-transparent opacity-80 hover:opacity-100 hover:scale-105"
                      )}
                      aria-label={`Color ${id}`}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
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

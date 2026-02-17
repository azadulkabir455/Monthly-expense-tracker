"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch } from "@/store/hooks";
import { addExpenseCategory } from "@/store/slices/expensesSlice";
import type { ExpenseCategoryIconType, GradientPresetId } from "@/types/expenseCategory";
import { GRADIENT_PRESETS } from "@/types/expenseCategory";
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
import { IconSearchInput } from "@/blocks/components/IconSearchInput";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface AddExpenseCategoryModalProps {
  open: boolean;
  onClose: () => void;
}

const GRADIENT_IDS = Object.keys(GRADIENT_PRESETS) as GradientPresetId[];

export function AddExpenseCategoryModal({ open, onClose }: AddExpenseCategoryModalProps) {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<ExpenseCategoryIconType>("home");
  const [gradientPreset, setGradientPreset] = useState<GradientPresetId>("violet");

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("home");
      setGradientPreset("violet");
    }
  }, [open]);

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
    if (!name.trim()) return;
    dispatch(addExpenseCategory({ name: name.trim(), icon, gradientPreset }));
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-category-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="add-expense-category-title">Add Expense Category</CardTitle>
            <CardDescription>e.g. House, Business — with icon and color.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-cat-name">Category Name</Label>
              <Input
                id="exp-cat-name"
                placeholder="e.g. House, Business"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <IconSearchInput
                value={icon}
                onChange={(v) => setIcon(v)}
                label="Icon"
                id="exp-cat-icon"
              />
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
            <Button type="submit" className="w-full sm:w-auto">
              Add Category
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

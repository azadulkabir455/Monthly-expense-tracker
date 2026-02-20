"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { WishCategory, WishItem, WishPriorityType, WishIconType } from "@/types/wishlist";
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
import { IconSearchInput } from "@/blocks/components/shared/IconSearchInput";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface AddWishModalProps {
  open: boolean;
  onClose: () => void;
  categories: WishCategory[];
  priorities: WishPriorityType[];
  onAdd: (data: Omit<WishItem, "id">) => Promise<void>;
}

export function AddWishModal({ open, onClose, categories, priorities, onAdd }: AddWishModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [approximateAmount, setApproximateAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priorityId, setPriorityId] = useState<string>("");
  const [iconType, setIconType] = useState<WishIconType>("gift");
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions: SelectOption[] = [
    { value: "", label: "Select category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const priorityOptions: SelectOption[] = priorities.map((p) => ({ value: p.id, label: p.name }));

  useEffect(() => {
    if (open) {
      setName("");
      setApproximateAmount("");
      setCategoryId(categories[0]?.id ?? "");
      setPriorityId(priorities[0]?.id ?? "");
      setIconType("gift");
    }
  }, [open, categories, priorities]);

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
    const amount = Number.parseInt(approximateAmount, 10);
    if (!name.trim() || Number.isNaN(amount) || amount < 0 || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        approximateAmount: amount,
        priorityId: priorityId || priorities[0]?.id || "",
        iconType,
        categoryId: categoryId || undefined,
      });
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "add", "wish"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-wish-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <Card className={cn(
        "relative z-10 w-full max-w-lg max-h-[75vh] overflow-auto",
        isDark ? "border-white/10 !bg-violet-950/95" : "!bg-white"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="add-wish-title">Add Wish</CardTitle>
            <CardDescription>Add a new item to your wish list.</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="w-full space-y-2">
              <Label htmlFor="add-wish-name">Name</Label>
              <Input
                id="add-wish-name"
                placeholder="e.g. MacBook Pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="add-wish-amount">Approximate Amount (৳)</Label>
              <Input
                id="add-wish-amount"
                type="number"
                min={0}
                placeholder="e.g. 150000"
                value={approximateAmount}
                onChange={(e) => setApproximateAmount(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="w-full space-y-2">
              <SelectDropdown
                options={categoryOptions}
                value={categoryId}
                onChange={(v) => setCategoryId(String(v))}
                label="Category"
                className="w-full"
              />
            </div>
            <div className="grid w-full grid-cols-2 items-end gap-4">
              <SelectDropdown
                options={priorityOptions}
                value={priorityId}
                onChange={(v) => setPriorityId(String(v))}
                label="Priority"
              />
              <IconSearchInput
                value={iconType}
                onChange={setIconType}
                label="Icon"
                id="add-wish-icon"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Adding…" : "Add Wish"}
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

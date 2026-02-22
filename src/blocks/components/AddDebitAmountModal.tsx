"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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

interface AddDebitAmountModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number;
  /** Current debit amount (from Firestore) — for edit mode */
  currentAmount?: number | null;
  /** Save to Firestore (user-wise). Called with amount in ৳. */
  onSave: (amount: number) => Promise<void>;
}

export function AddDebitAmountModal({
  open,
  onClose,
  year,
  month,
  currentAmount,
  onSave,
}: AddDebitAmountModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = currentAmount != null;

  useEffect(() => {
    if (open) {
      setAmount(currentAmount != null ? String(currentAmount) : "");
    }
  }, [open, currentAmount]);

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
    const amt = Number.parseInt(amount, 10);
    if (Number.isNaN(amt) || amt < 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSave(amt);
      toast.success(isEdit ? "Debit updated." : "Debit added.");
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "NOT_AUTHENTICATED"
          ? "Please sign in first."
          : "Could not save debit. Try again.";
      toast.error(msg);
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
      aria-labelledby="add-debit-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className={cn("relative z-10 w-full max-w-md", isDark && "border-white/10")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="add-debit-title">
              {isEdit ? "Edit Debit Amount" : "Add Debit Amount"}
            </CardTitle>
            <CardDescription>Monthly debit (income) amount in ৳.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debit-amount">Amount (৳)</Label>
              <Input
                id="debit-amount"
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add"}
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

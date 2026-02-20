"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { WishPriorityType } from "@/types/wishlist";
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
import { getWishlistErrorMessage } from "@/lib/firebase/wishlist/errors";

interface EditWishPriorityModalProps {
  priority: WishPriorityType | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, name: string, order: number) => Promise<void>;
}

export function EditWishPriorityModal({ priority, open, onClose, onUpdate }: EditWishPriorityModalProps) {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const [name, setName] = useState("");
  const [order, setOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (priority) {
      setName(priority.name);
      setOrder(priority.order);
    }
  }, [priority]);

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
    if (!priority || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onUpdate(priority.id, name.trim(), order);
      toast.success("Priority type updated.");
      onClose();
    } catch (err) {
      toast.error(getWishlistErrorMessage(err, "update", "priority"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !priority) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-priority-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card
        className={cn(
          "relative z-10 w-full max-w-md",
          isDark && "border-white/10"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle id="edit-priority-title">Edit Priority</CardTitle>
            <CardDescription>Update the priority name and order.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority-name">Priority Name</Label>
              <Input
                id="edit-priority-name"
                placeholder="e.g. High, Medium, Urgent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority-order">Order (1 = highest)</Label>
              <Input
                id="edit-priority-order"
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Math.max(1, Number(e.target.value) || 1))}
                required
              />
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

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/blocks/elements/Card";
import { Button } from "@/blocks/elements/Button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Customizable title (default: "Confirm") */
  title?: string;
  /** Customizable message body */
  message?: string;
  /** Confirm button label (default: "Sure") */
  confirmLabel?: string;
  /** Cancel button label (default: "Cancel") — set to null to hide cancel button */
  cancelLabel?: string | null;
  /** Use danger styling for confirm button (red) — default true for delete flows */
  variant?: "danger" | "default";
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Sure",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  const showCancel = cancelLabel != null;
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[20vh] sm:pt-[25vh]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card
        className={cn(
          "relative z-10 w-full max-w-md",
          isDark && "border-white/10"
        )}
      >
        <CardHeader className="relative pb-2 pt-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-0 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <CardTitle id="confirm-modal-title" className="text-center">{title}</CardTitle>
            <CardDescription className="text-center">{message}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="sr-only">{message}</CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {showCancel && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            className={cn(
              "w-full sm:w-auto",
              variant === "danger" &&
                "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            )}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body
  );
}

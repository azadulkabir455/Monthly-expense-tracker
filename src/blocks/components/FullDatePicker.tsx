"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { useClientDate } from "@/hooks/useClientDate";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface FullDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  years?: number[];
  label?: string;
  className?: string;
}

export function FullDatePicker({
  value,
  onChange,
  years: yearsProp,
  label,
  className,
}: FullDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth() + 1);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { year: currentYear } = useClientDate();

  const years = yearsProp ?? Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const selectedLabel = `${value.getDate()} ${MONTH_NAMES[value.getMonth()]} ${value.getFullYear()}`;

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const width = Math.max(rect.width, 300);
      setPosition({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - width),
        width,
      });
    }
  };

  useLayoutEffect(() => {
    if (open && ref.current) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth() + 1);
    }
  }, [open, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target) && !target.closest("[data-fulldatepicker-portal]")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDaySelect = (day: number) => {
    onChange(new Date(viewYear, viewMonth - 1, day));
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const popoverContent = open ? (
    <motion.div
      data-fulldatepicker-portal
      key="fulldatepicker-popover"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        minWidth: position.width,
      }}
      className={cn(
        "z-[100] overflow-hidden rounded-xl border p-3 shadow-lg backdrop-blur-xl",
        isDark
          ? "border-white/20 bg-violet-950/95 shadow-elevated text-white"
          : "border-[#ddd] bg-white shadow-elevated text-slate-900"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.max(years.at(-1) ?? y, y - 1))}
            className={cn("rounded-lg p-2 transition", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}
            aria-label="Previous year"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="min-w-[4rem] text-center text-base font-bold">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.min(years[0] ?? y, y + 1))}
            className={cn("rounded-lg p-2 transition", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}
            aria-label="Next year"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMonth((m) => (m <= 1 ? 12 : m - 1))}
            className={cn("rounded-lg p-2 transition", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}
            aria-label="Previous month"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="min-w-[5rem] text-center text-sm font-semibold opacity-95">{MONTH_NAMES[viewMonth - 1]}</span>
          <button
            type="button"
            onClick={() => setViewMonth((m) => (m >= 12 ? 1 : m + 1))}
            className={cn("rounded-lg p-2 transition", isDark ? "hover:bg-white/10" : "hover:bg-slate-100")}
            aria-label="Next month"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className={cn(
              "py-1 text-center text-xs font-medium",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            {d}
          </div>
        ))}
        {Array.from({ length: new Date(viewYear, viewMonth - 1, 1).getDay() }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const isSelected =
            viewYear === value.getFullYear() &&
            viewMonth === value.getMonth() + 1 &&
            day === value.getDate();
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDaySelect(day)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold transition",
                isSelected
                  ? isDark
                    ? "bg-violet-500/50 text-white ring-1 ring-violet-400/60"
                    : "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                  : isDark
                    ? "text-slate-200 hover:bg-white/15 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </motion.div>
  ) : null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label
          className={cn(
            "mb-1.5 block text-sm font-medium",
            isDark ? "text-slate-300" : "text-slate-700"
          )}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          open && (isDark ? "border-violet-400/50" : "border-violet-400"),
          isDark
            ? "border-white/20 bg-white/10 text-white shadow-md hover:bg-white/15 focus:ring-violet-500/50"
            : "border-[#ddd] bg-white/80 text-slate-900 shadow-md hover:border-[#ccc] hover:bg-slate-50 focus:ring-violet-400"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Select date. Currently ${selectedLabel}`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-[9rem] font-semibold">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 transition-transform",
            isDark ? "text-slate-400" : "text-slate-500",
            open && "rotate-180"
          )}
        />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>{popoverContent}</AnimatePresence>,
          document.body
        )}
    </div>
  );
}

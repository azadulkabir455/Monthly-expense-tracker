"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthYearDatePickerProps {
  years: number[];
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  label?: string;
  className?: string;
}

export function MonthYearDatePicker({
  years,
  year,
  month,
  onYearChange,
  onMonthChange,
  label = "Kon month",
  className,
}: MonthYearDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [viewYear, setViewYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const selectedLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const width = Math.max(rect.width, 280);
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
    if (open) setViewYear(year);
  }, [open, year]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target) && !target.closest("[data-datepicker-portal]")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (m: number) => {
    onYearChange(viewYear);
    onMonthChange(m);
    setOpen(false);
  };

  const popoverContent = open ? (
    <motion.div
      data-datepicker-portal
      key="datepicker-popover"
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
      {/* Year selector */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={cn(
          "text-sm font-semibold",
          isDark ? "text-slate-400" : "text-slate-500"
        )}>{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.max(years.at(-1) ?? y, y - 1))}
            className={cn(
              "rounded-lg p-2 transition",
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            )}
            aria-label="Previous year"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="min-w-[4rem] text-center text-base font-bold">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.min(years[0] ?? y, y + 1))}
            className={cn(
              "rounded-lg p-2 transition",
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            )}
            aria-label="Next year"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      </div>
      {/* Month grid */}
      <div className="grid grid-cols-4 gap-1">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const isSelected = viewYear === year && month === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleMonthSelect(m)}
              className={cn(
                "rounded-lg px-2 py-2 text-sm font-semibold transition",
                isSelected
                  ? isDark
                    ? "bg-violet-500/50 text-white ring-1 ring-violet-400/60"
                    : "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                  : isDark
                    ? "text-slate-200 hover:bg-white/15 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {name.slice(0, 3)}
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
          "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          open && (isDark ? "border-violet-400/50" : "border-violet-400"),
          isDark
            ? "border-white/20 bg-white/10 text-white shadow-md hover:bg-white/15 focus:ring-violet-500/50 dark:border-white/10 dark:bg-white/5"
            : "border-[#ddd] bg-white/80 text-slate-900 shadow-md hover:border-[#ccc] hover:bg-slate-50 focus:ring-violet-400"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Select month and year. Currently ${selectedLabel}`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-[7rem] font-semibold">{selectedLabel}</span>
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

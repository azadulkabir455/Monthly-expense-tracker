"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthYearDatePickerProps {
  years: number[];
  year: number;
  month?: number;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  /** "year-only" = only year selector (e.g. for yearly budget/entries); "month-year" = month + year */
  mode?: "month-year" | "year-only";
  label?: string;
  className?: string;
}

export function MonthYearDatePicker({
  years,
  year,
  month = 1,
  onYearChange,
  onMonthChange,
  mode = "month-year",
  label = "",
  className,
}: MonthYearDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const selectedYearButtonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const yearOnly = mode === "year-only";
  const selectedLabel = yearOnly ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;

  /** Years ascending (2020 first) for scroll list — same for all calendars */
  const yearsAsc = [...years].sort((a, b) => a - b);
  const minYear = years[years.length - 1] ?? year;
  const maxYear = years[0] ?? year;

  useLayoutEffect(() => {
    if (open && yearListRef.current && selectedYearButtonRef.current) {
      selectedYearButtonRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [open]);

  useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (m: number) => {
    onYearChange(viewYear);
    onMonthChange?.(m);
    setOpen(false);
  };

  const handleYearOnlySelect = () => {
    onYearChange(viewYear);
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
      className={cn(
        "absolute left-0 top-full z-[100] mt-1.5 w-full min-w-[280px] overflow-hidden rounded-xl border p-3 shadow-lg backdrop-blur-xl",
        isDark
          ? "border-white/20 bg-violet-950/95 shadow-elevated text-white"
          : "border-[#ddd] bg-white shadow-elevated text-slate-900"
      )}
    >
      {/* Year selector row */}
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <span className={cn(
            "text-sm font-semibold",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>{label}</span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(minYear, viewYear - 1);
              setViewYear(next);
              if (yearOnly) {
                onYearChange(next);
                setOpen(false);
              }
            }}
            className={cn(
              "rounded-lg p-2 transition",
              isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
            )}
            aria-label="Previous year"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          {yearOnly ? (
            <button
              type="button"
              onClick={handleYearOnlySelect}
              className={cn(
                "min-w-[4rem] rounded-lg px-2 py-1.5 text-center text-base font-bold transition",
                isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
              )}
            >
              {viewYear}
            </button>
          ) : (
            <span className="min-w-[4rem] text-center text-base font-bold">{viewYear}</span>
          )}
          <button
            type="button"
            onClick={() => {
              const next = Math.min(maxYear, viewYear + 1);
              setViewYear(next);
              if (yearOnly) {
                onYearChange(next);
                setOpen(false);
              }
            }}
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
      {/* Scrollable list of years — 5 visible at a time, rest by scroll (in flow, like before) */}
      <div
        ref={yearListRef}
        className="mt-2 h-[11.25rem] max-h-[11.25rem] overflow-y-auto rounded-lg border pr-1 scrollbar-thin"
      >
        {yearsAsc.map((y) => {
          const isSelected = y === (yearOnly ? year : viewYear);
          return (
            <button
              key={y}
              ref={isSelected ? selectedYearButtonRef : undefined}
              type="button"
              onClick={() => {
                if (yearOnly) {
                  onYearChange(y);
                  setOpen(false);
                } else {
                  setViewYear(y);
                }
              }}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                isSelected
                  ? isDark
                    ? "bg-violet-500/50 text-white ring-1 ring-violet-400/60"
                    : "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                  : isDark
                    ? "text-slate-200 hover:bg-white/15 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {y}
            </button>
          );
        })}
      </div>
      {/* Month grid — only when month-year mode */}
      {!yearOnly && (
        <div className="mt-3 grid grid-cols-4 gap-1">
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
      )}
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
      {yearOnly ? (
        <div
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-1 rounded-xl border px-1 py-1 transition-all",
            open && (isDark ? "border-violet-400/50" : "border-violet-400"),
            isDark
              ? "border-white/20 bg-white/10 shadow-md dark:border-white/10 dark:bg-white/5"
              : "border-[#ddd] bg-white/80 shadow-md"
          )}
        >
          <button
            type="button"
            onClick={() => onYearChange(Math.max(minYear, year - 1))}
            className={cn(
              "rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-violet-500/50",
              isDark ? "text-white hover:bg-white/15" : "text-slate-900 hover:bg-slate-100"
            )}
            aria-label="Previous year"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-500/50",
              isDark ? "text-white hover:bg-white/15" : "text-slate-900 hover:bg-slate-100"
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Select year. Currently ${year}`}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-semibold">{year}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isDark ? "text-slate-400" : "text-slate-500",
                open && "rotate-180"
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => onYearChange(Math.min(maxYear, year + 1))}
            className={cn(
              "rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-violet-500/50",
              isDark ? "text-white hover:bg-white/15" : "text-slate-900 hover:bg-slate-100"
            )}
            aria-label="Next year"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      ) : (
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
      )}
      <AnimatePresence>{popoverContent}</AnimatePresence>
    </div>
  );
}

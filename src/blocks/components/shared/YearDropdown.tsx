"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface YearDropdownProps {
  years: number[];
  value: number;
  onChange: (year: number) => void;
  className?: string;
  label?: string;
}

export function YearDropdown({
  years,
  value,
  onChange,
  className,
  label = "Year",
}: YearDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label
          className={cn(
            "mb-1.5 block text-sm font-medium capitalize",
            isDark ? "text-slate-300" : "text-black"
          )}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all sm:min-w-[120px] sm:px-4 sm:py-3 sm:text-base",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          open && (isDark ? "border-slate-500" : "border-slate-400"),
          isDark
            ? "border-white/20 bg-white/10 text-white shadow-violet-950/20 backdrop-blur-xl hover:bg-white/15 focus:ring-violet-500/50 focus:ring-offset-violet-950"
            : "border-[#ddd] bg-white text-slate-900 shadow-sm hover:border-[#ccc] hover:bg-slate-50 focus:ring-violet-400 focus:ring-offset-white"
        )}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform",
            isDark ? "text-slate-400" : "text-slate-600",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-xl border py-1 backdrop-blur-xl sm:min-w-[120px]",
              "origin-top-right",
              isDark
                ? "border-white/20 bg-violet-950/40 shadow-elevated"
                : "border-[#ddd] bg-white shadow-elevated"
            )}
          >
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onChange(year);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-4 py-3 text-left text-base font-medium transition-colors",
                  year === value
                    ? isDark
                      ? "bg-violet-500/25 text-white"
                      : "bg-slate-50 text-black"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-black hover:bg-slate-50"
                )}
              >
                {year}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

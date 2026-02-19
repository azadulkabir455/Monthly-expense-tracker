"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  className?: string;
}

export function SelectDropdown({
  options,
  value,
  onChange,
  label,
  className,
}: SelectDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 120),
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
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-select-dropdown-portal]")) {
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? String(value);

  const dropdownContent = open ? (
    <motion.div
      data-select-dropdown-portal
      key="select-dropdown"
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
        "z-[100] max-h-64 overflow-auto rounded-xl border py-1 backdrop-blur-xl",
        isDark
          ? "border-white/20 bg-violet-950/40 shadow-elevated"
          : "border-[#ddd] bg-white shadow-elevated"
      )}
    >
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center px-4 py-3 text-left text-base font-medium transition-colors",
            opt.value === value
              ? isDark
                ? "bg-violet-500/25 text-white"
                : "bg-slate-50 text-black"
              : isDark
                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                : "text-black hover:bg-slate-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </motion.div>
  ) : null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label
          className={cn(
            "mb-1.5 block text-sm font-medium capitalize",
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
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          open && (isDark ? "border-slate-500" : "border-slate-400"),
          isDark
            ? "border-white/20 bg-white/10 text-white shadow-card backdrop-blur-xl hover:bg-white/15 focus:ring-violet-500/50 focus:ring-offset-violet-950"
            : "border-[#ddd] bg-white text-slate-900 shadow-sm hover:border-[#ccc] hover:bg-slate-50 focus:ring-violet-400 focus:ring-offset-white"
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform",
            isDark ? "text-slate-400" : "text-slate-600",
            open && "rotate-180"
          )}
        />
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>{dropdownContent}</AnimatePresence>,
          document.body
        )}
    </div>
  );
}

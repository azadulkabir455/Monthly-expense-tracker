"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/blocks/elements/Input";
import { Label } from "@/blocks/elements/Label";
import { getIconOptions, formatIconLabel } from "@/lib/wishConstants";
import type { WishIconType } from "@/types/wishlist";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

interface IconSearchInputProps {
  value: WishIconType;
  onChange: (value: WishIconType) => void;
  label?: string;
  id?: string;
}

export function IconSearchInput({ value, onChange, label = "Icon", id }: IconSearchInputProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  const iconOptions = mounted ? getIconOptions() : [];

  const selectedLabel = value
    ? (iconOptions.find((o) => o.value === value)?.label ?? formatIconLabel(value))
    : "";
  const displayValue = open ? query : selectedLabel;

  const suggestions = query.trim()
    ? iconOptions.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase()) ||
        o.value.toLowerCase().includes(query.trim().toLowerCase())
      )
    : iconOptions.slice(0, 100);

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
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
        if (!target.closest("[data-icon-search-portal]")) {
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    setOpen(true);
    setQuery(value ? selectedLabel : "");
  };

  const handleSelect = (opt: { value: WishIconType; label: string }) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const dropdownContent = open ? (
    <motion.div
      data-icon-search-portal
      key="icon-search-dropdown"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
      }}
      className={cn(
        "z-[100] max-h-48 overflow-auto rounded-xl border py-1 backdrop-blur-xl",
        isDark
          ? "border-white/20 bg-violet-950/40 shadow-elevated"
          : "border-[#ddd] bg-white shadow-elevated"
      )}
    >
      {suggestions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleSelect(opt)}
          className={cn(
            "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors",
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
      {suggestions.length === 0 && (
        <p className={cn("px-4 py-3 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No icon found
        </p>
      )}
    </motion.div>
  ) : null;

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <Label htmlFor={id} className="mb-1.5 block capitalize">
          {label}
        </Label>
      )}
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2",
            isDark ? "text-slate-400" : "text-slate-500"
          )}
        />
        <Input
          id={id}
          placeholder="Search icon..."
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          className={cn(
            "h-11 w-full pl-10",
            isDark ? "border-white/10 bg-white/5 text-white placeholder:text-slate-400" : ""
          )}
        />
      </div>
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>{dropdownContent}</AnimatePresence>,
          document.body
        )}
    </div>
  );
}

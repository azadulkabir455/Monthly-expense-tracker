"use client";

import { YearDropdown } from "@/blocks/components/YearDropdown";
import { SelectDropdown, type SelectOption } from "@/blocks/components/SelectDropdown";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_OPTIONS: SelectOption[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface YearMonthPickerProps {
  years: number[];
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  label?: string;
  className?: string;
}

export function YearMonthPicker({
  years,
  year,
  month,
  onYearChange,
  onMonthChange,
  label = "Select month",
  className,
}: YearMonthPickerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-[#ddd] bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5",
        className
      )}
      role="group"
      aria-label="Date picker - select year and month"
    >
      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      )}
      <YearDropdown
        years={years}
        value={year}
        onChange={onYearChange}
        label=""
        className="min-w-[85px]"
      />
      <SelectDropdown
        options={MONTH_OPTIONS}
        value={month}
        onChange={(v) => onMonthChange(Number(v))}
        label=""
        className="min-w-[115px]"
      />
    </div>
  );
}

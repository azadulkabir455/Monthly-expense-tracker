"use client";

import { useMemo } from "react";

const CALENDAR_MIN_YEAR = 2020;
const CALENDAR_MAX_YEAR = 2100;

/**
 * Years for calendar/date picker: 2020 থেকে 2100 পর্যন্ত।
 * সব ক্যালেন্ডারে একই রেঞ্জ ব্যবহার করতে এই হুক ব্যবহার করুন।
 */
export function useCalendarYears(_currentYear?: number): number[] {
  return useMemo(() => {
    const length = CALENDAR_MAX_YEAR - CALENDAR_MIN_YEAR + 1;
    return Array.from({ length }, (_, i) => CALENDAR_MAX_YEAR - i);
  }, []);
}

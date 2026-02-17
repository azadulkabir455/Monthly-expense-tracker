"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "expenseTrackerStartYear";

/** Stable fallback to avoid hydration mismatch (server/client Date can differ by timezone) */
const FALLBACK_YEAR = 2025;

/** লগইনের বছর থেকে শুরু – প্রথম ড্যাশবোর্ড ভিজিটে সেট হয় */
export function useStartYear() {
  const [startYear, setStartYearState] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentYear = new Date().getFullYear();
    if (stored) {
      setStartYearState(Number(stored));
    } else {
      localStorage.setItem(STORAGE_KEY, String(currentYear));
      setStartYearState(currentYear);
    }
  }, []);

  return startYear ?? FALLBACK_YEAR;
}

/** Login successful হলে কল করুন – সেই বছরের থেকে ডেটা শুরু */
export function setLoginStartYear() {
  const currentYear = new Date().getFullYear();
  localStorage.setItem(STORAGE_KEY, String(currentYear));
}

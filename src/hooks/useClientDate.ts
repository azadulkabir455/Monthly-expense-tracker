"use client";

import { useEffect, useState } from "react";

/** Stable fallback to avoid hydration mismatch (server/client Date can differ by timezone) */
const FALLBACK_YEAR = 2025;
const FALLBACK_MONTH = 0; // Jan

/**
 * Returns current year/month. Uses stable fallbacks during SSR/initial render
 * to avoid hydration mismatch, then updates to real values after mount.
 */
export function useClientDate() {
  const [date, setDate] = useState({
    year: FALLBACK_YEAR,
    month: FALLBACK_MONTH,
    isClient: false,
  });

  useEffect(() => {
    const now = new Date();
    setDate({
      year: now.getFullYear(),
      month: now.getMonth(),
      isClient: true,
    });
  }, []);

  return date;
}

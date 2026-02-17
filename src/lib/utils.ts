import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as compact "k" notation (e.g. 45000 → "45k") */
export function formatK(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return String(abs);
}

/** Format money with compact notation and ৳ symbol */
export function formatMoneyK(
  n: number,
  opts?: { withSign?: boolean }
): string {
  const abs = Math.abs(n);
  const sign = opts?.withSign && n < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    const formatted = new Intl.NumberFormat("en", {
      minimumFractionDigits: k % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(k);
    return `${sign}${formatted}k ৳`;
  }
  return (
    sign +
    new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(abs) +
    " ৳"
  );
}

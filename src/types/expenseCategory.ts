/** Icon type - Lucide icon name (same as wishlist) */
export type ExpenseCategoryIconType = string;

/** Preset gradient IDs for expense category — 10 color variations (no label, rounded color only) */
export type GradientPresetId =
  | "violet"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "orange"
  | "teal"
  | "lime";

/** Expense Category: e.g. House, Business - has name, icon, gradient */
export interface ExpenseCategory {
  id: string;
  name: string;
  icon: ExpenseCategoryIconType;
  gradientPreset: GradientPresetId;
}

/** Expense Type: e.g. Bazar, House Rent, Utilities - linked to ExpenseCategory */
export interface ExpenseType {
  id: string;
  name: string;
  /** ID of ExpenseCategory this type belongs to */
  categoryId: string;
  /** ID of MAIN_EXPENSE_CATEGORIES (basar, bebosar, etc.) — for filter by category in Expenses Entries */
  mainCategoryId?: string;
  /** Optional group — for grouping types in list view */
  group?: string;
}

/** Preset gradient for UI — rounded color only, no name */
export const GRADIENT_PRESETS: Record<
  GradientPresetId,
  { fromColor: string; toColor: string }
> = {
  violet: { fromColor: "#8b5cf6", toColor: "#d946ef" },
  blue: { fromColor: "#3b82f6", toColor: "#06b6d4" },
  emerald: { fromColor: "#10b981", toColor: "#14b8a6" },
  amber: { fromColor: "#f59e0b", toColor: "#f97316" },
  rose: { fromColor: "#f43f5e", toColor: "#ec4899" },
  cyan: { fromColor: "#06b6d4", toColor: "#3b82f6" },
  indigo: { fromColor: "#6366f1", toColor: "#8b5cf6" },
  orange: { fromColor: "#f97316", toColor: "#f59e0b" },
  teal: { fromColor: "#0d9488", toColor: "#2dd4bf" },
  lime: { fromColor: "#84cc16", toColor: "#a3e635" },
};

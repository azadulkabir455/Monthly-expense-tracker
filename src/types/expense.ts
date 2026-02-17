export type ExpenseType = "income" | "expense";

/** Main expense categories for dashboard */
export const MAIN_EXPENSE_CATEGORIES = [
  { id: "basar", label: "Grocery" },
  { id: "bebosar", label: "Business" },
  { id: "study", label: "Study" },
  { id: "medicine", label: "Medicine" },
  { id: "other", label: "Other" },
] as const;

export type MainCategoryId = (typeof MAIN_EXPENSE_CATEGORIES)[number]["id"];

export interface Expense {
  id: string;
  amount: number;
  type: ExpenseType;
  category: string;
  /** ID of ExpenseType (Bazar, House Rent, etc.) — for filtering by type */
  expenseTypeId?: string;
  description?: string;
  date: string; // YYYY-MM-DD
  month: number; // 1-12
  year: number;
  createdAt: string;
}

export interface CategoryWiseSummary {
  categoryId: string;
  label: string;
  total: number;
  count: number;
}

/** Category summary with monthly total for cards */
export interface CategoryWiseSummaryWithMonthly extends CategoryWiseSummary {
  monthlyTotal: number;
}

export interface MonthYear {
  month: number;
  year: number;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface MonthlySummary extends Summary {
  month: number;
  year: number;
  monthLabel: string;
}

export interface YearlySummary extends Summary {
  year: number;
}

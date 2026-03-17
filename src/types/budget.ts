export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  year: number;
  month: number;
  /** Expense category id (from Firestore expense categories) */
  categoryId: string;
  /** Expense type id under this category (optional) */
  expenseTypeId?: string;
}

/** Yearly budget item — no month; categoryId/expenseTypeId are yearly. */
export interface YearlyBudgetItem {
  id: string;
  name: string;
  amount: number;
  year: number;
  /** Yearly expense category id */
  categoryId: string;
  /** Yearly expense type id (optional) */
  expenseTypeId?: string;
}

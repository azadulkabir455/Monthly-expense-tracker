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

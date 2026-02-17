import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  Expense,
  Summary,
  MonthlySummary,
  YearlySummary,
  MAIN_EXPENSE_CATEGORIES,
} from "@/types/expense";
import type { CategoryWiseSummary, CategoryWiseSummaryWithMonthly } from "@/types/expense";
import type { ExpenseCategory, ExpenseType } from "@/types/expenseCategory";
import type { BudgetItem } from "@/types/budget";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getSummaryFromExpenses(expenses: Expense[]): Summary {
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: expenses.length,
  };
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

interface ExpensesState {
  items: Expense[];
  expenseCategories: ExpenseCategory[];
  expenseTypes: ExpenseType[];
  budgetItems: BudgetItem[];
  /** Debit amount per month: key = "year-month", value = amount */
  budgetDebitByMonth: Record<string, number>;
}

const demoDate = new Date();
const DEMO_YEAR = demoDate.getFullYear();
const DEMO_MONTH = demoDate.getMonth() + 1;

const DEMO_BUDGET_ITEMS: BudgetItem[] = [
  { id: "b1", name: "House Rent", amount: 12000, year: DEMO_YEAR, month: DEMO_MONTH },
  { id: "b2", name: "Bazar", amount: 8000, year: DEMO_YEAR, month: DEMO_MONTH },
  { id: "b3", name: "Utilities", amount: 2500, year: DEMO_YEAR, month: DEMO_MONTH },
];

const DEMO_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "house", name: "House", icon: "home", gradientPreset: "violet" },
  { id: "business", name: "Business", icon: "briefcase", gradientPreset: "blue" },
  { id: "personal", name: "Personal", icon: "user", gradientPreset: "emerald" },
];

const DEMO_EXPENSE_TYPES: ExpenseType[] = [
  { id: "bazar", name: "Bazar", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "vegetables", name: "Vegetables", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "fish-meat", name: "Fish & Meat", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "house-rent", name: "House Rent", categoryId: "house", mainCategoryId: "other", group: "House" },
  { id: "utilities", name: "Utilities", categoryId: "house", mainCategoryId: "other", group: "House" },
  { id: "medicine", name: "Medicine", categoryId: "personal", mainCategoryId: "medicine", group: "Personal" },
  { id: "study", name: "Study", categoryId: "personal", mainCategoryId: "study", group: "Personal" },
];

/** Generate demo expenses for chart - full year data (2024, 2025, 2026) */
function getDemoExpenses(): Expense[] {
  const items: Omit<Expense, "id" | "createdAt">[] = [];

  const add = (
    amount: number,
    type: "income" | "expense",
    category: string,
    year: number,
    month: number,
    day: number,
    desc?: string,
    expenseTypeId?: string
  ) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    items.push({
      amount,
      type,
      category,
      description: desc,
      date,
      month,
      year,
      ...(expenseTypeId && { expenseTypeId }),
    });
  };

  const categories = ["basar", "bebosar", "study", "medicine", "other"] as const;
  const typeIds = ["bazar", "house-rent", "utilities", "medicine", "study"] as const;

  for (const year of [2024, 2025, 2026]) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const salary = 45000 + ((year * 100 + month) % 10000);
      const freelance = month % 3 === 0 ? 15000 + ((month * 7) % 15000) : 0;

      add(salary, "income", "other", year, month, 5, "Salary");
      if (freelance) add(freelance, "income", "other", year, month, 15, "Freelance");

      add(12000, "expense", "other", year, month, 1, "Rent", "house-rent");
      const grocery = 3000 + ((month * 11) % 4000);
      add(grocery, "expense", "basar", year, month, 8, "Grocery", "bazar");
      add(1500 + ((month * 13) % 2000), "expense", "medicine", year, month, 10, "Medicine", "medicine");
      add(1000 + ((month * 17) % 3000), "expense", "study", year, month, 12, "Study", "study");
      if (month % 2 === 0) add(2000 + ((month * 19) % 5000), "expense", "bebosar", year, month, 20, "Business", "utilities");

      for (let d = 1; d <= Math.min(5, daysInMonth); d += 2) {
        add(500 + ((d * month) % 1500), "expense", categories[d % 5]!, year, month, d, undefined, typeIds[d % 5]);
      }
    }
  }

  return items.map((e, i) => ({
    ...e,
    id: String(i + 1),
    createdAt: new Date().toISOString(),
  }));
}

const initialState: ExpensesState = {
  items: getDemoExpenses(),
  expenseCategories: DEMO_EXPENSE_CATEGORIES,
  expenseTypes: DEMO_EXPENSE_TYPES,
  budgetItems: DEMO_BUDGET_ITEMS,
  budgetDebitByMonth: {},
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, "id" | "createdAt">>) => {
      const d = new Date(action.payload.date);
      state.items.push({
        ...action.payload,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const i = state.items.findIndex((e) => e.id === action.payload.id);
      if (i !== -1) state.items[i] = action.payload;
    },
    addExpenseCategory: (state, action: PayloadAction<Omit<ExpenseCategory, "id">>) => {
      state.expenseCategories.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updateExpenseCategory: (state, action: PayloadAction<ExpenseCategory>) => {
      const i = state.expenseCategories.findIndex((c) => c.id === action.payload.id);
      if (i !== -1) state.expenseCategories[i] = action.payload;
    },
    removeExpenseCategory: (state, action: PayloadAction<string>) => {
      state.expenseCategories = state.expenseCategories.filter((c) => c.id !== action.payload);
    },
    addExpenseType: (state, action: PayloadAction<Omit<ExpenseType, "id">>) => {
      state.expenseTypes.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updateExpenseType: (state, action: PayloadAction<ExpenseType>) => {
      const i = state.expenseTypes.findIndex((t) => t.id === action.payload.id);
      if (i !== -1) state.expenseTypes[i] = action.payload;
    },
    removeExpenseType: (state, action: PayloadAction<string>) => {
      state.expenseTypes = state.expenseTypes.filter((t) => t.id !== action.payload);
    },
    addBudgetItem: (state, action: PayloadAction<Omit<BudgetItem, "id">>) => {
      state.budgetItems.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updateBudgetItem: (state, action: PayloadAction<BudgetItem>) => {
      const i = state.budgetItems.findIndex((b) => b.id === action.payload.id);
      if (i !== -1) state.budgetItems[i] = action.payload;
    },
    removeBudgetItem: (state, action: PayloadAction<string>) => {
      state.budgetItems = state.budgetItems.filter((b) => b.id !== action.payload);
    },
    setBudgetDebitForMonth: (
      state,
      action: PayloadAction<{ year: number; month: number; amount: number }>
    ) => {
      const key = monthKey(action.payload.year, action.payload.month);
      state.budgetDebitByMonth[key] = action.payload.amount;
    },
    /** Hydrate from demo.json - use for local development without backend */
    hydrateFromDemo: (
      state,
      action: PayloadAction<{
        items: Expense[];
        expenseCategories: ExpenseCategory[];
        expenseTypes: ExpenseType[];
        budgetItems: BudgetItem[];
        budgetDebitByMonth?: Record<string, number>;
      }>
    ) => {
      state.items = action.payload.items;
      state.expenseCategories = action.payload.expenseCategories;
      state.expenseTypes = action.payload.expenseTypes;
      state.budgetItems = action.payload.budgetItems;
      if (action.payload.budgetDebitByMonth) {
        state.budgetDebitByMonth = action.payload.budgetDebitByMonth;
      }
    },
  },
});

export const {
  addExpense,
  removeExpense,
  updateExpense,
  addExpenseCategory,
  updateExpenseCategory,
  removeExpenseCategory,
  addExpenseType,
  updateExpenseType,
  removeExpenseType,
  addBudgetItem,
  updateBudgetItem,
  removeBudgetItem,
  setBudgetDebitForMonth,
  hydrateFromDemo,
} = expensesSlice.actions;

export function selectBudgetDebitForMonth(
  state: { expenses: ExpensesState },
  year: number,
  month: number
): number | null {
  const key = monthKey(year, month);
  const val = state.expenses.budgetDebitByMonth[key];
  return val !== undefined ? val : null;
}

export function selectBudgetItemsForMonth(
  state: { expenses: ExpensesState },
  year: number,
  month: number
): BudgetItem[] {
  return state.expenses.budgetItems.filter((b) => b.year === year && b.month === month);
}

/** All budget items (for migration/legacy - prefer selectBudgetItemsForMonth) */
export function selectBudgetItems(state: { expenses: ExpensesState }): BudgetItem[] {
  return state.expenses.budgetItems;
}

export function selectExpenseCategories(state: { expenses: ExpensesState }): ExpenseCategory[] {
  return state.expenses.expenseCategories;
}

export function selectExpenseTypes(state: { expenses: ExpensesState }): ExpenseType[] {
  return state.expenses.expenseTypes;
}

export function selectOverallSummary(state: { expenses: ExpensesState }): Summary {
  return getSummaryFromExpenses(state.expenses.items);
}

export function selectMonthlySummaries(state: {
  expenses: ExpensesState;
}): MonthlySummary[] {
  const byMonth = new Map<string, Expense[]>();
  for (const e of state.expenses.items) {
    const key = `${e.year}-${e.month}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }
  const result: MonthlySummary[] = [];
  byMonth.forEach((expenses, key) => {
    const [year, month] = key.split("-").map(Number);
    const s = getSummaryFromExpenses(expenses);
    result.push({
      ...s,
      month,
      year,
      monthLabel: MONTH_NAMES[month - 1] + " " + year,
    });
  });
  result.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));
  return result;
}

export function selectYearlySummaries(state: {
  expenses: ExpensesState;
}): YearlySummary[] {
  const byYear = new Map<number, Expense[]>();
  for (const e of state.expenses.items) {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year)!.push(e);
  }
  const result: YearlySummary[] = [];
  byYear.forEach((expenses, year) => {
    result.push({ ...getSummaryFromExpenses(expenses), year });
  });
  result.sort((a, b) => b.year - a.year);
  return result;
}

export function selectCurrentMonthSummary(state: {
  expenses: ExpensesState;
}): MonthlySummary | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return selectMonthlySummaryForMonth(state, year, month);
}

export function selectMonthlySummaryForMonth(
  state: { expenses: ExpensesState },
  year: number,
  month: number
): MonthlySummary | null {
  const items = state.expenses.items.filter((e) => e.month === month && e.year === year);
  if (items.length === 0) {
    return {
      month,
      year,
      monthLabel: MONTH_NAMES[month - 1] + " " + year,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    };
  }
  const s = getSummaryFromExpenses(items);
  return { ...s, month, year, monthLabel: MONTH_NAMES[month - 1] + " " + year };
}

export function selectCurrentYearSummary(state: {
  expenses: ExpensesState;
}): YearlySummary | null {
  const year = new Date().getFullYear();
  const items = state.expenses.items.filter((e) => e.year === year);
  return { ...getSummaryFromExpenses(items), year };
}

/** Category-wise expense summary */
export function selectCategoryWiseExpenseSummary(state: {
  expenses: ExpensesState;
}): CategoryWiseSummary[] {
  const expenseItems = state.expenses.items.filter((e) => e.type === "expense");
  const byCategory = new Map<string, { total: number; count: number }>();

  for (const cat of MAIN_EXPENSE_CATEGORIES) {
    byCategory.set(cat.id, { total: 0, count: 0 });
  }

  for (const e of expenseItems) {
    const key = MAIN_EXPENSE_CATEGORIES.some((c) => c.id === e.category)
      ? e.category
      : "other";
    const cur = byCategory.get(key) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    byCategory.set(key, cur);
  }

  return MAIN_EXPENSE_CATEGORIES.map((cat) => {
    const { total, count } = byCategory.get(cat.id) ?? { total: 0, count: 0 };
    return { categoryId: cat.id, label: cat.label, total, count };
  });
}

const now = () => new Date();
const currentMonth = () => now().getMonth() + 1;
const currentYear = () => now().getFullYear();

/** Category-wise summary with current month total */
export function selectCategoryWiseWithMonthly(state: {
  expenses: ExpensesState;
}): CategoryWiseSummaryWithMonthly[] {
  const expenseItems = state.expenses.items.filter((e) => e.type === "expense");
  const month = currentMonth();
  const year = currentYear();
  const byCategory = new Map<string, { total: number; monthlyTotal: number; count: number }>();

  for (const cat of MAIN_EXPENSE_CATEGORIES) {
    byCategory.set(cat.id, { total: 0, monthlyTotal: 0, count: 0 });
  }

  for (const e of expenseItems) {
    const key = MAIN_EXPENSE_CATEGORIES.some((c) => c.id === e.category)
      ? e.category
      : "other";
    const cur = byCategory.get(key) ?? { total: 0, monthlyTotal: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    if (e.month === month && e.year === year) cur.monthlyTotal += e.amount;
    byCategory.set(key, cur);
  }

  return MAIN_EXPENSE_CATEGORIES.map((cat) => {
    const data = byCategory.get(cat.id) ?? { total: 0, monthlyTotal: 0, count: 0 };
    return {
      categoryId: cat.id,
      label: cat.label,
      total: data.total,
      monthlyTotal: data.monthlyTotal,
      count: data.count,
    };
  });
}

/** Expenses filtered by year, month, optional day, category, and type */
export function selectExpensesFiltered(
  state: { expenses: ExpensesState },
  year: number,
  month: number,
  day?: number,
  categoryId?: string,
  typeId?: string
): Expense[] {
  let items = state.expenses.items.filter(
    (e) => e.year === year && e.month === month && e.type === "expense"
  );
  if (day != null) {
    items = items.filter((e) => new Date(e.date).getDate() === day);
  }
  if (categoryId && categoryId !== "all") {
    const key = MAIN_EXPENSE_CATEGORIES.some((c) => c.id === categoryId)
      ? categoryId
      : "other";
    items = items.filter((e) => {
      const c = MAIN_EXPENSE_CATEGORIES.some((c2) => c2.id === e.category) ? e.category : "other";
      return c === key;
    });
  }
  if (typeId && typeId !== "all") {
    items = items.filter((e) => e.expenseTypeId === typeId);
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Available years from expenses */
export function selectAvailableYears(state: {
  expenses: ExpensesState;
}): number[] {
  const years = new Set(state.expenses.items.map((e) => e.year));
  return Array.from(years).sort((a, b) => b - a);
}

/** Chart: monthly credit/debit for a year (Debit=income, Credit=expense) */
export function selectMonthlyCreditDebitForYear(
  state: { expenses: ExpensesState },
  year: number,
  categoryId?: string
): { month: number; debit: number; credit: number; label: string }[] {
  const items = state.expenses.items.filter((e) => {
    if (e.year !== year) return false;
    if (categoryId && categoryId !== "all" && e.category !== categoryId) return false;
    return true;
  });
  const result: { month: number; debit: number; credit: number; label: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthItems = items.filter((e) => e.month === m);
    const debit = monthItems.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const credit = monthItems.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    result.push({
      month: m,
      debit,
      credit,
      label: MONTH_NAMES[m - 1]?.slice(0, 3) ?? "",
    });
  }
  return result;
}

/** Chart: daily credit for a month (Credit=expense per day) */
export function selectDailyCreditForMonth(
  state: { expenses: ExpensesState },
  year: number,
  month: number,
  categoryId?: string
): { day: number; credit: number }[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const items = state.expenses.items.filter((e) => {
    if (e.year !== year || e.month !== month) return false;
    if (categoryId && categoryId !== "all" && e.category !== categoryId) return false;
    return true;
  });
  const byDay = new Map<number, number>();
  for (let d = 1; d <= daysInMonth; d++) byDay.set(d, 0);
  for (const e of items) {
    if (e.type === "expense") {
      const day = new Date(e.date).getDate();
      byDay.set(day, (byDay.get(day) ?? 0) + e.amount);
    }
  }
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    credit: byDay.get(i + 1) ?? 0,
  }));
}

/** Category-wise summary for a specific year and month */
export function selectCategoryWiseByYearAndMonth(
  state: { expenses: ExpensesState },
  year: number,
  month: number
): CategoryWiseSummaryWithMonthly[] {
  const expenseItems = state.expenses.items.filter(
    (e) => e.type === "expense" && e.year === year
  );
  const byCategory = new Map<string, { total: number; monthlyTotal: number; count: number }>();

  for (const cat of MAIN_EXPENSE_CATEGORIES) {
    byCategory.set(cat.id, { total: 0, monthlyTotal: 0, count: 0 });
  }

  for (const e of expenseItems) {
    const key = MAIN_EXPENSE_CATEGORIES.some((c) => c.id === e.category)
      ? e.category
      : "other";
    const cur = byCategory.get(key) ?? { total: 0, monthlyTotal: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    if (e.month === month) cur.monthlyTotal += e.amount;
    byCategory.set(key, cur);
  }

  return MAIN_EXPENSE_CATEGORIES.map((cat) => {
    const data = byCategory.get(cat.id) ?? { total: 0, monthlyTotal: 0, count: 0 };
    return {
      categoryId: cat.id,
      label: cat.label,
      total: data.total,
      monthlyTotal: data.monthlyTotal,
      count: data.count,
    };
  });
}

/** Category-wise summary for a specific year (uses current month for monthlyTotal) */
export function selectCategoryWiseByYear(
  state: { expenses: ExpensesState },
  year: number
): CategoryWiseSummaryWithMonthly[] {
  return selectCategoryWiseByYearAndMonth(state, year, currentMonth());
}

export default expensesSlice.reducer;

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Expense } from "@/types/expense";

const COLLECTION = "expenseEntries";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toExpense(id: string, data: DocumentData): Expense {
  return {
    id,
    amount: typeof data.amount === "number" ? data.amount : 0,
    type: (data.type as "income" | "expense") ?? "expense",
    category: (data.category as string) ?? "other",
    expenseTypeId: data.expenseTypeId != null && data.expenseTypeId !== "" ? (data.expenseTypeId as string) : undefined,
    description: data.description != null && data.description !== "" ? (data.description as string) : undefined,
    date: (data.date as string) ?? "",
    month: typeof data.month === "number" ? data.month : 1,
    year: typeof data.year === "number" ? data.year : new Date().getFullYear(),
    createdAt: (data.createdAt as string) ?? new Date().toISOString(),
  };
}

export function subscribeExpenseEntries(
  uid: string,
  onData: (entries: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs.map((d) => toExpense(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function addExpenseEntry(
  uid: string,
  data: Omit<Expense, "id" | "createdAt">
): Promise<Expense> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(col(uid), {
    amount: data.amount,
    type: data.type,
    category: data.category,
    expenseTypeId: data.expenseTypeId ?? null,
    description: data.description ?? null,
    date: data.date,
    month: data.month,
    year: data.year,
    createdAt,
  });
  return {
    ...data,
    id: ref.id,
    createdAt,
  };
}

export async function updateExpenseEntry(
  uid: string,
  id: string,
  data: Partial<Pick<Expense, "amount" | "type" | "category" | "expenseTypeId" | "description" | "date" | "month" | "year">>
): Promise<void> {
  const payload: DocumentData = {};
  if (data.amount !== undefined) payload.amount = data.amount;
  if (data.type !== undefined) payload.type = data.type;
  if (data.category !== undefined) payload.category = data.category;
  if (data.expenseTypeId !== undefined) payload.expenseTypeId = data.expenseTypeId ?? null;
  if (data.description !== undefined) payload.description = data.description ?? null;
  if (data.date !== undefined) payload.date = data.date;
  if (data.month !== undefined) payload.month = data.month;
  if (data.year !== undefined) payload.year = data.year;
  await updateDoc(docRef(uid, id), payload);
}

export async function deleteExpenseEntry(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

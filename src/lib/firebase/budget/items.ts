import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { BudgetItem } from "@/types/budget";

const COLLECTION = "budgetItems";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toItem(id: string, data: DocumentData): BudgetItem {
  return {
    id,
    name: (data.name as string) ?? "",
    amount: typeof data.amount === "number" ? data.amount : 0,
    year: typeof data.year === "number" ? data.year : new Date().getFullYear(),
    month: typeof data.month === "number" ? data.month : 1,
    categoryId: (data.categoryId as string) ?? "",
    expenseTypeId: data.expenseTypeId != null && data.expenseTypeId !== "" ? (data.expenseTypeId as string) : undefined,
  };
}

export function subscribeBudgetItemsForMonth(
  uid: string,
  year: number,
  month: number,
  onData: (items: BudgetItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    col(uid),
    where("year", "==", year),
    where("month", "==", month)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => toItem(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeBudgetItemsForYear(
  uid: string,
  year: number,
  onData: (items: BudgetItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(col(uid), where("year", "==", year));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => toItem(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function addBudgetItem(
  uid: string,
  data: Omit<BudgetItem, "id">
): Promise<BudgetItem> {
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    amount: data.amount,
    year: data.year,
    month: data.month,
    categoryId: data.categoryId,
    expenseTypeId: data.expenseTypeId ?? null,
  });
  return {
    id: ref.id,
    name: data.name.trim(),
    amount: data.amount,
    year: data.year,
    month: data.month,
    categoryId: data.categoryId,
    expenseTypeId: data.expenseTypeId,
  };
}

export async function updateBudgetItem(
  uid: string,
  id: string,
  data: Partial<Omit<BudgetItem, "id">>
): Promise<void> {
  const payload: DocumentData = {};
  if (data.name != null) payload.name = data.name.trim();
  if (data.amount != null) payload.amount = data.amount;
  if (data.year != null) payload.year = data.year;
  if (data.month != null) payload.month = data.month;
  if (data.categoryId != null) payload.categoryId = data.categoryId;
  if (data.expenseTypeId !== undefined) payload.expenseTypeId = data.expenseTypeId ?? null;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(docRef(uid, id), payload);
}

export async function deleteBudgetItem(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

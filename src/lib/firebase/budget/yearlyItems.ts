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
import type { YearlyBudgetItem } from "@/types/budget";

const COLLECTION = "yearlyBudgetItems";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toItem(id: string, data: DocumentData): YearlyBudgetItem {
  return {
    id,
    name: (data.name as string) ?? "",
    amount: typeof data.amount === "number" ? data.amount : 0,
    year: typeof data.year === "number" ? data.year : new Date().getFullYear(),
    categoryId: (data.categoryId as string) ?? "",
    expenseTypeId:
      data.expenseTypeId != null && data.expenseTypeId !== "" ? (data.expenseTypeId as string) : undefined,
  };
}

export function subscribeYearlyBudgetItems(
  uid: string,
  year: number,
  onData: (items: YearlyBudgetItem[]) => void,
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

export async function addYearlyBudgetItem(
  uid: string,
  data: Omit<YearlyBudgetItem, "id">
): Promise<YearlyBudgetItem> {
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    amount: data.amount,
    year: data.year,
    categoryId: data.categoryId,
    expenseTypeId: data.expenseTypeId ?? null,
  });
  return {
    id: ref.id,
    name: data.name.trim(),
    amount: data.amount,
    year: data.year,
    categoryId: data.categoryId,
    expenseTypeId: data.expenseTypeId,
  };
}

export async function updateYearlyBudgetItem(
  uid: string,
  id: string,
  data: Partial<Omit<YearlyBudgetItem, "id">>
): Promise<void> {
  const payload: DocumentData = {};
  if (data.name != null) payload.name = data.name.trim();
  if (data.amount != null) payload.amount = data.amount;
  if (data.year != null) payload.year = data.year;
  if (data.categoryId != null) payload.categoryId = data.categoryId;
  if (data.expenseTypeId !== undefined) payload.expenseTypeId = data.expenseTypeId ?? null;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(docRef(uid, id), payload);
}

export async function deleteYearlyBudgetItem(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

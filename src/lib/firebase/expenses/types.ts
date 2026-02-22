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
import type { ExpenseType } from "@/types/expenseCategory";

const COLLECTION = "expenseTypes";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toType(id: string, data: DocumentData): ExpenseType {
  return {
    id,
    name: (data.name as string) ?? "",
    categoryId: (data.categoryId as string) ?? "",
    mainCategoryId: data.mainCategoryId != null && data.mainCategoryId !== "" ? (data.mainCategoryId as string) : undefined,
    group: data.group != null && data.group !== "" ? (data.group as string) : undefined,
  };
}

export async function getExpenseTypes(uid: string): Promise<ExpenseType[]> {
  const { getDocs } = await import("firebase/firestore");
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => toType(d.id, d.data()));
}

export function subscribeExpenseTypes(
  uid: string,
  onData: (types: ExpenseType[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs.map((d) => toType(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function addExpenseType(
  uid: string,
  data: Omit<ExpenseType, "id">
): Promise<ExpenseType> {
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    categoryId: data.categoryId,
    mainCategoryId: data.mainCategoryId ?? null,
    group: data.group ?? null,
  });
  return {
    id: ref.id,
    name: data.name.trim(),
    categoryId: data.categoryId,
    mainCategoryId: data.mainCategoryId,
    group: data.group,
  };
}

export async function updateExpenseType(
  uid: string,
  id: string,
  data: Partial<Omit<ExpenseType, "id">>
): Promise<void> {
  const payload: DocumentData = {};
  if (data.name != null) payload.name = data.name.trim();
  if (data.categoryId != null) payload.categoryId = data.categoryId;
  if (data.mainCategoryId !== undefined) payload.mainCategoryId = data.mainCategoryId ?? null;
  if (data.group !== undefined) payload.group = data.group ?? null;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(docRef(uid, id), payload);
}

export async function deleteExpenseType(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

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
import type { ExpenseCategory } from "@/types/expenseCategory";
import type { GradientPresetId } from "@/types/expenseCategory";

const COLLECTION = "expenseCategories";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toCategory(id: string, data: DocumentData): ExpenseCategory {
  return {
    id,
    name: (data.name as string) ?? "",
    icon: (data.icon as string) ?? "home",
    gradientPreset: (data.gradientPreset as GradientPresetId) ?? "violet",
  };
}

export async function getExpenseCategories(uid: string): Promise<ExpenseCategory[]> {
  const { getDocs } = await import("firebase/firestore");
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => toCategory(d.id, d.data()));
}

export function subscribeExpenseCategories(
  uid: string,
  onData: (categories: ExpenseCategory[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs.map((d) => toCategory(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function addExpenseCategory(
  uid: string,
  data: { name: string; icon: string; gradientPreset: string }
): Promise<ExpenseCategory> {
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    icon: data.icon ?? "home",
    gradientPreset: data.gradientPreset ?? "violet",
  });
  return {
    id: ref.id,
    name: data.name.trim(),
    icon: data.icon ?? "home",
    gradientPreset: (data.gradientPreset as GradientPresetId) ?? "violet",
  };
}

export async function updateExpenseCategory(
  uid: string,
  id: string,
  data: { name: string; icon: string; gradientPreset: string }
): Promise<void> {
  await updateDoc(docRef(uid, id), {
    name: data.name.trim(),
    icon: data.icon ?? "home",
    gradientPreset: data.gradientPreset ?? "violet",
  });
}

export async function deleteExpenseCategory(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

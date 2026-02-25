import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { WishItem } from "@/types/wishlist";

const COLLECTION = "wishlistItems";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toItem(id: string, data: DocumentData): WishItem {
  return {
    id,
    name: (data.name as string) ?? "",
    approximateAmount: Number(data.approximateAmount) ?? 0,
    priorityId: (data.priorityId as string) ?? "",
    iconType: (data.iconType as string) ?? "gift",
    categoryId: data.categoryId != null && data.categoryId !== "" ? (data.categoryId as string) : undefined,
    done: data.done === true,
  };
}

export async function getItems(uid: string): Promise<WishItem[]> {
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => toItem(d.id, d.data()));
}

export function subscribeItems(
  uid: string,
  onData: (items: WishItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs.map((d) => toItem(d.id, d.data()));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function addItem(
  uid: string,
  data: Omit<WishItem, "id">
): Promise<WishItem> {
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    approximateAmount: data.approximateAmount,
    priorityId: data.priorityId,
    iconType: data.iconType ?? "gift",
    categoryId: data.categoryId ?? null,
  });
  return { ...data, id: ref.id };
}

export async function updateItem(
  uid: string,
  id: string,
  data: Partial<Omit<WishItem, "id">>
): Promise<void> {
  const payload: DocumentData = {};
  if (data.name != null) payload.name = data.name.trim();
  if (data.approximateAmount != null) payload.approximateAmount = data.approximateAmount;
  if (data.priorityId != null) payload.priorityId = data.priorityId;
  if (data.iconType != null) payload.iconType = data.iconType;
  if (data.categoryId !== undefined) payload.categoryId = data.categoryId ?? null;
  if (data.done !== undefined) payload.done = data.done === true;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(docRef(uid, id), payload);
}

export async function deleteItem(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

export async function deleteItems(uid: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(docRef(uid, id));
  }
  await batch.commit();
}

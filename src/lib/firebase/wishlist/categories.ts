import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { WishCategory } from "@/types/wishlist";

const COLLECTION = "wishlistCategories";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toCategory(id: string, data: DocumentData): WishCategory {
  return { id, name: (data.name as string) ?? "" };
}

export async function getCategories(uid: string): Promise<WishCategory[]> {
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => toCategory(d.id, d.data()));
}

export function subscribeCategories(
  uid: string,
  onData: (categories: WishCategory[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs.map((d) => toCategory(d.id, d.data()));
      onData(list);
    },
    (err) => {
      onError?.(err);
    }
  );
}

export async function addCategory(
  uid: string,
  data: { name: string }
): Promise<WishCategory> {
  const ref = await addDoc(col(uid), { name: data.name.trim() });
  return { id: ref.id, name: data.name.trim() };
}

export async function updateCategory(
  uid: string,
  id: string,
  data: { name: string }
): Promise<void> {
  await updateDoc(docRef(uid, id), { name: data.name.trim() });
}

export async function deleteCategory(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { WishPriorityType } from "@/types/wishlist";

const COLLECTION = "wishlistTypes";

function col(uid: string) {
  return collection(db, "users", uid, COLLECTION);
}

function docRef(uid: string, id: string) {
  return doc(db, "users", uid, COLLECTION, id);
}

function toType(id: string, data: DocumentData): WishPriorityType {
  return {
    id,
    name: (data.name as string) ?? "",
    order: Number(data.order) ?? 1,
  };
}

export async function getTypes(uid: string): Promise<WishPriorityType[]> {
  const snap = await getDocs(col(uid));
  return snap.docs
    .map((d) => toType(d.id, d.data()))
    .sort((a, b) => a.order - b.order);
}

export function subscribeTypes(
  uid: string,
  onData: (types: WishPriorityType[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    col(uid),
    (snap) => {
      const list = snap.docs
        .map((d) => toType(d.id, d.data()))
        .sort((a, b) => a.order - b.order);
      onData(list);
    },
    (err) => {
      onError?.(err);
    }
  );
}

/** Returns true if another doc (excluding excludeId) already has this order */
export async function isOrderTaken(
  uid: string,
  order: number,
  excludeId?: string
): Promise<boolean> {
  const snap = await getDocs(
    query(col(uid), where("order", "==", order))
  );
  const docs = snap.docs.filter((d) => d.id !== excludeId);
  return docs.length > 0;
}

export async function addType(
  uid: string,
  data: { name: string; order: number }
): Promise<WishPriorityType> {
  const taken = await isOrderTaken(uid, data.order);
  if (taken) {
    throw new Error("ORDER_TAKEN");
  }
  const ref = await addDoc(col(uid), {
    name: data.name.trim(),
    order: data.order,
  });
  return { id: ref.id, name: data.name.trim(), order: data.order };
}

export async function updateType(
  uid: string,
  id: string,
  data: { name: string; order: number }
): Promise<void> {
  const taken = await isOrderTaken(uid, data.order, id);
  if (taken) {
    throw new Error("ORDER_TAKEN");
  }
  await updateDoc(docRef(uid, id), {
    name: data.name.trim(),
    order: data.order,
  });
}

export async function deleteType(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

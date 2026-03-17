import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const COLLECTION = "yearlyBudgetDebit";

function docRef(uid: string, year: number) {
  return doc(db, "users", uid, COLLECTION, String(year));
}

type DebitData = { amounts?: Record<string, number> };

function getAmountForCategory(data: DebitData | undefined, categoryId: string): number | null {
  if (!data?.amounts || typeof data.amounts[categoryId] !== "number") return null;
  return data.amounts[categoryId];
}

export async function getYearlyDebit(
  uid: string,
  year: number,
  categoryId: string
): Promise<number | null> {
  const snap = await getDoc(docRef(uid, year));
  return getAmountForCategory(snap.data() as DebitData | undefined, categoryId);
}

export function subscribeYearlyDebit(
  uid: string,
  year: number,
  categoryId: string,
  onData: (amount: number | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    docRef(uid, year),
    (snap) => {
      const data = snap.data() as DebitData | undefined;
      onData(getAmountForCategory(data, categoryId));
    },
    (err) => onError?.(err)
  );
}

/** Subscribe to the full yearly debit doc (all categories for the year). */
export function subscribeYearlyDebitDoc(
  uid: string,
  year: number,
  onData: (data: { amounts: Record<string, number> }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    docRef(uid, year),
    (snap) => {
      const data = snap.data() as DebitData | undefined;
      const amounts = data?.amounts && typeof data.amounts === "object" ? { ...data.amounts } : {};
      onData({ amounts });
    },
    (err) => onError?.(err)
  );
}

export async function setYearlyDebit(
  uid: string,
  year: number,
  categoryId: string,
  amount: number
): Promise<void> {
  if (!uid || typeof year !== "number" || !categoryId || typeof categoryId !== "string") {
    throw new Error("Invalid yearly debit params");
  }
  const ref = docRef(uid, year);
  const snap = await getDoc(ref);
  const data = (snap.data() as DebitData | undefined) ?? {};
  const amounts = { ...(data.amounts ?? {}), [categoryId]: amount };
  await setDoc(ref, { amounts }, { merge: true });
}

import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const COLLECTION = "budgetDebit";

function docId(year: number, month: number) {
  return `${year}-${month}`;
}

function docRef(uid: string, year: number, month: number) {
  return doc(db, "users", uid, COLLECTION, docId(year, month));
}

/** Document shape: { amounts: { [categoryId]: number } }. Legacy: { amount: number } treated as single global. */
type DebitData = { amount?: number; amounts?: Record<string, number> };

function getAmountForCategory(data: DebitData | undefined, categoryId: string): number | null {
  if (!data) return null;
  if (data.amounts && typeof data.amounts[categoryId] === "number") {
    return data.amounts[categoryId];
  }
  if (typeof data.amount === "number" && !data.amounts) {
    return data.amount;
  }
  return null;
}

function getTotalForMonth(data: DebitData | undefined): number {
  if (!data) return 0;
  if (data.amounts && typeof data.amounts === "object") {
    return Object.values(data.amounts).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
  }
  return typeof data.amount === "number" ? data.amount : 0;
}

export async function getDebit(
  uid: string,
  year: number,
  month: number,
  categoryId: string
): Promise<number | null> {
  const snap = await getDoc(docRef(uid, year, month));
  return getAmountForCategory(snap.data() as DebitData | undefined, categoryId);
}

export function subscribeDebit(
  uid: string,
  year: number,
  month: number,
  categoryId: string,
  onData: (amount: number | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    docRef(uid, year, month),
    (snap) => {
      const data = snap.data() as DebitData | undefined;
      onData(getAmountForCategory(data, categoryId));
    },
    (err) => onError?.(err)
  );
}

export async function setDebit(
  uid: string,
  year: number,
  month: number,
  categoryId: string,
  amount: number
): Promise<void> {
  const ref = docRef(uid, year, month);
  const snap = await getDoc(ref);
  const data = (snap.data() as DebitData | undefined) ?? {};
  const amounts = typeof data.amount === "number" && !data.amounts
    ? {} as Record<string, number>
    : { ...(data.amounts ?? {}) };
  amounts[categoryId] = amount;
  await setDoc(ref, { amounts }, { merge: true });
}

/** Subscribe to the full debit doc for a month (all categories). For building per-category summary. */
export function subscribeDebitDoc(
  uid: string,
  year: number,
  month: number,
  onData: (data: { amounts: Record<string, number>; legacyAmount?: number }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    docRef(uid, year, month),
    (snap) => {
      const raw = snap.data() as DebitData | undefined;
      const legacyAmount = raw && typeof raw.amount === "number" && !raw.amounts ? raw.amount : undefined;
      const amounts = raw?.amounts && typeof raw.amounts === "object" ? { ...raw.amounts } : {};
      onData({ amounts, legacyAmount });
    },
    (err) => onError?.(err)
  );
}

/** Subscribe to budget debit for all 12 months of a year. onData receives month (1-12) -> total amount (sum of all categories). */
export function subscribeDebitForYear(
  uid: string,
  year: number,
  onData: (amountByMonth: Record<number, number>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const byMonth: Record<number, number> = {};
  const unsubs: Unsubscribe[] = [];
  const notify = () => onData({ ...byMonth });

  for (let month = 1; month <= 12; month++) {
    const unsub = onSnapshot(
      docRef(uid, year, month),
      (snap) => {
        const data = snap.data() as DebitData | undefined;
        byMonth[month] = getTotalForMonth(data);
        notify();
      },
      (err) => onError?.(err)
    );
    unsubs.push(unsub);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

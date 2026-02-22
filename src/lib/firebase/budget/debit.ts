import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const COLLECTION = "budgetDebit";

function docId(year: number, month: number) {
  return `${year}-${month}`;
}

function docRef(uid: string, year: number, month: number) {
  return doc(db, "users", uid, COLLECTION, docId(year, month));
}

export async function getDebit(
  uid: string,
  year: number,
  month: number
): Promise<number | null> {
  const snap = await getDoc(docRef(uid, year, month));
  const data = snap.data();
  if (data?.amount != null && typeof data.amount === "number") {
    return data.amount;
  }
  return null;
}

export function subscribeDebit(
  uid: string,
  year: number,
  month: number,
  onData: (amount: number | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    docRef(uid, year, month),
    (snap) => {
      const data = snap.data();
      if (data?.amount != null && typeof data.amount === "number") {
        onData(data.amount);
      } else {
        onData(null);
      }
    },
    (err) => onError?.(err)
  );
}

export async function setDebit(
  uid: string,
  year: number,
  month: number,
  amount: number
): Promise<void> {
  await setDoc(docRef(uid, year, month), { amount }, { merge: true });
}

/** Subscribe to budget debit for all 12 months of a year. onData receives month (1-12) -> amount. */
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
        const data = snap.data();
        if (data?.amount != null && typeof data.amount === "number") {
          byMonth[month] = data.amount;
        } else {
          byMonth[month] = 0;
        }
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

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { subscribeDebit, subscribeDebitForYear, subscribeDebitDoc, subscribeDebitDocForYear, setDebit as setDebitApi } from "@/lib/firebase/budget/debit";
import {
  subscribeBudgetItemsForMonth,
  subscribeBudgetItemsForYear,
  addBudgetItem as addItemApi,
  updateBudgetItem as updateItemApi,
  deleteBudgetItem as deleteItemApi,
} from "@/lib/firebase/budget/items";
import {
  subscribeYearlyDebit,
  subscribeYearlyDebitDoc,
  setYearlyDebit as setYearlyDebitApi,
} from "@/lib/firebase/budget/yearlyDebit";
import {
  subscribeYearlyBudgetItems,
  addYearlyBudgetItem as addYearlyItemApi,
  updateYearlyBudgetItem as updateYearlyItemApi,
  deleteYearlyBudgetItem as deleteYearlyItemApi,
} from "@/lib/firebase/budget/yearlyItems";
import type { BudgetItem, YearlyBudgetItem } from "@/types/budget";

export function useBudgetDebit(year: number, month: number, categoryId: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [debit, setDebitState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid || !categoryId) {
      setDebitState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeDebit(
      uid,
      year,
      month,
      categoryId,
      (amount) => {
        setDebitState(amount);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year, month, categoryId]);

  const setDebit = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    await setDebitApi(user.uid, year, month, categoryId, amount);
  };

  return {
    debit,
    loading,
    setDebit,
    isAuthenticated: !!uid,
  };
}

export function useBudgetDebitDoc(year: number, month: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<{ amounts: Record<string, number>; legacyAmount?: number }>({ amounts: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid) {
      setData({ amounts: {} });
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeDebitDoc(
      uid,
      year,
      month,
      (next) => {
        setData(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year, month]);

  return {
    amounts: data.amounts,
    legacyAmount: data.legacyAmount,
    loading,
    isAuthenticated: !!uid,
  };
}

export function useBudgetDebitForYear(year: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [debitByMonth, setDebitByMonth] = useState<Record<number, number>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked || !uid) {
      setDebitByMonth({});
      return;
    }
    const unsub = subscribeDebitForYear(
      uid,
      year,
      (byMonth) => setDebitByMonth(byMonth),
      () => {}
    );
    return () => unsub();
  }, [uid, authChecked, year]);

  return { debitByMonth, isAuthenticated: !!uid };
}

export function useBudgetDebitDocForYear(year: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [byMonth, setByMonth] = useState<Record<number, { amounts: Record<string, number>; legacyAmount?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked || !uid) {
      setByMonth({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeDebitDocForYear(
      uid,
      year,
      (next) => {
        setByMonth(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year]);

  return {
    byMonth,
    loading,
    isAuthenticated: !!uid,
  };
}

export function useBudgetItemsForYear(year: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked || !uid) {
      setItems([]);
      return;
    }
    const unsub = subscribeBudgetItemsForYear(
      uid,
      year,
      (list) => setItems(list),
      () => {}
    );
    return () => unsub();
  }, [uid, authChecked, year]);

  return { items, isAuthenticated: !!uid };
}

export function useBudgetItems(year: number, month: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeBudgetItemsForMonth(
      uid,
      year,
      month,
      (list) => {
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year, month]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addItem = async (data: Omit<BudgetItem, "id">) => {
    const currentUid = await ensureAuth();
    return addItemApi(currentUid, data);
  };

  const updateItem = async (id: string, data: Partial<Omit<BudgetItem, "id">>) => {
    const currentUid = await ensureAuth();
    return updateItemApi(currentUid, id, data);
  };

  const deleteItem = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteItemApi(currentUid, id);
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    isAuthenticated: !!uid,
  };
}

export function useYearlyBudgetDebit(year: number, categoryId: string) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [debit, setDebitState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid || !categoryId) {
      setDebitState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeYearlyDebit(
      uid,
      year,
      categoryId,
      (amount) => {
        setDebitState(amount);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year, categoryId]);

  const setDebit = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    if (!categoryId) throw new Error("Select a category first.");
    await user.getIdToken(true);
    await setYearlyDebitApi(user.uid, year, categoryId, amount);
  };

  return {
    debit,
    loading,
    setDebit,
    isAuthenticated: !!uid,
  };
}

/** Full yearly debit doc (all categories) for the year — e.g. for yearly entries cards. */
export function useYearlyBudgetDebitDoc(year: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<{ amounts: Record<string, number> }>({ amounts: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid) {
      setData({ amounts: {} });
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeYearlyDebitDoc(
      uid,
      year,
      (next) => {
        setData(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year]);

  return {
    amounts: data.amounts,
    loading,
    isAuthenticated: !!uid,
  };
}

export function useYearlyBudgetItems(year: number) {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<YearlyBudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeYearlyBudgetItems(
      uid,
      year,
      (list) => {
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addItem = async (data: Omit<YearlyBudgetItem, "id">) => {
    const currentUid = await ensureAuth();
    return addYearlyItemApi(currentUid, data);
  };

  const updateItem = async (id: string, data: Partial<Omit<YearlyBudgetItem, "id">>) => {
    const currentUid = await ensureAuth();
    return updateYearlyItemApi(currentUid, id, data);
  };

  const deleteItem = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteYearlyItemApi(currentUid, id);
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    isAuthenticated: !!uid,
  };
}

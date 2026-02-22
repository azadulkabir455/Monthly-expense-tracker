"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { subscribeDebit, subscribeDebitForYear, setDebit as setDebitApi } from "@/lib/firebase/budget/debit";
import {
  subscribeBudgetItemsForMonth,
  subscribeBudgetItemsForYear,
  addBudgetItem as addItemApi,
  updateBudgetItem as updateItemApi,
  deleteBudgetItem as deleteItemApi,
} from "@/lib/firebase/budget/items";
import type { BudgetItem } from "@/types/budget";

export function useBudgetDebit(year: number, month: number) {
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
    if (!uid) {
      setDebitState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeDebit(
      uid,
      year,
      month,
      (amount) => {
        setDebitState(amount);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked, year, month]);

  const setDebit = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    await setDebitApi(user.uid, year, month, amount);
  };

  return {
    debit,
    loading,
    setDebit,
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

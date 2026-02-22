"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { ExpenseCategory, ExpenseType } from "@/types/expenseCategory";
import type { Expense } from "@/types/expense";
import { setExpenseItems } from "@/store/slices/expensesSlice";
import {
  subscribeExpenseCategories,
  addExpenseCategory as addApi,
  updateExpenseCategory as updateApi,
  deleteExpenseCategory as deleteApi,
} from "@/lib/firebase/expenses/categories";
import {
  subscribeExpenseTypes,
  addExpenseType as addTypeApi,
  updateExpenseType as updateTypeApi,
  deleteExpenseType as deleteTypeApi,
} from "@/lib/firebase/expenses/types";
import {
  subscribeExpenseEntries,
  addExpenseEntry as addEntryApi,
  updateExpenseEntry as updateEntryApi,
  deleteExpenseEntry as deleteEntryApi,
} from "@/lib/firebase/expenses/entries";

export function useExpenseCategories() {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
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
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeExpenseCategories(
      uid,
      (list) => {
        setCategories(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addCategory = async (
    name: string,
    icon: string,
    gradientPreset: string
  ) => {
    const currentUid = await ensureAuth();
    return addApi(currentUid, { name, icon, gradientPreset });
  };

  const updateCategory = async (
    id: string,
    name: string,
    icon: string,
    gradientPreset: string
  ) => {
    const currentUid = await ensureAuth();
    return updateApi(currentUid, id, { name, icon, gradientPreset });
  };

  const deleteCategory = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteApi(currentUid, id);
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    isAuthenticated: !!uid,
  };
}

export function useExpenseTypes() {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [types, setTypes] = useState<ExpenseType[]>([]);
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
      setTypes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeExpenseTypes(
      uid,
      (list) => {
        setTypes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid, authChecked]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addType = async (data: Omit<ExpenseType, "id">) => {
    const currentUid = await ensureAuth();
    return addTypeApi(currentUid, data);
  };

  const updateType = async (id: string, data: Partial<Omit<ExpenseType, "id">>) => {
    const currentUid = await ensureAuth();
    return updateTypeApi(currentUid, id, data);
  };

  const deleteType = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteTypeApi(currentUid, id);
  };

  return {
    types,
    loading,
    addType,
    updateType,
    deleteType,
    isAuthenticated: !!uid,
  };
}

export function useExpenseEntries() {
  const dispatch = useDispatch();
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!uid) return;
    const unsub = subscribeExpenseEntries(
      uid,
      (list) => dispatch(setExpenseItems(list)),
      () => {}
    );
    return () => unsub();
  }, [uid, authChecked, dispatch]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addEntry = async (data: Omit<Expense, "id" | "createdAt">) => {
    const currentUid = await ensureAuth();
    return addEntryApi(currentUid, data);
  };

  const updateEntry = async (
    id: string,
    data: Partial<Pick<Expense, "amount" | "type" | "category" | "expenseTypeId" | "description" | "date" | "month" | "year">>
  ) => {
    const currentUid = await ensureAuth();
    return updateEntryApi(currentUid, id, data);
  };

  const removeEntry = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteEntryApi(currentUid, id);
  };

  return {
    addEntry,
    updateEntry,
    removeEntry,
    isAuthenticated: !!uid,
  };
}

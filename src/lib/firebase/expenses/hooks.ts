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
  syncMonthlyCategoryTypesToYearly,
  removeSyncedYearlyTypesForMonthlyCategory,
} from "@/lib/firebase/expenses/syncYearly";
import { getExpenseTypes } from "@/lib/firebase/expenses/types";
import {
  subscribeExpenseTypes,
  addExpenseType as addTypeApi,
  updateExpenseType as updateTypeApi,
  deleteExpenseType as deleteTypeApi,
} from "@/lib/firebase/expenses/types";
import {
  getYearlyTypes,
  addYearlyType as addYearlyTypeApi,
  updateYearlyType as updateYearlyTypeApi,
  deleteYearlyType as deleteYearlyTypeApi,
} from "@/lib/firebase/yearly/types";
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
    gradientPreset: string,
    yearlyCategoryId?: string | null
  ) => {
    const currentUid = await ensureAuth();
    return addApi(currentUid, { name, icon, gradientPreset, yearlyCategoryId });
  };

  const updateCategory = async (
    id: string,
    name: string,
    icon: string,
    gradientPreset: string,
    yearlyCategoryId?: string | null
  ) => {
    const currentUid = await ensureAuth();
    const prev = categories.find((c) => c.id === id);
    const prevYearlyId = prev?.yearlyCategoryId ?? undefined;
    await updateApi(currentUid, id, { name, icon, gradientPreset, yearlyCategoryId });
    if (prevYearlyId && !yearlyCategoryId) {
      const monthlyTypes = await getExpenseTypes(currentUid);
      const typeIds = monthlyTypes.filter((t) => t.categoryId === id).map((t) => t.id);
      await removeSyncedYearlyTypesForMonthlyCategory(currentUid, prevYearlyId, typeIds);
    } else if (yearlyCategoryId) {
      if (prevYearlyId && prevYearlyId !== yearlyCategoryId) {
        const monthlyTypes = await getExpenseTypes(currentUid);
        const typeIds = monthlyTypes.filter((t) => t.categoryId === id).map((t) => t.id);
        await removeSyncedYearlyTypesForMonthlyCategory(currentUid, prevYearlyId, typeIds);
      }
      await syncMonthlyCategoryTypesToYearly(currentUid, id, yearlyCategoryId);
    }
  };

  const deleteCategory = async (id: string) => {
    const currentUid = await ensureAuth();
    const cat = categories.find((c) => c.id === id);
    if (cat?.yearlyCategoryId) {
      const monthlyTypes = await getExpenseTypes(currentUid);
      const typeIds = monthlyTypes.filter((t) => t.categoryId === id).map((t) => t.id);
      await removeSyncedYearlyTypesForMonthlyCategory(currentUid, cat.yearlyCategoryId, typeIds);
    }
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

  const addType = async (
    data: Omit<ExpenseType, "id">,
    yearlyCategoryId?: string | null
  ) => {
    const currentUid = await ensureAuth();
    const newType = await addTypeApi(currentUid, data);
    if (yearlyCategoryId) {
      await addYearlyTypeApi(currentUid, {
        name: newType.name,
        categoryId: yearlyCategoryId,
        sourceMonthlyTypeId: newType.id,
      });
    }
    return newType;
  };

  const updateType = async (id: string, data: Partial<Omit<ExpenseType, "id">>) => {
    const currentUid = await ensureAuth();
    await updateTypeApi(currentUid, id, data);
    const yearlyTypes = await getYearlyTypes(currentUid);
    const synced = yearlyTypes.find((t) => t.sourceMonthlyTypeId === id);
    if (synced && data.name != null) {
      await updateYearlyTypeApi(currentUid, synced.id, { name: data.name });
    }
  };

  const deleteType = async (id: string) => {
    const currentUid = await ensureAuth();
    const yearlyTypes = await getYearlyTypes(currentUid);
    const synced = yearlyTypes.find((t) => t.sourceMonthlyTypeId === id);
    if (synced) await deleteYearlyTypeApi(currentUid, synced.id);
    await deleteTypeApi(currentUid, id);
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

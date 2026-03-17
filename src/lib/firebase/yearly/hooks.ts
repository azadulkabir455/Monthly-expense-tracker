"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { ExpenseCategory, ExpenseType } from "@/types/expenseCategory";
import {
  subscribeYearlyCategories,
  addYearlyCategory as addApi,
  updateYearlyCategory as updateApi,
  deleteYearlyCategory as deleteApi,
} from "@/lib/firebase/yearly/categories";
import {
  subscribeYearlyTypes,
  addYearlyType as addTypeApi,
  updateYearlyType as updateTypeApi,
  deleteYearlyType as deleteTypeApi,
} from "@/lib/firebase/yearly/types";

export function useYearlyCategories() {
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
    const unsub = subscribeYearlyCategories(
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

export function useYearlyTypes() {
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
    const unsub = subscribeYearlyTypes(
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

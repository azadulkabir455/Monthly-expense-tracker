"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { WishCategory } from "@/types/wishlist";
import type { WishPriorityType } from "@/types/wishlist";
import {
  subscribeCategories,
  addCategory as addCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
} from "@/lib/firebase/wishlist/categories";
import {
  subscribeTypes,
  addType as addTypeApi,
  updateType as updateTypeApi,
  deleteType as deleteTypeApi,
} from "@/lib/firebase/wishlist/types";
import {
  subscribeItems,
  addItem as addItemApi,
  updateItem as updateItemApi,
  deleteItem as deleteItemApi,
  deleteItems as deleteItemsApi,
} from "@/lib/firebase/wishlist/items";
import type { WishItem } from "@/types/wishlist";

export function useWishlistCategories() {
  const [uid, setUid] = useState<string | null>(null);
  const [categories, setCategories] = useState<WishCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeCategories(
      uid,
      (list) => {
        setCategories(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addCategory = async (name: string) => {
    const currentUid = await ensureAuth();
    return addCategoryApi(currentUid, { name });
  };

  const updateCategory = async (id: string, name: string) => {
    const currentUid = await ensureAuth();
    return updateCategoryApi(currentUid, id, { name });
  };

  const deleteCategory = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteCategoryApi(currentUid, id);
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

export function useWishlistTypes() {
  const [uid, setUid] = useState<string | null>(null);
  const [types, setTypes] = useState<WishPriorityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) {
      setTypes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeTypes(
      uid,
      (list) => {
        setTypes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const addType = async (name: string, order: number) => {
    const currentUid = await ensureAuth();
    return addTypeApi(currentUid, { name, order });
  };

  const updateType = async (id: string, name: string, order: number) => {
    const currentUid = await ensureAuth();
    return updateTypeApi(currentUid, id, { name, order });
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

export function useWishlistItems(priorityOrder: { id: string; order: number }[] = []) {
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeItems(
      uid,
      (list) => {
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid]);

  const ensureAuth = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("NOT_AUTHENTICATED");
    await user.getIdToken(true);
    return user.uid;
  };

  const orderMap = new Map(priorityOrder.map((p) => [p.id, p.order]));
  const sortedItems = [...items].sort(
    (a, b) => (orderMap.get(a.priorityId) ?? 99) - (orderMap.get(b.priorityId) ?? 99)
  );

  const addItem = async (data: Omit<WishItem, "id">) => {
    const currentUid = await ensureAuth();
    return addItemApi(currentUid, data);
  };

  const updateItem = async (id: string, data: Partial<Omit<WishItem, "id">>) => {
    const currentUid = await ensureAuth();
    return updateItemApi(currentUid, id, data);
  };

  const deleteItem = async (id: string) => {
    const currentUid = await ensureAuth();
    return deleteItemApi(currentUid, id);
  };

  const deleteItems = async (ids: string[]) => {
    const currentUid = await ensureAuth();
    return deleteItemsApi(currentUid, ids);
  };

  return {
    items: sortedItems,
    loading,
    addItem,
    updateItem,
    deleteItem,
    deleteItems,
    isAuthenticated: !!uid,
  };
}

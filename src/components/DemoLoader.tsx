"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { hydrateFromDemo as hydrateExpenses } from "@/store/slices/expensesSlice";
import { hydrateFromDemo as hydrateWishlist } from "@/store/slices/wishlistSlice";

/** Fetches demo.json and hydrates Redux store for local development without backend */
export function DemoLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetch("/demo.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.expenses) {
          dispatch(
            hydrateExpenses({
              items: data.expenses.items ?? [],
              expenseCategories: data.expenses.expenseCategories ?? [],
              expenseTypes: data.expenses.expenseTypes ?? [],
              budgetItems: data.expenses.budgetItems ?? [],
              budgetDebitByMonth: data.expenses.budgetDebitByMonth ?? {},
            })
          );
        }
        if (data.wishlist) {
          dispatch(
            hydrateWishlist({
              items: data.wishlist.items ?? [],
              categories: data.wishlist.categories ?? [],
              priorities: data.wishlist.priorities ?? [],
            })
          );
        }
      })
      .catch(() => {
        // Keep slice's default initialState if fetch fails
      });
  }, [dispatch]);

  return null;
}

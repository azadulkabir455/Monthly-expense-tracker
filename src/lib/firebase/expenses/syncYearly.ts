import { getExpenseTypes } from "@/lib/firebase/expenses/types";
import {
  getYearlyTypes,
  addYearlyType,
  deleteYearlyType,
} from "@/lib/firebase/yearly/types";

/**
 * When a monthly category is linked to a yearly category, sync all its types
 * as yearly types under that yearly category (with sourceMonthlyTypeId).
 */
export async function syncMonthlyCategoryTypesToYearly(
  uid: string,
  monthlyCategoryId: string,
  yearlyCategoryId: string
): Promise<void> {
  const [monthlyTypes, yearlyTypes] = await Promise.all([
    getExpenseTypes(uid),
    getYearlyTypes(uid),
  ]);
  const categoryTypes = monthlyTypes.filter((t) => t.categoryId === monthlyCategoryId);
  const existingBySource = new Set(
    yearlyTypes
      .filter((t) => t.categoryId === yearlyCategoryId && t.sourceMonthlyTypeId)
      .map((t) => t.sourceMonthlyTypeId!)
  );
  for (const t of categoryTypes) {
    if (existingBySource.has(t.id)) continue;
    await addYearlyType(uid, {
      name: t.name,
      categoryId: yearlyCategoryId,
      sourceMonthlyTypeId: t.id,
    });
  }
}

/**
 * When a monthly category is unlinked (yearlyCategoryId removed), delete
 * yearly types that were synced from this category's types.
 */
export async function removeSyncedYearlyTypesForMonthlyCategory(
  uid: string,
  yearlyCategoryId: string,
  monthlyTypeIds: string[]
): Promise<void> {
  if (monthlyTypeIds.length === 0) return;
  const yearlyTypes = await getYearlyTypes(uid);
  const toDelete = yearlyTypes.filter(
    (t) =>
      t.categoryId === yearlyCategoryId &&
      t.sourceMonthlyTypeId &&
      monthlyTypeIds.includes(t.sourceMonthlyTypeId!)
  );
  for (const t of toDelete) {
    await deleteYearlyType(uid, t.id);
  }
}

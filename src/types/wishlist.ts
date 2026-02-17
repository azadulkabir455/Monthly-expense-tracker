/** Icon type for wish list items - Lucide icon name (e.g. "laptop", "gift", "graduation-cap") */
export type WishIconType = string;

export interface WishCategory {
  id: string;
  name: string;
}

/** User-defined priority type (like category) - order: 1 = highest */
export interface WishPriorityType {
  id: string;
  name: string;
  order: number;
}

export interface WishItem {
  id: string;
  name: string;
  approximateAmount: number; // in ৳
  priorityId: string; // references WishPriorityType
  iconType: WishIconType;
  categoryId?: string;
}

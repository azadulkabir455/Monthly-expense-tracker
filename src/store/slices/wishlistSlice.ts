import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { WishItem, WishCategory, WishPriorityType } from "@/types/wishlist";

const DEMO_CATEGORIES: WishCategory[] = [
  { id: "tech", name: "Tech" },
  { id: "travel", name: "Travel" },
  { id: "home", name: "Home" },
  { id: "lifestyle", name: "Lifestyle" },
];

const DEMO_PRIORITIES: WishPriorityType[] = [
  { id: "high", name: "High", order: 1 },
  { id: "medium", name: "Medium", order: 2 },
  { id: "normal", name: "Normal", order: 3 },
  { id: "low", name: "Low", order: 4 },
  { id: "lowest", name: "Lowest", order: 5 },
];

interface WishlistState {
  items: WishItem[];
  categories: WishCategory[];
  priorities: WishPriorityType[];
}

const DEMO_WISH_ITEMS: WishItem[] = [
  { id: "1", name: "MacBook Pro", approximateAmount: 150000, priorityId: "high", iconType: "laptop", categoryId: "tech" },
  { id: "2", name: "iPhone 16", approximateAmount: 125000, priorityId: "high", iconType: "smartphone", categoryId: "tech" },
  { id: "3", name: "Motorcycle", approximateAmount: 200000, priorityId: "medium", iconType: "bike", categoryId: "lifestyle" },
  { id: "4", name: "Europe Trip", approximateAmount: 300000, priorityId: "medium", iconType: "plane", categoryId: "travel" },
  { id: "5", name: "Sony TV 55\"", approximateAmount: 85000, priorityId: "normal", iconType: "tv", categoryId: "home" },
  { id: "6", name: "Smart Watch", approximateAmount: 25000, priorityId: "normal", iconType: "watch", categoryId: "tech" },
  { id: "7", name: "DSLR Camera", approximateAmount: 95000, priorityId: "low", iconType: "camera", categoryId: "lifestyle" },
  { id: "8", name: "Gym Membership", approximateAmount: 12000, priorityId: "low", iconType: "dumbbell", categoryId: "lifestyle" },
  { id: "9", name: "Online Course", approximateAmount: 15000, priorityId: "lowest", iconType: "graduation-cap", categoryId: "lifestyle" },
  { id: "10", name: "Gaming Console", approximateAmount: 55000, priorityId: "lowest", iconType: "gamepad", categoryId: "tech" },
  { id: "11", name: "Air Purifier", approximateAmount: 18000, priorityId: "normal", iconType: "home", categoryId: "home" },
  { id: "12", name: "Gold Ring", approximateAmount: 75000, priorityId: "medium", iconType: "gem", categoryId: "lifestyle" },
  { id: "13", name: "Kindle", approximateAmount: 12000, priorityId: "low", iconType: "book", categoryId: "lifestyle" },
  { id: "14", name: "Fitness Tracker", approximateAmount: 8000, priorityId: "lowest", iconType: "dumbbell", categoryId: "lifestyle" },
  { id: "15", name: "Headphones", approximateAmount: 15000, priorityId: "normal", iconType: "gift", categoryId: "tech" },
  { id: "16", name: "Japan Trip", approximateAmount: 250000, priorityId: "high", iconType: "plane", categoryId: "travel" },
  { id: "17", name: "Smart Speaker", approximateAmount: 12000, priorityId: "lowest", iconType: "tv", categoryId: "home" },
  { id: "18", name: "Electric Scooter", approximateAmount: 35000, priorityId: "normal", iconType: "bike", categoryId: "lifestyle" },
];

const initialState: WishlistState = {
  items: DEMO_WISH_ITEMS,
  categories: DEMO_CATEGORIES,
  priorities: DEMO_PRIORITIES,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addWish: (state, action: PayloadAction<Omit<WishItem, "id">>) => {
      state.items.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updateWish: (state, action: PayloadAction<WishItem>) => {
      const i = state.items.findIndex((x) => x.id === action.payload.id);
      if (i !== -1) state.items[i] = action.payload;
    },
    removeWish: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    removeWishes: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.items = state.items.filter((x) => !ids.has(x.id));
    },
    addCategory: (state, action: PayloadAction<Omit<WishCategory, "id">>) => {
      state.categories.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updateCategory: (state, action: PayloadAction<WishCategory>) => {
      const i = state.categories.findIndex((c) => c.id === action.payload.id);
      if (i !== -1) state.categories[i] = action.payload;
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      state.items = state.items.map((item) =>
        item.categoryId === action.payload ? { ...item, categoryId: undefined } : item
      );
    },
    addPriority: (state, action: PayloadAction<Omit<WishPriorityType, "id">>) => {
      state.priorities.push({
        ...action.payload,
        id: crypto.randomUUID(),
      });
    },
    updatePriority: (state, action: PayloadAction<WishPriorityType>) => {
      const i = state.priorities.findIndex((p) => p.id === action.payload.id);
      if (i !== -1) state.priorities[i] = action.payload;
    },
    removePriority: (state, action: PayloadAction<string>) => {
      const fallback = state.priorities.find((p) => p.id !== action.payload);
      state.priorities = state.priorities.filter((p) => p.id !== action.payload);
      if (fallback) {
        state.items = state.items.map((item) =>
          item.priorityId === action.payload ? { ...item, priorityId: fallback.id } : item
        );
      }
    },
    /** Hydrate from demo.json - use for local development without backend */
    hydrateFromDemo: (
      state,
      action: PayloadAction<{
        items: WishItem[];
        categories: WishCategory[];
        priorities: WishPriorityType[];
      }>
    ) => {
      state.items = action.payload.items;
      state.categories = action.payload.categories;
      state.priorities = action.payload.priorities;
    },
  },
});

export const { addWish, updateWish, removeWish, removeWishes, addCategory, updateCategory, removeCategory, addPriority, updatePriority, removePriority, hydrateFromDemo } = wishlistSlice.actions;

/** Select all categories */
export function selectWishCategories(state: { wishlist: WishlistState }): WishCategory[] {
  return state.wishlist.categories;
}

/** Select all priorities, sorted by order */
export function selectWishPriorities(state: { wishlist: WishlistState }): WishPriorityType[] {
  return [...state.wishlist.priorities].sort((a, b) => a.order - b.order);
}

/** Select wish items by priority order, optionally limited */
export function selectTopWishItemsByPriority(
  state: { wishlist: WishlistState },
  limit = 5
): WishItem[] {
  const priorities = selectWishPriorities(state);
  const orderMap = new Map(priorities.map((p) => [p.id, p.order]));
  return [...state.wishlist.items]
    .sort((a, b) => (orderMap.get(a.priorityId) ?? 99) - (orderMap.get(b.priorityId) ?? 99))
    .slice(0, limit);
}

/** Select all wish items sorted by priority order */
export function selectAllWishItems(state: { wishlist: WishlistState }): WishItem[] {
  const priorities = selectWishPriorities(state);
  const orderMap = new Map(priorities.map((p) => [p.id, p.order]));
  return [...state.wishlist.items].sort(
    (a, b) => (orderMap.get(a.priorityId) ?? 99) - (orderMap.get(b.priorityId) ?? 99)
  );
}

export default wishlistSlice.reducer;

/** Run: node scripts/generate-demo-json.js > public/demo.json */
const fs = require("fs");
const path = require("path");

const demoDate = new Date();
const DEMO_YEAR = demoDate.getFullYear();
const DEMO_MONTH = demoDate.getMonth() + 1;

const items = [];
const add = (amount, type, category, year, month, day, desc, expenseTypeId) => {
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  items.push({
    amount,
    type,
    category,
    description: desc || null,
    date,
    month,
    year,
    ...(expenseTypeId && { expenseTypeId }),
  });
};

const categories = ["basar", "bebosar", "study", "medicine", "other"];
const typeIds = ["bazar", "house-rent", "utilities", "medicine", "study"];

for (const year of [2024, 2025, 2026]) {
  for (let month = 1; month <= 12; month++) {
    const salary = 45000 + ((year * 100 + month) % 10000);
    const freelance = month % 3 === 0 ? 15000 + ((month * 7) % 15000) : 0;
    add(salary, "income", "other", year, month, 5, "Salary");
    if (freelance) add(freelance, "income", "other", year, month, 15, "Freelance");
    add(12000, "expense", "other", year, month, 1, "Rent", "house-rent");
    add(3000 + ((month * 11) % 4000), "expense", "basar", year, month, 8, "Grocery", "bazar");
    add(1500 + ((month * 13) % 2000), "expense", "medicine", year, month, 10, "Medicine", "medicine");
    add(1000 + ((month * 17) % 3000), "expense", "study", year, month, 12, "Study", "study");
    if (month % 2 === 0)
      add(2000 + ((month * 19) % 5000), "expense", "bebosar", year, month, 20, "Business", "utilities");
    for (let d = 1; d <= Math.min(5, new Date(year, month, 0).getDate()); d += 2) {
      add(500 + ((d * month) % 1500), "expense", categories[d % 5], year, month, d, undefined, typeIds[d % 5]);
    }
  }
}

const expenses = items.map((e, i) => ({
  ...e,
  id: String(i + 1),
  createdAt: new Date().toISOString(),
}));

const expenseCategories = [
  { id: "house", name: "House", icon: "home", gradientPreset: "violet" },
  { id: "business", name: "Business", icon: "briefcase", gradientPreset: "blue" },
  { id: "personal", name: "Personal", icon: "user", gradientPreset: "emerald" },
];

const expenseTypes = [
  { id: "bazar", name: "Bazar", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "vegetables", name: "Vegetables", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "fish-meat", name: "Fish & Meat", categoryId: "house", mainCategoryId: "basar", group: "Grocery" },
  { id: "house-rent", name: "House Rent", categoryId: "house", mainCategoryId: "other", group: "House" },
  { id: "utilities", name: "Utilities", categoryId: "house", mainCategoryId: "other", group: "House" },
  { id: "medicine", name: "Medicine", categoryId: "personal", mainCategoryId: "medicine", group: "Personal" },
  { id: "study", name: "Study", categoryId: "personal", mainCategoryId: "study", group: "Personal" },
];

const budgetItems = [
  { id: "b1", name: "House Rent", amount: 12000, year: DEMO_YEAR, month: DEMO_MONTH },
  { id: "b2", name: "Bazar", amount: 8000, year: DEMO_YEAR, month: DEMO_MONTH },
  { id: "b3", name: "Utilities", amount: 2500, year: DEMO_YEAR, month: DEMO_MONTH },
];

const wishlistCategories = [
  { id: "tech", name: "Tech" },
  { id: "travel", name: "Travel" },
  { id: "home", name: "Home" },
  { id: "lifestyle", name: "Lifestyle" },
];

const wishlistPriorities = [
  { id: "high", name: "High", order: 1 },
  { id: "medium", name: "Medium", order: 2 },
  { id: "normal", name: "Normal", order: 3 },
  { id: "low", name: "Low", order: 4 },
  { id: "lowest", name: "Lowest", order: 5 },
];

const wishlistItems = [
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

const demo = {
  expenses: {
    items: expenses,
    expenseCategories,
    expenseTypes,
    budgetItems,
    budgetDebitByMonth: {},
  },
  wishlist: {
    items: wishlistItems,
    categories: wishlistCategories,
    priorities: wishlistPriorities,
  },
};

const outPath = path.join(__dirname, "..", "public", "demo.json");
fs.writeFileSync(outPath, JSON.stringify(demo, null, 2), "utf8");
console.log("Written to public/demo.json");
console.log("Expenses:", expenses.length, "| Wishlist:", wishlistItems.length);

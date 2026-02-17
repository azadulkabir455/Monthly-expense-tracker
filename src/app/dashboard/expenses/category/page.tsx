"use client";

import { motion } from "framer-motion";
import { ExpenseCategorySection } from "@/blocks/sections/ExpenseCategorySection";
import { ExpenseCategoryListSection } from "@/blocks/sections/ExpenseCategoryListSection";
import { ExpenseTypeSection } from "@/blocks/sections/ExpenseTypeSection";
import { ExpenseTypeListSection } from "@/blocks/sections/ExpenseTypeListSection";

export default function ExpensesCategoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      <ExpenseCategorySection />
      <ExpenseCategoryListSection />
      <ExpenseTypeSection />
      <ExpenseTypeListSection />
    </motion.div>
  );
}

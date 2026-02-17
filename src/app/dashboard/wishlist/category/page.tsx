"use client";

import { motion } from "framer-motion";
import { WishCategorySection } from "@/blocks/sections/WishCategorySection";
import { WishCategoryListSection } from "@/blocks/sections/WishCategoryListSection";
import { WishPrioritySection } from "@/blocks/sections/WishPrioritySection";
import { WishPriorityListSection } from "@/blocks/sections/WishPriorityListSection";

export default function WishCategoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      <WishCategorySection />
      <WishCategoryListSection />
      <WishPrioritySection />
      <WishPriorityListSection />
    </motion.div>
  );
}

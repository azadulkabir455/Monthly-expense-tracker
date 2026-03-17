"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { YearlyCategorySection } from "@/blocks/sections/YearlyCategorySection";
import { YearlyCategoryListSection } from "@/blocks/sections/YearlyCategoryListSection";
import { YearlyTypeSection } from "@/blocks/sections/YearlyTypeSection";
import { YearlyTypeListSection } from "@/blocks/sections/YearlyTypeListSection";

export default function YearlyCategoryPage() {
  const [typeFilterCategoryId, setTypeFilterCategoryId] = useState<string>("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      <YearlyCategorySection />
      <YearlyCategoryListSection />
      <YearlyTypeSection
        selectedCategoryId={typeFilterCategoryId}
        onCategoryChange={setTypeFilterCategoryId}
      />
      <YearlyTypeListSection selectedCategoryId={typeFilterCategoryId} />
    </motion.div>
  );
}

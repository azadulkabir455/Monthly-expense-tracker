"use client";

import { motion } from "framer-motion";
import { ColorThemeSection } from "@/blocks/sections/ColorThemeSection";

export default function CustomizationPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      <ColorThemeSection />
    </motion.div>
  );
}

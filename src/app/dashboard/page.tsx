"use client";

import { motion } from "framer-motion";
import { CategoryWiseSummarySection } from "@/blocks/sections/CategoryWiseSummarySection";
import { CreditDebitChartSection } from "@/blocks/sections/CreditDebitChartSection";
import { DashboardWishlistSection } from "@/blocks/sections/DashboardWishlistSection";
import {
  SectionCard,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { useThemeContext } from "@/context/ThemeContext";

export default function DashboardPage() {
  const { theme } = useThemeContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5"
    >
      {/* Title & subtitle - responsive */}
      <SectionCard>
        <SectionTitle className="text-xl sm:text-2xl">
          Dashboard
        </SectionTitle>
        <SectionSubtitle className="mt-1 sm:mt-1.5">
          Monthly and yearly expense summary
        </SectionSubtitle>
      </SectionCard>

      <CategoryWiseSummarySection />

      <CreditDebitChartSection />

      <DashboardWishlistSection />
    </motion.div>
  );
}

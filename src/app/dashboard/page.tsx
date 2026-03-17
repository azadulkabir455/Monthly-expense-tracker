"use client";

import { motion } from "framer-motion";
import { CategoryWiseSummarySection } from "@/blocks/sections/CategoryWiseSummarySection";
import { YearlyCategorySummarySection } from "@/blocks/sections/YearlyCategorySummarySection";
import { CreditDebitChartSection } from "@/blocks/sections/CreditDebitChartSection";
import { YearlyCreditDebitChartSection } from "@/blocks/sections/YearlyCreditDebitChartSection";
import { DashboardWishlistSection } from "@/blocks/sections/DashboardWishlistSection";
import {
  SectionCard,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const { t } = useLanguage();

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
          {t("dashboard_title")}
        </SectionTitle>
        <SectionSubtitle className="mt-1 sm:mt-1.5">
          {t("dashboard_subtitle")}
        </SectionSubtitle>
      </SectionCard>

      <CategoryWiseSummarySection />

      <YearlyCategorySummarySection />

      <CreditDebitChartSection />

      <YearlyCreditDebitChartSection />

      <DashboardWishlistSection />
    </motion.div>
  );
}

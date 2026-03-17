"use client";

import { useState } from "react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddExpenseCategoryModal } from "@/blocks/components/AddExpenseCategoryModal";
import { Button } from "@/blocks/elements/Button";
import { FolderPlus } from "lucide-react";
import { useYearlyCategories } from "@/lib/firebase/yearly";
import { useLanguage } from "@/context/LanguageContext";

export function YearlyCategorySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { addCategory } = useYearlyCategories();
  const { t } = useLanguage();

  const handleAdd = async (
    name: string,
    icon: string,
    gradientPreset: string,
    _yearlyCategoryId?: string | null
  ) => {
    await addCategory(name, icon, gradientPreset);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>{t("yearlyCategory_title")}</SectionTitle>
          <SectionSubtitle>
            {t("yearlyCategory_subtitle")}
          </SectionSubtitle>
        </div>
        <Button type="button" size="default" className="h-11 shrink-0" onClick={() => setAddModalOpen(true)}>
          <FolderPlus className="mr-1.5 h-4 w-4" />
          {t("yearlyCategory_addButton")}
        </Button>
      </SectionHeader>
      <AddExpenseCategoryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
        scope="yearly"
      />
    </SectionCard>
  );
}

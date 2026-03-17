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
import { useExpenseCategories } from "@/lib/firebase/expenses";
import { useLanguage } from "@/context/LanguageContext";

export function ExpenseCategorySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { addCategory } = useExpenseCategories();
  const { t } = useLanguage();

  const handleAdd = async (
    name: string,
    icon: string,
    gradientPreset: string,
    yearlyCategoryId?: string | null
  ) => {
    await addCategory(name, icon, gradientPreset, yearlyCategoryId);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>{t("monthlyCategory_title")}</SectionTitle>
          <SectionSubtitle>
            {t("monthlyCategory_subtitle")}
          </SectionSubtitle>
        </div>
        <Button type="button" size="default" className="h-11 shrink-0" onClick={() => setAddModalOpen(true)}>
          <FolderPlus className="mr-1.5 h-4 w-4" />
          {t("monthlyCategory_addButton")}
        </Button>
      </SectionHeader>
      <AddExpenseCategoryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
      />
    </SectionCard>
  );
}

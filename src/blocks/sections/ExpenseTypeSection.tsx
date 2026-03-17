"use client";

import { useState, useMemo } from "react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddExpenseTypeModal } from "@/blocks/components/AddExpenseTypeModal";
import { Button } from "@/blocks/elements/Button";
import { SelectDropdown, type SelectOption } from "@/blocks/components/shared/SelectDropdown";
import { useExpenseCategories } from "@/lib/firebase/expenses";
import { Tag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ExpenseTypeSectionProps {
  selectedCategoryId: string;
  onCategoryChange: (value: string) => void;
}

export function ExpenseTypeSection({
  selectedCategoryId,
  onCategoryChange,
}: ExpenseTypeSectionProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { categories } = useExpenseCategories();
  const { t } = useLanguage();
  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("monthlyCategory_typeFilterAll") },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories, t]
  );

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>{t("monthlyCategory_typeSectionTitle")}</SectionTitle>
          <SectionSubtitle>
            {t("monthlyCategory_typeSectionSubtitle")}
          </SectionSubtitle>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <SelectDropdown
            options={categoryOptions}
            value={selectedCategoryId}
            onChange={(v) => onCategoryChange(String(v))}
            label=""
            className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
          />
          <Button
            type="button"
            size="default"
            className="h-11 shrink-0"
            onClick={() => setAddModalOpen(true)}
          >
            <Tag className="mr-1.5 h-4 w-4" />
            {t("monthlyCategory_addExpenseType")}
          </Button>
        </div>
      </SectionHeader>
      <AddExpenseTypeModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </SectionCard>
  );
}

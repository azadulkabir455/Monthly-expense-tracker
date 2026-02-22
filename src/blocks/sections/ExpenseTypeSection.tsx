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
  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  );

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Expense Type</SectionTitle>
          <SectionSubtitle>
            e.g. Bazar, House Rent, Utilities — plain text types for entries.
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
            Add Expense Type
          </Button>
        </div>
      </SectionHeader>
      <AddExpenseTypeModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </SectionCard>
  );
}

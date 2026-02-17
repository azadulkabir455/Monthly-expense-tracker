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

export function ExpenseCategorySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Expense Category</SectionTitle>
          <SectionSubtitle>
            e.g. House, Business — add name, icon and preset gradient color.
          </SectionSubtitle>
        </div>
        <Button type="button" size="default" className="h-11 shrink-0" onClick={() => setAddModalOpen(true)}>
          <FolderPlus className="mr-1.5 h-4 w-4" />
          Add Expense Category
        </Button>
      </SectionHeader>
      <AddExpenseCategoryModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </SectionCard>
  );
}

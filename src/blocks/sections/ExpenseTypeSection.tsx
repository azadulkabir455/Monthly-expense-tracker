"use client";

import { useState } from "react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddExpenseTypeModal } from "@/blocks/components/AddExpenseTypeModal";
import { Button } from "@/blocks/elements/Button";
import { Tag } from "lucide-react";

export function ExpenseTypeSection() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Expense Type</SectionTitle>
          <SectionSubtitle>
            e.g. Bazar, House Rent, Utilities — plain text types for entries.
          </SectionSubtitle>
        </div>
        <Button type="button" size="default" className="h-11 shrink-0" onClick={() => setAddModalOpen(true)}>
          <Tag className="mr-1.5 h-4 w-4" />
          Add Expense Type
        </Button>
      </SectionHeader>
      <AddExpenseTypeModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </SectionCard>
  );
}

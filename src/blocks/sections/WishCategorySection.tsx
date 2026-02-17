"use client";

import { useState } from "react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddWishCategoryModal } from "@/blocks/components/AddWishCategoryModal";
import { Button } from "@/blocks/elements/Button";
import { FolderPlus } from "lucide-react";

export function WishCategorySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Add Wish Category</SectionTitle>
          <SectionSubtitle>
            Create a new category for your wish list with name and priority.
          </SectionSubtitle>
        </div>
        <Button
          type="button"
          size="default"
          className="h-11 shrink-0"
          onClick={() => setAddModalOpen(true)}
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          Add Wish Category
        </Button>
      </SectionHeader>

      <AddWishCategoryModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </SectionCard>
  );
}

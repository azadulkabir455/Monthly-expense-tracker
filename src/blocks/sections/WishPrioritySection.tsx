"use client";

import { useState } from "react";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddWishPriorityModal } from "@/blocks/components/AddWishPriorityModal";
import { Button } from "@/blocks/elements/Button";
import { Flag } from "lucide-react";
import { useWishlistTypes } from "@/lib/firebase/wishlist";

export function WishPrioritySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { addType } = useWishlistTypes();

  const handleAdd = async (name: string, order: number) => {
    await addType(name, order);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Add Priority Type</SectionTitle>
          <SectionSubtitle>
            Create priority types for your wish list (e.g. High, Medium, Low). Lower order = higher priority.
          </SectionSubtitle>
        </div>
        <Button
          type="button"
          size="default"
          className="h-11 shrink-0"
          onClick={() => setAddModalOpen(true)}
        >
          <Flag className="mr-1.5 h-4 w-4" />
          Add Priority Type
        </Button>
      </SectionHeader>

      <AddWishPriorityModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
      />
    </SectionCard>
  );
}

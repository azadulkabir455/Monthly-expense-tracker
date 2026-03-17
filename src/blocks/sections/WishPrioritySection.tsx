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
import { useLanguage } from "@/context/LanguageContext";

export function WishPrioritySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { addType } = useWishlistTypes();
  const { t } = useLanguage();

  const handleAdd = async (name: string, order: number) => {
    await addType(name, order);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>{t("wishlist_addPriorityType")}</SectionTitle>
          <SectionSubtitle>
            {t("wishlist_addPrioritySubtitle")}
          </SectionSubtitle>
        </div>
        <Button
          type="button"
          size="default"
          className="h-11 shrink-0"
          onClick={() => setAddModalOpen(true)}
        >
          <Flag className="mr-1.5 h-4 w-4" />
          {t("wishlist_addPriorityType")}
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

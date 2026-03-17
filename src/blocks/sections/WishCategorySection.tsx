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
import { useWishlistCategories } from "@/lib/firebase/wishlist";
import { useLanguage } from "@/context/LanguageContext";

export function WishCategorySection() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { addCategory } = useWishlistCategories();
  const { t } = useLanguage();

  const handleAdd = async (name: string) => {
    await addCategory(name);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>{t("wishlist_addCategory")}</SectionTitle>
          <SectionSubtitle>
            {t("wishlist_categorySubtitle")}
          </SectionSubtitle>
        </div>
        <Button
          type="button"
          size="default"
          className="h-11 shrink-0"
          onClick={() => setAddModalOpen(true)}
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          {t("wishlist_addCategory")}
        </Button>
      </SectionHeader>

      <AddWishCategoryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
      />
    </SectionCard>
  );
}

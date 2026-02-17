"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectWishCategories, removeCategory } from "@/store/slices/wishlistSlice";
import type { WishCategory } from "@/types/wishlist";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { FolderOpen, Pencil, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { EditWishCategoryModal } from "@/blocks/components/EditWishCategoryModal";
import { ConfirmModal } from "@/blocks/components/ConfirmModal";

export function WishCategoryListSection() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const categories = useAppSelector(selectWishCategories);
  const [editingCategory, setEditingCategory] = useState<WishCategory | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WishCategory | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wish-cat-action-menu]")) setOpenActionId(null);
    }
    if (openActionId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionId]);

  const handleEdit = (cat: WishCategory) => {
    setEditingCategory(cat);
    setEditModalOpen(true);
  };

  const handleDelete = (cat: WishCategory) => {
    setDeleteTarget(cat);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatch(removeCategory(deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Category List</SectionTitle>
          <SectionSubtitle>
            All categories for your wish list.
          </SectionSubtitle>
        </div>
      </SectionHeader>

      <ul className="space-y-2 sm:space-y-3 overflow-visible">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className={cn(
              "relative flex items-center gap-3 rounded-xl border px-4 py-3 overflow-visible",
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-100 bg-slate-50/60"
            )}
          >
            <FolderOpen
              className={cn(
                "h-5 w-5 shrink-0",
                isDark ? "text-violet-400" : "text-violet-600"
              )}
            />
            <span
              className={cn(
                "flex-1 font-medium",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {cat.name}
            </span>
            <div data-wish-cat-action-menu className="relative flex shrink-0 items-center gap-1">
              {/* Mobile: 3 dots dropdown */}
              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpenActionId(openActionId === cat.id ? null : cat.id)}
                  className={cn(
                    "rounded-lg p-2 transition",
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  )}
                  aria-label="Actions"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {openActionId === cat.id && (
                  <div
                    className={cn(
                      "absolute right-0 top-full z-[100] mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg",
                      isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleEdit(cat);
                        setOpenActionId(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                        isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(cat);
                        setOpenActionId(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                        isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {/* Desktop: edit + delete buttons */}
              <div className="hidden sm:flex sm:items-center sm:gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(cat)}
                  className={cn(
                    "rounded-lg p-2 transition",
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  )}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className={cn(
                    "rounded-lg p-2 transition",
                    isDark ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400" : "text-slate-500 hover:bg-red-100 hover:text-red-600"
                  )}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {categories.length === 0 && (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No categories yet. Add one above to get started!
        </p>
      )}

      <EditWishCategoryModal
        category={editingCategory}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCategory(null);
        }}
      />
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? Wish items in this category will have their category cleared.` : ""}
        confirmLabel="Sure"
        cancelLabel="Cancel"
      />
    </SectionCard>
  );
}

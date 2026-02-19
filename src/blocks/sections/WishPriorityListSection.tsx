"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectWishPriorities, removePriority } from "@/store/slices/wishlistSlice";
import type { WishPriorityType } from "@/types/wishlist";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { Flag, Pencil, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { EditWishPriorityModal } from "@/blocks/components/EditWishPriorityModal";
import { ConfirmModal } from "@/blocks/components/shared/ConfirmModal";

export function WishPriorityListSection() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const priorities = useAppSelector(selectWishPriorities);
  const [editingPriority, setEditingPriority] = useState<WishPriorityType | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WishPriorityType | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wish-priority-action-menu]")) setOpenActionId(null);
    }
    if (openActionId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionId]);

  const handleEdit = (p: WishPriorityType) => {
    setEditingPriority(p);
    setEditModalOpen(true);
  };

  const handleDelete = (p: WishPriorityType) => {
    if (priorities.length <= 1) {
      setDeleteTarget(p);
      setConfirmModalOpen(true);
      return;
    }
    setDeleteTarget(p);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (priorities.length <= 1) {
      setDeleteTarget(null);
      return;
    }
    dispatch(removePriority(deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Priority List</SectionTitle>
          <SectionSubtitle>
            All priority types. Lower order = higher priority (shown first).
          </SectionSubtitle>
        </div>
      </SectionHeader>

      <ul className="space-y-2 sm:space-y-3">
        {priorities.map((p) => (
          <li
            key={p.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-100 bg-slate-50/60"
            )}
          >
            <Flag
              className={cn(
                "h-5 w-5 shrink-0",
                isDark ? "text-amber-400" : "text-amber-600"
              )}
            />
            <span
              className={cn(
                "flex-1 font-medium",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {p.name}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                isDark
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-white/10"
                  : "bg-amber-100 text-amber-800 ring-1 ring-amber-200/60"
              )}
            >
              Order {p.order}
            </span>
            <div data-wish-priority-action-menu className="relative flex shrink-0 items-center gap-1">
              {/* Mobile: 3 dots dropdown */}
              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpenActionId(openActionId === p.id ? null : p.id)}
                  className={cn(
                    "rounded-lg p-2 transition",
                    isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  )}
                  aria-label="Actions"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {openActionId === p.id && (
                  <div
                    className={cn(
                      "absolute right-0 top-full z-[100] mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg",
                      isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleEdit(p);
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
                        handleDelete(p);
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
                  onClick={() => handleEdit(p)}
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
                  onClick={() => handleDelete(p)}
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

      {priorities.length === 0 && (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          No priority types yet. Add one above to get started!
        </p>
      )}

      <EditWishPriorityModal
        priority={editingPriority}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPriority(null);
        }}
      />
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget && priorities.length <= 1 ? "Cannot Delete" : "Delete Priority"}
        message={
          deleteTarget && priorities.length <= 1
            ? "You must have at least one priority type."
            : deleteTarget
              ? `Delete "${deleteTarget.name}"? Wish items with this priority will be reassigned to another.`
              : ""
        }
        confirmLabel={priorities.length <= 1 ? "OK" : "Sure"}
        cancelLabel={priorities.length <= 1 ? null : "Cancel"}
        variant={priorities.length <= 1 ? "default" : "danger"}
      />
    </SectionCard>
  );
}

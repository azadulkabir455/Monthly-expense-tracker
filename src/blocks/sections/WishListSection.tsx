"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectAllWishItems, selectWishCategories, selectWishPriorities, removeWish, removeWishes } from "@/store/slices/wishlistSlice";
import type { WishItem } from "@/types/wishlist";
import {
  Gift,
  Pencil,
  Trash2,
  Search,
  PlusCircle,
  Filter,
  X,
  MoreVertical,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { AddWishModal } from "@/blocks/components/AddWishModal";
import { EditWishModal } from "@/blocks/components/EditWishModal";
import { ConfirmModal } from "@/blocks/components/ConfirmModal";
import { Button } from "@/blocks/elements/Button";
import { Input } from "@/blocks/elements/Input";
import { Checkbox } from "@/blocks/elements/Checkbox";
import { SelectDropdown, type SelectOption } from "@/blocks/components/SelectDropdown";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";

const PAGE_SIZE = 10;

const CATEGORY_ALL: SelectOption = { value: "", label: "All Categories" };
const PRIORITY_ALL: SelectOption = { value: "", label: "All Priorities" };

export function WishListSection() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectWishCategories);
  const priorities = useAppSelector(selectWishPriorities);
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const allWishes = useAppSelector(selectAllWishItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterPriorityId, setFilterPriorityId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<
    { type: "bulk"; count: number } | { type: "single"; item: WishItem } | null
  >(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    if (filterModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [filterModalOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wish-action-menu]")) setOpenActionId(null);
    }
    if (openActionId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionId]);

  const categoryOptions: SelectOption[] = [
    CATEGORY_ALL,
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const priorityOptions: SelectOption[] = [
    PRIORITY_ALL,
    ...priorities.map((p) => ({ value: p.id, label: p.name })),
  ];

  const filteredWishes = allWishes.filter((w) => {
    if (searchQuery.trim() && !w.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (filterCategoryId && w.categoryId !== filterCategoryId) return false;
    if (filterPriorityId && w.priorityId !== filterPriorityId) return false;
    return true;
  });

  const visibleWishes = filteredWishes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredWishes.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredWishes.length));
  }, [filteredWishes.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleWishes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleWishes.map((w) => w.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmState({ type: "bulk", count: selectedIds.size });
    setConfirmModalOpen(true);
  };

  const handleEdit = (item: WishItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: WishItem) => {
    setConfirmState({ type: "single", item });
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!confirmState) return;
    if (confirmState.type === "bulk") {
      dispatch(removeWishes(Array.from(selectedIds)));
      setSelectedIds(new Set());
    } else {
      dispatch(removeWish(confirmState.item.id));
    }
    setConfirmState(null);
  };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) loadMore();
        },
        { rootMargin: "100px", threshold: 0.1 }
      );
      if (node) observerRef.current.observe(node);
    },
    [hasMore, loadMore]
  );

  const filterContent = (
    <>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2",
            isDark ? "text-slate-400" : "text-slate-500"
          )}
        />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className={cn(
            "w-full pl-10",
            isDark ? "border-white/10 bg-white/5 text-white placeholder:text-slate-400" : ""
          )}
        />
      </div>
      <SelectDropdown
        options={categoryOptions}
        value={filterCategoryId}
        onChange={(v) => {
          setFilterCategoryId(String(v));
          setVisibleCount(PAGE_SIZE);
        }}
        label=""
        className="w-full"
      />
      <SelectDropdown
        options={priorityOptions}
        value={filterPriorityId}
        onChange={(v) => {
          setFilterPriorityId(String(v));
          setVisibleCount(PAGE_SIZE);
        }}
        label=""
        className="w-full"
      />
    </>
  );

  const filterModal =
    typeof document !== "undefined" &&
    filterModalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[10%] px-4 pb-4 sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-filter-modal-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
          onClick={() => setFilterModalOpen(false)}
          role="presentation"
          aria-hidden
        />
        <div
          className={cn(
            "relative z-10 flex w-full max-w-sm flex-col rounded-2xl shadow-float",
            isDark ? "border border-white/10 bg-violet-950/95" : "border border-[#ddd] bg-white"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ddd] dark:border-white/10">
            <span id="wishlist-filter-modal-title" className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>Filters</span>
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className={cn(
                "rounded-xl p-2 transition",
                isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col gap-3 p-4 overflow-hidden">
            {filterContent}
          </div>
          <div className="border-t border-[#ddd] p-4 dark:border-white/10">
            <button
              type="button"
              onClick={() => setFilterModalOpen(false)}
              className={cn(
                "w-full rounded-xl py-2.5 text-sm font-semibold transition",
                isDark
                  ? "bg-violet-500 text-white hover:bg-violet-600"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              )}
            >
              OK
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <SectionCard>
      {filterModal}
      <SectionHeader className="flex flex-col gap-4">
        {/* Row 1: desktop - flex space-between: title left, filters+Add right */}
        <div className="flex w-full flex-row flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 shrink-0">
            <SectionTitle>Wish List</SectionTitle>
            <SectionSubtitle>
              {allWishes.length} item{allWishes.length !== 1 ? "s" : ""} — search, bulk delete, edit
            </SectionSubtitle>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            {/* Mobile: filter icon */}
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition sm:hidden",
                isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-[#ddd] bg-slate-50 hover:bg-slate-100"
              )}
              aria-label="Open filters"
            >
              <Filter className={cn("h-5 w-5", isDark ? "text-slate-400" : "text-slate-600")} />
            </button>
            {/* Desktop: search, category, priority + Add Wish - title er right side */}
            <div className="hidden sm:flex sm:flex-row sm:items-end sm:gap-3">
              <div className="relative min-w-[140px]">
                <Search
                  className={cn(
                    "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}
                />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "w-full pl-10",
                    isDark ? "border-white/10 bg-white/5 text-white placeholder:text-slate-400" : ""
                  )}
                />
              </div>
              <SelectDropdown
                options={categoryOptions}
                value={filterCategoryId}
                onChange={(v) => {
                  setFilterCategoryId(String(v));
                  setVisibleCount(PAGE_SIZE);
                }}
                label=""
                className="min-w-[130px]"
              />
              <SelectDropdown
                options={priorityOptions}
                value={filterPriorityId}
                onChange={(v) => {
                  setFilterPriorityId(String(v));
                  setVisibleCount(PAGE_SIZE);
                }}
                label=""
                className="min-w-[130px]"
              />
              <Button
                type="button"
                size="default"
                className="h-11 shrink-0 px-4"
                onClick={() => setAddModalOpen(true)}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Add Wish
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile: Add Wish - niche full width */}
        <Button
          type="button"
          size="default"
          className="h-11 w-full px-4 sm:hidden"
          onClick={() => setAddModalOpen(true)}
        >
          <PlusCircle className="mr-1.5 h-4 w-4" />
          Add Wish
        </Button>
      </SectionHeader>

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-xl border px-4 py-2",
            isDark ? "border-white/10 bg-white/5" : "border-[#ddd] bg-slate-50"
          )}
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={selectedIds.size === visibleWishes.length && visibleWishes.length > 0}
              onCheckedChange={(checked) =>
                setSelectedIds(checked ? new Set(visibleWishes.map((w) => w.id)) : new Set())
              }
            />
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>
              Select all visible
            </span>
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete {selectedIds.size} selected
          </Button>
        </div>
      )}

      <ul className="space-y-2 sm:space-y-3">
        {visibleWishes.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition sm:gap-4 sm:px-4 sm:py-3",
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-slate-100 bg-slate-50/60 hover:bg-slate-50",
                isSelected && (isDark ? "ring-2 ring-violet-500/50" : "ring-2 ring-violet-400/50")
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(item.id)}
                aria-label={`Select ${item.name}`}
              />
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
                  isDark ? "bg-white/10 text-violet-300" : "bg-violet-100 text-violet-600"
                )}
              >
                <DynamicIcon
                  name={item.iconType}
                  fallback={Gift}
                  className="h-5 w-5 sm:h-5 sm:w-5"
                  strokeWidth={2}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate font-semibold",
                    isDark ? "text-white" : "text-slate-800"
                  )}
                >
                  {item.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                      isDark
                        ? "bg-amber-500/20 text-amber-300 ring-1 ring-white/10"
                        : "bg-amber-100 text-amber-800 ring-1 ring-amber-200/60"
                    )}
                  >
                    {priorities.find((p) => p.id === item.priorityId)?.name ?? item.priorityId}
                  </span>
                  {item.categoryId && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        isDark
                          ? "bg-violet-500/25 text-violet-300 ring-1 ring-white/10"
                          : "bg-violet-100 text-violet-700 ring-1 ring-violet-200/60"
                      )}
                    >
                      {categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold sm:text-base",
                  isDark ? "text-violet-300" : "text-violet-600"
                )}
              >
                {formatMoneyK(item.approximateAmount)}
              </span>
              <div data-wish-action-menu className="relative flex shrink-0 items-center gap-1">
                {/* Mobile: 3 dots dropdown */}
                <div className="sm:hidden">
                  <button
                    type="button"
                    onClick={() => setOpenActionId(openActionId === item.id ? null : item.id)}
                    className={cn(
                      "rounded-lg p-2 transition",
                      isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    )}
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openActionId === item.id && (
                    <div
                      className={cn(
                        "absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-xl border py-1 shadow-lg",
                        isDark ? "border-white/10 bg-violet-950/95" : "border-[#ddd] bg-white"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleEdit(item);
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
                          handleDelete(item);
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
                    onClick={() => handleEdit(item)}
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
                    onClick={() => handleDelete(item)}
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
          );
        })}
      </ul>

      {visibleWishes.length === 0 && (
        <p className={cn("py-8 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
          {searchQuery.trim() || filterCategoryId || filterPriorityId
            ? "No results for your filters."
            : "No wish items yet. Add one!"}
        </p>
      )}

      {hasMore && visibleWishes.length > 0 && (
        <div ref={loadMoreCallbackRef} className="flex h-12 items-center justify-center py-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Loading more...</span>
        </div>
      )}

      <EditWishModal item={editingItem} open={editModalOpen} onClose={handleCloseEditModal} />
      <AddWishModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmState(null);
        }}
        onConfirm={handleConfirmDelete}
        title={confirmState?.type === "bulk" ? "Delete Items" : "Delete Wish"}
        message={
          confirmState?.type === "bulk"
            ? `Delete ${confirmState.count} item(s)?`
            : confirmState?.type === "single"
              ? `Delete "${confirmState.item.name}"?`
              : ""
        }
        confirmLabel="Sure"
        cancelLabel="Cancel"
      />
    </SectionCard>
  );
}

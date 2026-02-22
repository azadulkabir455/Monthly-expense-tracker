"use client";

import Link from "next/link";
import { useWishlistTypes, useWishlistItems } from "@/lib/firebase/wishlist";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { buttonVariants } from "@/blocks/elements/Button";
import { Gift, ChevronRight } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { formatMoneyK } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/context/ThemeContext";
import { Skeleton } from "@/blocks/elements/Skeleton";

const WISHLIST_LIMIT = 5;

export function DashboardWishlistSection() {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const { types: priorities } = useWishlistTypes();
  const priorityOrder = priorities.map((p) => ({ id: p.id, order: p.order }));
  const { items: allWishes, loading } = useWishlistItems(priorityOrder);
  const topWishes = allWishes.slice(0, WISHLIST_LIMIT);

  return (
    <SectionCard>
      <SectionHeader className="flex-row items-center justify-between gap-4 sm:flex-wrap">
        <div>
          <SectionTitle>Wish List</SectionTitle>
          <SectionSubtitle>Top {WISHLIST_LIMIT} items by priority</SectionSubtitle>
        </div>
        <Link
          href="/dashboard/wishlist"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5 shrink-0")}
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </SectionHeader>
      {loading ? (
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3",
                isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/60"
              )}
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="space-y-2">
            {topWishes.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/60"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-500">
                  <DynamicIcon name={item.iconType} fallback={Gift} className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <span className={cn("font-medium block truncate", isDark ? "text-white" : "text-slate-800")}>
                    {item.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatMoneyK(item.approximateAmount)} ৳
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {topWishes.length === 0 && (
            <p className={cn("py-6 text-center text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              No wish items yet. Add one from the Wishlist page.
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}

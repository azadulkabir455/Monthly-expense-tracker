"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Wallet,
  Heart,
  FileText,
  PiggyBank,
  MoreHorizontal,
  FolderOpen,
  Tag,
  X,
  ChevronDown,
  Receipt,
  Home,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/blocks/components/ThemeToggle";
import { useThemeContext } from "@/context/ThemeContext";

type NavLink = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = {
  label: string;
  icon: typeof Heart | typeof Receipt;
  groupKey: "wishlist" | "expenses";
  children: { href: string; label: string; icon: typeof FileText }[];
};

const nav: (NavLink | NavGroup)[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Wishlist",
    icon: Heart,
    groupKey: "wishlist",
    children: [
      { href: "/dashboard/wishlist", label: "Wishlist", icon: FileText },
      { href: "/dashboard/wishlist/category", label: "Wish Category", icon: FolderOpen },
    ],
  },
  {
    label: "Expenses",
    icon: Receipt,
    groupKey: "expenses",
    children: [
      { href: "/dashboard/expenses/entries", label: "Expenses Entries", icon: FileText },
      { href: "/dashboard/expenses/category", label: "Expenses Category", icon: Tag },
      { href: "/dashboard/expenses/budget", label: "Monthly Budget", icon: PiggyBank },
    ],
  },
  { href: "/dashboard/customization", label: "Customization", icon: SlidersHorizontal },
];

const mobileTabs = [
  { href: "/dashboard/expenses/budget", label: "Budget", icon: PiggyBank },
  { href: "/dashboard/expenses/entries", label: "Expenses", icon: FileText },
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "#more", label: "More", icon: MoreHorizontal, isMore: true },
];

const moreLinks = [
  { href: "/dashboard/wishlist/category", label: "Wish Category", icon: FolderOpen },
  { href: "/dashboard/expenses/category", label: "Expenses Category", icon: Tag },
  { href: "/dashboard/customization", label: "Customization", icon: SlidersHorizontal },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useThemeContext();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const isWishlistActive = pathname.startsWith("/dashboard/wishlist");
  const isExpensesActive = pathname.startsWith("/dashboard/expenses");
  const [wishListOpen, setWishListOpen] = useState(isWishlistActive);
  const [expensesOpen, setExpensesOpen] = useState(isExpensesActive);

  useEffect(() => {
    if (isWishlistActive) setWishListOpen(true);
  }, [isWishlistActive]);

  useEffect(() => {
    if (isExpensesActive) setExpensesOpen(true);
  }, [isExpensesActive]);

  useEffect(() => {
    setMoreSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (moreSheetOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [moreSheetOpen]);

  const isDark = theme === "dark";

  const isTabActive = (href: string, isMore?: boolean) => {
    if (isMore) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="dashboard-bg min-h-screen overflow-x-hidden">
      {/* Mobile More bottom sheet */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          moreSheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!moreSheetOpen}
        onClick={() => setMoreSheetOpen(false)}
      />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out lg:hidden safe-area-bottom",
          moreSheetOpen ? "translate-y-0" : "translate-y-full",
          isDark ? "bg-violet-950/95 border-t border-white/10" : "bg-white border-t border-[#ddd]",
          "shadow-float backdrop-blur-xl"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ddd] dark:border-white/10">
          <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>More</span>
          <button
            type="button"
            onClick={() => setMoreSheetOpen(false)}
            className={cn("rounded-xl p-2 transition", isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMoreSheetOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isDark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          ))}
          <div className={cn("my-2 border-t", isDark ? "border-white/10" : "border-[#ddd]")} />
          <Link
            href="/login"
            onClick={() => setMoreSheetOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-full w-56 flex-col transition-colors duration-300 lg:flex",
          isDark ? "border-r border-white/10 bg-violet-950/20 shadow-elevated backdrop-blur-xl" : "border-r border-[#ddd] bg-white shadow-elevated"
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b px-4", isDark ? "border-white/10" : "border-[#ddd]")}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Wallet className="h-5 w-5 text-white" />
          </span>
          <span className={cn("font-bold", isDark ? "text-white" : "text-slate-800")}>Expense Tracker</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) =>
            "href" in item ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  pathname === item.href
                    ? isDark ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm" : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-700 shadow-sm"
                    : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            ) : (
              (() => {
                const grp = item as NavGroup;
                const isOpen = grp.groupKey === "wishlist" ? wishListOpen : expensesOpen;
                const setIsOpen = grp.groupKey === "wishlist" ? setWishListOpen : setExpensesOpen;
                const isActive = grp.groupKey === "wishlist" ? isWishlistActive : isExpensesActive;
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? isDark ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm" : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-700 shadow-sm"
                          : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </div>
                      <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="mt-1 space-y-0.5">
                        {item.children.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 pl-6 text-sm font-medium transition",
                              pathname === sub.href
                                ? isDark ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm" : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-700 shadow-sm"
                                : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                            )}
                          >
                            <sub.icon className="h-5 w-5 shrink-0" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            )
          )}
        </nav>
        <div className={cn("border-t p-3", isDark ? "border-white/10" : "border-[#ddd]")}>
          <Link
            href="/login"
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900")}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between px-3 transition-colors duration-300 safe-area-top sm:h-14 sm:px-4 lg:h-16 lg:px-6",
          isDark ? "border-b border-white/10 bg-violet-950/20 shadow-elevated backdrop-blur-xl" : "border-b border-[#ddd] bg-white shadow-elevated"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 lg:hidden">
            <Wallet className="h-4 w-4 text-white" />
          </span>
          <span className={cn("font-semibold truncate text-sm sm:text-base", isDark ? "text-white" : "text-slate-800")}>
            Expense Tracker
          </span>
        </div>
        <div className="flex shrink-0">
          <ThemeToggle className="relative" />
        </div>
      </header>

      {/* Main content */}
      <main
        className={cn(
          "relative overflow-x-hidden pt-3 pb-24 sm:pt-4 sm:pb-5 lg:pl-56 lg:pb-0",
          "min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]"
        )}
      >
        <div className="min-w-0 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4">{children}</div>
      </main>

      {/* Mobile bottom tab bar - floating pill style */}
      <nav
        className={cn(
          "fixed bottom-4 left-4 right-4 z-30 flex items-center justify-around rounded-2xl safe-area-bottom lg:hidden",
          "h-14 min-h-[56px] px-2",
          isDark
            ? "bg-violet-950/95 border border-white/10 shadow-float backdrop-blur-xl"
            : "bg-white border border-[#ddd] shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
        )}
      >
        {mobileTabs.map((tab) => {
          if (tab.isMore) {
            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreSheetOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 transition active:scale-95",
                  isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                )}
                aria-label="More"
              >
                <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                <span className="text-[10px] font-medium truncate w-full text-center">More</span>
              </button>
            );
          }
          const active = isTabActive(tab.href);
          const isHome = tab.href === "/dashboard";
          if (isHome) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 items-center justify-center min-w-0 py-1"
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg transition active:scale-95",
                    "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                  )}
                >
                  <Home className="h-6 w-6" strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 transition active:scale-95",
                active
                  ? isDark ? "text-violet-400" : "text-violet-600"
                  : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.5} />
              <span className={cn("text-[10px] font-medium truncate w-full text-center", active && "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

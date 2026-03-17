"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/firebase/auth";
import {
  LayoutDashboard,
  LogOut,
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
  Calendar,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/blocks/components/shared/ThemeToggle";
import { LanguageToggle } from "@/blocks/components/shared/LanguageToggle";
import { useThemeContext } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

type NavLink = { href: string; labelKey: string; icon: typeof LayoutDashboard };
type NavGroup = {
  labelKey: string;
  icon: typeof Heart | typeof Receipt | typeof Calendar;
  groupKey: "wishlist" | "expenses" | "yearly";
  children: { href: string; labelKey: string; icon: typeof FileText }[];
};

const nav: (NavLink | NavGroup)[] = [
  { href: "/dashboard", labelKey: "nav_dashboard", icon: LayoutDashboard },
  {
    labelKey: "nav_wishlist",
    icon: Heart,
    groupKey: "wishlist",
    children: [
      { href: "/dashboard/wishlist", labelKey: "nav_wishlist", icon: FileText },
      { href: "/dashboard/wishlist/category", labelKey: "nav_wishCategory", icon: FolderOpen },
    ],
  },
  {
    labelKey: "nav_monthlyExpense",
    icon: Receipt,
    groupKey: "expenses",
    children: [
      { href: "/dashboard/expenses/entries", labelKey: "nav_monthlyEntries", icon: ClipboardList },
      { href: "/dashboard/expenses/category", labelKey: "nav_monthlyCategory", icon: Tag },
      { href: "/dashboard/expenses/budget", labelKey: "nav_monthlyBudget", icon: PiggyBank },
    ],
  },
  {
    labelKey: "nav_yearlyExpense",
    icon: Calendar,
    groupKey: "yearly",
    children: [
      { href: "/dashboard/yearly/entries", labelKey: "nav_yearlyEntries", icon: CalendarDays },
      { href: "/dashboard/yearly/category", labelKey: "nav_yearlyCategory", icon: Tag },
      { href: "/dashboard/yearly/budget", labelKey: "nav_yearlyBudget", icon: PiggyBank },
    ],
  },
  { href: "/dashboard/customization", labelKey: "nav_customization", icon: SlidersHorizontal },
];

const mobileTabs = [
  // Left: Wishlist
  { href: "/dashboard/wishlist", labelKey: "nav_wishlist", icon: Heart },
  // Left-center: Yearly Entries
  { href: "/dashboard/yearly/entries", labelKey: "nav_yearlyEntries", icon: CalendarDays },
  // Center: Home
  { href: "/dashboard", labelKey: "nav_home", icon: Home },
  // Right-center: Monthly Entries
  { href: "/dashboard/expenses/entries", labelKey: "nav_monthlyEntries", icon: ClipboardList },
  // Right: More
  { href: "#more", labelKey: "nav_more", icon: MoreHorizontal, isMore: true },
];

const moreLinks = [
  { href: "/dashboard/wishlist/category", labelKey: "nav_wishCategory", icon: FolderOpen },
  { href: "/dashboard/expenses/budget", labelKey: "nav_monthlyBudget", icon: PiggyBank },
  { href: "/dashboard/expenses/category", labelKey: "nav_monthlyCategory", icon: Tag },
  { href: "/dashboard/yearly/category", labelKey: "nav_yearlyCategory", icon: Tag },
  { href: "/dashboard/yearly/budget", labelKey: "nav_yearlyBudget", icon: PiggyBank },
  { href: "/dashboard/customization", labelKey: "nav_customization", icon: SlidersHorizontal },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useThemeContext();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const isWishlistActive = pathname.startsWith("/dashboard/wishlist");
  const isExpensesActive = pathname.startsWith("/dashboard/expenses");
  const isYearlyActive = pathname.startsWith("/dashboard/yearly");
  const [wishListOpen, setWishListOpen] = useState(isWishlistActive);
  const [expensesOpen, setExpensesOpen] = useState(isExpensesActive);
  const [yearlyOpen, setYearlyOpen] = useState(isYearlyActive);

  useEffect(() => {
    if (isWishlistActive) setWishListOpen(true);
  }, [isWishlistActive]);

  useEffect(() => {
    if (isExpensesActive) setExpensesOpen(true);
  }, [isExpensesActive]);

  useEffect(() => {
    if (isYearlyActive) setYearlyOpen(true);
  }, [isYearlyActive]);

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
          <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>{t("nav_more")}</span>
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
              {t(link.labelKey)}
            </Link>
          ))}
          <div className={cn("my-2 border-t", isDark ? "border-white/10" : "border-[#ddd]")} />
          <button
            type="button"
            onClick={() => {
              setMoreSheetOpen(false);
              void handleLogout();
            }}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-full w-56 flex-col transition-colors duration-300 lg:flex",
          isDark ? "border-r border-white/10 bg-violet-950/20 shadow-elevated backdrop-blur-xl" : "border-r border-[#ddd] bg-white shadow-elevated"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-center border-b px-4",
            isDark ? "border-white/10" : "border-[#ddd] bg-[#57595B]"
          )}
        >
          <div
            className={cn(
              "relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-xl px-2",
              "bg-transparent"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maserhisab.png" alt="মাসের হিসাব" className="h-9 w-auto object-contain" />
          </div>
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
                    ? isDark
                      ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm"
                      : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-slate-900 shadow-sm"
                    : isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            ) : (
              (() => {
                const grp = item as NavGroup;
                const isOpen = grp.groupKey === "wishlist" ? wishListOpen : grp.groupKey === "yearly" ? yearlyOpen : expensesOpen;
                const setIsOpen = grp.groupKey === "wishlist" ? setWishListOpen : grp.groupKey === "yearly" ? setYearlyOpen : setExpensesOpen;
                const isActive = grp.groupKey === "wishlist" ? isWishlistActive : grp.groupKey === "yearly" ? isYearlyActive : isExpensesActive;
                return (
                  <div key={grp.labelKey} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? isDark
                            ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm"
                            : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-slate-900 shadow-sm"
                          : isDark
                            ? "text-slate-400 hover:bg-white/5 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {t(grp.labelKey)}
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
                                ? isDark
                                  ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 text-white shadow-sm"
                                  : "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-slate-900 shadow-sm"
                                : isDark
                                  ? "text-slate-400 hover:bg-white/5 hover:text-white"
                                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                            )}
                          >
                            <sub.icon className="h-5 w-5 shrink-0" />
                            {t(sub.labelKey)}
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
          <button
            type="button"
            onClick={() => void handleLogout()}
            className={cn("flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900")}
          >
            <LogOut className="h-5 w-5" />
            {t("nav_logout")}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between px-3 transition-colors duration-300 safe-area-top sm:h-14 sm:px-4 lg:h-16 lg:px-6",
          isDark ? "border-b border-white/10 bg-violet-950/20 shadow-elevated backdrop-blur-xl" : "border-b border-[#ddd] bg-white shadow-elevated"
        )}
      >
        <div className="flex items-center min-w-0">
          <span className="relative flex h-9 shrink-0 items-center justify-center overflow-hidden lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maserhisab.png" alt="মাসের হিসাব" className="h-9 w-auto object-contain" />
          </span>
          <span className="relative hidden h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maserhisab.png" alt="মাসের হিসাব" className="h-9 w-auto object-contain" />
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle className="relative" />
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
        <div className="min-w-0 px-3 py-2 pb-24 sm:px-4 sm:py-3 sm:pb-24 md:px-5 md:py-4 md:pb-24">
          {children}
        </div>
        <footer
          className={cn(
            "pointer-events-none fixed bottom-3 left-0 right-0 z-20 flex justify-center",
            "sm:bottom-4"
          )}
        >
          <div
            className={cn(
              "pointer-events-auto rounded-full px-3.5 py-1.5 text-xs shadow-sm flex items-center gap-1.5",
              isDark ? "bg-slate-900/90 text-slate-300" : "bg-slate-300/95 text-slate-800"
            )}
          >
            <span>© 2026 • Made with love by</span>
            <a
              href="https://www.linkedin.com/in/azadulkabir/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-semibold underline underline-offset-2",
                isDark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900"
              )}
            >
              Azad Ul Kabir
            </a>
            <span>💙</span>
          </div>
        </footer>
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
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

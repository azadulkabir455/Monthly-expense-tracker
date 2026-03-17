import type { Metadata } from "next";
import { DashboardLayout } from "@/blocks/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your monthly and yearly spending. Category summaries, profit & loss charts, and wishlist.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

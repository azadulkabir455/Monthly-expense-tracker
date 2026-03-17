import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Entries",
  description:
    "Add and manage your day-to-day expenses by month. Pick a category, see totals, and export to Excel when you need.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

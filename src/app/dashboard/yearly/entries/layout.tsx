import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yearly Entries",
  description:
    "See all expenses for the year by month. Click a month to view or edit day-wise entries.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

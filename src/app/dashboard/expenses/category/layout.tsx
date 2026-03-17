import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Categories",
  description:
    "Group your expenses (e.g. House, Groceries, Health). Add categories and types for detailed tracking.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

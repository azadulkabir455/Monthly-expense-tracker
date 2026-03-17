import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Things you want to buy or do. Search, filter by category or priority, and mark as done when achieved.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

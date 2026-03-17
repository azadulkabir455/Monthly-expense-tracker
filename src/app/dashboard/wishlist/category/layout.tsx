import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wish Categories",
  description:
    "Organize your wishes into categories. Add, edit, or delete categories and set priorities.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

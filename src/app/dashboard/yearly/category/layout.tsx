import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yearly Categories",
  description:
    "Categories for full-year tracking (e.g. Rent, Insurance). Link monthly categories for a combined view.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

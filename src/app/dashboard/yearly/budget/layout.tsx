import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yearly Budget",
  description:
    "Set your yearly budget per category. Add debit and budget items; see how much is spent and how much is left.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

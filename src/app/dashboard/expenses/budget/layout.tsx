import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Budget",
  description:
    "Set how much you want to spend per month and add budget items per category. See how much is left as you spend.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

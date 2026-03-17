import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customization",
  description:
    "Pick a color theme for the app. Options work in light or dark mode and are easy on the eyes.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

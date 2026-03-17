"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/blocks/elements/Button";

export function ThemeToggle({
  className,
  showLabel,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme, mounted } = useThemeContext();
  const { t } = useLanguage();

  if (!mounted) {
    return (
      <div className={cn("h-10 w-10 rounded-xl bg-white dark:bg-white/5", className ?? "absolute right-4 top-4")} />
    );
  }

  return (
    <Button
      variant="secondary"
      size={showLabel ? "default" : "icon"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn("z-20", showLabel && "w-full justify-start gap-3", className ?? "absolute right-4 top-4")}
      aria-label={t("theme_toggle")}
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 shrink-0" />
      ) : (
        <Sun className="h-5 w-5 shrink-0" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === "dark" ? t("theme_lightMode") : t("theme_darkMode")}
        </span>
      )}
    </Button>
  );
}

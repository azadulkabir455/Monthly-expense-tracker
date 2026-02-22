"use client";

import { useThemeContext } from "@/context/ThemeContext";
import { useColorThemeContext, COLOR_THEMES } from "@/context/ColorThemeContext";
import { cn } from "@/lib/utils";

export function AppLoader() {
  const { theme } = useThemeContext();
  const { colorTheme } = useColorThemeContext();
  const isDark = theme === "dark";

  const colors = COLOR_THEMES.find((t) => t.id === colorTheme) ?? COLOR_THEMES[0];
  const primary = colors.primary;
  const secondary = colors.secondary;

  return (
    <div
      className={cn(
        "fixed inset-0 z-9999 flex flex-col items-center justify-center",
        isDark ? "bg-slate-950" : "bg-white"
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "h-16 w-16 rounded-full border-2",
            isDark ? "border-slate-700/50" : "border-slate-200"
          )}
        />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent"
          style={{
            animationDuration: "0.8s",
            borderTopColor: primary,
          }}
        />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent"
          style={{
            animationDuration: "1.2s",
            animationDirection: "reverse",
            borderTopColor: secondary,
          }}
        />
      </div>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loader-dot h-2 w-2 rounded-full"
            style={{
              animationDelay: `${i * 0.15}s`,
              backgroundColor: primary,
            }}
          />
        ))}
      </div>
      <p
        className={cn(
          "mt-4 text-sm",
          isDark ? "text-slate-400" : "text-slate-500"
        )}
      >
        Loading...
      </p>
    </div>
  );
}

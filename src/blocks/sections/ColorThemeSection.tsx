"use client";

import { motion } from "framer-motion";
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionSubtitle,
} from "@/blocks/elements/SectionCard";
import { useColorThemeContext, COLOR_THEMES } from "@/context/ColorThemeContext";
import { useThemeContext } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ColorThemeSection() {
  const { colorTheme, setColorTheme } = useColorThemeContext();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <SectionCard>
      <SectionHeader>
        <div>
          <SectionTitle>Color Theme</SectionTitle>
          <SectionSubtitle>
            Choose a preset color theme. Colors are catchy yet easy on the eyes.
          </SectionSubtitle>
        </div>
      </SectionHeader>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {COLOR_THEMES.map((t) => {
          const isSelected = colorTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setColorTheme(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isSelected
                  ? isDark
                    ? "border-white/40 bg-white/10 ring-2 ring-offset-2 ring-offset-transparent"
                    : "border-violet-400 ring-2 ring-violet-400/50 ring-offset-2"
                  : isDark
                    ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    : "border-[#ddd] bg-slate-50/60 hover:border-[#ccc] hover:bg-slate-100"
              )}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-md sm:h-14 sm:w-14"
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                }}
              >
                {isSelected && (
                  <Check className="h-6 w-6 text-white drop-shadow-sm sm:h-7 sm:w-7" strokeWidth={2.5} />
                )}
              </div>
              <span
                className={cn(
                  "text-center text-sm font-medium",
                  isDark ? "text-slate-200" : "text-slate-800"
                )}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

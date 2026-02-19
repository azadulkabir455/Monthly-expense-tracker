"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";

export type ColorThemeId =
  | "violet"
  | "blue"
  | "teal"
  | "emerald"
  | "amber"
  | "rose";

export const COLOR_THEMES: { id: ColorThemeId; label: string; primary: string; secondary: string }[] = [
  { id: "violet", label: "Violet", primary: "#8b5cf6", secondary: "#d946ef" },
  { id: "blue", label: "Ocean Blue", primary: "#3b82f6", secondary: "#06b6d4" },
  { id: "teal", label: "Teal", primary: "#14b8a6", secondary: "#22d3ee" },
  { id: "emerald", label: "Emerald", primary: "#10b981", secondary: "#34d399" },
  { id: "amber", label: "Amber", primary: "#f59e0b", secondary: "#fbbf24" },
  { id: "rose", label: "Rose", primary: "#f43f5e", secondary: "#fb7185" },
];

export const ColorThemeContext = createContext<{
  colorTheme: ColorThemeId;
  setColorTheme: (t: ColorThemeId) => void;
  mounted: boolean;
} | null>(null);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("violet");

  useLayoutEffect(() => {
    const stored = localStorage.getItem("colorTheme") as ColorThemeId | null;
    const valid: ColorThemeId[] = ["violet", "blue", "teal", "emerald", "amber", "rose"];
    const initial = stored && valid.includes(stored) ? stored : "violet";
    setColorThemeState(initial);
    document.documentElement.setAttribute("data-color-theme", initial);
  }, []);

  const setColorTheme = useCallback((newTheme: ColorThemeId) => {
    setColorThemeState(newTheme);
    localStorage.setItem("colorTheme", newTheme);
    document.documentElement.setAttribute("data-color-theme", newTheme);
  }, []);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, mounted: true }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorThemeContext() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorThemeContext must be used within ColorThemeProvider");
  return ctx;
}

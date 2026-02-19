"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  getPreferences,
  setPreferences,
  DEFAULT_PREFERENCES,
  type StoredTheme,
  type StoredColorTheme,
} from "@/lib/firebase/preferences";
import { ThemeContext } from "@/context/ThemeContext";
import {
  ColorThemeContext,
  type ColorThemeId,
} from "@/context/ColorThemeContext";
import { AppLoader } from "@/components/AppLoader";

const STORAGE_THEME = "app_theme";
const STORAGE_COLOR = "app_colorTheme";

type Theme = "light" | "dark";

const VALID_THEMES: Theme[] = ["light", "dark"];
const VALID_COLORS: ColorThemeId[] = [
  "violet",
  "blue",
  "teal",
  "emerald",
  "amber",
  "rose",
];

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyColorTheme(colorTheme: StoredColorTheme) {
  document.documentElement.setAttribute("data-color-theme", colorTheme);
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(STORAGE_THEME) as Theme | null;
  return t && VALID_THEMES.includes(t) ? t : null;
}

function getStoredColorTheme(): ColorThemeId | null {
  if (typeof window === "undefined") return null;
  const c = localStorage.getItem(STORAGE_COLOR) as ColorThemeId | null;
  return c && VALID_COLORS.includes(c) ? c : null;
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_PREFERENCES.theme);
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(
    DEFAULT_PREFERENCES.colorTheme
  );
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Apply to DOM whenever state changes
  useLayoutEffect(() => {
    applyTheme(theme);
    applyColorTheme(colorTheme);
  }, [theme, colorTheme]);

  // localStorage থাকলে সেটা দিয়েই লোড (লগইন থাকুক বা না থাকুক)। নাহলে: নো ইউজার → ডিফল্ট, ইউজার → Firestore থেকে নিয়ে localStorage সেট
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const fromStorage = getStoredTheme();
      const colorFromStorage = getStoredColorTheme();
      let themeToApply: Theme;
      let colorToApply: ColorThemeId;

      if (fromStorage != null && colorFromStorage != null) {
        // localStorage এ প্রেফারেন্স থাকলে ওই অনুযায়ী সব পেজ (লোডারসহ) লোড
        themeToApply = fromStorage;
        colorToApply = colorFromStorage;
      } else if (!user) {
        // লগইন নেই + localStorage খালি → ডিফল্ট
        themeToApply = DEFAULT_PREFERENCES.theme;
        colorToApply = DEFAULT_PREFERENCES.colorTheme;
      } else {
        // লগইন আছে + localStorage খালি → Firestore থেকে নিয়ে localStorage এ রাখো
        setUserId(user.uid);
        const prefs = await getPreferences(user.uid);
        themeToApply = prefs?.theme ?? DEFAULT_PREFERENCES.theme;
        colorToApply = prefs?.colorTheme ?? DEFAULT_PREFERENCES.colorTheme;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_THEME, themeToApply);
          localStorage.setItem(STORAGE_COLOR, colorToApply);
        }
      }

      if (user) setUserId(user.uid);
      else setUserId(null);

      applyTheme(themeToApply);
      applyColorTheme(colorToApply);
      setThemeState(themeToApply);
      setColorThemeState(colorToApply);
      setMounted(true);
    });
    return () => unsubscribe();
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_THEME, newTheme);
    }
    if (userId) {
      void setPreferences(userId, { theme: newTheme });
    }
  }, [userId]);

  const setColorTheme = useCallback((newColor: ColorThemeId) => {
    setColorThemeState(newColor);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_COLOR, newColor);
    }
    if (userId) {
      void setPreferences(userId, { colorTheme: newColor });
    }
  }, [userId]);

  if (!mounted) {
    return <AppLoader />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted: true }}>
      <ColorThemeContext.Provider
        value={{ colorTheme, setColorTheme, mounted: true }}
      >
        {children}
      </ColorThemeContext.Provider>
    </ThemeContext.Provider>
  );
}

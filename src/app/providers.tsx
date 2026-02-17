"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider } from "@/context/ThemeContext";
import { ColorThemeProvider } from "@/context/ColorThemeContext";
import { DemoLoader } from "@/components/DemoLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ColorThemeProvider>
      <Provider store={store}>
        <DemoLoader />
        {children}
      </Provider>
      </ColorThemeProvider>
    </ThemeProvider>
  );
}

"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { UserPreferencesProvider } from "@/context/UserPreferencesProvider";
import { DemoLoader } from "@/components/DemoLoader";
import { AuthSessionSync } from "@/components/AuthSessionSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserPreferencesProvider>
      <Provider store={store}>
        <AuthSessionSync />
        <DemoLoader />
        {children}
      </Provider>
    </UserPreferencesProvider>
  );
}

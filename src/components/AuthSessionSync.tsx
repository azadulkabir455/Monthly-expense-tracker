"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { setSessionCookie, clearSessionCookie } from "@/lib/firebase/auth";

/**
 * Keeps session cookie in sync with Firebase auth (e.g. on refresh or new tab).
 * Middleware uses this cookie for protected routes.
 */
export function AuthSessionSync() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await setSessionCookie(token);
      } else {
        await clearSessionCookie();
      }
    });
    return () => unsubscribe();
  }, []);
  return null;
}

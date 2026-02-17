"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="auth-bg relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10 md:py-12 safe-area-top safe-area-bottom">
      {/* Gradient orbs - gorgeous violet/rose */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl dark:bg-violet-500/15" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl dark:bg-fuchsia-500/15" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-400/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md px-1 sm:px-0 min-w-0"
      >
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}

"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/blocks/elements/Button";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  const toggle = () => setLocale(locale === "en" ? "bn" : "en");

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggle}
      className={cn("z-20", className)}
      aria-label={locale === "en" ? "Switch to Bangla" : "Switch to English"}
      title={locale === "en" ? "বাংলায় পরিবর্তন করুন" : "Switch to English"}
    >
      <Languages className="h-5 w-5 shrink-0" />
    </Button>
  );
}

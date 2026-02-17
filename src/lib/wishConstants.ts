/** Format kebab-case icon name to readable label (e.g. "graduation-cap" -> "Graduation Cap") */
export function formatIconLabel(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Lazy-loaded icon options - only computed on client to avoid SSR/hydration mismatch */
let _iconOptions: { value: string; label: string }[] | null = null;

export function getIconOptions(): { value: string; label: string }[] {
  if (typeof window === "undefined") return [];
  if (!_iconOptions) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- client-only, avoids SSR hydration
    const { iconNames } = require("lucide-react/dynamic") as { iconNames: string[] };
    _iconOptions = iconNames.map((value) => ({
      value,
      label: formatIconLabel(value),
    }));
  }
  return _iconOptions;
}

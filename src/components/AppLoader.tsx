"use client";

/** Fixed colors and dark-only for loader to avoid hydration mismatch (server has no localStorage, client may have saved theme) */
const LOADER_PRIMARY = "#8b5cf6";
const LOADER_SECONDARY = "#d946ef";

export function AppLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-slate-700/50" />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent"
          style={{
            animationDuration: "0.8s",
            borderTopColor: LOADER_PRIMARY,
          }}
        />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent"
          style={{
            animationDuration: "1.2s",
            animationDirection: "reverse",
            borderTopColor: LOADER_SECONDARY,
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
              backgroundColor: LOADER_PRIMARY,
            }}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-400">Loading...</p>
    </div>
  );
}

"use client";

export function AppLoader() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-slate-700/50" />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-violet-500"
          style={{ animationDuration: "0.8s" }}
        />
        <div
          className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-fuchsia-500"
          style={{ animationDuration: "1.2s", animationDirection: "reverse" }}
        />
      </div>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loader-dot h-2 w-2 rounded-full bg-violet-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-400">Loading...</p>
    </div>
  );
}

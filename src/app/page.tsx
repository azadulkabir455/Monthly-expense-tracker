import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Monthly Expense Tracker
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track your monthly expenses in one place.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/dashboard"
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-medium text-white shadow-card transition hover:shadow-float dark:from-violet-500 dark:to-fuchsia-500"
        >
          Dashboard
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-medium text-foreground shadow-card backdrop-blur-xl transition hover:bg-white/20 hover:shadow-elevated dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-medium text-foreground shadow-card backdrop-blur-xl transition hover:bg-white/20 hover:shadow-elevated dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

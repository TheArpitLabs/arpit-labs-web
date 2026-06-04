import { adminSignIn } from "@/lib/actions/admin-actions";

interface AdminLoginPageProps {
  searchParams?: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Protected Admin</p>
          <h1 className="text-3xl font-bold text-foreground">Arpit Labs Dashboard</h1>
          <p className="text-sm text-muted">Sign in with an admin-approved Supabase account to manage platform content.</p>
        </div>

        <form action={adminSignIn} className="space-y-5">
          <input type="hidden" name="redirectTo" value={params?.redirectTo ?? "/admin"} />

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {params?.error ? (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {params.error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}

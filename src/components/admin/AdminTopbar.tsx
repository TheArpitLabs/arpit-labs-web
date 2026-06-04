import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { adminSignOut } from "@/lib/actions/admin-actions";

interface AdminTopbarProps {
  title: string;
  subtitle: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  return (
    <div className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[240px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search dashboard"
            className="w-full rounded-2xl border border-border/70 bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <ThemeToggle />

        <form action={adminSignOut}>
          <button
            type="submit"
            className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

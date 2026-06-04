interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-4 text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </div>
  );
}

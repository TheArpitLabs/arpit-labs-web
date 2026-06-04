interface AdminEmptyStateProps {
  title: string;
  description: string;
}

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-border/60 bg-card/60 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-950/60">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

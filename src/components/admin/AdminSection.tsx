interface AdminSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AdminSection({ title, description, children }: AdminSectionProps) {
  return (
    <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

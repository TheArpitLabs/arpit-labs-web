import { Button } from "@/components/ui/button";

interface CTAProps {
  title: string;
  description: string;
  primaryText: string;
  secondaryText?: string;
}

export function CTA({ title, description, primaryText, secondaryText }: CTAProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-8 shadow-glow dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted">UI foundation</p>
          <h2 className="text-section-title">{title}</h2>
          <p className="max-w-2xl text-body text-muted">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="primary">{primaryText}</Button>
          <Button variant="secondary">{secondaryText ?? "Secondary"}</Button>
        </div>
      </div>
    </section>
  );
}

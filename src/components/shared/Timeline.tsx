import { JourneyItem } from "@/types/content";

interface TimelineProps {
  items: JourneyItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="my-8 rounded-[2rem] border border-border/70 bg-surface p-12 text-center dark:border-slate-800 dark:bg-slate-950">
        <p className="text-muted">No journey milestones recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative my-8 overflow-hidden rounded-[2rem] border border-border/70 bg-surface p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50 dark:bg-slate-700" />
      <div className="space-y-10 pl-12">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-6 top-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary text-sm font-bold">
              {item.year}
            </div>
            <div className="space-y-2 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-body text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

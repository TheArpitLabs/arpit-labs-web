interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

const timelineEvents: TimelineEvent[] = [
  { year: "2022", title: "Started Engineering", description: "Laid the foundation with core systems, algorithms, and hardware prototypes." },
  { year: "2023", title: "Explored IoT", description: "Built connected systems and embedded workflows for intelligent environments." },
  { year: "2024", title: "Built Hardware Projects", description: "Created modular electronics, devices, and responsive lab systems." },
  { year: "2025", title: "Learned Full Stack", description: "Combined software, APIs, and product thinking into cohesive system design." },
  { year: "2026", title: "Created Arpit Labs", description: "Launched a digital engineering lab for experiments, stories, and future systems." }
];

export function Timeline() {
  return (
    <div className="relative my-8 overflow-hidden rounded-[2rem] border border-border/70 bg-surface p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50 dark:bg-slate-700" />
      <div className="space-y-10 pl-12">
        {timelineEvents.map((event) => (
          <div key={event.year} className="relative">
            <div className="absolute -left-6 top-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
              {event.year}
            </div>
            <div className="space-y-2 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
              <p className="text-body text-muted">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

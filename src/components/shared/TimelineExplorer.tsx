"use client";

import { useMemo, useState } from "react";
import { Award, GraduationCap, MapPin, Milestone, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JourneyEntryType, JourneyItem } from "@/types/content";

interface TimelineExplorerProps {
  items: JourneyItem[];
}

const filterLabels: Array<{ key: JourneyEntryType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "education", label: "Education" },
  { key: "competition", label: "Competitions" },
  { key: "hackathon", label: "Hackathons" },
  { key: "certification", label: "Certifications" },
  { key: "milestone", label: "Milestones" },
];

const iconMap: Record<JourneyEntryType, React.ReactNode> = {
  education: <GraduationCap size={18} />,
  competition: <Trophy size={18} />,
  hackathon: <Sparkles size={18} />,
  certification: <Award size={18} />,
  milestone: <Milestone size={18} />,
};

export function TimelineExplorer({ items }: TimelineExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<JourneyEntryType | "all">("all");

  const filteredItems = useMemo(
    () =>
      items.filter((item) => activeFilter === "all" || (item.entry_type ?? "milestone") === activeFilter),
    [activeFilter, items]
  );

  const counts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = item.entry_type ?? "milestone";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="my-8 rounded-[2rem] border border-border/70 bg-surface p-12 text-center dark:border-slate-800 dark:bg-slate-950">
        <p className="text-muted">No journey milestones recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {filterLabels.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = filter.key === "all" ? items.length : (counts[filter.key] ?? 0);

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border/70 bg-background text-muted hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-950"
              )}
            >
              <span>{filter.label}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px]", isActive ? "bg-white/20" : "bg-muted/10")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="absolute bottom-0 left-6 top-0 w-px bg-border/50 dark:bg-slate-700" />
        <div className="space-y-10 pl-12">
          {filteredItems.map((item) => {
            const entryType = item.entry_type ?? "milestone";

            return (
              <div key={item.id} className="relative">
                <div className="absolute -left-6 top-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
                  {iconMap[entryType]}
                </div>

                <div className="space-y-3 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <Badge variant="outline" className="px-3 py-1 text-[10px]">
                          {entryType}
                        </Badge>
                      </div>
                      <p className="mt-2 text-body text-muted">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{item.year}</p>
                      {item.organization ? <p className="text-sm text-muted">{item.organization}</p> : null}
                    </div>
                  </div>

                  {item.location ? (
                    <div className="inline-flex items-center gap-2 text-sm text-muted">
                      <MapPin size={14} />
                      {item.location}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

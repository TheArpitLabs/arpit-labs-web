"use client";

import { useTheme } from "next-themes";
import { Laptop2, Moon, Sun } from "lucide-react";
import { useIsMounted } from "@/hooks/use-is-mounted";

const modes = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Laptop2, label: "System" }
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return <div className="h-11 w-11 rounded-2xl bg-surface" aria-hidden="true" />;
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-surface p-1 dark:border-slate-700 dark:bg-slate-900">
      {modes.map((item) => {
        const Icon = item.icon;
        const active = theme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.label} theme`}
            onClick={() => setTheme(item.id)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${
              active ? "bg-primary text-white" : "text-muted hover:bg-background/80 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

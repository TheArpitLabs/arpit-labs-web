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
    return <div className="h-10 w-10 rounded-xl bg-purple-950/50" aria-hidden="true" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-950/50 p-1">
      {modes.map((item) => {
        const Icon = item.icon;
        const active = theme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.label} theme`}
            onClick={() => setTheme(item.id)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
              active ? "bg-purple-500 text-white" : "text-gray-400 hover:bg-purple-900/50"
            }`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

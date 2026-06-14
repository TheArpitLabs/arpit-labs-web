"use client";

import { useTheme } from "next-themes";
import { Laptop2, Moon, Sun, ChevronDown } from "lucide-react";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useState } from "react";

const modes = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Laptop2, label: "System" }
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(false);

  if (!mounted) {
    return <div className="h-10 w-10 rounded-xl bg-purple-950/50" aria-hidden="true" />;
  }

  const currentMode = modes.find((m) => m.id === theme) || modes[2];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white hover:bg-purple-900/50 transition"
      >
        <CurrentIcon size={16} />
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-xl border border-purple-500/30 bg-purple-950/50 p-1 shadow-xl">
            {modes.map((item) => {
              const Icon = item.icon;
              const active = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-purple-500 text-white" : "text-gray-400 hover:bg-purple-900/50"
                  }`}
                  title={item.label}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

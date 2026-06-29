"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
};

type ThemeSelectorProps = {
  label: string;
  options: ThemeOption[];
};

function subscribeToClientSnapshot() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeSelector({ label, options }: ThemeSelectorProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="inline-grid grid-cols-3 rounded-md border border-border bg-card p-1 shadow-soft">
        {options.map((option) => {
          const isSelected = mounted && theme === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className="min-h-10 rounded-sm px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              key={option.value}
              onClick={() => setTheme(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type ThemeToggleProps = Readonly<{
  labels: {
    label: string;
    light: string;
    dark: string;
    system: string;
  };
}>;

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return <div className="size-9" aria-hidden="true" />;
  }

  const cycle = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const current =
    theme === "dark"
      ? labels.dark
      : theme === "light"
        ? labels.light
        : labels.system;
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${labels.label}: ${current}`}
      title={`${labels.label}: ${current}`}
      className="grid size-9 place-items-center rounded-lg border border-border text-[var(--c-muted)] transition-colors hover:bg-[var(--c-brand-a08)] hover:text-[var(--c-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon />
    </button>
  );
}

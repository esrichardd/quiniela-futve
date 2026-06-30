import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

import { AuthBrandMark } from "./auth-brand-mark";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
  homeLabel: string;
}>;

export default function AuthLayout({ children, homeLabel }: AuthLayoutProps) {
  return (
    <main className="auth-shell relative min-h-dvh overflow-hidden bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label={homeLabel}
            className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AuthBrandMark className="size-9 rounded-lg" />
            <span className="text-base font-bold tracking-tight">
              Quiniela <span className="text-brand">FUTVE</span>
            </span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </div>
    </main>
  );
}

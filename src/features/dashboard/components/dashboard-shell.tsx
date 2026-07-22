import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { Link } from "@/i18n/navigation";

import LogoutButton from "./logout-button";

type DashboardShellProps = Readonly<{
  children: ReactNode;
}>;

export default async function DashboardShell({ children }: DashboardShellProps) {
  const common = await getTranslations("common");
  const dashboard = await getTranslations("dashboard");

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <Link
            href="/home"
            aria-label={common("navigation.home")}
            className="inline-flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandMark className="size-9 rounded-lg" />
            <span className="truncate text-base font-bold tracking-tight text-foreground">
              Quiniela <span className="text-brand">FUTVE</span>
            </span>
          </Link>

          <nav
            aria-label={common("navigation.primary")}
            className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto"
          >
            <Link
              href="/home"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dashboard("navigation.pools")}
            </Link>
            <Link
              href="/pools/join"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dashboard("navigation.join")}
            </Link>
          </nav>

          <div className="order-2 sm:order-3">
            <LogoutButton />
          </div>
        </header>

        <div className="py-8">{children}</div>
      </div>
    </main>
  );
}

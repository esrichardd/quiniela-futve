"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

type PoolListErrorProps = Readonly<{
  reset: () => void;
}>;

export default function PoolListError({ reset }: PoolListErrorProps) {
  const t = useTranslations("pools");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <CircleAlert
          aria-hidden="true"
          className="mx-auto size-9 text-destructive"
        />
        <h1 className="mt-4 text-xl font-bold">
          {t("status.listErrorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("status.listErrorBody")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {t("status.retry")}
        </button>
      </div>
    </main>
  );
}

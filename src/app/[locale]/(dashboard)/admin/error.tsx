"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminError({ reset }: Readonly<{ reset: () => void }>) {
  const t = useTranslations("competitionCatalog");
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
      <CircleAlert aria-hidden="true" className="mx-auto size-8 text-destructive" />
      <h1 className="mt-4 text-xl font-bold">{t("status.errorTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("status.errorBody")}</p>
      <button type="button" onClick={reset} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
        {t("status.retry")}
      </button>
    </div>
  );
}

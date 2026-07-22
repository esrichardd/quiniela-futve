"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PoolsLoading() {
  const t = useTranslations("pools");

  return (
    <div
      role="status"
      className="flex min-h-[50dvh] items-center justify-center bg-background text-foreground"
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <LoaderCircle
          aria-hidden="true"
          className="size-5 animate-spin text-brand"
        />
        {t("status.loading")}
      </div>
    </div>
  );
}

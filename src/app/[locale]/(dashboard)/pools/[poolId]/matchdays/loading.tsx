import { LoaderCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function MatchdaysLoading() {
  const t = await getTranslations("pools");
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      <p>{t("status.matchdaysLoading")}</p>
    </div>
  );
}

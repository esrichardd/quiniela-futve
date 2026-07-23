import { CalendarPlus, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createSeasonAction } from "../actions";
import type { AdminCompetition } from "../types";
import { Link } from "@/i18n/navigation";

import CatalogActionForm from "./catalog-action-form";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-foreground";

export default async function AdminCompetitions({
  competitions,
}: Readonly<{ competitions: ReadonlyArray<AdminCompetition> }>) {
  const t = await getTranslations("competitionCatalog");

  return (
    <section>
      <p className="text-sm font-semibold text-brand">{t("admin.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
        {t("admin.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {t("admin.subtitle")}
      </p>

      <div className="mt-8 space-y-6">
        {competitions.map((competition) => (
          <article key={competition.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{competition.name}</h2>
                <p className="text-sm text-muted-foreground">{competition.code}</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {competition.isActive ? t("competition.active") : t("competition.inactive")}
              </span>
            </div>

            {competition.seasons.length > 0 ? (
              <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
                {competition.seasons.map((season) => (
                  <li key={season.id}>
                    <Link
                      href={`/admin/competitions/${competition.id}/seasons/${season.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-foreground hover:bg-muted"
                    >
                      <span>
                        <span className="font-semibold">{season.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t(`season.status.${season.status}`)}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                {t("season.empty")}
              </p>
            )}

            <div className="mt-6 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 font-bold">
                <CalendarPlus aria-hidden="true" className="size-4 text-brand" />
                {t("season.createTitle")}
              </h3>
              <CatalogActionForm
                action={createSeasonAction}
                submitLabel={t("season.create")}
                pendingLabel={t("season.creating")}
                className="mt-4 grid gap-4 md:grid-cols-2"
              >
                <input type="hidden" name="competitionId" value={competition.id} />
                <label className="text-sm font-semibold">
                  {t("season.name")}
                  <input name="name" required maxLength={120} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  {t("season.code")}
                  <input name="code" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  {t("season.startsOn")}
                  <input name="startsOn" type="date" className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  {t("season.endsOn")}
                  <input name="endsOn" type="date" className={inputClass} />
                </label>
              </CatalogActionForm>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { ArrowLeft, CalendarDays, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  addSeasonTeamAction,
  createMatchAction,
  createMatchdayAction,
  createTeamAction,
  updateMatchAction,
  updateMatchdayStatusAction,
  updateSeasonStatusAction,
} from "../actions";
import { matchStatuses } from "../constants";
import type { AdminSeasonDetail } from "../types";
import { Link } from "@/i18n/navigation";

import CatalogActionForm from "./catalog-action-form";
import DateTimeField from "./date-time-field";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-foreground";

export default async function AdminSeason({
  season,
  locale,
  timeZone,
}: Readonly<{
  season: AdminSeasonDetail;
  locale: string;
  timeZone: string;
}>) {
  const t = await getTranslations("competitionCatalog");
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });

  return (
    <section>
      <Link
        href="/admin/competitions"
        className="inline-flex items-center gap-2 text-sm font-semibold"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("actions.back")}
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-brand">{season.competitionName}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{season.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {season.code} · {t(`season.status.${season.status}`)}
          </p>
        </div>
        {season.status !== "finished" ? (
          <CatalogActionForm
            action={updateSeasonStatusAction}
            submitLabel={
              season.status === "draft" ? t("season.activate") : t("season.finish")
            }
            pendingLabel={t("actions.saving")}
            confirmMessage={t("confirm.seasonStatus")}
            className="flex flex-col items-start gap-2"
          >
            <input type="hidden" name="seasonId" value={season.id} />
            <input
              type="hidden"
              name="status"
              value={season.status === "draft" ? "active" : "finished"}
            />
          </CatalogActionForm>
        ) : null}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Users aria-hidden="true" className="size-5 text-brand" />
          {t("teams.title")}
        </h2>
        {season.teams.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {season.teams.map((team) => (
              <li key={team.id} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                {team.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("teams.empty")}</p>
        )}

        {season.status !== "finished" ? (
          <div className="mt-6 grid gap-6 border-t border-border pt-5 lg:grid-cols-2">
            <div>
              <h3 className="font-bold">{t("teams.createTitle")}</h3>
              <CatalogActionForm
                action={createTeamAction}
                submitLabel={t("teams.create")}
                pendingLabel={t("actions.saving")}
                className="mt-3 grid gap-3"
              >
                <input type="hidden" name="seasonId" value={season.id} />
                <label className="text-sm font-semibold">
                  {t("teams.name")}
                  <input name="name" required maxLength={120} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  {t("teams.shortName")}
                  <input name="shortName" maxLength={40} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  {t("teams.code")}
                  <input name="code" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} />
                </label>
              </CatalogActionForm>
            </div>
            <div>
              <h3 className="font-bold">{t("teams.addTitle")}</h3>
              {season.availableTeams.length > 0 ? (
                <CatalogActionForm
                  action={addSeasonTeamAction}
                  submitLabel={t("teams.add")}
                  pendingLabel={t("actions.saving")}
                  className="mt-3 grid gap-3"
                >
                  <input type="hidden" name="seasonId" value={season.id} />
                  <label className="text-sm font-semibold">
                    {t("teams.existing")}
                    <select name="teamId" required className={inputClass}>
                      {season.availableTeams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </label>
                </CatalogActionForm>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t("teams.noneAvailable")}</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CalendarDays aria-hidden="true" className="size-5 text-brand" />
          {t("matchdays.title")}
        </h2>

        {season.status !== "finished" ? (
          <CatalogActionForm
            action={createMatchdayAction}
            submitLabel={t("matchdays.create")}
            pendingLabel={t("actions.saving")}
            className="mt-5 grid gap-3 border-b border-border pb-6 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
          >
            <input type="hidden" name="seasonId" value={season.id} />
            <label className="text-sm font-semibold">
              {t("matchdays.number")}
              <input name="number" type="number" min={1} max={999} required className={inputClass} />
            </label>
            <label className="text-sm font-semibold">
              {t("matchdays.name")}
              <input name="name" maxLength={120} className={inputClass} />
            </label>
          </CatalogActionForm>
        ) : null}

        {season.matchdays.length === 0 ? (
          <p className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            {t("matchdays.empty")}
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {season.matchdays.map((matchday) => (
              <article key={matchday.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {matchday.name ?? t("matchdays.defaultName", { number: matchday.number })}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t(`matchdays.status.${matchday.status}`)}
                    </p>
                  </div>
                  {matchday.status !== "finished" ? (
                    <CatalogActionForm
                      action={updateMatchdayStatusAction}
                      submitLabel={
                        matchday.status === "draft"
                          ? t("matchdays.publish")
                          : t("matchdays.finish")
                      }
                      pendingLabel={t("actions.saving")}
                      confirmMessage={t("confirm.matchdayStatus")}
                      className="flex flex-col items-start gap-2"
                    >
                      <input type="hidden" name="seasonId" value={season.id} />
                      <input type="hidden" name="matchdayId" value={matchday.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={matchday.status === "draft" ? "published" : "finished"}
                      />
                    </CatalogActionForm>
                  ) : null}
                </div>

                {matchday.status === "draft" && season.teams.length >= 2 ? (
                  <CatalogActionForm
                    action={createMatchAction}
                    submitLabel={t("matches.create")}
                    pendingLabel={t("actions.saving")}
                    className="mt-4 grid gap-3 rounded-xl bg-muted p-4 md:grid-cols-2"
                  >
                    <input type="hidden" name="seasonId" value={season.id} />
                    <input type="hidden" name="matchdayId" value={matchday.id} />
                    <TeamSelect name="homeTeamId" label={t("matches.homeTeam")} teams={season.teams} />
                    <TeamSelect name="awayTeamId" label={t("matches.awayTeam")} teams={season.teams} />
                    <DateTimeField id={`new-match-${matchday.id}`} label={t("matches.startsAtDevice")} />
                  </CatalogActionForm>
                ) : null}

                {matchday.matches.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {matchday.matches.map((match) => (
                      <CatalogActionForm
                        key={match.id}
                        action={updateMatchAction}
                        submitLabel={t("matches.save")}
                        pendingLabel={t("actions.saving")}
                        confirmMessage={
                          match.status === "finished" ? t("confirm.resultCorrection") : undefined
                        }
                        className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-2"
                      >
                        <input type="hidden" name="seasonId" value={season.id} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <div className="lg:col-span-2">
                          <p className="font-bold">{match.homeTeamName} — {match.awayTeamName}</p>
                          <p className="text-xs text-muted-foreground">
                            {dateTimeFormatter.format(new Date(match.startsAt))} · {timeZone}
                          </p>
                        </div>
                        <DateTimeField
                          id={`match-time-${match.id}`}
                          label={t("matches.startsAtDevice")}
                          initialValue={match.startsAt}
                        />
                        <label className="text-sm font-semibold">
                          {t("matches.statusLabel")}
                          <select name="status" defaultValue={match.status} className={inputClass}>
                            {matchStatuses.map((status) => (
                              <option key={status} value={status}>{t(`matches.status.${status}`)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          {t("matches.homeScore")}
                          <input
                            name="homeScore"
                            type="number"
                            min={0}
                            defaultValue={match.homeScore ?? ""}
                            className={inputClass}
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          {t("matches.awayScore")}
                          <input
                            name="awayScore"
                            type="number"
                            min={0}
                            defaultValue={match.awayScore ?? ""}
                            className={inputClass}
                          />
                        </label>
                      </CatalogActionForm>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">{t("matches.empty")}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4" />
        {t("admin.permissionNotice")}
      </p>
    </section>
  );
}

function TeamSelect({
  name,
  label,
  teams,
}: Readonly<{
  name: string;
  label: string;
  teams: AdminSeasonDetail["teams"];
}>) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select name={name} required className={inputClass}>
        {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
    </label>
  );
}

import { CalendarDays, CheckCircle2, Lock, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PREDICTION_LOCK_BUFFER_MINUTES } from "@/features/predictions/constants";
import PoolNavigation from "@/features/pools/components/pool-navigation";
import type {
  MemberMatchPrediction,
  PoolTransparencyView,
  TransparencyMatch,
} from "@/features/prediction-reveal/types";
import { Link } from "@/i18n/navigation";

export default async function PoolTransparency({
  view,
  locale,
}: Readonly<{
  view: PoolTransparencyView;
  locale: string;
}>) {
  const [t, poolsT] = await Promise.all([
    getTranslations("transparency"),
    getTranslations("pools"),
  ]);
  const selected = view.matchdays.find((matchday) => matchday.id === view.selectedMatchdayId);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  const nameByMembership = new Map<string, string | null>();
  for (const matchday of view.matchdays) {
    for (const match of matchday.matches) {
      for (const member of match.members) {
        nameByMembership.set(member.poolMembershipId, member.displayName);
      }
    }
  }

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-wide text-brand">
        {view.competitionName} · {view.seasonName}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{view.poolName}</h1>
      <PoolNavigation poolId={view.poolId} active="transparency" />

      {view.matchdays.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-soft">
          <CalendarDays aria-hidden="true" className="mx-auto size-9 text-brand" />
          <h2 className="mt-4 text-lg font-bold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[15rem_1fr]">
          <nav aria-label={t("selectorLabel")} className="flex gap-2 overflow-x-auto lg:flex-col">
            {view.matchdays.map((matchday) => (
              <Link
                key={matchday.id}
                href={`/pools/${view.poolId}/transparency?matchday=${matchday.id}`}
                aria-current={matchday.id === view.selectedMatchdayId ? "page" : undefined}
                className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  matchday.id === view.selectedMatchdayId
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {matchday.name ?? poolsT("matchdays.defaultName", { number: matchday.number })}
              </Link>
            ))}
          </nav>

          {selected ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="text-xl font-bold">
                {selected.name ?? poolsT("matchdays.defaultName", { number: selected.number })}
              </h2>

              {selected.status === "finished" && selected.perfectMatchdayMembershipIds.length > 0 ? (
                <PerfectMatchdayBanner
                  names={selected.perfectMatchdayMembershipIds.map(
                    (id) => nameByMembership.get(id) ?? null,
                  )}
                />
              ) : null}

              <div className="mt-5 space-y-4">
                {selected.matches.map((match) => (
                  <MatchCard
                    key={match.matchId}
                    match={match}
                    dateLabel={dateFormatter.format(new Date(match.startsAt))}
                    timeLabel={timeFormatter.format(new Date(match.startsAt))}
                    lockedUntilLabel={dateFormatter.format(
                      new Date(
                        new Date(match.startsAt).getTime() -
                          PREDICTION_LOCK_BUFFER_MINUTES * 60_000,
                      ),
                    )}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}

async function PerfectMatchdayBanner({
  names,
}: Readonly<{ names: ReadonlyArray<string | null> }>) {
  const [t, poolsT] = await Promise.all([
    getTranslations("transparency"),
    getTranslations("pools"),
  ]);
  const label = names.map((name) => name ?? poolsT("detail.unnamedMember")).join(", ");

  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm font-semibold text-success">
      <Trophy aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {t("perfectMatchdayBanner", { names: label })}
    </p>
  );
}

/**
 * Compact per-match scoreboard: a small header (teams + official score, or
 * kickoff time before the match ends) followed by one row per member
 * showing their points, name, and pick. Rows are sorted by points once the
 * match is `finished`, and the top scoring row(s) are highlighted — this
 * mirrors a classic pool "results" table instead of the previous card list.
 */
async function MatchCard({
  match,
  dateLabel,
  timeLabel,
  lockedUntilLabel,
}: Readonly<{
  match: TransparencyMatch;
  dateLabel: string;
  timeLabel: string;
  lockedUntilLabel: string;
}>) {
  const t = await getTranslations("transparency");

  const isFinished = match.matchStatus === "finished";
  const pointsEarnedValues = match.members
    .map((member) => member.pointsEarned)
    .filter((points): points is number => points !== null);
  const maxPoints = pointsEarnedValues.length > 0 ? Math.max(...pointsEarnedValues) : null;
  const sortedMembers = isFinished
    ? [...match.members].sort(
        (a, b) => (b.pointsEarned ?? -1) - (a.pointsEarned ?? -1),
      )
    : match.members;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-muted/40 px-4 py-3">
        <p className="text-right text-sm font-semibold leading-tight">
          {match.homeTeamShortName ?? match.homeTeamName}
        </p>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {isFinished && match.homeScore !== null && match.awayScore !== null
            ? `${match.homeScore} – ${match.awayScore}`
            : timeLabel}
        </p>
        <p className="text-left text-sm font-semibold leading-tight">
          {match.awayTeamShortName ?? match.awayTeamName}
        </p>
      </div>

      {!match.isRevealed ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Lock aria-hidden="true" className="size-4 shrink-0" />
          <span>{t("locked", { time: lockedUntilLabel })}</span>
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            {match.homeTeamName} – {match.awayTeamName}, {dateLabel}
          </caption>
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-2 text-right">
                {t("table.points")}
              </th>
              <th scope="col" className="px-4 py-2">
                {t("table.participant")}
              </th>
              <th scope="col" className="px-4 py-2">
                {t("table.pick")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedMembers.map((member) => (
              <MemberRow
                key={member.poolMembershipId}
                member={member}
                highlighted={
                  isFinished &&
                  maxPoints !== null &&
                  maxPoints > 0 &&
                  member.pointsEarned === maxPoints
                }
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

async function MemberRow({
  member,
  highlighted,
}: Readonly<{ member: MemberMatchPrediction; highlighted: boolean }>) {
  const [predictionsT, poolsT] = await Promise.all([
    getTranslations("predictions"),
    getTranslations("pools"),
  ]);

  const pickLabel =
    member.prediction === null
      ? predictionsT("status.noPrediction")
      : member.prediction.kind === "result"
        ? predictionsT(`results.${member.prediction.result}`)
        : `${member.prediction.homeScore} – ${member.prediction.awayScore}`;

  return (
    <tr className={highlighted ? "bg-success/10" : undefined}>
      <td className="px-4 py-2.5 text-right">
        <span
          className={`inline-flex min-w-10 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
            member.pointsEarned !== null && member.pointsEarned > 0
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {member.pointsEarned ?? "–"}
        </span>
      </td>
      <td className="px-4 py-2.5 font-semibold">
        {member.displayName ?? poolsT("detail.unnamedMember")}
      </td>
      <td className="px-4 py-2.5">
        <span className="flex items-center gap-2">
          {pickLabel}
          {member.wasExactScore ? (
            <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0 text-success" />
          ) : null}
        </span>
      </td>
    </tr>
  );
}

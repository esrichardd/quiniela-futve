"use client";

import type { FormEvent } from "react";
import { useActionState, useMemo, useRef } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { saveMatchdayPredictionsAction } from "@/features/predictions/actions";
import { predictionResults } from "@/features/predictions/constants";
import type {
  PredictionMatch,
  PredictionOutcome,
} from "@/features/predictions/types";
import { initialSaveMatchdayPredictionsState } from "@/features/predictions/types";
import type { PredictionMode } from "@/features/pools/types";

export type PredictionMatchViewModel = PredictionMatch &
  Readonly<{ dateLabel: string; statusLabel: string }>;

type PredictionBatchItem =
  | Readonly<{ matchId: string; kind: "result"; result: string }>
  | Readonly<{ matchId: string; kind: "score"; homeScore: number; awayScore: number }>;

export default function MatchdayPredictionsForm({
  poolId,
  locale,
  mode,
  matches,
  perfectMatchdayBonusPoints,
}: Readonly<{
  poolId: string;
  locale: string;
  mode: PredictionMode;
  matches: ReadonlyArray<PredictionMatchViewModel>;
  perfectMatchdayBonusPoints: number | null;
}>) {
  const t = useTranslations("predictions");
  const [state, formAction, pending] = useActionState(
    saveMatchdayPredictionsAction,
    initialSaveMatchdayPredictionsState,
  );
  const predictionsFieldRef = useRef<HTMLInputElement>(null);
  const editableMatches = useMemo(
    () => matches.filter((match) => match.canEdit),
    [matches],
  );

  const outcomes = state.status === "completed" ? state.outcomes : null;
  const savedCount = outcomes
    ? Object.values(outcomes).filter((outcome) => outcome.status === "saved").length
    : 0;
  const totalCount = outcomes ? Object.keys(outcomes).length : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const predictions = editableMatches.flatMap<PredictionBatchItem>((match) => {
      if (mode === "simple") {
        const result = formData.get(`result-${match.matchId}`);
        if (typeof result !== "string" || result === "") return [];
        return [{ matchId: match.matchId, kind: "result" as const, result }];
      }
      const homeScore = formData.get(`homeScore-${match.matchId}`);
      const awayScore = formData.get(`awayScore-${match.matchId}`);
      if (
        typeof homeScore !== "string" ||
        typeof awayScore !== "string" ||
        homeScore === "" ||
        awayScore === ""
      ) {
        return [];
      }
      return [
        {
          matchId: match.matchId,
          kind: "score" as const,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        },
      ];
    });

    if (predictionsFieldRef.current) {
      predictionsFieldRef.current.value = JSON.stringify(predictions);
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="poolId" value={poolId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="predictions" ref={predictionsFieldRef} />

      {perfectMatchdayBonusPoints !== null ? (
        <p className="mb-4 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm font-semibold text-success">
          {t("scoring.perfectMatchdayBonus", { points: perfectMatchdayBonusPoints })}
        </p>
      ) : null}

      <ul className="divide-y divide-border">
        {matches.map((match) => (
          <li key={match.matchId} className="py-4">
            <p className="text-center text-[10px] text-muted-foreground sm:text-xs">
              {match.dateLabel} · {match.statusLabel}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <p className="text-center text-sm font-semibold leading-tight sm:text-base">
                {match.homeTeamShortName ?? match.homeTeamName}
              </p>
              <p className="text-center text-sm font-semibold leading-tight sm:text-base">
                {match.awayTeamShortName ?? match.awayTeamName}
              </p>
            </div>

            {match.canEdit ? (
              <fieldset disabled={pending} className="contents">
                {mode === "simple" ? (
                  <ResultOptions match={match} />
                ) : (
                  <ScoreInputs match={match} />
                )}
                {outcomes?.[match.matchId] ? (
                  <MatchOutcome outcome={outcomes[match.matchId]} />
                ) : null}
              </fieldset>
            ) : (
              <div className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <p className="font-semibold text-muted-foreground">
                  {t("status.yourPrediction")}
                </p>
                {match.currentPrediction ? (
                  <p className="mt-1 font-semibold">
                    {match.currentPrediction.kind === "result"
                      ? t(`results.${match.currentPrediction.result}`)
                      : `${match.currentPrediction.homeScore} – ${match.currentPrediction.awayScore}`}
                  </p>
                ) : (
                  <p className="mt-1 text-muted-foreground">{t("status.noPrediction")}</p>
                )}
                {match.lockReason ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`lockReasons.${match.lockReason}`)}
                  </p>
                ) : null}
                {match.pointsEarned !== null ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className={match.pointsEarned > 0 ? "text-success" : "text-muted-foreground"}>
                      {t("scoring.pointsEarned", { points: match.pointsEarned })}
                    </span>
                    {match.wasExactScore ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">
                        {t("scoring.exactScoreBadge")}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>

      {editableMatches.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {pending ? t("form.savingAll") : t("form.saveAll")}
          </button>

          {outcomes ? (
            <p
              role="status"
              aria-live="polite"
              className={
                savedCount === totalCount
                  ? "text-sm font-semibold text-success"
                  : "text-sm font-semibold text-destructive"
              }
            >
              {savedCount === totalCount
                ? t("status.summaryAllSaved")
                : t("status.summaryPartial", { saved: savedCount, total: totalCount })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          {t("status.noEditableMatches")}
        </p>
      )}

      {state.status === "error" ? (
        <p role="alert" aria-live="polite" className="mt-2 text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}

function MatchOutcome({ outcome }: Readonly<{ outcome: PredictionOutcome }>) {
  const t = useTranslations("predictions");
  if (outcome.status === "saved") {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 aria-hidden="true" className="size-4" />
        {t("status.saved")}
      </p>
    );
  }
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
      <AlertCircle aria-hidden="true" className="size-4" />
      {t(`errors.${outcome.error}`)}
    </p>
  );
}

function ResultOptions({ match }: Readonly<{ match: PredictionMatchViewModel }>) {
  const t = useTranslations("predictions");
  const currentResult =
    match.currentPrediction?.kind === "result" ? match.currentPrediction.result : null;

  return (
    <fieldset className="mt-3">
      <legend className="text-xs font-semibold text-muted-foreground">
        {t("a11y.resultGroupLabel", {
          homeTeam: match.homeTeamName,
          awayTeam: match.awayTeamName,
        })}
      </legend>
      <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup">
        {predictionResults.map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              name={`result-${match.matchId}`}
              value={option}
              required
              defaultChecked={currentResult === option}
              className="peer sr-only"
            />
            <span className="block rounded-lg border border-border bg-background px-2 py-2 text-center text-sm font-semibold text-muted-foreground peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/30">
              {t(`results.${option}`)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ScoreInputs({ match }: Readonly<{ match: PredictionMatchViewModel }>) {
  const t = useTranslations("predictions");
  const currentScore =
    match.currentPrediction?.kind === "score" ? match.currentPrediction : null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          {t("form.homeScoreLabel")}
        </label>
        <input
          type="number"
          name={`homeScore-${match.matchId}`}
          min={0}
          max={99}
          step={1}
          inputMode="numeric"
          required
          defaultValue={currentScore?.homeScore}
          aria-label={t("a11y.homeScoreInputLabel", { team: match.homeTeamName })}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-lg font-bold outline-none focus:border-brand focus:ring-2 focus:ring-ring/30"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          {t("form.awayScoreLabel")}
        </label>
        <input
          type="number"
          name={`awayScore-${match.matchId}`}
          min={0}
          max={99}
          step={1}
          inputMode="numeric"
          required
          defaultValue={currentScore?.awayScore}
          aria-label={t("a11y.awayScoreInputLabel", { team: match.awayTeamName })}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-lg font-bold outline-none focus:border-brand focus:ring-2 focus:ring-ring/30"
        />
      </div>
    </div>
  );
}

"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  DEFAULT_PERFECT_MATCHDAY_BONUS_POINTS,
  DEFAULT_POOL_CURRENCY,
  poolCurrencies,
} from "@/features/pools/constants";
import { createPoolAction } from "@/features/pools/actions";
import { createPoolSchema } from "@/features/pools/schemas";
import type {
  CompetitionOption,
  CreatePoolInput,
  PoolCurrency,
  PredictionMode,
  PrizeModel,
} from "@/features/pools/types";
import { initialPoolActionState } from "@/features/pools/types";

type PoolWizardProps = Readonly<{
  competitions: ReadonlyArray<CompetitionOption>;
  creationToken: string;
}>;

type DraftState = Readonly<{
  name: string;
  description: string;
  competitionId: string;
  currency: PoolCurrency;
  hasParticipationFee: boolean;
  participationFee: string;
  prizeModel: PrizeModel;
  prizeMode: "percentage" | "fixed";
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  predictionMode: PredictionMode;
  resultPoints: string;
  exactScorePoints: string;
  perfectMatchdayBonusPoints: string;
}>;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-input px-3.5 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export default function PoolWizard({
  competitions,
  creationToken,
}: PoolWizardProps) {
  const t = useTranslations("pools");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [clientError, setClientError] = useState(false);
  const [state, formAction, pending] = useActionState(
    createPoolAction,
    initialPoolActionState,
  );
  const [draft, setDraft] = useState<DraftState>({
    name: "",
    description: "",
    competitionId: competitions[0]?.id ?? "",
    currency: DEFAULT_POOL_CURRENCY,
    hasParticipationFee: false,
    participationFee: "",
    prizeModel: "first_place",
    prizeMode: "fixed",
    firstPrize: "",
    secondPrize: "",
    thirdPrize: "",
    predictionMode: "mixed",
    resultPoints: "1",
    exactScorePoints: "3",
    perfectMatchdayBonusPoints: String(
      DEFAULT_PERFECT_MATCHDAY_BONUS_POINTS,
    ),
  });

  const configuration = useMemo(
    () => buildConfiguration(draft, creationToken),
    [draft, creationToken],
  );
  const steps = ["general", "financial", "prizes", "prediction", "summary"];

  function updateDraft<Key extends keyof DraftState>(
    key: Key,
    value: DraftState[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setClientError(false);
  }

  function goNext() {
    if (!isStepValid(step, configuration)) {
      setClientError(true);
      return;
    }
    setClientError(false);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-sm font-semibold text-brand">{t("create.eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("create.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("create.subtitle")}
        </p>
      </div>

      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label={t("create.progressLabel")}>
        {steps.map((stepName, index) => (
          <li key={stepName}>
            <button
              type="button"
              onClick={() => index <= step && setStep(index)}
              disabled={index > step || pending}
              aria-current={index === step ? "step" : undefined}
              aria-label={t(`create.steps.${stepName}`)}
              className={`h-2 w-full rounded-full transition ${
                index <= step ? "bg-primary" : "bg-muted"
              } disabled:cursor-default`}
            />
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
        <p className="mb-5 text-sm font-bold text-brand">
          {t("create.stepCount", { current: step + 1, total: steps.length })}
        </p>

        {step === 0 ? (
          <div className="space-y-5">
            <StepHeading title={t("general.title")} body={t("general.body")} />
            <Field label={t("general.name.label")} htmlFor="pool-name">
              <input
                id="pool-name"
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                maxLength={100}
                placeholder={t("general.name.placeholder")}
                className={inputClass}
              />
            </Field>
            <Field label={t("general.description.label")} htmlFor="pool-description">
              <textarea
                id="pool-description"
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                maxLength={500}
                rows={4}
                placeholder={t("general.description.placeholder")}
                className={inputClass}
              />
            </Field>
            <Field label={t("general.competition.label")} htmlFor="pool-competition">
              <select
                id="pool-competition"
                value={draft.competitionId}
                onChange={(event) =>
                  updateDraft("competitionId", event.target.value)
                }
                className={inputClass}
              >
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <StepHeading title={t("financial.title")} body={t("financial.body")} />
            <fieldset>
              <legend className="text-sm font-semibold">{t("financial.type")}</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Choice
                  name="pool-fee-type"
                  checked={!draft.hasParticipationFee}
                  label={t("financial.free")}
                  description={t("financial.freeHelp")}
                  onChange={() => updateDraft("hasParticipationFee", false)}
                />
                <Choice
                  name="pool-fee-type"
                  checked={draft.hasParticipationFee}
                  label={t("financial.paid")}
                  description={t("financial.paidHelp")}
                  onChange={() => updateDraft("hasParticipationFee", true)}
                />
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("financial.currency")} htmlFor="pool-currency">
                <select
                  id="pool-currency"
                  value={draft.currency}
                  onChange={(event) =>
                    updateDraft("currency", event.target.value as PoolCurrency)
                  }
                  className={inputClass}
                >
                  {poolCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </Field>
              {draft.hasParticipationFee ? (
                <Field label={t("financial.amount")} htmlFor="pool-fee">
                  <input
                    id="pool-fee"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.participationFee}
                    onChange={(event) =>
                      updateDraft("participationFee", event.target.value)
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <PrizeStep draft={draft} updateDraft={updateDraft} />
        ) : null}

        {step === 3 ? (
          <PredictionStep draft={draft} updateDraft={updateDraft} />
        ) : null}

        {step === 4 ? (
          <Summary
            configuration={configuration}
            competitionName={
              competitions.find((item) => item.id === draft.competitionId)?.name ?? ""
            }
          />
        ) : null}

        {clientError ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {t("errors.invalid_configuration")}
          </p>
        ) : null}

        {state.status === "error" ? (
          <p
            role="alert"
            aria-live="polite"
            className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {t(`errors.${state.error}`)}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-border pt-5">
          <button
            type="button"
            disabled={step === 0 || pending}
            onClick={() => {
              setClientError(false);
              setStep((current) => Math.max(0, current - 1));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("actions.back")}
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              {t("actions.continue")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <form action={formAction}>
              <input type="hidden" name="locale" value={locale} />
              <input
                type="hidden"
                name="configuration"
                value={JSON.stringify(configuration)}
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Check aria-hidden="true" className="size-4" />
                )}
                {pending ? t("actions.creating") : t("actions.confirmCreate")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function PrizeStep({
  draft,
  updateDraft,
}: Readonly<{
  draft: DraftState;
  updateDraft: <Key extends keyof DraftState>(
    key: Key,
    value: DraftState[Key],
  ) => void;
}>) {
  const t = useTranslations("pools");
  const hasDistribution = draft.prizeModel !== "winner_takes_all";
  const isTopThree = draft.prizeModel === "top_three";
  const valueLabel =
    draft.prizeMode === "percentage" ? t("prizes.percentage") : t("prizes.amount");

  return (
    <div className="space-y-5">
      <StepHeading title={t("prizes.title")} body={t("prizes.body")} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("prizes.model")}</legend>
        {(["winner_takes_all", "first_place", "top_three"] as const).map(
          (model) => (
            <Choice
              key={model}
              name="pool-prize-model"
              checked={draft.prizeModel === model}
              label={t(`prizes.models.${model}.label`)}
              description={t(`prizes.models.${model}.description`)}
              onChange={() => updateDraft("prizeModel", model)}
            />
          ),
        )}
      </fieldset>

      {hasDistribution ? (
        <>
          <fieldset>
            <legend className="text-sm font-semibold">{t("prizes.mode")}</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["percentage", "fixed"] as const).map((mode) => (
                <Choice
                  key={mode}
                  name="pool-prize-mode"
                  checked={draft.prizeMode === mode}
                  label={t(`prizes.modes.${mode}`)}
                  description={t(`prizes.modeHelp.${mode}`)}
                  onChange={() => updateDraft("prizeMode", mode)}
                />
              ))}
            </div>
          </fieldset>
          <div className={`grid gap-4 ${isTopThree ? "sm:grid-cols-3" : ""}`}>
            <PrizeInput
              id="first-prize"
              label={isTopThree ? t("prizes.first") : valueLabel}
              value={draft.firstPrize}
              onChange={(value) => updateDraft("firstPrize", value)}
              percentage={draft.prizeMode === "percentage"}
            />
            {isTopThree ? (
              <>
                <PrizeInput
                  id="second-prize"
                  label={t("prizes.second")}
                  value={draft.secondPrize}
                  onChange={(value) => updateDraft("secondPrize", value)}
                  percentage={draft.prizeMode === "percentage"}
                />
                <PrizeInput
                  id="third-prize"
                  label={t("prizes.third")}
                  value={draft.thirdPrize}
                  onChange={(value) => updateDraft("thirdPrize", value)}
                  percentage={draft.prizeMode === "percentage"}
                />
              </>
            ) : null}
          </div>
          {draft.prizeMode === "percentage" ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("prizes.remainderHelp")}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function PredictionStep({
  draft,
  updateDraft,
}: Readonly<{
  draft: DraftState;
  updateDraft: <Key extends keyof DraftState>(
    key: Key,
    value: DraftState[Key],
  ) => void;
}>) {
  const t = useTranslations("pools");

  return (
    <div className="space-y-5">
      <StepHeading title={t("prediction.title")} body={t("prediction.body")} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("prediction.mode")}</legend>
        {(["simple", "score", "mixed"] as const).map((mode) => (
          <Choice
            key={mode}
            name="pool-prediction-mode"
            checked={draft.predictionMode === mode}
            label={t(`prediction.modes.${mode}.label`)}
            description={t(`prediction.modes.${mode}.description`)}
            onChange={() => updateDraft("predictionMode", mode)}
          />
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {draft.predictionMode !== "score" ? (
          <PointsInput
            id="result-points"
            label={t("prediction.resultPoints")}
            value={draft.resultPoints}
            onChange={(value) => updateDraft("resultPoints", value)}
          />
        ) : null}
        {draft.predictionMode !== "simple" ? (
          <PointsInput
            id="score-points"
            label={t("prediction.exactScorePoints")}
            value={draft.exactScorePoints}
            onChange={(value) => updateDraft("exactScorePoints", value)}
          />
        ) : null}
        {draft.predictionMode === "mixed" ? (
          <PointsInput
            id="bonus-points"
            label={t("prediction.perfectMatchdayBonusPoints")}
            value={draft.perfectMatchdayBonusPoints}
            onChange={(value) =>
              updateDraft("perfectMatchdayBonusPoints", value)
            }
          />
        ) : null}
      </div>
      {draft.predictionMode === "mixed" ? (
        <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
          {t("prediction.mixedExplanation")}
        </p>
      ) : null}
    </div>
  );
}

function Summary({
  configuration,
  competitionName,
}: Readonly<{
  configuration: CreatePoolInput;
  competitionName: string;
}>) {
  const t = useTranslations("pools");
  const locale = useLocale();
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: configuration.financial.currency,
    currencyDisplay: "code",
  });
  const distribution = describePrize(configuration, currencyFormatter, {
    fullPool: t("summary.fullPool"),
    positions: [
      t("prizes.positions.1"),
      t("prizes.positions.2"),
      t("prizes.positions.3"),
    ],
  });
  const points =
    configuration.prediction.mode === "mixed"
      ? t("summary.mixedExplanation", {
          result: configuration.prediction.resultPoints,
          score: configuration.prediction.exactScorePoints,
          bonus: configuration.prediction.perfectMatchdayBonusPoints,
        })
      : configuration.prediction.mode === "simple"
        ? t("summary.simplePoints", {
            result: configuration.prediction.resultPoints,
          })
        : t("summary.scorePoints", {
            score: configuration.prediction.exactScorePoints,
          });
  const rows = [
    [t("general.name.label"), configuration.name],
    [t("general.description.label"), configuration.description || t("summary.none")],
    [t("general.competition.label"), competitionName],
    [
      t("summary.participation"),
      configuration.financial.participationFee.enabled
        ? currencyFormatter.format(
            Number(configuration.financial.participationFee.amount),
          )
        : t("financial.free"),
    ],
    [t("prizes.model"), t(`prizes.models.${configuration.prize.model}.label`)],
    [t("summary.distribution"), distribution],
    [
      t("prediction.mode"),
      t(`prediction.modes.${configuration.prediction.mode}.label`),
    ],
    [t("summary.points"), points],
  ];

  return (
    <div>
      <StepHeading title={t("summary.title")} body={t("summary.body")} />
      <dl className="mt-5 divide-y divide-border rounded-xl border border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl bg-brand/5 p-4 text-sm leading-relaxed text-muted-foreground">
        {configuration.prediction.mode === "mixed"
          ? t("prediction.mixedExplanation")
          : t(`summary.${configuration.prediction.mode}Explanation`)}
      </div>
    </div>
  );
}

function StepHeading({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: Readonly<{ label: string; htmlFor: string; children: React.ReactNode }>) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function Choice({
  name,
  checked,
  label,
  description,
  onChange,
}: Readonly<{
  name: string;
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}>) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${
        checked ? "border-brand bg-brand/5" : "border-border bg-card"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-primary"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function PrizeInput({
  id,
  label,
  value,
  onChange,
  percentage,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  percentage: boolean;
}>) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="number"
          min="0.01"
          max={percentage ? "100" : undefined}
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.00"
          className={inputClass}
        />
        {percentage ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        ) : null}
      </div>
    </Field>
  );
}

function PointsInput({
  id,
  label,
  value,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="number"
        min="1"
        max="32767"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function buildConfiguration(
  draft: DraftState,
  creationToken: string,
): CreatePoolInput {
  const financial: CreatePoolInput["financial"] = {
    currency: draft.currency,
    participationFee: draft.hasParticipationFee
      ? { enabled: true, amount: draft.participationFee }
      : { enabled: false },
  };
  let prize: CreatePoolInput["prize"];

  if (draft.prizeModel === "winner_takes_all") {
    prize = { model: "winner_takes_all" };
  } else if (draft.prizeModel === "first_place") {
    prize = {
      model: "first_place",
      distribution:
        draft.prizeMode === "percentage"
          ? { mode: "percentage", percentage: draft.firstPrize }
          : { mode: "fixed", amount: draft.firstPrize },
    };
  } else {
    prize = {
      model: "top_three",
      distribution: {
        mode: draft.prizeMode,
        first: draft.firstPrize,
        second: draft.secondPrize,
        third: draft.thirdPrize,
      },
    } as CreatePoolInput["prize"];
  }

  let prediction: CreatePoolInput["prediction"];
  if (draft.predictionMode === "simple") {
    prediction = { mode: "simple", resultPoints: Number(draft.resultPoints) };
  } else if (draft.predictionMode === "score") {
    prediction = {
      mode: "score",
      exactScorePoints: Number(draft.exactScorePoints),
    };
  } else {
    prediction = {
      mode: "mixed",
      resultPoints: Number(draft.resultPoints),
      exactScorePoints: Number(draft.exactScorePoints),
      perfectMatchdayBonusPoints: Number(draft.perfectMatchdayBonusPoints),
    };
  }

  return {
    creationToken,
    competitionId: draft.competitionId,
    name: draft.name,
    description: draft.description,
    financial,
    prize,
    prediction,
  };
}

function isStepValid(step: number, configuration: CreatePoolInput): boolean {
  if (step === 0) {
    return (
      configuration.name.trim().length >= 3 &&
      configuration.name.trim().length <= 100 &&
      (configuration.description?.trim().length ?? 0) <= 500 &&
      Boolean(configuration.competitionId)
    );
  }
  if (step === 1) {
    return configuration.financial.participationFee.enabled
      ? /^\d{1,13}(?:\.\d{1,2})?$/.test(
          configuration.financial.participationFee.amount,
        ) && Number(configuration.financial.participationFee.amount) > 0
      : true;
  }
  if (step === 2 || step === 3) {
    return createPoolSchema.safeParse(configuration).success;
  }
  return true;
}

function describePrize(
  configuration: CreatePoolInput,
  currencyFormatter: Intl.NumberFormat,
  labels: Readonly<{
    fullPool: string;
    positions: readonly [string, string, string];
  }>,
): string {
  if (configuration.prize.model === "winner_takes_all") {
    return labels.fullPool;
  }
  if (configuration.prize.model === "first_place") {
    const { distribution } = configuration.prize;
    return distribution.mode === "percentage"
      ? `${distribution.percentage}%`
      : currencyFormatter.format(Number(distribution.amount));
  }
  const { distribution } = configuration.prize;
  const formatValue = (value: string) =>
    distribution.mode === "percentage"
      ? `${value}%`
      : currencyFormatter.format(Number(value));
  return [distribution.first, distribution.second, distribution.third]
    .map(
      (value, index) =>
        `${labels.positions[index]}: ${formatValue(value)}`,
    )
    .join(" · ");
}

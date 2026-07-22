import { CalendarDays, CheckCircle2, Shield, Trophy, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  formatMinorCurrency,
  formatPercentage,
} from "@/features/pools/format";
import type {
  PoolDetail as PoolDetailDto,
  PoolPredictionDetails,
  PoolPrizeDetails,
} from "@/features/pools/types";

import InvitationCode from "./invitation-code";

type PoolDetailProps = Readonly<{
  pool: PoolDetailDto;
  locale: string;
  created: boolean;
}>;

export default async function PoolDetail({
  pool,
  locale,
  created,
}: PoolDetailProps) {
  const t = await getTranslations("pools");

  return (
    <section>
      {created ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-foreground">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-bold">{t("detail.createdTitle")}</p>
            <p className="mt-0.5 text-muted-foreground">{t("detail.createdBody")}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand">
            {pool.competitionName}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {pool.name}
          </h1>
          {pool.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {pool.description}
            </p>
          ) : null}
        </div>
        <span className="w-fit rounded-full bg-brand/10 px-3 py-1.5 text-sm font-bold text-brand">
          {t(`roles.${pool.currentUserRole}`)}
        </span>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Users aria-hidden="true" className="size-5" />}
          label={t("detail.members")}
          value={String(pool.memberCount)}
        />
        <Stat
          icon={<Trophy aria-hidden="true" className="size-5" />}
          label={t("detail.participationFee")}
          value={
            pool.participationFeeMinor === null
              ? t("financial.free")
              : formatMinorCurrency(locale, pool.currency, pool.participationFeeMinor)
          }
        />
        <Stat
          icon={<CalendarDays aria-hidden="true" className="size-5" />}
          label={t("detail.createdAt")}
          value={new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(pool.createdAt),
          )}
        />
      </div>

      {pool.invitationCode ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-bold">{t("detail.invitation.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("detail.invitation.body")}
          </p>
          <div className="mt-4">
            <InvitationCode
              code={pool.invitationCode}
              copyLabel={t("detail.invitation.copy")}
              copiedLabel={t("detail.invitation.copied")}
            />
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-bold">{t("detail.prizesTitle")}</h2>
          <PrizeDescription prize={pool.prize} pool={pool} locale={locale} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-bold">{t("detail.predictionTitle")}</h2>
          <PredictionDescription prediction={pool.prediction} />
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Users aria-hidden="true" className="size-5 text-brand" />
          <h2 className="text-lg font-bold">{t("detail.memberListTitle")}</h2>
        </div>
        {pool.members.length < pool.memberCount ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("detail.memberListSummary", {
              total: pool.memberCount,
              visible: pool.members.length,
            })}
          </p>
        ) : null}
        <ul className="mt-4 divide-y divide-border">
          {pool.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {(member.displayName?.slice(0, 1) ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {member.displayName ?? t("detail.unnamedMember")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("detail.joinedAt", {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(member.joinedAt)),
                    })}
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                {member.role === "pool_admin" ? (
                  <Shield aria-hidden="true" className="size-3.5 text-brand" />
                ) : null}
                {t(`roles.${member.role}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

async function PrizeDescription({
  prize,
  pool,
  locale,
}: Readonly<{
  prize: PoolPrizeDetails;
  pool: PoolDetailDto;
  locale: string;
}>) {
  const t = await getTranslations("pools");

  if (prize.model === "winner_takes_all") {
    return (
      <div className="mt-3">
        <p className="font-semibold">{t("prizes.models.winner_takes_all.label")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("detail.currentPrize", {
            amount: formatMinorCurrency(
              locale,
              pool.currency,
              prize.currentAmountMinor,
            ),
          })}
        </p>
      </div>
    );
  }

  let allocations: Array<{
    position: 1 | 2 | 3;
    label: string;
    amount: string | null;
  }>;

  if (prize.model === "first_place") {
    allocations = [
      prize.distribution.mode === "percentage"
        ? {
            position: 1,
            label: formatPercentage(
              locale,
              prize.distribution.percentageBasisPoints,
            ),
            amount: prize.distribution.currentAmountMinor,
          }
        : {
            position: 1,
            label: formatMinorCurrency(
              locale,
              pool.currency,
              prize.distribution.amountMinor,
            ),
            amount: null,
          },
    ];
  } else if (prize.distribution.mode === "percentage") {
    allocations = prize.distribution.allocations.map((allocation) => ({
      position: allocation.position,
      label: formatPercentage(locale, allocation.percentageBasisPoints),
      amount: allocation.currentAmountMinor,
    }));
  } else {
    allocations = prize.distribution.allocations.map((allocation) => ({
      position: allocation.position,
      label: formatMinorCurrency(locale, pool.currency, allocation.amountMinor),
      amount: null,
    }));
  }

  return (
    <div className="mt-3">
      <p className="font-semibold">{t(`prizes.models.${prize.model}.label`)}</p>
      <ul className="mt-3 space-y-2">
        {allocations.map((allocation) => (
          <li
            key={allocation.position}
            className="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2 text-sm"
          >
            <span>{t(`prizes.positions.${allocation.position}`)}</span>
            <span className="text-right font-bold">
              {allocation.label}
              {allocation.amount !== null
                ? ` · ${formatMinorCurrency(locale, pool.currency, allocation.amount)}`
                : ""}
            </span>
          </li>
        ))}
      </ul>
      {prize.distribution.mode === "percentage" ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("prizes.remainderHelp")}
        </p>
      ) : null}
    </div>
  );
}

async function PredictionDescription({
  prediction,
}: Readonly<{ prediction: PoolPredictionDetails }>) {
  const t = await getTranslations("pools");

  return (
    <div className="mt-3">
      <p className="font-semibold">{t(`prediction.modes.${prediction.mode}.label`)}</p>
      <dl className="mt-3 space-y-2 text-sm">
        {prediction.mode !== "score" ? (
          <RuleRow
            label={t("prediction.resultPoints")}
            value={String(prediction.resultPoints)}
          />
        ) : null}
        {prediction.mode !== "simple" ? (
          <RuleRow
            label={t("prediction.exactScorePoints")}
            value={String(prediction.exactScorePoints)}
          />
        ) : null}
        {prediction.mode === "mixed" ? (
          <RuleRow
            label={t("prediction.perfectMatchdayBonusPoints")}
            value={String(prediction.perfectMatchdayBonusPoints)}
          />
        ) : null}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t(`detail.predictionExplanation.${prediction.mode}`)}
      </p>
    </div>
  );
}

function RuleRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-muted px-3 py-2">
      <dt>{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-brand">{icon}</div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

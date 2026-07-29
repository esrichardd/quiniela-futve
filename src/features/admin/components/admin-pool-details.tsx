import { ArrowLeft, Mail, UserRound, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocalDateTime from "@/components/local-date-time";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { AdminPoolDetails } from "@/server/dal/admin-dashboard";

type AdminPoolDetailsProps = Readonly<{
  locale: Locale;
  pool: AdminPoolDetails;
}>;

export default async function AdminPoolDetailsView({
  locale,
  pool,
}: AdminPoolDetailsProps) {
  const [admin, pools] = await Promise.all([
    getTranslations("admin"),
    getTranslations("pools"),
  ]);

  return (
    <section>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {admin("details.back")}
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand">
            {pool.competitionName} · {pool.seasonName}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {pool.name}
          </h1>
          {pool.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {pool.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-brand/10 px-3 py-1.5 text-brand">
            {pools(`prediction.modes.${pool.predictionMode}.label`)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5">
            {pools(`prizes.models.${pool.prizeModel}.label`)}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-5 text-brand" />
            <h2 className="text-lg font-bold">{admin("details.creatorTitle")}</h2>
          </div>
          <div className="mt-5 rounded-xl bg-muted p-4">
            <UserIdentity
              displayName={pool.creator.displayName}
              email={pool.creator.email}
              unknownLabel={admin("details.unknownUser")}
              unavailableLabel={admin("details.emailUnavailable")}
            />
          </div>
          <dl className="mt-5 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border py-3">
              <dt className="text-muted-foreground">{admin("details.created")}</dt>
              <dd className="font-semibold">
                <LocalDateTime
                  iso={pool.createdAt.toISOString()}
                  locale={locale}
                  dateStyle="medium"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{admin("details.memberCount")}</dt>
              <dd className="font-semibold">{pool.members.length}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Users aria-hidden="true" className="size-5 text-brand" />
            <h2 className="text-lg font-bold">{admin("details.membersTitle")}</h2>
          </div>
          {pool.members.length > 0 ? (
            <ul className="mt-5 divide-y divide-border">
              {pool.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <UserIdentity
                    displayName={member.displayName}
                    email={member.email}
                    unknownLabel={admin("details.unknownUser")}
                    unavailableLabel={admin("details.emailUnavailable")}
                  />
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      {pools(`roles.${member.role}`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {admin("details.joined")}{" "}
                      <LocalDateTime
                        iso={member.joinedAt.toISOString()}
                        locale={locale}
                        dateStyle="medium"
                      />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              {admin("details.emptyMembers")}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function UserIdentity({
  displayName,
  email,
  unknownLabel,
  unavailableLabel,
}: Readonly<{
  displayName: string | null;
  email: string | null;
  unknownLabel: string;
  unavailableLabel: string;
}>) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
        {(displayName?.slice(0, 1) ?? email?.slice(0, 1) ?? "?").toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{displayName ?? unknownLabel}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Mail aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{email ?? unavailableLabel}</span>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { joinPoolAction } from "@/features/pools/actions";
import { initialPoolActionState } from "@/features/pools/types";

export default function JoinPoolForm() {
  const t = useTranslations("pools");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState(
    joinPoolAction,
    initialPoolActionState,
  );

  return (
    <section className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Ticket aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{t("join.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("join.body")}
        </p>

        <form action={formAction} className="mt-6">
          <input type="hidden" name="locale" value={locale} />
          <label htmlFor="invitation-code" className="text-sm font-semibold">
            {t("join.codeLabel")}
          </label>
          <input
            id="invitation-code"
            name="code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.toUpperCase().replace(/\s/g, ""))
            }
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={6}
            placeholder={t("join.codePlaceholder")}
            disabled={pending}
            className="mt-2 w-full rounded-xl border border-border bg-input px-4 py-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-ring/30"
          />

          {state.status === "error" ? (
            <p
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {t(`errors.${state.error}`)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || code.length !== 6}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Ticket aria-hidden="true" className="size-4" />
            )}
            {pending ? t("join.submitting") : t("join.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

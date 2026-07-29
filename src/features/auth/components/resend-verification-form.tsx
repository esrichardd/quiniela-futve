"use client";

import { useActionState, useState } from "react";
import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { resendVerificationEmailAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";

export default function ResendVerificationForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    resendVerificationEmailAction,
    initialAuthFormState,
  );

  return (
    <section className="auth-card w-full rounded-2xl p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Mail aria-hidden="true" className="mx-auto mb-4 size-7 text-brand" />
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {t("verifyEmailResend.title")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("verifyEmailResend.subtitle")}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label
            htmlFor="resend-verification-email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.email.label")}
          </label>
          <input
            id="resend-verification-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("fields.email.placeholder")}
            className="auth-input rounded-xl px-4 py-3 text-base outline-none"
          />
        </div>

        {state.status === "error" ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {t(`errors.${state.error}`)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="auth-btn-glow w-full rounded-xl py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? t("verifyEmailResend.submitting")
            : t("verifyEmailResend.submit")}
        </button>
      </form>
    </section>
  );
}

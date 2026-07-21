"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { signInAction } from "@/features/auth/actions";
import {
  initialAuthFormState,
  type AuthFormErrorCode,
  type AuthFormState,
} from "@/features/auth/types";
import { Link } from "@/i18n/navigation";

import { AuthBrandMark } from "./auth-brand-mark";
import { GoogleIcon } from "./google-icon";

type LoginFormProps = Readonly<{
  initialError?: AuthFormErrorCode;
}>;

export default function LoginForm({ initialError }: LoginFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialState: AuthFormState = initialError
    ? { status: "error", error: initialError }
    : initialAuthFormState;
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <section className="auth-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="mb-8 text-center">
        <AuthBrandMark className="mx-auto mb-4 size-12 rounded-xl" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("login.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("login.subtitle")}
        </p>
      </div>

      <button
        type="button"
        disabled
        className="auth-secondary-button mb-6 flex w-full cursor-not-allowed flex-wrap items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GoogleIcon />
        <span>{t("login.google")}</span>
        <span className="rounded-full border border-border bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("shared.comingSoon")}
        </span>
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="auth-divider-line h-px flex-1" />
        <span className="text-xs text-subtle-text">
          {t("shared.divider")}
        </span>
        <div className="auth-divider-line h-px flex-1" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.email.label")}
          </label>
          <input
            id="login-email"
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

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-foreground"
            >
              {t("fields.password.label")}
            </label>
            <Link
              href="/forgot-password"
              className="auth-link text-xs font-medium"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={pending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("login.passwordPlaceholder")}
              className="auth-input rounded-xl px-4 py-3 pr-11 text-base outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={pending}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle-text transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={
                showPassword
                  ? t("shared.hidePassword")
                  : t("shared.showPassword")
              }
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
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
          className="auth-btn-glow mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="auth-link font-semibold">
          {t("login.createAccount")}
        </Link>
      </p>
    </section>
  );
}

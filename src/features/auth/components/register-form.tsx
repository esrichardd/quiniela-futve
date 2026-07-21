"use client";

import type { ChangeEvent } from "react";
import { useActionState, useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { signUpAction } from "@/features/auth/actions";
import {
  evaluatePassword,
  PASSWORD_INPUT_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/password-policy";
import { initialAuthFormState } from "@/features/auth/types";
import { Link } from "@/i18n/navigation";

import { AuthBrandMark } from "./auth-brand-mark";
import { GoogleIcon } from "./google-icon";

type RegisterFormState = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}>;

const initialFormState: RegisterFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialAuthFormState,
  );

  const passwordChecks = useMemo(
    () => evaluatePassword(form.password),
    [form.password],
  );

  const passwordScore = passwordChecks.filter((check) => check.ok).length;
  const passwordMatch = Boolean(
    form.confirmPassword && form.password === form.confirmPassword,
  );
  const passwordMismatch = Boolean(
    form.confirmPassword && form.password !== form.confirmPassword,
  );

  function handleChange(field: keyof RegisterFormState) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  const strengthLabel =
    passwordScore === 3
      ? t("register.strength.strong")
      : passwordScore === 2
        ? t("register.strength.medium")
        : t("register.strength.weak");
  const strengthClass =
    passwordScore === 3
      ? "auth-strength-strong"
      : passwordScore === 2
        ? "auth-strength-medium"
        : "auth-strength-weak";

  return (
    <section className="auth-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="mb-7 text-center">
        <AuthBrandMark className="mx-auto mb-4 size-12 rounded-xl" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("register.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("register.subtitle")}
        </p>
      </div>

      <button
        type="button"
        disabled
        className="auth-secondary-button mb-5 flex w-full cursor-not-allowed flex-wrap items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GoogleIcon />
        <span>{t("register.google")}</span>
        <span className="rounded-full border border-border bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("shared.comingSoon")}
        </span>
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="auth-divider-line h-px flex-1" />
        <span className="text-xs text-subtle-text">{t("shared.divider")}</span>
        <div className="auth-divider-line h-px flex-1" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="register-first-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("fields.firstName.label")}
            </label>
            <input
              id="register-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              disabled={pending}
              value={form.firstName}
              onChange={handleChange("firstName")}
              placeholder={t("fields.firstName.placeholder")}
              className="auth-input rounded-xl px-3 py-3 text-base outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="register-last-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("fields.lastName.label")}
            </label>
            <input
              id="register-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              disabled={pending}
              value={form.lastName}
              onChange={handleChange("lastName")}
              placeholder={t("fields.lastName.placeholder")}
              className="auth-input rounded-xl px-3 py-3 text-base outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.email.label")}
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            value={form.email}
            onChange={handleChange("email")}
            placeholder={t("fields.email.placeholder")}
            className="auth-input rounded-xl px-4 py-3 text-base outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.password.label")}
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={pending}
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              pattern={PASSWORD_INPUT_PATTERN}
              title={t("register.passwordTitle")}
              value={form.password}
              onChange={handleChange("password")}
              placeholder={t("register.passwordPlaceholder")}
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

          {form.password ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index < passwordScore
                        ? strengthClass
                        : "auth-strength-track"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {strengthLabel}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {passwordChecks.map((check) => (
                  <span
                    key={check.key}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      check.ok ? "text-brand" : "text-subtle-text"
                    }`}
                  >
                    {check.ok ? (
                      <Check aria-hidden="true" className="size-3.5" />
                    ) : null}
                    {t(`register.rules.${check.key}`)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-confirm-password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.confirmPassword.label")}
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={pending}
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder={t("fields.confirmPassword.placeholder")}
              aria-invalid={passwordMismatch}
              className={`auth-input rounded-xl px-4 py-3 pr-11 text-base outline-none ${
                passwordMismatch
                  ? "auth-input-error"
                  : passwordMatch
                    ? "auth-input-success"
                    : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((current) => !current)}
              disabled={pending}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle-text transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={
                showConfirm
                  ? t("shared.hidePassword")
                  : t("shared.showPassword")
              }
            >
              {showConfirm ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          {passwordMismatch ? (
            <p className="mt-1.5 text-xs text-live">
              {t("register.passwordMismatch")}
            </p>
          ) : null}
          {passwordMatch ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-brand">
              <Check aria-hidden="true" className="size-3.5" />
              {t("register.passwordMatch")}
            </p>
          ) : null}
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
          className="auth-btn-glow mt-1 w-full rounded-xl py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          disabled={passwordMismatch || pending}
        >
          {pending ? t("register.submitting") : t("register.submit")}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-subtle-text">
        {t("register.terms")}{" "}
        <button type="button" className="auth-link underline underline-offset-2">
          {t("register.termsLink")}
        </button>{" "}
        {t("register.and")}{" "}
        <button type="button" className="auth-link underline underline-offset-2">
          {t("register.privacyLink")}
        </button>
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link href="/login" className="auth-link font-semibold">
          {t("register.signIn")}
        </Link>
      </p>
    </section>
  );
}

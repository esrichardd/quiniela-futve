"use client";

import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { resetPasswordAction } from "@/features/auth/actions";
import {
  PASSWORD_INPUT_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/password-policy";
import { initialAuthFormState } from "@/features/auth/types";

type ResetPasswordFormProps = Readonly<{
  token: string;
}>;

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialAuthFormState,
  );
  const passwordMismatch = Boolean(
    confirmPassword && password !== confirmPassword,
  );
  const passwordMatch = Boolean(
    confirmPassword && password === confirmPassword,
  );

  return (
    <section className="auth-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="mb-8 text-center">
        <div className="auth-icon-badge mx-auto mb-6 size-14 rounded-2xl">
          <KeyRound aria-hidden="true" className="size-7" strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("resetPassword.title")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("resetPassword.subtitle")}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />

        <div>
          <label
            htmlFor="reset-password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("resetPassword.newPassword")}
          </label>
          <div className="relative">
            <input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={pending}
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              pattern={PASSWORD_INPUT_PATTERN}
              title={t("register.passwordTitle")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("resetPassword.passwordPlaceholder")}
              className="auth-input rounded-xl px-4 py-3 pr-11 text-base outline-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowPassword((current) => !current)}
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
          <p className="mt-1.5 text-xs text-subtle-text">
            {t("register.passwordTitle")}
          </p>
        </div>

        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.confirmPassword.label")}
          </label>
          <div className="relative">
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={pending}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
              disabled={pending}
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle-text transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={
                showConfirmPassword
                  ? t("shared.hidePassword")
                  : t("shared.showPassword")
              }
            >
              {showConfirmPassword ? (
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
          disabled={passwordMismatch || pending}
          className="auth-btn-glow mt-2 w-full rounded-xl py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? t("resetPassword.submitting")
            : t("resetPassword.submit")}
        </button>
      </form>
    </section>
  );
}

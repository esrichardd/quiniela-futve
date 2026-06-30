"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/forgot-password/sent");
  }

  return (
    <section className="auth-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="mb-8 text-center">
        <div className="auth-icon-badge mx-auto mb-6 size-14 rounded-2xl">
          <Mail aria-hidden="true" className="size-7" strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("forgotPassword.title")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("forgotPassword.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="forgot-password-email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("fields.email.label")}
          </label>
          <input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("fields.email.placeholder")}
            className="auth-input rounded-xl px-4 py-3 text-base outline-none"
          />
        </div>

        <button
          type="submit"
          className="auth-btn-glow mt-2 w-full rounded-xl py-3 text-sm font-bold"
        >
          {t("forgotPassword.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="auth-link font-semibold">
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </section>
  );
}

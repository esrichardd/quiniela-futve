import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import AuthStatusCard from "@/features/auth/components/auth-status-card";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import { isLocale } from "@/i18n/routing";

type ResetPasswordPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    token?: string | string[];
  }>;
}>;

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("resetPassword.metadata.title"),
    description: t("resetPassword.metadata.description"),
  };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const common = await getTranslations("common");
  const { error, token } = await searchParams;
  const validToken =
    error === undefined && typeof token === "string" && token.length > 0
      ? token
      : null;

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      {validToken ? (
        <ResetPasswordForm token={validToken} />
      ) : (
        <AuthStatusCard
          title={t("resetPassword.invalid.title")}
          subtitle={t("resetPassword.invalid.subtitle")}
          note={t("resetPassword.invalid.note")}
          actionLabel={t("resetPassword.invalid.action")}
          actionHref="/forgot-password"
          icon={CircleAlert}
        />
      )}
    </AuthLayout>
  );
}

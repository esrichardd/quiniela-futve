import type { Metadata } from "next";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import AuthStatusCard from "@/features/auth/components/auth-status-card";
import { isLocale } from "@/i18n/routing";

type VerifyEmailResultPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
  }>;
}>;

export async function generateMetadata({
  params,
}: VerifyEmailResultPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("verifyEmailResult.metadata.title"),
    description: t("verifyEmailResult.metadata.description"),
  };
}

export default async function VerifyEmailResultPage({
  params,
  searchParams,
}: VerifyEmailResultPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const common = await getTranslations("common");
  const { error } = await searchParams;
  const verificationFailed = error !== undefined;

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <AuthStatusCard
        title={
          verificationFailed
            ? t("verifyEmailResult.error.title")
            : t("verifyEmailResult.success.title")
        }
        subtitle={
          verificationFailed
            ? t("verifyEmailResult.error.subtitle")
            : t("verifyEmailResult.success.subtitle")
        }
        note={
          verificationFailed
            ? t("verifyEmailResult.error.note")
            : t("verifyEmailResult.success.note")
        }
        actionLabel={t("verifyEmailResult.action")}
        actionHref="/login"
        icon={verificationFailed ? CircleAlert : BadgeCheck}
      />
    </AuthLayout>
  );
}

import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import AuthStatusCard from "@/features/auth/components/auth-status-card";
import { isLocale } from "@/i18n/routing";

type VerifyEmailSentPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: VerifyEmailSentPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("verifyEmailSent.metadata.title"),
    description: t("verifyEmailSent.metadata.description"),
  };
}

export default async function VerifyEmailSentPage({
  params,
}: VerifyEmailSentPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <AuthStatusCard
        title={t("verifyEmailSent.title")}
        subtitle={t("verifyEmailSent.subtitle")}
        note={t("verifyEmailSent.note")}
        actionLabel={t("verifyEmailSent.action")}
        actionHref="/login"
        icon={MailCheck}
      />
    </AuthLayout>
  );
}

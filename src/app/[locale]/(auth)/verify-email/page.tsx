import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import AuthStatusCard from "@/features/auth/components/auth-status-card";
import { isLocale } from "@/i18n/routing";

type VerifyEmailPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("verifyEmail.metadata.title"),
    description: t("verifyEmail.metadata.description"),
  };
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
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
        title={t("verifyEmail.title")}
        subtitle={t("verifyEmail.subtitle")}
        note={t("verifyEmail.note")}
        actionLabel={t("verifyEmail.action")}
        actionHref="/login"
        icon={BadgeCheck}
      />
    </AuthLayout>
  );
}

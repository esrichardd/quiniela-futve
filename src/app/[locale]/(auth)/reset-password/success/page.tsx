import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import AuthStatusCard from "@/features/auth/components/auth-status-card";
import { isLocale } from "@/i18n/routing";

type ResetPasswordSuccessPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: ResetPasswordSuccessPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("resetPasswordSuccess.metadata.title"),
    description: t("resetPasswordSuccess.metadata.description"),
  };
}

export default async function ResetPasswordSuccessPage({
  params,
}: ResetPasswordSuccessPageProps) {
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
        title={t("resetPasswordSuccess.title")}
        subtitle={t("resetPasswordSuccess.subtitle")}
        note={t("resetPasswordSuccess.note")}
        actionLabel={t("resetPasswordSuccess.action")}
        actionHref="/login"
        icon={BadgeCheck}
      />
    </AuthLayout>
  );
}

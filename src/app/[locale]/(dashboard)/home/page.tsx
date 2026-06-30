import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import DashboardHome from "@/features/dashboard/components/dashboard-home";
import { isLocale } from "@/i18n/routing";

type DashboardHomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: DashboardHomePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "dashboard" });

  return {
    title: t("home.metadata.title"),
    description: t("home.metadata.description"),
  };
}

export default async function DashboardHomePage({
  params,
}: DashboardHomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const common = await getTranslations("common");

  return (
    <DashboardHome
      homeLabel={common("navigation.home")}
      eyebrow={t("home.eyebrow")}
      title={t("home.title")}
      subtitle={t("home.subtitle")}
      statusTitle={t("home.statusTitle")}
      statusBody={t("home.statusBody")}
      primaryStatLabel={t("home.primaryStatLabel")}
      primaryStatValue={t("home.primaryStatValue")}
      secondaryStatLabel={t("home.secondaryStatLabel")}
      secondaryStatValue={t("home.secondaryStatValue")}
    />
  );
}

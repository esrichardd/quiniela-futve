import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import DashboardHome from "@/features/dashboard/components/dashboard-home";
import DashboardShell from "@/features/dashboard/components/dashboard-shell";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { listCurrentUserPools } from "@/server/services/pools";

export const dynamic = "force-dynamic";

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

  await requireDashboardUser(locale);

  const pools = await listCurrentUserPools();

  return (
    <DashboardShell>
      <DashboardHome locale={locale} pools={pools} />
    </DashboardShell>
  );
}

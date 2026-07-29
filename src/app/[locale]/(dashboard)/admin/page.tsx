import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AdminOverview from "@/features/admin/components/admin-overview";
import { isLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/server/auth/admin";
import { getAdminDashboardMetrics } from "@/server/services/admin-dashboard";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  await requirePlatformAdmin(locale);
  const metrics = await getAdminDashboardMetrics();

  return <AdminOverview locale={locale} metrics={metrics} />;
}

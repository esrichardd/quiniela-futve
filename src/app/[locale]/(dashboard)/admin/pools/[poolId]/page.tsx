import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AdminPoolDetailsView from "@/features/admin/components/admin-pool-details";
import { isLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/server/auth/admin";
import { getAdminPoolDetails } from "@/server/dal/admin-dashboard";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string; poolId: string }>;
}>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: t("details.metadata.title"),
    description: t("details.metadata.description"),
  };
}

export default async function AdminPoolDetailsPage({ params }: PageProps) {
  const { locale, poolId } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  await requirePlatformAdmin(locale);
  const pool = await getAdminPoolDetails(poolId);

  if (!pool) notFound();

  return <AdminPoolDetailsView locale={locale} pool={pool} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AdminCompetitions from "@/features/competition-catalog/components/admin-competitions";
import { isLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/server/auth/admin";
import { listAdminCompetitions } from "@/server/services/competition-catalog";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "competitionCatalog" });
  return { title: t("metadata.admin.title"), description: t("metadata.admin.description") };
}

export default async function AdminCompetitionsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requirePlatformAdmin(locale);
  const competitions = await listAdminCompetitions();
  return <AdminCompetitions competitions={competitions} />;
}

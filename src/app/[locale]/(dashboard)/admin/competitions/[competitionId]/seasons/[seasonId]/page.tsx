import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import AdminSeason from "@/features/competition-catalog/components/admin-season";
import { isLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/server/auth/admin";
import {
  CatalogNotFoundError,
  getAdminSeasonDetail,
} from "@/server/services/competition-catalog";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string; competitionId: string; seasonId: string }>;
}>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "competitionCatalog" });
  return { title: t("metadata.season.title"), description: t("metadata.season.description") };
}

export default async function AdminSeasonPage({ params }: PageProps) {
  const { locale, competitionId, seasonId } = await params;
  if (
    !isLocale(locale) ||
    !z.string().uuid().safeParse(competitionId).success ||
    !z.string().uuid().safeParse(seasonId).success
  ) notFound();
  setRequestLocale(locale);
  const appUser = await requirePlatformAdmin(locale);
  let season;
  try {
    season = await getAdminSeasonDetail(seasonId);
  } catch (error) {
    if (error instanceof CatalogNotFoundError) notFound();
    throw error;
  }
  if (season.competitionId !== competitionId) notFound();
  return (
    <AdminSeason
      season={season}
      locale={locale}
      timeZone={appUser.preferences.timeZone}
    />
  );
}

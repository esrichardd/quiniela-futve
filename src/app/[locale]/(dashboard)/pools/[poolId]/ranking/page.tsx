import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import PoolRanking from "@/features/ranking/components/pool-ranking";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { getPoolRanking } from "@/server/services/ranking";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string; poolId: string }>;
}>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "ranking" });
  return { title: t("metadata.title"), description: t("metadata.description") };
}

export default async function PoolRankingPage({ params }: PageProps) {
  const { locale, poolId } = await params;
  if (!isLocale(locale) || !z.string().uuid().safeParse(poolId).success) notFound();
  setRequestLocale(locale);
  await requireDashboardUser(locale);

  let view;
  try {
    view = await getPoolRanking(poolId);
  } catch (error) {
    if (error instanceof PoolMembershipRequiredError) notFound();
    throw error;
  }

  return <PoolRanking view={view} locale={locale} />;
}

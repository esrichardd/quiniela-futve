import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import PoolTransparency from "@/features/prediction-reveal/components/pool-transparency";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { getPoolPredictionTransparency } from "@/server/services/prediction-transparency";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string; poolId: string }>;
  searchParams: Promise<{ matchday?: string | Array<string> }>;
}>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "transparency" });
  return { title: t("metadata.title"), description: t("metadata.description") };
}

export default async function PoolTransparencyPage({ params, searchParams }: PageProps) {
  const { locale, poolId } = await params;
  if (!isLocale(locale) || !z.string().uuid().safeParse(poolId).success) notFound();
  setRequestLocale(locale);
  await requireDashboardUser(locale);
  const query = await searchParams;
  if (Array.isArray(query.matchday)) notFound();
  if (query.matchday && !z.string().uuid().safeParse(query.matchday).success) notFound();

  let view;
  try {
    view = await getPoolPredictionTransparency(poolId, query.matchday);
  } catch (error) {
    if (error instanceof PoolMembershipRequiredError) notFound();
    throw error;
  }

  return <PoolTransparency view={view} locale={locale} />;
}

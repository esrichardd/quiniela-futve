import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import PoolMatchdays from "@/features/pools/components/pool-matchdays";
import { isLocale } from "@/i18n/routing";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { getCurrentUserPoolMatchdays } from "@/server/services/competition-catalog";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string; poolId: string }>;
  searchParams: Promise<{ matchday?: string | Array<string> }>;
}>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pools" });
  return { title: t("metadata.matchdays.title"), description: t("metadata.matchdays.description") };
}

export default async function PoolMatchdaysPage({ params, searchParams }: PageProps) {
  const { locale, poolId } = await params;
  if (!isLocale(locale) || !z.string().uuid().safeParse(poolId).success) notFound();
  setRequestLocale(locale);
  const appUser = await requireDashboardUser(locale);
  const query = await searchParams;
  if (Array.isArray(query.matchday)) notFound();
  if (query.matchday && !z.string().uuid().safeParse(query.matchday).success) notFound();
  let view;
  try {
    view = await getCurrentUserPoolMatchdays(poolId, query.matchday);
  } catch (error) {
    if (error instanceof PoolMembershipRequiredError) notFound();
    throw error;
  }
  return <PoolMatchdays view={view} locale={locale} timeZone={appUser.preferences.timeZone} />;
}

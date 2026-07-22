import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import DashboardHome from "@/features/dashboard/components/dashboard-home";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { InvalidPaginationCursorError } from "@/server/pagination";
import { listCurrentUserPools } from "@/server/services/pools";

export const dynamic = "force-dynamic";

type DashboardHomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    cursor?: string | Array<string>;
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
  searchParams,
}: DashboardHomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  await requireDashboardUser(locale);

  const query = await searchParams;

  if (Array.isArray(query.cursor)) {
    notFound();
  }

  let pools;
  try {
    pools = await listCurrentUserPools(query.cursor);
  } catch (error) {
    if (error instanceof InvalidPaginationCursorError) {
      notFound();
    }
    throw error;
  }

  return <DashboardHome locale={locale} page={pools} />;
}

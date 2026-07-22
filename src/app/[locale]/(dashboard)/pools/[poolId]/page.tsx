import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import DashboardShell from "@/features/dashboard/components/dashboard-shell";
import PoolDetail from "@/features/pools/components/pool-detail";
import { isLocale } from "@/i18n/routing";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { InvalidPaginationCursorError } from "@/server/pagination";
import { getCurrentUserPoolDetail } from "@/server/services/pools";

export const dynamic = "force-dynamic";

type PoolDetailPageProps = Readonly<{
  params: Promise<{ locale: string; poolId: string }>;
  searchParams: Promise<{
    created?: string | Array<string>;
    membersCursor?: string | Array<string>;
  }>;
}>;

export async function generateMetadata({
  params,
}: PoolDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pools" });
  return {
    title: t("metadata.detail.title"),
    description: t("metadata.detail.description"),
  };
}

export default async function PoolDetailPage({
  params,
  searchParams,
}: PoolDetailPageProps) {
  const { locale, poolId } = await params;
  if (!isLocale(locale) || !z.string().uuid().safeParse(poolId).success) {
    notFound();
  }
  setRequestLocale(locale);
  await requireDashboardUser(locale);

  const query = await searchParams;

  if (Array.isArray(query.membersCursor)) {
    notFound();
  }

  let pool;
  try {
    pool = await getCurrentUserPoolDetail(poolId, query.membersCursor);
  } catch (error) {
    if (
      error instanceof PoolMembershipRequiredError ||
      error instanceof InvalidPaginationCursorError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <DashboardShell>
      <PoolDetail pool={pool} locale={locale} created={query.created === "1"} />
    </DashboardShell>
  );
}

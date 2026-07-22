import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import DashboardShell from "@/features/dashboard/components/dashboard-shell";
import PoolWizard from "@/features/pools/components/pool-wizard";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";
import { getAvailableCompetitionOptions } from "@/server/services/pools";

export const dynamic = "force-dynamic";

type CreatePoolPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: CreatePoolPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pools" });
  return {
    title: t("metadata.create.title"),
    description: t("metadata.create.description"),
  };
}

export default async function CreatePoolPage({ params }: CreatePoolPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireDashboardUser(locale);
  const competitions = await getAvailableCompetitionOptions();
  const t = await getTranslations("pools");
  const messages = await getMessages();

  return (
    <DashboardShell>
      {competitions.length > 0 ? (
        <NextIntlClientProvider
          messages={pickNestedMessageNamespaces(messages, "pools", [
            "actions",
            "create",
            "errors",
            "financial",
            "general",
            "prediction",
            "prizes",
            "summary",
          ])}
        >
          <PoolWizard
            competitions={competitions}
            creationToken={randomUUID()}
          />
        </NextIntlClientProvider>
      ) : (
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <h1 className="text-2xl font-bold">{t("create.unavailableTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("create.unavailableBody")}
          </p>
        </div>
      )}
    </DashboardShell>
  );
}

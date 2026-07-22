import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import DashboardShell from "@/features/dashboard/components/dashboard-shell";
import JoinPoolForm from "@/features/pools/components/join-pool-form";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";
import { requireDashboardUser } from "@/server/auth/dashboard";

export const dynamic = "force-dynamic";

type JoinPoolPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: JoinPoolPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "pools" });
  return {
    title: t("metadata.join.title"),
    description: t("metadata.join.description"),
  };
}

export default async function JoinPoolPage({ params }: JoinPoolPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireDashboardUser(locale);
  const messages = await getMessages();

  return (
    <DashboardShell>
      <NextIntlClientProvider
        messages={pickNestedMessageNamespaces(messages, "pools", [
          "join",
          "errors",
        ])}
      >
        <JoinPoolForm />
      </NextIntlClientProvider>
    </DashboardShell>
  );
}

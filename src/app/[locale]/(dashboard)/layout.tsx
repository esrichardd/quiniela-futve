import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import DashboardShell from "@/features/dashboard/components/dashboard-shell";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider
      messages={pickNestedMessageNamespaces(messages, "dashboard", ["status"])}
    >
      <DashboardShell locale={locale}>{children}</DashboardShell>
    </NextIntlClientProvider>
  );
}

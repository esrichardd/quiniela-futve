import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";
import { requirePlatformAdmin } from "@/server/auth/admin";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requirePlatformAdmin(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickNestedMessageNamespaces(messages, "competitionCatalog", [
        "errors",
        "status",
        "success",
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

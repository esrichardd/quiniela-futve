import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { pickNestedMessageNamespaces } from "@/i18n/client-messages";

export default async function MatchdaysLayout({ children }: Readonly<{ children: ReactNode }>) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickNestedMessageNamespaces(messages, "pools", ["status"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

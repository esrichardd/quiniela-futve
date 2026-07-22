import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { pickNestedMessageNamespaces } from "@/i18n/client-messages";

type PoolsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function PoolsLayout({ children }: PoolsLayoutProps) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={pickNestedMessageNamespaces(messages, "pools", ["status"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

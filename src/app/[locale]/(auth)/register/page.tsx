import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import RegisterForm from "@/features/auth/components/register-form";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";
import { getAuthenticatedRedirectPath } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type RegisterPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("register.metadata.title"),
    description: t("register.metadata.description"),
  };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const redirectPath = await getAuthenticatedRedirectPath(locale);

  if (redirectPath) {
    redirect(redirectPath);
  }

  setRequestLocale(locale);

  const common = await getTranslations("common");
  const messages = await getMessages();

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <NextIntlClientProvider
        messages={pickNestedMessageNamespaces(messages, "auth", [
          "shared",
          "errors",
          "fields",
          "register",
        ])}
      >
        <RegisterForm />
      </NextIntlClientProvider>
    </AuthLayout>
  );
}

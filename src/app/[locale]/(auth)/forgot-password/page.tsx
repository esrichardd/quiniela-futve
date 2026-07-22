import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";

type ForgotPasswordPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("forgotPassword.metadata.title"),
    description: t("forgotPassword.metadata.description"),
  };
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const common = await getTranslations("common");
  const messages = await getMessages();

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <NextIntlClientProvider
        messages={pickNestedMessageNamespaces(messages, "auth", [
          "errors",
          "fields",
          "forgotPassword",
        ])}
      >
        <ForgotPasswordForm />
      </NextIntlClientProvider>
    </AuthLayout>
  );
}

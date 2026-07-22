import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import LoginForm from "@/features/auth/components/login-form";
import type { AuthFormErrorCode } from "@/features/auth/types";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";

type LoginPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    reason?: string | string[];
  }>;
}>;

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("login.metadata.title"),
    description: t("login.metadata.description"),
  };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const common = await getTranslations("common");
  const messages = await getMessages();
  const { reason } = await searchParams;
  const initialError: AuthFormErrorCode | undefined =
    reason === "user_banned" ? "user_banned" : undefined;

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <NextIntlClientProvider
        messages={pickNestedMessageNamespaces(messages, "auth", [
          "shared",
          "errors",
          "fields",
          "login",
        ])}
      >
        <LoginForm initialError={initialError} />
      </NextIntlClientProvider>
    </AuthLayout>
  );
}

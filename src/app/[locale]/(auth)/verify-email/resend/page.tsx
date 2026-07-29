import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import AuthLayout from "@/features/auth/components/auth-layout";
import ResendVerificationForm from "@/features/auth/components/resend-verification-form";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { isLocale } from "@/i18n/routing";

type VerifyEmailResendPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: VerifyEmailResendPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("verifyEmailResend.metadata.title"),
    description: t("verifyEmailResend.metadata.description"),
  };
}

export default async function VerifyEmailResendPage({
  params,
}: VerifyEmailResendPageProps) {
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
          "verifyEmailResend",
        ])}
      >
        <div className="w-full max-w-md">
          <ResendVerificationForm />
        </div>
      </NextIntlClientProvider>
    </AuthLayout>
  );
}

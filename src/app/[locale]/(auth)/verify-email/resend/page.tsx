import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import AuthLayout from "@/features/auth/components/auth-layout";
import ResendVerificationForm from "@/features/auth/components/resend-verification-form";
import { pickNestedMessageNamespaces } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";
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

  const t = await getTranslations("auth");
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
        <div className="flex w-full max-w-md flex-col gap-4">
          <ResendVerificationForm />
          <Link
            href="/login"
            className="mx-auto rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("verifyEmailResend.backToLogin")}
          </Link>
        </div>
      </NextIntlClientProvider>
    </AuthLayout>
  );
}

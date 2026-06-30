import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthLayout from "@/features/auth/components/auth-layout";
import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";
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

  return (
    <AuthLayout homeLabel={common("navigation.home")}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

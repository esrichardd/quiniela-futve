import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import "@/features/landing/landing.css";
import AppPreview from "@/features/landing/components/app-preview";
import CtaSection from "@/features/landing/components/cta-section";
import Footer from "@/features/landing/components/footer";
import HeroSection from "@/features/landing/components/hero-section";
import HowItWorks from "@/features/landing/components/how-it-works";
import Navbar from "@/features/landing/components/navbar";
import { isLocale } from "@/i18n/routing";

type HomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <AppPreview />
      <CtaSection />
      <Footer />
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ThemeSelector } from "@/components/theme/theme-selector";
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

  const t = await getTranslations("home");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <section className="grid w-full max-w-5xl gap-10 md:grid-cols-[1fr_20rem] md:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            {t("eyebrow")}
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <aside className="rounded-md border border-border bg-card p-5 text-card-foreground shadow-soft">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("locale.label")}
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {t("locale.value")}
              </p>
            </div>

            <ThemeSelector
              label={t("theme.label")}
              options={[
                { value: "light", label: t("theme.light") },
                { value: "dark", label: t("theme.dark") },
                { value: "system", label: t("theme.system") },
              ]}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

import { getTranslations } from "next-intl/server";

import { BrandMark } from "./brand-mark";

export default async function Footer() {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const year = new Date().getFullYear().toString();

  return (
    <footer
      className="landing-footer-border relative px-4 py-10"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-6 rounded-md" />
          <span className="text-sm font-medium text-muted-foreground">
            {t("footer.tagline")}
          </span>
        </div>

        <nav aria-label={common("navigation.footer")} className="flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="landing-nav-link">
            {t("nav.howItWorks")}
          </a>
          <a href="#preview" className="landing-nav-link">
            {t("nav.preview")}
          </a>
        </nav>
      </div>

      <div
        className="landing-footer-border mx-auto mt-6 flex max-w-6xl justify-center pt-6"
      >
        <p className="text-subtle-text text-xs">{t("footer.copy", { year })}</p>
      </div>
    </footer>
  );
}

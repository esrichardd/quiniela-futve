import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { type Locale, isLocale, locales } from "@/i18n/routing";

import { LocaleFlag } from "./locale-flag";

export async function LocaleSwitch() {
  const common = await getTranslations("common");
  const rawLocale = await getLocale();
  const current: Locale = isLocale(rawLocale) ? rawLocale : locales[0];

  return (
    <div className="landing-locale-switch flex items-center gap-0.5 rounded-lg border border-border p-0.5 sm:p-1">
      {locales.map((code) => {
        const active = code === current;
        const label = common(`language.options.${code}`);

        return (
          <Link
            key={code}
            href="/"
            locale={code}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            title={label}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2 ${
              active ? "landing-locale-option-active" : "landing-locale-option-inactive"
            }`}
          >
            <LocaleFlag locale={code} />
          </Link>
        );
      })}
    </div>
  );
}

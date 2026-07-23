import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const common = (await import(`../../messages/${locale}/common.json`)).default;
  const home = (await import(`../../messages/${locale}/home.json`)).default;
  const auth = (await import(`../../messages/${locale}/auth.json`)).default;
  const dashboard = (await import(`../../messages/${locale}/dashboard.json`))
    .default;
  const pools = (await import(`../../messages/${locale}/pools.json`)).default;
  const competitionCatalog = (
    await import(`../../messages/${locale}/competition-catalog.json`)
  ).default;

  return {
    locale,
    messages: {
      auth,
      common,
      dashboard,
      home,
      pools,
      competitionCatalog,
    },
  };
});

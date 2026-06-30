import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const common = (await import(`../../messages/${locale}/common.json`)).default;
  const home = (await import(`../../messages/${locale}/home.json`)).default;
  const auth = (await import(`../../messages/${locale}/auth.json`)).default;

  return {
    locale,
    messages: {
      auth,
      common,
      home,
    },
  };
});

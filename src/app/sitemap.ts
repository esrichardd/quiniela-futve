import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site";

/**
 * Public, indexable routes only. Everything behind authentication is left out
 * on purpose: a crawler that follows those URLs is redirected to the login
 * page, which would just report soft 404s in Search Console.
 *
 * `changeFrequency` and `priority` are omitted because Google ignores both.
 */
const publicPaths = ["", "/register"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: absoluteUrl(`/${locale}${path}`),
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((alternate) => [
              alternate,
              absoluteUrl(`/${alternate}${path}`),
            ]),
          ),
          // Fallback for visitors whose language matches neither locale.
          "x-default": absoluteUrl(`/${defaultLocale}${path}`),
        },
      },
    })),
  );
}

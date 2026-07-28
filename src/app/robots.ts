import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site";

/**
 * Authenticated areas. They already redirect anonymous visitors, so this is
 * not a security boundary — it only keeps crawlers from spending budget on
 * pages that can never yield an indexable result.
 */
const privateSegments = ["home", "pools", "admin"] as const;

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    ...locales.flatMap((locale) =>
      privateSegments.map((segment) => `/${locale}/${segment}`),
    ),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

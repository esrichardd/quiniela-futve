/**
 * Canonical public origin, shared by the metadata base, `robots.txt` and the
 * sitemap so the three can never drift apart. Google treats the favicon and
 * the sitemap as properties of this exact origin, so it must match the
 * indexed host (`www`) rather than the apex domain.
 */
export const siteUrl = new URL("https://www.quinielafutve.com");

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

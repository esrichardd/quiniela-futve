import { describe, expect, it } from "vitest";

import {
  createGlobalSecurityHeaders,
  createSecurityHeaderRules,
} from "@/lib/security-headers";

function toHeaderMap(
  headers: ReturnType<typeof createGlobalSecurityHeaders>,
): Map<string, string> {
  return new Map(headers.map(({ key, value }) => [key, value]));
}

describe("security headers", () => {
  it("creates a restrictive production policy without duplicate headers", () => {
    const headers = createGlobalSecurityHeaders({
      isDevelopment: false,
      isProductionDeployment: true,
    });
    const headerMap = toHeaderMap(headers);
    const csp = headerMap.get("Content-Security-Policy");

    expect(headerMap.size).toBe(headers.length);
    expect(headerMap.get("Strict-Transport-Security")).toBe(
      "max-age=31536000",
    );
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("*");
  });

  it("does not emit HSTS outside the production deployment", () => {
    const headerMap = toHeaderMap(
      createGlobalSecurityHeaders({
        isDevelopment: false,
        isProductionDeployment: false,
      }),
    );

    expect(headerMap.has("Strict-Transport-Security")).toBe(false);
  });

  it("allows the development runtime without weakening production", () => {
    const headerMap = toHeaderMap(
      createGlobalSecurityHeaders({
        isDevelopment: true,
        isProductionDeployment: false,
      }),
    );
    const csp = headerMap.get("Content-Security-Policy");

    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws: wss:");
  });

  it("overrides referrers on the password reset route", () => {
    const rules = createSecurityHeaderRules({
      isDevelopment: false,
      isProductionDeployment: false,
    });

    expect(rules).toHaveLength(2);
    expect(rules[1]).toEqual({
      source: "/:locale(es|en)/reset-password",
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    });
  });
});

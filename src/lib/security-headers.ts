export type SecurityHeader = {
  key: string;
  value: string;
};

export type SecurityHeaderRule = {
  source: string;
  headers: Array<SecurityHeader>;
};

type SecurityHeaderOptions = Readonly<{
  isDevelopment: boolean;
  isProductionDeployment: boolean;
}>;

const GLOBAL_ROUTE_SOURCE = "/:path*";
const SENSITIVE_AUTH_ROUTE_SOURCE = "/:locale(es|en)/reset-password";

export function createSecurityHeaderRules({
  isDevelopment,
  isProductionDeployment,
}: SecurityHeaderOptions): Array<SecurityHeaderRule> {
  return [
    {
      source: GLOBAL_ROUTE_SOURCE,
      headers: createGlobalSecurityHeaders({
        isDevelopment,
        isProductionDeployment,
      }),
    },
    {
      source: SENSITIVE_AUTH_ROUTE_SOURCE,
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    },
  ];
}

export function createGlobalSecurityHeaders({
  isDevelopment,
  isProductionDeployment,
}: SecurityHeaderOptions): Array<SecurityHeader> {
  const headers: Array<SecurityHeader> = [
    {
      key: "Content-Security-Policy",
      value: createContentSecurityPolicy(isDevelopment),
    },
    {
      key: "Permissions-Policy",
      value:
        "browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "X-XSS-Protection", value: "0" },
  ];

  if (isProductionDeployment) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  }

  return headers;
}

function createContentSecurityPolicy(isDevelopment: boolean): string {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const connectSources = ["'self'"];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws:", "wss:");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${connectSources.join(" ")}`,
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' blob: data:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
  ].join("; ");
}

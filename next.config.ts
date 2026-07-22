import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { createSecurityHeaderRules } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async headers() {
    return createSecurityHeaderRules({
      isDevelopment: process.env.NODE_ENV === "development",
      isProductionDeployment: process.env.VERCEL_ENV === "production",
    });
  },
  outputFileTracingIncludes: {
    "/api/webhooks/neon-auth": ["./templates/emails/*.html"],
  },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);

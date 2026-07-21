import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/webhooks/neon-auth": ["./templates/emails/*.html"],
  },
};

export default withNextIntl(nextConfig);

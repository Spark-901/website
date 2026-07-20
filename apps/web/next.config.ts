import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Slack Workflow URL is hardcoded in lib/slack-notify.ts (SLACK_OPS_WEBHOOK_URL_DEFAULT).
// Env overrides remain optional — feature flags no longer require separate Slack vars.

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: "../../",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  turbopack: {
    root: "../../",
  },
}

export default withNextIntl(nextConfig)

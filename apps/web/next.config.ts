import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Slack notifications require SLACK_OPS_WEBHOOK_URL to be set per environment.
// The URL is NOT hardcoded — this repo is public, and a literal webhook URL here
// is an open write endpoint into our Slack. If it is unset, notification is
// skipped and the event is still recorded in the DynamoDB ops ledger.

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

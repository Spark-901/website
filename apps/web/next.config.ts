import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Build-time environment variable validation
if (process.env.NEXT_PUBLIC_ENABLE_NONPROFIT_FEEDBACK_LOOP === "true" && !process.env.SLACK_FEEDBACK_WEBHOOK_URL) {
  throw new Error(
    "❌ BUILD ERROR: NEXT_PUBLIC_ENABLE_NONPROFIT_FEEDBACK_LOOP is enabled, but SLACK_FEEDBACK_WEBHOOK_URL is not set."
  )
}

if (process.env.NEXT_PUBLIC_ENABLE_GIFT_A_TOOL === "true" && !process.env.SLACK_GIFT_TOOL_WEBHOOK_URL) {
  throw new Error(
    "❌ BUILD ERROR: NEXT_PUBLIC_ENABLE_GIFT_A_TOOL is enabled, but SLACK_GIFT_TOOL_WEBHOOK_URL is not set."
  )
}

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

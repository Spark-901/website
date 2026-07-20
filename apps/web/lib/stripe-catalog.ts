/**
 * Stripe Product IDs for Spark901 fundraising.
 *
 * Live defaults match the Spark901 live catalog.
 * Sandbox/test IDs come from env (see scripts/setup-stripe-sandbox.mjs)
 * or from the committed TEST_PRODUCTS map once sandbox is provisioned.
 *
 * Resolution order per slug:
 * 1. Explicit STRIPE_PRODUCT_* env override
 * 2. When using sk_test_ / rk_test_: TEST_PRODUCTS / STRIPE_PRODUCT_*_TEST
 * 3. When using live keys: LIVE_PRODUCTS
 *
 * Never mix live product IDs with test API keys (Checkout will fail).
 */

const LIVE_PRODUCTS = {
  "volunteer-scheduler": "prod_Uuv9AUA3tkhTBd",
  "grant-tracker": "prod_Uuv95nZqVQZ1IN",
  "impact-dashboard": "prod_Uuv9Er7o4jlo6E",
  "community-hub": "prod_Uuv9SzfINXwdr3",
  general: "prod_Uuv9yBFSt2E9CX",
} as const

/**
 * Sandbox product IDs for Spark901 test mode.
 * Filled by `npm run stripe:setup-sandbox` — commit updates when regenerated.
 */
const TEST_PRODUCTS: Record<keyof typeof LIVE_PRODUCTS, string> = {
  "volunteer-scheduler": "prod_UuvF0nRtwaGeur",
  "grant-tracker": "prod_UuvFazsqNX5kov",
  "impact-dashboard": "prod_UuvFhCOQ3DJsHs",
  "community-hub": "prod_UuvFE8LsZ2XLfL",
  general: "prod_UuvFtA7SAunYFn",
}

const ENV_OVERRIDES = {
  "volunteer-scheduler": process.env.STRIPE_PRODUCT_VOLUNTEER_SCHEDULER,
  "grant-tracker": process.env.STRIPE_PRODUCT_GRANT_TRACKER,
  "impact-dashboard": process.env.STRIPE_PRODUCT_IMPACT_DASHBOARD,
  "community-hub": process.env.STRIPE_PRODUCT_COMMUNITY_HUB,
  general: process.env.STRIPE_PRODUCT_GENERAL_FUND,
} as const

const ENV_TEST_OVERRIDES = {
  "volunteer-scheduler": process.env.STRIPE_PRODUCT_VOLUNTEER_SCHEDULER_TEST,
  "grant-tracker": process.env.STRIPE_PRODUCT_GRANT_TRACKER_TEST,
  "impact-dashboard": process.env.STRIPE_PRODUCT_IMPACT_DASHBOARD_TEST,
  "community-hub": process.env.STRIPE_PRODUCT_COMMUNITY_HUB_TEST,
  general: process.env.STRIPE_PRODUCT_GENERAL_FUND_TEST,
} as const

export type StripeFundableSlug = keyof typeof LIVE_PRODUCTS

export const CONTRIBUTION_MIN_USD = 5
export const CONTRIBUTION_MAX_USD = 50_000
export const CONTRIBUTION_PRESETS_USD = [10, 25, 50, 100, 250] as const

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ""
  return key.startsWith("sk_test_") || key.startsWith("rk_test_")
}

export function getStripeProductId(projectSlug: string): string | undefined {
  if (!(projectSlug in LIVE_PRODUCTS)) return undefined
  const slug = projectSlug as StripeFundableSlug

  const override = ENV_OVERRIDES[slug]
  if (override) return override

  if (isStripeTestMode()) {
    return ENV_TEST_OVERRIDES[slug] || TEST_PRODUCTS[slug] || undefined
  }

  return LIVE_PRODUCTS[slug]
}

/** True when checkout should use inline product_data (sandbox without catalog IDs). */
export function shouldUseInlineProductData(projectSlug: string): boolean {
  return isStripeTestMode() && !getStripeProductId(projectSlug)
}

/** @deprecated Prefer getStripeProductId */
export const STRIPE_PRODUCTS = LIVE_PRODUCTS

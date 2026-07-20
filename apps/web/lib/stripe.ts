import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  : null

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && stripe)
}

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
  }
  return stripe
}

/** Public site origin for Checkout redirects (no trailing slash). */
export function getSiteOrigin(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configured) return configured
  if (requestOrigin) return requestOrigin.replace(/\/$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

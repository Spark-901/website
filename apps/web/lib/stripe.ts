import Stripe from "stripe"

// Stripe will be initialized once the integration is connected
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    })
  : null

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

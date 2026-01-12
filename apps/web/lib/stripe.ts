import Stripe from "stripe"

// Stripe will be initialized once the integration is connected
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    })
  : null

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

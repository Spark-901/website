import type Stripe from "stripe"
import { isStripeConfigured, requireStripe } from "@/lib/stripe"

export type ContributionDetails = {
  verified: boolean
  isRecurring: boolean
  fullName: string | null
  firstName: string | null
  email: string | null
  amountCents: number | null
  amountLabel: string | null
  currency: string
  projectSlug: string | null
  projectTitle: string | null
  createdAt: Date | null
  sessionId: string
}

function firstNameFrom(fullName: string | null | undefined): string | null {
  if (!fullName) return null
  const trimmed = fullName.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0] ?? null
}

function formatAmountLabel(cents: number, currency: string, recurring: boolean): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
  return recurring ? `${formatted}/mo` : formatted
}

export async function loadContributionDetails(
  sessionId: string,
  expectedProjectSlug: string,
): Promise<ContributionDetails | null> {
  if (!isStripeConfigured()) return null

  try {
    const session = await requireStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    })

    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      session.status === "complete"

    const projectSlug = session.metadata?.projectSlug ?? null
    const verified = paid && projectSlug === expectedProjectSlug
    const isRecurring =
      session.mode === "subscription" || session.metadata?.frequency === "monthly"

    const customer = session.customer
    const customerName =
      typeof customer === "object" && customer && !customer.deleted ? customer.name : null

    const fullName = session.customer_details?.name || customerName || null
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      (typeof customer === "object" && customer && !customer.deleted ? customer.email : null) ||
      null

    const amountCents = typeof session.amount_total === "number" ? session.amount_total : null
    const currency = session.currency || "usd"

    return {
      verified,
      isRecurring,
      fullName,
      firstName: firstNameFrom(fullName),
      email,
      amountCents,
      amountLabel:
        amountCents != null ? formatAmountLabel(amountCents, currency, isRecurring) : null,
      currency,
      projectSlug,
      projectTitle: session.metadata?.projectTitle ?? null,
      createdAt: session.created ? new Date(session.created * 1000) : null,
      sessionId: session.id,
    }
  } catch (error) {
    console.error("Contribution session lookup failed:", error)
    return null
  }
}

/** Narrow helper for webhook / email use later. */
export function summarizeContribution(session: Stripe.Checkout.Session) {
  const fullName = session.customer_details?.name ?? null
  return {
    firstName: firstNameFrom(fullName),
    fullName,
    email: session.customer_details?.email || session.customer_email || null,
    amountCents: session.amount_total,
    projectSlug: session.metadata?.projectSlug ?? null,
    projectTitle: session.metadata?.projectTitle ?? null,
    isRecurring: session.mode === "subscription" || session.metadata?.frequency === "monthly",
  }
}

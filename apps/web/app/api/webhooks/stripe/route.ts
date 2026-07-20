import { revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { notifySlackOps } from "@/lib/slack-notify"
import { isStripeConfigured, requireStripe } from "@/lib/stripe"

export const runtime = "nodejs"

function formatUsdFromCents(cents: number | null | undefined): string {
  if (cents == null) return "unknown"
  return `$${(cents / 100).toFixed(2)}`
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const project = session.metadata?.projectTitle || session.metadata?.projectSlug || "unknown"
  const frequency = session.metadata?.frequency || session.mode || "unknown"
  const email = session.customer_details?.email || session.customer_email || "unknown"
  const name = session.customer_details?.name || "unknown"

  console.info("[stripe] checkout.session.completed", {
    sessionId: session.id,
    project,
    frequency,
    amountTotal: session.amount_total,
    email,
    name,
  })

  const projectSlug = session.metadata?.projectSlug
  if (projectSlug) {
    revalidateTag(`funding-${projectSlug}`, "max")
  }

  await notifySlackOps({
    eventType: "contribution.new",
    details: `New Spark901 contribution to ${project} (${frequency})`,
    metadata: {
      Name: name,
      Project: project,
      Frequency: frequency,
      Amount: formatUsdFromCents(session.amount_total),
      Email: email,
      Session: session.id,
    },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === "subscription_create") {
    // Already covered by checkout.session.completed for the first invoice.
    return
  }

  const invoiceRecord = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }
  const sub =
    typeof invoiceRecord.subscription === "string"
      ? invoiceRecord.subscription
      : invoiceRecord.subscription?.id

  console.info("[stripe] invoice.paid (renewal)", {
    invoiceId: invoice.id,
    subscriptionId: sub,
    amountPaid: invoice.amount_paid,
  })

  await notifySlackOps({
    eventType: "contribution.renewed",
    details: "Monthly contribution renewed",
    metadata: {
      Amount: formatUsdFromCents(invoice.amount_paid),
      Invoice: invoice.id || "unknown",
      Subscription: sub || "unknown",
      Customer:
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || "unknown",
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.info("[stripe] customer.subscription.deleted", {
    subscriptionId: subscription.id,
    project: subscription.metadata?.projectSlug,
  })

  await notifySlackOps({
    eventType: "contribution.canceled",
    details: "Monthly contribution canceled",
    metadata: {
      Subscription: subscription.id,
      Project: subscription.metadata?.projectTitle || subscription.metadata?.projectSlug || "unknown",
      Customer:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.")
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  const stripe = requireStripe()
  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getSiteOrigin, isStripeConfigured, requireStripe } from "@/lib/stripe"

const log = createLogger({ service: "spark901-web" }).child({
  component: "api.portal",
})

/**
 * Creates a Stripe Customer Portal session so monthly donors can
 * update payment methods or cancel recurring contributions.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 })
  }

  let body: { customerId?: string; sessionId?: string; returnPath?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const stripe = requireStripe()
  const origin = getSiteOrigin(request.headers.get("origin"))
  const returnPath = body.returnPath?.startsWith("/") ? body.returnPath : "/fund"

  let customerId = body.customerId

  if (!customerId && body.sessionId) {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId)
    customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  }

  if (!customerId) {
    return NextResponse.json(
      { error: "A Stripe customer id or checkout session id is required." },
      { status: 400 },
    )
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath}`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error) {
    log.error("Stripe billing portal session creation failed", error, {
      route: "/api/portal",
    })
    return NextResponse.json(
      {
        error:
          "Could not open the billing portal. Enable the Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal.",
      },
      { status: 500 },
    )
  }
}

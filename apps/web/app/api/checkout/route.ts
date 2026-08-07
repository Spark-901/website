import { type NextRequest, NextResponse } from "next/server"
import { brand } from "@/lib/brand"
import { createLogger } from "@/lib/logger"
import { getProjectBySlug } from "@/lib/projects"
import {
  CONTRIBUTION_MAX_USD,
  CONTRIBUTION_MIN_USD,
  getStripeProductId,
  isStripeTestMode,
  shouldUseInlineProductData,
} from "@/lib/stripe-catalog"
import { getSiteOrigin, isStripeConfigured, requireStripe } from "@/lib/stripe"

const log = createLogger({ service: "spark901-web" }).child({
  component: "api.checkout",
})

type CheckoutBody = {
  projectSlug?: string
  amount?: number
  isRecurring?: boolean
  locale?: string
}

function parseAmount(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) return null
  return amount
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to the environment." },
      { status: 503 },
    )
  }

  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { projectSlug, isRecurring = false, locale = "en" } = body
  const amount = parseAmount(body.amount)

  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Project is required." }, { status: 400 })
  }

  const project = getProjectBySlug(projectSlug)
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }

  if (project.status === "funded") {
    return NextResponse.json(
      { error: "This project is fully funded. Choose another tool to support." },
      { status: 400 },
    )
  }

  if (amount === null || amount < CONTRIBUTION_MIN_USD) {
    return NextResponse.json(
      { error: `Minimum contribution is $${CONTRIBUTION_MIN_USD}.` },
      { status: 400 },
    )
  }

  if (amount > CONTRIBUTION_MAX_USD) {
    return NextResponse.json(
      { error: `Maximum contribution is $${CONTRIBUTION_MAX_USD.toLocaleString()}.` },
      { status: 400 },
    )
  }

  const productId = getStripeProductId(projectSlug)
  const useInlineProduct = shouldUseInlineProductData(projectSlug)

  if (!productId && !useInlineProduct) {
    return NextResponse.json(
      {
        error: isStripeTestMode()
          ? "Sandbox products are missing. Run: npm run stripe:setup-sandbox"
          : "This project is not configured for payments yet.",
      },
      { status: 503 },
    )
  }

  const stripe = requireStripe()
  const origin = getSiteOrigin(request.headers.get("origin"))
  const unitAmount = amount * 100
  const frequency = isRecurring ? "monthly" : "one_time"
  const taxNote = brand.isTaxDeductible
    ? "Contributions may be tax-deductible where applicable."
    : "Spark901 is an LLC. Contributions are not tax-deductible."

  const sharedMetadata = {
    projectSlug,
    projectId: project.id,
    projectTitle: project.name,
    frequency,
    amountUsd: String(amount),
    locale,
    stripeMode: isStripeTestMode() ? "test" : "live",
  }

  const successPath =
    locale && locale !== "en"
      ? `/${locale}/fund/${projectSlug}/thank-you`
      : `/fund/${projectSlug}/thank-you`
  const cancelPath =
    locale && locale !== "en" ? `/${locale}/fund/${projectSlug}` : `/fund/${projectSlug}`

  const priceData = {
    currency: "usd" as const,
    unit_amount: unitAmount,
    ...(isRecurring ? { recurring: { interval: "month" as const } } : {}),
    ...(productId
      ? { product: productId }
      : {
          product_data: {
            name: isRecurring ? `Monthly Support: ${project.name}` : `Fund: ${project.name}`,
            description: isRecurring
              ? `Recurring monthly contribution to ${project.name}`
              : `One-time contribution to ${project.name}`,
            metadata: {
              project_slug: projectSlug,
              project_id: project.id,
              contribution_type: "project_fund",
            },
          },
        }),
  }

  try {
    // name_collection is supported by the API; SDK types may lag.
    const session = await stripe.checkout.sessions.create({
      mode: isRecurring ? "subscription" : "payment",
      customer_creation: isRecurring ? undefined : "always",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      allow_promotion_codes: true,
      submit_type: isRecurring ? undefined : "donate",
      locale: locale === "es" ? "es" : "en",
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}#fund`,
      metadata: sharedMetadata,
      payment_intent_data: isRecurring
        ? undefined
        : {
            metadata: sharedMetadata,
            statement_descriptor_suffix: "FUND",
          },
      subscription_data: isRecurring
        ? {
            metadata: sharedMetadata,
            description: `Monthly support for ${project.name}`,
          }
        : undefined,
      custom_text: {
        submit: {
          message: taxNote,
        },
      },
      name_collection: {
        individual: {
          enabled: true,
          optional: false,
        },
      },
      // Requires Terms URL in Stripe Dashboard → Settings → Public details
      ...(process.env.STRIPE_CHECKOUT_REQUIRE_TOS === "true"
        ? {
            consent_collection: {
              terms_of_service: "required" as const,
            },
          }
        : {}),
    } as Parameters<typeof stripe.checkout.sessions.create>[0])

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session missing redirect URL." }, { status: 500 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    log.error("Stripe checkout session creation failed", error, {
      route: "/api/checkout",
      projectSlug,
      frequency,
      amountUsd: amount,
      stripeMode: isStripeTestMode() ? "test" : "live",
    })
    const message =
      error instanceof Error && error.message.includes("terms_of_service")
        ? "Stripe Checkout needs Terms of Service URL in Public details before contributions can be accepted."
        : "Failed to create checkout session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

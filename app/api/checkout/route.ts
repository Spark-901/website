import { type NextRequest, NextResponse } from "next/server"
import { stripe, isStripeConfigured } from "@/lib/stripe"
import { getProjectBySlug } from "@/lib/projects"

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured. Please add the Stripe integration." }, { status: 503 })
  }

  try {
    const { projectSlug, amount, isRecurring } = await request.json()

    const project = getProjectBySlug(projectSlug)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (!amount || amount < 5) {
      return NextResponse.json({ error: "Minimum donation is $5" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"

    if (isRecurring) {
      // Create a subscription checkout session
      const session = await stripe!.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Monthly Support: ${project.title}`,
                description: `Recurring monthly contribution to ${project.title}`,
              },
              unit_amount: amount * 100,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/fund/${projectSlug}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/fund/${projectSlug}`,
        metadata: {
          projectSlug,
          projectTitle: project.title,
          type: "recurring",
        },
      })

      return NextResponse.json({ url: session.url })
    } else {
      // Create a one-time payment checkout session
      const session = await stripe!.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Fund: ${project.title}`,
                description: `One-time contribution to ${project.title}`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/fund/${projectSlug}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/fund/${projectSlug}`,
        metadata: {
          projectSlug,
          projectTitle: project.title,
          type: "one-time",
        },
      })

      return NextResponse.json({ url: session.url })
    }
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

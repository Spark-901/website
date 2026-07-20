import { type NextRequest, NextResponse } from "next/server"
import { notifySlackOps } from "@/lib/slack-notify"

export async function POST(request: NextRequest) {
  const webhookUrl =
    process.env.SLACK_FEEDBACK_WEBHOOK_URL || process.env.SLACK_OPS_WEBHOOK_URL

  if (!webhookUrl) {
    console.error("SLACK_FEEDBACK_WEBHOOK_URL / SLACK_OPS_WEBHOOK_URL is not configured.")
    return NextResponse.json({ error: "Service is currently unavailable." }, { status: 503 })
  }

  try {
    const { type, email, details } = (await request.json()) as {
      type?: string
      email?: string
      details?: string
    }

    if (!email || !details) {
      return NextResponse.json({ error: "Email and details are required." }, { status: 400 })
    }

    const isBeta = type === "beta_signup"
    const ok = await notifySlackOps(
      {
        eventType: isBeta ? "feedback.beta_signup" : "feedback.tool_suggestion",
        details: isBeta ? "New beta tester signup" : "New tool suggestion",
        metadata: {
          Email: email,
          Type: isBeta ? "beta_signup" : "tool_suggestion",
          Details: details,
        },
      },
      { webhookUrl },
    )

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to submit feedback. Please try again later." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback submission error:", error)
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again later." },
      { status: 500 },
    )
  }
}

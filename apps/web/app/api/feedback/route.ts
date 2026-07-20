import { type NextRequest, NextResponse } from "next/server"
import { notifySlackOps } from "@/lib/slack-notify"
import { verifyTurnstileToken } from "@/lib/turnstile"

export async function POST(request: NextRequest) {
  try {
    const { type, email, details, turnstileToken } = (await request.json()) as {
      type?: string
      email?: string
      details?: string
      turnstileToken?: string
    }

    if (!email || !details) {
      return NextResponse.json({ error: "Email and details are required." }, { status: 400 })
    }

    const turnstile = await verifyTurnstileToken(turnstileToken, request)
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: turnstile.status })
    }

    const kind =
      type === "beta_signup"
        ? "beta_signup"
        : type === "suggest_tool" || type === "tool_suggestion"
          ? "suggest_tool"
          : "feedback"

    const eventType =
      kind === "beta_signup"
        ? "feedback.beta_signup"
        : kind === "suggest_tool"
          ? "feedback.suggest_tool"
          : "feedback.general"

    const ok = await notifySlackOps({
      eventType,
      details:
        kind === "beta_signup"
          ? "New beta tester signup"
          : kind === "suggest_tool"
            ? "New tool suggestion"
            : "New feedback",
      metadata: {
        Email: email,
        Type: kind,
        Details: details,
      },
    })

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

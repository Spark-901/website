import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { notifySlackOps } from "@/lib/slack-notify"
import { verifyTurnstileToken } from "@/lib/turnstile"

const log = createLogger({ service: "spark901-web" }).child({
  component: "api.gift-tool",
})

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as Record<string, string>

    const requiredFields = ["donorName", "donorEmail", "targetNonprofit", "projectTitle"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const turnstile = await verifyTurnstileToken(data.turnstileToken, request)
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: turnstile.status })
    }

    const ok = await notifySlackOps({
      eventType: "gift_tool.request",
      details: `Gift a Tool request for ${data.projectTitle} → ${data.targetNonprofit}`,
      metadata: {
        Donor: data.donorName,
        Email: data.donorEmail,
        Company: data.donorCompany || "",
        Nonprofit: data.targetNonprofit,
        NonprofitWebsite: data.targetWebsite || "",
        Project: data.projectTitle,
        ProjectSlug: data.projectSlug || "",
        Message: data.message || "",
      },
    })

    if (!ok) {
      return NextResponse.json({ error: "Failed to submit request." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("Gift a Tool submission failed", error, {
      route: "/api/gift-tool",
    })
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 })
  }
}

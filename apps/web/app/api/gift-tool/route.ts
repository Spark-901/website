import { type NextRequest, NextResponse } from "next/server"
import { notifySlackOps } from "@/lib/slack-notify"

export async function POST(request: NextRequest) {
  const webhookUrl =
    process.env.SLACK_GIFT_TOOL_WEBHOOK_URL || process.env.SLACK_OPS_WEBHOOK_URL

  if (!webhookUrl) {
    console.error("SLACK_GIFT_TOOL_WEBHOOK_URL / SLACK_OPS_WEBHOOK_URL is not configured")
    return NextResponse.json({ error: "Slack integration is not configured." }, { status: 503 })
  }

  try {
    const data = (await request.json()) as Record<string, string>

    const requiredFields = ["donorName", "donorEmail", "targetNonprofit", "projectTitle"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const ok = await notifySlackOps(
      {
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
      },
      { webhookUrl },
    )

    if (!ok) {
      return NextResponse.json({ error: "Failed to submit request." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gift tool submission error:", error)
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 })
  }
}

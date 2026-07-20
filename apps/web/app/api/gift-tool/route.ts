import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.SLACK_GIFT_TOOL_WEBHOOK_URL

  if (!webhookUrl) {
    console.error("SLACK_GIFT_TOOL_WEBHOOK_URL is not configured")
    return NextResponse.json({ error: "Slack integration is not configured." }, { status: 503 })
  }

  try {
    const data = await request.json()

    const requiredFields = ["donorName", "donorEmail", "targetNonprofit", "projectTitle"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const slackPayload = {
      text: `🎁 New "Gift a Tool" Request for ${data.projectTitle}`,
      ...data,
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    })

    if (!response.ok) {
      throw new Error(`Slack API responded with status ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gift tool submission error:", error)
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 })
  }
}

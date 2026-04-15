import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.SLACK_GIFT_TOOL_WEBHOOK_URL

  if (!webhookUrl) {
    console.error("SLACK_GIFT_TOOL_WEBHOOK_URL is not configured")
    return NextResponse.json({ error: "Slack integration is not configured." }, { status: 503 })
  }

  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ["donorName", "donorEmail", "targetNonprofit", "projectTitle"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Construct flat JSON payload for Slack
    // Note: Slack webhooks typically expect a 'text' field or 'blocks'
    // but the user specifically requested a flat JSON structure.
    // If it's a standard Slack webhook, we'll include a summary in 'text'
    // and provide all fields as a flat structure as requested.
    const slackPayload = {
      text: `🎁 New "Gift a Tool" Request for ${data.projectTitle}`,
      ...data
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Slack webhook error:", errorText)
      throw new Error("Failed to send message to Slack")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gift a tool submission error:", error)
    return NextResponse.json({ error: "Failed to submit gift request" }, { status: 500 })
  }
}

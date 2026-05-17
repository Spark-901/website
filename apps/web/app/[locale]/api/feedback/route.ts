import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Slack feedback webhook URL is not configured.");
    return NextResponse.json(
      { error: "Service is currently unavailable." },
      { status: 503 }
    );
  }

  try {
    const { type, email, details } = await request.json();

    if (!email || !details) {
      return NextResponse.json(
        { error: "Email and details are required." },
        { status: 400 }
      );
    }

    const title = type === "beta_signup" ? "🆕 New Beta Tester Signup" : "💡 New Tool Suggestion";
    const detailLabel = type === "beta_signup" ? "Tool to test" : "Pain Point";

    const slackPayload = {
      text: `${title}\n*Email:* ${email}\n*${detailLabel}:* ${details}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${title}*`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Email:*\n${email}`,
            },
            {
              type: "mrkdwn",
              text: `*${detailLabel}:*\n${details}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again later." },
      { status: 500 }
    );
  }
}

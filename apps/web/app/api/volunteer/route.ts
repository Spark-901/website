import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { notifySlackOps } from "@/lib/slack-notify"

const ALLOWED_SKILLS = [
  "engineering",
  "design",
  "product",
  "writing",
  "outreach",
  "mentoring",
  "other",
] as const

const AVAILABILITY_VALUES = [
  "lt_2_hrs",
  "2_to_5_hrs",
  "5_to_10_hrs",
  "10_plus_hrs",
] as const

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  skills: z.array(z.enum(ALLOWED_SKILLS)).min(1).max(ALLOWED_SKILLS.length),
  availability: z.enum(AVAILABILITY_VALUES),
  profileUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), {
      message: "Must be an http(s) URL.",
    }),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(),
})

export async function POST(request: NextRequest) {
  const webhookUrl =
    process.env.SLACK_VOLUNTEER_WEBHOOK_URL ||
    process.env.SLACK_OPS_WEBHOOK_URL ||
    process.env.SLACK_FEEDBACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.error("Volunteer webhook URL not configured.")
    return NextResponse.json(
      { error: "Service is currently unavailable." },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ success: true })
  }

  const { name, email, skills, availability, profileUrl, message } = parsed.data

  try {
    const ok = await notifySlackOps(
      {
        eventType: "volunteer.signup",
        details: `New volunteer signup: ${name}`,
        metadata: {
          Name: name,
          Email: email,
          Skills: skills.join(", "),
          Availability: availability,
          Profile: profileUrl || "",
          Message: message || "",
        },
      },
      { webhookUrl },
    )

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to submit. Please try again later." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Volunteer submission error:", error)
    return NextResponse.json(
      { error: "Failed to submit. Please try again later." },
      { status: 500 },
    )
  }
}

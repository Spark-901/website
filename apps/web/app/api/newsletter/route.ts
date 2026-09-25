import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createLogger } from "@/lib/logger"
import { notifySlackOps } from "@/lib/slack-notify"
import { verifyTurnstileToken } from "@/lib/turnstile"

/**
 * "Stay up to date" newsletter signup — the site-wide footer email capture
 * (see `components/newsletter-signup.tsx`, which wraps the shared
 * `EmailCaptureForm` from `@west-tennessee-consulting/funnel-components`).
 *
 * Reuses the SAME ops-ledger + Slack-notify pipeline every other inbound
 * event on this site goes through (`notifySlackOps` -> `recordOpsEvent` in
 * `lib/ops-ledger.ts`) — no new AWS resources, no new table, no new IAM
 * policy. `eventType: "newsletter.signup"` is a new row in the existing
 * single DynamoDB table, same shape as `feedback.beta_signup` /
 * `volunteer.signup` / etc.
 */

const log = createLogger({ service: "spark901-web" }).child({
  component: "api.newsletter",
})

const payloadSchema = z.object({
  email: z.email().max(254),
  // Honeypot: a real visitor never fills this in (it's not rendered visibly
  // by EmailCaptureForm). Same pattern as /api/volunteer.
  website: z.string().max(0).optional(),
  turnstileToken: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid email address." },
      { status: 400 },
    )
  }

  // Honeypot tripped — pretend success, do nothing.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ success: true })
  }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, request)
  if (!turnstile.ok) {
    return NextResponse.json({ success: false, error: turnstile.error }, { status: turnstile.status })
  }

  const { email } = parsed.data

  try {
    const ok = await notifySlackOps({
      eventType: "newsletter.signup",
      details: "New newsletter signup",
      metadata: { Email: email },
      source: "/api/newsletter",
      turnstileOk: true,
    })

    if (!ok) {
      // notifySlackOps already recorded the event in the ops ledger even
      // when Slack delivery failed (fail-open, see lib/ops-ledger.ts) — the
      // signup itself is NOT lost, only the notification. Still tell the
      // visitor it worked; failing their submission over a Slack outage
      // would be wrong.
      log.warn("Newsletter signup recorded but Slack notify failed", { email })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("Newsletter signup failed", error, { route: "/api/newsletter" })
    return NextResponse.json(
      { success: false, error: "Sorry, something went wrong. Please try again." },
      { status: 500 },
    )
  }
}

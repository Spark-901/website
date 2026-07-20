/**
 * Slack ops notifications — one Workflow trigger for all site inbound events.
 *
 * Payload shape (Workflow Builder variables):
 *   { eventType, details, metadata }
 *
 * Organize in Slack by `eventType` title, e.g.:
 *   contribution.new | supporter.contribution | feedback.suggest_tool |
 *   feedback.beta_signup | gift_tool.request | volunteer.signup
 */

/** Stable Spark901 ops Workflow trigger (override with SLACK_OPS_WEBHOOK_URL if needed). */
export const SLACK_OPS_WEBHOOK_URL_DEFAULT =
  "https://hooks.slack.com/triggers/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"

export type SlackOpsEvent = {
  /** Short title used to route/organize in Slack (Workflow `eventType`). */
  eventType: string
  details: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

function resolveWebhookUrl(explicit?: string | null): string {
  return (
    explicit ||
    process.env.SLACK_OPS_WEBHOOK_URL ||
    process.env.SLACK_STRIPE_WEBHOOK_URL ||
    process.env.SLACK_FEEDBACK_WEBHOOK_URL ||
    process.env.SLACK_GIFT_TOOL_WEBHOOK_URL ||
    process.env.SLACK_VOLUNTEER_WEBHOOK_URL ||
    SLACK_OPS_WEBHOOK_URL_DEFAULT
  )
}

function isWorkflowTrigger(url: string): boolean {
  return url.includes("hooks.slack.com/triggers/")
}

function formatMetadata(metadata?: SlackOpsEvent["metadata"]): string {
  if (!metadata) return ""
  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n")
}

function toClassicBlocks(event: SlackOpsEvent) {
  const fields = Object.entries(event.metadata || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 10)
    .map(([label, value]) => ({
      type: "mrkdwn" as const,
      text: `*${label}:*\n${String(value)}`,
    }))

  return {
    text: `${event.eventType}: ${event.details}`,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn" as const, text: `*${event.eventType}*\n${event.details}` },
      },
      ...(fields.length ? [{ type: "section" as const, fields }] : []),
    ],
  }
}

/** Fire-and-forget friendly; returns false if Slack errors. */
export async function notifySlackOps(
  event: SlackOpsEvent,
  options?: { webhookUrl?: string | null },
): Promise<boolean> {
  const webhookUrl = resolveWebhookUrl(options?.webhookUrl)

  const body = isWorkflowTrigger(webhookUrl)
    ? {
        eventType: event.eventType,
        details: event.details,
        metadata: formatMetadata(event.metadata) || "none",
      }
    : toClassicBlocks(event)

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error("Slack ops notify failed:", response.status, text.slice(0, 300))
      return false
    }
    return true
  } catch (error) {
    console.error("Slack ops notify error:", error)
    return false
  }
}

/**
 * Slack ops notifications.
 *
 * Supports:
 * - Slack Workflow Builder triggers (`hooks.slack.com/triggers/...`)
 *   payload: { eventType, details, metadata }
 * - Classic Incoming Webhooks (`hooks.slack.com/services/...`)
 *   payload: { text, blocks? }
 */

export type SlackOpsEvent = {
  eventType: string
  details: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

function resolveWebhookUrl(explicit?: string | null): string | undefined {
  return (
    explicit ||
    process.env.SLACK_OPS_WEBHOOK_URL ||
    process.env.SLACK_STRIPE_WEBHOOK_URL ||
    process.env.SLACK_FEEDBACK_WEBHOOK_URL ||
    undefined
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
  const meta = formatMetadata(event.metadata)
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
      ...(fields.length
        ? [{ type: "section" as const, fields }]
        : meta
          ? [
              {
                type: "section" as const,
                text: { type: "mrkdwn" as const, text: meta },
              },
            ]
          : []),
    ],
  }
}

/** Fire-and-forget friendly; returns false if no URL or Slack errors. */
export async function notifySlackOps(
  event: SlackOpsEvent,
  options?: { webhookUrl?: string | null },
): Promise<boolean> {
  const webhookUrl = resolveWebhookUrl(options?.webhookUrl)
  if (!webhookUrl) return false

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

/**
 * Slack ops notifications for all site inbound events, with a durable ledger
 * write behind every one of them.
 *
 * Organize in Slack by `eventType` title, e.g.:
 *   contribution.new | supporter.contribution | feedback.suggest_tool |
 *   feedback.beta_signup | gift_tool.request | volunteer.signup
 *
 * ## Why the ledger write lives in here
 *
 * On 2026-08-06 a real inbound submission was lost with zero trace. The site
 * was posting to a Slack **Workflow trigger** that declares no variables, so
 * Slack accepted the payload (HTTP 200 `{"ok":true}`), threw it away, and
 * posted an empty message. The route had already returned `success: true` to
 * the submitter, and Slack was the only place the data was ever written.
 *
 * So notification is no longer allowed to be the system of record. Every call
 * records to DynamoDB FIRST, sends SECOND, and writes the delivery outcome
 * back onto the stored item THIRD. Putting that here rather than in each route
 * means all six event types are covered by one code path and a new event type
 * cannot forget to do it.
 *
 * ## Two transports
 *
 * - `hooks.slack.com/triggers/…` — Workflow Builder trigger. Sends flat
 *   `{ eventType, details, metadata }` variables. **Only renders if the
 *   workflow declares those variables**; otherwise it silently posts blank.
 * - `hooks.slack.com/services/…` — classic incoming webhook. Sends Block Kit
 *   and always renders. **Prefer this.**
 */

import { createLogger } from "@/lib/logger"
import {
  markOpsEventDelivered,
  recordOpsEvent,
  type OpsEventHandle,
} from "@/lib/ops-ledger"

/**
 * There is deliberately NO hardcoded fallback webhook URL.
 *
 * A live `hooks.slack.com/triggers/…` URL used to sit here as a default. This
 * repository is PUBLIC, so that URL was an open write endpoint into our Slack
 * — anyone who read the source could post into the ops channel. It also
 * pointed at a workflow that declares no variables, so it silently posted
 * blank messages (the bug that started all this).
 *
 * Configure `SLACK_OPS_WEBHOOK_URL` per environment instead, pointing at a
 * classic incoming webhook (`hooks.slack.com/services/…`) so the Block Kit
 * path below renders. If it is unset we log an error and skip the send — the
 * ledger has already recorded the event by then, so nothing is lost.
 */
export type SlackOpsEvent = {
  /** Short title used to route/organize in Slack (Workflow `eventType`). */
  eventType: string
  details: string
  metadata?: Record<string, string | number | boolean | null | undefined>
  /** Route that produced this event, e.g. `/api/volunteer`. Ledger only. */
  source?: string
  /** Whether Turnstile passed. Ledger only — never sent to Slack. */
  turnstileOk?: boolean
  /** Client IP. Stored ONLY as a salted hash by the ledger. Never sent. */
  ip?: string | null
  /** Client user-agent. Ledger only. */
  userAgent?: string | null
}

const log = createLogger({ service: "spark901-web" }).child({
  component: "slack-notify",
})

let warnedWorkflowTrigger = false

function resolveWebhookUrl(explicit?: string | null): string | null {
  return (
    explicit ||
    process.env.SLACK_OPS_WEBHOOK_URL ||
    process.env.SLACK_STRIPE_WEBHOOK_URL ||
    process.env.SLACK_FEEDBACK_WEBHOOK_URL ||
    process.env.SLACK_GIFT_TOOL_WEBHOOK_URL ||
    process.env.SLACK_VOLUNTEER_WEBHOOK_URL ||
    null
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

/**
 * Record the event durably, then notify Slack, then record whether Slack
 * actually took it.
 *
 * Returns `false` if the Slack delivery failed — unchanged from before, so
 * every existing call site keeps working. Note the return value now means only
 * "did Slack accept it", NOT "was the submission saved": the ledger write is
 * what preserves the data, and it happens either way.
 *
 * Never throws.
 */
export async function notifySlackOps(
  event: SlackOpsEvent,
  options?: { webhookUrl?: string | null },
): Promise<boolean> {
  // 1. Durable record first — before anything that can fail or be discarded.
  let handle: OpsEventHandle | null = null
  try {
    handle = await recordOpsEvent({
      eventType: event.eventType,
      details: event.details,
      metadata: event.metadata,
      source: event.source ?? "slack-notify",
      turnstileOk: event.turnstileOk,
      ip: event.ip,
      userAgent: event.userAgent,
    })
  } catch {
    // recordOpsEvent already swallows and logs; belt and braces.
  }

  const webhookUrl = resolveWebhookUrl(options?.webhookUrl)

  if (!webhookUrl) {
    log.error(
      "No Slack webhook configured (SLACK_OPS_WEBHOOK_URL) — skipping notification. The event IS recorded in the ops ledger.",
      null,
      { eventType: event.eventType, recorded: Boolean(handle) },
    )
    if (handle) {
      await markOpsEventDelivered(handle, {
        ok: false,
        status: null,
        error: "no webhook configured",
      })
    }
    return false
  }

  const usingTrigger = isWorkflowTrigger(webhookUrl)

  if (usingTrigger && !warnedWorkflowTrigger) {
    warnedWorkflowTrigger = true
    log.warn(
      "Notifying via a Slack Workflow trigger. Slack will post a BLANK message unless the workflow declares eventType/details/metadata as trigger variables. Prefer a classic incoming webhook (hooks.slack.com/services/…) via SLACK_OPS_WEBHOOK_URL.",
      { eventType: event.eventType },
    )
  }

  const body = usingTrigger
    ? {
        eventType: event.eventType,
        details: event.details,
        metadata: formatMetadata(event.metadata) || "none",
      }
    : toClassicBlocks(event)

  // 2. Notify.
  let ok = false
  let status: number | null = null
  let error: string | null = null

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    status = response.status
    ok = response.ok

    if (!ok) {
      const text = await response.text().catch(() => "")
      error = text.slice(0, 300)
      log.error("Slack ops notify failed", null, {
        eventType: event.eventType,
        status,
        // Transport shape only — never the URL, which carries the secret path.
        transport: usingTrigger ? "workflow-trigger" : "incoming-webhook",
        response: error,
      })
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught)
    log.error("Slack ops notify error", caught, {
      eventType: event.eventType,
      transport: usingTrigger ? "workflow-trigger" : "incoming-webhook",
    })
  }

  // 3. Record the delivery outcome against the stored event.
  if (handle) {
    await markOpsEventDelivered(handle, { ok, status, error })
  }

  return ok
}

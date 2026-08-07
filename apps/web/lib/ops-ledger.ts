/**
 * Ops event ledger — the durable record of every inbound site event.
 *
 * WHY THIS EXISTS
 * ---------------
 * Inbound events (feedback, beta signup, tool suggestion, volunteer signup,
 * gift-a-tool request, Stripe contributions) used to be sent ONLY to a Slack
 * Workflow trigger. That trigger declared no variables, so Slack silently
 * discarded the payload and posted blank messages — a real lead submitted
 * 2026-08-06 was lost with zero trace. Slack is a NOTIFICATION. This ledger is
 * the RECORD. A notification failure must never again destroy a submission.
 *
 * FAIL-OPEN — NON-NEGOTIABLE
 * --------------------------
 * Nothing in this module may throw into a request path, and nothing here may
 * make a form submission fail. Every exported function swallows its own errors
 * and returns null / void. If `SPARK901_OPS_TABLE` is unset the whole module
 * no-ops silently after a single warn.
 *
 * SECURITY
 * --------
 * Secrets never enter the ledger: metadata keys that look like credentials are
 * dropped, known secret-shaped values (sk_live_…, whsec_…, Slack webhook URLs,
 * bearer tokens) are redacted, and the client IP is stored ONLY as a salted
 * SHA-256 hash. With no `SPARK901_IP_HASH_SALT` set we store no IP at all
 * rather than an unsalted (trivially reversible) hash.
 *
 * Submitter name/email in `metadata` IS the point of the record — it stays
 * inside our own AWS account, in a table encrypted at rest with PITR on.
 *
 * SINGLE-TABLE SHAPE
 * ------------------
 *   pk      = "EVENT#<eventType>"          — all events of one type
 *   sk      = "<createdAt>#<id>"           — time-ordered inside that type
 *   GSI1PK  = "EVENTS"                     — one partition, whole feed
 *   GSI1SK  = "<createdAt>"                — time-ordered across all types
 *
 * Infrastructure: `infra/aws/dynamodb-ops-events.template.json` (table) and
 * `infra/aws/iam-policy-vercel-writer.json` (least-privilege writer policy).
 * Bootstrap runbook: `infra/aws/README.md`.
 */

import { createHash, randomUUID } from "node:crypto"

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"

import { createLogger, type LogEntry, type LogSink } from "@/lib/logger"

// ─── Types ──────────────────────────────────────────────────────────────────

/** JSON-safe metadata value. Matches `SlackOpsEvent["metadata"]` values. */
export type OpsEventMetadataValue = string | number | boolean | null | undefined

/** Metadata bag as supplied by a route (submitter name, email, amount, …). */
export type OpsEventMetadata = Record<string, OpsEventMetadataValue>

/** What a route passes in when recording an inbound event. */
export type OpsEventInput = {
  /** Routing key, e.g. `feedback.beta_signup`. Same vocabulary as Slack. */
  eventType: string
  /** Human-readable one-line summary of what happened. */
  details: string
  /** Structured payload — submitter fields, amounts, ids. */
  metadata?: OpsEventMetadata
  /** Route path that produced the event, e.g. `/api/feedback`. */
  source?: string
  /** Whether Turnstile verification passed for this submission. */
  turnstileOk?: boolean
  /** Raw client IP. Stored ONLY as a salted hash, never verbatim. */
  ip?: string | null
  /** Client user-agent string (truncated). */
  userAgent?: string | null
}

/**
 * Everything needed to address a recorded event again later.
 *
 * The primary key is `EVENT#<eventType>` / `<createdAt>#<id>`, and `createdAt`
 * is generated inside `recordOpsEvent` — so the id alone can never re-address
 * the item. Handing back the whole handle is what makes
 * `markOpsEventDelivered` impossible to call with a key it cannot build.
 */
export type OpsEventHandle = {
  id: string
  eventType: string
  createdAt: string
}

/** Outcome of the Slack (or other) delivery attempt for a recorded event. */
export type OpsEventDeliveryResult = {
  ok: boolean
  /** HTTP status from the notification transport, when there was one. */
  status?: number | null
  /** Short error description. Never a raw token or full webhook URL. */
  error?: string | null
}

/** The `delivery` map as persisted on the item. */
export type OpsEventDelivery = {
  ok: boolean
  status: number | null
  error: string | null
  attemptedAt: string
}

/** The full persisted item shape. Exported so readers can type a Query. */
export type OpsEventItem = {
  pk: string
  sk: string
  GSI1PK: string
  GSI1SK: string
  id: string
  eventType: string
  details: string
  metadata: Record<string, string | number | boolean>
  source: string
  createdAt: string
  turnstileOk: boolean | null
  ipHash: string | null
  userAgent: string | null
  delivery?: OpsEventDelivery
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Partition key value for the all-events time-ordered feed. */
const FEED_PARTITION = "EVENTS"

/** GSI name — must match `infra/aws/dynamodb-ops-events.template.json`. */
export const OPS_LEDGER_FEED_INDEX = "GSI1"

/** `eventType` used when persisting an error/fatal log entry via the sink. */
export const OPS_LEDGER_LOG_EVENT_TYPE = "log.error"

const MAX_DETAILS_LENGTH = 2000
const MAX_METADATA_VALUE_LENGTH = 2000
const MAX_METADATA_KEYS = 60
const MAX_USER_AGENT_LENGTH = 512
const MAX_ERROR_LENGTH = 500

/**
 * Metadata keys that must never be persisted. Matched case-insensitively as a
 * substring, so `stripeSecretKey`, `SLACK_WEBHOOK_URL`, and `authorization`
 * are all caught.
 */
const REDACTED_KEY_PATTERN =
  /(secret|token|password|passwd|authorization|auth_header|api[-_ ]?key|apikey|private[-_ ]?key|credential|signature|session|cookie|webhook|bearer)/i

/**
 * Value shapes that are secrets regardless of their key name — Stripe keys,
 * webhook signing secrets, Slack webhook/trigger URLs, bearer headers.
 */
const REDACTED_VALUE_PATTERNS: readonly RegExp[] = [
  /\bsk_(live|test)_[A-Za-z0-9]+/g,
  /\brk_(live|test)_[A-Za-z0-9]+/g,
  /\bwhsec_[A-Za-z0-9]+/g,
  /\bxox[abposr]-[A-Za-z0-9-]+/g,
  /https:\/\/hooks\.slack\.com\/\S+/gi,
  /\bBearer\s+[A-Za-z0-9._-]+/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
]

const REDACTED = "[redacted]"

// ─── Logger ─────────────────────────────────────────────────────────────────

/**
 * Our own logger. Every entry carries `component: "ops-ledger"` so the log
 * sink below can recognise — and skip — entries this module produced. Without
 * that marker a failing ledger write would log an error, which the sink would
 * try to persist, which would fail, which would log an error… forever.
 */
const log = createLogger({ service: "spark901-web" }).child({
  component: "ops-ledger",
})

// ─── Configuration ──────────────────────────────────────────────────────────

let client: DynamoDBDocumentClient | null = null
let warnedMissingTable = false
let warnedMissingSalt = false

/** Table name, or null when the ledger is not configured (module no-ops). */
function getTableName(): string | null {
  const table = process.env.SPARK901_OPS_TABLE?.trim()
  if (!table) {
    if (!warnedMissingTable) {
      warnedMissingTable = true
      log.warn(
        "SPARK901_OPS_TABLE is not set — ops events are NOT being persisted.",
      )
    }
    return null
  }
  return table
}

/**
 * Lazy singleton DynamoDB document client.
 *
 * `SPARK901_`-prefixed credentials are primary on purpose: the site's dedicated
 * least-privilege IAM user must never collide with whatever `AWS_*` variables
 * the Vercel/Lambda runtime sets for itself. The unprefixed names remain as a
 * local-development fallback, and past those we fall through to the default
 * credential chain (shared profile, instance role, …).
 */
function getOpsLedgerClient(): DynamoDBDocumentClient {
  if (!client) {
    const region =
      process.env.SPARK901_AWS_REGION ||
      process.env.AWS_REGION ||
      "us-east-1"

    const accessKeyId =
      process.env.SPARK901_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey =
      process.env.SPARK901_AWS_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY

    const clientConfig: {
      region: string
      credentials?: { accessKeyId: string; secretAccessKey: string }
    } = { region }

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey }
    } else {
      // Default credential chain: env, shared credentials file, IAM role, …
      log.warn(
        "SPARK901_AWS_ACCESS_KEY_ID / SPARK901_AWS_SECRET_ACCESS_KEY not found. Using default credential chain.",
      )
    }

    const baseClient = new DynamoDBClient(clientConfig)
    client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: {
        // Empty strings are legal in DynamoDB but noisy; drop them.
        convertEmptyValues: false,
        removeUndefinedValues: true,
      },
    })
  }

  return client
}

// ─── Sanitizing ─────────────────────────────────────────────────────────────

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…[truncated]` : value
}

function redactValueShapes(value: string): string {
  let out = value
  for (const pattern of REDACTED_VALUE_PATTERNS) {
    pattern.lastIndex = 0
    out = out.replace(pattern, REDACTED)
  }
  return out
}

function sanitizeString(value: string, max: number): string {
  return truncate(redactValueShapes(value), max)
}

/**
 * Drop credential-shaped keys, redact secret-shaped values, drop empty
 * values, truncate long ones, and cap the number of keys. Never throws.
 */
function sanitizeMetadata(
  metadata: OpsEventMetadata | undefined,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!metadata) return out

  try {
    let kept = 0
    for (const [key, value] of Object.entries(metadata)) {
      if (kept >= MAX_METADATA_KEYS) break
      if (value === undefined || value === null || value === "") continue

      if (REDACTED_KEY_PATTERN.test(key)) {
        out[key] = REDACTED
        kept += 1
        continue
      }

      if (typeof value === "string") {
        out[key] = sanitizeString(value, MAX_METADATA_VALUE_LENGTH)
      } else if (typeof value === "number") {
        out[key] = Number.isFinite(value) ? value : String(value)
      } else {
        out[key] = value
      }
      kept += 1
    }
  } catch {
    // A hostile getter on the metadata object must not break the write.
    return out
  }

  return out
}

/**
 * Salted SHA-256 of the client IP, or null.
 *
 * No salt → no IP. An unsalted hash of an IPv4 address is reversible by brute
 * force in seconds (2^32 candidates), so storing one would be storing the IP.
 */
function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null

  const salt = process.env.SPARK901_IP_HASH_SALT?.trim()
  if (!salt) {
    if (!warnedMissingSalt) {
      warnedMissingSalt = true
      log.warn(
        "SPARK901_IP_HASH_SALT is not set — client IPs are being omitted from the ops ledger (an unsalted IP hash is reversible).",
      )
    }
    return null
  }

  try {
    return createHash("sha256").update(`${salt}:${ip.trim()}`).digest("hex")
  } catch {
    return null
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Persist an inbound ops event. Returns a handle addressing the stored item,
 * or `null` when the ledger is unconfigured or the write failed.
 *
 * NEVER throws. Callers should treat a `null` return as "not recorded" and
 * carry on — a submission must succeed even with the ledger down. Pass the
 * returned handle to `markOpsEventDelivered` to attach the delivery outcome.
 */
export async function recordOpsEvent(
  input: OpsEventInput,
): Promise<OpsEventHandle | null> {
  try {
    const tableName = getTableName()
    if (!tableName) return null

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    const item: OpsEventItem = {
      pk: `EVENT#${input.eventType}`,
      sk: `${createdAt}#${id}`,
      GSI1PK: FEED_PARTITION,
      GSI1SK: createdAt,
      id,
      eventType: input.eventType,
      details: sanitizeString(input.details ?? "", MAX_DETAILS_LENGTH),
      metadata: sanitizeMetadata(input.metadata),
      source: input.source ?? "unknown",
      createdAt,
      turnstileOk:
        typeof input.turnstileOk === "boolean" ? input.turnstileOk : null,
      ipHash: hashIp(input.ip),
      userAgent: input.userAgent
        ? sanitizeString(input.userAgent, MAX_USER_AGENT_LENGTH)
        : null,
    }

    await getOpsLedgerClient().send(
      new PutCommand({ TableName: tableName, Item: item }),
    )

    return { id, eventType: input.eventType, createdAt }
  } catch (error) {
    // Fail open. The submission is more important than the record of it.
    log.error("Failed to record ops event", error, {
      eventType: input?.eventType,
      source: input?.source,
    })
    return null
  }
}

/**
 * Attach the notification delivery outcome to an already-recorded event.
 *
 * Takes the handle returned by `recordOpsEvent`, which carries the three parts
 * of the primary key (`EVENT#<eventType>` / `<createdAt>#<id>`).
 *
 * NEVER throws. A missing item is not an error — the original write may have
 * failed, and we do not want a phantom item created here.
 */
export async function markOpsEventDelivered(
  handle: OpsEventHandle,
  result: OpsEventDeliveryResult,
): Promise<void> {
  // Destructured outside the try so the catch block can name them too.
  const { id, eventType, createdAt } = handle

  try {
    const tableName = getTableName()
    if (!tableName) return
    if (!id || !eventType || !createdAt) return

    const delivery: OpsEventDelivery = {
      ok: Boolean(result?.ok),
      status:
        typeof result?.status === "number" && Number.isFinite(result.status)
          ? result.status
          : null,
      error: result?.error
        ? sanitizeString(String(result.error), MAX_ERROR_LENGTH)
        : null,
      attemptedAt: new Date().toISOString(),
    }

    await getOpsLedgerClient().send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: `EVENT#${eventType}`, sk: `${createdAt}#${id}` },
        UpdateExpression: "SET #delivery = :delivery",
        ExpressionAttributeNames: { "#delivery": "delivery" },
        ExpressionAttributeValues: { ":delivery": delivery },
        // Never create a phantom item for an event that was never recorded.
        ConditionExpression: "attribute_exists(pk)",
      }),
    )
  } catch (error) {
    const name = (error as { name?: string } | null)?.name
    if (name === "ConditionalCheckFailedException") {
      // The event was never recorded (ledger was down at submit time).
      log.warn("Ops event not found when marking delivery", { id, eventType })
      return
    }
    log.error("Failed to mark ops event delivery", error, { id, eventType })
  }
}

// ─── Log sink ───────────────────────────────────────────────────────────────

/**
 * Re-entrancy guard. `dispatchToExtraSinks` runs synchronously inside
 * `Logger.emit`, so anything this sink logs would come straight back through
 * it. Combined with the `component: "ops-ledger"` skip below, this makes an
 * infinite log→write→fail→log loop impossible.
 */
let inSink = false

/**
 * A `LogSink` that persists `error` and `fatal` log entries into the same
 * ledger as `EVENT#log.error` items, so the debug trail and the lost-lead
 * trail live in one place and one query.
 *
 * Register it once at app startup (NOT inside `lib/logger`, which must stay
 * dependency-free):
 *
 * ```ts
 * import { addLogSink } from "@/lib/logger"
 * import { logEntrySink } from "@/lib/ops-ledger"
 * addLogSink(logEntrySink)
 * ```
 *
 * Synchronous by contract: the write is fired and forgotten, and its rejection
 * is swallowed. Logging must never block or fail a request.
 */
export const logEntrySink: LogSink = (entry: LogEntry): void => {
  try {
    if (entry.level !== "error" && entry.level !== "fatal") return

    // Skip our own entries — persisting them is what would recurse.
    if (entry.context?.["component"] === "ops-ledger") return
    if (inSink) return

    if (!process.env.SPARK901_OPS_TABLE?.trim()) return

    inSink = true
    try {
      const metadata: OpsEventMetadata = {
        level: entry.level,
        env: entry.env,
        runtime: entry.runtime,
        loggedAt: entry.timestamp,
        errorName: entry.error?.name ?? null,
        errorMessage: entry.error?.message ?? null,
        errorCode:
          typeof entry.error?.code === "number" ||
          typeof entry.error?.code === "string"
            ? entry.error.code
            : null,
        errorStatus: entry.error?.status ?? null,
      }

      // Flatten caller context onto the metadata bag; sanitizeMetadata drops
      // anything credential-shaped.
      for (const [key, value] of Object.entries(entry.context ?? {})) {
        if (key in metadata) continue
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        ) {
          metadata[`ctx_${key}`] = value
        } else if (value !== undefined) {
          try {
            metadata[`ctx_${key}`] = JSON.stringify(value)
          } catch {
            // unserializable — skip it
          }
        }
      }

      void recordOpsEvent({
        eventType: OPS_LEDGER_LOG_EVENT_TYPE,
        details: entry.message,
        metadata,
        source: `logger:${entry.service}`,
      }).catch(() => {
        // recordOpsEvent already swallows; belt and braces.
      })
    } finally {
      inSink = false
    }
  } catch {
    // A sink must never throw. No logger call here — that is the loop.
  }
}

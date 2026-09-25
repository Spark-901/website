/**
 * Per-IP rate limiter for "Ask the Archive" (`/api/civic-archive/ask`) — caps
 * each client at 3 queries per rolling 24 hours, on top of Turnstile. Each
 * submission already costs real money (a rag-gateway semantic search plus a
 * Bedrock LLM call), so this exists to bound worst-case cost per visitor, not
 * to replace Turnstile's bot defense.
 *
 * Table: `spark901-ask-archive-ratelimit` (name comes from
 * `SPARK901_ASK_ARCHIVE_RATELIMIT_TABLE`). Provisioning runbook + exact
 * schema: `infra/aws/README.md`'s "Ask the Archive rate-limit table" section.
 * Reuses the SAME `spark901-web-ops-ledger` IAM user / access key as
 * `lib/ops-ledger.ts` and `lib/civic-archive-s3.ts` (a second, separately-
 * scoped policy attached to that one user) — see `getSpark901AwsClientConfig`
 * in `lib/ops-ledger.ts`.
 *
 * FAILS OPEN, deliberately, matching this repo's `lib/ops-ledger.ts`
 * convention: an unconfigured table, a missing `SPARK901_IP_HASH_SALT`, or a
 * DynamoDB error must never itself block a real visitor from using Ask the
 * Archive. Turnstile is the backstop against automated abuse either way; this
 * module only bounds COST for legitimate traffic.
 */
import { createHash } from "node:crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { createLogger } from "@/lib/logger"
import { getSpark901AwsClientConfig } from "@/lib/ops-ledger"

const log = createLogger({ service: "spark901-web" }).child({
  component: "lib.civic-archive-ratelimit",
})

/** Max queries allowed per client IP per window. */
export const ASK_THE_ARCHIVE_RATE_LIMIT = 3

/** Window length, in seconds — also the TTL lifetime of a counter item. */
const WINDOW_SECONDS = 24 * 60 * 60

let client: DynamoDBDocumentClient | null = null
let warnedMissingTable = false
let warnedMissingSalt = false

function getTableName(): string | null {
  const table = process.env.SPARK901_ASK_ARCHIVE_RATELIMIT_TABLE?.trim()
  if (!table) {
    if (!warnedMissingTable) {
      warnedMissingTable = true
      log.warn(
        "SPARK901_ASK_ARCHIVE_RATELIMIT_TABLE is not set — Ask the Archive rate limiting is disabled (Turnstile is the only remaining guard).",
      )
    }
    return null
  }
  return table
}

function getClient(): DynamoDBDocumentClient {
  if (!client) {
    const baseClient = new DynamoDBClient(getSpark901AwsClientConfig())
    client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: { convertEmptyValues: false, removeUndefinedValues: true },
    })
  }
  return client
}

/**
 * Same salted SHA-256 as `lib/ops-ledger.ts`'s `hashIp` — hand-rolled here
 * rather than importing it because this module needs a hard `null` when no
 * salt is configured to mean something slightly different (see
 * `checkAndIncrementRateLimit`'s doc comment): "cannot rate-limit safely" is
 * a distinct case from "chose not to record an IP," even though the
 * underlying hash math is identical. Kept in lockstep with `ops-ledger.ts`
 * on purpose — if that algorithm ever changes, this must change with it.
 */
function hashClientIp(ip: string): string | null {
  const salt = process.env.SPARK901_IP_HASH_SALT?.trim()
  if (!salt) {
    if (!warnedMissingSalt) {
      warnedMissingSalt = true
      log.warn(
        "SPARK901_IP_HASH_SALT is not set — Ask the Archive rate limiting is disabled (an unsalted IP hash is reversible, so we never compute one).",
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

export type RateLimitDecision =
  | { limited: false; remaining: number | null }
  | { limited: true; remaining: 0 }

/**
 * Atomically increments the caller's counter for the current window and
 * returns whether they're now over `ASK_THE_ARCHIVE_RATE_LIMIT`.
 *
 * `remaining: null` means "not actually enforced this request" — either the
 * table isn't configured, the salt isn't configured, or the IP couldn't be
 * determined, or the DynamoDB call itself failed. In every one of those
 * cases we return `{ limited: false }` (fail open) rather than throw, per
 * this file's top-level doc comment.
 */
export async function checkAndIncrementRateLimit(
  clientIp: string | undefined | null,
): Promise<RateLimitDecision> {
  const tableName = getTableName()
  if (!tableName) return { limited: false, remaining: null }

  if (!clientIp) {
    log.warn("No client IP available — cannot rate-limit this request, allowing it through")
    return { limited: false, remaining: null }
  }

  const ipHash = hashClientIp(clientIp)
  if (!ipHash) return { limited: false, remaining: null }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const windowExpiresAt = nowSeconds + WINDOW_SECONDS

  try {
    // Atomic: bump `count`, and set `expiresAt` ONLY if this is the first
    // write for this ipHash (if_not_exists) so subsequent queries inside the
    // same window don't push the expiry (and therefore the cap) further out.
    const result = await getClient().send(
      new UpdateCommand({
        TableName: tableName,
        Key: { ipHash },
        UpdateExpression:
          "SET #count = if_not_exists(#count, :zero) + :incr, expiresAt = if_not_exists(expiresAt, :expiresAt)",
        ExpressionAttributeNames: { "#count": "count" },
        ExpressionAttributeValues: {
          ":zero": 0,
          ":incr": 1,
          ":expiresAt": windowExpiresAt,
        },
        ReturnValues: "UPDATED_NEW",
      }),
    )

    const newCount = typeof result.Attributes?.["count"] === "number" ? result.Attributes["count"] : null
    if (newCount === null) {
      // Shouldn't happen given the UpdateExpression above, but never trust a
      // response shape blindly — fail open rather than mis-cap on a fluke.
      return { limited: false, remaining: null }
    }

    if (newCount > ASK_THE_ARCHIVE_RATE_LIMIT) {
      return { limited: true, remaining: 0 }
    }
    return { limited: false, remaining: Math.max(0, ASK_THE_ARCHIVE_RATE_LIMIT - newCount) }
  } catch (err) {
    log.error(
      "Ask the Archive rate-limit check failed — failing open (allowing the request)",
      err instanceof Error ? err : new Error(String(err)),
    )
    return { limited: false, remaining: null }
  }
}

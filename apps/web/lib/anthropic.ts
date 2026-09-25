/**
 * Thin wrapper around `@anthropic-ai/sdk` for the "Ask the Archive"
 * answer-synthesis call (`app/api/civic-archive/ask/route.ts`).
 *
 * `@anthropic-ai/sdk` was NOT already a dependency anywhere in this repo
 * family (checked `Spark-901/website`, `wtc-monorepo`, `901bambird` —
 * 901bambird calls Claude through AWS Bedrock via `@ai-sdk/amazon-bedrock`,
 * not the direct Anthropic API). This is a fresh addition, added because
 * "Ask the Archive" is explicitly a single, cheap, per-request synthesis
 * call (Claude Haiku) — not a durable batch job — so the direct Anthropic
 * API is the simplest fit and needs no AWS IAM/Bedrock provisioning.
 *
 * Model: Claude Haiku — cheapest/fastest tier, matching the "relatively
 * cheap LLM" framing in `personal-work/goals/collierville-civic-data.md`'s
 * build plan for this feature. Job 2 (automated per-meeting extraction) is
 * a different call site and deliberately uses AWS Bedrock + Claude 3.5
 * Sonnet instead — see `lib/bedrock.ts`.
 */
import Anthropic from "@anthropic-ai/sdk"

let cachedClient: Anthropic | null = null

/** Returns `null` (never throws) when `ANTHROPIC_API_KEY` is not configured — callers should treat that as "feature not configured yet". */
export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey })
  }
  return cachedClient
}

/**
 * Fast/cheap tier — the right choice for a per-request, user-facing
 * synthesis call. Exact current model ID (no date suffix — Anthropic's
 * current-generation model IDs are bare, unlike older dated snapshots).
 */
export const ASK_THE_ARCHIVE_MODEL = "claude-haiku-4-5"

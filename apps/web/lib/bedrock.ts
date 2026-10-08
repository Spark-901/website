/**
 * AWS Bedrock wrapper — the ONE LLM path for both civic-archive jobs:
 *   - Job 2 (`app/api/civic-archive/sync/route.ts`): turns one meeting's
 *     structured transcript into a validated `MeetingSummary` via a single
 *     structured-output Bedrock call (`extractMeetingSummaryWithBedrock`).
 *   - Job 1 (`app/api/civic-archive/ask/route.ts`): synthesizes a plain-text,
 *     cited answer from retrieved transcript excerpts via a single free-text
 *     Bedrock call (`synthesizeTextWithBedrock`).
 *
 * Originally Job 1 called the direct Anthropic API (Claude Haiku) instead —
 * switched to Bedrock 2026-09-25 per Miclain's explicit instruction, once
 * real Bedrock credentials went live in Vercel: **one credential path for
 * both jobs**, no separate `ANTHROPIC_API_KEY` to provision/rotate. The old
 * `lib/anthropic.ts` was deleted; see git history if it's ever needed again.
 *
 * Default model: **Amazon Nova Lite** (`SPARK901_BEDROCK_MODEL_ID`,
 * currently `us.amazon.nova-lite-v1:0`) — Miclain's explicit choice,
 * meaningfully cheaper than Claude on Bedrock. The IAM policy backing the
 * dedicated Bedrock IAM user also permits two fallback model ARNs (Amazon
 * Nova Pro, Claude Haiku 4.5) with NO policy change needed to switch — if
 * Nova Lite's output quality doesn't hold up for either job, changing
 * `SPARK901_BEDROCK_MODEL_ID` in Vercel is the entire fix, no redeploy of
 * code required (env vars are read per-request, not baked at build time).
 *
 * ⚠️ UNVERIFIED, flagged plainly: this session has no real Bedrock
 * credentials to actually invoke either function against — the
 * `Output.object(...)` structured-output path in
 * `extractMeetingSummaryWithBedrock` was written for and previously
 * exercised (in comments/design) against Claude's tool-calling behavior.
 * Nova Lite/Pro support Bedrock Converse-API tool calling too, and the AI
 * SDK's `structuredOutputMode: "jsonTool"` is model-agnostic by design, so
 * this SHOULD work unchanged — but it has not been run against a real Nova
 * response. First real run with live credentials should specifically watch
 * Job 2's schema-validation step (`MeetingSummarySchema.parse`) for
 * Nova-specific structured-output quirks; if it's unreliable, the documented
 * fallback is switching `SPARK901_BEDROCK_MODEL_ID` to Claude Haiku 4.5 via
 * the already-permitted fallback ARN, not a code change.
 *
 * Matches `901bambird`'s existing Bedrock integration pattern
 * (`901bambird/src/app/api/chat/route.ts`): `@ai-sdk/amazon-bedrock`'s
 * `createAmazonBedrock({ region, accessKeyId, secretAccessKey })`, model id
 * driven by an env var with a real default rather than hardcoded.
 */
import { createAmazonBedrock, type AmazonBedrockLanguageModelOptions } from "@ai-sdk/amazon-bedrock"
import { generateText, Output } from "ai"
import { MeetingSummarySchema, type MeetingSummary } from "@spark901/meeting-summary-schema"
import type { StructuredTranscriptDocument } from "./civic-archive-rag-ingest"
import { meetingIdFor } from "./civic-archive-rag-ingest"

/**
 * Amazon Nova Lite — Miclain's explicit choice (cheaper than Claude on
 * Bedrock). Overridable via env without a code change; fallback ARNs already
 * permitted by the IAM policy are Amazon Nova Pro and Claude Haiku 4.5 — see
 * this file's top doc comment.
 */
const DEFAULT_BEDROCK_MODEL_ID = "us.amazon.nova-lite-v1:0"

export interface BedrockCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  modelId: string
}

/**
 * Reads Bedrock credentials from env, or returns `null` if not configured
 * — callers should treat that as "the Bedrock-backed feature isn't wired up
 * yet" rather than throwing. See this repo's `infra/aws/README.md` for the
 * naming convention these mirror (the `SPARK901_` prefix is primary so the
 * platform's own `AWS_*` runtime vars can never shadow ours). Kept as a
 * SEPARATE credential pair from `SPARK901_AWS_ACCESS_KEY_ID`/
 * `SPARK901_AWS_SECRET_ACCESS_KEY` (the DynamoDB ops-ledger writer) —
 * least privilege, one IAM user per capability, same as 901bambird keeping
 * `AWS_BEDROCK_*` separate from `AWS_SES_*`.
 *
 * **Live in Vercel as of 2026-09-25** (Miclain provisioned these directly —
 * see this file's exported `BEDROCK_ENV_VARS` for the full var list/purpose).
 */
export function getBedrockCredentials(): BedrockCredentials | null {
  const accessKeyId = process.env.SPARK901_BEDROCK_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.SPARK901_BEDROCK_AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) return null
  const region = process.env.SPARK901_BEDROCK_AWS_REGION ?? "us-east-1"
  const modelId = process.env.SPARK901_BEDROCK_MODEL_ID ?? DEFAULT_BEDROCK_MODEL_ID
  return { accessKeyId, secretAccessKey, region, modelId }
}

export const BEDROCK_ENV_VARS = [
  { name: "SPARK901_BEDROCK_AWS_ACCESS_KEY_ID", purpose: "Access key for a dedicated, least-privilege Bedrock-invoke IAM user. LIVE in Vercel." },
  { name: "SPARK901_BEDROCK_AWS_SECRET_ACCESS_KEY", purpose: "Secret for that same IAM user. LIVE in Vercel." },
  { name: "SPARK901_BEDROCK_AWS_REGION", purpose: `AWS region for Bedrock InvokeModel calls. LIVE in Vercel as "us-east-1". Defaults to "us-east-1" if unset.` },
  { name: "SPARK901_BEDROCK_MODEL_ID", purpose: `Bedrock model id. LIVE in Vercel as "${DEFAULT_BEDROCK_MODEL_ID}" (Amazon Nova Lite). Defaults to the same value in code if unset. Fallback ARNs already permitted by the IAM policy: Amazon Nova Pro, Claude Haiku 4.5 — switch by changing this var only.` },
] as const

/**
 * One free-text Bedrock synthesis call — Job 1's answer-generation step.
 * No structured-output schema (unlike `extractMeetingSummaryWithBedrock`):
 * "Ask the Archive" just needs a short, grounded, cited prose answer, so a
 * plain `generateText` call is the simplest, cheapest fit.
 *
 * Returns the trimmed answer text, or throws if the model returned no text
 * — the caller (`app/api/civic-archive/ask/route.ts`) is expected to catch
 * this and return a 502 rather than publish an empty answer.
 */
export async function synthesizeTextWithBedrock(
  credentials: BedrockCredentials,
  system: string,
  prompt: string,
): Promise<string> {
  const bedrock = createAmazonBedrock({
    region: credentials.region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  })

  const { text } = await generateText({
    model: bedrock(credentials.modelId),
    system,
    prompt,
    maxOutputTokens: 768,
  })

  const answer = text.trim()
  if (!answer) {
    throw new Error("Bedrock response contained no text")
  }
  return answer
}

const EXTRACTION_SYSTEM_PROMPT = `You are extracting a structured summary of a Tennessee town government meeting from its transcript, for a civic-transparency tool residents will read.

Ground every field ONLY in the transcript text provided — never invent or assume anything not stated. This transcript is AUTOMATED, UNCORRECTED closed-captioning and will contain errors (misheard names, garbled phrases) — do your best to interpret it, but do not silently "fix" a name or number you cannot actually verify from context.

Critical accuracy rule: distinguish PROPOSED from ADOPTED. An ordinance discussed, amended on the floor, tabled, or given a "first reading" has NOT taken effect — never describe it as if it has. Only describe an item as approved/adopted/passed when the transcript shows a completed vote with a positive result.

For each agenda item: classify it as "decision", "vote", "discussion", "public-comment", "presentation", or "other". Only set "outcome" when the transcript clearly states a result (e.g. a roll-call vote tally) — leave it unset otherwise, never guess.

Write the "overview" as 2-4 plain-language sentences a resident with no government background could follow, highlighting what's actually newsworthy (a real debate, a real decision) over routine consent-agenda approvals.

List "actionItems" as concrete decisions/approvals/directives with their timestamp. List "topics" as short lowercase tags (e.g. "zoning", "budget", "public safety").

Always set "transcriptCaveat" to exactly: "This summary is based on a transcript compiled from uncorrected closed captioning and may contain errors. It is not an official record of the meeting."`

/**
 * Runs one Bedrock call to extract a validated `MeetingSummary` from a
 * meeting's structured transcript. Throws if Bedrock's output fails
 * `MeetingSummarySchema` validation — the caller (the sync route) is
 * expected to catch this, log it, and skip that meeting rather than
 * publish an unvalidated summary.
 */
export async function extractMeetingSummaryWithBedrock(
  credentials: BedrockCredentials,
  town: string,
  transcript: StructuredTranscriptDocument,
): Promise<MeetingSummary> {
  const bedrock = createAmazonBedrock({
    region: credentials.region,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  })

  const meetingId = meetingIdFor(transcript)
  const transcriptText = transcript.segments
    .map((s) => `[${s.timestamp}] ${s.agendaItem}\n${s.text}`)
    .join("\n\n")

  // "jsonTool" forced explicitly, not "auto" (the SDK's default) — the
  // Bedrock provider's own docs warn native structured output ("auto"'s
  // first choice) "can be unreliable across workloads and Bedrock
  // accounts"; forcing the JSON-tool fallback trades a little latency for
  // reliability, which matters more for an unattended batch job than for
  // an interactive request.
  const { output } = await generateText({
    model: bedrock(credentials.modelId),
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `Meeting: ${transcript.board} — ${transcript.meetingDate}\n\nTranscript:\n\n${transcriptText}`,
    output: Output.object({
      schema: MeetingSummarySchema.omit({
        meetingId: true,
        date: true,
        board: true,
        sourceVideoUrl: true,
      }),
    }),
    providerOptions: {
      bedrock: {
        structuredOutputMode: "jsonTool",
      } satisfies AmazonBedrockLanguageModelOptions,
    },
  })

  const candidate: MeetingSummary = {
    ...output,
    meetingId,
    date: transcript.meetingDate,
    board: transcript.board,
    sourceVideoUrl: transcript.sourceUrl,
    title: output.title || `${transcript.board} — ${transcript.meetingDate}`,
    transcriptCaveat:
      output.transcriptCaveat ||
      "This summary is based on a transcript compiled from uncorrected closed captioning and may contain errors. It is not an official record of the meeting.",
  }

  // Re-validate the fully-assembled object (not just Bedrock's partial
  // output) — this is the same schema `content/civic-archive/<town>/*.json`
  // is validated against at read time, so a malformed Bedrock response can
  // never silently reach the live site.
  return MeetingSummarySchema.parse(candidate)
}

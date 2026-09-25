/**
 * AWS Bedrock wrapper for the Job 2 automation pipeline
 * (`app/api/civic-archive/sync/route.ts`) — turns one meeting's structured
 * transcript into a validated `MeetingSummary` via a single Bedrock call.
 *
 * Matches `901bambird`'s existing Bedrock/Claude integration pattern
 * (`901bambird/src/app/api/chat/route.ts`): `@ai-sdk/amazon-bedrock`'s
 * `createAmazonBedrock({ region, accessKeyId, secretAccessKey })`, model id
 * driven by an env var with a real default rather than hardcoded. That app
 * calls `streamText` for a live chat UI; this one calls `generateText` with
 * a `zod` `output: Output.object(...)` schema instead — a one-shot batch
 * extraction, not a stream, and the whole point is a structurally-validated
 * `MeetingSummary` object, not free text.
 *
 * Deliberately AWS Bedrock, not the direct Anthropic API — this is Job 2's
 * distinguishing requirement (vs. Job 1's Haiku-via-Anthropic-API call in
 * `lib/anthropic.ts`) and reuses an already-proven integration pattern in
 * this repo family rather than standing up fresh Bedrock IAM/invocation
 * code from scratch.
 */
import { createAmazonBedrock, type AmazonBedrockLanguageModelOptions } from "@ai-sdk/amazon-bedrock"
import { generateText, Output } from "ai"
import { MeetingSummarySchema, type MeetingSummary } from "@spark901/meeting-summary-schema"
import type { StructuredTranscriptDocument } from "./civic-archive-rag-ingest"
import { meetingIdFor } from "./civic-archive-rag-ingest"

/**
 * Claude 3.5 Sonnet, matching 901bambird's model precisely — see this
 * file's doc comment. Overridable via env without a code change, same
 * pattern as 901bambird's own `BEDROCK_MODEL_ID`.
 */
const DEFAULT_BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

export interface BedrockCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  modelId: string
}

/**
 * Reads Bedrock credentials from env, or returns `null` if not configured
 * — callers should treat that as "the automation feature isn't wired up
 * yet" rather than throwing. See this repo's `infra/aws/README.md` for the
 * naming convention these mirror (the `SPARK901_` prefix is primary so the
 * platform's own `AWS_*` runtime vars can never shadow ours). Kept as a
 * SEPARATE credential pair from `SPARK901_AWS_ACCESS_KEY_ID`/
 * `SPARK901_AWS_SECRET_ACCESS_KEY` (the DynamoDB ops-ledger writer) —
 * least privilege, one IAM user per capability, same as 901bambird keeping
 * `AWS_BEDROCK_*` separate from `AWS_SES_*`.
 *
 * NONE of these env vars are set anywhere yet (checked: not in
 * `apps/web/vercel.json`, not documented elsewhere in this repo before
 * this change) — see this file's exported `BEDROCK_ENV_VARS` for the
 * exact names/purposes to hand to whoever provisions them.
 */
export function getBedrockCredentials(): BedrockCredentials | null {
  const accessKeyId = process.env.SPARK901_BEDROCK_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.SPARK901_BEDROCK_AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) return null
  const region = process.env.SPARK901_BEDROCK_REGION ?? "us-east-1"
  const modelId = process.env.SPARK901_BEDROCK_MODEL_ID ?? DEFAULT_BEDROCK_MODEL_ID
  return { accessKeyId, secretAccessKey, region, modelId }
}

export const BEDROCK_ENV_VARS = [
  { name: "SPARK901_BEDROCK_AWS_ACCESS_KEY_ID", purpose: "Access key for a dedicated, least-privilege Bedrock-invoke IAM user." },
  { name: "SPARK901_BEDROCK_AWS_SECRET_ACCESS_KEY", purpose: "Secret for that same IAM user." },
  { name: "SPARK901_BEDROCK_REGION", purpose: `AWS region for Bedrock InvokeModel calls. Defaults to "us-east-1" if unset.` },
  { name: "SPARK901_BEDROCK_MODEL_ID", purpose: `Bedrock model id. Defaults to "${DEFAULT_BEDROCK_MODEL_ID}" (Claude 3.5 Sonnet) if unset.` },
] as const

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

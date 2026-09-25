import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { verifyTurnstileToken, getClientIp } from "@/lib/turnstile"
import { isFeatureEnabled } from "@/lib/features"
import { civicArchiveRagProjectId, getRagGatewayClient } from "@/lib/rag-gateway-client"
import { getBedrockCredentials, synthesizeTextWithBedrock } from "@/lib/bedrock"
import { checkAndIncrementRateLimit, ASK_THE_ARCHIVE_RATE_LIMIT } from "@/lib/civic-archive-ratelimit"
import {
  AskTheArchiveRequestSchema,
  parseCivicArchiveRagTitle,
  type AskTheArchiveCitation,
  type AskTheArchiveResponse,
} from "@/lib/civic-archive-ask"

const log = createLogger({ service: "spark901-web" }).child({
  component: "api.civic-archive.ask",
})

const TOWN_SLUG = "collierville"
const TOP_K = 6
/** Below this rag-gateway score, treat a "match" as noise rather than a real citation. */
const MIN_CITATION_SCORE = 0.35

const NO_RESULTS_ANSWER =
  "I couldn't find anything in the Collierville Board of Mayor and Aldermen meetings we've archived so far that discusses this. It may not have come up, or it may be in a meeting we haven't summarized yet."

const SYSTEM_PROMPT = `You are "Ask the Archive," a research assistant for Spark901's Collierville Civic Archive — a proof-of-concept tool built from real, publicly available Board of Mayor and Aldermen (BMA) meeting transcripts.

Rules, no exceptions:
- Answer ONLY using the transcript excerpts provided below. Never use outside knowledge about Collierville, its government, or its officials.
- If the excerpts don't actually answer the question, say so plainly instead of guessing or inferring.
- Every claim in your answer must be traceable to one of the excerpts. Refer to meetings by date (e.g. "at the August 17, 2026 meeting").
- These excerpts come from an AUTOMATED, UNCORRECTED closed-captioning transcript, not an official record — it can contain errors (misheard names, garbled phrases). Do not paper over that; if an excerpt looks garbled, note it rather than confidently restating it as fact.
- Keep the answer concise — 2 to 5 sentences unless the question genuinely needs more.
- Never state or imply the legal status of a matter (e.g. whether an ordinance is "law") beyond what the excerpt itself says — summarizing is safe, asserting legal effect is not.`

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled("ASK_THE_ARCHIVE")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = AskTheArchiveRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A question (4-500 characters) is required." },
      { status: 400 },
    )
  }
  const { question, turnstileToken } = parsed.data

  // Ask the Archive costs real money per submission (a semantic search plus
  // an LLM synthesis call) — same "protect public forms/lead APIs with
  // Turnstile" convention as this repo's other cost- or abuse-sensitive
  // endpoints (see CLAUDE.md), even though this isn't a lead-capture form.
  // Verified fresh on EVERY submission (not just once per session) — the
  // client (`ask-the-archive-client.tsx`) discards its token and remounts
  // the widget after every request, so a stale/reused token can never reach
  // here twice.
  const turnstile = await verifyTurnstileToken(turnstileToken, request)
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error }, { status: turnstile.status })
  }

  // Rate limit AFTER Turnstile (don't spend a captcha check on a request
  // that's going to be capped anyway is fine — Turnstile itself is free to
  // verify) but BEFORE the two calls that actually cost money (rag-gateway
  // query, Bedrock synthesis). Fails open — see civic-archive-ratelimit.ts.
  const clientIp = getClientIp(request)
  const rateLimit = await checkAndIncrementRateLimit(clientIp)
  if (rateLimit.limited) {
    return NextResponse.json(
      {
        error: `You've reached the limit of ${ASK_THE_ARCHIVE_RATE_LIMIT} questions per day for Ask the Archive. Please check back tomorrow.`,
      },
      { status: 429 },
    )
  }

  const ragClient = getRagGatewayClient()
  if (!ragClient) {
    log.error("RAG_GATEWAY_URL / RAG_API_KEY not configured — Ask the Archive cannot query the index")
    return NextResponse.json(
      { error: "Ask the Archive is temporarily unavailable." },
      { status: 503 },
    )
  }

  let queryResult
  try {
    queryResult = await ragClient.query({
      projectId: civicArchiveRagProjectId(TOWN_SLUG),
      query: question,
      topK: TOP_K,
    })
  } catch (err) {
    log.error("rag-gateway query failed", err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { error: "Something went wrong searching the archive. Please try again." },
      { status: 502 },
    )
  }

  const relevant = queryResult.results.filter((r) => r.score >= MIN_CITATION_SCORE)

  if (relevant.length === 0) {
    const response: AskTheArchiveResponse = {
      answer: NO_RESULTS_ANSWER,
      citations: [],
      noResultsFound: true,
    }
    return NextResponse.json(response)
  }

  const citations: AskTheArchiveCitation[] = relevant.map((r) => {
    const { meetingDate, agendaItem, timestamp } = parseCivicArchiveRagTitle(r.title)
    return {
      meetingDate,
      agendaItem,
      timestamp,
      sourceUrl: r.url ?? "",
      excerpt: r.text,
      score: r.score,
    }
  })

  const bedrockCreds = getBedrockCredentials()
  if (!bedrockCreds) {
    log.error("SPARK901_BEDROCK_* not configured — Ask the Archive cannot synthesize an answer")
    return NextResponse.json(
      { error: "Ask the Archive is temporarily unavailable." },
      { status: 503 },
    )
  }

  const excerptsBlock = citations
    .map(
      (c, i) =>
        `[Excerpt ${i + 1}] Meeting ${c.meetingDate}, agenda item "${c.agendaItem}", timestamp ${c.timestamp}:\n${c.excerpt}`,
    )
    .join("\n\n")

  let answer: string
  try {
    answer = await synthesizeTextWithBedrock(
      bedrockCreds,
      SYSTEM_PROMPT,
      `Question: ${question}\n\nTranscript excerpts:\n\n${excerptsBlock}`,
    )
  } catch (err) {
    log.error(
      "Bedrock synthesis call failed",
      err instanceof Error ? err : new Error(String(err)),
    )
    return NextResponse.json(
      { error: "Something went wrong generating an answer. Please try again." },
      { status: 502 },
    )
  }

  const response: AskTheArchiveResponse = {
    answer,
    citations,
    noResultsFound: false,
  }
  return NextResponse.json(response)
}

#!/usr/bin/env node
/**
 * One-off / periodically-rerunnable batch: pushes every Collierville BMA
 * transcript in `content/civic-archive-transcripts/collierville/*.json`
 * into rag-gateway (`projectId: civic-archive-collierville`), one document
 * per transcript segment — see `lib/civic-archive-rag-ingest.ts`'s doc
 * comment for the chunking rationale. This is what makes the "Ask the
 * Archive" feature (`app/api/civic-archive/ask/route.ts`) able to answer
 * questions with citations.
 *
 * The source JSON files here are a committed, camelCase-normalized copy of
 * the 11 real structured transcripts built by the proof-of-concept in
 * `personal-work/goals/collierville-civic-data-poc/structured/` (the
 * PoC's own field names are snake_case; these are the converted copy, kept
 * in this repo so ingestion doesn't depend on a path outside this repo at
 * runtime — same "copy content into the repo" pattern Feature #1 used for
 * the 12 meeting-summary JSONs in `content/civic-archive/collierville/`).
 * One meeting (`2026-08-10_395748`) was excluded — its transcript had zero
 * real segments (a called/canceled meeting), matching a known gotcha
 * already documented in `@spark901/civic-source-swagit`.
 *
 * This script is REUSED by the Job 2 automation route
 * (`app/api/civic-archive/sync/route.ts`) via `lib/civic-archive-rag-ingest.ts`'s
 * shared `buildRagIngestDocumentsForMeeting`/`ingestMeetingTranscript` —
 * don't duplicate the chunking logic if this script is ever changed.
 *
 * Run via `node --experimental-strip-types`, matching
 * `generate-civic-archive-pdfs.ts`'s convention in this same directory
 * (this file has no JSX, so tsx would work fine here too, but staying
 * consistent with the sibling script's runner avoids needing two
 * different toolchains for "the two batch scripts in this folder").
 *
 *   npm run --workspace=web ingest:civic-archive-rag
 *
 * REQUIRES two environment variables that are NOT set anywhere in this
 * repo/deploy yet:
 *   - RAG_GATEWAY_URL — base URL of the deployed rag-gateway Cloudflare
 *     Worker (see `lib/rag-gateway-client.ts`'s doc comment for why this
 *     repo can't fall back to the official client's baked-in default URL).
 *   - RAG_API_KEY — shared bearer secret. Lives in AWS SSM Parameter Store
 *     at `/wtc/shared/prod/RAG_API_KEY` (see wtc-monorepo's
 *     `apps/rag-gateway/README.md`) — pull it from there, don't generate a
 *     new one.
 * Without both, this script prints exactly what's missing and exits
 * non-zero without attempting a network call — it does NOT fabricate a
 * key or silently no-op.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { getRagGatewayClient, RagGatewayClient } from "../lib/rag-gateway-client.ts"
import { ingestMeetingTranscript, type StructuredTranscriptDocument } from "../lib/civic-archive-rag-ingest.ts"
import type { CivicArchiveTownSlug } from "../lib/civic-archive.ts"

const TRANSCRIPTS_DIR = join(process.cwd(), "content", "civic-archive-transcripts")

function loadTranscriptsForTown(town: CivicArchiveTownSlug): StructuredTranscriptDocument[] {
  const dir = join(TRANSCRIPTS_DIR, town)
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  return files.map(
    (file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as StructuredTranscriptDocument,
  )
}

async function main() {
  const client = getRagGatewayClient()
  if (!client) {
    console.error(
      "[ingest-civic-archive-rag] Missing RAG_GATEWAY_URL and/or RAG_API_KEY — " +
        "cannot reach rag-gateway. See this script's doc comment for where to get them. " +
        "No network call was attempted.",
    )
    process.exitCode = 1
    return
  }

  const town: CivicArchiveTownSlug = "collierville"
  const transcripts = loadTranscriptsForTown(town)
  console.log(
    `[ingest-civic-archive-rag] loaded ${transcripts.length} transcript(s) for "${town}" from ${TRANSCRIPTS_DIR}`,
  )

  let totalSegments = 0
  for (const transcript of transcripts) {
    const result = await ingestMeetingTranscript(
      client as Pick<RagGatewayClient, "ingestMany">,
      town,
      transcript,
    )
    console.log(
      `  ${result.meetingId}: ${result.segmentCount} segment(s) enqueued (${result.jobIds.length} job id(s))`,
    )
    totalSegments += result.segmentCount
  }

  console.log(
    `[ingest-civic-archive-rag] done — ${transcripts.length} meeting(s), ${totalSegments} segment(s) enqueued for async ingest.`,
  )
  console.log(
    `[ingest-civic-archive-rag] jobs process in the background; poll a jobId via client.getJobStatus(id) or just re-query in a minute.`,
  )
}

main().catch((err) => {
  console.error("[ingest-civic-archive-rag] fatal error:", err)
  process.exitCode = 1
})

/**
 * Job 2 — the civic-archive automation job. Scheduled via Vercel Cron
 * (`apps/web/vercel.json`'s `crons` entry) to detect new Collierville BMA
 * meetings and run the full pipeline for each one:
 *
 *   fetch live Swagit meeting list
 *     -> diff against what's already ingested in rag-gateway
 *     -> fetch + structure the new meeting's transcript
 *     -> ingest the transcript into rag-gateway (keeps "Ask the Archive" fresh)
 *     -> summarize + structurally-extract via AWS Bedrock (Amazon Nova Lite by
 *        default — see lib/bedrock.ts for the model choice and fallback ARNs)
 *     -> validate against @spark901/meeting-summary-schema
 *     -> render the summary PDF (reusing Feature #1's PDF layout)
 *     -> upload the summary JSON + PDF to S3 (durable; see lib/civic-archive-s3.ts
 *        for why NOT the static content/ directory)
 *
 * ⚠️ KNOWN GAP: this job makes new meetings durable (rag-gateway + S3) but
 * does NOT yet make them appear on the live `/civic-archive` page — that
 * page's loader (`lib/civic-archive.ts`) only reads the git-committed
 * `content/civic-archive/<town>/*.json` directory. Wiring the page to also
 * read from S3 is a real, separate follow-up — see `lib/civic-archive-s3.ts`'s
 * doc comment and this project's task report.
 *
 * Auth: Vercel automatically attaches `Authorization: Bearer $CRON_SECRET`
 * to cron-triggered requests when a project env var literally named
 * `CRON_SECRET` is set — this is Vercel's own documented mechanism, and the
 * ONE deliberate exception to this repo's `SPARK901_`-prefix convention
 * (every other new env var this project introduces IS prefixed — see
 * `lib/bedrock.ts` and `lib/civic-archive-s3.ts`). Using a prefixed name
 * here would just mean Vercel never sends it, defeating the point.
 * `CRON_SECRET` is NOT set anywhere yet — see this file's exported
 * `SYNC_ENV_VARS` for the full list this route needs.
 */
import { type NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createLogger } from "@/lib/logger"
import { isFeatureEnabled } from "@/lib/features"
import {
  fetchStructuredSwagitTranscript,
  fetchSwagitMeetingList,
  toIsoDateSlug,
} from "@spark901/civic-source-swagit"
import { CIVIC_ARCHIVE_TOWN_CONFIG } from "@/lib/civic-archive-towns"
import type { CivicArchiveTownSlug } from "@/lib/civic-archive"
import {
  civicArchiveRagProjectId,
  getRagGatewayClient,
  type RagGatewayClient,
} from "@/lib/rag-gateway-client"
import { ingestMeetingTranscript, type StructuredTranscriptDocument } from "@/lib/civic-archive-rag-ingest"
import { extractMeetingSummaryWithBedrock, getBedrockCredentials, BEDROCK_ENV_VARS } from "@/lib/bedrock"
import { meetingSummaryPdfDocument } from "@/lib/civic-archive-pdf"
import {
  civicArchivePdfS3Key,
  civicArchiveSummaryS3Key,
  getCivicArchiveS3Config,
  putCivicArchiveObject,
} from "@/lib/civic-archive-s3"

export const maxDuration = 300

const log = createLogger({ service: "spark901-web" }).child({ component: "api.civic-archive.sync" })

/** Bound per-run work so one cron invocation can never run unbounded (cost + duration safety). */
const MAX_MEETINGS_PER_RUN = 5

export const SYNC_ENV_VARS = [
  { name: "CRON_SECRET", purpose: "Vercel's own cron-auth secret (unprefixed by design — see doc comment above)." },
  { name: "RAG_GATEWAY_URL", purpose: "rag-gateway base URL — same var Job 1's ask route and ingest script need." },
  { name: "RAG_API_KEY", purpose: "rag-gateway bearer secret — same var Job 1 needs." },
  ...BEDROCK_ENV_VARS,
  { name: "SPARK901_CIVIC_ARCHIVE_S3_BUCKET", purpose: "S3 bucket name for durable summary JSON + PDF storage." },
  { name: "SPARK901_AWS_ACCESS_KEY_ID", purpose: "Reused from the existing DynamoDB ops-ledger IAM user (infra/aws/README.md) — needs s3:PutObject added, scoped to the new bucket ARN." },
  { name: "SPARK901_AWS_SECRET_ACCESS_KEY", purpose: "Secret for that same reused IAM user." },
  { name: "SPARK901_AWS_REGION", purpose: `Region for both DynamoDB and the new S3 bucket. Defaults to "us-east-1" if unset.` },
] as const

interface MeetingSyncResult {
  meetingId: string
  status: "ingested" | "skipped-empty-transcript" | "summary-skipped-bedrock-unconfigured" | "error"
  segmentsIngested?: number
  summaryUploaded?: boolean
  pdfUploaded?: boolean
  error?: string
}

async function knownMeetingIds(
  ragClient: RagGatewayClient,
  town: CivicArchiveTownSlug,
): Promise<Set<string>> {
  const known = new Set<string>()
  let offset = 0
  const limit = 500
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { documents } = await ragClient.listDocuments(civicArchiveRagProjectId(town), {
      limit,
      offset,
    })
    for (const doc of documents) {
      // docId shape: "civic-archive-<town>/<meetingId>/<segmentIndex>" — see
      // lib/civic-archive-rag-ingest.ts's buildRagIngestDocumentsForMeeting.
      const parts = doc.docId.split("/")
      if (parts.length >= 2 && parts[1]) known.add(parts[1])
    }
    if (documents.length < limit) break
    offset += limit
  }
  return known
}

async function processMeeting(
  town: CivicArchiveTownSlug,
  transcript: StructuredTranscriptDocument,
  ragClient: RagGatewayClient,
): Promise<MeetingSyncResult> {
  const meetingId = `${transcript.meetingDate}_${transcript.videoId}`

  if (transcript.segments.length === 0) {
    return { meetingId, status: "skipped-empty-transcript" }
  }

  const ingestResult = await ingestMeetingTranscript(ragClient, town, transcript)

  const bedrockCreds = getBedrockCredentials()
  if (!bedrockCreds) {
    log.warn(
      "SPARK901_BEDROCK_* not configured — ingested transcript into rag-gateway but skipped summary/PDF generation",
    )
    return {
      meetingId,
      status: "summary-skipped-bedrock-unconfigured",
      segmentsIngested: ingestResult.segmentCount,
    }
  }

  const s3Config = getCivicArchiveS3Config()

  try {
    const summary = await extractMeetingSummaryWithBedrock(bedrockCreds, town, transcript)
    const pdfBuffer = await renderToBuffer(meetingSummaryPdfDocument(summary))

    let summaryUploaded = false
    let pdfUploaded = false
    if (s3Config) {
      summaryUploaded = await putCivicArchiveObject(
        s3Config,
        civicArchiveSummaryS3Key(town, meetingId),
        JSON.stringify(summary, null, 2),
        "application/json",
      )
      pdfUploaded = await putCivicArchiveObject(
        s3Config,
        civicArchivePdfS3Key(town, meetingId),
        new Uint8Array(pdfBuffer),
        "application/pdf",
      )
    } else {
      log.warn("SPARK901_CIVIC_ARCHIVE_S3_BUCKET not configured — generated summary/PDF but could not persist them")
    }

    return {
      meetingId,
      status: "ingested",
      segmentsIngested: ingestResult.segmentCount,
      summaryUploaded,
      pdfUploaded,
    }
  } catch (err) {
    log.error(
      `Bedrock extraction/PDF/upload failed for ${meetingId}`,
      err instanceof Error ? err : new Error(String(err)),
    )
    return {
      meetingId,
      status: "error",
      segmentsIngested: ingestResult.segmentCount,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isFeatureEnabled("CIVIC_ARCHIVE")) {
    return NextResponse.json({ skipped: "CIVIC_ARCHIVE feature flag is off" })
  }

  const ragClient = getRagGatewayClient()
  if (!ragClient) {
    log.error("RAG_GATEWAY_URL / RAG_API_KEY not configured — sync cannot run")
    return NextResponse.json({ error: "rag-gateway not configured" }, { status: 503 })
  }

  const town: CivicArchiveTownSlug = "collierville"
  const swagitConfig = CIVIC_ARCHIVE_TOWN_CONFIG[town]

  let liveMeetings
  try {
    liveMeetings = await fetchSwagitMeetingList(swagitConfig)
  } catch (err) {
    log.error("failed to fetch live Swagit meeting list", err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json({ error: "Failed to fetch Swagit meeting list" }, { status: 502 })
  }

  const known = await knownMeetingIds(ragClient, town)
  const newMeetings = liveMeetings.filter(
    (m) => !known.has(`${toIsoDateSlug(m.date)}_${m.videoId}`),
  )
  const toProcess = newMeetings.slice(0, MAX_MEETINGS_PER_RUN)

  const results: MeetingSyncResult[] = []
  for (const meeting of toProcess) {
    const meetingDate = toIsoDateSlug(meeting.date)
    let transcript
    try {
      transcript = await fetchStructuredSwagitTranscript(swagitConfig, meeting.videoId, meetingDate)
    } catch (err) {
      log.error(
        `failed to fetch transcript for video ${meeting.videoId}`,
        err instanceof Error ? err : new Error(String(err)),
      )
      results.push({
        meetingId: `${meetingDate}_${meeting.videoId}`,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }
    if (!transcript) {
      results.push({ meetingId: `${meetingDate}_${meeting.videoId}`, status: "skipped-empty-transcript" })
      continue
    }
    results.push(await processMeeting(town, transcript, ragClient))
  }

  return NextResponse.json({
    town,
    liveMeetingCount: liveMeetings.length,
    knownMeetingCount: known.size,
    newMeetingCount: newMeetings.length,
    processedThisRun: results.length,
    remainingUnprocessed: Math.max(0, newMeetings.length - toProcess.length),
    results,
  })
}

/**
 * Shared logic for pushing one meeting's structured transcript into
 * rag-gateway, scoped to a per-town `projectId`. Used by both:
 *   - `scripts/ingest-civic-archive-rag.ts` (manual/one-off batch run), and
 *   - `app/api/civic-archive/sync/route.ts` (the scheduled automation job)
 * so the chunking/citation strategy can never silently drift between the
 * two callers.
 *
 * Chunking strategy: one rag-gateway document PER TRANSCRIPT SEGMENT (not
 * per agenda item, and not a token-window split). A Swagit transcript
 * segment already changes on every timestamp AND every agenda-item-header
 * change (see `@spark901/civic-source-swagit`'s `parseSwagitTranscript`),
 * so segment-level chunking is naturally sized (typically a paragraph to a
 * few paragraphs) and keeps the citation attached to the exact `[HH:MM:SS]`
 * moment it was said — a single long agenda item (e.g. 45 minutes of public
 * comment) can span many different speakers/timestamps, and per-agenda-item
 * chunking would blur an "Ask the Archive" citation down to "somewhere in
 * this hour", which defeats the point of a timestamped source. rag-gateway
 * further sub-splits long segment text internally (`chunkText`), so this is
 * safe even for an unusually long segment.
 */
import type { CivicArchiveTownSlug } from "./civic-archive"
import type { RagIngestDocument } from "./rag-gateway-client"

export interface StructuredTranscriptSegment {
  agendaItem: string
  timestamp: string
  text: string
}

/** Matches `@spark901/civic-source-swagit`'s `StructuredTranscript`, camelCase, town-agnostic. */
export interface StructuredTranscriptDocument {
  videoId: number
  /** YYYY-MM-DD */
  meetingDate: string
  board: string
  sourceUrl: string
  transcriptUrl: string
  disclaimer: string
  segments: StructuredTranscriptSegment[]
}

/** `<meetingDate>_<videoId>` — matches `@spark901/meeting-summary-schema`'s `meetingId` convention. */
export function meetingIdFor(transcript: StructuredTranscriptDocument): string {
  return `${transcript.meetingDate}_${transcript.videoId}`
}

/** Deep link back to the exact moment a segment was spoken, same `?t=` convention `AgendaItemList` uses. */
function segmentSourceUrl(transcript: StructuredTranscriptDocument, timestamp: string): string {
  return `${transcript.sourceUrl}?t=${timestamp}`
}

/**
 * Converts one meeting's structured transcript into the rag-gateway ingest
 * documents for its segments. Pure function — no network calls — so it can
 * be unit-tested and reused without a live gateway.
 */
export function buildRagIngestDocumentsForMeeting(
  town: CivicArchiveTownSlug,
  transcript: StructuredTranscriptDocument,
): RagIngestDocument[] {
  const projectPrefix = `civic-archive-${town}`
  const meetingId = meetingIdFor(transcript)
  const updatedAt = new Date(`${transcript.meetingDate}T00:00:00Z`).toISOString()

  return transcript.segments.map((segment, index) => {
    const docId = `${projectPrefix}/${meetingId}/${String(index).padStart(4, "0")}`
    return {
      docId,
      projectId: projectPrefix,
      sourceType: "civic-meeting-segment",
      text: segment.text,
      updatedAt,
      title: `${transcript.board} — ${transcript.meetingDate} — ${segment.agendaItem} [${segment.timestamp}]`,
      uri: segmentSourceUrl(transcript, segment.timestamp),
      tags: [town, transcript.board, meetingId],
      weight: 1,
    } satisfies RagIngestDocument
  })
}

export interface IngestMeetingResult {
  meetingId: string
  segmentCount: number
  jobIds: string[]
}

/**
 * Ingests one meeting's segments via `RagGatewayClient.ingestMany` (defers
 * the cache-invalidation write for every segment but the last).
 */
export async function ingestMeetingTranscript(
  client: { ingestMany(docs: RagIngestDocument[]): Promise<{ jobId: string }[]> },
  town: CivicArchiveTownSlug,
  transcript: StructuredTranscriptDocument,
): Promise<IngestMeetingResult> {
  const docs = buildRagIngestDocumentsForMeeting(town, transcript)
  const jobs = docs.length > 0 ? await client.ingestMany(docs) : []
  return {
    meetingId: meetingIdFor(transcript),
    segmentCount: docs.length,
    jobIds: jobs.map((j) => j.jobId),
  }
}

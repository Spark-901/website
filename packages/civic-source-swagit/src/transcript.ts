import { SWAGIT_BROWSER_USER_AGENT } from "./meeting-list.ts"
import type { StructuredTranscript, SwagitSourceConfig, TranscriptSegment } from "./types.ts"

export function transcriptUrl(config: SwagitSourceConfig, videoId: number): string {
  return `https://${config.portal}/videos/${videoId}/transcript`
}

export function sourceVideoUrl(config: SwagitSourceConfig, videoId: number): string {
  return `https://${config.portal}/videos/${videoId}`
}

export interface FetchTranscriptOptions {
  fetchImpl?: typeof fetch
}

/**
 * Fetches the raw transcript body for one meeting video.
 *
 * Swagit exposes an UNAUTHENTICATED plain-text transcript endpoint per video:
 * `GET https://<portal>/videos/<id>/transcript` — confirmed 2026-09-24,
 * returned with `Content-Disposition: attachment`, already segmented by
 * agenda item with inline `[HH:MM:SS]` timestamps. This is a generic Swagit
 * platform feature (also confirmed live on Garland TX, McKinney TX, Frisco
 * TX, Palm Bay FL), so this function is reusable for any Swagit-hosted town.
 *
 * Note for anyone porting this again from the Python proof-of-concept: the
 * Python version had to force UTF-8 decoding because `requests` falls back to
 * ISO-8859-1 for a `text/plain` response with no charset parameter (Swagit
 * sends none). The WHATWG Fetch spec's `Body.text()` — what this function
 * uses — always decodes as UTF-8 regardless of the response's declared
 * charset, so that particular workaround does not carry over here. Left as a
 * comment, not silently dropped, so a future re-port to a non-Fetch HTTP
 * client knows to re-check it.
 */
export async function fetchSwagitTranscript(
  config: SwagitSourceConfig,
  videoId: number,
  options: FetchTranscriptOptions = {},
): Promise<{ status: number; text: string }> {
  const fetchImpl = options.fetchImpl ?? fetch
  const res = await fetchImpl(transcriptUrl(config, videoId), {
    headers: { "User-Agent": SWAGIT_BROWSER_USER_AGENT },
  })
  return { status: res.status, text: await res.text() }
}

const TIMESTAMP_LINE_RE = /^\[(\d{2}:\d{2}:\d{2})\]$/
const BRACKET_LINE_RE = /^\[(.+)\]$/
// Swagit uses at least two disclaimer footer wordings interchangeably (found
// 2026-09-24: most meetings say "compiled from uncorrected Closed
// Captioning", but a short/called meeting with no real content used "created
// by voice-to-text technology... not the official minutes" instead). Match
// any line starting with "*" generically rather than hard-coding one exact
// wording.
const DISCLAIMER_LINE_RE = /^\*\s*(.+)$/

/**
 * Parses a raw Swagit transcript body into timestamped, agenda-item-tagged
 * segments plus the transcript's own disclaimer line.
 *
 * Format: a flat text file where two kinds of bracketed marker lines are
 * interspersed with spoken-word text (all caps, from closed captioning):
 *
 *   [1. CALL TO ORDER & INVOCATION]   <- agenda-item header, changes rarely
 *   [00:00:10]                        <- HH:MM:SS timestamp, changes ~every few min
 *   ACTUAL SPOKEN TEXT GOES HERE...
 *
 * A segment is flushed every time either marker changes, so each one is
 * tagged with the agenda item + timestamp that were active while its text
 * was spoken.
 */
export function parseSwagitTranscript(rawText: string): {
  segments: TranscriptSegment[]
  disclaimer: string
} {
  const segments: TranscriptSegment[] = []
  let currentItem = "PREAMBLE"
  let currentTimestamp = "00:00:00"
  let buffer: string[] = []
  let disclaimer = ""

  const flush = () => {
    const text = buffer.join(" ").trim().replace(/\s+/g, " ")
    if (text) {
      segments.push({ agendaItem: currentItem, timestamp: currentTimestamp, text })
    }
    buffer = []
  }

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const disclaimerMatch = DISCLAIMER_LINE_RE.exec(line)
    if (disclaimerMatch) {
      disclaimer = disclaimerMatch[1]!.trim()
      continue
    }

    const timestampMatch = TIMESTAMP_LINE_RE.exec(line)
    if (timestampMatch) {
      flush()
      currentTimestamp = timestampMatch[1]!
      continue
    }

    const bracketMatch = BRACKET_LINE_RE.exec(line)
    if (bracketMatch) {
      flush()
      currentItem = bracketMatch[1]!.trim()
      continue
    }

    buffer.push(line)
  }
  flush()

  return { segments, disclaimer }
}

const DEFAULT_DISCLAIMER =
  "This transcript was compiled from uncorrected Closed Captioning."

/**
 * Fetches and structures one meeting's transcript in a single call. Returns
 * `null` (rather than throwing) for a non-200 response or a near-empty body
 * (under 50 characters) — the same "skip, don't crash the batch" behavior as
 * the Python proof-of-concept's fetch step, since a called/canceled meeting
 * routinely has no real transcript at all.
 */
export async function fetchStructuredSwagitTranscript(
  config: SwagitSourceConfig,
  videoId: number,
  meetingDate: string,
  options: FetchTranscriptOptions = {},
): Promise<StructuredTranscript | null> {
  const { status, text } = await fetchSwagitTranscript(config, videoId, options)
  if (status !== 200 || text.trim().length < 50) {
    return null
  }
  const { segments, disclaimer } = parseSwagitTranscript(text)
  return {
    videoId,
    meetingDate,
    board: config.boardFilter,
    sourceUrl: sourceVideoUrl(config, videoId),
    transcriptUrl: transcriptUrl(config, videoId),
    disclaimer: disclaimer || DEFAULT_DISCLAIMER,
    segments,
  }
}

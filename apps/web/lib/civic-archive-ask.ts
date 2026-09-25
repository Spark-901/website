import { z } from "zod"

/** Request body for `POST /api/civic-archive/ask`. */
export const AskTheArchiveRequestSchema = z.object({
  question: z.string().min(4).max(500),
  turnstileToken: z.string().min(1),
})
export type AskTheArchiveRequest = z.infer<typeof AskTheArchiveRequestSchema>

export interface AskTheArchiveCitation {
  meetingDate: string
  agendaItem: string
  timestamp: string
  /** Deep link back to the source video at this exact timestamp. */
  sourceUrl: string
  /** The retrieved excerpt this citation is grounded in. */
  excerpt: string
  /** rag-gateway's cosine-similarity score for this chunk (0-1, higher = more relevant). */
  score: number
}

export interface AskTheArchiveResponse {
  answer: string
  citations: AskTheArchiveCitation[]
  /** True when no relevant transcript content was found — `answer` says so plainly rather than guessing. */
  noResultsFound: boolean
}

/**
 * Parses a rag-gateway document title back into its parts. Titles are
 * written by `lib/civic-archive-rag-ingest.ts` as:
 *   "<board> — <meetingDate> — <agendaItem> [<timestamp>]"
 * Falls back gracefully (empty fields) if a title doesn't match — a
 * citation missing detail is far better than a thrown 500 on a real user
 * question.
 */
export function parseCivicArchiveRagTitle(title: string | undefined): {
  board: string
  meetingDate: string
  agendaItem: string
  timestamp: string
} {
  const match = /^(.+?) — (\d{4}-\d{2}-\d{2}) — (.+?) \[(\d{2}:\d{2}:\d{2})\]$/.exec(
    title ?? "",
  )
  if (!match) {
    return { board: "", meetingDate: "", agendaItem: "", timestamp: "" }
  }
  const [, board, meetingDate, agendaItem, timestamp] = match
  return { board: board!, meetingDate: meetingDate!, agendaItem: agendaItem!, timestamp: timestamp! }
}

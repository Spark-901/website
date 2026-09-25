/**
 * @spark901/meeting-summary-schema
 *
 * The contract for a single civic-archive meeting summary — one JSON document
 * per government meeting (agenda items, action items, topics, and the
 * mandatory transcript-accuracy caveat).
 *
 * This schema is the shared boundary between:
 *   - whatever PRODUCES a summary (today: a hand-reviewed reference set built
 *     by reading real Swagit transcripts in full; later: an AWS Bedrock batch
 *     job run once per meeting at ingest time), and
 *   - whatever RENDERS a summary (the website's civic-archive page, the PDF
 *     generation script, and any future civic-archive town page).
 *
 * Keeping this in one small, dependency-light package means a future
 * automated producer can never silently drift from what the website expects
 * to read — both sides import the same runtime validator and the same
 * inferred TypeScript types.
 *
 * Town-agnostic on purpose: nothing here names "Collierville" or "BMA"
 * specifically. `board` is just a string field.
 */
import { z } from "zod"

/** HH:MM:SS, matching the timestamp format Swagit's transcript endpoint emits. */
const TimestampSchema = z
  .string()
  .regex(/^\d{2}:\d{2}:\d{2}$/, "timestamp must be HH:MM:SS")

/** YYYY-MM-DD, matching the meeting's calendar date. */
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")

export const AgendaItemTypeSchema = z.enum([
  "decision",
  "vote",
  "discussion",
  "public-comment",
  "presentation",
  "other",
])
export type AgendaItemType = z.infer<typeof AgendaItemTypeSchema>

export const AgendaItemSchema = z.object({
  /** The agenda item's own heading, verbatim from the transcript where possible. */
  item: z.string().min(1),
  timestamp: TimestampSchema,
  /** 1-3 sentences grounded only in what the transcript actually says. */
  summary: z.string().min(1),
  type: AgendaItemTypeSchema,
  /**
   * Omitted entirely when the transcript doesn't clearly state a result —
   * never guessed at, never defaulted to a placeholder.
   */
  outcome: z.string().min(1).optional(),
})
export type AgendaItem = z.infer<typeof AgendaItemSchema>

export const ActionItemSchema = z.object({
  /** A concrete decision/approval/directive. */
  description: z.string().min(1),
  timestamp: TimestampSchema,
})
export type ActionItem = z.infer<typeof ActionItemSchema>

export const MeetingSummarySchema = z.object({
  /** `<YYYY-MM-DD>_<swagitVideoId>`, e.g. "2026-08-17_396361". */
  meetingId: z.string().min(1),
  date: IsoDateSchema,
  /** The governing body's plain name, e.g. "Board of Mayor and Aldermen". */
  board: z.string().min(1),
  /** Human-readable title for display, e.g. "BMA Regular Meeting — August 17, 2026". */
  title: z.string().min(1),
  /** 2-4 plain-language sentences for a resident with no government background. */
  overview: z.string().min(1),
  agendaItems: z.array(AgendaItemSchema),
  actionItems: z.array(ActionItemSchema),
  /** Short tags, e.g. "zoning", "budget", "public safety". Can be empty (a canceled meeting). */
  topics: z.array(z.string()),
  sourceVideoUrl: z.url(),
  /**
   * The transcript-accuracy caveat, verbatim, e.g. "This summary is based on
   * a transcript compiled from uncorrected closed captioning and may contain
   * errors. It is not an official record of the meeting." Always render this
   * — never bury it.
   */
  transcriptCaveat: z.string().min(1),
})
export type MeetingSummary = z.infer<typeof MeetingSummarySchema>

/** Parses and validates one meeting summary, throwing a zod error on failure. */
export function parseMeetingSummary(data: unknown): MeetingSummary {
  return MeetingSummarySchema.parse(data)
}

/** Same as {@link parseMeetingSummary}, but never throws — inspect `.success`. */
export function safeParseMeetingSummary(data: unknown) {
  return MeetingSummarySchema.safeParse(data)
}

/**
 * Validates a whole array of summaries (e.g. everything read from a content
 * directory at once), returning the valid ones and a list of per-file errors
 * so a batch job can report exactly which input is malformed rather than
 * aborting the entire run on the first bad file.
 */
export function parseMeetingSummaries(
  entries: { id: string; data: unknown }[],
): { valid: MeetingSummary[]; errors: { id: string; message: string }[] } {
  const valid: MeetingSummary[] = []
  const errors: { id: string; message: string }[] = []
  for (const entry of entries) {
    const result = MeetingSummarySchema.safeParse(entry.data)
    if (result.success) {
      valid.push(result.data)
    } else {
      errors.push({ id: entry.id, message: result.error.message })
    }
  }
  return { valid, errors }
}

/** Sorts summaries chronologically, most recent meeting first. */
export function sortMeetingSummariesByDateDesc(
  summaries: MeetingSummary[],
): MeetingSummary[] {
  return [...summaries].sort((a, b) => b.date.localeCompare(a.date))
}

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  parseMeetingSummaries,
  sortMeetingSummariesByDateDesc,
  type MeetingSummary,
} from "@spark901/meeting-summary-schema"

/**
 * The Collierville Civic Archive — Spark901's first live, working product
 * (as opposed to a funding-campaign pitch page). See
 * personal-work/goals/collierville-civic-data.md for the full background.
 *
 * Only one town ships today, but this stays keyed by slug on purpose — a
 * second Swagit-hosted town (Germantown/Bartlett are the named next targets)
 * is a new content directory + a new entry in `CIVIC_ARCHIVE_TOWNS`, not a
 * rewrite of this loader.
 */
export const CIVIC_ARCHIVE_TOWNS = ["collierville"] as const
export type CivicArchiveTownSlug = (typeof CIVIC_ARCHIVE_TOWNS)[number]

export function civicArchiveContentDir(town: CivicArchiveTownSlug): string {
  return join(process.cwd(), "content", "civic-archive", town)
}

export function civicArchivePublicPdfDir(town: CivicArchiveTownSlug): string {
  return join(process.cwd(), "public", "civic-archive", town)
}

/** Public URL path to a meeting's generated PDF. */
export function civicArchivePdfHref(town: CivicArchiveTownSlug, meetingId: string): string {
  return `/civic-archive/${town}/${meetingId}.pdf`
}

/**
 * Reads every `<meetingId>.json` file in a town's content directory,
 * validates each one against `@spark901/meeting-summary-schema`, and returns
 * the valid summaries sorted most-recent-first plus a list of per-file
 * validation errors (so a malformed file is reported, not silently dropped
 * or allowed to crash the page).
 */
export function loadCivicArchiveMeetings(town: CivicArchiveTownSlug = "collierville"): {
  meetings: MeetingSummary[]
  errors: { id: string; message: string }[]
} {
  const dir = civicArchiveContentDir(town)
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"))
  const entries = files.map((file) => ({
    id: file,
    data: JSON.parse(readFileSync(join(dir, file), "utf8")) as unknown,
  }))
  const { valid, errors } = parseMeetingSummaries(entries)
  return { meetings: sortMeetingSummariesByDateDesc(valid), errors }
}

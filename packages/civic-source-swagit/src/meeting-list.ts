import type { SwagitMeetingListItem, SwagitSourceConfig } from "./types"

/**
 * A real desktop browser UA is required — a bare/no UA or a generic script UA
 * gets a 403 from Swagit's edge (confirmed 2026-09-24 against Collierville's
 * portal).
 */
export const SWAGIT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

// Ported from fetch_meeting_list.py's ROW_RE. Matches one <tr> in the combined
// "all boards, all years" listing's <table id="video-table">: a title link to
// /videos/<id>, then a date column, then a duration column.
const ROW_RE =
  /<tr>\s*<td>\s*<a[^>]*href="\/videos\/(?<id>\d+)"[^>]*>(?<title>[^<]+)<\/a>\s*<\/td>\s*<td[^>]*>\s*(?<date>[^<]+?)\s*<\/td>\s*<td>\s*(?<duration>[^<]*?)\s*<\/td>/g

export interface FetchMeetingListOptions {
  /** Keep only the first N matches (page order = most recent first). */
  limit?: number
  /** Override global fetch, e.g. for tests. */
  fetchImpl?: typeof fetch
}

function viewsUrl(config: SwagitSourceConfig): string {
  const path = config.viewsPath.startsWith("/") ? config.viewsPath : `/${config.viewsPath}`
  return `https://${config.portal}${path}`
}

async function fetchListingHtml(
  config: SwagitSourceConfig,
  fetchImpl: typeof fetch,
): Promise<string> {
  const res = await fetchImpl(viewsUrl(config), {
    headers: { "User-Agent": SWAGIT_BROWSER_USER_AGENT },
  })
  if (!res.ok) {
    throw new Error(
      `[civic-source-swagit] GET ${viewsUrl(config)} failed: HTTP ${res.status}`,
    )
  }
  return res.text()
}

export function parseMeetingListHtml(
  html: string,
  boardFilter: string,
): SwagitMeetingListItem[] {
  const rows: SwagitMeetingListItem[] = []
  for (const match of html.matchAll(ROW_RE)) {
    const groups = match.groups as
      | { id: string; title: string; date: string; duration: string }
      | undefined
    if (!groups) continue
    const title = groups.title.trim()
    if (boardFilter && !title.toLowerCase().includes(boardFilter.toLowerCase())) {
      continue
    }
    rows.push({
      videoId: Number.parseInt(groups.id, 10),
      board: title,
      date: groups.date.trim(),
      duration: groups.duration.trim(),
    })
  }

  // De-dupe by video id (a canceled meeting can be listed under its own board
  // tab too, same as the row can otherwise repeat).
  const seen = new Set<number>()
  const unique: SwagitMeetingListItem[] = []
  for (const row of rows) {
    if (seen.has(row.videoId)) continue
    seen.add(row.videoId)
    unique.push(row)
  }
  return unique
}

/**
 * Fetches a town's Swagit "all boards, all years" listing and returns the
 * meetings matching `config.boardFilter`, most recent first. Excludes
 * "... - Canceled" listing rows (no video/transcript exists for those), same
 * as the Python proof-of-concept.
 */
export async function fetchSwagitMeetingList(
  config: SwagitSourceConfig,
  options: FetchMeetingListOptions = {},
): Promise<SwagitMeetingListItem[]> {
  const fetchImpl = options.fetchImpl ?? fetch
  const html = await fetchListingHtml(config, fetchImpl)
  let rows = parseMeetingListHtml(html, config.boardFilter)
  rows = rows.filter((row) => !row.board.toLowerCase().includes("cancel"))
  if (options.limit) {
    rows = rows.slice(0, options.limit)
  }
  return rows
}

/** "Aug 17, 2026" -> "2026-08-17", for a sortable, filesystem-safe filename/id. */
export function toIsoDateSlug(swagitDate: string): string {
  const parsed = new Date(`${swagitDate} UTC`)
  if (Number.isNaN(parsed.getTime())) {
    // Fall back to a filesystem-safe slug rather than throwing — mirrors the
    // Python script's fallback for an unparsable date string.
    return swagitDate.replace(/[^0-9A-Za-z-]/g, "_")
  }
  const yyyy = parsed.getUTCFullYear()
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(parsed.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

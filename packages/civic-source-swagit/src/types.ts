/**
 * Config for one Swagit-hosted town/board. Nothing in this package hardcodes
 * "Collierville" — a second town (Germantown, Bartlett are the named next
 * targets) is a new `SwagitSourceConfig` value, not new code.
 */
export interface SwagitSourceConfig {
  /**
   * The Swagit subdomain that serves this town's portal, e.g.
   * "colliervilletn.new.swagit.com". No protocol, no trailing slash.
   */
  portal: string
  /**
   * The combined "all boards, all years" listing view path, e.g. "/views/873".
   *
   * Swagit's per-board category pages render as an empty JS shell when
   * fetched with a plain HTTP client — only this combined view renders full
   * server-side HTML with a real `<table id="video-table">` per board
   * (confirmed 2026-09-24 against Collierville's portal). This view ID is
   * per-town and was found empirically by following the portal's root
   * redirect chain; re-derive it the same way for a new town if this ever
   * 404s: `curl -A "<browser UA>" -sIL https://<portal>/`.
   */
  viewsPath: string
  /** Substring match (case-insensitive) on the listing's title column, e.g. "Board of Mayor and Aldermen". */
  boardFilter: string
}

export interface SwagitMeetingListItem {
  videoId: number
  /** The listing's own title column verbatim (can carry suffixes like "- VIDEO" or "- Rescheduled to 8/17"). */
  board: string
  /** As Swagit renders it, e.g. "Aug 17, 2026". */
  date: string
  /** As Swagit renders it, e.g. "01h 36m". */
  duration: string
}

export interface TranscriptSegment {
  /** The agenda-item heading active when this text was spoken, or "PREAMBLE" before the first heading. */
  agendaItem: string
  /** HH:MM:SS. */
  timestamp: string
  text: string
}

export interface StructuredTranscript {
  videoId: number
  /** YYYY-MM-DD. */
  meetingDate: string
  board: string
  sourceUrl: string
  transcriptUrl: string
  /**
   * Swagit's own disclaimer footer line, verbatim. Two wordings are known to
   * exist interchangeably (see `parseTranscript`'s doc comment) — never
   * assert a hardcoded disclaimer string when a real one was found in the
   * transcript itself.
   */
  disclaimer: string
  segments: TranscriptSegment[]
}

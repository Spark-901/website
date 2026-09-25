import type { SwagitSourceConfig } from "@spark901/civic-source-swagit"
import type { CivicArchiveTownSlug } from "./civic-archive"

/**
 * Real, verified Swagit config per town — NOT placeholder values. Collierville's
 * values were found empirically 2026-09-24 (see
 * `@spark901/civic-source-swagit`'s `SwagitSourceConfig` doc comment and
 * `personal-work/goals/collierville-civic-data-poc/scripts/fetch_meeting_list.py`)
 * and are re-used verbatim here rather than re-derived. Adding a second town
 * (Germantown/Bartlett are the named next targets) means adding one more
 * entry here with its own `portal`/`viewsPath` — nothing else in the
 * pipeline changes.
 */
export const CIVIC_ARCHIVE_TOWN_CONFIG: Record<CivicArchiveTownSlug, SwagitSourceConfig> = {
  collierville: {
    portal: "colliervilletn.new.swagit.com",
    viewsPath: "/views/873",
    boardFilter: "Board of Mayor and Aldermen",
  },
}

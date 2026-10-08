#!/usr/bin/env node
/**
 * Renders one PDF per Collierville BMA meeting summary in
 * content/civic-archive/collierville/*.json, so a resident can download and
 * read (or print) a plain-language summary of what their government did,
 * without needing to watch hours of meeting video.
 *
 * Run manually for now (not wired to a cron yet — that's future work, once
 * the ingestion automation described in
 * personal-work/goals/collierville-civic-data.md exists):
 *
 *   npm run --workspace=web generate:civic-archive-pdfs
 *
 * Output: public/civic-archive/<town>/<meetingId>.pdf — served as a static
 * file. No S3/Vercel Blob wiring for this initial single-town launch; that's
 * a later-scale concern once there are many towns/meetings, not now.
 *
 * Uses @react-pdf/renderer — a pure-JS, no-headless-browser PDF renderer, so
 * this fits inside a normal Vercel serverless/build environment with no
 * Puppeteer/Chromium dependency.
 *
 * Run via `node --experimental-strip-types`, NOT `tsx`: as of
 * @react-pdf/hyphenate 0.1.0 (a transitive dependency of
 * @react-pdf/renderer), tsx's require/exports-resolution shim throws
 * `ERR_PACKAGE_PATH_NOT_EXPORTED` on that package's `"./*"` wildcard export
 * map, even though plain Node resolves it correctly. Confirmed 2026-09-25 by
 * reproducing the same import under plain Node (works) vs. under tsx
 * (fails) — this is a tsx resolver quirk, not a real problem with the
 * dependency. Written with no JSX (React.createElement directly) so a plain
 * `.ts` file can run via Node's own `--experimental-strip-types` type
 * stripping instead, which only erases type annotations and has no such
 * resolver bug. Re-check whether a future tsx release fixes this before
 * switching back to JSX/tsx for convenience.
 *
 * The document/styles definition itself now lives in `lib/civic-archive-pdf.ts`
 * so the Job 2 automation route (`app/api/civic-archive/sync/route.ts`) can
 * render the exact same PDF layout for a newly-summarized meeting without
 * duplicating it — this script just handles the "batch over every committed
 * summary, write to a local file" part.
 */
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { renderToFile } from "@react-pdf/renderer"
import { meetingSummaryPdfDocument } from "../lib/civic-archive-pdf.ts"
import {
  CIVIC_ARCHIVE_TOWNS,
  civicArchivePublicPdfDir,
  loadCivicArchiveMeetings,
  type CivicArchiveTownSlug,
} from "../lib/civic-archive.ts"

async function generateForTown(
  town: CivicArchiveTownSlug,
): Promise<{ generated: number; skipped: number }> {
  const { meetings, errors } = loadCivicArchiveMeetings(town)

  if (errors.length > 0) {
    console.error(
      `[generate-civic-archive-pdfs] ${errors.length} file(s) failed schema validation for "${town}":`,
    )
    for (const err of errors) {
      console.error(`  ${err.id}: ${err.message}`)
    }
  }

  if (meetings.length === 0) {
    console.warn(
      `[generate-civic-archive-pdfs] no valid meeting summaries found for "${town}" — nothing to render.`,
    )
    return { generated: 0, skipped: errors.length }
  }

  const outDir = civicArchivePublicPdfDir(town)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  let generated = 0
  for (const summary of meetings) {
    const outPath = join(outDir, `${summary.meetingId}.pdf`)
    await renderToFile(meetingSummaryPdfDocument(summary), outPath)
    console.log(`  ${summary.meetingId} -> ${outPath}`)
    generated += 1
  }
  return { generated, skipped: errors.length }
}

async function main() {
  let totalGenerated = 0
  let totalSkipped = 0
  for (const town of CIVIC_ARCHIVE_TOWNS) {
    console.log(`[generate-civic-archive-pdfs] rendering PDFs for "${town}"...`)
    const { generated, skipped } = await generateForTown(town)
    totalGenerated += generated
    totalSkipped += skipped
  }
  console.log(
    `[generate-civic-archive-pdfs] done — ${totalGenerated} PDF(s) generated, ${totalSkipped} file(s) skipped (schema errors).`,
  )
  if (totalGenerated === 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error("[generate-civic-archive-pdfs] fatal error:", err)
  process.exitCode = 1
})

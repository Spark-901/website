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
 */
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { renderToFile, Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { AgendaItem, MeetingSummary } from "@spark901/meeting-summary-schema"
import {
  CIVIC_ARCHIVE_TOWNS,
  civicArchivePublicPdfDir,
  loadCivicArchiveMeetings,
  type CivicArchiveTownSlug,
} from "../lib/civic-archive.ts"

const h = React.createElement

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  eyebrow: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9.5,
    color: "#6b7280",
    marginBottom: 16,
  },
  overview: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  agendaItem: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#d4d4d8",
  },
  agendaItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  agendaItemHeading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  agendaItemType: {
    fontSize: 8.5,
    color: "#6b7280",
    textTransform: "uppercase",
    marginLeft: 8,
  },
  agendaItemSummary: {
    fontSize: 10,
    lineHeight: 1.45,
  },
  agendaItemOutcome: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  agendaItemTimestamp: {
    fontSize: 8.5,
    color: "#9ca3af",
    marginTop: 2,
  },
  actionItem: {
    flexDirection: "row",
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  bullet: {
    width: 10,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  topicTag: {
    fontSize: 8.5,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  caveat: {
    marginTop: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f59e0b55",
    backgroundColor: "#fef3c7",
    fontSize: 8.5,
    lineHeight: 1.4,
    color: "#78350f",
  },
  sourceLink: {
    marginTop: 10,
    fontSize: 9,
    color: "#1d4ed8",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
})

function agendaItemRow(item: AgendaItem, index: number) {
  return h(
    View,
    { key: `${item.item}-${index}`, style: styles.agendaItem, wrap: false },
    h(
      View,
      { style: styles.agendaItemHeader },
      h(Text, { style: styles.agendaItemHeading }, item.item),
      h(Text, { style: styles.agendaItemType }, item.type.replace("-", " ")),
    ),
    h(Text, { style: styles.agendaItemSummary }, item.summary),
    item.outcome ? h(Text, { style: styles.agendaItemOutcome }, item.outcome) : null,
    h(Text, { style: styles.agendaItemTimestamp }, `Timestamp ${item.timestamp}`),
  )
}

function meetingSummaryPdfDocument(summary: MeetingSummary) {
  return h(
    Document,
    { title: summary.title, language: "en" },
    h(
      Page,
      { size: "LETTER", style: styles.page, wrap: true },
      h(Text, { style: styles.eyebrow }, `${summary.board} · Spark901 Civic Archive`),
      h(Text, { style: styles.title }, summary.title),
      h(Text, { style: styles.meta }, summary.date),
      h(Text, { style: styles.overview }, summary.overview),
      summary.topics.length > 0
        ? h(
            View,
            { style: styles.topicsRow },
            ...summary.topics.map((topic) => h(Text, { key: topic, style: styles.topicTag }, topic)),
          )
        : null,
      summary.agendaItems.length > 0
        ? h(
            View,
            null,
            h(Text, { style: styles.sectionHeading }, "What happened"),
            ...summary.agendaItems.map((item, index) => agendaItemRow(item, index)),
          )
        : null,
      summary.actionItems.length > 0
        ? h(
            View,
            null,
            h(Text, { style: styles.sectionHeading }, "Decisions & actions"),
            ...summary.actionItems.map((action, index) =>
              h(
                View,
                { key: `${action.timestamp}-${index}`, style: styles.actionItem },
                h(Text, { style: styles.bullet }, "•"),
                h(Text, null, action.description),
              ),
            ),
          )
        : null,
      h(
        Link,
        { src: summary.sourceVideoUrl, style: styles.sourceLink },
        `Watch the full meeting: ${summary.sourceVideoUrl}`,
      ),
      h(Text, { style: styles.caveat }, summary.transcriptCaveat),
      h(Text, {
        style: styles.footer,
        fixed: true,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Page ${pageNumber} of ${totalPages} · spark901.com/civic-archive`,
      }),
    ),
  )
}

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

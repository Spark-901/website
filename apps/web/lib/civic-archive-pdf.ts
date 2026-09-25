/**
 * The per-meeting summary PDF document definition — extracted out of
 * `scripts/generate-civic-archive-pdfs.ts` (Feature #1's batch script) so
 * the Job 2 automation route (`app/api/civic-archive/sync/route.ts`) can
 * render the exact same PDF for a newly-summarized meeting without
 * duplicating ~150 lines of `@react-pdf/renderer` styling. Both callers
 * import `meetingSummaryPdfDocument` from here now — this file owns the
 * layout, they own where the bytes end up (a local file for the manual
 * script, an S3 upload for the sync route).
 *
 * Written with `React.createElement` directly (no JSX) so this module
 * loads correctly under BOTH runners this repo needs it in: `node
 * --experimental-strip-types` (the manual script — see that script's doc
 * comment for why plain `tsx` breaks on `@react-pdf/hyphenate`'s export
 * map) and Next.js's own bundler (the API route, a normal Node serverless
 * function). Neither runner does JSX transformation the same way, so
 * `React.createElement` is the one form both handle identically.
 */
import React from "react"
import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { AgendaItem, MeetingSummary } from "@spark901/meeting-summary-schema"

const h = React.createElement

export const civicArchivePdfStyles = StyleSheet.create({
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
    { key: `${item.item}-${index}`, style: civicArchivePdfStyles.agendaItem, wrap: false },
    h(
      View,
      { style: civicArchivePdfStyles.agendaItemHeader },
      h(Text, { style: civicArchivePdfStyles.agendaItemHeading }, item.item),
      h(Text, { style: civicArchivePdfStyles.agendaItemType }, item.type.replace("-", " ")),
    ),
    h(Text, { style: civicArchivePdfStyles.agendaItemSummary }, item.summary),
    item.outcome ? h(Text, { style: civicArchivePdfStyles.agendaItemOutcome }, item.outcome) : null,
    h(Text, { style: civicArchivePdfStyles.agendaItemTimestamp }, `Timestamp ${item.timestamp}`),
  )
}

/** Builds the `@react-pdf/renderer` document tree for one meeting summary. Render it with `renderToFile`/`renderToBuffer`/`renderToStream`. */
export function meetingSummaryPdfDocument(summary: MeetingSummary) {
  return h(
    Document,
    { title: summary.title, language: "en" },
    h(
      Page,
      { size: "LETTER", style: civicArchivePdfStyles.page, wrap: true },
      h(Text, { style: civicArchivePdfStyles.eyebrow }, `${summary.board} · Spark901 Civic Archive`),
      h(Text, { style: civicArchivePdfStyles.title }, summary.title),
      h(Text, { style: civicArchivePdfStyles.meta }, summary.date),
      h(Text, { style: civicArchivePdfStyles.overview }, summary.overview),
      summary.topics.length > 0
        ? h(
            View,
            { style: civicArchivePdfStyles.topicsRow },
            ...summary.topics.map((topic) =>
              h(Text, { key: topic, style: civicArchivePdfStyles.topicTag }, topic),
            ),
          )
        : null,
      summary.agendaItems.length > 0
        ? h(
            View,
            null,
            h(Text, { style: civicArchivePdfStyles.sectionHeading }, "What happened"),
            ...summary.agendaItems.map((item, index) => agendaItemRow(item, index)),
          )
        : null,
      summary.actionItems.length > 0
        ? h(
            View,
            null,
            h(Text, { style: civicArchivePdfStyles.sectionHeading }, "Decisions & actions"),
            ...summary.actionItems.map((action, index) =>
              h(
                View,
                { key: `${action.timestamp}-${index}`, style: civicArchivePdfStyles.actionItem },
                h(Text, { style: civicArchivePdfStyles.bullet }, "•"),
                h(Text, null, action.description),
              ),
            ),
          )
        : null,
      h(
        Link,
        { src: summary.sourceVideoUrl, style: civicArchivePdfStyles.sourceLink },
        `Watch the full meeting: ${summary.sourceVideoUrl}`,
      ),
      h(Text, { style: civicArchivePdfStyles.caveat }, summary.transcriptCaveat),
      h(Text, {
        style: civicArchivePdfStyles.footer,
        fixed: true,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Page ${pageNumber} of ${totalPages} · spark901.com/civic-archive`,
      }),
    ),
  )
}

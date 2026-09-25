import type { MeetingSummary } from "@spark901/meeting-summary-schema"
import { AgendaItemList } from "./agenda-item-list"
import { DownloadPdfButton } from "./download-pdf-button"
import { TranscriptCaveatBanner } from "./transcript-caveat-banner"

export interface MeetingSummaryCardLabels {
  downloadPdf: string
  agendaHeading: string
  actionItemsHeading: string
  topicsHeading: string
  watchVideo: string
  watchAt: (timestamp: string) => string
}

const DEFAULT_LABELS: MeetingSummaryCardLabels = {
  downloadPdf: "Download PDF",
  agendaHeading: "What happened",
  actionItemsHeading: "Decisions & actions",
  topicsHeading: "Topics",
  watchVideo: "Watch the full meeting",
  watchAt: (timestamp) => `Watch at ${timestamp}`,
}

export interface MeetingSummaryCardProps {
  summary: MeetingSummary
  /** Path/URL to the generated PDF for this meeting. */
  pdfHref: string
  /** Override any subset of the card's display strings, e.g. with next-intl translations. */
  labels?: Partial<MeetingSummaryCardLabels>
  className?: string
}

/** A single civic-archive meeting: title, overview, agenda items, action items, topics, and the download/caveat pair. */
export function MeetingSummaryCard({
  summary,
  pdfHref,
  labels: labelOverrides,
  className = "",
}: MeetingSummaryCardProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const hasContent = summary.agendaItems.length > 0

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm ${className}`}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-tight text-foreground">{summary.title}</h3>
          <time dateTime={summary.date} className="text-sm text-muted-foreground">
            {summary.date}
          </time>
        </div>
        <DownloadPdfButton href={pdfHref} label={labels.downloadPdf} className="shrink-0" />
      </header>

      <p className="text-sm leading-relaxed text-muted-foreground">{summary.overview}</p>

      {summary.topics.length > 0 ? (
        <div>
          <h4 className="sr-only">{labels.topicsHeading}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {summary.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {topic}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasContent ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">{labels.agendaHeading}</h4>
          <AgendaItemList
            items={summary.agendaItems}
            sourceVideoUrl={summary.sourceVideoUrl}
            watchAtLabel={labels.watchAt}
          />
        </div>
      ) : null}

      {summary.actionItems.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">{labels.actionItemsHeading}</h4>
          <ul className="flex flex-col gap-1.5">
            {summary.actionItems.map((action, index) => (
              <li key={`${action.timestamp}-${index}`} className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true">•</span>
                <span>{action.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <a
        href={summary.sourceVideoUrl}
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        {labels.watchVideo}
      </a>

      <TranscriptCaveatBanner caveat={summary.transcriptCaveat} />
    </article>
  )
}

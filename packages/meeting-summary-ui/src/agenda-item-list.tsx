import type { AgendaItem } from "@spark901/meeting-summary-schema"

export interface AgendaItemListProps {
  items: AgendaItem[]
  /** e.g. "Watch at {timestamp}" with `{timestamp}` interpolated per item. */
  watchAtLabel?: (timestamp: string) => string
  /** Base video URL to link each item's timestamp back to, e.g. sourceVideoUrl. */
  sourceVideoUrl?: string
  className?: string
}

const TYPE_STYLES: Record<AgendaItem["type"], string> = {
  decision: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  vote: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  discussion: "bg-muted text-muted-foreground",
  "public-comment": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  presentation: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  other: "bg-muted text-muted-foreground",
}

function defaultWatchAtLabel(timestamp: string): string {
  return `Watch at ${timestamp}`
}

/** Renders one meeting's agenda items, each timestamped back to the source video. */
export function AgendaItemList({
  items,
  watchAtLabel = defaultWatchAtLabel,
  sourceVideoUrl,
  className = "",
}: AgendaItemListProps) {
  if (items.length === 0) return null

  return (
    <ol className={`flex flex-col gap-4 ${className}`}>
      {items.map((item, index) => (
        <li key={`${item.item}-${item.timestamp}-${index}`} className="border-l-2 border-border pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type]}`}>
              {item.type.replace("-", " ")}
            </span>
            <span className="text-sm font-semibold text-foreground">{item.item}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
          {item.outcome ? (
            <p className="mt-1 text-sm font-medium text-foreground">{item.outcome}</p>
          ) : null}
          {sourceVideoUrl ? (
            <a
              href={`${sourceVideoUrl}?t=${item.timestamp}`}
              className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {watchAtLabel(item.timestamp)}
            </a>
          ) : (
            <span className="mt-1 inline-block text-xs text-muted-foreground">{item.timestamp}</span>
          )}
        </li>
      ))}
    </ol>
  )
}

export interface TranscriptCaveatBannerProps {
  /** The summary's own `transcriptCaveat` field, verbatim — never rewritten or shortened. */
  caveat: string
  className?: string
}

/**
 * Renders the mandatory transcript-accuracy caveat visibly, never buried in a
 * tooltip or footnote. Every meeting summary in this project is derived from
 * an automated, uncorrected closed-captioning transcript — this banner is how
 * a resident is told that plainly wherever a summary appears.
 */
export function TranscriptCaveatBanner({ caveat, className = "" }: TranscriptCaveatBannerProps) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200 ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{caveat}</span>
    </div>
  )
}

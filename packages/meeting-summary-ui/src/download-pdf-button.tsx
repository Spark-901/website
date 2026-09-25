export interface DownloadPdfButtonProps {
  /** URL/path to the generated PDF, e.g. "/civic-archive/collierville/2026-08-17_396361.pdf". */
  href: string
  label: string
  className?: string
}

/** A styled link to a static, pre-generated per-meeting summary PDF. */
export function DownloadPdfButton({ href, label, className = "" }: DownloadPdfButtonProps) {
  return (
    <a
      href={href}
      download
      className={`inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0"
      >
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
      </svg>
      {label}
    </a>
  )
}

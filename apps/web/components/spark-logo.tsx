import { cn } from "@/lib/utils"
import { brand } from "@/lib/brand"

/** Canonical 4-point spark path in a 100×100 viewBox (axis-aligned; rotated in use). */
const SPARK_PATH =
  "M50 2 C53 36 64 47 98 50 C64 53 53 64 50 98 C47 64 36 53 2 50 C36 47 47 36 50 2 Z"

type IconTone = "auto" | "on-light" | "on-dark"
type MarkTone = "amber" | "ink" | "inverse" | "current"

type SparkLogoProps = {
  /** `icon` = app mark tile; `mark` = bare spark; `wordmark` = icon + name; `lockup` = + tagline */
  variant?: "icon" | "mark" | "wordmark" | "lockup"
  /**
   * Tile contrast for the app icon.
   * `auto` follows light/dark theme (dark tile on light UI, light tile on dark UI).
   */
  iconTone?: IconTone
  /** Color mode for the bare spark mark */
  markTone?: MarkTone
  showTagline?: boolean
  /** Override tagline (use for i18n). Defaults to `brand.tagline`. */
  tagline?: string
  className?: string
  /** Size of the icon/mark tile (default matches header) */
  size?: number
}

function SparkMark({
  className,
  tone = "amber",
  title,
  size,
}: {
  className?: string
  tone?: MarkTone
  title?: string
  size?: number
}) {
  const fillClass =
    tone === "amber"
      ? "fill-brand"
      : tone === "ink"
        ? "fill-foreground"
        : tone === "inverse"
          ? "fill-background"
          : "fill-current"

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <g transform="translate(50 50) rotate(-28) scale(1.08) translate(-50 -50)">
        <path className={fillClass} d={SPARK_PATH} />
      </g>
    </svg>
  )
}

function SparkIcon({
  className,
  size = 32,
  tone = "auto",
}: {
  className?: string
  size?: number
  tone?: IconTone
}) {
  const tileClass =
    tone === "on-light"
      ? "fill-brand-tile"
      : tone === "on-dark"
        ? "fill-brand-tile-inverse"
        : "fill-brand-tile dark:fill-brand-tile-inverse"

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="10" y="10" width="80" height="80" rx="20" className={tileClass} />
      <g transform="translate(50 50) rotate(-28) scale(1.12) translate(-50 -50)">
        <path className="fill-brand" d={SPARK_PATH} />
      </g>
    </svg>
  )
}

export function SparkLogo({
  variant = "wordmark",
  iconTone = "auto",
  markTone = "amber",
  showTagline,
  tagline,
  className,
  size = 32,
}: SparkLogoProps) {
  const withTagline = showTagline ?? variant === "lockup"
  const taglineText = tagline ?? brand.tagline

  if (variant === "mark") {
    return (
      <SparkMark
        className={className}
        tone={markTone}
        size={size}
        title="Spark901"
      />
    )
  }

  if (variant === "icon") {
    return <SparkIcon className={className} size={size} tone={iconTone} />
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <SparkIcon size={size} tone={iconTone} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-xl font-bold tracking-tight text-foreground">
          {brand.name}
        </span>
        {withTagline ? (
          <span className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
            {taglineText}
          </span>
        ) : null}
      </span>
    </span>
  )
}

export { SPARK_PATH }

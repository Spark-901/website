import { cn } from "@/lib/utils"
import { SparkLogo } from "@/components/spark-logo"

type ProjectCoverProps = {
  name: string
  category?: string
  className?: string
  /** Accessible label; defaults to “Preview of {name}” */
  label?: string
}

/**
 * Branded project cover — replaces broken placeholder image URLs.
 * Uses role="img" so crawlers/AT get a clear description without a 404 asset.
 */
export function ProjectCover({ name, category, className, label }: ProjectCoverProps) {
  return (
    <div
      role="img"
      aria-label={label ?? `Preview of ${name}`}
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(230,163,40,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(230,163,40,0.15), transparent 40%)",
        }}
        aria-hidden="true"
      />
      <SparkLogo variant="icon" size={48} iconTone="on-light" className="relative" />
      <p className="relative mt-4 max-w-[90%] text-balance text-lg font-semibold tracking-tight text-white sm:text-xl">
        {name}
      </p>
      {category ? (
        <p className="relative mt-1 text-xs font-medium uppercase tracking-wider text-brand">
          {category}
        </p>
      ) : null}
    </div>
  )
}

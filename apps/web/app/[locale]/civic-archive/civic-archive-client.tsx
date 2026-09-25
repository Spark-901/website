"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { MeetingSummary } from "@spark901/meeting-summary-schema"
import { MeetingSummaryCard } from "@spark901/meeting-summary-ui"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export interface CivicArchiveClientProps {
  meetings: { summary: MeetingSummary; pdfHref: string }[]
}

export function CivicArchiveClient({ meetings }: CivicArchiveClientProps) {
  const t = useTranslations("civicArchive")

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t("badge")}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </section>

      {/* Meeting list */}
      <section className="px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="meetings-heading">
        <div className="mx-auto max-w-4xl">
          <h2 id="meetings-heading" className="sr-only">
            {t("meetingsHeading")}
          </h2>

          {meetings.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("emptyState")}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {meetings.map(({ summary, pdfHref }) => (
                <MeetingSummaryCard
                  key={summary.meetingId}
                  summary={summary}
                  pdfHref={pdfHref}
                  labels={{
                    downloadPdf: t("downloadPdf"),
                    agendaHeading: t("agendaHeading"),
                    actionItemsHeading: t("actionItemsHeading"),
                    topicsHeading: t("topicsHeading"),
                    watchVideo: t("watchVideo"),
                    watchAt: (timestamp) => t("watchAt", { timestamp }),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Donate CTA — this feature exists partly to drive donations, so this
          is explicit and on-page, not left to a footer link. */}
      <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            {t("donateCtaTitle")}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{t("donateCtaBody")}</p>
          <Button asChild size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/fund/civic-archive">
              {t("donateCtaButton")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

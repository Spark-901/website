import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowRight, CheckCircle2, Heart, Mail, Share2 } from "lucide-react"
import { ManageContributionButton } from "@/components/manage-contribution-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { brand } from "@/lib/brand"
import { loadContributionDetails } from "@/lib/contribution-session"
import { locales } from "@/i18n/config"
import { getProjectBySlug, projects } from "@/lib/projects"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  const params = []
  for (const locale of locales) {
    for (const project of projects) {
      params.push({
        locale,
        slug: project.slug,
      })
    }
  }
  return params
}

interface ThankYouPageProps {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ session_id?: string }>
}

export async function generateMetadata({ params }: ThankYouPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const project = getProjectBySlug(slug)
  const { createPageMetadata, isLocale } = await import("@/lib/seo")
  const loc = isLocale(locale) ? locale : "en"
  return createPageMetadata({
    locale: loc,
    path: `/fund/${slug}/thank-you`,
    title: project ? `Thank you — ${project.name}` : "Thank you",
    description: "Contribution confirmation — this page is not indexed.",
    noIndex: true,
  })
}

export default async function ThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const { slug, locale } = await params
  const { session_id: sessionId } = await searchParams
  const project = getProjectBySlug(slug)
  const t = await getTranslations("thankYou")

  if (!project) {
    notFound()
  }

  const contribution = sessionId ? await loadContributionDetails(sessionId, slug) : null
  const verified = contribution?.verified ?? false
  const firstName = contribution?.firstName
  const fullName = contribution?.fullName
  const amountLabel = contribution?.amountLabel
  const donorEmail = contribution?.email
  const isRecurring = contribution?.isRecurring ?? false
  const contributedAt = contribution?.createdAt
    ? new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(contribution.createdAt)
    : null

  const returnPath = locale === "en" ? `/fund/${slug}` : `/${locale}/fund/${slug}`
  const headline = verified
    ? firstName
      ? t("titleNamed", { name: firstName })
      : t("titleVerified")
    : t("title")

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-10 w-10 text-accent" aria-hidden="true" />
            </div>

            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h1>

            <p className="mb-8 text-lg text-muted-foreground">
              {verified
                ? t.rich("subtitleVerified", {
                    amount: amountLabel ?? "",
                    project: () => <strong className="text-foreground">{project.name}</strong>,
                  })
                : t.rich("subtitle", {
                    project: () => <strong className="text-foreground">{project.name}</strong>,
                  })}
            </p>

            {verified && (
              <div className="mb-8 overflow-hidden rounded-xl border border-border text-left">
                <div className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-semibold">
                  {t("summaryTitle")}
                </div>
                <dl className="divide-y divide-border">
                  {fullName && (
                    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{t("summaryName")}</dt>
                      <dd className="font-medium text-foreground">{fullName}</dd>
                    </div>
                  )}
                  {amountLabel && (
                    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{t("summaryAmount")}</dt>
                      <dd className="font-medium text-foreground">{amountLabel}</dd>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{t("summaryProject")}</dt>
                    <dd className="font-medium text-foreground">{project.name}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{t("summaryFrequency")}</dt>
                    <dd className="font-medium text-foreground">
                      {isRecurring ? t("frequencyMonthly") : t("frequencyOneTime")}
                    </dd>
                  </div>
                  {contributedAt && (
                    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{t("summaryDate")}</dt>
                      <dd className="font-medium text-foreground">{contributedAt}</dd>
                    </div>
                  )}
                  {donorEmail && (
                    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{t("summaryEmail")}</dt>
                      <dd className="break-all font-medium text-foreground">{donorEmail}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
                <span className="font-semibold">{t("impact")}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {verified
                  ? isRecurring
                    ? t("impactRecurring")
                    : t("impactOneTime")
                  : t("receipt")}
              </p>
              {verified && donorEmail && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("receiptTo", { email: donorEmail })}
                </p>
              )}
              {!brand.isTaxDeductible && (
                <p className="mt-3 text-xs text-muted-foreground">{t("taxNote")}</p>
              )}
            </div>

            <div className="space-y-3">
              {verified && isRecurring && sessionId && (
                <ManageContributionButton
                  sessionId={sessionId}
                  label={t("manageMonthly")}
                  returnPath={returnPath}
                />
              )}

              <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
                <Link href={`/fund/${slug}`}>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t("share")}
                </Link>
              </Button>

              <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/fund">
                  {t("explore")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              {t("questions")}{" "}
              <a href={`mailto:${brand.email}`} className="text-primary underline underline-offset-2">
                {t("contact")}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

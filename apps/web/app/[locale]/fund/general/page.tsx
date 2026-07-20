import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { ArrowLeft, Shield, Sparkles, Users } from "lucide-react"
import { ProjectFundingPanel } from "@/components/project-funding-panel"
import { DevelopmentMilestones } from "@/components/development-milestones"
import { JsonLd } from "@/components/json-ld"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { locales } from "@/i18n/config"
import { isFeatureEnabled } from "@/lib/features"
import { GENERAL_FUND_SLUG, getGeneralFund } from "@/lib/projects"
import {
  breadcrumbJsonLd,
  createPageMetadata,
  isLocale,
  softwareApplicationJsonLd,
} from "@/lib/seo"
import { getProjectFundingStats } from "@/lib/stripe-stats"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const isEs = locale === "es"
  const project = getGeneralFund()

  return createPageMetadata({
    locale,
    path: `/fund/${GENERAL_FUND_SLUG}`,
    title: isEs ? "Fondo General" : "General Fund",
    description: isEs
      ? "Apoyo flexible para la capacidad del estudio Spark901: ingeniería, hosting y las herramientas que más lo necesiten."
      : (project?.description ??
        "Flexible support for Spark901 studio capacity—engineering, hosting, and whichever tools need it most."),
    ogTitle: isEs ? "Fondo General | Spark901" : "General Fund | Spark901",
    ogDescription: isEs
      ? "Financia la capacidad compartida detrás de las herramientas de código abierto."
      : (project?.tagline ?? "Flexible support for open-source tools"),
    type: "article",
    image: {
      url: "/og-image.png",
      alt: isEs ? "Fondo General de Spark901" : "Spark901 General Fund",
    },
  })
}

export default async function GeneralFundPage({ params }: Props) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  setRequestLocale(locale)
  const t = await getTranslations("generalFund")
  const tProject = await getTranslations("projectDetail")
  const baseProject = getGeneralFund()

  if (!baseProject) {
    notFound()
  }

  const stripeStats = await getProjectFundingStats(baseProject.slug)
  const project = {
    ...baseProject,
    fundingRaised: stripeStats.fundingRaised,
    backers: stripeStats.backers,
    monthlyBackers: stripeStats.monthlyBackers,
  }

  const isAlivenessSignalsEnabled = isFeatureEnabled("ALIVENESS_SIGNALS")
  const progressPercentage = Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)

  return (
    <>
      <JsonLd data={softwareApplicationJsonLd(project, locale)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Fund a Tool", path: "/fund" },
            { name: project.name, path: `/fund/${project.slug}` },
          ],
          locale,
        )}
      />
      <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/fund"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("backToCatalog")}
          </Link>

          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 py-10 sm:px-10">
            <Badge className="mb-4 gap-1.5 bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t("badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-medium text-primary">{t("tagline")}</p>
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              {tProject("backers", { count: project.backers })}
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <section aria-labelledby="general-fund-helps">
                <h2 id="general-fund-helps" className="text-xl font-semibold text-foreground">
                  {t("whoItHelpsTitle")}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{t("whoItHelps")}</p>
              </section>

              <section aria-labelledby="general-fund-allocation">
                <h2 id="general-fund-allocation" className="text-xl font-semibold text-foreground">
                  {t("allocationTitle")}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{t("allocationBody")}</p>
                <Link
                  href="/transparency"
                  className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("transparencyLink")}
                </Link>
              </section>

              {isAlivenessSignalsEnabled && project.milestones && (
                <DevelopmentMilestones
                  milestones={project.milestones}
                  fundingRaised={project.fundingRaised}
                />
              )}

              <ProjectFundingPanel
                project={project}
                fundingTiersLabel={tProject("fundingTiers")}
                variant="tiers"
              />
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-foreground">
                        ${project.fundingRaised.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("raisedOf", { goal: project.fundingGoal.toLocaleString() })}
                      </p>
                    </div>
                    <div className="mt-4">
                      <Progress value={progressPercentage} className="h-3" />
                    </div>
                    <p className="mt-2 text-center text-sm font-medium text-primary">
                      {t("percentFunded", { percent: progressPercentage.toFixed(0) })}
                    </p>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      {t("backersLine", {
                        backers: project.backers,
                        monthly: project.monthlyBackers,
                      })}
                    </p>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      {t("totalsNote")}
                    </p>
                  </CardContent>
                </Card>

                <ProjectFundingPanel
                  project={project}
                  fundingTiersLabel={tProject("fundingTiers")}
                  variant="sidebar"
                />

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>{tProject("securePayment")}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("guarantee")}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{t("taxNote")}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

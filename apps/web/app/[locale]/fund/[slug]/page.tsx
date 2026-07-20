import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GENERAL_FUND_SLUG, getProjectBySlug, projects } from "@/lib/projects"
import { ProjectFundingPanel } from "@/components/project-funding-panel"
import { OrganizationDirectory } from "@/components/organization-directory"
import { LiveSavingsCounter } from "@/components/live-savings-counter"
import { DevelopmentMilestones } from "@/components/development-milestones"
import { GitHubActivity } from "@/components/github-activity"
import { GiftToolDialog } from "@/components/gift-tool-dialog"
import { BetaTesterSignupForm } from "@/components/beta-tester-signup-form"
import { ProjectCover } from "@/components/project-cover"
import { JsonLd } from "@/components/json-ld"
import { locales } from "@/i18n/config"
import { isFeatureEnabled } from "@/lib/features"
import { getProjectFundingStats } from "@/lib/stripe-stats"
import {
  breadcrumbJsonLd,
  createPageMetadata,
  isLocale,
  softwareApplicationJsonLd,
} from "@/lib/seo"
import { ArrowLeft, Users, Target, Shield, Flame } from "lucide-react"
import { SparkLogo } from "@/components/spark-logo"
import { Github } from "@/components/ui/brand-icons"

export function generateStaticParams() {
  const params = []
  for (const locale of locales) {
    for (const project of projects) {
      // Dedicated route: app/[locale]/fund/general/page.tsx
      if (project.slug === GENERAL_FUND_SLUG) continue
      params.push({
        locale,
        slug: project.slug,
      })
    }
  }
  return params
}

interface ProjectPageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug, locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const project = getProjectBySlug(slug)

  if (!project) {
    return { title: "Project Not Found" }
  }

  return createPageMetadata({
    locale,
    path: `/fund/${project.slug}`,
    title: project.name,
    description: project.description,
    ogTitle: `${project.name} | Spark901`,
    ogDescription: project.tagline,
    type: "article",
    image: {
      url: "/og-image.png",
      alt: `${project.name} — ${project.tagline}`,
    },
  })
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug, locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  setRequestLocale(locale)
  const baseProject = getProjectBySlug(slug)
  const t = await getTranslations("projectDetail")

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

  const isAdoptionTrackerEnabled = isFeatureEnabled("ADOPTION_TRACKER")
  const isAlivenessSignalsEnabled = isFeatureEnabled("ALIVENESS_SIGNALS")
  const isGiftToolEnabled = isFeatureEnabled("GIFT_A_TOOL")
  const isFeedbackEnabled = isFeatureEnabled("NONPROFIT_FEEDBACK_LOOP")
  const progressPercentage = Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)
  const isFunded = project.status === "funded"
  const remaining = project.fundingGoal - project.fundingRaised
  const isAlmostFunded = progressPercentage >= 75 && !isFunded

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
          {/* Back Link */}
          <Link
            href="/fund"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all projects
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Hero Image */}
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <ProjectCover
                  name={project.name}
                  category={project.category}
                  label={`Cover for ${project.name}: ${project.tagline}`}
                />
                <Badge
                  className={`absolute right-4 top-4 ${
                    isFunded ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isFunded ? "Fully Funded" : project.category}
                </Badge>
                {isAlmostFunded && (
                  <Badge className="absolute left-4 top-4 gap-1 bg-accent text-accent-foreground">
                    <Flame className="h-3 w-3" aria-hidden="true" />
                    Only ${remaining.toLocaleString()} to go!
                  </Badge>
                )}
              </div>

              {/* Title & Tagline */}
              <div className="mt-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{project.name}</h1>
                <p className="mt-2 text-lg font-medium text-primary">{project.tagline}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <Users className="mr-1 inline h-4 w-4" aria-hidden="true" />
                  {t("backers", { count: project.backers })}
                </p>
              </div>

              {/* Organization Directory */}
              {isAdoptionTrackerEnabled && project.adoptingOrganizations && (
                <OrganizationDirectory
                  organizations={project.adoptingOrganizations}
                  title={t("adoptingOrganizationsTitle")}
                />
              )}

              {/* What It Does */}
              <section className="mt-8" aria-labelledby="what-it-does">
                <h2 id="what-it-does" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <SparkLogo variant="mark" markTone="amber" size={20} />
                  {t("whatItDoes")}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{project.description}</p>
              </section>

              {/* Who It Helps */}
              <section className="mt-8" aria-labelledby="who-it-helps">
                <h2 id="who-it-helps" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  {t("whoItHelps")}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{project.whoItHelps}</p>
              </section>

              {/* Development Milestones */}
              {isAlivenessSignalsEnabled && project.milestones && (
                <DevelopmentMilestones milestones={project.milestones} fundingRaised={project.fundingRaised} />
              )}

              {/* Impact Metrics */}
              <section className="mt-8" aria-labelledby="impact-metrics">
                <h2 id="impact-metrics" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                  {t("impactMetrics")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {isAdoptionTrackerEnabled && project.liveSavings && (
                    <LiveSavingsCounter
                      baseValue={project.liveSavings.baseValue}
                      incrementAmount={project.liveSavings.incrementAmount}
                      intervalMs={project.liveSavings.intervalMs}
                      label={project.liveSavings.label}
                      prefix={project.liveSavings.prefix}
                      suffix={project.liveSavings.suffix}
                    />
                  )}
                  {project.impactMetrics.map((metric, index) => (
                    <Card key={index} className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{metric.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {!isFunded && (
                <ProjectFundingPanel
                  project={project}
                  fundingTiersLabel={t("fundingTiers")}
                  variant="tiers"
                />
              )}

              {/* GitHub Activity */}
              {isAlivenessSignalsEnabled && project.githubUrl && (
                <GitHubActivity githubUrl={project.githubUrl} />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Funding Progress Card — live from Stripe */}
                <Card className={isAlmostFunded ? "border-accent" : ""}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-foreground">${project.fundingRaised.toLocaleString()}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        raised of ${project.fundingGoal.toLocaleString()} goal
                      </p>
                    </div>
                    <div className="mt-4">
                      <Progress
                        value={progressPercentage}
                        className={`h-3 ${isAlmostFunded ? "[&>div]:bg-accent" : ""}`}
                      />
                    </div>
                    <p
                      className={`mt-2 text-center text-sm font-medium ${isAlmostFunded ? "text-accent" : "text-primary"}`}
                    >
                      {progressPercentage.toFixed(0)}% funded
                    </p>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      {project.backers} backers
                      {project.monthlyBackers > 0 ? ` · ${project.monthlyBackers} monthly` : ""}
                    </p>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      Totals refresh from Stripe about every minute.
                    </p>
                  </CardContent>
                </Card>

                {isFeedbackEnabled && (
                  <BetaTesterSignupForm projectName={project.name} />
                )}

                {isGiftToolEnabled && (
                  <GiftToolDialog projectTitle={project.name} projectSlug={project.slug} />
                )}

                {!isFunded ? (
                  <ProjectFundingPanel
                    project={project}
                    fundingTiersLabel={t("fundingTiers")}
                    variant="sidebar"
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="rounded-lg bg-accent/10 p-4 text-center">
                        <p className="font-semibold text-foreground">This project is fully funded!</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Thank you to all {project.backers} backers.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Trust Signals */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>{t("securePayment")}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("guarantee")}</p>

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Github className="h-4 w-4" aria-hidden="true" />
                        <span>{t("viewCode")}</span>
                      </a>
                    )}
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

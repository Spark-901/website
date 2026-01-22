import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getProjectBySlug, projects } from "@/lib/projects"
import { FundingForm } from "@/components/funding-form"
import { locales } from "@/i18n/config"
import { ArrowLeft, Github, Check, Zap, Users, Target, Shield, Flame } from "lucide-react"

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

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    return {
      title: "Project Not Found",
    }
  }

  return {
    title: project.name,
    description: project.description,
    openGraph: {
      title: `${project.name} | Spark901`,
      description: project.tagline,
      type: "article",
      images: [
        {
          url: `/placeholder.svg?height=630&width=1200&query=${encodeURIComponent(project.imageQuery)}`,
          width: 1200,
          height: 630,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} | Spark901`,
      description: project.tagline,
    },
  }
}

function ProjectJsonLd({ project }: { project: ReturnType<typeof getProjectBySlug> }) {
  if (!project) return null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.description,
    brand: {
      "@type": "Organization",
      name: "Spark901",
    },
    offers: {
      "@type": "Offer",
      price: project.fundingTiers[0]?.amount || 50,
      priceCurrency: "USD",
      availability: project.status === "funded" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  const t = await getTranslations("projectDetail")

  if (!project) {
    notFound()
  }

  const progressPercentage = Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)
  const isFunded = project.status === "funded"
  const remaining = project.fundingGoal - project.fundingRaised
  const isAlmostFunded = progressPercentage >= 75 && !isFunded

  return (
    <>
      <ProjectJsonLd project={project} />
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
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <img
                  src={`/.jpg?height=400&width=800&query=${encodeURIComponent(project.imageQuery)}`}
                  alt={`Screenshot of ${project.name}`}
                  className="h-full w-full object-cover"
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

              {/* What It Does */}
              <section className="mt-8" aria-labelledby="what-it-does">
                <h2 id="what-it-does" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
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

              {/* Impact Metrics */}
              <section className="mt-8" aria-labelledby="impact-metrics">
                <h2 id="impact-metrics" className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                  {t("impactMetrics")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
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

              {/* Funding Tiers */}
              <section className="mt-8" aria-labelledby="funding-tiers">
                <h2 id="funding-tiers" className="text-xl font-semibold text-foreground">
                  {t("fundingTiers")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {project.fundingTiers.map((tier, index) => (
                    <Card
                      key={index}
                      className={`transition-all hover:shadow-md ${index === project.fundingTiers.length - 1 ? "border-accent bg-accent/5" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <span className="text-xl font-bold text-primary">${tier.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Funding Progress Card */}
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
                    <p className="mt-1 text-center text-xs text-muted-foreground">{project.backers} backers</p>
                  </CardContent>
                </Card>

                {!isFunded ? (
                  <Card id="fund">
                    <CardHeader>
                      <CardTitle className="text-lg">{t("fundingTiers")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FundingForm
                        projectSlug={slug}
                        projectTitle={project.name}
                        backers={project.backers}
                        monthlyBackers={project.monthlyBackers}
                      />
                    </CardContent>
                  </Card>
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

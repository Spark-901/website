"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectCard } from "@/components/project-card"
import { GENERAL_FUND_SLUG, type Project } from "@/lib/projects"
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react"
import { SuggestToolForm } from "@/components/suggest-tool-form"
import { isFeatureEnabled } from "@/lib/features"

type FilterStatus = "all" | "active" | "funded"

export function FundAToolClient({ projects }: { projects: Project[] }) {
  const t = useTranslations("fundATool")
  const tGeneral = useTranslations("generalFund")
  const [filter, setFilter] = useState<FilterStatus>("all")

  const generalFund = projects.find((p) => p.slug === GENERAL_FUND_SLUG)
  const toolProjects = projects.filter((p) => p.slug !== GENERAL_FUND_SLUG)
  const isFeedbackEnabled = isFeatureEnabled("NONPROFIT_FEEDBACK_LOOP")

  const filteredProjects = toolProjects.filter((project: Project) => {
    if (filter === "all") return true
    if (filter === "active") return project.status === "active"
    if (filter === "funded") return project.status === "funded"
    return true
  })

  const activeCount = toolProjects.filter((p: Project) => p.status === "active").length
  const fundedCount = toolProjects.filter((p: Project) => p.status === "funded").length
  const totalBackers = projects.reduce((sum, p) => sum + p.backers, 0)
  const totalRaised = projects.reduce((sum, p) => sum + p.fundingRaised, 0)

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("title")}
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">${totalRaised.toLocaleString()}</span> raised ·{" "}
              <span className="font-semibold text-foreground">{totalBackers}</span> backers (live from Stripe)
            </span>
          </div>
        </div>

        {/* Filters */}
        <div
          className="mb-8 flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Filter projects"
        >
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={filter === "all" ? "" : "bg-transparent"}
          >
            {t("filterAll")} ({toolProjects.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
            className={filter === "active" ? "bg-primary" : "bg-transparent"}
          >
            {t("filterActive")} ({activeCount})
          </Button>
          <Button
            variant={filter === "funded" ? "default" : "outline"}
            onClick={() => setFilter("funded")}
            className={filter === "funded" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-transparent"}
            aria-pressed={filter === "funded"}
          >
            {t("filterFunded")} ({fundedCount})
          </Button>
        </div>

        {generalFund && (
          <div className="mb-10 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-accent/5 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">
                  {tGeneral("badge")}
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{tGeneral("title")}</h2>
                <p className="mt-2 text-muted-foreground">{tGeneral("catalogBlurb")}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    ${generalFund.fundingRaised.toLocaleString()}
                  </span>{" "}
                  {t("raised").toLowerCase()} · {t("backersCount", { count: generalFund.backers })}
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href={`/fund/${GENERAL_FUND_SLUG}`}>
                  {tGeneral("cta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No projects found matching your filter.</p>
          </div>
        )}

        {isFeedbackEnabled && (
          <div className="mt-20 border-t pt-16">
            <div className="mx-auto max-w-3xl">
              <SuggestToolForm />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

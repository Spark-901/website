"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectCard } from "@/components/project-card"
import { getAllProjects, type Project } from "@/lib/projects"
import { Sparkles, TrendingUp } from "lucide-react"

type FilterStatus = "all" | "active" | "funded"

export function FundAToolClient() {
  const t = useTranslations("fundATool")
  const [filter, setFilter] = useState<FilterStatus>("all")

  const allProjects = getAllProjects()

  const filteredProjects = allProjects.filter((project: Project) => {
    if (filter === "all") return true
    if (filter === "active") return project.status === "active"
    if (filter === "funded") return project.status === "funded"
    return true
  })

  const activeCount = allProjects.filter((p: Project) => p.status === "active").length
  const fundedCount = allProjects.filter((p: Project) => p.status === "funded").length
  const totalBackers = allProjects.reduce((sum, p) => sum + p.backers, 0)

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
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{totalBackers}+ backers</span> have funded our projects
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
            {t("filterAll")} ({allProjects.length})
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
      </div>
    </div>
  )
}

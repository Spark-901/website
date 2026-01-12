"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Project } from "@/lib/projects"
import { ArrowRight, Users, Flame } from "lucide-react"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations("fundATool")

  const progressPercentage = Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)
  const isFunded = project.status === "funded"
  const remaining = project.fundingGoal - project.fundingRaised
  const isAlmostFunded = progressPercentage >= 75 && !isFunded

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={`/.jpg?height=200&width=400&query=${encodeURIComponent(project.imageQuery)}`}
          alt={`Preview of ${project.name}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge
          className={`absolute right-3 top-3 ${
            isFunded ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {isFunded ? t("filterFunded") : project.category}
        </Badge>
        {isAlmostFunded && (
          <Badge className="absolute left-3 top-3 gap-1 bg-accent text-accent-foreground">
            <Flame className="h-3 w-3" aria-hidden="true" />
            {t("almostThere")}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
        <p className="text-sm text-primary">{project.tagline}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("raised")}</span>
            <span className="font-semibold text-foreground">
              ${project.fundingRaised.toLocaleString()} / ${project.fundingGoal.toLocaleString()}
            </span>
          </div>
          <Progress value={progressPercentage} className={`h-2 ${isAlmostFunded ? "[&>div]:bg-accent" : ""}`} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {t("backersCount", { count: project.backers })}
            </span>
            {!isFunded && remaining <= 5000 && (
              <span className="font-medium text-accent">{t("urgency", { amount: remaining.toLocaleString() })}</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button asChild variant="outline" className="flex-1 bg-transparent">
          <Link href={`/fund/${project.slug}`}>{t("viewDetails")}</Link>
        </Button>
        {!isFunded && (
          <Button asChild className="flex-1 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={`/fund/${project.slug}#fund`}>
              {t("fundThis")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

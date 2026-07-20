"use client"

import { useCallback, useEffect, useState } from "react"
import { FundingForm } from "@/components/funding-form"
import { FundingTiersPicker } from "@/components/funding-tiers-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/projects"

interface ProjectFundingPanelProps {
  project: Project
  fundingTiersLabel: string
  /** "full" renders tiers + form (mobile-friendly stack). "sidebar" form only. "tiers" tiers only. */
  variant: "full" | "sidebar" | "tiers"
}

function readAmountFromUrl(): number | null {
  if (typeof window === "undefined") return null
  const amount = Number(new URLSearchParams(window.location.search).get("amount"))
  return Number.isFinite(amount) && amount >= 5 ? amount : null
}

export function ProjectFundingPanel({
  project,
  fundingTiersLabel,
  variant,
}: ProjectFundingPanelProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  useEffect(() => {
    setSelectedAmount(readAmountFromUrl())
  }, [])

  const selectAmount = useCallback((amount: number) => {
    setSelectedAmount(amount)
    const url = new URL(window.location.href)
    url.searchParams.set("amount", String(amount))
    url.hash = "fund"
    window.history.replaceState({}, "", url.toString())
    window.dispatchEvent(new CustomEvent("spark901:fund-amount", { detail: { amount } }))
    document.getElementById("fund")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  useEffect(() => {
    const onAmount = (event: Event) => {
      const detail = (event as CustomEvent<{ amount: number }>).detail
      if (detail?.amount >= 5) setSelectedAmount(detail.amount)
    }
    window.addEventListener("spark901:fund-amount", onAmount)
    return () => window.removeEventListener("spark901:fund-amount", onAmount)
  }, [])

  if (variant === "tiers") {
    return (
      <FundingTiersPicker
        project={project}
        title={fundingTiersLabel}
        selectedAmount={selectedAmount}
        onSelectAmount={selectAmount}
      />
    )
  }

  if (variant === "sidebar") {
    return (
      <Card id="fund">
        <CardHeader>
          <CardTitle className="text-lg">Fund {project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <FundingForm
            projectSlug={project.slug}
            projectTitle={project.name}
            backers={project.backers}
            monthlyBackers={project.monthlyBackers}
            initialAmount={selectedAmount ?? undefined}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <FundingTiersPicker
        project={project}
        title={fundingTiersLabel}
        selectedAmount={selectedAmount}
        onSelectAmount={selectAmount}
      />
      <Card id="fund">
        <CardHeader>
          <CardTitle className="text-lg">Fund {project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <FundingForm
            projectSlug={project.slug}
            projectTitle={project.name}
            backers={project.backers}
            monthlyBackers={project.monthlyBackers}
            initialAmount={selectedAmount ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Check } from "lucide-react"
import type { Project } from "@/lib/projects"

interface FundingTiersPickerProps {
  project: Project
  title: string
  selectedAmount?: number | null
  onSelectAmount: (amount: number) => void
}

export function FundingTiersPicker({
  project,
  title,
  selectedAmount,
  onSelectAmount,
}: FundingTiersPickerProps) {
  return (
    <section className="mt-8" aria-labelledby="funding-tiers">
      <h2 id="funding-tiers" className="text-xl font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a level to prefill your contribution for {project.name}.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {project.fundingTiers.map((tier, index) => {
          const isSelected = selectedAmount === tier.amount
          const isFounding = index === project.fundingTiers.length - 1
          return (
            <button
              key={tier.name}
              type="button"
              onClick={() => onSelectAmount(tier.amount)}
              className={`rounded-xl border text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : isFounding
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card"
              }`}
            >
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <span className="text-xl font-bold text-primary">${tier.amount.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <div className="px-4 pb-4">
                <ul className="space-y-2">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-primary">
                  {isSelected ? "Selected — continue in the form →" : "Click to fund at this level →"}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

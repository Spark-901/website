"use client"

import { useTranslations } from "next-intl"
import { Building2, TrendingUp, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { brand } from "@/lib/brand"

type MemphisNonprofitHubStatsProps = {
  /** Slightly tighter padding when nested inside another band */
  className?: string
}

export function MemphisNonprofitHubStats({ className = "" }: MemphisNonprofitHubStatsProps) {
  const t = useTranslations("memphisNonprofitHub")
  const hub = brand.memphisNonprofitHub

  const orgs = hub.taxExemptNonprofitCountMin.toLocaleString()
  const employed = hub.peopleEmployedMin.toLocaleString()

  return (
    <section
      className={`px-4 py-16 sm:px-6 sm:py-20 lg:px-8 ${className}`.trim()}
      aria-labelledby="memphis-nonprofit-hub-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="memphis-nonprofit-hub-title"
            className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{t("description")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-card shadow-sm">
            <CardContent className="flex flex-col p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                {hub.nonprofitsPer10k}
                <span className="text-lg font-semibold text-muted-foreground sm:text-xl">{t("per10kSuffix")}</span>
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{t("densityCaption")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("densityBody")}</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-sm">
            <CardContent className="flex flex-col p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-foreground sm:text-4xl">{orgs}+</p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{t("orgsCaption")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("orgsBody")}</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-sm">
            <CardContent className="flex flex-col p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-foreground sm:text-4xl">{employed}+</p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{t("jobsCaption")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("jobsBody", { billions: hub.assetsBillionsMin })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Code2, Heart, Users, MapPin, Sparkles } from "lucide-react"
import { VolunteerSignupForm } from "@/components/volunteer-signup-form"
import { MemphisNonprofitHubStats } from "@/components/memphis-nonprofit-hub-stats"

export function VolunteerClient() {
  const t = useTranslations("volunteer")

  const benefits = [
    {
      icon: Code2,
      title: t("benefits.shipOss.title"),
      body: t("benefits.shipOss.body"),
    },
    {
      icon: Heart,
      title: t("benefits.realImpact.title"),
      body: t("benefits.realImpact.body"),
    },
    {
      icon: Users,
      title: t("benefits.community.title"),
      body: t("benefits.community.body"),
    },
    {
      icon: MapPin,
      title: t("benefits.memphisRoots.title"),
      body: t("benefits.memphisRoots.body"),
    },
  ]

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-2 bg-primary/10 text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("hero.tagline")}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("hero.headline")}
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("benefits.heading")}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t("benefits.subheading")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <MemphisNonprofitHubStats />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("formSection.heading")}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t("formSection.subheading")}
            </p>
          </div>
          <VolunteerSignupForm />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("formSection.privacyNote")}
          </p>
        </div>
      </section>
    </div>
  )
}

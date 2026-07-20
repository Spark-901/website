"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Code2, Users, MapPin, Heart } from "lucide-react"
import { SparkLogo } from "@/components/spark-logo"
import { Github } from "@/components/ui/brand-icons"
import { MemphisNonprofitHubStats } from "@/components/memphis-nonprofit-hub-stats"

export function AboutClient() {
  const t = useTranslations("about")

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("mission")}
          </p>
        </div>
      </section>

      {/* Memphis Story */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="memphis-story">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Memphis, Tennessee
              </div>
              <h2
                id="memphis-story"
                className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Rooted in Memphis, built for everywhere
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Spark901 was born in Memphis—a city with deep roots in community, civil rights, and grassroots
                organizing. We believe the best technology comes from understanding the communities it serves.
              </p>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Our area code, 901, isn't just a number—it's our identity. We're proud to be building technology that
                honors Memphis's legacy of community power while serving organizations worldwide.
              </p>
            </div>
            <div className="relative">
              <img src="/memphis-skyline-river-sunset-community.jpg" alt="Memphis skyline at sunset" className="rounded-xl shadow-lg" />
              <div className="absolute -bottom-4 -right-4 rounded-lg bg-accent p-4 shadow-lg">
                <p className="text-2xl font-bold text-accent-foreground">901</p>
                <p className="text-sm text-accent-foreground/80">Memphis Strong</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MemphisNonprofitHubStats />

      {/* Values */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="values-title">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 id="values-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("values.title")}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="border-none bg-card shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Code2 className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("values.openSource")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("values.openSourceDesc")}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-card shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("values.community")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("values.communityDesc")}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-card shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("values.memphis")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("values.memphisDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="join-cta">
        <div className="mx-auto max-w-3xl text-center">
          <SparkLogo variant="icon" size={48} className="mx-auto" />
          <h2 id="join-cta" className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Join the movement
          </h2>
          <p className="mt-4 text-muted-foreground">
            Whether you fund a tool, contribute code, or spread the word—there's a place for you in the Spark901
            community.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/fund">
                Fund a Tool
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
              <a href="https://github.com/spark901" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" aria-hidden="true" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

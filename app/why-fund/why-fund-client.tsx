"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, AlertTriangle, Lightbulb, TrendingUp, DollarSign, Users, Repeat } from "lucide-react"

export function WhyFundClient() {
  const t = useTranslations("whyFund")

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Your funding creates permanent infrastructure that keeps giving back—to hundreds of organizations, for years
            to come.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="problem-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t("problem.title")}
              </div>
              <h2
                id="problem-title"
                className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Nonprofits deserve better technology
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                {t("problem.description")}
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  <span className="text-muted-foreground">Expensive SaaS tools that drain limited budgets</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  <span className="text-muted-foreground">
                    Clunky interfaces designed for corporations, not missions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  <span className="text-muted-foreground">Data silos that make reporting a nightmare</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  <span className="text-muted-foreground">Vendor lock-in with no exit strategy</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img
                src="/frustrated-nonprofit-worker-at-computer-with-old-s.jpg"
                alt="Nonprofit worker struggling with outdated technology"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="solution-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <img
                src="/modern-nonprofit-technology-dashboard-clean-design.jpg"
                alt="Modern nonprofit technology dashboard"
                className="rounded-xl shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                {t("solution.title")}
              </div>
              <h2
                id="solution-title"
                className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Open-source tools built for impact
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                {t("solution.description")}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card className="border-primary/20 bg-card">
                  <CardContent className="flex items-start gap-3 p-4">
                    <DollarSign className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Free Forever</p>
                      <p className="text-sm text-muted-foreground">No subscriptions, no hidden costs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-card">
                  <CardContent className="flex items-start gap-3 p-4">
                    <Users className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Community Owned</p>
                      <p className="text-sm text-muted-foreground">Built by and for the sector</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compounding Impact */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="compounding-title">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-foreground">
              <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
              {t("compounding.title")}
            </div>
            <h2
              id="compounding-title"
              className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Your dollar keeps working
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {t("compounding.description")}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="relative overflow-hidden border-none bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <DollarSign className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Traditional Donation</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  A $1,000 donation helps one organization for one program cycle. Impact ends when funds run out.
                </p>
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium text-muted-foreground">Impact: Limited & Finite</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Repeat className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Tech Funding</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  A $1,000 investment in open-source tech serves hundreds of organizations indefinitely. The tool keeps
                  giving.
                </p>
                <div className="mt-4 rounded-lg bg-primary/10 p-3">
                  <p className="text-sm font-medium text-primary">Impact: Scalable & Permanent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-accent bg-accent/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <TrendingUp className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">The Spark901 Effect</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Every tool we build multiplies your impact. Fund once, help thousands—forever.
                </p>
                <div className="mt-4 rounded-lg bg-accent/20 p-3">
                  <p className="text-sm font-medium text-foreground">Impact: Exponential & Lasting</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            Ready to make a lasting impact?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Browse our projects and find the one that resonates with your values.
          </p>
          <Button asChild size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/fund">
              Fund a Tool
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

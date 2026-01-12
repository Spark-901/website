"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  Shield,
  Github,
  FileText,
  AlertCircle,
  Code2,
  Server,
  Users,
  Building2,
  ExternalLink,
} from "lucide-react"

export function TransparencyClient() {
  const t = useTranslations("transparency")

  const fundAllocation = [
    { label: t("development"), percentage: 60, icon: Code2 },
    { label: t("infrastructure"), percentage: 20, icon: Server },
    { label: t("community"), percentage: 12, icon: Users },
    { label: t("operations"), percentage: 8, icon: Building2 },
  ]

  const recentUpdates = [
    {
      date: "January 2026",
      title: "Volunteer Scheduler v2.0 Released",
      description: "Major update with calendar sync and mobile app support.",
    },
    {
      date: "December 2025",
      title: "Grant Tracker Pro Fully Funded",
      description: "Thanks to 47 sponsors, we reached our $25,000 goal.",
    },
    {
      date: "November 2025",
      title: "Impact Dashboard Beta Launch",
      description: "12 organizations now testing the new analytics platform.",
    },
    {
      date: "October 2025",
      title: "Community Hub Development Started",
      description: "Hired additional developer to accelerate timeline.",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Open & Accountable
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            We believe in radical transparency. See exactly how your funding makes an impact.
          </p>
        </div>
      </section>

      {/* Fund Allocation */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="allocation-title">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 id="allocation-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("howFundsUsed")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("fundsDescription")}</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Visual Breakdown */}
            <Card className="border-none bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Fund Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {fundAllocation.map((item, index) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="font-medium text-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.percentage}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            index === 0
                              ? "bg-primary"
                              : index === 1
                                ? "bg-accent"
                                : index === 2
                                  ? "bg-chart-3"
                                  : "bg-chart-4"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Breakdown Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              {fundAllocation.map((item, index) => (
                <Card key={item.label} className="border-none bg-card shadow-sm">
                  <CardContent className="p-5">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                        index === 0
                          ? "bg-primary/10"
                          : index === 1
                            ? "bg-accent/10"
                            : index === 2
                              ? "bg-chart-3/10"
                              : "bg-chart-4/10"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          index === 0
                            ? "text-primary"
                            : index === 1
                              ? "text-accent"
                              : index === 2
                                ? "text-chart-3"
                                : "text-chart-4"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground">{item.label}</h3>
                    <p
                      className={`text-2xl font-bold ${
                        index === 0
                          ? "text-primary"
                          : index === 1
                            ? "text-accent"
                            : index === 2
                              ? "text-chart-3"
                              : "text-chart-4"
                      }`}
                    >
                      {item.percentage}%
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.label === t("development") && "Engineer salaries, code review, testing"}
                      {item.label === t("infrastructure") && "Hosting, domains, security tools"}
                      {item.label === t("community") && "Events, documentation, support"}
                      {item.label === t("operations") && "Legal, accounting, admin"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Commitment */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="opensource-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Github className="h-4 w-4" aria-hidden="true" />
                Open Source
              </div>
              <h2
                id="opensource-title"
                className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Every line of code is public
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t("openSourceNote")}</p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <Code2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">All repositories are MIT licensed</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">Detailed documentation and contribution guides</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">Open issue tracking and roadmap planning</span>
                </li>
              </ul>
              <Button asChild className="mt-8 gap-2 bg-transparent" variant="outline">
                <a href="https://github.com/spark901" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" aria-hidden="true" />
                  View Our GitHub
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </Button>
            </div>
            <Card className="border-none bg-foreground text-background shadow-lg">
              <CardContent className="p-6">
                <pre className="overflow-x-auto text-sm">
                  <code>{`// Spark901 - Open Source for Good
// MIT License - Free Forever

export function buildForGood() {
  const tools = createOpenSource();
  const impact = tools.serve(nonprofits);
  
  return {
    code: "public",
    impact: "compounding",
    community: "empowered"
  };
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Updates */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="updates-title">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 id="updates-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Recent Updates
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Stay informed about our progress and how your funding is being put to work.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {recentUpdates.map((update, index) => (
              <Card key={index} className="border-none bg-card shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="shrink-0 rounded-lg bg-primary/10 px-4 py-2 text-center sm:w-32">
                    <p className="text-sm font-medium text-primary">{update.date}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{update.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{update.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex gap-4 p-6">
              <AlertCircle className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-foreground">Important Notice</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("legalNote")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Spark901 is registered as an LLC in the state of Tennessee. EIN available upon request.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="contact-cta">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="contact-cta" className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Questions about how we operate?
          </h2>
          <p className="mt-4 text-muted-foreground">
            We're happy to share more details about our finances, processes, or anything else.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/fund">
                Fund a Tool
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="mailto:hello@spark901.org">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

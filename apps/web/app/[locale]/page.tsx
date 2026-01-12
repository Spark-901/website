"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Code, Users, TrendingUp, Zap, Building2, Heart, Layers, Shield, CheckCircle2 } from "lucide-react"
import { brand } from "@/lib/brand"

export default function HomePage() {
  const t = useTranslations("home")

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Executive Director",
      org: "Memphis Food Bank",
      quote: "Spark901's volunteer scheduler saved us 20 hours a week. That's time we now spend feeding families.",
      avatar: "/professional-woman-headshot.png",
    },
    {
      name: "Marcus Thompson",
      role: "Program Manager",
      org: "Youth Empowerment Memphis",
      quote: "Finally, technology built for organizations like ours. No expensive consultants, no hidden fees.",
      avatar: "/professional-black-man-headshot.png",
    },
    {
      name: "Dr. Linda Chen",
      role: "Board Chair",
      org: "Community Health Initiative",
      quote: "One donation to Spark901 helps more nonprofits than any grant I've ever made.",
      avatar: "/professional-asian-woman-headshot.jpg",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 gap-2 bg-primary/10 text-primary hover:bg-primary/10">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {t("hero.tagline")}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("hero.headline")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("hero.description")}
          </p>
          <p className="mt-4 text-sm font-medium text-primary">
            {t("hero.socialProof", { count: brand.stats.communityMembers })}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
              <Link href="/fund">
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link href="/why-fund">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              100% to development
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Open source forever
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card px-4 py-12 sm:px-6 lg:px-8" aria-label="Impact statistics">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{brand.stats.nonprofitsHelped}+</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("stats.nonprofitsHelped")}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{brand.stats.openSourceTools}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("stats.openSourceTools")}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{brand.stats.communityMembers}+</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("stats.communityMembers")}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-accent">${(brand.stats.fundingRaised / 1000).toFixed(0)}K</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("stats.fundingRaised")}</p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="impact-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2
                id="impact-title"
                className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              >
                {t("impact.title")}
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                {t("impact.description")}
              </p>
              <Button asChild className="mt-8 gap-2">
                <Link href="/fund">
                  {t("impact.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Building2 className="h-10 w-10 text-primary" aria-hidden="true" />
                  <p className="mt-4 text-3xl font-bold text-foreground">{brand.stats.openSourceTools}</p>
                  <p className="text-sm text-muted-foreground">Tools Built</p>
                </CardContent>
              </Card>
              <Card className="border-accent/20 bg-accent/10">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Heart className="h-10 w-10 text-accent" aria-hidden="true" />
                  <p className="mt-4 text-3xl font-bold text-foreground">{brand.stats.organizationsServed}+</p>
                  <p className="text-sm text-muted-foreground">Organizations Served</p>
                </CardContent>
              </Card>
              <Card className="border-accent/20 bg-accent/10 sm:col-span-2">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <TrendingUp className="h-10 w-10 text-accent" aria-hidden="true" />
                  <p className="mt-4 text-3xl font-bold text-foreground">
                    {(brand.stats.hoursSavedAnnually / 1000).toFixed(0)}K+
                  </p>
                  <p className="text-sm text-muted-foreground">Hours Saved Annually</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="how-it-works-title">
        <div className="mx-auto max-w-7xl">
          <h2
            id="how-it-works-title"
            className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("howItWorks.title")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="relative border-none bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                  1
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("howItWorks.step1.title")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("howItWorks.step1.description")}</p>
                <Layers className="absolute bottom-6 right-6 h-8 w-8 text-muted-foreground/20" aria-hidden="true" />
              </CardContent>
            </Card>
            <Card className="relative border-none bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                  2
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("howItWorks.step2.title")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("howItWorks.step2.description")}</p>
                <Code className="absolute bottom-6 right-6 h-8 w-8 text-muted-foreground/20" aria-hidden="true" />
              </CardContent>
            </Card>
            <Card className="relative border-none bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                  3
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{t("howItWorks.step3.title")}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{t("howItWorks.step3.description")}</p>
                <Users className="absolute bottom-6 right-6 h-8 w-8 text-muted-foreground/20" aria-hidden="true" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="testimonials-title">
        <div className="mx-auto max-w-7xl">
          <h2
            id="testimonials-title"
            className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("testimonials.title")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-none bg-card shadow-sm">
                <CardContent className="p-6">
                  <p className="text-pretty leading-relaxed text-muted-foreground">"{testimonial.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.org}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="cta-title">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="cta-title"
            className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl"
          >
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            {t("cta.subtitle", { count: brand.stats.communityMembers })}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
          >
            <Link href="/fund">
              {t("cta.button")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/70">{t("cta.guarantee")}</p>
        </div>
      </section>
    </div>
  )
}

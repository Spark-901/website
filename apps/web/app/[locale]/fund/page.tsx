import type { Metadata } from "next"
import { FundAToolClient } from "./fund-client"
import { locales } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"
import { getAllProjects } from "@/lib/projects"
import { enrichProjectsWithStripeStats } from "@/lib/stripe-stats"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const isEs = locale === "es"

  return createPageMetadata({
    locale,
    path: "/fund",
    title: isEs ? "Financia una herramienta" : "Fund a Tool",
    description: isEs
      ? "Explora nuestro catálogo de proyectos tecnológicos patrocinables. Cada herramienta está diseñada para ayudar a las ONGs a hacer más con menos."
      : "Explore our catalog of fundable open-source tools. Every project is designed to help nonprofits do more with less.",
  })
}

export default async function FundPage() {
  const projects = await enrichProjectsWithStripeStats(getAllProjects())
  return <FundAToolClient projects={projects} />
}

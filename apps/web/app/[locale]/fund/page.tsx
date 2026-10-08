import type { Metadata } from "next"
import { FundAToolClient } from "./fund-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"
import { getAllProjects } from "@/lib/projects"
import { enrichProjectsWithStripeStats } from "@/lib/stripe-stats"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Fund a Tool",
    description:
      "Explore our catalog of fundable open-source tools. Every project is designed to help nonprofits do more with less.",
  },
  es: {
    title: "Financia una herramienta",
    description:
      "Explora nuestro catálogo de proyectos tecnológicos patrocinables. Cada herramienta está diseñada para ayudar a las ONGs a hacer más con menos.",
  },
  ja: {
    title: "ツールを支援する",
    description:
      "支援可能なオープンソースツールのカタログをご覧ください。各プロジェクトは非営利団体が少ないリソースでより多くを実現できるように設計されています。",
  },
  zh: {
    title: "资助一个工具",
    description: "浏览我们可资助的开源工具目录。每个项目都旨在帮助非营利组织以更少的资源做更多的事。",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/fund",
    title: s.title,
    description: s.description,
  })
}

export default async function FundPage() {
  const projects = await enrichProjectsWithStripeStats(getAllProjects())
  return <FundAToolClient projects={projects} />
}

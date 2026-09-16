import type { Metadata } from "next"
import { WhyFundClient } from "./why-fund-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Why Fund Open-Source Tech?",
    description:
      "One contribution builds infrastructure that serves many organizations—compounding impact, not a one-time check.",
  },
  es: {
    title: "¿Por qué financiar tecnología de código abierto?",
    description:
      "Una contribución construye infraestructura que sirve a muchas organizaciones—impacto compuesto, no un solo cheque.",
  },
  ja: {
    title: "なぜオープンソース技術を支援するのか？",
    description: "一度の支援が、多くの団体に役立つ基盤を築きます—複利的なインパクトであり、一度きりの小切手ではありません。",
  },
  zh: {
    title: "为什么要资助开源技术？",
    description: "一次捐款就能构建为众多组织服务的基础设施——这是复利式的影响力,而非一次性的支票。",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/why-fund",
    title: s.title,
    description: s.description,
  })
}

export default function WhyFundPage() {
  return <WhyFundClient />
}

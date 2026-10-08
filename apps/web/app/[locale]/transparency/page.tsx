import type { Metadata } from "next"
import { TransparencyClient } from "./transparency-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Transparency",
    description:
      "We believe in radical transparency. See exactly how your funding is allocated and how Spark901 operates.",
  },
  es: {
    title: "Transparencia",
    description:
      "Creemos en la transparencia radical. Mira cómo se asignan los fondos y cómo opera Spark901.",
  },
  ja: {
    title: "透明性",
    description: "私たちは徹底した透明性を大切にしています。資金の配分方法とSpark901の運営方法を正確にご覧いただけます。",
  },
  zh: {
    title: "透明度",
    description: "我们坚信彻底的透明度。您可以精确了解资金的分配方式以及Spark901的运营方式。",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/transparency",
    title: s.title,
    description: s.description,
  })
}

export default function TransparencyPage() {
  return <TransparencyClient />
}

import type { Metadata } from "next"
import { WhyFundClient } from "./why-fund-client"
import { locales } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"

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
    path: "/why-fund",
    title: isEs ? "¿Por qué financiar tecnología de código abierto?" : "Why Fund Open-Source Tech?",
    description: isEs
      ? "Una contribución construye infraestructura que sirve a muchas organizaciones—impacto compuesto, no un solo cheque."
      : "One contribution builds infrastructure that serves many organizations—compounding impact, not a one-time check.",
  })
}

export default function WhyFundPage() {
  return <WhyFundClient />
}

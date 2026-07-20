import type { Metadata } from "next"
import { TransparencyClient } from "./transparency-client"
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
    path: "/transparency",
    title: isEs ? "Transparencia" : "Transparency",
    description: isEs
      ? "Creemos en la transparencia radical. Mira cómo se asignan los fondos y cómo opera Spark901."
      : "We believe in radical transparency. See exactly how your funding is allocated and how Spark901 operates.",
  })
}

export default function TransparencyPage() {
  return <TransparencyClient />
}

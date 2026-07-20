import type { Metadata } from "next"
import { AboutClient } from "./about-client"
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
    path: "/about",
    title: isEs ? "Nosotros" : "About",
    description: isEs
      ? "Spark901 es un estudio con raíces en Memphis. Las contribuciones financian herramientas de código abierto para organizaciones sin fines de lucro—no somos un 501(c)(3), pero sí infraestructura pública seria."
      : "Spark901 is a Memphis-rooted, for-good studio. Contributions fund quality open-source tools for nonprofits and mission-driven organizations—we're not a 501(c)(3), but we're serious about public infrastructure.",
    ogTitle: isEs ? "Sobre Spark901" : "About Spark901",
  })
}

export default function AboutPage() {
  return <AboutClient />
}

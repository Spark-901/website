import type { Metadata } from "next"
import { VolunteerClient } from "./volunteer-client"
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
    path: "/volunteer",
    title: isEs ? "Voluntariado con Spark901" : "Volunteer with Spark901",
    description: isEs
      ? "Únete como ingeniero, diseñador, escritor o mentor. Contribuciones de código abierto que ayudan a las ONGs de Memphis y a la comunidad con misión."
      : "Join Spark901 as a volunteer engineer, designer, writer, or mentor. Open-source contributions that help Memphis nonprofits and the wider mission-driven community.",
  })
}

export default function VolunteerPage() {
  return <VolunteerClient />
}

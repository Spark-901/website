import type { Metadata } from "next"
import { VolunteerClient } from "./volunteer-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Volunteer with Spark901",
    description:
      "Join Spark901 as a volunteer engineer, designer, writer, or mentor. Open-source contributions that help Memphis nonprofits and the wider mission-driven community.",
  },
  es: {
    title: "Voluntariado con Spark901",
    description:
      "Únete como ingeniero, diseñador, escritor o mentor. Contribuciones de código abierto que ayudan a las ONGs de Memphis y a la comunidad con misión.",
  },
  ja: {
    title: "Spark901でボランティアをする",
    description:
      "エンジニア、デザイナー、ライター、メンターとしてSpark901に参加しませんか。メンフィスの非営利団体と使命ある広いコミュニティを支えるオープンソースへの貢献です。",
  },
  zh: {
    title: "在Spark901做志愿者",
    description: "作为志愿工程师、设计师、作家或导师加入Spark901。您的开源贡献将帮助孟菲斯的非营利组织和更广泛的使命驱动型社区。",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/volunteer",
    title: s.title,
    description: s.description,
  })
}

export default function VolunteerPage() {
  return <VolunteerClient />
}

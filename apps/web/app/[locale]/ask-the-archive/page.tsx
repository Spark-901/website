import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AskTheArchiveClient } from "./ask-the-archive-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"
import { isFeatureEnabled } from "@/lib/features"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string; ogTitle: string }> = {
  en: {
    title: "Ask the Archive — Collierville Civic Archive",
    description:
      "Ask a free-text question about what Collierville, TN's Board of Mayor and Aldermen has discussed, and get a cited answer grounded in real meeting transcripts.",
    ogTitle: "Ask the Archive — Spark901",
  },
  es: {
    title: "Pregunta al Archivo — Archivo Cívico de Collierville",
    description:
      "Haz una pregunta en texto libre sobre lo que la Junta de Alcalde y Concejales de Collierville, TN ha discutido, y obtén una respuesta citada basada en transcripciones reales de las reuniones.",
    ogTitle: "Pregunta al Archivo — Spark901",
  },
  ja: {
    title: "アーカイブに質問する — コリアービル市民アーカイブ",
    description:
      "テネシー州コリアービル町議会・市長理事会がこれまでに議論した内容について自由formで質問すると、実際の会議記録に基づいた引用付きの回答が得られます。",
    ogTitle: "アーカイブに質問する — Spark901",
  },
  zh: {
    title: "向档案提问 — 科利尔维尔市民档案",
    description:
      "就田纳西州科利尔维尔镇市长及镇务委员会讨论过的内容自由提问，获得基于真实会议记录并附带引用的回答。",
    ogTitle: "向档案提问 — Spark901",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/ask-the-archive",
    title: s.title,
    description: s.description,
    ogTitle: s.ogTitle,
  })
}

export default function AskTheArchivePage() {
  if (!isFeatureEnabled("ASK_THE_ARCHIVE")) {
    notFound()
  }

  return <AskTheArchiveClient />
}

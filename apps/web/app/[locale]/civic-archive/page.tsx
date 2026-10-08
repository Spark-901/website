import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CivicArchiveClient } from "./civic-archive-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"
import { isFeatureEnabled } from "@/lib/features"
import { civicArchivePdfHref, loadCivicArchiveMeetings } from "@/lib/civic-archive"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string; ogTitle: string }> = {
  en: {
    title: "Collierville Civic Archive",
    description:
      "Plain-language summaries and downloadable PDFs of every Collierville, TN Board of Mayor and Aldermen meeting — government transparency without watching hours of video.",
    ogTitle: "Collierville Civic Archive — Spark901",
  },
  es: {
    title: "Archivo Cívico de Collierville",
    description:
      "Resúmenes en lenguaje sencillo y PDFs descargables de cada reunión de la Junta de Alcalde y Concejales de Collierville, TN — transparencia gubernamental sin ver horas de video.",
    ogTitle: "Archivo Cívico de Collierville — Spark901",
  },
  ja: {
    title: "コリアービル市民アーカイブ",
    description:
      "テネシー州コリアービル町議会・市長理事会のすべての会議の平易な要約とダウンロード可能なPDF。何時間もの動画を見ずに行政の透明性を確保します。",
    ogTitle: "コリアービル市民アーカイブ — Spark901",
  },
  zh: {
    title: "科利尔维尔市民档案",
    description:
      "田纳西州科利尔维尔镇市长及镇务委员会每次会议的通俗易懂摘要和可下载PDF——无需观看数小时视频即可了解政府透明信息。",
    ogTitle: "科利尔维尔市民档案 — Spark901",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/civic-archive",
    title: s.title,
    description: s.description,
    ogTitle: s.ogTitle,
  })
}

export default function CivicArchivePage() {
  if (!isFeatureEnabled("CIVIC_ARCHIVE")) {
    notFound()
  }

  const { meetings, errors } = loadCivicArchiveMeetings("collierville")
  if (errors.length > 0) {
    // Never silently drop a malformed file — surface it in server logs so a
    // bad summary is caught before a resident notices a meeting is missing.
    console.error(
      `[civic-archive] ${errors.length} meeting summary file(s) failed schema validation:`,
      errors,
    )
  }

  const meetingsWithPdf = meetings.map((meeting) => ({
    summary: meeting,
    pdfHref: civicArchivePdfHref("collierville", meeting.meetingId),
  }))

  return <CivicArchiveClient meetings={meetingsWithPdf} />
}

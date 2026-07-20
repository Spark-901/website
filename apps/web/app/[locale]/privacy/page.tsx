import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { LegalPageLayout } from "@/components/legal-page-layout"
import { locales } from "@/i18n/config"
import { isLocale } from "@/lib/seo"
import { legalPageMetadata } from "@/lib/legal-seo"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return legalPageMetadata(locale, "privacy")
}

export default async function Page({ params }: Props) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  setRequestLocale(locale)
  const t = await getTranslations("legal.privacy")

  return (
    <LegalPageLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <div dangerouslySetInnerHTML={{ __html: t.raw("content") }} />
    </LegalPageLayout>
  )
}

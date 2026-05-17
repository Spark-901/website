import { useTranslations } from "next-intl"
import { LegalPageLayout } from "@/components/legal-page-layout"

export default function Page() {
  const t = useTranslations("legal.digitalAcceptance")

  return (
    <LegalPageLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <div dangerouslySetInnerHTML={{ __html: t.raw("content") }} />
    </LegalPageLayout>
  )
}

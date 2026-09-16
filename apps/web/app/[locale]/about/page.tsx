import type { Metadata } from "next"
import { AboutClient } from "./about-client"
import { locales, type Locale } from "@/i18n/config"
import { createPageMetadata, isLocale } from "@/lib/seo"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Props = { params: Promise<{ locale: string }> }

const SEO_STRINGS: Record<Locale, { title: string; description: string; ogTitle: string }> = {
  en: {
    title: "About",
    description:
      "Spark901 is a Memphis-rooted, for-good studio. Contributions fund quality open-source tools for nonprofits and mission-driven organizations—we're not a 501(c)(3), but we're serious about public infrastructure.",
    ogTitle: "About Spark901",
  },
  es: {
    title: "Nosotros",
    description:
      "Spark901 es un estudio con raíces en Memphis. Las contribuciones financian herramientas de código abierto para organizaciones sin fines de lucro—no somos un 501(c)(3), pero sí infraestructura pública seria.",
    ogTitle: "Sobre Spark901",
  },
  ja: {
    title: "私たちについて",
    description:
      "Spark901はメンフィスに根ざした、社会貢献のためのスタジオです。ご支援は非営利団体をはじめとする使命ある団体のための質の高いオープンソースツールの開発に使われます—501(c)(3)ではありませんが、公共インフラの構築には真剣に取り組んでいます。",
    ogTitle: "Spark901について",
  },
  zh: {
    title: "关于我们",
    description:
      "Spark901是一家扎根孟菲斯、以行善为使命的工作室。捐款用于为非营利组织和使命驱动型组织资助高质量的开源工具——我们不是501(c)(3)非营利组织,但我们认真对待公共基础设施建设。",
    ogTitle: "关于Spark901",
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const s = SEO_STRINGS[locale]

  return createPageMetadata({
    locale,
    path: "/about",
    title: s.title,
    description: s.description,
    ogTitle: s.ogTitle,
  })
}

export default function AboutPage() {
  return <AboutClient />
}

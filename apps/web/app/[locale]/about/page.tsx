import type { Metadata } from "next"
import { AboutClient } from "./about-client"
import { locales } from "@/i18n/config"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: "About",
  description:
    "Spark901 is a Memphis-rooted, for-good studio. Contributions fund quality open-source tools for nonprofits and mission-driven organizations—we're not a 501(c)(3), but we're serious about public infrastructure.",
  openGraph: {
    title: "About Spark901",
    description:
      "Memphis-built open-source software and transparency for organizations doing good—with support from people who want tech that lasts.",
  },
}

export default function AboutPage() {
  return <AboutClient />
}

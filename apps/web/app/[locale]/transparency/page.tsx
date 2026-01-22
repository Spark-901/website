import type { Metadata } from "next"
import { TransparencyClient } from "./transparency-client"
import { locales } from "@/i18n/config"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: "Transparency",
  description:
    "We believe in radical transparency. See exactly how your funding is allocated and how Spark901 operates.",
  openGraph: {
    title: "Transparency | Spark901",
    description: "See exactly how your funding makes an impact. Every dollar is tracked and reported.",
  },
}

export default function TransparencyPage() {
  return <TransparencyClient />
}

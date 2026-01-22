import type { Metadata } from "next"
import { FundAToolClient } from "./fund-client"
import { locales } from "@/i18n/config"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: "Fund a Tool",
  description:
    "Browse our catalog of sponsorable open-source tech projects. Each tool is designed to help nonprofits do more with less.",
  openGraph: {
    title: "Fund a Tool | Spark901",
    description: "Browse and sponsor open-source tools that help nonprofits scale their impact.",
  },
}

export default function FundAToolPage() {
  return <FundAToolClient />
}

import type { Metadata } from "next"
import { VolunteerClient } from "./volunteer-client"
import { locales } from "@/i18n/config"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Join Spark901 as a volunteer engineer, designer, writer, or mentor. Open-source contributions that help Memphis nonprofits and the wider mission-driven community.",
  openGraph: {
    title: "Volunteer with Spark901",
    description:
      "Lend your skills to open-source tools that nonprofits and mission-driven organizations actually use.",
  },
}

export default function VolunteerPage() {
  return <VolunteerClient />
}

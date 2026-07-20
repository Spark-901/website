import type { Metadata } from "next"
import { createPageMetadata, isLocale } from "@/lib/seo"

export const LEGAL_ROUTES = {
  privacy: { path: "/privacy", messageKey: "privacy" },
  terms: { path: "/terms", messageKey: "terms" },
  "cookie-policy": { path: "/cookie-policy", messageKey: "cookiePolicy" },
  "california-privacy": { path: "/california-privacy", messageKey: "californiaPrivacy" },
  "digital-acceptance": { path: "/digital-acceptance", messageKey: "digitalAcceptance" },
  "fair-use": { path: "/fair-use", messageKey: "fairUse" },
  dpa: { path: "/dpa", messageKey: "dpa" },
  "ai-disclosure": { path: "/ai-disclosure", messageKey: "aiDisclosure" },
} as const

export type LegalSlug = keyof typeof LEGAL_ROUTES

export async function legalPageMetadata(
  localeRaw: string,
  slug: LegalSlug,
): Promise<Metadata> {
  const locale = isLocale(localeRaw) ? localeRaw : "en"
  const route = LEGAL_ROUTES[slug]
  const messages = (await import(`../messages/${locale}.json`)).default
  const legal = messages.legal[route.messageKey] as { title: string; content: string }
  // Strip HTML for meta description
  const plain = legal.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const description = plain.slice(0, 155) + (plain.length > 155 ? "…" : "")

  return createPageMetadata({
    locale,
    path: route.path,
    title: legal.title,
    description,
  })
}

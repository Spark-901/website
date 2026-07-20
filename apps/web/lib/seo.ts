import type { Metadata } from "next"
import { brand } from "@/lib/brand"
import { defaultLocale, locales, type Locale } from "@/i18n/config"
import type { Project } from "@/lib/projects"

/** Canonical public origin — override with NEXT_PUBLIC_SITE_URL in non-prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://spark901.com"
).replace(/\/$/, "")

export const SITE_NAME = brand.name

const DEFAULT_OG_ALT = `${brand.name} — ${brand.tagline}`

/** Indexable marketing + legal routes (no locale prefix). */
export const SEO_ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/fund", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/fund/general", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/why-fund", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/volunteer", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/transparency", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/california-privacy", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/digital-acceptance", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/fair-use", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/dpa", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/ai-disclosure", changeFrequency: "yearly" as const, priority: 0.2 },
] as const

export function absoluteUrl(path = ""): string {
  if (!path || path === "/") return SITE_URL
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Locale-aware public path. Default locale has no prefix (`as-needed`). */
export function localizedPath(locale: string, path = ""): string {
  const normalized = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  if (locale === defaultLocale) return normalized || "/"
  return `/${locale}${normalized}`
}

export function absoluteLocalizedUrl(locale: string, path = ""): string {
  const localized = localizedPath(locale, path)
  return absoluteUrl(localized === "/" ? "" : localized)
}

export function languageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": absoluteLocalizedUrl(defaultLocale, path),
  }
  for (const locale of locales) {
    languages[locale] = absoluteLocalizedUrl(locale, path)
  }
  return languages
}

type OgImageInput = {
  url?: string
  width?: number
  height?: number
  alt?: string
}

type ResolvedOgImage = {
  url: string
  width: number
  height: number
  alt: string
}

function resolveOgImages(image?: OgImageInput | OgImageInput[]): ResolvedOgImage[] {
  const fallback: OgImageInput = {
    url: brand.logo.og,
    width: 1200,
    height: 630,
    alt: DEFAULT_OG_ALT,
  }
  const list = !image ? [fallback] : Array.isArray(image) ? image : [image]
  return list.map((item) => ({
    url: absoluteUrl(item.url || brand.logo.og),
    width: item.width ?? 1200,
    height: item.height ?? 630,
    alt: item.alt ?? DEFAULT_OG_ALT,
  }))
}

export type PageMetadataInput = {
  locale: string
  path: string
  title: string
  description: string
  /** When true, title is used as the full document title (no "| Spark901" template). */
  absoluteTitle?: boolean
  ogTitle?: string
  ogDescription?: string
  image?: OgImageInput | OgImageInput[]
  type?: "website" | "article"
  noIndex?: boolean
  keywords?: string[]
}

export function createPageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  ogTitle,
  ogDescription,
  image,
  type = "website",
  noIndex = false,
  keywords,
}: PageMetadataInput): Metadata {
  const url = absoluteLocalizedUrl(locale, path)
  const images = resolveOgImages(image)
  const ogLocale = locale === "es" ? "es_US" : "en_US"
  const alternateLocale = locale === "es" ? "en_US" : "es_US"

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      type,
      locale: ogLocale,
      alternateLocale: [alternateLocale],
      url,
      siteName: SITE_NAME,
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      images: images.map((img) => img.url),
      creator: "@spark901",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: brand.name,
    legalName: `${brand.name} ${brand.legalEntity}`,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(brand.logo.lockup),
      contentUrl: absoluteUrl(brand.logo.lockup),
      width: 1200,
      height: 400,
      caption: `${brand.name} logo`,
    },
    image: absoluteUrl(brand.logo.og),
    description:
      "Open-source software infrastructure that helps nonprofits and community organizations scale their impact.",
    email: brand.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Memphis",
      addressRegion: "TN",
      addressCountry: "US",
    },
    sameAs: [brand.github, brand.twitter, brand.linkedin],
    foundingLocation: {
      "@type": "Place",
      name: brand.location,
    },
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: brand.name,
    url: SITE_URL,
    description: brand.tagline,
    inLanguage: ["en", "es"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  }
}

export function softwareApplicationJsonLd(project: Project, locale: string = defaultLocale) {
  const url = absoluteLocalizedUrl(locale, `/fund/${project.slug}`)
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    description: project.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url,
    image: absoluteUrl(brand.logo.og),
    offers: {
      "@type": "Offer",
      url,
      price: String(project.fundingTiers[0]?.amount ?? 0),
      priceCurrency: "USD",
      availability:
        project.status === "funded"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      category: "Donation",
    },
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(project.githubUrl
      ? {
          codeRepository: project.githubUrl,
          isAccessibleForFree: true,
        }
      : {}),
  }
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  locale: string = defaultLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteLocalizedUrl(locale, item.path),
    })),
  }
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

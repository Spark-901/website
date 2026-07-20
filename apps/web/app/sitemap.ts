import type { MetadataRoute } from "next"
import { GENERAL_FUND_SLUG, projects } from "@/lib/projects"
import { locales } from "@/i18n/config"
import {
  SEO_ROUTES,
  absoluteLocalizedUrl,
} from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of SEO_ROUTES) {
      entries.push({
        url: absoluteLocalizedUrl(locale, route.path || "/"),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    }

    for (const project of projects) {
      // Covered by SEO_ROUTES `/fund/general`
      if (project.slug === GENERAL_FUND_SLUG) continue
      entries.push({
        url: absoluteLocalizedUrl(locale, `/fund/${project.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  }

  return entries
}

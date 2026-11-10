import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/json-ld"
import { locales } from "@/i18n/config"
import { getToolPage, getToolPageProject, toolPages } from "@/lib/tool-pages"
import {
  breadcrumbJsonLd,
  createPageMetadata,
  isLocale,
  softwareApplicationJsonLd,
} from "@/lib/seo"

export function generateStaticParams() {
  return locales.flatMap((locale) => toolPages.map((t) => ({ locale, slug: t.slug })))
}

interface ToolPageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug, locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const page = getToolPage(slug)
  if (!page) return { title: "Not Found" }

  return createPageMetadata({
    locale,
    path: `/tools/${page.slug}`,
    title: page.seoTitle,
    description: page.seoDescription,
    keywords: page.keywords,
  })
}

export default async function ToolLandingPage({ params }: ToolPageProps) {
  const { slug, locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  setRequestLocale(locale)

  const page = getToolPage(slug)
  const project = getToolPageProject(slug)
  if (!page || !project) notFound()

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          softwareApplicationJsonLd(project, locale),
          faqJsonLd,
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: "Tools", path: "/fund" },
              { name: project.name, path: `/tools/${page.slug}` },
            ],
            locale,
          ),
        ]}
      />
      <p className="text-sm font-medium text-muted-foreground">{project.category}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{page.h1}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{page.intro}</p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">The problem</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          {page.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Planned features</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          In development. Features below are the roadmap, not a shipped feature list.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          {page.plannedFeatures.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">How it compares</h2>
        <dl className="mt-3 space-y-4">
          {page.versus.map((v) => (
            <div key={v.alternative}>
              <dt className="font-medium">Versus {v.alternative}</dt>
              <dd className="text-muted-foreground">{v.point}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-3 space-y-4">
          {page.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium">{f.q}</h3>
              <p className="text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/fund/${page.slug}`}>Back this tool</Link>
        </Button>
        {project.githubUrl ? (
          <Button asChild variant="outline">
            <a href={project.githubUrl} rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button>
        ) : null}
      </div>
    </main>
  )
}

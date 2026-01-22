import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Heart, Share2, ArrowRight, Users } from "lucide-react"
import { getProjectBySlug, projects } from "@/lib/projects"
import { notFound } from "next/navigation"
import { brand } from "@/lib/brand"
import { locales } from "@/i18n/config"

export function generateStaticParams() {
  const params = []
  for (const locale of locales) {
    for (const project of projects) {
      params.push({
        locale,
        slug: project.slug,
      })
    }
  }
  return params
}

interface ThankYouPageProps {
  params: Promise<{ slug: string }>
}

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>

            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">You're Incredible!</h1>

            <p className="mb-8 text-lg text-muted-foreground">
              Your contribution to <strong className="text-foreground">{project.name}</strong> is building technology
              that empowers Memphis communities and beyond. You're now part of the Spark901 movement.
            </p>

            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-5 w-5 fill-current" />
                <span className="font-semibold">You're part of the movement</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                A receipt has been sent to your email. You've joined {project.backers}+ other backers funding permanent
                technology infrastructure for social good.
              </p>
              {!brand.isTaxDeductible && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Note: Spark901 is an LLC. Contributions are not tax-deductible but fund permanent public
                  infrastructure.
                </p>
              )}
            </div>

            <div className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>You're backer #{project.backers + 1} for this project</span>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
                <Link href={`/fund/${slug}`}>
                  <Share2 className="h-4 w-4" />
                  Share This Project
                </Link>
              </Button>

              <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/fund">
                  Fund Another Tool
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Questions about your contribution?{" "}
              <a href={`mailto:${brand.email}`} className="text-primary underline underline-offset-2">
                Contact us
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

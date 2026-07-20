import { unstable_cache } from "next/cache"
import type { Project } from "@/lib/projects"
import { getStripeProductId, isStripeTestMode, type StripeFundableSlug } from "@/lib/stripe-catalog"
import { isStripeConfigured, requireStripe } from "@/lib/stripe"

export type ProjectFundingStats = {
  fundingRaised: number
  backers: number
  monthlyBackers: number
}

const EMPTY: ProjectFundingStats = {
  fundingRaised: 0,
  backers: 0,
  monthlyBackers: 0,
}

async function fetchProjectStatsUncached(projectSlug: string): Promise<ProjectFundingStats> {
  if (!isStripeConfigured()) return EMPTY

  const stripe = requireStripe()
  const productId = getStripeProductId(projectSlug)

  let fundingRaisedCents = 0
  const backerKeys = new Set<string>()
  let monthlyBackers = 0

  // Succeeded PaymentIntents carry project metadata for one-time + many renewals.
  let piCursor: string | undefined
  do {
    const page = await stripe.paymentIntents.search({
      query: `status:"succeeded" AND metadata["projectSlug"]:"${projectSlug}"`,
      limit: 100,
      page: piCursor,
    })
    for (const pi of page.data) {
      fundingRaisedCents += pi.amount_received || pi.amount || 0
      const key = (typeof pi.customer === "string" ? pi.customer : pi.customer?.id) || pi.id
      backerKeys.add(key)
    }
    piCursor = page.has_more ? page.next_page || undefined : undefined
  } while (piCursor)

  // Active monthly supporters
  let subCursor: string | undefined
  do {
    const page = await stripe.subscriptions.search({
      query: `status:"active" AND metadata["projectSlug"]:"${projectSlug}"`,
      limit: 100,
      page: subCursor,
    })
    monthlyBackers += page.data.length
    for (const sub of page.data) {
      const key = typeof sub.customer === "string" ? sub.customer : sub.customer.id
      backerKeys.add(key)
    }
    subCursor = page.has_more ? page.next_page || undefined : undefined
  } while (subCursor)

  // Fallback: Checkout sessions if PaymentIntent search is empty (e.g. older data)
  if (fundingRaisedCents === 0 && productId) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
    })
    for (const session of sessions.data) {
      if (session.metadata?.projectSlug !== projectSlug) continue
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        continue
      }
      fundingRaisedCents += session.amount_total || 0
      const key =
        (typeof session.customer === "string" ? session.customer : session.customer?.id) ||
        session.customer_email ||
        session.id
      backerKeys.add(key)
    }
  }

  return {
    fundingRaised: Math.round(fundingRaisedCents / 100),
    backers: backerKeys.size,
    monthlyBackers,
  }
}

export async function getProjectFundingStats(projectSlug: string): Promise<ProjectFundingStats> {
  const mode = isStripeTestMode() ? "test" : "live"
  const cached = unstable_cache(
    () => fetchProjectStatsUncached(projectSlug),
    [`stripe-project-stats-${mode}-${projectSlug}`],
    { revalidate: 60, tags: [`funding-${projectSlug}`] },
  )
  try {
    return await cached()
  } catch (error) {
    console.error(`Stripe stats failed for ${projectSlug}:`, error)
    return EMPTY
  }
}

export async function enrichProjectsWithStripeStats(projects: Project[]): Promise<Project[]> {
  return Promise.all(
    projects.map(async (project) => {
      const stats = await getProjectFundingStats(project.slug)
      return {
        ...project,
        fundingRaised: stats.fundingRaised,
        backers: stats.backers,
        monthlyBackers: stats.monthlyBackers,
      }
    }),
  )
}

export async function getTotalFundingRaised(slugs: StripeFundableSlug[]): Promise<number> {
  const stats = await Promise.all(slugs.map((slug) => getProjectFundingStats(slug)))
  return stats.reduce((sum, s) => sum + s.fundingRaised, 0)
}

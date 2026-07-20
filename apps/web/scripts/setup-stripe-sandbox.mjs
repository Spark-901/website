#!/usr/bin/env node
/**
 * Creates Spark901 fundraising Products in Stripe test/sandbox mode
 * and writes their IDs into lib/stripe-catalog.ts + prints .env.local lines.
 *
 * Usage (from apps/web):
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup-sandbox
 *
 * Or after `stripe login -p spark901`:
 *   npm run stripe:setup-sandbox -- --from-cli
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"
import Stripe from "stripe"

const __dirname = dirname(fileURLToPath(import.meta.url))
const webRoot = join(__dirname, "..")
const catalogPath = join(webRoot, "lib/stripe-catalog.ts")

function resolveSecretKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY
  if (process.argv.includes("--from-cli")) {
    const extractKey = (raw) => {
      const match = raw.match(/test_mode_api_key\s*=\s*'?(sk_[^'\s]+)'?/)
      const key = match?.[1] ?? null
      if (key?.startsWith("sk_live_")) return null
      return key
    }
    try {
      const key = extractKey(
        execSync("stripe config --project-name spark901 --list", { encoding: "utf8" }),
      )
      if (key) return key
    } catch {
      // fall through
    }
    try {
      const key = extractKey(execSync("stripe config --list", { encoding: "utf8" }))
      if (key) {
        console.warn(
          "Using default Stripe CLI profile test key. Prefer: stripe login -p spark901",
        )
        return key
      }
    } catch {
      // fall through
    }
  }
  return null
}

const secret = resolveSecretKey()
if (!secret) {
  console.error(`Missing test secret key.

Options:
  1) STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup-sandbox
  2) stripe login -p spark901   # authorize Spark901
     npm run stripe:setup-sandbox -- --from-cli
`)
  process.exit(1)
}
if (!secret.startsWith("sk_test_")) {
  console.error("Refusing to run: key is not a test key (expected sk_test_...).")
  process.exit(1)
}

const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" })

const catalog = [
  {
    slug: "volunteer-scheduler",
    name: "Fund: Volunteer Scheduler",
    description:
      "One-time or monthly contribution funding Spark901's open-source Volunteer Scheduler for nonprofits. Contributions are not tax-deductible.",
    url: "https://spark901.org/fund/volunteer-scheduler",
    statement_descriptor: "SPARK901 VOL",
    metadata: {
      project_slug: "volunteer-scheduler",
      project_id: "proj_001",
      contribution_type: "project_fund",
    },
  },
  {
    slug: "grant-tracker",
    name: "Fund: Grant Tracker Pro",
    description:
      "Contribution funding Spark901's open-source Grant Tracker Pro for nonprofits. Contributions are not tax-deductible.",
    url: "https://spark901.org/fund/grant-tracker",
    statement_descriptor: "SPARK901 GRANT",
    metadata: {
      project_slug: "grant-tracker",
      project_id: "proj_002",
      contribution_type: "project_fund",
    },
  },
  {
    slug: "impact-dashboard",
    name: "Fund: Impact Dashboard",
    description:
      "Contribution funding Spark901's open-source Impact Dashboard for nonprofits. Contributions are not tax-deductible.",
    url: "https://spark901.org/fund/impact-dashboard",
    statement_descriptor: "SPARK901 IMPACT",
    metadata: {
      project_slug: "impact-dashboard",
      project_id: "proj_003",
      contribution_type: "project_fund",
    },
  },
  {
    slug: "community-hub",
    name: "Fund: Community Hub",
    description:
      "Contribution funding Spark901's open-source Community Hub for nonprofits. Contributions are not tax-deductible.",
    url: "https://spark901.org/fund/community-hub",
    statement_descriptor: "SPARK901 HUB",
    metadata: {
      project_slug: "community-hub",
      project_id: "proj_004",
      contribution_type: "project_fund",
    },
  },
  {
    slug: "general",
    name: "Spark901 General Fund",
    description:
      "General contribution supporting Spark901 open-source tools for nonprofits. Not restricted to a single project. Contributions are not tax-deductible.",
    url: "https://spark901.org/fund",
    statement_descriptor: "SPARK901",
    metadata: {
      project_slug: "general",
      contribution_type: "general_fund",
    },
  },
]

async function findExistingBySlug(slug) {
  const existing = await stripe.products.search({
    query: `metadata["project_slug"]:"${slug}" AND active:"true"`,
    limit: 1,
  })
  return existing.data[0] ?? null
}

const created = []

for (const item of catalog) {
  let product = await findExistingBySlug(item.slug)
  if (product) {
    console.log(`↻ exists  ${item.slug} → ${product.id}`)
  } else {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      url: item.url,
      statement_descriptor: item.statement_descriptor,
      metadata: item.metadata,
      shippable: false,
    })
    console.log(`✓ created ${item.slug} → ${product.id} (livemode=${product.livemode})`)
  }
  if (product.livemode) {
    console.error(`ERROR: ${item.slug} was created in LIVE mode. Aborting.`)
    process.exit(1)
  }
  created.push({ slug: item.slug, id: product.id })
}

const bySlug = Object.fromEntries(created.map((c) => [c.slug, c.id]))
const catalogSource = readFileSync(catalogPath, "utf8")
const nextMap = `const TEST_PRODUCTS: Record<keyof typeof LIVE_PRODUCTS, string> = {
  "volunteer-scheduler": "${bySlug["volunteer-scheduler"]}",
  "grant-tracker": "${bySlug["grant-tracker"]}",
  "impact-dashboard": "${bySlug["impact-dashboard"]}",
  "community-hub": "${bySlug["community-hub"]}",
  general: "${bySlug.general}",
}`

const updated = catalogSource.replace(
  /const TEST_PRODUCTS: Record<keyof typeof LIVE_PRODUCTS, string> = \{[\s\S]*?\}/,
  nextMap,
)

if (updated === catalogSource) {
  console.error("Could not update TEST_PRODUCTS in lib/stripe-catalog.ts — map format changed?")
  process.exit(1)
}

writeFileSync(catalogPath, updated)
console.log(`\nUpdated ${catalogPath}`)

const envLocal = join(webRoot, ".env.local")
const envBody = `# Spark901 Stripe SANDBOX (generated ${new Date().toISOString()})
STRIPE_SECRET_KEY=${secret}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_CHECKOUT_REQUIRE_TOS=false
# Set after: stripe listen --forward-to localhost:3000/api/webhooks/stripe
# STRIPE_WEBHOOK_SECRET=whsec_...
`

if (!process.argv.includes("--no-env")) {
  writeFileSync(envLocal, envBody)
  console.log(`Wrote ${envLocal} (gitignored — contains sk_test key)`)
}

console.log(`
Sandbox catalog ready.

Local test loop:
  1) npm run dev
  2) stripe listen --forward-to localhost:3000/api/webhooks/stripe
  3) paste whsec_... into .env.local as STRIPE_WEBHOOK_SECRET and restart dev
  4) Pay with card 4242 4242 4242 4242 (any future expiry / CVC)

Dashboard (test mode): https://dashboard.stripe.com/test/products
`)

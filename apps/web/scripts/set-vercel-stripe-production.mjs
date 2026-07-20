#!/usr/bin/env node
/**
 * Sets Spark901 production Stripe secrets on Vercel and creates the live webhook.
 *
 * Usage (never commit the key):
 *   VERCEL_TOKEN=… STRIPE_SECRET_KEY=sk_live_… node scripts/set-vercel-stripe-production.mjs
 *
 * Optional:
 *   SITE_URL=https://spark901.com
 *   VERCEL_TEAM_ID=team_…
 *   VERCEL_PROJECT_ID=prj_…
 */

import Stripe from "stripe"

const SITE_URL = (process.env.SITE_URL || "https://spark901.com").replace(/\/$/, "")
const TEAM_ID = process.env.VERCEL_TEAM_ID || "team_i1toUJlZO7L9dyJdOr6B56aP"
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_G6tCBxj44ZX3xPx6zaVRVvMFqAXw"
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!VERCEL_TOKEN) {
  console.error("Missing VERCEL_TOKEN")
  process.exit(1)
}
if (!STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
  console.error("Missing STRIPE_SECRET_KEY (must be sk_live_…)")
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)
const webhookUrl = `${SITE_URL}/api/webhooks/stripe`
const events = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.deleted",
]

async function vercel(path, options = {}) {
  const url = `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${TEAM_ID}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Vercel ${res.status}: ${JSON.stringify(body)}`)
  }
  return body
}

async function upsertEnv(key, value, target = ["production"]) {
  const listed = await vercel(`/v9/projects/${PROJECT_ID}/env`)
  const existing = (listed.envs || []).filter(
    (e) => e.key === key && Array.isArray(e.target) && e.target.includes("production"),
  )

  for (const env of existing) {
    await vercel(`/v9/projects/${PROJECT_ID}/env/${env.id}`, { method: "DELETE" })
  }

  await vercel(`/v10/projects/${PROJECT_ID}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target,
    }),
  })
  console.log(`Set ${key} → ${target.join(", ")}`)
}

async function ensureWebhook() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const match = existing.data.find((w) => w.url === webhookUrl)
  if (match) {
    console.log(`Webhook already exists: ${match.id}`)
    // Secret only returned on create — if missing in Vercel, recreate or rotate in Dashboard.
    return { id: match.id, secret: null }
  }

  const created = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: events,
    description: "Spark901 production fundraising",
  })
  console.log(`Created webhook: ${created.id}`)
  return { id: created.id, secret: created.secret }
}

const account = await stripe.accounts.retrieve()
console.log(`Stripe account: ${account.settings?.dashboard?.display_name || account.id}`)
console.log(`charges_enabled=${account.charges_enabled} payouts_enabled=${account.payouts_enabled}`)

const { secret } = await ensureWebhook()
await upsertEnv("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY, ["production"])
await upsertEnv("NEXT_PUBLIC_SITE_URL", SITE_URL, ["production", "preview", "development"])

if (secret) {
  await upsertEnv("STRIPE_WEBHOOK_SECRET", secret, ["production"])
  console.log("STRIPE_WEBHOOK_SECRET set from new webhook endpoint.")
} else {
  console.log(
    "Webhook already existed — set STRIPE_WEBHOOK_SECRET from Dashboard → Developers → Webhooks → Reveal, then re-run with STRIPE_WEBHOOK_SECRET=whsec_… or rotate the endpoint.",
  )
  if (process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
    await upsertEnv("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET, ["production"])
  }
}

console.log("\nDone. Redeploy production so env vars take effect.")
console.log("Also enable Customer Portal: https://dashboard.stripe.com/settings/billing/portal")
console.log(
  "Public details (Terms/Privacy): https://dashboard.stripe.com/settings/public",
)

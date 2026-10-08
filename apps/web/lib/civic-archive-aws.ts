/**
 * Shared AWS client config for the civic-archive feature's OWN dedicated IAM
 * user — `spark901-web-civic-archive-storage` — used by BOTH:
 *   - `lib/civic-archive-ratelimit.ts` (DynamoDB: the rate-limit table)
 *   - `lib/civic-archive-s3.ts` (S3: the generated-PDF bucket)
 *
 * ⚠️ THIS IS DELIBERATELY *NOT* `lib/ops-ledger.ts`'s `getSpark901AwsClientConfig`.
 * That function resolves `SPARK901_AWS_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` /
 * `_REGION` — the ops-ledger table's credentials. Miclain confirmed
 * 2026-09-25 that the `spark901-web-ops-ledger` IAM user and
 * `spark901-ops-events` table those vars were meant to point at DO NOT
 * ACTUALLY EXIST in the Spark901-Prod AWS account (521390384920) or two
 * other checked accounts — the Vercel env vars are set, but real
 * infrastructure behind them was apparently never deployed (or deployed
 * somewhere unfound). That's a separate, real gap Miclain is tracking
 * himself, NOT something civic-archive code should build on or attempt to
 * fix. So civic-archive's rate-limit table and PDF bucket got their OWN
 * fresh, dedicated, confirmed-real IAM user and credentials instead of
 * reusing the ops-ledger names — see this file.
 *
 * Credentials/region are `SPARK901_CIVIC_ARCHIVE_AWS_*` — LIVE in Vercel as
 * of 2026-09-25, scoped by IAM policy to exactly:
 *   - `dynamodb:GetItem` / `PutItem` / `UpdateItem` on the rate-limit table
 *   - `s3:PutObject` / `GetObject` on the PDF bucket
 * and nothing else. No `SPARK901_AWS_*` fallback on purpose — those names
 * are ambiguous (nominally "ops-ledger" creds that currently point nowhere,
 * per the note above) and must never be silently substituted here.
 */
import { createLogger } from "@/lib/logger"

const log = createLogger({ service: "spark901-web" }).child({
  component: "lib.civic-archive-aws",
})

let warnedMissingCredentials = false

export interface CivicArchiveAwsClientConfig {
  region: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
}

export function getCivicArchiveAwsClientConfig(): CivicArchiveAwsClientConfig {
  const region = process.env.SPARK901_CIVIC_ARCHIVE_AWS_REGION || "us-east-1"
  const accessKeyId = process.env.SPARK901_CIVIC_ARCHIVE_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.SPARK901_CIVIC_ARCHIVE_AWS_SECRET_ACCESS_KEY

  const config: CivicArchiveAwsClientConfig = { region }
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey }
  } else if (!warnedMissingCredentials) {
    warnedMissingCredentials = true
    log.warn(
      "SPARK901_CIVIC_ARCHIVE_AWS_ACCESS_KEY_ID / SPARK901_CIVIC_ARCHIVE_AWS_SECRET_ACCESS_KEY not set — falling back to the default AWS credential chain, which will fail in Vercel's runtime.",
    )
  }
  return config
}

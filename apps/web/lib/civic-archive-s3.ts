/**
 * Durable storage for Job 2's automation output (new meeting summaries +
 * PDFs produced by `app/api/civic-archive/sync/route.ts`).
 *
 * WHY S3 AND NOT THE EXISTING `content/civic-archive/<town>/*.json` +
 * `public/civic-archive/<town>/*.pdf` STATIC FILES: those are read at
 * BUILD time (`lib/civic-archive.ts`'s `loadCivicArchiveMeetings` does a
 * `readdirSync` against the deployed bundle) and are populated by Feature
 * #1's manually-run script committing files to git. A Vercel serverless
 * function's filesystem is ephemeral/read-only for the deployed bundle —
 * it cannot write a new file into `content/` and have it show up on the
 * live site without a new commit + deploy. S3 is the correct durable
 * target for a *running* function, and matches this repo's own framing in
 * `personal-work/goals/collierville-civic-data.md` ("S3 given the
 * AWS-heavy infra already in play").
 *
 * ⚠️ KNOWN GAP, stated plainly rather than silently glossed over: writing
 * here makes the automation job's output durable, but `lib/civic-archive.ts`'s
 * page loader does NOT read from S3 yet — it only reads the static
 * `content/` directory. Wiring the live `/civic-archive` page to also merge
 * in S3-stored summaries (or switching it to read S3 exclusively) is a
 * real, separate follow-up change, out of scope for "build the automation
 * job" — see this project's task report for the full explanation.
 *
 * Credentials: reuses the SAME `SPARK901_AWS_ACCESS_KEY_ID` /
 * `SPARK901_AWS_SECRET_ACCESS_KEY` / `SPARK901_AWS_REGION` trio documented
 * in `infra/aws/README.md` for the DynamoDB ops-ledger writer — mirroring
 * that doc's exact naming convention, per this project's instructions.
 * That dedicated IAM user's policy would need `s3:PutObject` added, scoped
 * to the new bucket's ARN only (same least-privilege posture as the
 * existing DynamoDB policy — no wildcards). A new bucket name is its own
 * var (`SPARK901_CIVIC_ARCHIVE_S3_BUCKET`), mirroring how `SPARK901_OPS_TABLE`
 * names the DynamoDB resource alongside the same shared credential trio.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { createLogger } from "@/lib/logger"

const log = createLogger({ service: "spark901-web" }).child({ component: "lib.civic-archive-s3" })

let cachedClient: S3Client | null = null

export interface CivicArchiveS3Config {
  bucket: string
  region: string
}

export function getCivicArchiveS3Config(): CivicArchiveS3Config | null {
  const bucket = process.env.SPARK901_CIVIC_ARCHIVE_S3_BUCKET
  if (!bucket) return null
  const region = process.env.SPARK901_AWS_REGION ?? "us-east-1"
  return { bucket, region }
}

function getClient(region: string): S3Client {
  if (!cachedClient) {
    const accessKeyId = process.env.SPARK901_AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.SPARK901_AWS_SECRET_ACCESS_KEY
    cachedClient = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    })
  }
  return cachedClient
}

export function civicArchiveSummaryS3Key(town: string, meetingId: string): string {
  return `civic-archive/${town}/summaries/${meetingId}.json`
}

export function civicArchivePdfS3Key(town: string, meetingId: string): string {
  return `civic-archive/${town}/pdfs/${meetingId}.pdf`
}

/**
 * Uploads one object. Fails OPEN (logs and returns `false`, never throws)
 * — same convention as `lib/ops-ledger.ts`: a storage hiccup in a
 * background sync job must never crash the whole run over one meeting.
 */
export async function putCivicArchiveObject(
  config: CivicArchiveS3Config,
  key: string,
  body: Uint8Array | string,
  contentType: string,
): Promise<boolean> {
  try {
    const client = getClient(config.region)
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    return true
  } catch (err) {
    log.error(
      `failed to upload s3://${config.bucket}/${key}`,
      err instanceof Error ? err : new Error(String(err)),
    )
    return false
  }
}

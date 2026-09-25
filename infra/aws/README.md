# Spark901 ops event ledger — AWS bootstrap runbook

The site's inbound events (feedback, beta signup, tool suggestion, volunteer signup,
gift-a-tool request, Stripe contributions) used to go **only** to a Slack Workflow
trigger. That trigger declared no variables, so Slack silently discarded the payload
and posted blank messages — a real lead submitted 2026-08-06 was lost with zero trace.

**Slack is the notification. This table is the record.** A notification failure must
never again destroy a submission.

Application code: [`apps/web/lib/ops-ledger.ts`](../../apps/web/lib/ops-ledger.ts).

---

## Files here

| File | What it is |
|---|---|
| `dynamodb-ops-events.template.json` | CloudFormation — the single table + `GSI1`, PAY_PER_REQUEST, PITR on, SSE on |
| `iam-policy-vercel-writer.json` | Least-privilege IAM policy for the website's IAM user. Contains a `${TABLE_ARN}` placeholder you substitute before creating the policy |
| `README.md` | This runbook |

## Table shape

Single table, one GSI.

```
pk      = "EVENT#<eventType>"     e.g. EVENT#feedback.beta_signup
sk      = "<createdAt>#<id>"      ISO-8601 timestamp + UUID
GSI1PK  = "EVENTS"                one partition — the whole feed
GSI1SK  = "<createdAt>"           time-ordered across all event types
```

Attributes: `id`, `eventType`, `details`, `metadata` (map), `source` (route path),
`createdAt`, `turnstileOk`, `ipHash`, `userAgent`, and a `delivery` map written after
the notification attempt: `{ ok, status, error, attemptedAt }`.

Query patterns this supports:

- **All events of one type, newest first** — `Query` on the table, `pk = EVENT#<type>`, `ScanIndexForward=false`
- **The whole feed, newest first** — `Query` on `GSI1`, `GSI1PK = EVENTS`, `ScanIndexForward=false`
- **A time window** — same, with `GSI1SK BETWEEN :from AND :to`

---

## 0. Prerequisites

```bash
aws --version                      # v2
aws sts get-caller-identity        # confirm you are in the right account
```

Pick the region once and use it everywhere below. It must match `SPARK901_AWS_REGION`.

```bash
export AWS_REGION=us-east-1
export STACK_NAME=spark901-ops-events
export TABLE_NAME=spark901-ops-events
```

## 1. Create the table (CloudFormation)

```bash
aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --template-file infra/aws/dynamodb-ops-events.template.json \
  --parameter-overrides TableName="$TABLE_NAME" EnvironmentTag=Production
```

Read back the ARNs — you need `TableArn` for the IAM policy:

```bash
aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' --output table

export TABLE_ARN=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='TableArn'].OutputValue" --output text)
echo "$TABLE_ARN"
```

Confirm PITR and encryption really are on (never assume — verify):

```bash
aws dynamodb describe-continuous-backups --region "$AWS_REGION" --table-name "$TABLE_NAME" \
  --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus'
aws dynamodb describe-table --region "$AWS_REGION" --table-name "$TABLE_NAME" \
  --query 'Table.SSEDescription'
```

> The stack sets `DeletionPolicy: Retain`. Deleting the stack will **not** delete the
> table or its data. That is deliberate — this table exists because data got lost once.

## 2. Create the IAM user

Dedicated user, no console access, no other permissions.

```bash
aws iam create-user --user-name spark901-web-ops-ledger \
  --tags Key=Application,Value=Spark901 Key=Component,Value=ops-event-ledger
```

## 3. Create and attach the least-privilege policy

Substitute the real ARN into the placeholder, then create the policy:

```bash
sed "s|\${TABLE_ARN}|$TABLE_ARN|g" \
  infra/aws/iam-policy-vercel-writer.json > /tmp/spark901-ops-ledger-policy.json

cat /tmp/spark901-ops-ledger-policy.json   # eyeball it — no wildcards should appear

POLICY_ARN=$(aws iam create-policy \
  --policy-name Spark901OpsLedgerWriter \
  --description "Least-privilege writer for the Spark901 ops event ledger table" \
  --policy-document file:///tmp/spark901-ops-ledger-policy.json \
  --query 'Policy.Arn' --output text)

aws iam attach-user-policy \
  --user-name spark901-web-ops-ledger \
  --policy-arn "$POLICY_ARN"

rm -f /tmp/spark901-ops-ledger-policy.json
```

The policy grants exactly `PutItem`, `UpdateItem`, `GetItem`, `Query` — on the table
ARN and on `${TABLE_ARN}/index/GSI1`, and nothing else. **No `Resource: "*"`.** No
`DeleteItem`, no `Scan`, no table administration. The site can write the record and
read it back; it cannot destroy it.

## 4. Generate the access key

```bash
aws iam create-access-key --user-name spark901-web-ops-ledger
```

This prints `AccessKeyId` and `SecretAccessKey` **once**.

> **The secret is never committed to this repository and never pasted into Slack, a
> ticket, an email, or an MSP doc.** It goes straight from this terminal into Vercel
> env vars (encrypted at rest) in the next step, and then out of your scrollback.
> If it lands anywhere else, treat it as compromised and rotate it (step 7).

## 5. Set the Vercel env vars

From `apps/web` (the project must be linked — `vercel link`):

```bash
cd apps/web

# Repeat each for: production, preview, development
printf '%s' "spark901-ops-events"        | vercel env add SPARK901_OPS_TABLE production
printf '%s' "us-east-1"                  | vercel env add SPARK901_AWS_REGION production
printf '%s' "<AccessKeyId>"              | vercel env add SPARK901_AWS_ACCESS_KEY_ID production
printf '%s' "<SecretAccessKey>"          | vercel env add SPARK901_AWS_SECRET_ACCESS_KEY production
printf '%s' "$(openssl rand -hex 32)"    | vercel env add SPARK901_IP_HASH_SALT production
```

If `--scope` is needed, use the **equals form** — `--scope=miclain-keffelers-projects`;
the space form errors out.

| Env var | Purpose |
|---|---|
| `SPARK901_OPS_TABLE` | Table name. **Unset = the ledger silently no-ops.** |
| `SPARK901_AWS_REGION` | Region. Falls back to `AWS_REGION`, then `us-east-1`. |
| `SPARK901_AWS_ACCESS_KEY_ID` | Access key for the user above. |
| `SPARK901_AWS_SECRET_ACCESS_KEY` | Secret for the user above. |
| `SPARK901_IP_HASH_SALT` | Salt for the SHA-256 IP hash. **Absent = no IP is stored at all** (an unsalted IPv4 hash is brute-forceable in seconds, so it would not be anonymised). |

**Why the `SPARK901_` prefix is primary:** the Vercel/Lambda runtime sets its own
`AWS_*` variables. Prefixing ours means the site's dedicated IAM user can never
collide with — or be shadowed by — the platform's credentials. The unprefixed names
remain only as a local-development fallback.

Redeploy so the new vars are picked up:

```bash
vercel deploy --prod
```

## 6. Verify end to end

Submit a real form on the site, then read the feed back:

```bash
aws dynamodb query \
  --region "$AWS_REGION" \
  --table-name "$TABLE_NAME" \
  --index-name GSI1 \
  --key-condition-expression 'GSI1PK = :p' \
  --expression-attribute-values '{":p":{"S":"EVENTS"}}' \
  --no-scan-index-forward --max-items 5
```

One event type only:

```bash
aws dynamodb query \
  --region "$AWS_REGION" --table-name "$TABLE_NAME" \
  --key-condition-expression 'pk = :p' \
  --expression-attribute-values '{":p":{"S":"EVENT#feedback.beta_signup"}}' \
  --no-scan-index-forward --max-items 10
```

Check the `delivery` map on a recent item: `delivery.ok = false` means the ledger
caught a submission that Slack dropped — which is the entire point of this table.
Errors and fatals from the app logger land under `pk = EVENT#log.error`.

## 7. Rotate the access key

Rotate on any suspicion of exposure, and routinely.

```bash
aws iam create-access-key --user-name spark901-web-ops-ledger      # new key
# update the two Vercel env vars, redeploy, confirm writes still land
aws iam list-access-keys --user-name spark901-web-ops-ledger
aws iam delete-access-key --user-name spark901-web-ops-ledger --access-key-id <OLD_KEY_ID>
```

## Guardrails

- **Access keys never enter git and never enter Slack.** Terminal → Vercel env var,
  nothing in between. `.env.example` carries the key *names* with blank values only.
- **No wildcards in the IAM policy.** If a new access pattern is needed, add the
  specific action scoped to the specific ARN.
- **Never widen the policy to `dynamodb:DeleteItem` or `dynamodb:Scan`** to make an
  ad-hoc cleanup easier. Do that with your own admin credentials, not the site's user.
- **The ledger fails open by design.** A DynamoDB outage must never make a form
  submission fail — `lib/ops-ledger.ts` swallows every error and returns `null`. That
  also means a misconfigured `SPARK901_OPS_TABLE` is silent apart from one warn line;
  verify with step 6 rather than assuming it works.
- **Secrets never reach the table.** Credential-shaped metadata keys are dropped and
  secret-shaped values (`sk_live_…`, `whsec_…`, Slack webhook URLs, bearer tokens,
  AKIA ids) are redacted before the write. Submitter name/email *are* stored — that is
  the record — and stay inside our own AWS account, encrypted at rest.

---

## Civic Archive — dedicated storage (rate-limit table + PDF bucket)

**PROVISIONED AND LIVE (2026-09-25).** `apps/web/lib/civic-archive-ratelimit.ts`
caps "Ask the Archive" (`/api/civic-archive/ask`) at **3 queries per client IP
per rolling 24 hours**, on top of Turnstile. `apps/web/lib/civic-archive-s3.ts`
durably stores the Job 2 automation job's generated summary JSON + PDFs.

⚠️ **This section originally planned to reuse the `spark901-web-ops-ledger`
IAM user (see that table's section above) for both of these.** Miclain
checked directly and confirmed that user — and the `spark901-ops-events`
table it's meant to own — **does not actually exist** in the Spark901-Prod
AWS account (521390384920) or 2 other checked accounts, even though the
`SPARK901_AWS_*` Vercel env vars nominally pointing at it are set (dated
months ago). That's a **separate, unresolved gap**, flagged here and in
`apps/web/.env.example`, not fixed as part of this work. Because of that
ambiguity, civic-archive storage got its **own fresh, dedicated, confirmed-real
IAM user** instead — **do not** point new civic-archive code at the
`SPARK901_AWS_*` names for this reason.

Application code:
[`apps/web/lib/civic-archive-ratelimit.ts`](../../apps/web/lib/civic-archive-ratelimit.ts),
[`apps/web/lib/civic-archive-s3.ts`](../../apps/web/lib/civic-archive-s3.ts),
shared credential resolver
[`apps/web/lib/civic-archive-aws.ts`](../../apps/web/lib/civic-archive-aws.ts).

### What's live

| Resource | Name | Notes |
|---|---|---|
| IAM user | `spark901-web-civic-archive-storage` | Dedicated to civic-archive only. No console access. |
| DynamoDB table | `spark901-ask-archive-ratelimit` | pk `ipHash` (S), TTL on `expiresAt` (N), PAY_PER_REQUEST, KMS-encrypted. |
| S3 bucket | `spark901-civic-archive-pdfs` | Private, public access fully blocked, SSE-encrypted. |

| Env var | Purpose |
|---|---|
| `SPARK901_CIVIC_ARCHIVE_AWS_ACCESS_KEY_ID` | Access key for `spark901-web-civic-archive-storage`. |
| `SPARK901_CIVIC_ARCHIVE_AWS_SECRET_ACCESS_KEY` | Secret for that same user. |
| `SPARK901_CIVIC_ARCHIVE_AWS_REGION` | `us-east-1`. Falls back to `us-east-1` in code if unset. |
| `SPARK901_CIVIC_ARCHIVE_S3_BUCKET` | `spark901-civic-archive-pdfs`. Unset = Job 2 generates PDFs but can't persist them (logged, not a crash). |
| `SPARK901_ASK_ARCHIVE_RATELIMIT_TABLE` | `spark901-ask-archive-ratelimit`. Unset = rate limiting fails open — Turnstile is the only remaining guard. |
| `SPARK901_IP_HASH_SALT` | Reused from the ops-ledger section above (same salt — see `lib/ops-ledger.ts`'s exported `hashIp`, imported directly rather than a second implementation). |

The IAM user's policy is scoped to **exactly**: `dynamodb:GetItem` /
`PutItem` / `UpdateItem` on the rate-limit table ARN, and `s3:PutObject` /
`GetObject` on the PDF bucket's objects — nothing else, no wildcards.

### Table shape (DynamoDB)

Single table, no GSI, one item per client.

```
ipHash    = SHA-256(SPARK901_IP_HASH_SALT + ":" + clientIp)   partition key (S)
count     = number of queries counted in the current 24h window (N)
expiresAt = unix epoch seconds, ~24h after the FIRST query in the window (N, TTL)
```

`expiresAt` is set only on the FIRST write in a window (`if_not_exists`), so
additional queries inside the same 24h don't push the expiry out — a capped
client is not un-capped by continuing to try. DynamoDB TTL deletion is
best-effort and can lag up to ~48h past `expiresAt`; that's safe here because
the enforcement decision reads the actual `count` value, never "does the item
still exist," so a delayed TTL sweep only ever means the cap is upheld a
little longer than 24h, never bypassed early.

### Reproducing this from scratch (e.g. a new environment, or if credentials rotate)

```bash
export AWS_REGION=us-east-1

# 1. Table (idempotent if it already exists under this stack name)
aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name spark901-ask-archive-ratelimit \
  --template-file infra/aws/dynamodb-ask-archive-ratelimit.template.json \
  --parameter-overrides TableName=spark901-ask-archive-ratelimit EnvironmentTag=Production

export TABLE_ARN=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" --stack-name spark901-ask-archive-ratelimit \
  --query "Stacks[0].Outputs[?OutputKey=='TableArn'].OutputValue" --output text)

# 2. S3 bucket (create manually if it doesn't exist yet — no CFN template
#    for this one; it's a single private, SSE-encrypted, public-access-
#    blocked bucket, nothing else to configure)
aws s3api create-bucket --bucket spark901-civic-archive-pdfs --region "$AWS_REGION"
aws s3api put-public-access-block --bucket spark901-civic-archive-pdfs \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket spark901-civic-archive-pdfs \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
export BUCKET_ARN="arn:aws:s3:::spark901-civic-archive-pdfs"

# 3. Dedicated IAM user (NOT spark901-web-ops-ledger — see the flag above)
aws iam create-user --user-name spark901-web-civic-archive-storage \
  --tags Key=Application,Value=Spark901 Key=Component,Value=civic-archive-storage

# 4. Both least-privilege policies, attached to that one user
sed "s|\${TABLE_ARN}|$TABLE_ARN|g" infra/aws/iam-policy-ask-archive-ratelimit.json \
  > /tmp/spark901-civic-archive-dynamo-policy.json
sed "s|\${BUCKET_ARN}|$BUCKET_ARN|g" infra/aws/iam-policy-civic-archive-s3.json \
  > /tmp/spark901-civic-archive-s3-policy.json

DYNAMO_POLICY_ARN=$(aws iam create-policy \
  --policy-name Spark901CivicArchiveRateLimitWriter \
  --description "Least-privilege GetItem/PutItem/UpdateItem for the Ask the Archive rate-limit table only" \
  --policy-document file:///tmp/spark901-civic-archive-dynamo-policy.json \
  --query 'Policy.Arn' --output text)
S3_POLICY_ARN=$(aws iam create-policy \
  --policy-name Spark901CivicArchivePdfBucketWriter \
  --description "Least-privilege PutObject/GetObject for the civic-archive PDF bucket only" \
  --policy-document file:///tmp/spark901-civic-archive-s3-policy.json \
  --query 'Policy.Arn' --output text)

aws iam attach-user-policy --user-name spark901-web-civic-archive-storage --policy-arn "$DYNAMO_POLICY_ARN"
aws iam attach-user-policy --user-name spark901-web-civic-archive-storage --policy-arn "$S3_POLICY_ARN"
rm -f /tmp/spark901-civic-archive-dynamo-policy.json /tmp/spark901-civic-archive-s3-policy.json

# 5. Access key, then straight into Vercel env vars (never git, never Slack)
aws iam create-access-key --user-name spark901-web-civic-archive-storage
```

### Verify end to end

Ask the Archive 4 times in a row from the same IP; the 4th should return
HTTP 429. Then read the counter back:

```bash
aws dynamodb get-item \
  --region us-east-1 --table-name spark901-ask-archive-ratelimit \
  --key '{"ipHash":{"S":"<hash from the app logs>"}}'
```

Trigger the sync route (or wait for its weekly cron) and confirm objects land:

```bash
aws s3 ls s3://spark901-civic-archive-pdfs/civic-archive/collierville/ --recursive
```

### Guardrails

- **No wildcards in either policy**, and each names exactly one resource —
  never widen one to cover the other, and never attach either to a different
  user (including `spark901-web-ops-ledger`, which per the flag above may not
  even exist as a real, working credential today).
- **Fails open, on purpose.** Neither a missing table/bucket name, a missing
  IP hash salt, nor an AWS error may ever block a real visitor from using Ask
  the Archive, or crash the sync job over one meeting — Turnstile remains the
  rate limiter's backstop against automated abuse either way.
- **The rate-limit table holds no PII beyond a salted, one-way IP hash** — no
  question text, no answer text. That content lives only in rag-gateway (WTC
  infra) and in the response sent back to the browser.

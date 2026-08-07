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

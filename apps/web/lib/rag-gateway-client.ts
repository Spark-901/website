/**
 * Minimal client for `rag-gateway` (WTC-internal Cloudflare Worker,
 * `West-Tennessee-Consulting/wtc-monorepo/apps/rag-gateway`).
 *
 * WHY THIS IS HAND-WRITTEN INSTEAD OF IMPORTING `@west-tennessee-consulting/rag`:
 * the gateway's own README says every caller should use that package's
 * `RagClient` rather than hand-building requests. But that package is a
 * **private, unpublished workspace package** (`"version": "*"` inside
 * `wtc-monorepo`'s own npm workspaces) — it does not exist on any registry,
 * and this repo (`Spark-901/website`) is a completely separate monorepo, not
 * a workspace member of `wtc-monorepo`, so there is nothing to `npm install`.
 * This mirrors exactly how this repo already handles `@wtc/logger` (see
 * `lib/logger/index.ts`'s "VENDORED CODE" comment): vendor a small, local,
 * dependency-free copy of the contract instead of pretending the private
 * package is installable.
 *
 * Unlike the logger, the actual `packages/rag` source was NOT available to
 * copy from on this machine's `wtc-monorepo` checkout (`external/
 * wtc-shared-packages/packages/` has no `rag/` directory in the pinned
 * commit this repo currently has checked out — likely added upstream after
 * that checkout was last synced). So this file is not a vendor-copy; it's a
 * fresh, minimal implementation of the **documented HTTP contract only**
 * (endpoints, request/response shapes), read directly from
 * `apps/rag-gateway/README.md` and its route source (`src/index.ts`,
 * `src/ingest.ts`, `src/query.ts`) in that read-only reference checkout.
 * If `@west-tennessee-consulting/rag` ever gets published or vendored
 * properly, prefer that over this file — this exists to unblock real work,
 * not to be the permanent answer.
 *
 * Auth: single shared bearer secret (`RAG_API_KEY`). Every route except
 * `/v1/health` requires it.
 */

export interface RagIngestDocument {
  docId: string
  projectId: string
  sourceType: string
  text: string
  /** ISO-8601. Used for the gateway's own dedupe/content-hash check. */
  updatedAt: string
  title?: string
  /** Source URL for the document, surfaced back on query results. */
  uri?: string
  tags?: string[]
  /** Relative ranking weight for this document at query time (gateway-defined scale; 1 is a neutral default). */
  weight?: number
  /**
   * Skip the per-project cache-invalidation write for this document. Set
   * `true` on every document in a batch except the last (see `ingestMany`
   * below) — mirrors `RagClient.ingestMany`'s documented behavior, since
   * Workers KV's free tier allows far fewer writes/day than reads.
   */
  deferVersionBump?: boolean
}

export interface RagIngestResponse {
  docId: string
  projectId: string
  changed: boolean
  chunkCount: number
}

export interface RagIngestAsyncResponse {
  jobId: string
  projectId: string
  docId: string
  status: "queued"
}

export interface RagIngestJobStatus {
  jobId: string
  projectId: string
  docId: string
  status: "queued" | "done" | "error" | "dead"
  chunkCount?: number | null
  changed?: boolean | null
  error?: string | null
}

export interface RagQueryResult {
  docId: string
  chunkIndex: number
  score: number
  title?: string
  url?: string
  sourceType: string
  text: string
  weight: number
}

export interface RagQueryResponse {
  results: RagQueryResult[]
  cached: boolean
}

export interface RagDocumentAuditEntry {
  docId: string
  sourceType: string
  uri: string | null
  title: string | null
  chunkCount: number
  updatedAt: string
  tags: string[]
  ingestedAt: number
}

export interface RagGatewayClientOptions {
  /** Base URL of the deployed rag-gateway Worker, e.g. `https://rag-gateway.<subdomain>.workers.dev`. */
  gatewayUrl: string
  /** Shared bearer secret (`RAG_API_KEY` on the Worker side). */
  apiKey: string
  fetchImpl?: typeof fetch
}

export class RagGatewayError extends Error {
  readonly status: number

  // No TS parameter-property shorthand here — this file is imported by
  // scripts/ingest-civic-archive-rag.ts, which runs under Node's
  // `--experimental-strip-types` (strip-only mode), and that mode cannot
  // erase a parameter property's implicit field declaration. Plain
  // assignment works under every runner this file needs (strip-only Node,
  // Next.js's own bundler).
  constructor(message: string, status: number) {
    super(message)
    this.name = "RagGatewayError"
    this.status = status
  }
}

/**
 * Thin HTTP client for rag-gateway. See this file's top-level doc comment
 * for why this exists instead of the (unpublished) official client package.
 */
export class RagGatewayClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly fetchImpl: typeof fetch

  constructor(options: RagGatewayClientOptions) {
    this.baseUrl = options.gatewayUrl.replace(/\/$/, "")
    this.apiKey = options.apiKey
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  private async request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
        // A default/no User-Agent on *.workers.dev is blocked at Cloudflare's
        // edge (error code 1010) — see the gateway README's setup section.
        "user-agent": "spark901-website/1.0 (+https://spark901.com)",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    const data: unknown = text ? JSON.parse(text) : undefined

    if (!res.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : `rag-gateway request failed: HTTP ${res.status}`
      throw new RagGatewayError(message, res.status)
    }

    return data as T
  }

  /** `POST /v1/ingest` — synchronous chunk + embed + upsert. */
  ingest(doc: RagIngestDocument): Promise<RagIngestResponse> {
    return this.request<RagIngestResponse>("POST", "/v1/ingest", doc)
  }

  /** `POST /v1/ingest/async` — enqueue for background processing. */
  ingestAsync(doc: RagIngestDocument): Promise<RagIngestAsyncResponse> {
    return this.request<RagIngestAsyncResponse>("POST", "/v1/ingest/async", doc)
  }

  /** `GET /v1/ingest/jobs/:jobId` */
  getJobStatus(jobId: string): Promise<RagIngestJobStatus> {
    return this.request<RagIngestJobStatus>(
      "GET",
      `/v1/ingest/jobs/${encodeURIComponent(jobId)}`,
    )
  }

  /**
   * Enqueues every document via `/v1/ingest/async`, setting
   * `deferVersionBump: true` on all but the last so cache invalidation for
   * this project happens once for the whole batch, not once per document —
   * mirrors `RagClient.ingestMany`'s documented behavior (see this file's
   * top-level comment).
   */
  async ingestMany(
    docs: RagIngestDocument[],
  ): Promise<RagIngestAsyncResponse[]> {
    const results: RagIngestAsyncResponse[] = []
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]!
      const isLast = i === docs.length - 1
      results.push(
        await this.ingestAsync({ ...doc, deferVersionBump: !isLast }),
      )
    }
    return results
  }

  /** `POST /v1/projects/:projectId/bump-version` */
  bumpProjectVersion(projectId: string): Promise<{ projectId: string }> {
    return this.request<{ projectId: string }>(
      "POST",
      `/v1/projects/${encodeURIComponent(projectId)}/bump-version`,
    )
  }

  /** `POST /v1/query` — cache-aware semantic search, scoped to one `projectId`. Returns cited chunks; does NOT synthesize an answer. */
  query(req: {
    projectId: string
    query: string
    topK?: number
    filter?: Record<string, unknown>
  }): Promise<RagQueryResponse> {
    return this.request<RagQueryResponse>("POST", "/v1/query", req)
  }

  /** `GET /v1/projects/:projectId/documents` — audit: everything ingested for one project, newest first. */
  listDocuments(
    projectId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ documents: RagDocumentAuditEntry[] }> {
    const params = new URLSearchParams()
    if (options.limit) params.set("limit", String(options.limit))
    if (options.offset) params.set("offset", String(options.offset))
    const qs = params.toString()
    return this.request<{ documents: RagDocumentAuditEntry[] }>(
      "GET",
      `/v1/projects/${encodeURIComponent(projectId)}/documents${qs ? `?${qs}` : ""}`,
    )
  }
}

/**
 * Builds a `RagGatewayClient` from environment variables, or returns `null`
 * with a warning if either is missing — callers should treat a `null`
 * client as "the RAG feature is not configured yet" rather than throwing,
 * consistent with this repo's `lib/ops-ledger.ts` "fails open" convention.
 *
 * Env vars (NOT set anywhere yet as of this writing — see the calling
 * script/route's own doc comment):
 *   - `RAG_GATEWAY_URL` — base URL of the deployed rag-gateway Worker.
 *     The official client package bakes in a `DEFAULT_GATEWAY_URL` constant
 *     so callers inside `wtc-monorepo` don't need to set this at all; this
 *     repo has no access to that constant (see this file's top comment), so
 *     it must be supplied explicitly here.
 *   - `RAG_API_KEY` — the shared bearer secret. Lives in AWS SSM Parameter
 *     Store at `/wtc/shared/prod/RAG_API_KEY` per rag-gateway's README;
 *     pull it from there rather than generating a new one.
 */
export function getRagGatewayClient(): RagGatewayClient | null {
  const gatewayUrl = process.env.RAG_GATEWAY_URL
  const apiKey = process.env.RAG_API_KEY
  if (!gatewayUrl || !apiKey) {
    return null
  }
  return new RagGatewayClient({ gatewayUrl, apiKey })
}

export const CIVIC_ARCHIVE_RAG_PROJECT_PREFIX = "civic-archive-"

/** `civic-archive-collierville`, `civic-archive-germantown`, etc. — one `rag-gateway` projectId per town. */
export function civicArchiveRagProjectId(townSlug: string): string {
  return `${CIVIC_ARCHIVE_RAG_PROJECT_PREFIX}${townSlug}`
}

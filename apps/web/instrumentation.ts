/**
 * Next.js instrumentation hook — runs once per server process at startup.
 *
 * Registers the DynamoDB ops-ledger as a secondary sink on the structured
 * logger, so every `error` / `fatal` log line is persisted alongside the
 * inbound-event records and both are queryable from one place.
 *
 * The registration lives here, not in `lib/logger`, on purpose: the logger is
 * vendored from `@wtc/logger` and must stay dependency-free so it can be
 * re-vendored from upstream without merge pain. Destination-specific code —
 * and its AWS SDK dependency — belongs in the caller.
 */

export async function register(): Promise<void> {
  // Edge runtime has no AWS SDK and no filesystem; the ledger is Node-only.
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const [{ addLogSink }, { logEntrySink }] = await Promise.all([
    import("@/lib/logger"),
    import("@/lib/ops-ledger"),
  ])

  addLogSink(logEntrySink)
}

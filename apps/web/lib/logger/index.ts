/**
 * VENDORED CODE — DO NOT EDIT CASUALLY.
 *
 * Source: `@wtc/logger` v1.0.0, from the WTC monorepo
 * (RiseTNNonprofit/wtc-monorepo → `packages/@wtc/logger/src/`).
 *
 * Why this is copied rather than installed: the `@wtc/*` packages are NOT
 * published to npm — they are workspace-internal to the monorepo. This app
 * lives in a different repository, so there is no package to depend on. The
 * source is copied in verbatim instead.
 *
 * The upstream package has ZERO runtime dependencies, and this copy keeps that
 * property. Do not add npm dependencies to anything under `lib/logger/`.
 *
 * Fixes flow UPSTREAM: if you find a bug or need a behavior change, make the
 * change in `wtc-monorepo` first (branch `develop`), then re-vendor it here so
 * the two copies do not diverge. A fix applied only here will be silently lost
 * the next time this directory is refreshed.
 *
 * Omitted from this copy: `pricing.ts` and `usage.ts` (LLM token-cost
 * tracking), which are not relevant to this app. If you need them, re-vendor
 * them from upstream rather than reimplementing.
 */

export { Logger, createLogger } from './logger';
export {
  addLogSink,
  removeLogSink,
  clearLogSinks,
  type LogSink,
} from './sinks';
export { PerformanceTimer, startTimer } from './timer';
export { serializeError } from './serialize-error';
export {
  type LogLevel,
  type LogEntry,
  type SerializedError,
  type BaselineContext,
  type Bindings,
  type LoggerOptions,
} from './types';

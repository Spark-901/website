export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

/**
 * Baseline context fields auto-attached to every log entry by the logger.
 * Callers cannot override these — they come from the runtime environment.
 */
export interface BaselineContext {
  /** ISO timestamp in UTC */
  timestamp: string;
  /** debug | info | warn | error | fatal */
  level: LogLevel;
  /** Service identifier — package or app emitting the log */
  service: string;
  /** development | preview | production (from VERCEL_ENV or NODE_ENV) */
  env: string;
  /** node | edge | browser */
  runtime: 'node' | 'edge' | 'browser';
  /** Vercel deployment id when running on Vercel */
  vercelDeploymentId?: string;
  /** Vercel region (e.g. iad1) */
  vercelRegion?: string;
  /** Git commit sha when available */
  commitSha?: string;
  /** Process pid (node only) */
  pid?: number;
}

/**
 * User-supplied bindings attached to a child logger and merged into every
 * entry it emits. Things like requestId, userId, chatId, route.
 */
export type Bindings = Record<string, unknown>;

/**
 * Final log entry shape emitted as a single JSON line.
 */
export interface LogEntry extends BaselineContext {
  /** Short human-readable message */
  message: string;
  /** Structured payload — caller-supplied, merged with bindings */
  context?: Record<string, unknown>;
  /** Serialized error object when level >= error */
  error?: SerializedError;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  code?: string | number;
  status?: number;
  /** Additional non-standard properties on Error subclasses */
  details?: Record<string, unknown>;
}

export interface LoggerOptions {
  /** Service identifier — e.g. 'hub', '@wtc/meridian', 'apps/orders' */
  service: string;
  /** Minimum level to emit. Lower-priority entries are dropped. */
  level?: LogLevel;
  /** Pretty-print to stdout for local dev. Auto-enabled when not on Vercel and env=development. */
  pretty?: boolean;
  /** Initial bindings merged into every log entry. */
  bindings?: Bindings;
  /** Custom sink — defaults to console.log/error per level. */
  sink?: (entry: LogEntry) => void;
}

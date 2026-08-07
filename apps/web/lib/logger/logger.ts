import { buildBaselineContext, isVercel } from './context';
import { serializeError } from './serialize-error';
import { dispatchToExtraSinks } from './sinks';
import type {
  Bindings,
  LogEntry,
  LogLevel,
  LoggerOptions,
} from './types';
import { LOG_LEVEL_ORDER } from './types';

function resolveDefaultLevel(): LogLevel {
  if (typeof process === 'undefined') return 'info';
  const raw = process.env['LOG_LEVEL']?.toLowerCase();
  if (raw && raw in LOG_LEVEL_ORDER) return raw as LogLevel;
  const env = process.env['VERCEL_ENV'] ?? process.env['NODE_ENV'];
  if (env === 'development') return 'debug';
  return 'info';
}

function resolveDefaultPretty(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env['LOG_PRETTY'] === 'false') return false;
  if (process.env['LOG_PRETTY'] === 'true') return true;
  if (isVercel()) return false;
  const env = process.env['NODE_ENV'];
  return env === 'development' || env === 'test';
}

function defaultSink(entry: LogEntry, pretty: boolean): void {
  const line = pretty
    ? JSON.stringify(entry, null, 2)
    : JSON.stringify(entry);
  if (entry.level === 'error' || entry.level === 'fatal') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (entry.level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export class Logger {
  private readonly service: string;
  private readonly level: LogLevel;
  private readonly pretty: boolean;
  private readonly bindings: Bindings;
  private readonly sink: (entry: LogEntry) => void;

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.level = options.level ?? resolveDefaultLevel();
    this.pretty = options.pretty ?? resolveDefaultPretty();
    this.bindings = options.bindings ?? {};
    const pretty = this.pretty;
    this.sink = options.sink ?? ((entry) => defaultSink(entry, pretty));
  }

  /**
   * Return a new logger that inherits this logger's bindings and merges
   * additional bindings on top. Use for per-request / per-chat scoping.
   */
  child(bindings: Bindings): Logger {
    return new Logger({
      service: this.service,
      level: this.level,
      pretty: this.pretty,
      bindings: { ...this.bindings, ...bindings },
      sink: this.sink,
    });
  }

  withBindings(bindings: Bindings): Logger {
    return this.child(bindings);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit('warn', message, context);
  }

  error(message: string, errorOrContext?: unknown, context?: Record<string, unknown>): void {
    this.emit('error', message, context, errorOrContext);
  }

  fatal(message: string, errorOrContext?: unknown, context?: Record<string, unknown>): void {
    this.emit('fatal', message, context, errorOrContext);
  }

  /**
   * Time an async block. Logs `info` on success with durationMs in context;
   * logs `error` with durationMs + the thrown error if it throws.
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      this.info(`${operation} completed`, { ...context, operation, durationMs });
      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      this.error(`${operation} failed`, error, { ...context, operation, durationMs });
      throw error;
    }
  }

  private emit(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    errorInput?: unknown,
  ): void {
    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.level]) return;

    const baseline = buildBaselineContext(this.service, level);
    const mergedContext: Record<string, unknown> = {
      ...this.bindings,
      ...(context ?? {}),
    };

    const entry: LogEntry = {
      ...baseline,
      message,
    };

    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext;
    }

    if (errorInput !== undefined && errorInput !== null) {
      entry.error = serializeError(errorInput);
    }

    try {
      this.sink(entry);
    } catch {
      // never let logging itself throw
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ ...baseline, message: 'logger sink failed', context: { originalMessage: message } }));
    }

    // Fan out to any process-global secondary sinks (e.g. Slack error
    // forwarding). Self-guarding — never throws, never affects the primary
    // sink above.
    dispatchToExtraSinks(entry);
  }
}

/**
 * Create a Logger. Prefer one logger per package/app at module scope, then
 * derive child loggers via `logger.child({ ... })` per request / operation.
 */
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

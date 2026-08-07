import type { Logger } from './logger';

/**
 * Lightweight performance timer. Capture a start point, then `end()` to
 * compute durationMs and emit a structured info log via the supplied logger.
 *
 * Prefer `logger.time(op, async fn)` for async blocks — this class is for
 * imperative call-site pairs where the start and end sites are far apart.
 */
export class PerformanceTimer {
  private readonly logger: Logger;
  private readonly operation: string;
  private readonly start: number;
  private readonly extraContext: Record<string, unknown> | undefined;

  constructor(logger: Logger, operation: string, extraContext?: Record<string, unknown>) {
    this.logger = logger;
    this.operation = operation;
    this.start = Date.now();
    this.extraContext = extraContext;
  }

  /**
   * Emit a single info log with durationMs and return the elapsed time.
   */
  end(context?: Record<string, unknown>): number {
    const durationMs = Date.now() - this.start;
    this.logger.info(`${this.operation} completed`, {
      ...(this.extraContext ?? {}),
      ...(context ?? {}),
      operation: this.operation,
      durationMs,
    });
    return durationMs;
  }

  /**
   * Emit an error log with durationMs and the error attached. Use this in
   * catch handlers when manually closing a timer.
   */
  fail(error: unknown, context?: Record<string, unknown>): number {
    const durationMs = Date.now() - this.start;
    this.logger.error(`${this.operation} failed`, error, {
      ...(this.extraContext ?? {}),
      ...(context ?? {}),
      operation: this.operation,
      durationMs,
    });
    return durationMs;
  }
}

export function startTimer(
  logger: Logger,
  operation: string,
  context?: Record<string, unknown>,
): PerformanceTimer {
  return new PerformanceTimer(logger, operation, context);
}

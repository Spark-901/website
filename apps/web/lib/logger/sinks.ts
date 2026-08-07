import type { LogEntry } from './types';

/**
 * A secondary sink receives every emitted log entry IN ADDITION to the
 * logger's primary (console) sink. Used to fan log entries out to external
 * destinations — e.g. forwarding error/fatal entries to Slack.
 *
 * Sinks are registered process-globally, so a SINGLE registration captures
 * every logger created anywhere in the process (hub, @wtc/meridian, packages).
 * `@wtc/logger` stays dependency-free: the destination-specific code (and its
 * dependencies) live in the caller that registers the sink, never here.
 */
export type LogSink = (entry: LogEntry) => void;

const extraSinks = new Set<LogSink>();

/**
 * Register a secondary sink. Returns a disposer that removes it.
 * Registering the same function reference twice is a no-op (Set semantics).
 */
export function addLogSink(sink: LogSink): () => void {
  extraSinks.add(sink);
  return () => {
    extraSinks.delete(sink);
  };
}

export function removeLogSink(sink: LogSink): void {
  extraSinks.delete(sink);
}

/** Remove all secondary sinks. Primarily for tests. */
export function clearLogSinks(): void {
  extraSinks.clear();
}

/**
 * Dispatch an entry to every registered secondary sink. Each sink is isolated
 * in its own try/catch — a misbehaving secondary sink must NEVER break logging
 * or affect the primary console sink. Called by `Logger.emit` after the
 * primary sink has run.
 */
export function dispatchToExtraSinks(entry: LogEntry): void {
  if (extraSinks.size === 0) return;
  for (const sink of extraSinks) {
    try {
      sink(entry);
    } catch {
      // A secondary sink failing must not break logging. Swallow — we cannot
      // log the failure through this same logger without risking recursion.
    }
  }
}

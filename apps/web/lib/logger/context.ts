import type { BaselineContext, LogLevel } from './types';

/**
 * Resolve the runtime — Vercel Edge sets EdgeRuntime, browser has window,
 * everything else is Node.
 */
function detectRuntime(): 'node' | 'edge' | 'browser' {
  if (typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== 'undefined') {
    return 'edge';
  }
  if (typeof (globalThis as { window?: unknown }).window !== 'undefined') {
    return 'browser';
  }
  return 'node';
}

function resolveEnv(): string {
  if (typeof process === 'undefined') return 'browser';
  return (
    process.env['VERCEL_ENV'] ??
    process.env['NODE_ENV'] ??
    'development'
  );
}

function resolveCommitSha(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return (
    process.env['VERCEL_GIT_COMMIT_SHA'] ??
    process.env['GIT_COMMIT_SHA'] ??
    undefined
  );
}

function resolveVercelDeploymentId(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env['VERCEL_DEPLOYMENT_ID'] ?? undefined;
}

function resolveVercelRegion(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env['VERCEL_REGION'] ?? undefined;
}

function resolvePid(): number | undefined {
  if (typeof process === 'undefined') return undefined;
  return typeof process.pid === 'number' ? process.pid : undefined;
}

/**
 * Build the baseline context fields that every log entry includes.
 * Cached process-level values are read once at logger creation; per-entry
 * fields (timestamp, level) are merged at emit time.
 */
export function buildBaselineContext(service: string, level: LogLevel): BaselineContext {
  const runtime = detectRuntime();
  const ctx: BaselineContext = {
    timestamp: new Date().toISOString(),
    level,
    service,
    env: resolveEnv(),
    runtime,
  };

  const vercelDeploymentId = resolveVercelDeploymentId();
  if (vercelDeploymentId !== undefined) ctx.vercelDeploymentId = vercelDeploymentId;

  const vercelRegion = resolveVercelRegion();
  if (vercelRegion !== undefined) ctx.vercelRegion = vercelRegion;

  const commitSha = resolveCommitSha();
  if (commitSha !== undefined) ctx.commitSha = commitSha;

  const pid = resolvePid();
  if (pid !== undefined && runtime === 'node') ctx.pid = pid;

  return ctx;
}

/**
 * True when running on Vercel — used to default `pretty` off so production
 * lines stay single-line JSON parsable by Vercel's log drains.
 */
export function isVercel(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env['VERCEL'] === '1' || !!process.env['VERCEL_ENV'];
}

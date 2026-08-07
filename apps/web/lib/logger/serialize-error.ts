import type { SerializedError } from './types';

/**
 * Convert any thrown value into a structured shape safe for JSON.stringify.
 * Walks `cause` chains, captures status/code on AWS/Bedrock/Fetch errors,
 * preserves stack, strips functions.
 */
export function serializeError(input: unknown): SerializedError {
  if (input instanceof Error) {
    const errObj = input as Error & {
      cause?: unknown;
      code?: string | number;
      status?: number;
      statusCode?: number;
      response?: { status?: number; statusText?: string; data?: unknown };
      details?: Record<string, unknown>;
    };

    const out: SerializedError = {
      name: errObj.name,
      message: errObj.message,
    };

    if (errObj.stack) out.stack = errObj.stack;
    if (errObj.code !== undefined) out.code = errObj.code;

    const status = errObj.status ?? errObj.statusCode ?? errObj.response?.status;
    if (status !== undefined) out.status = status;

    if (errObj.cause !== undefined) {
      try {
        out.cause = errObj.cause instanceof Error ? serializeError(errObj.cause) : errObj.cause;
      } catch {
        out.cause = String(errObj.cause);
      }
    }

    const details: Record<string, unknown> = {};
    if (errObj.response) {
      details['response'] = {
        status: errObj.response.status,
        statusText: errObj.response.statusText,
        data: errObj.response.data,
      };
    }
    if (errObj.details) details['details'] = errObj.details;
    if (Object.keys(details).length > 0) out.details = details;

    return out;
  }

  if (typeof input === 'string') {
    return { name: 'StringError', message: input };
  }

  if (input === null || input === undefined) {
    return { name: 'UnknownError', message: String(input) };
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    return {
      name: typeof obj['name'] === 'string' ? (obj['name'] as string) : 'UnknownError',
      message: typeof obj['message'] === 'string' ? (obj['message'] as string) : safeStringify(obj),
      details: obj as Record<string, unknown>,
    };
  }

  return { name: 'UnknownError', message: String(input) };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

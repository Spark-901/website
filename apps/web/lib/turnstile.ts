import { type NextRequest } from "next/server"
import { createLogger } from "@/lib/logger"

const log = createLogger({ service: "spark901-web" }).child({
  component: "lib.turnstile",
})

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

type SiteverifyResponse = {
  success: boolean
  "error-codes"?: string[]
}

function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  )
}

/**
 * Verify a Cloudflare Turnstile token via Siteverify.
 * Uses SPARK901_TURNSTILE_SECRET_KEY (server-only).
 */
export async function verifyTurnstileToken(
  token: unknown,
  request?: NextRequest,
): Promise<TurnstileVerifyResult> {
  if (typeof token !== "string" || token.trim().length === 0) {
    return { ok: false, status: 400, error: "Verification required." }
  }

  const secret = process.env.SPARK901_TURNSTILE_SECRET_KEY
  if (!secret) {
    log.error("SPARK901_TURNSTILE_SECRET_KEY is not configured")
    return {
      ok: false,
      status: 503,
      error: "Verification is temporarily unavailable.",
    }
  }

  try {
    const remoteip = request ? getClientIp(request) : undefined
    const body: Record<string, string> = {
      secret,
      response: token.trim(),
    }
    if (remoteip) {
      body.remoteip = remoteip
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      log.error("Turnstile siteverify HTTP error", undefined, {
        status: response.status,
      })
      return { ok: false, status: 502, error: "Verification failed. Please try again." }
    }

    const result = (await response.json()) as SiteverifyResponse
    if (!result.success) {
      log.warn("Turnstile verification rejected", {
        errorCodes: result["error-codes"] ?? [],
      })
      return { ok: false, status: 400, error: "Verification failed. Please try again." }
    }

    return { ok: true }
  } catch (error) {
    log.error("Turnstile verification request failed", error)
    return { ok: false, status: 502, error: "Verification failed. Please try again." }
  }
}

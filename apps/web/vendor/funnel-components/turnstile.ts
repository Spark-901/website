/**
 * Cloudflare Turnstile — client-side token acquisition.
 *
 * Zero-touch bot protection for every lead-capture form: `registerLeadInHub`
 * calls {@link getTurnstileToken} automatically, so no form component needs to
 * change. The widget renders invisibly (interaction-only) and only surfaces a
 * challenge if Cloudflare decides the visitor is suspicious.
 *
 * ## Setup
 *
 * There are THREE widgets, because a Turnstile widget caps at 10 hostnames and
 * widgets 1 and 2 filled up. An app sets exactly one pair:
 *
 * | Widget | Site key | Secret |
 * |---|---|---|
 * | 1 | `NEXT_PUBLIC_WTC_TURNSTILE_SITE_KEY` | `WTC_TURNSTILE_SECRET_KEY` |
 * | 2 | `NEXT_PUBLIC_WTC_TURNSTILE2_SITE_KEY` | `WTC_TURNSTILE2_SECRET_KEY` |
 * | 3 | `NEXT_PUBLIC_WTC_TURNSTILE3_SITE_KEY` | `WTC_TURNSTILE3_SECRET_KEY` |
 *
 * The highest-numbered widget that is set wins. Every widget is hostname-scoped,
 * so an app's domain must be on its widget's allowlist before the envs go on the
 * project. See engineering rule WTC_TURNSTILE_LEAD_CAPTURE for which app is on
 * which widget.
 *
 * If neither site key is set, {@link getTurnstileToken}
 * resolves to `null` and lead capture proceeds unprotected — this keeps local
 * dev and un-provisioned apps working. Protection is only enforced when BOTH
 * halves of the SAME widget's pair are configured — the server rejects a
 * missing/invalid token only when it has a secret.
 *
 * @module turnstile
 */

import { resolveTurnstileSiteKey } from './turnstile-widgets';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
/** Max time to wait for a token before giving up and resolving `null`. */
const TOKEN_TIMEOUT_MS = 15000;

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'timeout-callback'?: () => void;
  execution?: 'render' | 'execute';
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  action?: string;
}

interface TurnstileApi {
  render(el: HTMLElement, opts: TurnstileRenderOptions): string;
  execute(el: HTMLElement | string, opts?: { action?: string }): void;
  reset(widgetId?: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

/**
 * Read the public Turnstile site key (trimmed), or `undefined` if unset.
 * The highest-numbered configured widget takes precedence — see
 * `./turnstile-widgets`.
 */
export function getTurnstileSiteKey(): string | undefined {
  return resolveTurnstileSiteKey()?.siteKey;
}

/** Inject the Turnstile script exactly once and resolve when it is ready. */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile script can only load in the browser'));
  }
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => {
      scriptPromise = null; // allow a later retry
      reject(new Error('Turnstile script failed to load'));
    });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Acquire a Turnstile token for the current visitor.
 *
 * Resolves to `null` (never rejects) when Turnstile is not configured, cannot
 * load, errors, or times out — callers treat `null` as "no token" and let the
 * server decide whether that is acceptable.
 *
 * @param action - Optional action label recorded on the Cloudflare assessment.
 * @param siteKey - Explicit site key to use instead of resolving one of the
 *   three WTC widget env vars (see {@link getTurnstileSiteKey}). Pass this
 *   when the caller is NOT a WTC-widget-provisioned app — e.g. a different
 *   site with its own Cloudflare Turnstile widget/site key (see
 *   `EmailCaptureForm`'s `turnstileSiteKey` prop). Falls back to the WTC
 *   widget resolution when omitted, so every existing caller is unaffected.
 */
export async function getTurnstileToken(
  action = 'lead',
  siteKey?: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const sitekey = siteKey?.trim() || getTurnstileSiteKey();
  if (!sitekey) return null;

  try {
    await loadTurnstileScript();
  } catch {
    return null;
  }

  const api = window.turnstile;
  if (!api) return null;

  return new Promise<string | null>((resolve) => {
    const container = document.createElement('div');
    // Keep the (normally invisible) widget out of layout flow; interaction-only
    // appearance means it only becomes visible if a challenge is required.
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.right = '0';
    container.style.zIndex = '2147483647';
    document.body.appendChild(container);

    let settled = false;
    let widgetId: string | undefined;

    const finish = (token: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        if (widgetId) api.remove(widgetId);
      } catch {
        // widget already gone — nothing to clean up
      }
      container.remove();
      resolve(token);
    };

    const timer = setTimeout(() => finish(null), TOKEN_TIMEOUT_MS);

    try {
      widgetId = api.render(container, {
        sitekey,
        execution: 'execute',
        appearance: 'interaction-only',
        retry: 'never',
        action,
        callback: (token) => finish(token),
        'error-callback': () => finish(null),
        'timeout-callback': () => finish(null),
      });
      api.execute(widgetId, { action });
    } catch {
      finish(null);
    }
  });
}

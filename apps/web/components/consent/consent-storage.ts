/**
 * Cookie-backed storage for analytics consent state.
 *
 * Kept tiny and dependency-free so it can run in client components without
 * pulling in a settings store. Bump CONSENT_VERSION if the categories ever
 * change, so returning visitors re-prompt.
 */

export const CONSENT_COOKIE = "sp901_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_CHANGE_EVENT = "sp901-consent-change";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export type ConsentState = Readonly<{
  v: number;
  essential: true;
  analytics: boolean;
  setAt: string;
}>;

function isConsentState(value: unknown): value is ConsentState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.v === "number" &&
    v.essential === true &&
    typeof v.analytics === "boolean" &&
    typeof v.setAt === "string"
  );
}

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(/;\s*/)
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  const encoded = raw.slice(CONSENT_COOKIE.length + 1);
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(encoded));
    if (!isConsentState(parsed)) return null;
    if (parsed.v !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): ConsentState {
  const state: ConsentState = {
    v: CONSENT_VERSION,
    essential: true,
    analytics,
    setAt: new Date().toISOString(),
  };
  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(state));
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  }
  return state;
}

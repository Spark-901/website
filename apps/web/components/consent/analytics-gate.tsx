"use client"

import { useSyncExternalStore } from "react"

import { GoogleAnalytics } from "@spark901/analytics"

import { CONSENT_CHANGE_EVENT, readConsent } from "./consent-storage"

function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
}

/**
 * Only renders GoogleAnalytics once the visitor has accepted analytics
 * cookies (see components/consent/cookie-banner.tsx). Reacts live to the
 * banner via CONSENT_CHANGE_EVENT — no reload required.
 */
export function AnalyticsGate({ measurementId }: { measurementId?: string }) {
  const analyticsConsent = useSyncExternalStore(
    subscribe,
    () => readConsent()?.analytics ?? false,
    () => false,
  )

  return (
    <GoogleAnalytics measurementId={analyticsConsent ? measurementId : undefined} />
  )
}

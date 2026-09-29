import Script from "next/script"

/**
 * Google Analytics (gtag.js) — drop this once in a root layout.
 *
 * No-ops when `measurementId` is empty, so local/preview envs without a
 * NEXT_PUBLIC_GA_MEASUREMENT_ID set don't pollute the real Google Analytics
 * property with dev traffic.
 */
export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}

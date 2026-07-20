import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"
import { defaultLocale, locales, type Locale } from "./config"

export default getRequestConfig(async ({ requestLocale }) => {
  // Prefer the `[locale]` segment from the URL (critical for /es SEO + messages).
  const requested = await requestLocale
  let locale: Locale = defaultLocale

  if (requested && locales.includes(requested as Locale)) {
    locale = requested as Locale
  } else {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale
    } else {
      const headersList = await headers()
      const acceptLanguage = headersList.get("accept-language")
      const browserLocale = acceptLanguage?.split(",")[0]?.split("-")[0] as Locale | undefined
      if (browserLocale && locales.includes(browserLocale)) {
        locale = browserLocale
      }
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

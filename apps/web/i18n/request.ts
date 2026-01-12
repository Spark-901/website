import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"
import { defaultLocale, locales, type Locale } from "./config"

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined

  // Then try Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get("accept-language")
  const browserLocale = acceptLanguage?.split(",")[0]?.split("-")[0] as Locale | undefined

  // Determine the locale
  let locale: Locale = defaultLocale
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale
  } else if (browserLocale && locales.includes(browserLocale)) {
    locale = browserLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

import createMiddleware from "next-intl/middleware"
import { locales, defaultLocale } from "./i18n/config"

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
})

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|manifest\\.json).*)",
  ],
}

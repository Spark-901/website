export const locales = ["en", "es", "ja", "zh"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ja: "日本語",
  zh: "中文",
}

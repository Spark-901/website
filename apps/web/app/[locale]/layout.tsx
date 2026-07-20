import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import { locales, type Locale } from "@/i18n/config"
import { brand } from "@/lib/brand"
import {
  SITE_URL,
  absoluteUrl,
  createPageMetadata,
  organizationJsonLd,
  websiteJsonLd,
  isLocale,
} from "@/lib/seo"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : "en"
  const messages = (await import(`../../messages/${locale}.json`)).default
  const base = createPageMetadata({
    locale,
    path: "/",
    title: messages.metadata.title,
    description: messages.metadata.description,
    absoluteTitle: true,
  })

  return {
    ...base,
    metadataBase: new URL(SITE_URL),
    applicationName: brand.name,
    authors: [{ name: brand.name, url: SITE_URL }],
    creator: brand.name,
    publisher: brand.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    keywords: [
      "nonprofit technology",
      "open source",
      "social impact",
      "Memphis",
      "civic tech",
      "nonprofit software",
      "volunteer management",
      "grant tracking",
      "901",
    ],
    icons: {
      icon: [
        { url: brand.logo.icon, type: "image/svg+xml" },
        { url: brand.logo.png192, type: "image/png", sizes: "192x192" },
        { url: brand.logo.png512, type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: brand.logo.apple, sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.json",
    title: {
      default: messages.metadata.title,
      template: `%s | ${brand.name}`,
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <link rel="image_src" href={absoluteUrl(brand.logo.og)} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}

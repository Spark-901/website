import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://spark901.org"),
  title: {
    default: "Spark901 | Code for Good. Powered in Memphis.",
    template: "%s | Spark901",
  },
  description:
    "Open-source software infrastructure that helps nonprofits and community organizations scale their impact—faster, cheaper, and sustainably.",
  keywords: [
    "nonprofit technology",
    "open source",
    "social impact",
    "Memphis",
    "community",
    "software",
    "civic tech",
    "nonprofit software",
    "volunteer management",
    "grant tracking",
  ],
  authors: [{ name: "Spark901", url: "https://spark901.org" }],
  creator: "Spark901",
  publisher: "Spark901",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_US",
    url: "https://spark901.org",
    siteName: "Spark901",
    title: "Spark901 | Code for Good. Powered in Memphis.",
    description:
      "Open-source software infrastructure that helps nonprofits and community organizations scale their impact.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spark901 - Code for Good. Powered in Memphis.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spark901 | Code for Good. Powered in Memphis.",
    description:
      "Open-source software infrastructure that helps nonprofits and community organizations scale their impact.",
    images: ["/og-image.png"],
    creator: "@spark901",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://spark901.org",
    languages: {
      en: "https://spark901.org",
      es: "https://spark901.org/es",
    },
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3A9AD9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Spark901",
    url: "https://spark901.org",
    logo: "https://spark901.org/logo.png",
    description:
      "Open-source software infrastructure that helps nonprofits and community organizations scale their impact.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Memphis",
      addressRegion: "TN",
      addressCountry: "US",
    },
    sameAs: ["https://github.com/spark901", "https://twitter.com/spark901", "https://linkedin.com/company/spark901"],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
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

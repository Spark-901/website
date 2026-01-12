import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}

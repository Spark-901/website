import type { Metadata } from "next"
import { AboutClient } from "./about-client"

export const metadata: Metadata = {
  title: "About",
  description:
    "Spark901 is a for-good, open-source software studio based in Memphis, Tennessee. We believe technology should be a force multiplier for social impact.",
  openGraph: {
    title: "About Spark901",
    description: "Meet the Memphis-based team building open-source technology for social good.",
  },
}

export default function AboutPage() {
  return <AboutClient />
}

import type { Metadata } from "next"
import { WhyFundClient } from "./why-fund-client"

export const metadata: Metadata = {
  title: "Why Fund Open-Source Tech?",
  description:
    "Learn how funding open-source technology creates permanent infrastructure that keeps giving back to hundreds of organizations for years to come.",
  openGraph: {
    title: "Why Fund Open-Source Tech? | Spark901",
    description: "Your dollar keeps working. Fund technology that creates permanent, scalable impact.",
  },
}

export default function WhyFundPage() {
  return <WhyFundClient />
}

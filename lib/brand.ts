// Centralized brand configuration for maintainability
export const brand = {
  name: "Spark901",
  tagline: "Code for Good. Powered in Memphis.",
  areaCode: "901",
  location: "Memphis, Tennessee",
  email: "hello@spark901.org",
  github: "https://github.com/spark901",
  twitter: "https://twitter.com/spark901",
  linkedin: "https://linkedin.com/company/spark901",

  // Legal
  legalEntity: "LLC",
  state: "Tennessee",
  isTaxDeductible: false,

  // Social proof stats - update these as they change
  stats: {
    nonprofitsHelped: 25,
    openSourceTools: 8,
    communityMembers: 500,
    fundingRaised: 75000,
    organizationsServed: 100,
    hoursSavedAnnually: 10000,
  },
} as const

// Funding tier presets for consistency
export const fundingTiers = {
  supporter: { amount: 10, label: "Supporter" },
  backer: { amount: 25, label: "Backer" },
  champion: { amount: 50, label: "Champion" },
  builder: { amount: 100, label: "Builder" },
  patron: { amount: 250, label: "Patron" },
} as const

// Trust badges and security messaging
export const trustSignals = {
  securePayment: "256-bit SSL encrypted",
  processor: "Powered by Stripe",
  openSource: "100% open source",
  noSubscription: "No hidden fees",
} as const

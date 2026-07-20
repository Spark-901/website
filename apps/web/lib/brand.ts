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
  /** Brand amber used in the spark mark / app icon (keep in sync with CSS `--brand`) */
  accent: "#E6A328",
  colors: {
    amber: "#E6A328",
    tile: "#121212",
    tileInverse: "#F5F5F5",
    ink: "#171717",
  },
  logo: {
    /** Favicon / app icon — theme-aware via prefers-color-scheme */
    icon: "/icon.svg",
    /** Bare spark, inherits CSS color */
    mark: "/brand/spark-mark.svg",
    /** Bare spark, fixed amber */
    markAmber: "/brand/spark-mark-amber.svg",
    /** Horizontal lockup on white (schema.org Organization.logo) */
    lockup: "/logo.png",
    /** Horizontal lockup on dark */
    lockupDark: "/logo-dark.png",
    /** Default Open Graph / Twitter share image (1200×630) */
    og: "/og-image.png",
    apple: "/apple-touch-icon.png",
    png192: "/icon-192.png",
    png512: "/icon-512.png",
  },

  // Legal
  legalEntity: "LLC",
  state: "Tennessee",
  isTaxDeductible: false,

  // Social proof stats - update these as they change
  stats: {
    nonprofitsHelped: 25,
    openSourceTools: 8,
    communityMembers: 500,
    fundingRaised: 0,
    organizationsServed: 100,
    hoursSavedAnnually: 10000,
  },

  // Memphis metro nonprofit sector — keep in sync with public messaging and .cursor rules
  memphisNonprofitHub: {
    /** Nonprofits per 10,000 residents; Memphis leads major U.S. metros on this measure */
    nonprofitsPer10k: 69.9,
    /** Tax-exempt nonprofits in the Memphis area (rounded headline figure) */
    taxExemptNonprofitCountMin: 6500,
    /** People employed by those organizations (rounded headline figure) */
    peopleEmployedMin: 96000,
    /** Aggregate assets in billions USD (rounded headline figure) */
    assetsBillionsMin: 46,
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

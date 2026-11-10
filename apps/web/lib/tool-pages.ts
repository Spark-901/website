import { getProjectBySlug, type Project } from "@/lib/projects"

/**
 * SEO landing-page copy per tool (GitHub Spark-901/website#21).
 * Keep claims honest: every tool is in development; nothing here promises
 * shipped features, tax treatment, or named competitor facts.
 */
export interface ToolPageContent {
  slug: string
  /** Primary search phrase this page targets (Semrush US, 2026-09-30). */
  primaryKeyword: string
  /** <title> (rendered through the site's "| Spark901" template). */
  seoTitle: string
  seoDescription: string
  h1: string
  intro: string
  problems: string[]
  plannedFeatures: string[]
  /** Comparison vs the usual alternatives; no competitor product claims. */
  versus: { alternative: string; point: string }[]
  faqs: { q: string; a: string }[]
  keywords: string[]
}

const OPEN_SOURCE_FAQ = {
  q: "Is it really free?",
  a: "Spark901 builds open-source software. The code is published on GitHub and is free to use. Development is funded by contributions and sponsorships, which are generally not tax-deductible because Spark901 is an LLC, not a 501(c)(3).",
}

const STATUS_FAQ = {
  q: "Can I use it today?",
  a: "Not yet. This tool is in development. You can back the build, join the beta list, and follow progress on GitHub.",
}

export const toolPages: ToolPageContent[] = [
  {
    slug: "volunteer-scheduler",
    primaryKeyword: "free volunteer management software",
    seoTitle: "Free Open-Source Volunteer Management Software",
    seoDescription:
      "Volunteer Scheduler is open-source volunteer management software for nonprofits: shifts, hours, and volunteer communication in one place. In development in Memphis, TN.",
    h1: "Volunteer Scheduler: free, open-source volunteer management",
    intro:
      "Volunteer Scheduler is an open-source tool to coordinate volunteer shifts, track hours, and keep your volunteer base informed, without spreadsheet chaos or double-bookings. Built for food banks, shelters, community centers, and any organization that runs on volunteers.",
    problems: [
      "Shift sign-ups scattered across spreadsheets, group texts, and email threads",
      "Double-booked or unfilled shifts discovered at the last minute",
      "Volunteer hours tracked by hand for reports and funders",
    ],
    plannedFeatures: [
      "Shift scheduling and sign-up",
      "Volunteer hour tracking",
      "Volunteer communication",
      "Mobile-friendly volunteer views",
      "Admin portal with data exports",
    ],
    versus: [
      {
        alternative: "Spreadsheets and group chats",
        point:
          "One shared schedule instead of many copies, with sign-ups and hours recorded in the same place.",
      },
      {
        alternative: "Paid volunteer platforms",
        point:
          "Open source, so there is no per-seat fee and your organization can inspect, self-host, or adapt the code.",
      },
    ],
    faqs: [
      OPEN_SOURCE_FAQ,
      STATUS_FAQ,
      {
        q: "Who is it built for?",
        a: "Organizations that rely on volunteers, especially those coordinating 50 or more.",
      },
    ],
    keywords: [
      "free volunteer management software",
      "volunteer scheduling software nonprofit",
      "open source volunteer management",
    ],
  },
  {
    slug: "grant-tracker",
    primaryKeyword: "grant tracking software",
    seoTitle: "Free Grant Tracking Software for Nonprofits (Open Source)",
    seoDescription:
      "Grant Tracker Pro is open-source grant tracking software for nonprofits: applications, deadlines, documents, and funder reports in one place. In development in Memphis, TN.",
    h1: "Grant Tracker Pro: free, open-source grant tracking software",
    intro:
      "Grant Tracker Pro is an open-source platform for tracking grant applications, managing deadlines, storing documents, and reporting outcomes across the nonprofit grant lifecycle. Built for small and mid-size nonprofits without a dedicated grant writer or development team.",
    problems: [
      "Deadlines and requirements living in personal calendars and inboxes",
      "Application status unclear when staff or volunteers change",
      "Outcome reports rebuilt from scratch for every funder",
    ],
    plannedFeatures: [
      "Application tracker with statuses and deadlines",
      "Document storage per grant",
      "Reporting basics for funder outcome reports",
      "Pilot program with real nonprofits before v1.0",
    ],
    versus: [
      {
        alternative: "Spreadsheets",
        point:
          "Deadlines, statuses, and documents linked together instead of separate tabs that drift out of date.",
      },
      {
        alternative: "Paid grant-management suites",
        point:
          "Open source and free to use, aimed at organizations that cannot justify enterprise pricing.",
      },
    ],
    faqs: [
      OPEN_SOURCE_FAQ,
      STATUS_FAQ,
      {
        q: "Does it find grants for me?",
        a: "No. It is planned as a tracker for grants you pursue, not a grant database or a promise of any award.",
      },
    ],
    keywords: [
      "grant tracking software",
      "free grant tracking software",
      "nonprofit grant management",
    ],
  },
  {
    slug: "impact-dashboard",
    primaryKeyword: "free nonprofit software",
    seoTitle: "Free Nonprofit Impact Dashboard (Open Source)",
    seoDescription:
      "Impact Dashboard is open-source nonprofit software that turns program data into clear, board-ready impact reports. In development in Memphis, TN.",
    h1: "Impact Dashboard: free, open-source impact reporting",
    intro:
      "Impact Dashboard is an open-source tool for visualizing program outcomes and producing board-ready impact reports, so small organizations can show funders and boards what their work achieves.",
    problems: [
      "Outcome data stuck in separate tools and files",
      "Hours spent assembling charts for each board or funder report",
      "No simple way to share results with supporters",
    ],
    plannedFeatures: [
      "Core impact charts",
      "Data connectors for common nonprofit tools",
      "Shareable, board-ready report exports",
    ],
    versus: [
      {
        alternative: "Manual reports in slides or documents",
        point: "Charts generated from your data instead of rebuilt by hand each cycle.",
      },
      {
        alternative: "General-purpose BI tools",
        point:
          "Aimed at nonprofit reporting needs and free to adopt, without analyst-level setup.",
      },
    ],
    faqs: [OPEN_SOURCE_FAQ, STATUS_FAQ],
    keywords: [
      "free nonprofit software",
      "nonprofit impact dashboard",
      "open source nonprofit software",
    ],
  },
  {
    slug: "community-hub",
    primaryKeyword: "open source nonprofit software",
    seoTitle: "Open-Source Community Hub for Nonprofits",
    seoDescription:
      "Community Hub is open-source member and community engagement software for nonprofits: directory, events, and forums with your own branding. In development in Memphis, TN.",
    h1: "Community Hub: open-source community platform for nonprofits",
    intro:
      "Community Hub is an open-source platform for member directories, events, and discussion, with theming so each organization can present it under its own brand. Built for nonprofits and community organizations that want to own their community space.",
    problems: [
      "Members and supporters split across social platforms you do not control",
      "Event and membership information kept in separate tools",
      "Per-seat fees that grow with your community",
    ],
    plannedFeatures: [
      "Member directory and basic membership profiles",
      "Events and forums",
      "White-label theming for organization branding",
    ],
    versus: [
      {
        alternative: "Social media groups",
        point: "A community space your organization owns, not a platform that can change the rules.",
      },
      {
        alternative: "Paid community platforms",
        point: "Open source, so you can self-host or adapt it without per-member pricing.",
      },
    ],
    faqs: [OPEN_SOURCE_FAQ, STATUS_FAQ],
    keywords: [
      "open source nonprofit software",
      "nonprofit community platform",
      "free nonprofit software",
    ],
  },
]

export function getToolPage(slug: string): ToolPageContent | undefined {
  return toolPages.find((t) => t.slug === slug)
}

export function getToolPageProject(slug: string): Project | undefined {
  return getProjectBySlug(slug)
}

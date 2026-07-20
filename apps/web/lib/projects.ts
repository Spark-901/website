export interface Project {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  whoItHelps: string
  fundingGoal: number
  fundingRaised: number
  backers: number
  monthlyBackers: number
  status: "active" | "funded" | "in-development"
  category: string
  impactMetrics: {
    label: string
    value: string
  }[]
  fundingTiers: {
    name: string
    amount: number
    description: string
    benefits: string[]
  }[]
  githubUrl?: string
  imageQuery: string
  adoptingOrganizations?: {
    name: string
    logoUrl?: string
    website?: string
    note?: string
  }[]
  liveSavings?: {
    label: string
    baseValue: number
    incrementAmount: number
    intervalMs: number
    prefix?: string
    suffix?: string
  }
  milestones?: {
    title: string
    targetAmount: number
    status: "completed" | "in-progress" | "pending"
    description?: string
  }[]
}

// Campaign catalog — fundingRaised/backers stay at 0 until wired to Stripe webhooks + storage.
export const projects: Project[] = [
  {
    id: "proj_001",
    slug: "volunteer-scheduler",
    name: "Volunteer Scheduler",
    tagline: "Smart scheduling that respects everyone's time",
    description:
      "An open-source volunteer management system that helps nonprofits coordinate schedules, track hours, and communicate with their volunteer base. No more spreadsheet chaos or double-bookings.",
    whoItHelps:
      "Food banks, shelters, community centers, and any organization that relies on volunteers. Especially valuable for orgs managing 50+ volunteers.",
    fundingGoal: 15000,
    fundingRaised: 0,
    backers: 0,
    monthlyBackers: 0,
    status: "active",
    category: "Operations",
    impactMetrics: [
      { label: "Target orgs (first release)", value: "10+" },
      { label: "Hours saved goal / month", value: "100+" },
      { label: "License", value: "Open source" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 50,
        description: "Help us build essential features",
        benefits: ["Progress updates by email", "Listed as an early backer"],
      },
      {
        name: "Builder",
        amount: 250,
        description: "Fund a specific feature sprint",
        benefits: ["All Supporter benefits", "Early access when beta opens"],
      },
      {
        name: "Champion",
        amount: 1000,
        description: "Major impact on development",
        benefits: ["All Builder benefits", "Roadmap input with the team"],
      },
      {
        name: "Founding Sponsor",
        amount: 5000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named recognition on project materials"],
      },
    ],
    githubUrl: "https://github.com/spark901/volunteer-scheduler",
    imageQuery: "volunteer management app dashboard modern",
    adoptingOrganizations: [
      {
        name: "RiseTN",
        website: "https://risetn.org",
        note: "Memphis mobile services — coordinating volunteers & community programs",
      },
      {
        name: "Restore Corps (Freed Life)",
        website: "https://restorecorps.org",
        note: "West TN anti-trafficking care — volunteer & program scheduling",
      },
    ],
    milestones: [
      { title: "Core Framework", targetAmount: 3000, status: "pending", description: "Base infrastructure and auth" },
      { title: "Beta Release", targetAmount: 7500, status: "pending", description: "Mobile-responsive volunteer views" },
      { title: "Admin Portal", targetAmount: 12000, status: "pending", description: "Nonprofit dashboard and analytics" },
      { title: "v1.0 Launch", targetAmount: 15000, status: "pending", description: "Public release with data exports" },
    ],
  },
  {
    id: "proj_002",
    slug: "grant-tracker",
    name: "Grant Tracker Pro",
    tagline: "Never miss a deadline again",
    description:
      "A comprehensive grant management platform that helps nonprofits track applications, manage deadlines, store documents, and report outcomes. Built specifically for the nonprofit grant lifecycle.",
    whoItHelps:
      "Small to mid-size nonprofits managing multiple grants, especially those without dedicated grant writers or development staff.",
    fundingGoal: 25000,
    fundingRaised: 0,
    backers: 0,
    monthlyBackers: 0,
    status: "active",
    category: "Fundraising",
    impactMetrics: [
      { label: "Grants tracked (goal)", value: "Multi-grant" },
      { label: "Admin time saved (goal)", value: "Hours/week" },
      { label: "License", value: "Open source" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 100,
        description: "Support core grant workflow",
        benefits: ["Progress updates by email", "Listed as an early backer"],
      },
      {
        name: "Builder",
        amount: 500,
        description: "Fund feature development",
        benefits: ["All Supporter benefits", "Early access when beta opens"],
      },
      {
        name: "Champion",
        amount: 2500,
        description: "Major development support",
        benefits: ["All Builder benefits", "Roadmap input with the team"],
      },
      {
        name: "Founding Sponsor",
        amount: 10000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named recognition on project materials"],
      },
    ],
    githubUrl: "https://github.com/spark901/grant-tracker",
    imageQuery: "grant management software nonprofit dashboard",
    milestones: [
      { title: "Application tracker", targetAmount: 6000, status: "pending", description: "Deadlines, statuses, documents" },
      { title: "Reporting basics", targetAmount: 14000, status: "pending", description: "Outcome reports for funders" },
      { title: "Beta with pilot orgs", targetAmount: 20000, status: "pending", description: "Real-world nonprofit pilots" },
      { title: "v1.0 Launch", targetAmount: 25000, status: "pending", description: "Public open-source release" },
    ],
  },
  {
    id: "proj_003",
    slug: "impact-dashboard",
    name: "Impact Dashboard",
    tagline: "Tell your story with data",
    description:
      "A beautiful, easy-to-use analytics dashboard that helps nonprofits visualize and share their impact. Connect your existing tools and generate reports that funders actually want to see.",
    whoItHelps:
      "Any nonprofit that needs to report outcomes to funders, boards, or the community. Especially valuable for organizations collecting data across multiple programs.",
    fundingGoal: 20000,
    fundingRaised: 0,
    backers: 0,
    monthlyBackers: 0,
    status: "active",
    category: "Reporting",
    impactMetrics: [
      { label: "Report time (goal)", value: "Minutes, not days" },
      { label: "Audience", value: "Boards & funders" },
      { label: "License", value: "Open source" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 75,
        description: "Help us build core visualizations",
        benefits: ["Progress updates by email", "Listed as an early backer"],
      },
      {
        name: "Builder",
        amount: 350,
        description: "Fund a chart type or integration",
        benefits: ["All Supporter benefits", "Early access when beta opens"],
      },
      {
        name: "Champion",
        amount: 1500,
        description: "Major feature development",
        benefits: ["All Builder benefits", "Roadmap input with the team"],
      },
      {
        name: "Founding Sponsor",
        amount: 7500,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named recognition on project materials"],
      },
    ],
    githubUrl: "https://github.com/spark901/impact-dashboard",
    imageQuery: "data analytics dashboard nonprofit impact metrics",
    milestones: [
      { title: "Core charts", targetAmount: 5000, status: "pending", description: "Essential impact visualizations" },
      { title: "Data connectors", targetAmount: 12000, status: "pending", description: "Import from common nonprofit tools" },
      { title: "Shareable reports", targetAmount: 16000, status: "pending", description: "Board-ready exports" },
      { title: "v1.0 Launch", targetAmount: 20000, status: "pending", description: "Public open-source release" },
    ],
  },
  {
    id: "proj_004",
    slug: "community-hub",
    name: "Community Hub",
    tagline: "Your community, connected",
    description:
      "A white-label community platform that helps organizations build engaged member communities. Forums, events, resources, and member directories—all in one place, all open source.",
    whoItHelps:
      "Membership organizations, alumni networks, professional associations, and community groups looking for an alternative to expensive proprietary platforms.",
    fundingGoal: 30000,
    fundingRaised: 0,
    backers: 0,
    monthlyBackers: 0,
    status: "active",
    category: "Community",
    impactMetrics: [
      { label: "Modules (goal)", value: "Forums · Events · Directory" },
      { label: "Cost model", value: "Self-host friendly" },
      { label: "License", value: "Open source" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 100,
        description: "Support community features",
        benefits: ["Progress updates by email", "Listed as an early backer"],
      },
      {
        name: "Builder",
        amount: 500,
        description: "Fund a module development",
        benefits: ["All Supporter benefits", "Early access when beta opens"],
      },
      {
        name: "Champion",
        amount: 2000,
        description: "Major platform development",
        benefits: ["All Builder benefits", "Roadmap input with the team"],
      },
      {
        name: "Founding Sponsor",
        amount: 10000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named recognition on project materials"],
      },
    ],
    githubUrl: "https://github.com/spark901/community-hub",
    imageQuery: "community platform app modern social network",
    adoptingOrganizations: [
      {
        name: "Restore Corps (Freed Life)",
        website: "https://restorecorps.org",
        note: "Community education & survivor-support engagement across West Tennessee",
      },
      {
        name: "RiseTN",
        website: "https://risetn.org",
        note: "Neighborhood-connected programming and partner coordination in Memphis",
      },
    ],
    milestones: [
      { title: "Member directory", targetAmount: 8000, status: "pending", description: "Profiles and basic membership" },
      { title: "Events + forums", targetAmount: 18000, status: "pending", description: "Core engagement modules" },
      { title: "White-label theming", targetAmount: 24000, status: "pending", description: "Org branding support" },
      { title: "v1.0 Launch", targetAmount: 30000, status: "pending", description: "Public open-source release" },
    ],
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getProjectsByStatus(status: Project["status"]): Project[] {
  return projects.filter((p) => p.status === status)
}

export function getAllProjects(): Project[] {
  return projects
}

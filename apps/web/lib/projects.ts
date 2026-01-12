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
}

// Sample projects - replace with your actual projects
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
    fundingRaised: 8750,
    backers: 47,
    monthlyBackers: 12,
    status: "active",
    category: "Operations",
    impactMetrics: [
      { label: "Hours Saved Monthly", value: "120+" },
      { label: "Volunteer Retention", value: "+35%" },
      { label: "Organizations Ready to Use", value: "50+" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 50,
        description: "Help us build essential features",
        benefits: ["Name on supporters page", "Monthly progress updates"],
      },
      {
        name: "Builder",
        amount: 250,
        description: "Fund a specific feature sprint",
        benefits: ["All Supporter benefits", "Early access to new features", "Quarterly impact reports"],
      },
      {
        name: "Champion",
        amount: 1000,
        description: "Major impact on development",
        benefits: ["All Builder benefits", "Logo on project page", "Direct line to dev team"],
      },
      {
        name: "Founding Sponsor",
        amount: 5000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named feature dedication", "Speaking opportunity at launch"],
      },
    ],
    githubUrl: "https://github.com/spark901/volunteer-scheduler",
    imageQuery: "volunteer management app dashboard modern",
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
    fundingRaised: 25000,
    backers: 89,
    monthlyBackers: 23,
    status: "funded",
    category: "Fundraising",
    impactMetrics: [
      { label: "Grant Success Rate", value: "+28%" },
      { label: "Admin Time Saved", value: "15 hrs/week" },
      { label: "Currently in Beta", value: "12 orgs" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 100,
        description: "Support ongoing maintenance",
        benefits: ["Name on supporters page", "Monthly progress updates"],
      },
      {
        name: "Builder",
        amount: 500,
        description: "Fund feature enhancements",
        benefits: ["All Supporter benefits", "Early access to new features", "Quarterly impact reports"],
      },
      {
        name: "Champion",
        amount: 2500,
        description: "Major development support",
        benefits: ["All Builder benefits", "Logo on project page", "Advisory input on roadmap"],
      },
      {
        name: "Founding Sponsor",
        amount: 10000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named module dedication", "Featured case study"],
      },
    ],
    githubUrl: "https://github.com/spark901/grant-tracker",
    imageQuery: "grant management software nonprofit dashboard",
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
    fundingRaised: 3200,
    backers: 18,
    monthlyBackers: 5,
    status: "active",
    category: "Reporting",
    impactMetrics: [
      { label: "Report Generation Time", value: "-80%" },
      { label: "Funder Satisfaction", value: "+45%" },
      { label: "Data Sources Supported", value: "15+" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 75,
        description: "Help us build core visualizations",
        benefits: ["Name on supporters page", "Monthly progress updates"],
      },
      {
        name: "Builder",
        amount: 350,
        description: "Fund a chart type or integration",
        benefits: ["All Supporter benefits", "Early access to new features", "Quarterly impact reports"],
      },
      {
        name: "Champion",
        amount: 1500,
        description: "Major feature development",
        benefits: ["All Builder benefits", "Logo on project page", "Custom integration priority"],
      },
      {
        name: "Founding Sponsor",
        amount: 7500,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named dashboard theme", "Launch event recognition"],
      },
    ],
    githubUrl: "https://github.com/spark901/impact-dashboard",
    imageQuery: "data analytics dashboard nonprofit impact metrics",
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
    fundingRaised: 12500,
    backers: 34,
    monthlyBackers: 8,
    status: "active",
    category: "Community",
    impactMetrics: [
      { label: "Member Engagement", value: "+60%" },
      { label: "Platform Cost Savings", value: "$5K/year" },
      { label: "Beta Communities", value: "8" },
    ],
    fundingTiers: [
      {
        name: "Supporter",
        amount: 100,
        description: "Support community features",
        benefits: ["Name on supporters page", "Monthly progress updates"],
      },
      {
        name: "Builder",
        amount: 500,
        description: "Fund a module development",
        benefits: ["All Supporter benefits", "Early access to new features", "Quarterly impact reports"],
      },
      {
        name: "Champion",
        amount: 2000,
        description: "Major platform development",
        benefits: ["All Builder benefits", "Logo on project page", "Theme customization support"],
      },
      {
        name: "Founding Sponsor",
        amount: 10000,
        description: "Named sponsorship opportunity",
        benefits: ["All Champion benefits", "Named feature module", "Founding member recognition"],
      },
    ],
    githubUrl: "https://github.com/spark901/community-hub",
    imageQuery: "community platform app modern social network",
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

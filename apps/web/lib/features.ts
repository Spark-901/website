/**
 * Feature Flag System
 * 
 * This file centralizes all feature toggles for the Spark901 application.
 * Use environment variables to toggle features on/off.
 * 
 * To add a new feature flag:
 * 1. Add the environment variable to .env and .env.example
 * 2. Add the flag to the FEATURE_FLAGS object below
 */

export const FEATURE_FLAGS = {
  /**
   * Enables the Adoption Tracker and Live Savings components on project pages.
   */
  ADOPTION_TRACKER: process.env.NEXT_PUBLIC_ENABLE_ADOPTION_TRACKER === "true",

  /**
   * Enables GitHub activity (commits/issues) and Development Milestones on project pages.
   */
  ALIVENESS_SIGNALS: process.env.NEXT_PUBLIC_ENABLE_ALIVENESS_SIGNALS === "true",

  /**
   * Enables the Nonprofit Feedback Loop (Suggest a Tool and Beta Tester Signup).
   */
  NONPROFIT_FEEDBACK_LOOP: process.env.NEXT_PUBLIC_ENABLE_NONPROFIT_FEEDBACK_LOOP === "true",

  /**
   * Enables the "Gift a Tool" / Dedicated Funding feature.
   */
  GIFT_A_TOOL: process.env.NEXT_PUBLIC_ENABLE_GIFT_A_TOOL === "true",

  /**
   * Enables the Collierville Civic Archive page and its nav link — Spark901's
   * first live, working product (plain-language BMA meeting summaries +
   * downloadable PDFs). See personal-work/goals/collierville-civic-data.md.
   */
  CIVIC_ARCHIVE: process.env.NEXT_PUBLIC_ENABLE_CIVIC_ARCHIVE === "true",

  /**
   * Enables the "Ask the Archive" Q&A page and its nav link — a
   * proof-of-concept search box that answers free-text questions about
   * Collierville BMA meetings, grounded in real transcript content via
   * rag-gateway, with citations. Demo of Spark901's technical capability,
   * carries an explicit donate CTA. See
   * personal-work/goals/collierville-civic-data.md.
   */
  ASK_THE_ARCHIVE: process.env.NEXT_PUBLIC_ENABLE_ASK_THE_ARCHIVE === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Returns whether a specific feature is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

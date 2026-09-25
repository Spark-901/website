"use client"

import { useTranslations } from "next-intl"
import { EmailCaptureForm } from "@west-tennessee-consulting/funnel-components"

/**
 * "Stay up to date" email signup, standalone so it can be dropped anywhere
 * (footer today; nothing stops a future civic-archive/ask-the-archive page
 * from importing this directly once that work has landed — see this repo's
 * PR description for the hookup).
 *
 * UI/validation/state come from the shared, backend-agnostic
 * `EmailCaptureForm` (`@west-tennessee-consulting/funnel-components`, also
 * used by westtn.consulting's footer). This component supplies the two
 * things that differ per site: WHERE the email goes (this site's own
 * `/api/newsletter` route, which reuses the existing DynamoDB ops-ledger +
 * Slack-notify pipeline — see `app/api/newsletter/route.ts`) and THIS
 * site's own Turnstile site key (never hardcoded in the shared component).
 */
export function NewsletterSignup({ className }: { className?: string }) {
  const t = useTranslations("footer.newsletter")

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      <EmailCaptureForm
        className="mt-4"
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        turnstileAction="newsletter_signup"
        messages={{
          placeholder: t("placeholder"),
          required: t("emailRequired"),
          invalid: t("emailInvalid"),
          submitLabel: t("submitLabel"),
          submittingLabel: t("submittingLabel"),
          defaultSuccess: t("success"),
          defaultError: t("error"),
        }}
        inputClassName="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        buttonClassName="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        onSubmit={async (email, turnstileToken) => {
          const res = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, turnstileToken }),
          })
          const data = (await res.json().catch(() => null)) as
            | { success?: boolean; error?: string }
            | null
          return {
            success: res.ok && data?.success === true,
            message: data?.error,
          }
        }}
      />
    </div>
  )
}

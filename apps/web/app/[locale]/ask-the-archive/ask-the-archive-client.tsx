"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { TranscriptCaveatBanner } from "@spark901/meeting-summary-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TurnstileField } from "@/components/turnstile-field"
import { ArrowRight, Search } from "lucide-react"
import type { AskTheArchiveResponse } from "@/lib/civic-archive-ask"

const TRANSCRIPT_CAVEAT =
  "Answers are grounded in transcripts compiled from uncorrected closed captioning and may contain errors. This is not an official record of any meeting."

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: AskTheArchiveResponse }

export function AskTheArchiveClient() {
  const t = useTranslations("askTheArchive")
  const [question, setQuestion] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [state, setState] = useState<RequestState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!turnstileToken) {
      setState({ status: "error", message: t("turnstileRequired") })
      return
    }
    if (question.trim().length < 4) {
      setState({ status: "error", message: t("questionTooShort") })
      return
    }

    setState({ status: "loading" })
    try {
      const res = await fetch("/api/civic-archive/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), turnstileToken }),
      })
      const data = (await res.json()) as AskTheArchiveResponse | { error: string }
      if (!res.ok || "error" in data) {
        setState({
          status: "error",
          message: "error" in data ? data.error : t("genericError"),
        })
      } else {
        setState({ status: "done", result: data })
      }
    } catch {
      setState({ status: "error", message: t("genericError") })
    } finally {
      setTurnstileToken(null)
      setTurnstileKey((k) => k + 1)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero + search */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t("badge")}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-xl flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("inputPlaceholder")}
                maxLength={500}
                className="h-12 text-base"
                aria-label={t("inputLabel")}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 gap-2"
                disabled={state.status === "loading" || !turnstileToken}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {state.status === "loading" ? t("asking") : t("ask")}
              </Button>
            </div>
            <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} className="mx-auto" />
          </form>
        </div>
      </section>

      {/* Answer */}
      {state.status === "error" ? (
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {state.message}
          </div>
        </section>
      ) : null}

      {state.status === "done" ? (
        <section className="px-4 pb-16 sm:px-6 lg:px-8" aria-live="polite">
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <article className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <p className="text-base leading-relaxed text-foreground">{state.result.answer}</p>

              {state.result.citations.length > 0 ? (
                <div className="mt-6 flex flex-col gap-3 border-t pt-4">
                  <h2 className="text-sm font-semibold text-foreground">{t("citationsHeading")}</h2>
                  <ol className="flex flex-col gap-3">
                    {state.result.citations.map((c, i) => (
                      <li key={`${c.meetingDate}-${c.timestamp}-${i}`} className="border-l-2 border-border pl-4 text-sm">
                        <p className="font-medium text-foreground">
                          {c.meetingDate ? c.meetingDate : t("unknownMeeting")}
                          {c.agendaItem ? ` — ${c.agendaItem}` : ""}
                        </p>
                        <p className="mt-1 text-muted-foreground">{c.excerpt}</p>
                        {c.sourceUrl ? (
                          <a
                            href={c.sourceUrl}
                            className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {t("watchAt", { timestamp: c.timestamp })}
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <TranscriptCaveatBanner caveat={TRANSCRIPT_CAVEAT} className="mt-6" />
            </article>
          </div>
        </section>
      ) : null}

      {/* Donate CTA — this page is explicitly a proof-of-concept demo built
          to move a visitor to donate, so this is on-page and direct. */}
      <section className="bg-primary px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            {t("donateCtaTitle")}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{t("donateCtaBody")}</p>
          <Button asChild size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/fund/civic-archive">
              {t("donateCtaButton")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

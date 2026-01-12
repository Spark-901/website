"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Zap, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  const t = useTranslations("footer")
  const nav = useTranslations("nav")

  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2" aria-label="Spark901 - Go to homepage">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Spark901</span>
            </Link>
            <p className="mt-2 text-sm font-medium text-primary">{t("tagline")}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com/spark901"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Visit Spark901 on GitHub"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com/spark901"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow Spark901 on Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com/company/spark901"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Connect with Spark901 on LinkedIn"
              >
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("navigation")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {nav("home")}
                </Link>
              </li>
              <li>
                <Link href="/fund" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {nav("fundATool")}
                </Link>
              </li>
              <li>
                <Link
                  href="/why-fund"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav("whyFund")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {nav("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/transparency"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav("transparency")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("legal")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@spark901.org"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">{t("copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useId, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  writeConsent,
} from "./consent-storage"

function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
}

/**
 * Bottom-anchored consent banner.
 *
 * Hidden once a consent cookie exists. "Manage" opens a dialog with an
 * analytics toggle (essential is locked on).
 */
export function CookieBanner() {
  const t = useTranslations("legal.cookieBanner")
  const hasConsent = useSyncExternalStore(
    subscribe,
    () => readConsent() !== null,
    () => true, // server snapshot: don't render until hydrated client-side
  )
  const [manageOpen, setManageOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const analyticsId = useId()

  if (hasConsent) return null

  const persist = (acceptAnalytics: boolean) => {
    writeConsent(acceptAnalytics)
    setManageOpen(false)
  }

  return (
    <>
      <div
        role="region"
        aria-label={t("title")}
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4"
      >
        <div className="bg-card text-card-foreground border-border/80 mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-xl border p-4 shadow-lg sm:flex-row sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("body")}{" "}
              <Link href="/cookie-policy" className="underline">
                {t("policyLink")}
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAnalytics(readConsent()?.analytics ?? false)
                setManageOpen(true)
              }}
            >
              {t("manage")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => persist(false)}>
              {t("essentialOnly")}
            </Button>
            <Button size="sm" onClick={() => persist(true)}>
              {t("acceptAll")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("manage")}</DialogTitle>
            <DialogDescription>{t("body")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="border-border/60 bg-muted/30 flex items-start gap-3 rounded-lg border p-3 text-sm opacity-80">
              <Checkbox checked disabled aria-label={t("essentialLabel")} className="mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium">{t("essentialLabel")}</p>
                <p className="text-muted-foreground text-xs">
                  {t("essentialDescription")}
                </p>
              </div>
            </div>

            <label
              htmlFor={analyticsId}
              className="border-border/60 hover:bg-muted/30 flex items-start gap-3 rounded-lg border p-3 text-sm transition"
            >
              <Checkbox
                id={analyticsId}
                checked={analytics}
                onCheckedChange={(checked) => setAnalytics(checked === true)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Label htmlFor={analyticsId} className="font-medium">
                  {t("analyticsLabel")}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {t("analyticsDescription")}
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setManageOpen(false)}>
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={() => persist(analytics)}>
              {t("savePreferences")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

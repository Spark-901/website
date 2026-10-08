"use client"

import { showCookiePreferences } from "@west-tennessee-consulting/cookie-consent"
import { Button } from "@/components/ui/button"

export function CookiePreferencesButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => showCookiePreferences()}>
      {label}
    </Button>
  )
}

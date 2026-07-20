"use client"

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { useEffect, useRef, useState } from "react"

type TurnstileFieldProps = {
  onTokenChange: (token: string | null) => void
  className?: string
}

function useDocumentTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setTheme(root.classList.contains("dark") ? "dark" : "light")
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return theme
}

/**
 * Cloudflare Turnstile widget for form spam protection.
 * Site key: NEXT_PUBLIC_TURNSTILE_SITE_KEY
 */
export function TurnstileField({ onTokenChange, className }: TurnstileFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const theme = useDocumentTheme()
  const [mounted, setMounted] = useState(false)
  const ref = useRef<TurnstileInstance | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Bot protection is not configured. Please try again later.
      </p>
    )
  }

  if (!mounted) {
    return <div className={className} aria-hidden="true" style={{ minHeight: 65 }} />
  }

  return (
    <div className={className}>
      <Turnstile
        key={theme}
        ref={ref}
        siteKey={siteKey}
        options={{
          theme,
          size: "flexible",
        }}
        onSuccess={(token) => onTokenChange(token)}
        onExpire={() => {
          onTokenChange(null)
          ref.current?.reset()
        }}
        onError={() => onTokenChange(null)}
        onTimeout={() => {
          onTokenChange(null)
          ref.current?.reset()
        }}
      />
    </div>
  )
}

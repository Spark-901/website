"use client"

import { useState } from "react"
import { Loader2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ManageContributionButtonProps {
  sessionId: string
  label: string
  returnPath: string
}

export function ManageContributionButton({
  sessionId,
  label,
  returnPath,
}: ManageContributionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openPortal = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, returnPath }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not open billing portal")
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        onClick={openPortal}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
        {label}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}

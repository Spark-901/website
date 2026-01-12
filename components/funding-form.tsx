"use client"

import type React from "react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, AlertCircle, Shield, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { trustSignals } from "@/lib/brand"

interface FundingFormProps {
  projectSlug: string
  projectTitle: string
  backers?: number
  monthlyBackers?: number
}

const presetAmounts = [10, 25, 50, 100, 250]

export function FundingForm({ projectSlug, projectTitle, backers = 0, monthlyBackers = 0 }: FundingFormProps) {
  const t = useTranslations("funding")
  const [amount, setAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAmount = customAmount ? Number.parseInt(customAmount) : amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug,
          amount: selectedAmount,
          isRecurring,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {backers > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center text-sm">
          <span className="font-medium text-primary">{backers} people</span>
          <span className="text-muted-foreground"> have already funded this project</span>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("selectAmount")}</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset)
                setCustomAmount("")
              }}
              className={`rounded-lg border-2 px-4 py-3 text-center font-semibold transition-all ${
                amount === preset && !customAmount
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            min="5"
            placeholder={t("customAmount")}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1"
          />
        </div>
        {customAmount && Number.parseInt(customAmount) < 5 && (
          <p className="text-sm text-destructive">{t("minimumAmount")}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("frequency")}</Label>
        <RadioGroup
          value={isRecurring ? "recurring" : "one-time"}
          onValueChange={(value) => setIsRecurring(value === "recurring")}
          className="grid grid-cols-2 gap-3"
        >
          <Label
            htmlFor="one-time"
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
              !isRecurring ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="one-time" id="one-time" className="sr-only" />
            <span className="font-medium">{t("oneTime")}</span>
          </Label>
          <Label
            htmlFor="recurring"
            className={`relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
              isRecurring ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
            }`}
          >
            <RadioGroupItem value="recurring" id="recurring" className="sr-only" />
            <span className="font-medium">{t("monthly")}</span>
            <Badge className="absolute -right-2 -top-2 bg-accent text-accent-foreground text-xs">
              {t("monthlyBadge")}
            </Badge>
          </Label>
        </RadioGroup>
        {isRecurring && monthlyBackers > 0 && (
          <p className="text-center text-xs text-muted-foreground">Join {monthlyBackers} other monthly supporters</p>
        )}
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("yourContribution")}</span>
          <span className="text-lg font-bold text-foreground">
            ${selectedAmount || 0}
            {isRecurring && <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("allGoesDirect", { project: projectTitle })}</p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
        disabled={isLoading || (customAmount !== "" && Number.parseInt(customAmount) < 5)}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
        {isLoading ? t("processing") : `${t("submitButton")} — $${selectedAmount || 0}`}
      </Button>

      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3" aria-hidden="true" />
          <span>{trustSignals.securePayment}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" aria-hidden="true" />
          <span>{trustSignals.processor}</span>
        </div>
      </div>
    </form>
  )
}

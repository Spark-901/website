"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface LiveSavingsCounterProps {
  baseValue: number
  incrementAmount: number
  intervalMs: number
  label: string
  prefix?: string
  suffix?: string
}

export function LiveSavingsCounter({
  baseValue,
  incrementAmount,
  intervalMs,
  label,
  prefix = "",
  suffix = "",
}: LiveSavingsCounterProps) {
  const [currentValue, setCurrentValue] = useState(baseValue)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValue((prev) => prev + incrementAmount)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [incrementAmount, intervalMs])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold text-accent">
          {prefix}{formatNumber(currentValue)}{suffix}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

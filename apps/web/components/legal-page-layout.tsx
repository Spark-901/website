"use client"

import { ReactNode } from "react"

interface LegalPageLayoutProps {
  title: string
  lastUpdated?: string
  children: ReactNode
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
          )}
        </header>

        <article className="prose prose-slate max-w-none dark:prose-invert prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-2xl prose-h2:font-bold prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-2">
          {children}
        </article>

        <footer className="mt-16 border-t border-border pt-8">
          <p className="text-sm italic text-muted-foreground">
            This document is for informational purposes and provides baseline legal protections. It
            is recommended that this document be reviewed by professional legal counsel to ensure it
            meets your specific organizational needs and complies with all local regulations.
          </p>
        </footer>
      </div>
    </div>
  )
}

"use client"

import { ReactNode } from "react"

interface LegalPageLayoutProps {
  title: string
  lastUpdated?: string
  children: ReactNode
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          )}
        </header>
        
        <article className="prose prose-slate dark:prose-invert max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-li:mb-2">
          {children}
        </article>
        
        <footer className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground italic">
            This document is for informational purposes and provides baseline legal protections. 
            It is recommended that this document be reviewed by professional legal counsel to ensure 
            it meets your specific organizational needs and complies with all local regulations.
          </p>
        </footer>
      </div>
    </main>
  )
}

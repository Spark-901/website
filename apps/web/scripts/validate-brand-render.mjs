#!/usr/bin/env node
// Guards against the 2026-09 bug: SparkLogo's fill-brand* classes referenced CSS
// custom properties that only existed in an orphaned, never-imported globals.css.
// Tailwind v4 silently never generated those utilities, so the spark mark/icon tile
// rendered unfilled/black everywhere (header, footer, hero, about, project pages),
// in both light and dark mode, and nothing caught it before deploy.
//
// This script checks the ACTUAL BUILD OUTPUT, not just source — it verifies the
// exact failure mode is impossible, regardless of how the theme wiring changes
// in the future. Run AFTER `next build` (needs .next/ to exist).
//
// Suppress a specific class if it's genuinely no longer used:
//   remove it from WATCHED_CLASSES below with a comment saying why.

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const WEB_ROOT = new URL("..", import.meta.url).pathname

// Every fill-* class SparkIcon/SparkMark (components/spark-logo.tsx) can emit for a
// custom brand token. If this list drifts from spark-logo.tsx, update both together.
const WATCHED_CLASSES = ["fill-brand", "fill-brand-tile", "fill-brand-tile-inverse"]

function findCssFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) findCssFiles(full, out)
    else if (entry.name.endsWith(".css")) out.push(full)
  }
  return out
}

function checkOrphanedGlobalsCss() {
  // The bug's root cause: a second globals.css existed that nothing imported.
  // Fail loudly if that shape ever recurs, before it even reaches the render check.
  const appDir = join(WEB_ROOT, "app")
  const allGlobals = findCssFiles(WEB_ROOT).filter((f) => f.endsWith("globals.css"))
  const sourceFiles = findCssFiles(WEB_ROOT, []) // no-op, kept for symmetry
  void sourceFiles
  const tsxFiles = []
  ;(function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) tsxFiles.push(full)
    }
  })(appDir)

  const imported = new Set()
  for (const f of tsxFiles) {
    const content = readFileSync(f, "utf8")
    const m = content.match(/import\s+["']([^"']*globals\.css)["']/)
    if (m) imported.add(new URL(m[1], `file://${f}`).pathname)
  }

  const orphans = allGlobals.filter((f) => !imported.has(f))
  if (orphans.length > 0) {
    console.error("[validate-brand-render] Orphaned globals.css file(s) found — nothing imports them:")
    for (const o of orphans) console.error(`  ${o}`)
    console.error(
      "A stylesheet that exists but is never imported is exactly how the brand-token bug happened. Delete it or import it."
    )
    return false
  }
  return true
}

function checkCompiledCssHasBrandFills() {
  const nextDir = join(WEB_ROOT, ".next")
  if (!existsSync(nextDir)) {
    console.error("[validate-brand-render] .next/ not found — run `next build` before this script.")
    return false
  }
  const cssFiles = findCssFiles(nextDir)
  if (cssFiles.length === 0) {
    console.error("[validate-brand-render] No compiled CSS found under .next/ — build may have failed.")
    return false
  }
  const compiled = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n")

  const missing = []
  for (const cls of WATCHED_CLASSES) {
    // Tailwind emits e.g. `.fill-brand-tile{fill:var(--brand-tile)}` — accept minified
    // or spaced variants, but require an actual `fill:` declaration, not just the
    // selector existing with no body (which shouldn't happen, but be strict anyway).
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const re = new RegExp(`\\.${escaped}\\s*\\{[^}]*fill\\s*:\\s*[^;}]+`)
    if (!re.test(compiled)) missing.push(cls)
  }

  if (missing.length > 0) {
    console.error("[validate-brand-render] These brand utility classes did not generate a real CSS rule:")
    for (const cls of missing) console.error(`  ${cls}`)
    console.error(
      "This is the exact bug from 2026-09: a class used in components/spark-logo.tsx has no matching " +
        "--color-* token in the @theme block of the stylesheet actually imported by app/[locale]/layout.tsx. " +
        "The logo will render unfilled/black. Check that the token is defined in BOTH :root/.dark AND @theme inline."
    )
    return false
  }
  return true
}

const okOrphan = checkOrphanedGlobalsCss()
const okRender = checkCompiledCssHasBrandFills()

if (!okOrphan || !okRender) {
  process.exit(1)
}
console.log(`[validate-brand-render] OK — no orphaned globals.css, all ${WATCHED_CLASSES.length} brand classes render.`)

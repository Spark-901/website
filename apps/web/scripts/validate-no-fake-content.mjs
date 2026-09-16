#!/usr/bin/env node
// Guards against the 2026-09 bug: three fabricated testimonials (invented names,
// stock headshot images, made-up quotes attributed to real-sounding Memphis
// nonprofits) were hardcoded directly in a page component and shipped to
// production looking like real customer testimonials.
//
// Two checks, both heuristic (regex, not a real AST) — good enough as a tripwire,
// not a substitute for review:
//   1. No object literal combining testimonial-shaped keys (quote + avatar/name/role)
//      hardcoded directly inside a page/component file. Real testimonials belong in
//      a reviewed data source (e.g. lib/testimonials.ts, a CMS, or Hub/Meridian),
//      never inline in JSX/TSX.
//   2. No reference to a known stock/generic person-photo filename from app/** or
//      components/**. Real testimonials get real photos with real filenames.
//
// Suppress a specific line if it's a genuine, reviewed exception:
//   // validate-content-allow: <reason>
// on the line directly above the flagged content.

import { readdirSync, readFileSync } from "node:fs"
import { join, extname } from "node:path"

const WEB_ROOT = new URL("..", import.meta.url).pathname
const SCAN_DIRS = ["app", "components"]
const EXCLUDE_DIR_NAMES = new Set(["node_modules", ".next", ".git", "ui", "__fixtures__", "__mocks__"])

// Known stock headshot filenames from the removed fake testimonials. Add to this
// list if a new stock-photo asset shows up — don't silently widen the pattern to
// match every image (real staff photos are fine).
const STOCK_PHOTO_PATTERNS = [
  /professional-[\w-]*headshot[\w-]*\.(png|jpe?g)/i,
  /professional-[\w-]*(man|woman)[\w-]*\.(png|jpe?g)/i,
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIR_NAMES.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if ([".tsx", ".ts", ".jsx", ".js"].includes(extname(entry.name))) out.push(full)
  }
  return out
}

function isSuppressed(lines, idx) {
  const prev = lines[idx - 1] ?? ""
  return /validate-content-allow:/.test(prev)
}

let failed = false
const files = SCAN_DIRS.flatMap((d) => walk(join(WEB_ROOT, d)))

for (const file of files) {
  const content = readFileSync(file, "utf8")
  const lines = content.split("\n")

  // Check 1: testimonial-shaped inline literal. Heuristic: a `quote:` key within
  // ~15 lines of an `avatar:` or (`name:` AND `role:`) key, in the same file.
  const quoteLineIdx = lines.findIndex((l) => /\bquote\s*:\s*["'`]/.test(l))
  if (quoteLineIdx !== -1 && !isSuppressed(lines, quoteLineIdx)) {
    const windowStart = Math.max(0, quoteLineIdx - 15)
    const windowEnd = Math.min(lines.length, quoteLineIdx + 15)
    const window = lines.slice(windowStart, windowEnd).join("\n")
    const hasAvatar = /\bavatar\s*:\s*["'`]/.test(window)
    const hasNameAndRole = /\bname\s*:\s*["'`]/.test(window) && /\brole\s*:\s*["'`]/.test(window)
    if (hasAvatar || hasNameAndRole) {
      console.error(
        `[validate-no-fake-content] ${file}:${quoteLineIdx + 1} — testimonial-shaped literal ` +
          `("quote" + "avatar"/"name"+"role") hardcoded in a page/component file. ` +
          `Move real testimonials to a reviewed data source, or suppress with ` +
          `"// validate-content-allow: <reason>" on the line above if this is legitimate.`
      )
      failed = true
    }
  }

  // Check 2: known stock headshot filenames.
  lines.forEach((line, idx) => {
    const matches = STOCK_PHOTO_PATTERNS.some((pattern) => pattern.test(line))
    if (matches && !isSuppressed(lines, idx)) {
      console.error(
        `[validate-no-fake-content] ${file}:${idx + 1} — references a stock/generic headshot filename ` +
          `(${line.trim()}). This is the same asset shape as the fabricated testimonials removed 2026-09. ` +
          `Use a real photo, or suppress with "// validate-content-allow: <reason>" if genuinely intentional ` +
          `(e.g. a design mockup).`
      )
      failed = true
    }
  })
}

if (failed) process.exit(1)
console.log(`[validate-no-fake-content] OK — scanned ${files.length} files, no fabricated testimonial content found.`)

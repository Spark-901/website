#!/usr/bin/env node
// Every messages/<locale>.json must have the exact same key set as en.json (the
// source of truth), and every locale declared in i18n/config.ts must have a
// matching messages/<locale>.json file, and vice versa. A missing key means
// next-intl either throws at runtime or silently falls through — neither is
// something we want reaching production.

import { readFileSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"

const WEB_ROOT = new URL("..", import.meta.url).pathname
const MESSAGES_DIR = join(WEB_ROOT, "messages")
const CONFIG_PATH = join(WEB_ROOT, "i18n", "config.ts")

function flattenKeys(obj, prefix = "") {
  let keys = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

function localesFromConfig() {
  const src = readFileSync(CONFIG_PATH, "utf8")
  const m = src.match(/locales\s*=\s*\[([\s\S]*?)\]/)
  if (!m) throw new Error(`Could not find "locales = [...]" in ${CONFIG_PATH}`)
  return [...m[1].matchAll(/["']([a-zA-Z-]+)["']/g)].map((mm) => mm[1])
}

const configLocales = localesFromConfig()
const messageFiles = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"))
const messageLocales = messageFiles.map((f) => basename(f, ".json"))

let failed = false

const configSet = new Set(configLocales)
const messageSet = new Set(messageLocales)

const declaredNotShipped = configLocales.filter((l) => !messageSet.has(l))
const shippedNotDeclared = messageLocales.filter((l) => !configSet.has(l))

if (declaredNotShipped.length > 0) {
  console.error(
    `[validate-i18n-parity] i18n/config.ts declares locale(s) with no messages/<locale>.json file: ${declaredNotShipped.join(", ")}`
  )
  failed = true
}
if (shippedNotDeclared.length > 0) {
  console.error(
    `[validate-i18n-parity] messages/ has file(s) for locale(s) not declared in i18n/config.ts: ${shippedNotDeclared.join(", ")}`
  )
  failed = true
}

if (!messageSet.has("en")) {
  console.error("[validate-i18n-parity] messages/en.json is missing — it's the source of truth for key comparison.")
  process.exit(1)
}

const enKeys = new Set(flattenKeys(JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf8"))))

for (const locale of messageLocales) {
  if (locale === "en") continue
  const data = JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8"))
  const keys = new Set(flattenKeys(data))

  const missing = [...enKeys].filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !enKeys.has(k))

  if (missing.length > 0) {
    console.error(`[validate-i18n-parity] ${locale}.json is missing ${missing.length} key(s) present in en.json:`)
    for (const k of missing.slice(0, 20)) console.error(`  ${k}`)
    if (missing.length > 20) console.error(`  ...and ${missing.length - 20} more`)
    failed = true
  }
  if (extra.length > 0) {
    console.error(`[validate-i18n-parity] ${locale}.json has ${extra.length} key(s) not present in en.json (stale/typo?):`)
    for (const k of extra.slice(0, 20)) console.error(`  ${k}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`[validate-i18n-parity] OK — ${messageLocales.length} locales (${messageLocales.join(", ")}) all match en.json's key set.`)

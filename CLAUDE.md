# Spark901 website — Claude Code context

## What this repository is

Monorepo for **Spark901** public web presence (`apps/web`, Next.js). Spark901 builds **open-source software** so nonprofits and mission-driven organizations can do more with less. **Donations and sponsorships** fund engineering and infrastructure; the product intent is **lasting quality** (maintainable code, honest messaging, tools that scale across many orgs).

## Mission and positioning

- **Geography**: **Memphis, Tennessee** (area code **901**). Local to the Mid-South; audience is global but roots are Memphis.
- **Nonprofit ecosystem**: Memphis is a **nonprofit hub**. The team is part of the **Digital Delta**—a frame for regional tech talent **supporting** nonprofits, not competing with them.
- **Legal**: Spark901 operates as an **LLC**, **not** a **501(c)(3)** at this time. **Contributions are generally not tax-deductible.** Any copy about taxes or “nonprofit status” must stay accurate (see `transparency` strings and legal pages).
- **Ethos**: Social good through **public goods** (open source), transparency, and **rigorous** engineering—not through misleading donors about tax treatment.

## Memphis nonprofit hub statistics (for copy/UI)

Single source of truth: `apps/web/lib/brand.ts` → `memphisNonprofitHub`.

1. Memphis **leads major U.S. metros** in nonprofits **relative to population**: **69.9 per 10,000** residents.
2. **Over 6,500** tax-exempt nonprofits in the Memphis area, **employing over 96,000 people**, with **over $46 billion** in assets.

UI: use the `MemphisNonprofitHubStats` component and `messages/*.json` under `memphisNonprofitHub` so EN/ES stay aligned.

## Domain

- Canonical site: **`https://spark901.com`** (not `.org`).
- Contact email pattern: `@spark901.com` (e.g. `hello@spark901.com`).
- Stripe webhook / Checkout return URLs use `spark901.com`.

## Conventions for agents

- Match existing patterns: `next-intl`, `components/ui/*`, `lib/brand.ts` for brand constants.
- Do not add tax-deduction promises or “we are a nonprofit” claims without explicit legal verification.
- When adding fundraising or impact copy, tie it to **open infrastructure** and **verified** legal disclosures.
- **Public forms / lead APIs**: protect with Cloudflare Turnstile (`TurnstileField` + `verifyTurnstileToken` in `apps/web`). Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `SPARK901_TURNSTILE_SECRET_KEY`. See `.cursor/rules/spark901-turnstile.mdc`. Skip for Stripe Checkout/portal and signed webhooks only.

## Validators — run before calling any homepage/branding/i18n change done

CI (`.github/workflows/ci.yml`) runs these on every PR, but run them locally too before saying
work is finished — a green CI run is the actual bar, not "it looked right in the browser." Added
2026-09-16 after a fabricated-testimonials + broken-logo-colors bug shipped to production
unnoticed because nothing checked either one.

- `npm run --workspace=web validate:i18n` — every `messages/<locale>.json` must have the exact
  same key set as `en.json`, and every locale in `i18n/config.ts` must have a matching file.
- `npm run --workspace=web validate:content` — no hardcoded testimonial-shaped literals
  (`quote` + `avatar`/`name`+`role`) in `app/**` or `components/**`, and no reference to a known
  stock/generic headshot filename. Real testimonials need a reviewed data source and real photos.
  Suppress a genuine exception with `// validate-content-allow: <reason>` on the line above.
- `npm run --workspace=web build && npm run --workspace=web validate:brand` — checks the
  *compiled* CSS actually contains a real `fill:` rule for every brand-mark utility class
  (`fill-brand`, `fill-brand-tile`, `fill-brand-tile-inverse`), and that there's no orphaned
  `globals.css` file sitting around unimported. If you add a new `fill-brand-*` class in
  `components/spark-logo.tsx`, add it to `WATCHED_CLASSES` in `scripts/validate-brand-render.mjs`.
- `npm run validate` (repo root) runs all three via turbo.

# Vendored from `@west-tennessee-consulting/funnel-components`

**Source:** `West-Tennessee-Consulting/wtc-shared-packages`, `packages/funnel-components/src/`,
commit `b43f4ad` (PR #43, merged into `develop` 2026-09-25).

## Why vendored instead of a real dependency

Two blockers, in order:

1. **GitHub Packages publishing is blocked org-wide** for every `@west-tennessee-consulting/*`
   package (confirmed 403 `permission_denied`, documented in the personal-work repo's
   `goals/spark901.md`) — so the normal npm registry install path doesn't work.
2. **The workaround (a `funnel-components-dist` branch with a pre-built `dist/` committed, consumed
   via a `github:...#branch` git dependency) works locally but fails in CI**: `npm ci` on GitHub
   Actions resolves the `github:` shorthand to an SSH URL (`git@github.com:...`), and the CI
   runner has no SSH key configured for cross-repo access. Fixing that properly needs a
   fine-grained PAT with read access to `wtc-shared-packages`, stored as a repo secret, and CI
   wired to use `git+https://x-access-token:$TOKEN@github.com/...` instead — a real setup step
   that needs a human to create the token (GitHub's UI, not automatable from here).

Vendoring unblocks the build immediately with zero new credentials, at the cost of manual re-sync
when the source package changes — the same tradeoff `901bambird` already accepted for its own
vendored WTC packages (see that repo's `REUSE_FROM_WTC_MONOREPO.md`).

## Files here

- `EmailCaptureForm.tsx` — the form component
- `email-capture-validation.ts` — email validation used by the form
- `turnstile.ts` / `turnstile-widgets.ts` — client-side Turnstile token acquisition

Only the client-side pieces are vendored — the API route's Turnstile *verification* uses this
repo's own existing `lib/turnstile.ts`, not this vendored copy (the two are separate concerns:
acquiring a token client-side vs. verifying one server-side).

## Re-syncing after an upstream change

1. Re-copy the 4 files from `wtc-shared-packages/packages/funnel-components/src/` (paths above).
2. Fix the relative imports the same way as last time — the source package's `../lib/x.js`
   imports need to become `./x` once everything's flattened into this one directory.
3. Re-run this app's validators (`validate:i18n`, `validate:content`, `type-check`, `build`).

## The real fix, when there's time for it

Either (a) get a fine-grained PAT for `wtc-shared-packages` read access, store as a repo secret,
wire CI to use `git+https://x-access-token:$TOKEN@github.com/...`; or (b) get org GitHub Packages
publishing actually fixed (Settings → Actions → Workflow permissions → Read and write), then use
a normal registry dependency. Either removes this vendor directory entirely.

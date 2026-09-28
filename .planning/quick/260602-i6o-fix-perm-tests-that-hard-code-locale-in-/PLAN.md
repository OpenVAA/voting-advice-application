---
quick_id: 260602-i6o
slug: fix-perm-tests-that-hard-code-locale-in-
date: 2026-06-02
---

# Quick Task: Fix perm tests that hard-code locale in URL matchers

## Problem

`perm-header-show-help.spec.ts:23` failed:

```
Expected pattern: /\/en\/about/
Received string:  "http://localhost:5173/about"
```

**Root cause (not a regression — a wrong test assumption):** the base locale
`en` is served from `/` **without** a `/en/` prefix (Paraglide `urlPatterns`).
This is documented in-tree at `perm-localisation-positive.spec.ts:162-164`
("baseLocale: served from `/` with NO `/en/` prefix"). So `getRoute`/`buildRoute`
emit locale-prefixless paths for `en`, and navigation lands on `/about`, not
`/en/about`. The matcher that hard-codes `/en/` can never match.

## Scope

Audit of all `toHaveURL` / `waitForURL` matchers in `tests/tests/specs/perm/`
and `tests/tests/setup/`. Two matchers hard-code the locale **incorrectly**:

1. `perm-header-show-help.spec.ts:23` — `/\/en\/about/` (the failing test).
2. `perm-hide-all-nominations.spec.ts:20` — `/\/en\/?$/` (307-redirect to Home;
   `buildRoute({route:'Home', locale:'en'})` resolves to `/`, not `/en`).

**Deliberately left unchanged** (locale matching is the point of the test, not
incidental):
- `perm-localisation-positive.spec.ts` lines 146/360 (`/\/fi(\/|$)/`) assert a
  **non-base** locale IS prefixed; line 164 (`not.toHaveURL(/\/(fi|sv|da|et|fr|lb)(\/|$)/)`)
  asserts the base locale is NOT prefixed. These verify the i18n routing contract.
- `perm-not-located-2e2cg.spec.ts` (`/election/`, `evil.example`) — not locale.
- `*.setup.ts` (`/.*login.*/`) — not locale.

## Fix (test-only)

Replace hard-coded `/en/` with a locale-agnostic optional-segment matcher:

- header-show-help: `/\/(?:[a-z]{2}\/)?about(?:\/|$)/`
- hide-all-nominations: `/\/(?:[a-z]{2}\/?)?$/` (Home root, optional locale)

Both regexes validated against base/prefixed/negative URL cases. Test titles and
the doc-comment rationale updated to match.

## Verification

- Regex case-table (base `/about`, prefixed `/en/about` `/fi/about`, negative
  `/nominations`) passes — see node assertion in execution log.
- Full E2E run requires `yarn dev` + seeded stack; left to suite run.

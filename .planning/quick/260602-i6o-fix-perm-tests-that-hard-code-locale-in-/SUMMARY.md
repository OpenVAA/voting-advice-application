---
quick_id: 260602-i6o
slug: fix-perm-tests-that-hard-code-locale-in-
date: 2026-06-02
status: complete
---

# Summary: Fix perm tests that hard-code locale in URL matchers

## What changed

Test-only. Two `toHaveURL` matchers in `tests/tests/specs/perm/` hard-coded the
`/en/` locale prefix, which can never match because the base locale `en` is
served **prefixless** (Paraglide `urlPatterns`; documented in-tree at
`perm-localisation-positive.spec.ts:162-164`).

| File | Before | After |
|------|--------|-------|
| `perm-header-show-help.spec.ts:23` | `/\/en\/about/` | `/\/(?:[a-z]{2}\/)?about(?:\/\|$)/` |
| `perm-hide-all-nominations.spec.ts:20` | `/\/en\/?$/` | `/\/(?:[a-z]{2}\/?)?$/` |

Both now tolerate an optional `/<locale>` segment, so they hold for base-locale
(prefixless) and prefixed-locale runs alike. Test titles + doc-comment rationale
updated to drop the misleading `/en/...` literals.

## Audit (the "check all the other perms" part)

Swept every `toHaveURL` / `waitForURL` in `tests/tests/specs/perm/` and
`tests/tests/setup/`. The only two **incorrect** locale hard-codings were the two
above. Deliberately **left unchanged** — locale matching there is the assertion's
purpose, not an accident:

- `perm-localisation-positive.spec.ts:146,360` (`/\/fi(\/|$)/`) assert a non-base
  locale IS prefixed; `:164` (`not.toHaveURL(/\/(fi|sv|da|et|fr|lb)(\/|$)/)`)
  asserts the base locale is NOT prefixed. These verify the i18n routing contract.
- `perm-not-located-2e2cg.spec.ts:103,152` (`/election/`, `evil.example`) — not locale.
- `*.setup.ts` (`/.*login.*/`) — not locale.

## Verification

- Regex case-table passes: base `/about`, prefixed `/en/about` + `/fi/about` match;
  `/nominations` does not (header). Home matcher: `/`, `/en`, `/fi/` match;
  `/about`, `/nominations` do not.
- `playwright test --list` resolves both specs with their new titles.
- ESLint clean on both changed files.
- Full E2E run (needs `yarn dev` + seeded stack) left to the suite run.

## Follow-ups

None. The originating `goto('/en')` / `goto('/en/nominations')` navigations were
left intact — Paraglide accepts the explicit prefix and the tests reach the page;
only the **assertions** were locale-coupled.

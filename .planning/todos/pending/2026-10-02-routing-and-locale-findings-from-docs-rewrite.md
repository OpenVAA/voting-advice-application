---
created: 2026-10-02
title: Frontend routing/locale observations from the docs rewrite — unused ROUTE_PARAMS, unclear cookie locale strategy, language menu drops the query string
area: apps/frontend/src/lib/routes, apps/frontend/src/lib/i18n
severity: minor
source: Phase 168 (docs-site rewrite), 168-05 findings F3, F5, F6 (read, not run), filed by plan 168-08
related_phase: 168
files:
  - apps/frontend/src/lib/routes/params.ts
  - apps/frontend/paraglide.options.ts
  - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
---

All three items were read from the code and not exercised (UNCONFIRMED). The docs pages state only what the code shows.

## 1. `ROUTE_PARAMS` lists two unused parameters (168-05 F3)

`entityType` and `entityId` are in `ROUTE_PARAMS` (`apps/frontend/src/lib/routes/params.ts`), but no route directory uses them:
`git ls-files apps/frontend/src/routes | grep -E "\[entityType|\[entityId"` exits 1. They may still be read as query parameters
somewhere, which is why they are not called dead outright. **Check, then remove or document.** The Routing docs page no longer uses
them as its example.

## 2. When does the `cookie` locale strategy apply to a page URL? (168-05 F5)

`paraglide.options.ts` orders the strategies `url`, `cookie`, `baseLocale`, and the base locale has no URL prefix (`buildRoute.ts`:
"which is none for the base locale"). If Paraglide's `url` strategy resolves an unprefixed path to the base locale, the cookie is never
consulted for pages. Nothing in the repo shows who writes the cookie: the language menu switches by link with a full reload. **Test
against a running server**, and either document the cookie's role or drop the strategy. The Locale resolution page lists the configured
order only. Related: `2026-05-30-paraglide-baselocale-vs-runtime-default-divergence.md`.

## 3. The language menu drops the query string (168-05 F6)

`apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` links to `localizeHref(page.url.pathname, …)`. Switching the locale on a `(located)` page therefore loses
`?electionId=…&constituencyId=…`, and the `(located)` layout then implies the selection or redirects to the selection pages. **Decide
whether this is intended.** If not, carry `page.url.search` into the localized href and add an E2E step that switches language on the
results page. Related: `results-url-refactor-followups.md`.

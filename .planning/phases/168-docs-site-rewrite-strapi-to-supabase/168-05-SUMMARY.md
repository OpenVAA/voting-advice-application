---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 05
subsystem: docs-content
status: complete
tags: [docs, frontend, svelte5-runes, contexts, data-api, supabase-adapters, paraglide, i18n, claims-ledger]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: the eleven pages at their final URLs with their final H1s; redirect stubs for frontend/data-api, frontend/accessing-data-and-state-management and the five localization sources"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01: validate-links --check/--scope, check-claims.mjs ledger/commands, base-rev.txt"
  - phase: 167-origin-main-vestige-cleanup
    provides: "no /api/cache proxy, no PUBLIC_CACHE_ENABLED or backend-URL pair; UniversalAdapter.fetch passes the URL through unchanged"
provides:
  - "Frontend overview: SvelteKit + adapter-node, Svelte 5 with runes forced on outside node_modules, the $types/$candidate/$layouts aliases, key directories, the three request hooks and reroute, the three app route roots"
  - "Routing, Contexts, Data API and adapters, Components and Styling written from the runes-era code and the post-167 data layer"
  - "Localization: Paraglide + t(), compiled vs offered locales, url/cookie/baseLocale locale resolution, translations and runtime overrides, multi-locale data"
  - "168-05-CLAIMS.md: 18 page verdicts (11 pages + 7 merged sources), 578 content-anchored claims (check-claims ledger exit 0), findings F1-F6, sweep exceptions: none"
affects: [168-06, 168-07, 168-08]

estimate:
  tokens: 72000
actuals:
  tokens: 44868
  tasks: 3
  commits: 3
plan_head_before: 461f5c183a61e25cc1546803da4e178737d8a0f2
plan_head_after: 088fa92b5c48c61309c1b1b45198699c36c52378

tech-stack:
  added: []
  patterns:
    - "Claims rows inserted from a scratch file by a small node script before `## Findings for todos`, then re-checked by check-claims after every batch"
    - "An anchor that would need a `|` or a backtick (template literals, union types) is shortened to the unambiguous substring before it"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-05-CLAIMS.md
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/data-api-and-adapters/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/styling/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/intro/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/locale-resolution/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/translations-and-overrides/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/localization/storing-multi-locale-data/+page.md"

key-decisions:
  - "Data API and adapters states that createDataProvider and createFeedbackWriter always return the Supabase adapters, and that the apiRoute adapters exist but nothing constructs them; dataAdapter.type 'local' only loads the server-side local adapter behind /api/data/[collection] and /api/feedback (consistent with 168-04's Architecture; F1)"
  - "The Admin App's job reads are documented as UniversalDataWriter methods calling UNIVERSAL_API_ROUTES, not as the apiRoute adapter the plan named; the code has no apiRoute caller"
  - "Styling documents the theme palette where it is defined (the DaisyUI theme blocks in app.css) and says StaticSettings.colors carries the same values for the theme-color meta tags and the contrast check only (F2), instead of 'theme colours from staticSettings.ts'"
  - "Locale resolution lists the configured strategy order and does not claim when the cookie wins: whether it ever applies to a page URL is UNCONFIRMED (F5)"
  - "localization/localization-in-strapi is recorded as merged → translations-and-overrides (its stub target); its surviving content lives on Multi-locale data, which Translations and overrides now links (F4 for 168-08)"
  - "The Contexts page uses no form of the word 'store'; the Components page links the Code style guide without an anchor because 168-07 owns that page's headings"

patterns-established:
  - "A negative fact about the code (an unwired class, an unused parameter, a duplicated palette) goes to ## Findings for todos with the grep that proves it, and the page states only what the code does"

requirements-completed: []

coverage:
  - id: D1
    description: "Frontend overview describes Svelte 5 with runes forced on, the three aliases, key directories, the request hooks and the three apps; no Svelte 4 statement or changeable version"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "Task 1 <verify> blocks (validate:links --check --scope /developers-guide/frontend/intro; check-claims ledger; check-claims commands; prettier --check; nohit svelte 4|svelte/store|export let|$$Props; version grep; H1 '# Frontend overview') exit 0, re-run on the committed tree for the tracer gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Routing, Contexts, Data API and adapters, Components and Styling match the runes-era code and the post-167 data layer; merged data pages recorded; the contexts page's broken anchor and the data-api self-link are gone"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "Task 2 <verify> blocks over the five pages (links 0 findings, ledger, commands, prettier; nohit Strapi/api/cache/PUBLIC_CACHE_ENABLED/flat-cache/disableCache/backend-URL pair; nohit $t(/$locale/Svelte 4/export let/$$Props/[[lang) exit 0; Contexts \\bstores?\\b grep exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Localization section describes Paraglide, t(), runtime overrides, compiled vs offered locales and url-strategy resolution; five localization sources recorded"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "nohit sveltekit-i18n|parser-icu|$t(|$locale|I18nContext|[[lang over the five localization pages (exit 1); Locale resolution's strategy row #501 anchored in paraglide.options.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "All eleven pages pass every page gate: scoped link check (0 findings), claims ledger (578 rows), command resolution (13 commands), prettier, D-21 and D-17 sweeps, no docker hit"
    requirement: "DOCS-03"
    verification:
      - kind: other
        ref: "Task 3 <verify> block 1 over the eleven pages (exit 0) and block 2 (exit 0); docs check (653 files, 0/0); docs build (exit 0); docs format:check (exit 0); check:research-quotes two-base form (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Claims ledger: 578 content-anchored rows; 18 page verdicts; findings F1-F6"
    requirement: "DOCS-04"
    verification:
      - kind: other
        ref: "node scripts/check-claims.mjs ledger 168-05-CLAIMS.md (exit 0, 578 rows)"
        status: pass
    human_judgment: true
    rationale: "Anchors prove each cited literal exists; whether every sentence reads its anchor correctly is the 168-08 verifier's independent pass (D-09)"

duration: 30min
completed: 2026-10-02
---

# Phase 168 Plan 05: Frontend and Localization Summary

**The Frontend and Localization sections now describe the code at HEAD instead of Svelte 4, stores, `sveltekit-i18n`, `[[lang=locale]]` routes and the removed cache proxy.**

The Frontend section covers:

- Svelte 5 with runes forced on outside `node_modules`.
- Runes-based contexts, with the stable-reference versus reactive-accessor rules.
- The four Data API factories over a named Supabase client, scoped to the project and to RLS.
- Paraglide localization: the `t()` wrapper, runtime overrides and `url`-strategy locale resolution.

578 claims are anchored in code and re-checked by script.

## Performance

- **Duration:** about 30 min
- **Started:** 2026-10-02T10:56:35Z
- **Completed:** 2026-10-02T11:26:23Z
- **Tasks:** 3 of 3
- **Files modified:** 12 (11 pages, 1 claims ledger)

## Accomplishments

### Frontend overview (tracer)

- **Stack:** SvelteKit with `adapter-node`, and Svelte 5 with runes forced on by `compilerOptions` and by `dynamicCompileOptions`. Tailwind and DaisyUI are configured in `app.css`. Paraglide is compiled by its Vite plugin. The backend is reached through `@supabase/ssr` clients, and unit tests use Vitest. There are no version numbers; the page links the workspace manifest and the `.yarnrc.yml` catalog instead.
- **Aliases:** `$types`, `$candidate` and `$layouts`.
- **Directories:** every `src/lib` directory in one line each.
- **Hooks:** the three handlers of `hooks.server.ts`, `reroute`, and the logger setup.
- **Apps:** the route roots of the three apps and their `(protected)` and `(located)` groups.
- **Scripts:** the workspace's own scripts.
- **Tracer gate:** the run is interactive in `end-of-phase` mode, and the tracer's `<verify>` is automated only. Both blocks passed on the committed tree before the expansion tasks started.

### Routing

- Kept the parameters and `buildRoute`.
- Added:
  - that no route has a locale segment (`reroute`/`deLocalizeUrl` and `localizeHref`);
  - the route tree table;
  - `PROTECTED_GROUP`;
  - the `$lib/routes` modules;
  - `routeConsistency.test.ts` and its two registered unbuilt keys;
  - `ROUTE_PARAMS`, `PERSISTENT_SEARCH_PARAMS` and `ARRAY_PARAMS`;
  - the `etPl` and `etSg` matchers;
  - `getRoute` as a stable reference.

### Contexts

- Covers all ten contexts, with the layout that initialises each one and what each includes.
- Explains the `init*` and `get*` errors.
- Explains the two member classes and the two prohibitions: never destructure a reactive accessor, and never alias `dataRoot`. The second is guarded by `noDataRootDerivedAlias.test.ts`.
- Adds the spread caveat and `setDataRoot`.
- Nothing is called a store. The broken `#example-loading-cascade-…` anchor is gone.

### Data API and adapters

This page merges `frontend/data-api` and `frontend/accessing-data-and-state-management`. It covers:

- The four factories and what each returns.
- `AdapterSource` and its three arms, with the root-layout example.
- The adapter-boundary and adapter-singleton ESLint rules.
- Reads: project scope (`scopedFrom`, no fallback project), the anon key and RLS (the service-role key is never read in `src`), paging at `max_rows`, `getLocalized`, and colour processing.
- The three writers, and the routes behind `UNIVERSAL_API_ROUTES`.
- `UniversalAdapter.fetch` as 167 left it.
- The server-side local adapter, and the `apiRoute` adapters that nothing constructs.
- How loaded data reaches components.
- The folder structure, and a class diagram without Strapi.

The 168-02 self-link and the banner are gone.

### Components

- The three libraries and their import paths.
- The barrel rule.
- The runes-era conventions, shown on `Button`: `$props()` typed by a co-located `.type.ts`, snippets with `{@render}`, `concatClass` where the caller's class wins, the `svelte/store` ban, and the `@component` comment that the generator reads.

### Styling

- Tailwind and DaisyUI are configured in CSS, in `app.css`. There is no `tailwind.config.cjs`.
- The restricted `@theme` scales and the safelist.
- `@reference` through `tailwind-theme.css`.
- The two themes, and the colour table re-checked against `app.css`.
- How `StaticSettings.colors` relates to the theme.
- The z-index users, re-derived from the code.

### Localization

- **Overview:** Paraglide, the `t()` wrapper, and the lookup order: overrides first, then the compiled message, then the key itself.
- **Supported locales:** the compiled locales (in the inlang settings) versus the offered ones (in `supportedLocales`), the default-locale rules, `lang.json`, and how to add a locale in five steps.
- **Locale resolution:** this page merges `locale-routes` and `locale-selection-step-by-step`. It covers the `url`/`cookie`/`baseLocale` order, the fact that `Accept-Language` is not used, `reroute` and `paraglideHandle`, localized links, and switching the locale with a full reload.
- **Translations and overrides:** this page merges `local-translations`, `localization-in-the-frontend` and `localization-in-strapi`. It covers:
  - the message files and their organisation;
  - the inlang message format;
  - `assertTranslationKey`;
  - the three consistency checks;
  - `editTranslations`;
  - the whole `translationOverrides` flow.
- **Multi-locale data:** `jsonb` locale objects, the fallback order of `getLocalized`, the SQL `get_localized` (used only by the email helpers), multilingual writes, `translate`, and the separate `@openvaa/data` utilities.

## Task Commits

1. **Task 1 (tracer): Frontend overview**, `3d43f1e7e` (docs)
2. **Task 2: Routing, Contexts, Data API and adapters, Components, Styling**, `97f27cc81` (docs)
3. **Task 3: Localization section**, `088fa92b5` (docs)

**Plan metadata:** the docs commit that adds this summary.

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/frontend/{intro,routing,contexts,data-api-and-adapters,components,styling}/+page.md`: the Frontend section
- `apps/docs/src/routes/(content)/developers-guide/localization/{intro,supported-locales,locale-resolution,translations-and-overrides,storing-multi-locale-data}/+page.md`: the Localization section
- `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-05-CLAIMS.md`: verdicts, claims, findings, sweep exceptions

## Decisions Made

See `key-decisions` in the frontmatter. The three that change what a reader does:

- **The `local` setting does not switch the app's reads.** Data API and adapters says so, because `createDataProvider` always returns the Supabase provider and nothing constructs the `apiRoute` adapters.
- **Theme colours have two sources.** Styling says the palette lives in `app.css`, and that `StaticSettings.colors` duplicates it, so a palette change has to be made in both places.
- **The browser language does not choose the locale.** Locale resolution says so, because `Accept-Language` is not one of Paraglide's configured strategies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] The admin job reads are not on the `apiRoute` adapter**
- **Found during:** Task 2
- **Issue:** The plan describes "the `apiRoute` adapter for server routes such as the admin job reads". In the code, the job reads are `UniversalDataWriter` methods (`getActiveJobs` and the others) that call `UNIVERSAL_API_ROUTES`. Nothing outside two ESLint-guard fixtures constructs the `apiRoute` adapters.
- **Fix:** The page documents both as they are, and the unwired adapters are recorded as F1.
- **Committed in:** `97f27cc81`

**2. [Rule 1 - Accuracy] Theme colours are not taken from `staticSettings.ts`**
- **Found during:** Task 2
- **Issue:** The plan's Styling brief says "theme colours from `staticSettings.ts`". The DaisyUI themes are hard-coded in `app.css`; `StaticSettings.colors` feeds only the `theme-color` meta tags and `ensureColors`.
- **Fix:** The page documents both places. The duplication is recorded as F2.
- **Committed in:** `97f27cc81`

**3. [Rule 1 - Accuracy] Page facts corrected while reading the code**
- **Found during:** Tasks 2 and 3
- **Issue and fix:**
  - The base components do import `@openvaa/data` types, so "they do not depend on the data model" was dropped. Two of them read an app context, so the page says "most of them read no app context".
  - The pre-registration route is reached by `preregisterWithIdToken`, not `preregisterWithApiToken`.
  - `UniversalAdapter` also has `put`.
  - "Admin App" was dropped from the multi-locale sentence, because it was not verified.
- **Committed in:** `97f27cc81` and `088fa92b5`

### Other deviations

**4. [Convention] Commit subjects use `docs[docs]:`, not the plan's `docs(docs):`.** This follows the contributing guide's bracketed form, as in 168-01, 168-02 and 168-04.

**5. [Scope] Page verdicts cover 18 routes rather than "eleven pages and the four merged sources".** The plan's action names seven merged sources: the two data pages and five localization pages. All seven have verdicts.

---

**Total deviations:** 3 auto-fixed (accuracy), 2 other (convention, verdict count).
**Impact on plan:** None on scope. Only the plan's eleven pages and its claims file were touched. No stub was edited; F4 leaves the stub-target question to 168-08.

## Issues Encountered

None blocking. The findings are in `168-05-CLAIMS.md` § Findings for todos and were not fixed (D-18):

- **F1:** the `apiRoute` adapters are unwired, so `local` does not switch the app's reads. Whether the local mode is meant to come back is UNCONFIRMED.
- **F2:** the theme palette is in both `app.css` and `StaticSettings.colors`, and CLAUDE.md names only the latter. Whether one should be generated from the other is UNCONFIRMED.
- **F3:** `ROUTE_PARAMS` lists `entityType` and `entityId`, but no route uses them. Whether they are dead is UNCONFIRMED.
- **F4:** the stub target for `localization-in-strapi`. This is a 168-08 decision.
- **F5:** whether the `cookie` strategy ever applies to a page URL is UNCONFIRMED. It was not tested against a running server.
- **F6:** the language menu drops the query string when it switches the locale. Whether this is intended is UNCONFIRMED.

## Known Stubs

None. Every page is fully written, with no placeholder or TODO text.

## User Setup Required

None.

## Next Phase Readiness

- 168-08 can:
  - copy the 18 verdicts into `168-DOCS-AUDIT.md`;
  - decide which of F1, F2, F3, F5 and F6 become todos;
  - decide on the F4 stub target.
- There are no sweep exceptions to copy.
- 168-07 owns the Code style guide headings. Components links that page without an anchor.
- DOCS-01, DOCS-03 and DOCS-04 stay Pending, because they are shared with sibling plans.

## Self-Check: PASSED

- **Files:** all 11 pages and `168-05-CLAIMS.md` are present.
- **Commits:** `3d43f1e7e`, `97f27cc81` and `088fa92b5` are present.
- **Commit count:** `git rev-list --count 461f5c183..HEAD` = 3 before the metadata commit.
- **Plan-level verification at `088fa92b5`,** each exit status read directly:
  - Task 3 verify block 1 = 0 (links 0 findings, ledger 578 rows, 13 commands, prettier clean).
  - Task 3 verify block 2 = 0.
  - The localization acceptance grep = 1.
  - The Contexts `\bstores?\b` grep = 1.
  - Docs `check` = 0 (653 files, 0/0).
  - Docs `build` = 0.
  - Docs `format:check` = 0.
  - `check:research-quotes` (two-base form) = 0.

---
*Phase: 168-docs-site-rewrite-strapi-to-supabase*
*Completed: 2026-10-02*

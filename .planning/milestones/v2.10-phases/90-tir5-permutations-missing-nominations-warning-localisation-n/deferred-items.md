# Phase 90 — Deferred Items

Items surfaced during execution that are OUT OF SCOPE for Phase 90 and
deferred to a future phase per the GSD executor SCOPE BOUNDARY rule.

## D-90-DEFERRED-01: Pre-existing Svelte build error in `runes-test/nav-a11y/+page.svelte`

**Surfaced during:** Plan 90-01 Task 2 (frontend build verification)

**Origin:** Commit `69eedf4dd docs(spike-016): [VALIDATED] focus-and-a11y-during-transitions — WCAG 2.1 AA gate passes` (2026-05-25), predates Phase 90.

**Symptom:** `yarn workspace @openvaa/frontend build` fails with:

```
src/routes/runes-test/nav-a11y/+page.svelte:19:2
`</p>` attempted to close element that was already automatically closed by `<ol>`
(cannot nest `<ol>` inside `<p>`)
https://svelte.dev/e/element_invalid_closing_tag_autoclosed
```

**Why deferred:** Unrelated to Plan 90-01 (i18n runtime override wiring).
The `runes-test/*` routes are exploratory spike harnesses, not production
surface. The build error was already present before Phase 90 started.
Plan 90-01's verification gates are unit-test (`yarn test:unit`) green and
type-check (`yarn tsc --noEmit -p tsconfig.json`) clean for the touched
files (init.ts, i18nContext.ts).

**Recommended owner:** Whoever owns the runes-test harness (likely the
Svelte 5 migration spike-track from 2026-05). Fix is trivial — replace
`<p>...<ol>...</ol></p>` with valid HTML structure.

**Plan 90-02..04 impact:** None for Plans 90-02 / 90-03 / 90-04 unit-test
gates. If Plan 90-04 verification requires `yarn dev` (Playwright E2E),
Vite dev mode may tolerate the parsing error where production build does
not — confirm at that wave.

## D-90-DEFERRED-02: Frontend `tsc --noEmit` errors in `supabaseAdapter*` and `runes-test/*`

**Surfaced during:** Plan 90-01 Task 2 (frontend typecheck verification)

**Symptom:** ~20 type errors in
`src/lib/api/adapters/supabase/adminWriter/*`,
`src/lib/api/adapters/supabase/dataProvider/*`, and `runes-test/*` —
unrelated to Plan 90-01 touched files.

**Why deferred:** Pre-existing per `git log` on the touched files. Plan
90-01 strict-scope is `init.ts` + `i18nContext.ts` + `dynamicSettings.type.ts`,
all of which type-check clean.

**Recommended owner:** Frontend infra owners.

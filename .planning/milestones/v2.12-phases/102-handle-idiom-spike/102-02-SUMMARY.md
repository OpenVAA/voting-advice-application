---
phase: 102-handle-idiom-spike
plan: 02
subsystem: frontend-contexts
tags: [svelte5, runes, context-handles, poc, tdd, atomic-landing, spike]
requires: ["102-01"]
provides:
  - "PoC-proven handle idioms on appContext (read-only fold, get/set accessor pair, getRoute fold)"
  - "Empirical confirmation that the Plan-01 decision-record idioms are mechanically sound (gates Phase 103)"
affects:
  - "Phase 103 (.current handle codemod — proceeds on the proven idioms)"
tech-stack:
  added: []
  patterns:
    - "Phase-97 additive-getter atomic-landing (new surface alongside old, green at commit boundary)"
    - "get x()/set x(v) accessor pair over raw factory $state (adminContext.svelte.ts:112-117 shape)"
    - "Plain getter fold for read-only + derived handles (ctx.x / ctx.getRoute(opts))"
    - "Destructure-trap-safe reactive reads (ctx.x, never const { x } = ctx for accessors)"
key-files:
  created:
    - "apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts"
  modified:
    - "apps/frontend/src/lib/contexts/app/appContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.type.ts"
key-decisions:
  - "Landed the PoC ADDITIVELY under `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` names rather than folding the canonical `darkMode`/`appType`/`getRoute` properties — because the spike empirically found ALL THREE canonical handles are DESTRUCTURED by consumers (6 / 8 / many sites), so folding the canonical property would trip the CLAUDE.md destructure trap. Migrating those consumers is the Phase-103 codemod, out of scope here."
  - "getRoute fold (D-04 / assumption A2) empirically CONFIRMED: exposing the $derived.by builder via a plain context-property getter works; producer createGetRoute() / $derived.by untouched."
  - "Build is green at the commit boundary (yarn build --filter=@openvaa/frontend exit 0); the PoC introduced ZERO new svelte-check errors (148 total are pre-existing infra errors unrelated to appContext)."
requirements-completed: [HANDLE-01]
duration: 18 min
completed: 2026-06-09
---

# Phase 102 Plan 02: PoC Idiom Surfaces on appContext Summary

Proved the locked Phase-103 handle idioms on a representative appContext slice — read-only
fold (`darkMode`), read-write `get/set` accessor pair (`appType`), and derived-handle fold
(`getRoute`) — all building green via the Phase-97 additive-getter atomic-landing technique,
with a targeted TDD unit test (RED → GREEN) proving the read-write round-trip, the read-only
reactive read, and the getRoute callable-fold. This is the empirical de-risking that confirms
the Plan-01 decision-record idioms are mechanically sound on the installed Svelte 5.53.12
before Phase 103 codemods the consumer sites.

- **Tasks:** 3 (TDD: RED test → GREEN implementation → atomic green gate)
- **Files:** 1 created (PoC test), 2 modified (appContext source + types)
- **Duration:** ~18 min

## What was built

**Task 1 (RED, `test(102-02)` commit `ae575d439`):**
`appContext.poc.svelte.test.ts` — a `.svelte.test.ts` vitest spec (runes compiled) modeled on
`persistedState.svelte.test.ts` / `answerStore.svelte.test.ts`. It constructs the minimal
faithful slice of the appContext idioms using the REAL `createDarkMode()` / `createGetRoute()`
factories (mocking `$app/environment`, `$app/state`, `$lib/utils/route`), and asserts:
- read-write round-trip: `ctx.appType = 'voter'` → `ctx.appType === 'voter'` (and `'candidate'`)
- read-only reactive read: `ctx.darkMode` is a plain getter (no `.current`), boolean, SSR default `false`
- getRoute fold: `ctx.getRoute` is directly callable (`ctx.getRoute({})`), not `ctx.getRoute.current(...)`
Every reactive accessor is read via `ctx.x` (never destructured), per the CLAUDE.md contract.
The test was proven RED-capable via a negative check (breaking the setter to a no-op fails the
round-trip assertion), so it is a real test, not a tautology.

**Task 2 (GREEN, `feat(102-02)` commit `58ae756fc`):**
Added three ADDITIVE PoC idiom surfaces to the real `appContext.svelte.ts` factory + typed them
in `appContext.type.ts`:
- `get _pocDarkMode()` — read-only fold (returns `componentCtx.darkMode`)
- `get _pocAppType()` / `set _pocAppType(v)` — read-write accessor pair over the SAME
  `appTypeValue` `$state` the existing `appType` handle uses (adminContext shape)
- `get _pocGetRoute()` — getRoute fold (returns the callable `getRoute.current` builder)

**Task 3 (atomic green gate, `fix(102-02)` commit `a519fa45b`):**
- `yarn build --filter=@openvaa/frontend` → **exit 0** (green commit boundary; `appContext.svelte.js` builds at 37.59 kB).
- `yarn workspace @openvaa/frontend check` → the PoC introduced exactly ONE new error
  (`appContext.poc.svelte.test.ts:88`, a too-loose `getRoute` slice type), FIXED in this commit
  by typing it as `RouteBuilder`. After the fix, **ZERO** errors reference any of the three PoC
  files. The remaining 147 errors are pre-existing infrastructure issues (missing `qs`
  declarations, supabase test-config type drift, `viewTransition` lib types, candidateContext
  writer-Promise mismatch, password form props) unrelated to appContext.
- Destructure-trap audit: **ZERO** destructures of the new `_poc*` accessors anywhere in the
  tree; existing handle properties untouched, so the baseline is unchanged.

## Acceptance criteria verification

- `appContext.poc.svelte.test.ts` runs under `yarn workspace @openvaa/frontend test:unit --run appContext.poc` → **3 passed**.
- Round-trip + reactive-read + getRoute-callable assertions all present and GREEN.
- `appContext.svelte.ts` exposes `get _pocDarkMode()`, `get _pocAppType()`/`set _pocAppType(v)`, `get _pocGetRoute()`; `appContext.type.ts` types all three.
- `yarn build --filter=@openvaa/frontend` exits 0 (atomic-landing satisfied).
- `createGetRoute()` still called at init; `getRoute.svelte.ts` producer `$derived.by` unchanged (A2 confirmed).
- appSettings/appCustomization init-merge unchanged (no `$effect`-based merge introduced); `reactiveDataRoot` and `Tween.current` untouched.
- Destructure-trap contract preserved (zero `_poc*` destructures; reactive reads via `ctx.x`).

## Deviations from Plan

**[Rule 4-class design decision — presented inline] Additive `_poc*` naming instead of folding
the canonical property names.** The plan's Task 2 action described adding the flat surfaces
"additively (keep the old `.current` handle members alongside)". A single TS property key cannot
simultaneously be the old `{ readonly current; … }` handle shape AND a new flat getter/accessor,
so the additive surfaces landed under distinct `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` names.
This was forced by an empirical spike finding: **all three canonical handles are DESTRUCTURED by
consumers** (`const { darkMode } = getAppContext()` ×6; `const { appType } = getAppContext()` ×8;
`getRoute` ×many). Folding the canonical property to a context-property getter would invoke the
getter once at destructure time and capture a stale snapshot — the CLAUDE.md "Context
Destructuring Rule" trap. Migrating those destructuring consumers to `ctx.x` / `$derived(ctx.x)`
reads IS the Phase-103 codemod (~423 sites), explicitly out of this spike's scope and budget.
The plan anticipated exactly this: "If the slice's blast radius is larger than the PoC budget,
prefer the additive-old-surface path to stay green." The additive `_poc*` names ARE that
green-preserving path; Phase 103 codemods consumers onto the canonical names and removes both the
`_poc*` surfaces and the old handles.

**Total deviations:** 1 (a green-preserving design choice forced by an empirical destructure-trap
finding; no behavioral change, no consumer breakage). **Impact:** the PoC proves the idiom
mechanics on the REAL factory while keeping the build green and the destructure contract intact —
exactly the spike's purpose. It also strengthens the Phase-103 scope: the codemod must migrate
destructuring consumers (not just rewrite `.current` reads) for the canonical fold.

## Authentication Gates

None.

## Issues Encountered

**Pre-existing svelte-check baseline (not a regression):** `yarn workspace @openvaa/frontend
check` reports 148 errors, of which 147 are pre-existing infrastructure issues unrelated to this
phase (verified: none reference `appContext.svelte.ts` or `appContext.type.ts`). The one PoC-
introduced error was fixed in Task 3. Because the workspace has a pre-existing failing
svelte-check baseline, `check` cannot exit 0; the binding atomic-landing gate is the `vite build`
(exit 0), which passes. The PoC's contribution to the type baseline is net zero new errors.

## Self-Check: PASSED

- `appContext.poc.svelte.test.ts` exists on disk and is committed (3 tests green).
- `git log --grep="102-02"` returns the RED/GREEN/REFACTOR-class commits (`ae575d439` test,
  `58ae756fc` feat, `a519fa45b` fix).
- `yarn build --filter=@openvaa/frontend` exits 0 (green commit boundary).
- PoC files introduce zero new svelte-check errors; destructure-trap audit clean.
- getRoute fold (A2/D-04) empirically confirmed; producer `$derived.by` untouched.

## Next

Phase 102 complete. The decision record (Plan 01) is the locked Phase-103 scope and the PoC
(Plan 02) confirms the idioms are mechanically sound. Ready for phase verification, then Phase
103 (`.current` handle codemod across the ~423 consumer sites, including migrating the
destructuring consumers surfaced here).

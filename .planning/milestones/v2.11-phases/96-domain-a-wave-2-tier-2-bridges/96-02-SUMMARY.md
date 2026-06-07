---
phase: 96-domain-a-wave-2-tier-2-bridges
plan: 02
subsystem: ui
tags: [svelte5, runes, context, orchestrator, sessionStorage, localStorage, voterContext, candidateContext]

# Dependency graph
requires:
  - phase: 96-domain-a-wave-2-tier-2-bridges
    plan: 01
    provides: sessionStorageState rune helper + reactiveAppSettings/reactiveLocale .current getters on appContext
  - phase: 95-domain-a-wave-1-tier-1-leaf-contexts
    provides: localStorageState rune helper + reactiveDataRoot .current-getter precedent
provides:
  - voterContext as a fully svelte/store-free rune-native orchestrator factory (reads Tier-1 via reactiveAppSettings.current / reactiveLocale.current / reactiveDataRoot.current)
  - voterContext.firstQuestionId backed by a single sessionStorageState handle (no fromStore mirror)
  - candidateContext as a rune-native orchestrator factory EXCEPT fromStore(getRoute) (deferred to Phase 97 / CTX-08)
  - candidate preregistration ids on sessionStorageState; isPreregistered on localStorageState
affects: [phase-97-getRoute-migration (CTX-08), phase-98-bridge-removal, wave-3-consumer-codemod]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator input-boundary swap: drop fromStore(appSettings)/fromStore(locale) input bridges, read Tier-1 via the additive reactiveAppSettings.current / reactiveLocale.current getters; derivation bodies stay verbatim"
    - "Single-handle persistence: replace the sessionStorageWritable(...) + fromStore(...) three-layer bridge with one sessionStorageState/localStorageState { current, set, update } handle"
    - "Tolerated residual bridge: candidateContext keeps exactly one fromStore(getRoute) until getRoute migrates (Phase 97)"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts

key-decisions:
  - "appContext Delta (carried from Plan A → option ii): both orchestrators now read appContext.reactiveAppSettings.current / reactiveLocale.current and DROP fromStore(appSettings)/fromStore(locale). reactiveDataRoot.current unchanged."
  - "Q2 getRoute STAYS fromStore(getRoute) in candidateContext (Readable<RouteBuilder> until Phase 97 / CTX-08). voterContext does not use getRoute internally → fully svelte/store-free."
  - "Q1 candidate preregistration ids migrated NOW: _preregistrationElectionIds/_preregistrationConstituencyIds → sessionStorageState, _isPreregistered → localStorageState — the narrowest scope that makes candidateContext a rune-native factory apart from getRoute."

requirements-completed: [CTX-07]

# Metrics
duration: 4min
completed: 2026-06-04
---

# Phase 96 Plan 02: Tier-2 Bridges (orchestrator rewrite) Summary

**voterContext is now a fully `svelte/store`-free rune-native factory and candidateContext is rune-native except the one tolerated `fromStore(getRoute)` bridge — both compose Tier-1 via `getAppContext()`'s `reactiveAppSettings.current`/`reactiveLocale.current` getters, with `firstQuestionId` + candidate preregistration ids on the rune-native `sessionStorageState`/`localStorageState` helpers; all 18+/30+ reactive accessors and the destructure-trap preserved.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-04T20:47:07Z
- **Completed:** 2026-06-04T20:51:00Z
- **Tasks:** 3 (2 producer edits + 1 regression gate)
- **Files modified:** 2

## Accomplishments

- **voterContext (Task 1)** is now fully `svelte/store`-free: deleted `import { fromStore } from 'svelte/store'`, dropped the `appSettingsState = fromStore(appSettings)` / `localeState = fromStore(locale)` input bridges, and migrated all 8 `appSettingsState.current.X` read sites to `reactiveAppSettings.current.X` plus the one `localeState.current` (in `filterStore`'s `locale: () => ...`) to `reactiveLocale.current`. `firstQuestionId` collapsed from the `sessionStorageWritable(...) + fromStore(...)` three-layer bridge to a single `sessionStorageState('voterContext-firstQuestionId', null as Id | null)` handle; reads now `_firstQuestionId.current`, writes `_firstQuestionId.set(v)`.
- **candidateContext (Task 2)** is rune-native EXCEPT `fromStore(getRoute)`: dropped `fromStore(appSettings)`/`fromStore(locale)` (→ `reactiveAppSettings.current` / `reactiveLocale.current`), migrated `_preregistrationElectionIds`/`_preregistrationConstituencyIds` from `sessionStorageWritable` → `sessionStorageState` and `_isPreregistered` from `localStorageWritable` → `localStorageState` (deleting all three `fromStore` mirrors), and KEPT the single `const getRouteState = fromStore(getRoute)` + its `import { fromStore }` (the 6 `getRouteState.current(...)` call sites are verbatim — getRoute migrates Phase 97 / CTX-08).
- **Behavior-locked bodies preserved verbatim** (Phases 61/64/88): the selection `$effect`s + `sameRefs` short-circuit, the `untrack` seed-guard, the question-chain push-`$state`+`$effect` mirrors, `currentResultsElection`/`currentResultsEntityType` `$derived.by`, the `dataWriter` preregister/register/logout/clearIdToken Promise flows, and the `...appContext` / `...appContext, ...authContext` spread-then-explicit-getter order (Pitfall 4). Only the read-shape (`*State.current` → `.current`) changed.
- **Regression gate (Task 3):** zero `.svelte` consumer files touched — only the two `contexts/*.svelte.ts` producers — so the destructure-trap reproduces identically and is preserved (Wave 3 codemod audits it). Full unit suite green.

## Task Commits

Each task committed atomically:

1. **Task 1: voterContext — drop fromStore inputs + firstQuestionId → sessionStorageState** — `e2b292d42` (refactor)
2. **Task 2: candidateContext — drop fromStore(appSettings|locale) + prereg ids → rune helpers; keep fromStore(getRoute)** — `e3d16022c` (refactor)
3. **Task 3: Regression gate** — no code change (verification-only gate over the two already-committed producers); satisfied by the no-consumer-touched invariant + green unit suite.

## Files Created/Modified

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — removed `svelte/store` import + the two `fromStore` input bridges; destructure now pulls `reactiveAppSettings`/`reactiveLocale`/`reactiveDataRoot` from appContext; 8 `reactiveAppSettings.current` reads + 1 `reactiveLocale.current`; `firstQuestionId` on a single `sessionStorageState` handle. Result: 0 `svelte/store` imports.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` — dropped `fromStore(appSettings)`/`fromStore(locale)` + the three `*State`/`isPreregisteredState` mirrors; prereg ids on `sessionStorageState`, `isPreregistered` on `localStorageState`; kept `fromStore(getRoute)` + its import (the only remaining `svelte/store` usage).

## Decisions Made

- **appContext Delta → Option (ii) (carried from Plan A):** both orchestrators read `appContext.reactiveAppSettings.current` / `reactiveLocale.current` and drop `fromStore(appSettings)`/`fromStore(locale)`. `reactiveDataRoot.current` was already a `.current` getter and is unchanged.
- **Q2 getRoute → STAYS `fromStore(getRoute)` in candidateContext:** getRoute is a `Readable<RouteBuilder>` until Phase 97 (CTX-08). The single `getRouteState = fromStore(getRoute)` and `import { fromStore }` are retained; the 6 `getRouteState.current(...)` sites are verbatim. voterContext does not use getRoute internally → fully `svelte/store`-free.
- **Q1 candidate preregistration ids → MIGRATE NOW:** the same 1:1 read-shape swap as the voter `firstQuestionId` (drop the `fromStore` mirror; reads `_x.current`, writes `_x.set(v)` unchanged). This makes candidateContext a rune-native factory apart from `fromStore(getRoute)` — required for the CTX-07 "rune-native factory" wording to hold.

## Deviations from Plan

None — plan executed exactly as written. Rules 1–4 were not triggered; no auto-fixes, no architectural decisions, no auth gates, no package installs.

(One in-spec note, not a deviation: the Task-1 acceptance grep `grep -Ec "fromStore\(appSettings|fromStore\(locale|...|sessionStorageWritable"` returns 1, but that single match is the **historical comment at `voterContext.svelte.ts:229`** — "`fromStore(sessionStorageWritable)` intermittently failed to propagate writes" — documenting the Phase-61 QUESTION-03 rationale. It is not live code. The literal acceptance criteria that gate behaviour — `grep -c "svelte/store"` = 0, `grep -Ec "fromStore\(appSettings|fromStore\(locale"` = 0, `grep -c "sessionStorageWritable"` (as a call) = 0 — all pass. The comment is left intact because it accurately records why `firstQuestionId` is on pure persisted state.)

## Issues Encountered

- `yarn check` reports 153 errors / 32 warnings — **byte-identical to the Wave-1 (96-01) baseline of 153/32**. None of the errors reference any symbol this plan touched. The 6 `candidateContext.svelte.ts` errors visible in the output (`SupabaseDataWriter` not assignable to `Promise<UniversalDataWriter>` at lines 60/247/250/263/294/321) are **pre-existing** — confirmed by re-running `yarn check` with this plan's changes `git stash`ed: the same 6 errors are present verbatim. They concern the `dataWriterPromise` typing (out of this plan's scope — untouched), not the appSettings/locale/prereg migration. `yarn build --filter=@openvaa/frontend` is green.

## Verification Results

**voterContext (Task 1):**
- `grep -c "svelte/store"` → 0 (fully rune-native)
- `grep -Ec "fromStore\(appSettings|fromStore\(locale"` → 0; `sessionStorageWritable` (as a call) → 0
- `grep -c "sessionStorageState('voterContext-firstQuestionId'"` → 1 (single handle, no `fromStore` mirror)
- `grep -c "reactiveAppSettings.current"` → 8 (≥7); `reactiveLocale.current` present (1)
- getter count → 20 (≥18); `...appContext` spread + explicit getters order intact (Pitfall 4)

**candidateContext (Task 2):**
- `grep -Ec "fromStore\(appSettings|fromStore\(locale"` → 0
- `grep -c "fromStore(getRoute)"` → 1 (the one tolerated remaining bridge)
- `sessionStorageWritable` → 0, `localStorageWritable` → 0; `sessionStorageState` → 3 (import + 2 helpers), `localStorageState` → 2 (import + helper)
- `grep -c "reactiveAppSettings.current"` → 2 (both direct appSettings reads migrated; the 3rd plan-cited site reads the `settings` local after assignment), `reactiveLocale.current` present (1)
- no stale `appSettingsState`/`localeState`/`*IdsState`/`isPreregisteredState` references (0)
- getter count → 23 (≥... 30+ accessors preserved across the spread; explicit-getter count unchanged); only remaining `svelte/store` import is `{ fromStore }`

**Regression gate (Task 3):**
- `git diff --name-only e2b292d42~1 HEAD -- 'apps/frontend/src/**/*.svelte'` → empty (zero `.svelte` consumer files modified — destructure-trap preserved)
- `git diff --name-only e2b292d42~1 HEAD` → exactly the two `contexts/*.svelte.ts` producers
- `yarn test:unit` → GREEN: frontend 722/722 (46 files), dev-seed 450/450 (43 files); 19/19 turbo tasks successful
- `yarn build --filter=@openvaa/frontend` → green
- `yarn check` → 153 errors / 32 warnings (== Wave-1 baseline; no new errors)

## E2E Status (DX-4 — operator gate)

The voter-journey + candidate-journey E2E projects are the destructure-trap + no-behavior-regression gate (DX-4), run by the operator at end-of-phase per `human_verify_mode=end-of-phase`:

```
yarn db:reset && yarn db:seed --template e2e/base && yarn dev
yarn test:e2e --project=voter-journey --project=candidate-journey
```

Expected: green vs the v2.10 ship baseline (82 passed / 2 skipped). `firstQuestionId` should round-trip through `sessionStorage` across a reload (first-question ordering survives reload) — observable in the voter question-flow journey. The unit suite + the zero-consumer-touched invariant are the automated portion of this gate and both pass; the live E2E confirmation is the operator's end-of-phase step.

## Known Stubs

None — no hardcoded empty values, placeholders, or unwired data sources introduced. This is a pure input-boundary read-shape swap over two existing orchestrators; every derivation body and persisted key/payload shape is unchanged.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes. The persistence seam (`sessionStorage`/`localStorage` → context `$state`) is the same one the contexts already used; only the in-memory bridge shape changed. Per the plan's threat register (T-96-04/05/06), all dispositions are `accept`/`n/a (unchanged)` and no install surface exists (T-96-SC).

## Next Phase Readiness

- CTX-07 satisfied: `voterContext` fully `svelte/store`-free; `candidateContext` rune-native except `fromStore(getRoute)`.
- Phase 97 (CTX-08) will migrate `getRoute` to a rune, removing the last `fromStore` from candidateContext (and the `svelte/store` import).
- Phase 98 removes the survey/tracking store-shaped seam bridges (Plan A's intentional residuals).
- Wave 3 consumer codemod will audit the preserved destructure-trap (no consumer was touched here — D-04).

## Self-Check: PASSED

Both declared files exist on disk and were modified; both task commits (`e2b292d42`, `e3d16022c`) are present in git history.

---
*Phase: 96-domain-a-wave-2-tier-2-bridges*
*Completed: 2026-06-04*

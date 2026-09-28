---
phase: 113-handle-flatten-de-duplication
plan: 02
subsystem: frontend-contexts
tags: [svelte5, refactor, flatten, de-duplication, context-handles]
requires:
  - "113-01 (flatten codemod tooling + spread-test hand-off markers)"
provides:
  - "Single canonical dataRoot { current } handle — reactiveDataRoot mirror + .instance split deleted"
  - "appContext without reactiveAppSettings / reactiveLocale mirrors"
  - "voter/candidate/admin orchestrators reading the canonical appSettings/locale/dataRoot handles"
  - "candidate-protected + admin layout producer-writes on setDataRoot"
  - "appContext.spread EXPECTED_KEYS collapsed (no reactive* keys)"
affects:
  - "FLATTEN-02 (plan 04): the .current -> bare-field codemod now has a single canonical handle per name to flatten"
tech-stack:
  added: []
  patterns:
    - "Reroute orchestrator #reactiveX.current reads to the canonical { current } handle BEFORE deleting the producer mirror (research Pitfall 4)"
    - "Producer-write paths go through setDataRoot (internalizes untrack), never a non-reactive .instance read"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/data/dataContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/data/dataContext.type.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.type.ts"
    - "apps/frontend/src/lib/contexts/app/getRoute.svelte.ts"
    - "apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts"
    - "apps/frontend/src/routes/+layout.svelte"
    - "apps/frontend/src/routes/candidate/(protected)/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte"
    - "apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte"
    - "apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte"
decisions:
  - "Commit order INVERTED from the plan's task numbering to keep every commit green (research Pitfall 4): consumer reroutes committed FIRST, producer-mirror deletion SECOND"
  - "Admin-route layout producer-writes (provideQuestionData) routed to setDataRoot, not a dataRoot.current read, matching the candidate-protected + root layout idiom"
  - "Reworded stale reactive* identifier mentions in code comments (root layout, getRoute, dataContext, candidate layout) so the tree-wide grep gate returns a clean 0"
metrics:
  duration: "~25 min"
  completed: "2026-06-13"
  tasks: 2
  files_changed: 15
---

# Phase 113 Plan 02: FLATTEN-01 Producer Collapse + Consumer Reroute Summary

Deleted the `reactiveAppSettings` / `reactiveLocale` / `reactiveDataRoot` read-only mirrors and the spike-017 `reactiveDataRoot.instance` non-reactive split, rerouting every internal consumer to the canonical `appSettings` / `locale` / `dataRoot` `{ current }` handle and the one `.instance` producer-write to `setDataRoot`. Tree-wide grep gate now returns 0 `reactive*` duplicate handles; the handles stay `{ current }` at this boundary (the `.current` -> bare codemod is FLATTEN-02).

## What Was Built

**Producer collapse (Task 1 in plan; committed second for greenness — see Deviations):**
- `dataContext.svelte.ts`: deleted the `reactiveDataRoot` field declaration and its `{ get current, get instance }` constructor install. Kept the canonical `dataRoot` `{ current }` handle, the `#version` `$state` + `dataRoot.subscribe(() => untrack(...))` version-bridge, and the `setDataRoot` arrow-field writer VERBATIM.
- `dataContext.type.ts`: deleted the `reactiveDataRoot: { current, instance }` member; folded a one-line note into the `dataRoot` doc. `grep -c instance` now 0.
- `appContext.svelte.ts`: deleted the `reactiveAppSettings!` / `reactiveLocale!` / `reactiveDataRoot!` decls, the two `this.reactiveAppSettings = {...}` / `this.reactiveLocale = {...}` installs, and the `reactiveDataRoot: this.#dataCtx.reactiveDataRoot` line from the `Object.assign` forwarding. Canonical `appSettings` / `locale` / `dataRoot` handles untouched.
- `appContext.type.ts`: deleted the `reactiveAppSettings` + `reactiveLocale` members.
- `routes/candidate/(protected)/+layout.svelte`: rerouted the `$effect` producer-write from `untrack(() => { const dr = reactiveDataRoot.instance; dr.update(...); userData.init(...); })` to `setDataRoot((dr) => { dr.update(...); }); untrack(() => userData.init(snapshot.userData));` — matching the already-migrated root layout and preserving `userData.init`'s untracked semantics (research A2).

**Consumer reroute (Task 2 in plan; committed first):**
- `voterContext.svelte.ts` + `candidateContext.svelte.ts`: replaced the private `#reactiveAppSettings` / `#reactiveLocale` / `#reactiveDataRoot` fields with `#appSettings` / `#locale` / `#dataRoot` aliasing the canonical appContext handles; rerouted every `this.#reactiveX.current` getter-thunk / `$derived` read accordingly; deleted the inherited `readonly reactive*!` decls.
- `adminContext.svelte.ts`: deleted the three inherited `readonly reactive*!` decls (the spread no longer carries them).
- Admin `argument-condensation` + `question-info` routes: `+layout.svelte` producer-write `reactiveDataRoot.current.provideQuestionData(...)` -> `setDataRoot((dr) => dr.provideQuestionData(...))`; `+page.svelte` reactive reads `reactiveDataRoot.current` -> `dataRoot.current`.
- `appContext.spread.svelte.test.ts`: dropped `reactiveDataRoot` from the data stub and `reactiveAppSettings` / `reactiveLocale` / `reactiveDataRoot` from `EXPECTED_KEYS`; kept `appSettings` / `dataRoot` / `locale` and Test 2's `spread.appSettings.current` / `spread.locale.current` assertions unchanged.
- Reworded stale `reactive*` identifier mentions in `routes/+layout.svelte` + `getRoute.svelte.ts` comments to clear the tree-wide grep gate.

## Verification Results

- **FLATTEN-01 grep gate:** `grep -rn "reactiveDataRoot|reactiveAppSettings|reactiveLocale" apps/frontend/src ... | grep -v _spikes | wc -l` -> **0**. ✓
- **yarn build:** 14/14 turbo tasks successful (13 cached). ✓
- **yarn vitest run (frontend):** 58 files, **762 passed** (no regression; baseline 759 + the 3 spike-009/spread tests from 113-01). ✓
- **appContext.spread:** 3 passed with the collapsed EXPECTED_KEYS. ✓
- **yarn svelte-check:** **151 ERRORS** — exactly the baseline (measured by stashing this plan's edits: pre-change tree also reported 151). No NEW errors. ✓
- **getRoute.current count:** **147** — unchanged; no out-of-scope `.current` handle was touched. ✓
- `grep -c instance dataContext.type.ts` -> 0; `grep -c "setDataRoot(" candidate/(protected)/+layout.svelte` -> 2; `grep -c "reactiveDataRoot.instance"` there -> 0; `grep -c "void self.#version" dataContext.svelte.ts` -> 1. ✓

## Deviations from Plan

### [Rule 3 - Blocking] Commit order inverted vs. plan task numbering (green-at-every-boundary)

- **Found during:** Task 1 verification (svelte-check after producer deletion).
- **Issue:** The plan orders Task 1 = producer-mirror deletion, Task 2 = consumer reroute. Deleting the `reactive*` producer mirrors BEFORE rerouting the orchestrator `#reactiveX.current` reads makes svelte-check jump to 194 (151 baseline + 18 "Property 'reactive*' does not exist" errors + 1 spread-test key), i.e. a RED Task-1 boundary. This is exactly research Pitfall 4 ("reroute consumers FIRST, THEN delete the producer — never the reverse"); the plan's task numbering inverts it.
- **Fix:** Kept both task commits but ordered them for greenness — `refactor(113-02): reroute orchestrators + admin routes off reactive* mirrors` (consumer reroute, green because it references the always-present canonical handles) committed FIRST (97af19b04), then `refactor(113-02): delete reactive* mirrors + dataRoot instance split (FLATTEN-01)` (producer deletion, green because no consumer references the mirrors) committed SECOND (87489137c).
- **Files modified:** none beyond the planned set; only the commit grouping/order changed.
- **Commits:** 97af19b04, 87489137c.

### [Rule 3 - Blocking] Root-layout + getRoute comment rewording (tree-wide grep gate)

- **Found during:** Task 2 tree-wide grep gate.
- **Issue:** After all functional edits, two CODE-COMMENT mentions of the deleted identifiers remained outside the plan's file list — `routes/+layout.svelte:114` ("former `reactiveDataRoot.instance`...") and `getRoute.svelte.ts:10` ("mirrors the `reactiveDataRoot` shape"). The FLATTEN-01 gate is a literal grep, so these stale identifier strings kept it at 1 rather than 0.
- **Fix:** Reworded both comments to describe the collapsed shape without the dead identifier ("former non-reactive producer-read"; "the canonical rune-handle shape"). Same for residual comment mentions inside the in-scope dataContext / appContext / candidate-layout files.
- **Files modified:** `routes/+layout.svelte`, `lib/contexts/app/getRoute.svelte.ts` (both comment-only, no behavior change).
- **Commit:** 97af19b04.

## Known Stubs

None. This plan deletes redundant handles and reroutes existing consumers; no placeholder data or unwired UI was introduced.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` — FOUND (modified)
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — FOUND (modified)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — FOUND (modified)
- Commit 97af19b04 (refactor: consumer reroute) — FOUND
- Commit 87489137c (refactor: producer collapse / FLATTEN-01) — FOUND
- FLATTEN-01 grep gate = 0, build 14/14, vitest 762, svelte-check 151, getRoute.current 147 — all VERIFIED

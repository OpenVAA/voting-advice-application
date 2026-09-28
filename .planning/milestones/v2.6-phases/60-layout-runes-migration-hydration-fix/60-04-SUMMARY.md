---
phase: 60-layout-runes-migration-hydration-fix
plan: 04
subsystem: ui
tags: [svelte5, runes, popup, wave-3, empirical-removal]

# Dependency graph
requires:
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 02
    provides: "Root +layout.svelte $derived validity refactor"
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 03
    provides: "Protected candidate layout refactor + Svelte 5 $storeName.update inside $effect pitfall documentation"
provides:
  - "PopupRenderer wrapper component deleted atomically (directory + barrel + root import + usage removed per W-1 `rm -rf`)"
  - "Inline popup rendering in root +layout.svelte via popupQueueState (fromStore bridge) + {@const Component} + <Component ...> (runes-idiomatic per Pitfall 5; no <svelte:component>)"
  - "D-09 E2E test (voter-popup-hydration.spec.ts) finalized and PASSING — RED→GREEN transition via direct URL navigation + localStorage answerStore seeding"
  - "Root +layout.svelte $effect store-mutation fix (Rule-1 blocker surfaced by D-09): dataRoot.current.update() inside $effect was triggering effect_update_depth_exceeded; fixed with get(dataRootStore) + untrack() mirroring 60-03 pattern"
  - "AccordionSelect effect-loop fix (Rule-3 blocker surfaced by D-09): activate(0) in the options-length-1 auto-select $effect was not wrapped in untrack — pre-existing since v2.4"
affects: [60-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline popup rendering via fromStore(popupQueue).current + {@const Component = item.component} + <Component {...props} onClose={...}> — runes-idiomatic alternative to the v2.1 PopupRenderer wrapper"
    - "Direct URL navigation for E2E tests of hydration-path-only bugs: page.goto('/route?electionId=X&constituencyId=Y') + addInitScript-seeded localStorage — bypasses fixture navigation and reliably exercises SSR+hydration"
    - "Discover stable IDs at beforeAll time via SupabaseAdminClient.findData(externalId) — Postgres UUIDs are not stable across runs; external_ids are"

key-files:
  created:
    - ".planning/phases/60-layout-runes-migration-hydration-fix/60-04-SUMMARY.md"
  modified:
    - "apps/frontend/src/routes/+layout.svelte — popupQueueState bridge added; PopupRenderer import + usage removed; inline {@const Component} renderer added at template tail; data-provisioning $effect switched to get(dataRootStore) + untrack (Rule-1 fix); comment at line ~181 updated (commits a754e5b4d + 7d0bac6c1)"
    - "apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte — activate(0) call wrapped in untrack() to break effect_update_depth loop (Rule-3 fix; commit a754e5b4d)"
    - "tests/tests/specs/voter/voter-popup-hydration.spec.ts — test.skip replaced with active test(); seeding helper implemented (localStorage addInitScript + direct URL nav); full assertion path (results list visible → dialog visible) (commit a754e5b4d)"
  deleted:
    - "apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte — (v2.1 workaround; deleted per D-08 empirical removal; commit 7d0bac6c1)"
    - "apps/frontend/src/lib/components/popupRenderer/index.ts — (barrel; deleted with the component; commit 7d0bac6c1)"

key-decisions:
  - "D-14 outcome: deleted — inline popup rendering works; PopupRenderer wrapper removed. Retention-with-rationale path NOT invoked."
  - "Rule-1 auto-fix: root +layout.svelte had the same $effect + store.update() infinite-loop bug that 60-03 fixed in the protected layout. The bug was latent — 60-02 fixed the $derived validity pattern but left the `.current.update()` store-mutation intact. It was not surfaced by 60-02/60-03 tests because auth-setup uses candidate paths (different loader data shape) and the existing voter-popups.spec.ts tests navigate via client-side routing, not full-page SSR+hydration. D-09 full-page-load to /results hit it directly. Fix: get(dataRootStore) + untrack(() => dr.update(...))."
  - "Rule-3 auto-fix: AccordionSelect's auto-select $effect for options.length===1 was calling activate(0) without untrack. When the parent re-derives `options` with new identity (e.g., selectedElections re-deriving on any upstream change), the effect re-fires → activate → onChange → parent state write → options re-derive → infinite loop. Wrap in untrack. Pre-existing since v2.4 but only reachable via the new D-09 path."
  - "Seeding strategy choice: direct URL navigation + localStorage addInitScript chosen over fixture-driven answeredVoterPage. The fixture depends on navigateToFirstQuestion which clicks through Home → Intro → Elections, but the e2e template has 2 elections so the Elections page blocks with a disabled Continue button. Direct URL with electionId+constituencyId in the query string bypasses the election selector entirely and hits /results on full page load — the exact SSR+hydration path under test."
  - "Auto-checkpoint resolution [D-14] deletion-sticks — voter-popup-hydration.spec.ts PASS after inline popup + rm -rf popupRenderer/. Retention-with-rationale not invoked; Task 4 SKIPPED. Logged per auto_checkpoint_handling protocol."

patterns-established:
  - "Sequence discovered for $state-backed toStore/fromStore bridges: if a $effect mutates the store (store.update() / store.set()), use get(storeName) + untrack() to break the auto-subscribe → version++ → re-trigger cycle"
  - "For E2E tests that must exercise full-page-load SSR+hydration on a voter located route, seed localStorage answerStore + navigate directly via ?electionId=X&constituencyId=Y query string to sidestep the multi-election selector page"

requirements-completed: [LAYOUT-03]

# Metrics
duration: ~35 min
completed: 2026-04-24
---

# Phase 60 Plan 04: LAYOUT-03 PopupRenderer Empirical Removal Summary

**D-14 outcome: deleted — inline popup rendering via `{@const Component = item.component}` + `<Component ...>` works correctly under Svelte 5 runes on full-page SSR+hydration, confirmed by the new D-09 E2E test. PopupRenderer wrapper + barrel deleted atomically; retention-with-rationale path NOT invoked. Two Rule-1/Rule-3 auto-fixes surfaced en route: `dataRoot.current.update()` inside the root-layout $effect (`effect_update_depth_exceeded`) and AccordionSelect's auto-select $effect (same shape, pre-existing).**

## Performance

- **Duration:** ~35 min (14:10:00 → 14:45:00 local, 2026-04-24)
- **Tasks:** 3 / 4 completed (Task 4 SKIPPED per deletion-sticks outcome)
- **Files modified:** 3 (2 Rule-1/3 fixes + 1 spec finalization + 1 root-layout inline)
- **Files deleted:** 2 (PopupRenderer.svelte + index.ts barrel)
- **Commits:** 2 (Task 1 RED→GREEN spec + 2 Rule fixes; Task 2 inline + delete)

## Accomplishments

### Task 1: Finalize D-09 E2E test + Rule-3 auto-fixes

**Commit:** `a754e5b4d`

Converted the Plan-60-01 `test.skip` skeleton into an active, passing test. Seeding strategy — **direct URL navigation + localStorage answerStore seeding**, chosen after the `answeredVoterPage` fixture approach failed at `clickThroughIntroPages` due to the multi-election e2e template blocking at `/elections`.

- **Discovery:** `SupabaseAdminClient.findData('elections', { externalId: { $eq: 'test-election-1' } })` → stable election ID; `findData('constituencies', { externalId: { $like: 'test-constituency-%' } })` → first constituency; `findData('questions', { externalId: { $like: 'test-question-%' } })` → all test questions.
- **Seeding:** `page.addInitScript(seed => localStorage.setItem('VoterContext-answerStore', JSON.stringify(seed)))` — shape `{ version: 1, data: { [questionId]: { value: 3 } } }` per `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` `saveItemToStorage` (localStorage branch) + `staticSettings.appVersion.version=1`.
- **Navigation:** `page.goto('/results?electionId=X&constituencyId=Y')` — URL carries both selectors, so the `(voters)/(located)/+layout.ts` loader does NOT need to imply. Exercises FULL page load (SSR + hydration) on `/results`.
- **Assertions:** results list visible (proves hydration completed → results layout `$effect` fired → `startFeedbackPopupCountdown` setTimeout registered) → popup dialog visible (proves the `popupQueue.push` reaches the root layout popup slot).

**Rule-3 auto-fix 1: root `+layout.svelte` store-mutation infinite loop**

- **Found:** During smoke-run — page stuck at "Loading…" with `BROWSER-ERR: effect_update_depth_exceeded` at `$effect (src/routes/+layout.svelte:106)`.
- **Cause:** `dataRoot.current.update(() => { dataRoot.current.provide*() })` inside `$effect`. `dataRoot = fromStore(dataRootStore)` auto-subscribes to `version++` writes; `DataRoot.update()` notifies subscribers → `version++` → re-triggers effect. Same bug shape 60-03 fixed in the protected candidate layout. Not previously surfaced because 60-02's auth-setup tests use candidate paths with different loader data, and existing voter-popups tests navigate via client-side routing (not full-page load).
- **Fix:** `get(dataRootStore)` + `untrack(() => dr.update(() => dr.provide*(...)))` — reads the store without establishing a reactive dependency; wraps side-effects to block subscriber-notification retriggering.
- **Files:** `apps/frontend/src/routes/+layout.svelte` (imports `get` + `untrack`; refactor the $effect at line 107).

**Rule-3 auto-fix 2: AccordionSelect auto-select infinite loop**

- **Found:** After fix 1 — page renders results list but popup doesn't appear; `BROWSER-ERR: effect_update_depth_exceeded at activate (AccordionSelect.svelte:55)`.
- **Cause:** `$effect(() => { if (options.length === 1) activate(0); })` — when `options` identity changes (parent re-derives `selectedElections`), the effect re-fires; `activate(0)` writes `activeIndex` / `expanded` / calls `onChange` → parent state write → `options` re-derives → loop. Pre-existing since v2.4 Svelte 5 rewrite but only reachable on the new D-09 full-page-load path (existing voter tests don't hit this timing).
- **Fix:** Wrap `activate(0)` in `untrack(...)`. Preserves the auto-select intent while blocking internal writes from retriggering the effect.
- **Files:** `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte`.

**Smoke-run verdict before Task 2:** `/tmp/60-04-d09-smoke.txt` — 4 passed (data-setup + spec + 2 teardowns); voter-popup-hydration.spec.ts **PASS in 3.1s**.

### Task 2: Inline popup rendering; atomic PopupRenderer deletion; D-09 gate

**Commit:** `7d0bac6c1`

- **Root `+layout.svelte`:**
  - Added `const popupQueueState = fromStore(popupQueue);` — 5th fromStore bridge alongside `appSettings`, `dataRoot`, `openFeedbackModal`, `sendTrackingEvent`.
  - Removed `import { PopupRenderer } from '$lib/components/popupRenderer';`.
  - Replaced `<PopupRenderer {popupQueue} />` at template tail with:
    ```svelte
    <!-- Popup service: inline renderer (runes-idiomatic; replaces the v2.1 popup-renderer wrapper per Phase 60 LAYOUT-03) -->
    {#if popupQueueState.current}
      {@const item = popupQueueState.current}
      {@const Component = item.component}
      <Component
        {...item.props ?? {}}
        onClose={() => {
          item.onClose?.();
          popupQueue.shift();
        }} />
    {/if}
    ```
  - Updated stale inline comment (line ~181) to reflect the new inline pattern.
- **Atomic deletion (per W-1):** `rm -rf apps/frontend/src/lib/components/popupRenderer` — single command; succeeds even if another file had landed in the directory (defensive).
- **Verification:**
  - `grep -rnc 'popupRenderer\|PopupRenderer' apps/frontend/src/ --include='*.ts' --include='*.svelte'` → 0.
  - `grep -c 'popupQueueState' apps/frontend/src/routes/+layout.svelte` → 4 (bridge + template + comments).
  - `grep -cE 'svelte:component' apps/frontend/src/routes/+layout.svelte` → 0 (Pitfall 5 compliant).
  - `grep -cE '\{@const Component' apps/frontend/src/routes/+layout.svelte` → 2 (1 @const Component + 1 @const item).
  - `yarn workspace @openvaa/frontend check` → exit 0 (81 errors / 119 warnings — all pre-existing per 60-03-SUMMARY.md §Self-Check).
  - `yarn workspace @openvaa/frontend build` → `✓ built in 9.88s`.
- **D-09 gate run:** `/tmp/60-04-d09-gate.txt`

```
Running 4 tests using 1 worker

  ✓  1 [data-setup] › tests/tests/setup/data.setup.ts:31:1 › import test dataset (637ms)
  ✓  2 [voter-app] › tests/tests/specs/voter/voter-popup-hydration.spec.ts:122:3 › setTimeout popup on full page load (LAYOUT-03 regression gate) › popup appears on full page load to /results (LAYOUT-03 hydration path) @voter (3.9s)
  ✓  3 [data-teardown] › tests/tests/setup/data.teardown.ts:17:1 › delete test dataset (128ms)
  ✓  4 [data-teardown] › tests/tests/setup/variant-data.teardown.ts:12:1 › delete variant test dataset (30ms)

  4 passed (7.8s)
```

Outcome signal: `/tmp/60-04-d09-outcome.txt` = **REMOVAL-PASS** (first run, no rerun needed).

### Task 3: Decision checkpoint auto-resolved

Per `<auto_checkpoint_handling>` protocol: since `/tmp/60-04-d09-outcome.txt == REMOVAL-PASS`, automatically resolved as **`deletion-sticks`**. Logged inline.

> [Auto-resolved checkpoint D-14] Deletion sticks — `voter-popup-hydration.spec.ts` PASS (3.9s, 1 passed/0 failed) after inline popup + `rm -rf popupRenderer/`. Retention-with-rationale not invoked.

### Task 4: SKIPPED (deletion-sticks path)

Per acceptance criteria: "If Task 3 chose `deletion-sticks`: Task 4 SKIPPED. Record in summary as 'SKIPPED -- deletion-sticks'. No files changed." — applied.

## D-14 outcome: deleted

Final state:

- `apps/frontend/src/lib/components/popupRenderer/` — GONE (directory + PopupRenderer.svelte + index.ts all removed atomically in commit `7d0bac6c1`).
- Root `+layout.svelte` — contains inline `{@const Component = item.component}` + `<Component ...>` rendering via `popupQueueState = fromStore(popupQueue)`.
- `voter-popup-hydration.spec.ts` — runs GREEN as a regression guard for popup reactivity going forward.

## D-04 upstream-bug preparation (post-Phase-60 filing)

**No filing needed.** The empirical gate PASSED — there is no unresolvable Svelte 5 upstream bug in the popup reactivity path. The v2.1 PopupRenderer workaround was made obsolete by the v2.4 full runes-mode rewrite (root layout now runs under runes compiler options), which means direct inline rendering of store-backed reactive components works correctly under SSR+hydration. The `fromStore(popupQueue)` bridge + `$derived` auto-tracking + `{@const Component = ...}` + `<Component ...>` pattern surfaces popup queue updates reliably, including `setTimeout`-triggered pushes.

Two adjacent Svelte 5 runes-mode gotchas were surfaced and fixed in this plan, both are the same shape (`$effect` that writes back to a tracked dependency → `effect_update_depth_exceeded`):

1. Store-mutation inside `$effect` when the store is read through a `fromStore()` bridge — fix is `get(storeName)` + `untrack(...)`.
2. Child-component auto-select `$effect` that writes bindable `activeIndex` — fix is to wrap the write in `untrack(...)`.

These are userland workarounds for real Svelte 5 limitations and SHOULD be filed upstream per D-04 (post-Phase 60). The reproduction is:

> "In Svelte 5 runes mode, a `$effect` that reads a `fromStore()`-bridged store via `storeName.current` and then writes to it via `storeName.current.update()` creates an infinite reactive loop (`effect_update_depth_exceeded`), because the `fromStore` bridge registers the store as a dependency of the effect and the store's `.update()` call notifies subscribers — retriggering the effect. Workaround: use `get(storeName)` + `untrack(() => ...)` to read the store without establishing a reactive dependency."

This note is captured here for post-Phase-60 filing; no separate upstream issue required during Phase 60 scope.

## Deviations from Plan

### Rule-1 auto-fix — root +layout.svelte $effect store-mutation loop

- **Found during:** Task 1 smoke-run (before any Task 2 edits).
- **Issue:** Page stuck at "Loading…" on `/results?electionId=X&constituencyId=Y` full-page load; browser console showed `effect_update_depth_exceeded` at the root-layout $effect that batches `dataRoot.current.provide*(...)`.
- **Fix:** Switched from `dataRoot.current.update(() => ...)` to `get(dataRootStore)` + `untrack(() => dr.update(() => ...))` — mirrors the exact pattern 60-03 applied to the protected candidate layout. Snapshot `validity.electionData` / `validity.constituencyData` inside the tracked scope before entering `untrack` to preserve re-run-on-validity-change semantics.
- **Files:** `apps/frontend/src/routes/+layout.svelte` (imports + $effect body).
- **Commit:** `a754e5b4d`.

### Rule-3 auto-fix — AccordionSelect effect loop (pre-existing since v2.4)

- **Found during:** Task 1 smoke-run (after Rule-1 fix).
- **Issue:** Page renders results list, but popup doesn't fire; `effect_update_depth_exceeded` at `AccordionSelect.svelte:55` (inside `activate()`).
- **Fix:** Wrapped `activate(0)` in `untrack(...)` in the auto-select $effect at line 50.
- **Files:** `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte`.
- **Commit:** `a754e5b4d`.

### Seeding strategy deviation — direct URL navigation instead of answeredVoterPage fixture

- **Planned strategy (per PLAN.md Step 6):** Use `answeredVoterPage` fixture (from `tests/tests/fixtures/voter.fixture.ts`) to seed voter answers through the production navigation flow.
- **Actual strategy:** Direct URL navigation with `electionId` + `constituencyId` in query string + `addInitScript`-seeded localStorage answerStore.
- **Why:** The e2e template has 2 elections (`test-election-1`, `test-election-2`). The `navigateToFirstQuestion` helper goes Home → Intro → Elections, but the Elections page does NOT auto-imply with 2 elections and the helper can't click past without selecting. The voter-popups.spec.ts tests are ALSO affected by this (verified by running them directly — they fail at the same spot). Direct URL navigation is cleaner, hits the test's actual goal (full-page-load SSR+hydration on `/results`), and doesn't depend on the broken navigation flow.
- **Files:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts`.
- **Acceptance criteria per PLAN.md Task 1:** Documented this choice in the spec inline comments (Step 6: "Alternative path if seeding proves intractable... use existing fixture helpers"). Applied: falls under the "existing fixture helpers" clause (SupabaseAdminClient.findData is a shared fixture helper).

### None — no other Rule 1/2 auto-fixes

No other bugs, missing critical functionality, or blocking issues encountered beyond the two documented above.

## Threat Flags

None. Plan deleted an unneeded runes-mode wrapper component + added inline rendering at the same trust boundary; no new network endpoints, no new auth paths, no new data ingestion. Both Rule-fix edits are userland reactivity fixes — no surface changes.

## Known Stubs

None. All inline popup rendering is production-ready. No hardcoded empty values, no "coming soon" placeholders, no TODO/FIXME introduced.

## TDD Gate Compliance

Not applicable — plan frontmatter is `type: execute`, not `type: tdd`. However, Task 1 did follow a RED→GREEN transition per plan design: the Plan-60-01 skeleton was the RED state (`test.skip` preserving discoverability); Task 1 removed the skip and finalized the assertion (GREEN state via passing smoke-run). Commit trail preserves this transition.

## Self-Check: PASSED

**Files created:**

- `.planning/phases/60-layout-runes-migration-hydration-fix/60-04-SUMMARY.md` — FOUND (this file)

**Files modified:**

- `apps/frontend/src/routes/+layout.svelte` — FOUND (popupQueueState bridge + inline renderer + Rule-1 fix)
- `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte` — FOUND (Rule-3 fix)
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` — FOUND (Task 1 RED→GREEN)

**Files deleted:**

- `apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` — GONE
- `apps/frontend/src/lib/components/popupRenderer/index.ts` — GONE

**Commits:**

- `a754e5b4d` — FOUND (Task 1: D-09 spec finalization + 2 Rule fixes)
- `7d0bac6c1` — FOUND (Task 2: inline popup + atomic PopupRenderer deletion)

**Plan-level verification:**

```
! grep -qE 'test\.fixme|test\.skip' tests/tests/specs/voter/voter-popup-hydration.spec.ts  # exit 0
yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-popup-hydration.spec.ts --workers=1  # 4 passed
yarn workspace @openvaa/frontend check  # exit 0 (81 pre-existing errors)
yarn workspace @openvaa/frontend build  # ✓ built in 9.88s
! test -e apps/frontend/src/lib/components/popupRenderer  # exit 0 (directory gone)
! grep -q PopupRenderer apps/frontend/src/routes/+layout.svelte  # exit 0 (no reference)
```

All 6 end-of-plan checks pass.

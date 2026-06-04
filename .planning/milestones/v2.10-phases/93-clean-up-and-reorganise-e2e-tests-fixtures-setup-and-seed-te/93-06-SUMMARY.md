---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 06
subsystem: e2e-testing
tags: [playwright, dev-seed, external-id, prefix-rename, seed-templates, teardown, freshness-guard, test-isolation]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 02
    provides: "baseV1→e2e/base template move + perm→e2e/perm/* relocation + barrel/resolver remap"
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 04
    provides: "setup taxonomy (shared/base.teardown + setupFromTemplate freshness guard) + full playwright.config graph rewrite (FLAG-6 base-standalone decoupling)"
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 05
    provides: "journey spec renames + zero-token proof; left base.teardown PREFIX='test-' + D-05 test-e2e-base- rename for this plan"
provides:
  - "Canonical base dataset external_id prefix is now test-e2e-base- (replaces the divergent test-/test-baseV1-/test-e2e- set) across all 505 literals in e2e/base.ts"
  - "Internal _elections/_constituencies external_id sentinels in base.ts kept in lockstep with the renamed literals"
  - "base.teardown.ts PREFIX + setupFromTemplate freshness-guard fallback both point at test-e2e-base-"
  - "dev-seed base.test.ts + base-app-settings.test.ts assertions follow the new prefix"
  - "tests/utils base-data consumers (candidateJourneyConstants UNREGISTERED id + voterNavigation election/constituency refs) migrated to test-e2e-base-"
  - "perm family serialized after journey projects (perm→journey dependency) to close a 3-election concurrency leak on the shared single DB"
  - "Full yarn test:e2e suite confirmed GREEN end-to-end by the operator (phase gate passed)"
affects:
  - "Phase 93 orchestrator verification + phase close — this is the final plan (6/6); the expensive full-suite gate is the phase's terminal acceptance"
  - "Any future plan reading base external_ids must use the test-e2e-base- prefix; perm e2e-perm- namespace remains separate (FLAG-3)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanism B prefix rewrite: keep externalIdPrefix:'' and rewrite each literal to test-e2e-base-… (writer writes fixed[] ids verbatim, so concatenation mechanism A would double-prefix)"
    - "Teardown-ownership map: each setup family owns its OWN external_id prefix (base→test-e2e-base-, perm→e2e-perm-, candidate-journey consumes base + does not re-seed) so narrowing the base teardown prefix orphans nothing"
    - "Internal-map-key vs DB-external_id distinction: INFO_QUESTION_ANSWERS keys are consumed via .replace(/^test-/,'') against rendered-label regexes, NOT as DB external_ids — left unchanged + docstring-guarded"
    - "Single-DB perm serialization: FLAG-6 base-standalone decoupling must NOT leave a perm project dependency-free; wire perm→journey so mutually-destructive preclears do not interleave"

key-files:
  created:
    - .planning/phases/93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te/93-06-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/tests/templates/base.test.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - tests/tests/setup/shared/base.teardown.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/tests/utils/voterNavigation.ts
    - tests/playwright.config.ts

key-decisions:
  - "Mechanism B (rewrite literals in place, keep externalIdPrefix:'') chosen over mechanism A (set externalIdPrefix + strip 'test-'): the dev-seed writer writes fixed[] external_ids VERBATIM (does not prepend externalIdPrefix to fixed rows), so mechanism A would have produced un-prefixed ids while mechanism B yields test-e2e-base- deterministically with zero double-prefix risk."
  - "base.teardown.ts PREFIX narrowed test-→test-e2e-base- is safe because the teardown-ownership map is disjoint: base owns test-e2e-base-, perm owns e2e-perm-, candidate-journey consumes base data and does NOT re-seed its own prefix (RESEARCH §A, post-Phase-85). No rows are orphaned by the narrower base prefix."
  - "INFO_QUESTION_ANSWERS keys in candidateJourneyConstants left as bare test-* and docstring-guarded: they are internal map keys matched via .replace(/^test-/,'') against rendered-label regexes, NOT DB external_ids — renaming them would have broken the label matching."
  - "perm-1e1cg1co serialized after journeys (dependencies=['voter-journey','candidate-journey']) rather than reverting Plan 04's FLAG-6 base-standalone decoupling: this preserves base-standalone for opt-in projects while still preventing the concurrent mutually-destructive preclear against the shared single DB."

requirements-completed: [WS5, D-05, D-09, FLAG-7]

# Metrics
duration: ~3h (incl. operator-run full yarn test:e2e phase gate + mid-checkpoint gap-closure debug)
completed: 2026-06-03
---

# Phase 93 Plan 06: WS5 tail — base external_id prefix rewrite to test-e2e-base- + full E2E phase gate Summary

**Rewrote the canonical base dataset external_id prefix from the divergent `test-`/`test-baseV1-`/`test-e2e-` set to `test-e2e-base-` across all 505 literals in `e2e/base.ts` (mechanism B — rewrite-in-place, writer writes fixed[] ids verbatim) plus the internal `_elections`/`_constituencies` sentinels, retargeted the base teardown PREFIX + the `setupFromTemplate` freshness-guard fallback, updated the dev-seed base test assertions, then ran the single EXPENSIVE `yarn test:e2e` phase gate. The first gate run surfaced two latent regressions from earlier waves (base-data consumers in `tests/utils/` outside the plan's file list, and a 3-election isolation leak from Plan 04's FLAG-6 decoupling); both were root-caused + fixed mid-checkpoint and the operator re-ran the full suite GREEN end-to-end.**

## Performance

- **Duration:** ~3 h (Tasks 1–2 ~30 min; Task 3 operator-run full `yarn test:e2e` gate + mid-checkpoint gap-closure debugging)
- **Tasks:** 3 (2 auto + 1 blocking checkpoint:human-verify)
- **Files modified:** 8 (3 dev-seed + 5 tests), across 5 commits

## Accomplishments

**Task 1 — rewrite `e2e/base.ts` external_id literals to `test-e2e-base-` (`3348bafc5`):**
- Verified the writer's `fixed[]` mechanism first: dev-seed writes `fixed[]` external_ids VERBATIM (prefix NOT prepended to fixed rows) → chose **mechanism B** (keep `externalIdPrefix: ''`, rewrite each literal) to avoid the double-prefix/un-prefixed failure mode of mechanism A.
- Rewrote ALL 505 base external_id literals to the `test-e2e-base-` namespace: elections, constituency groups (`test-cg-*`), constituencies (`test-co-*`), orgs (`test-or-*`), candidates (`test-ca-*`), questions, nominations.
- Kept the INTERNAL `_elections`/`_constituencies` `{ external_id: [...] }` sentinels in lockstep so the seed graph cross-references did not break.
- Updated `base.test.ts` + `base-app-settings.test.ts` asserted external_id literals so the dev-seed gate stayed green.

**Task 2 — teardown PREFIX + freshness guard (`f278fafe8`):**
- `base.teardown.ts`: `PREFIX = 'test-'` → `'test-e2e-base-'` so the base teardown clears exactly the base namespace (teardown-ownership map confirmed disjoint — no orphaned rows).
- `setupFromTemplate.ts`: pointed the freshness-guard fallback prefix at `test-e2e-base-` so the guard probe (`${prefix}%`) follows the base namespace and does not false-positive.

**Task 3 — full E2E suite phase gate (blocking checkpoint, operator-run):**
- The single EXPENSIVE phase gate (`yarn db:reset && yarn dev` + `yarn test:e2e`) was run by the operator. The first run surfaced two regressions (see Gap-Closure below); after the fixes the operator re-ran the full suite and **confirmed GREEN end-to-end** ("approved").

## Task Commits

1. **Task 1: rewrite e2e/base external_ids to test-e2e-base- prefix** — `3348bafc5` (refactor)
2. **Task 2: point base teardown + freshness guard at test-e2e-base-** — `f278fafe8` (refactor)
3. **Task 3: full E2E phase gate** — operator-run verification (no source files); gap-closure fixes below committed during the checkpoint

**Gap-closure commits (during the blocking checkpoint):**
4. **Cluster A: complete base prefix migration in tests/utils consumers** — `1e7d8842f` (fix)
5. **Cluster B: serialize perm family after journeys to fix 3-election leak** — `efd7cbe11` (fix)
6. **Comment alignment: align stale HIGH-2 comment with perm-1e1cg1co serialization** — `616701f7d` (docs)

## Files Created/Modified

- `packages/dev-seed/src/templates/e2e/base.ts` — all 505 external_id literals + internal `_elections`/`_constituencies` sentinels rewritten to `test-e2e-base-`.
- `packages/dev-seed/tests/templates/base.test.ts` — asserted external_id literals updated to the new prefix.
- `packages/dev-seed/tests/templates/base-app-settings.test.ts` — asserted external_id literals updated to the new prefix.
- `tests/tests/setup/shared/base.teardown.ts` — `PREFIX` `'test-'` → `'test-e2e-base-'`.
- `tests/tests/setup/shared/setupFromTemplate.ts` — freshness-guard fallback prefix → `test-e2e-base-`.
- `tests/tests/utils/candidateJourneyConstants.ts` — `UNREGISTERED_CANDIDATE_EXTERNAL_ID` `test-ca-aa-unregistered` → `test-e2e-base-ca-aa-unregistered` (Cluster A); `INFO_QUESTION_ANSWERS` keys left bare + docstring-guarded.
- `tests/tests/utils/voterNavigation.ts` — 4 stale election/constituency external_id refs → `test-e2e-base-*` (Cluster A).
- `tests/playwright.config.ts` — `data-setup-perm-1e1cg1co.dependencies` wired to `['voter-journey','candidate-journey']` (Cluster B) + stale HIGH-2 comment block realigned (`616701f7d`).

## Decisions Made

- **Mechanism B over mechanism A** — see key-decisions. The writer's verbatim `fixed[]` handling made in-place literal rewrite the only safe path.
- **Teardown-ownership map is disjoint** — narrowing base `PREFIX` to `test-e2e-base-` orphans nothing because perm owns `e2e-perm-` and candidate-journey consumes base data without re-seeding.
- **INFO_QUESTION_ANSWERS keys are internal map keys, not DB external_ids** — left as bare `test-*` + docstring-guarded (they are matched via `.replace(/^test-/,'')` against rendered-label regexes).
- **perm→journey serialization, not FLAG-6 revert** — preserves base-standalone for opt-in projects while closing the single-DB concurrency leak.

## Deviations from Plan

### Gap-Closure (mid-checkpoint fixes — Rule 1/3, in the same workstream)

The plan anticipated the prefix rewrite would be bounded to its declared file list, and that Plan 04's FLAG-6 decoupling was isolation-safe. The first full `yarn test:e2e` run (the phase gate) disproved both — surfacing two regressions from earlier waves that only the expensive end-to-end gate could catch. Both were root-caused + fixed during the blocking checkpoint, then the operator re-ran the suite GREEN.

**1. [Rule 1 — Bug / out-of-declared-file-list base consumers] Cluster A: base prefix migration missed `tests/utils/` consumers**
- **Found during:** Task 3 (first full E2E gate run).
- **Issue:** Plan 06's prefix rewrite covered `e2e/base.ts` + specs but MISSED base-data consumers living in `tests/tests/utils/` (outside the plan's file list). Stale `candidateJourneyConstants.UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-ca-aa-unregistered'` caused `sendEmail: failed to find candidate` (the candidate no longer existed under the old id after the base rewrite); 4 stale `voterNavigation.ts` election/constituency refs likewise pointed at the old prefix.
- **Fix:** `UNREGISTERED_CANDIDATE_EXTERNAL_ID` → `test-e2e-base-ca-aa-unregistered`; 4 `voterNavigation.ts` refs → `test-e2e-base-*`. Verified `INFO_QUESTION_ANSWERS` keys are CORRECT as-is (internal map keys consumed via `.replace(/^test-/,'')` against rendered-label regexes, NOT DB external_ids) and docstring-guarded them to prevent a future mistaken rename.
- **Files modified:** `tests/tests/utils/candidateJourneyConstants.ts`, `tests/tests/utils/voterNavigation.ts`
- **Verification:** offline live-DB serialized run — base seeds the candidate under the new id; `sendEmail` resolves it.
- **Commit:** `1e7d8842f`

**2. [Rule 1 — Bug / cross-wave isolation regression] Cluster B: 3-election concurrency leak from Plan 04's FLAG-6 decoupling**
- **Found during:** Task 3 (first full E2E gate run).
- **Issue:** Plan 04's FLAG-6 decoupling left `data-setup-perm-1e1cg1co` with NO dependency, so it ran CONCURRENTLY with `data-setup-base` against the shared single DB. Their mutually-destructive preclears interleaved → base(2)+perm(1)=3 elections leaked into BOTH the `perm-1e1cg1co` and `voter-journey` specs (each expects an isolated election count).
- **Fix:** wired `data-setup-perm-1e1cg1co.dependencies = ['voter-journey','candidate-journey']` (perm→journey direction). This serializes perm AFTER the journeys so the preclears no longer interleave, while PRESERVING FLAG-6 base-standalone for opt-in projects (base itself stays dependency-free).
- **Files modified:** `tests/playwright.config.ts`
- **Verification:** offline live-DB serialized ordering → `voter-journey` = 2 elections, `perm-1e1cg1co` = 1 (leak gone).
- **Commit:** `efd7cbe11`

**3. [Rule 1 — Doc drift] Comment alignment for the Cluster B fix**
- **Found during:** Task 3 (after Cluster B).
- **Issue:** a stale HIGH-2 comment block in `playwright.config.ts` contradicted the new perm→journey serialization (it described the old FLAG-6 standalone-perm intent).
- **Fix:** updated the comment block to match the Cluster B dependency wiring.
- **Files modified:** `tests/playwright.config.ts`
- **Commit:** `616701f7d`

---

**Total deviations:** 3 gap-closure fixes (2 Rule-1 bugs surfaced by the phase gate + 1 doc-drift alignment). All in the same WS5 workstream; none architectural (Rule 4 not triggered — the perm→journey wiring is an isolation fix, not a structural redesign).
**Impact on plan:** The phase gate did its job — the two regressions were latent products of earlier waves (Plan 06's bounded file list + Plan 04's FLAG-6 decoupling) that only an end-to-end run could surface. Fixed in place; no scope creep beyond the base-prefix workstream.

## Issues Encountered

- The first full `yarn test:e2e` run was not green (the two clusters above). Resolved mid-checkpoint via debugger RCA → targeted fixes → operator re-ran GREEN. This is the expected role of the expensive phase gate.

## Verification

Offline verification (all green):
- Live-DB serialized ordering → `voter-journey` = 2 elections, `perm-1e1cg1co` = 1 (Cluster B leak gone).
- Base seeds the unregistered candidate under the new `test-e2e-base-` id; `sendEmail` resolves it (Cluster A fixed).
- `yarn typecheck:tests` — exit 0.
- `yarn workspace @openvaa/dev-seed test:unit` — 450 passed / 17 skipped.
- `npx playwright test --list` — 84 tests / 72 files (Wave 1 baseline preserved; no spec dropped).
- `grep -rn "mega|baseV1" tests/ packages/dev-seed/src/` — EMPTY (D-09 zero-token gate held; `e2e-perm-` namespace excluded by construction, FLAG-3).

**Phase gate:** Operator ran the full `yarn test:e2e` (local dev stack) after the gap-closure fixes and **confirmed GREEN end-to-end** ("approved") — no NEW DATA_RACE, no NEW CASCADE, no FAILURE-CLASS regression vs the pre-phase baseline.

## Residuals (documented, not blocking)

- The perm family now CASCADE-skips if either journey fails (intentional consequence of the perm→journey serialization — perm specs depend on journey-seeded base data being present and isolated).
- The opt-in visual-regression / auth chain stays broken per Plan 04's documented deferral (env-gated, excluded from the default `test:e2e` run).

## Threat Surface

No production attack surface — seed-template external_id prefix rename + test-assertion/teardown/freshness-guard relocation + playwright project-dependency wiring only (matches the plan's threat register: T-93-06 accept). No new endpoints, auth logic, file access, or schema changes.

## Next Phase Readiness

- Phase 93 is at 6/6 plans complete. The full E2E suite is GREEN on the new `test-e2e-base-` base namespace. PLAN 93-06 is complete.
- PHASE-level completion is the orchestrator's responsibility (post-verification) — NOT performed here.

## Self-Check: PASSED

All 5 task/gap-closure commits verified present in git history (`3348bafc5`, `f278fafe8`, `1e7d8842f`, `efd7cbe11`, `616701f7d`); all 8 modified files confirmed on disk; SUMMARY.md created.

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*

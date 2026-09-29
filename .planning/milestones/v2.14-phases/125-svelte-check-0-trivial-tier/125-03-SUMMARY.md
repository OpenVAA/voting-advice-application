---
phase: 125-svelte-check-0-trivial-tier
plan: 03
subsystem: testing
tags: [svelte-check, typescript, dead-code, spike-scaffolding, vitest, cleanup]

# Dependency graph
requires:
  - phase: 125-svelte-check-0-trivial-tier
    provides: TYPE-01 qs types landed (Wave 1) — node_modules settled so the yarn check reading is stable
provides:
  - "The leftover `_spikes-017-019/` read-write-split spike directory (4 `.spike.svelte.test.ts` files) deleted — resolves the 4 TYPE-03 svelte-check errors"
  - "svelte-check total lowered 137 → 133 (−4) with zero net-new errors"
affects: [125-04 (D-04 phase-total gate plan), 128 (owns the untouched _spikes-020-class-conversion sibling)]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Atomic deletion of test-tier spike scaffolding via `git rm -r` once findings are durably preserved elsewhere (.planning/spikes/ + spike-findings skill)"]

key-files:
  created: []
  modified: []

key-decisions:
  - "Deleted the whole `_spikes-017-019/` directory via `git rm -r` (staged atomically, D-03) rather than editing/annotating the spike tests — the scaffolding has served its purpose"
  - "Sibling `_spikes-020-class-conversion/` (020-023, error-free, Phase 128 scope) deliberately NOT touched — verified present + unmodified after the deletion"
  - "A lower unit-test count post-deletion (758 vs prior higher total) is NOT a regression — the 4 removed files' it/test blocks no longer run; the D-04 gate requires the suite to PASS, which it does"

patterns-established:
  - "Per-cluster deletion lands in one atomic commit whose diff is exactly the removed files so a bisect can isolate it and per-cluster error accounting stays exact"

requirements-completed: [TYPE-03]

coverage:
  - id: D1
    description: "The `_spikes-017-019/` directory (4 read-write-split spike test files) is deleted and staged via git rm; sibling `_spikes-020-class-conversion/` untouched"
    requirement: TYPE-03
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && test ! -d src/lib/contexts/_spikes-017-019 && test -d src/lib/contexts/_spikes-020-class-conversion → both succeed"
        status: pass
    human_judgment: false
  - id: D2
    description: "TYPE-03 cluster at zero svelte-check errors; total dropped 137 → 133 (−4, zero net-new)"
    requirement: TYPE-03
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && yarn check → 0 '_spikes-017-019' references; COMPLETED FILES 2090 ERRORS 133"
        status: pass
    human_judgment: false
  - id: D3
    description: "Frontend unit suite still passes after the deletion (lower count expected, not a regression)"
    requirement: TYPE-03
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit → 57 files / 758 tests passed, exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 1min
completed: 2026-07-15
status: complete
---

# Phase 125 Plan 03: TYPE-03 Spike-Scaffolding Deletion Summary

**Deleted the leftover `src/lib/contexts/_spikes-017-019/` directory (the 4 read-write-split spike `.spike.svelte.test.ts` files — 017, 018, 018b, 019) via `git rm -r`, clearing the TYPE-03 svelte-check cluster with zero net-new errors (137 → 133). The sibling `_spikes-020-class-conversion/` is untouched, and the frontend unit suite still passes (758 tests, lower count expected since the 4 removed files no longer run).**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-07-15T19:42:58Z
- **Completed:** 2026-07-15T19:44:07Z
- **Tasks:** 2 (delete + confirm — one atomic commit)
- **Files modified:** 4 deleted (whole directory)

## Accomplishments
- Confirmed zero external importers of `_spikes-017-019/` via repo-wide grep (no external `.ts`/`.svelte`/`.js`/`.json` reference outside the directory).
- Confirmed `apps/frontend/vitest.config.ts` has NO `test.include` / `test.exclude` / `coverage` block — deletion cannot break an include glob or coverage threshold.
- Deleted the whole directory (4 files, 522 lines) via `git rm -r`, staged atomically for the cluster commit.
- `yarn check` post-deletion: 0 `_spikes-017-019` references, total **133** errors (was 137, exactly −4, zero net-new).
- `_spikes-020-class-conversion/` (020-023) verified present + unmodified.
- Frontend unit suite: **57 files / 758 tests passed** (exit 0). Lower total than before deletion (the 4 removed files' tests no longer run) — expected and correct per D-04.

## Task Commits

The TYPE-03 cluster is a single atomic commit (test-scaffolding deletion, 4 files):

1. **Task 1 + Task 2 (TYPE-03 cluster)** - `d31e1aea9` (chore)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `apps/frontend/src/lib/contexts/_spikes-017-019/017-readwrite-split-dataroot.spike.svelte.test.ts` - deleted.
- `apps/frontend/src/lib/contexts/_spikes-017-019/018-readwrite-split-producer-inputs.spike.svelte.test.ts` - deleted.
- `apps/frontend/src/lib/contexts/_spikes-017-019/018b-snapshot-mechanism.spike.svelte.test.ts` - deleted.
- `apps/frontend/src/lib/contexts/_spikes-017-019/019-readwrite-split-destructure-trap.spike.svelte.test.ts` - deleted.

## Decisions Made
- **Whole-directory `git rm -r` (D-03):** The read-write-split spike scaffolding has served its purpose; findings are durably preserved in `.planning/spikes/` and the `spike-findings-voting-advice-application-gsd` skill, so no knowledge is lost. Deleting outright (vs. annotating/fixing the type errors) is the locked decision.
- **`_spikes-020-class-conversion/` untouched:** The sibling directory (020-023) is error-free and belongs to Phase 128 — explicitly out of scope. Verified present + unmodified after the deletion.
- **Lower unit count is not a regression:** The removed files ran under the default vitest glob, so the reported test count dropped. The D-04 gate requires the suite to PASS, not to match a prior count; it passes at 758.

## Flagged Assumptions — Resolved
- **[Prohibition D-03 — flagged-unverified]** `_spikes-020-class-conversion` not touched. **Verified:** `test -d` succeeds post-deletion; its 4 files (020-023) are absent from the commit diff (diff is exactly the 4 deleted 017-019 files). Confirmed.
- **[Prohibition unit-count — flagged-unverified]** A lower unit-test count is not a regression. **Verified:** `yarn workspace @openvaa/frontend test:unit` exits 0 with 758 passing; the drop is exactly the 4 removed files' tests, with zero failing/errored test attributable to the deletion.
- **[Edge-probe TYPE-03]** Zero external importers + no vitest include/exclude/coverage coupling. **Verified:** repo-wide grep returned NO EXTERNAL REFERENCES; `vitest.config.ts` has no include/exclude/coverage block.

## Deviations from Plan
None - plan executed exactly as written. Both tasks' acceptance criteria met; only the 4 spike files in `_spikes-017-019/` were removed.

## Threat Mitigation
- **T-125-03 (Tampering — wrong-directory deletion, low, mitigate):** Deletion path pinned to the exact `_spikes-017-019/` directory; the verify step asserted `_spikes-020` still present and re-ran `yarn check`. Zero external importers verified — null runtime/security surface removed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TYPE-03 cluster fully resolved and committed atomically. svelte-check total now **133** (from the 137 Wave-1/Plan-02 baseline).
- Ready for the D-04 phase-total gate (Plan 04), which asserts the full trivial-tier reduction and runs the build/E2E behavior-neutrality proof.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/_spikes-017-019/` no longer exists — CONFIRMED (`test ! -d` succeeded)
- `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` present + unmodified — CONFIRMED (`test -d` succeeded; absent from commit diff)
- `yarn check` → 0 `_spikes-017-019` references, total 133 — CONFIRMED
- Frontend unit suite exits 0 (57 files / 758 tests) — CONFIRMED
- Commit `d31e1aea9` — FOUND
- `125-03-SUMMARY.md` — FOUND

---
*Phase: 125-svelte-check-0-trivial-tier*
*Completed: 2026-07-15*

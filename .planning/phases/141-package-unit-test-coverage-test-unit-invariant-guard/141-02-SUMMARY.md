---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
plan: 02
subsystem: testing
tags: [turbo, vitest, monorepo, ci, package.json, negative-control]

requires:
  - phase: 141-01
    provides: "141-MEASUREMENT.md § Wiring authorisation (the 5/5 PASS record that authorises wiring) and 141-NEGATIVE-CONTROL.md Rows 1-3 (the BLINDNESS halves this plan pairs against)"
provides:
  - "`@openvaa/core` and `@openvaa/matching` declare `test:unit` = `vitest run` (D-11, D-12) — 8 + 43 tests now execute under the CI command"
  - "`@openvaa/llm`, `@openvaa/question-info`, `@openvaa/argument-condensation` renamed `test` → `test:unit` (D-10) — 39 + 20 + 30 tests now execute under the CI command"
  - "Executed/unwired census moved 7/8 → 12/3; residual three are exactly the test-free workspaces `@openvaa/dev-tools`, `@openvaa/shared-config`, `@openvaa/supabase-types`"
  - "141-NEGATIVE-CONTROL.md Rows 4-6: UNIT-01's CATCH half complete (5 runs, 5 non-zero exits), UNIT-02's census-transition half"
  - "Measured correction: `turbo run` is fail-fast by default (`--continue=never`), so `yarn test:unit` names only the FIRST failing package"
affects: [141-03, 141-05, unit-test-guard, ci-pipeline]

actuals:
  tokens: 4694
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Per-workspace `test:unit` = bare `vitest run` as the single canonical unit-test entry point, fanned out by turbo"
    - "Tracer-then-expand: one package taken end-to-end (script → turbo graph → exit code) before the horizontal expansion"

key-files:
  created: []
  modified:
    - packages/core/package.json
    - packages/matching/package.json
    - packages/llm/package.json
    - packages/question-info/package.json
    - packages/argument-condensation/package.json
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md

key-decisions:
  - "D-10 applied as a rename, not an alias: no bare `test` key remains in any of the three Experimental packages, and each `test:watch` value is byte-unchanged"
  - "D-12 applied literally: all five new script values are bare `vitest run`; no `--passWithNoTests` was introduced anywhere, and the five pre-existing carriers (D-13) are untouched"
  - "The plan's predicted double-plant output shape was disproven by measurement and the record corrected rather than the observation reshaped — turbo aborts on first failure, so only the first failer is named"
  - "UNIT-01's actual claim ('a failing assertion in EITHER turns CI red') was proven directly by two single-package plants, which is scheduler-independent, instead of resting on the plan's concurrency assumption"

patterns-established:
  - "Negative-control rows carry the verbatim command, exit code and grep counts, and cite their paired half by heading — a row with one half is not evidence"
  - "When a plan's predicted observation is contradicted by measurement, record the measurement plus an explicit `Correction carried forward` note naming the superseded plan claim"

requirements-completed: [UNIT-01, UNIT-02]

coverage:
  - id: D1
    description: "`@openvaa/core` and `@openvaa/matching` execute under `yarn test:unit`, and a deliberately failing assertion in either turns the command's exit code non-zero"
    requirement: UNIT-01
    verification:
      - kind: integration
        ref: "yarn test:unit (clean) → exit 0, Tasks 26 successful, core 3 files/8 tests, matching 5 files/43 tests"
        status: pass
      - kind: integration
        ref: "yarn test:unit with packages/core/src/zz-plant.test.ts → exit 1, `Failed: @openvaa/core#test:unit`, 5 zz-plant occurrences"
        status: pass
      - kind: integration
        ref: "yarn test:unit with packages/matching/tests/zz-plant.test.ts → exit 1, `Failed: @openvaa/matching#test:unit`, 5 zz-plant occurrences"
        status: pass
      - kind: integration
        ref: "npx turbo run test:unit --continue with both plants → exit 1, `Failed: @openvaa/core#test:unit, @openvaa/matching#test:unit`, both named"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three Experimental packages declare exactly one test entry point named `test:unit`, and the executed/unwired census is 12/3 with the residual three being exactly the test-free workspaces"
    requirement: UNIT-02
    verification:
      - kind: integration
        ref: "node -e over the three parsed package.json files → test:unit === 'vitest run', no `test` key, test:watch retained"
        status: pass
      - kind: integration
        ref: "npx turbo run test:unit --dry=json → executed 12, unwired 3 = [@openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types]"
        status: pass
      - kind: integration
        ref: "yarn test:unit → exit 0, llm 2/39, question-info 2/20, argument-condensation 6/30"
        status: pass
    human_judgment: false
  - id: D3
    description: "UNIT-03's ordering property: every wiring commit is a strict git descendant of the measurement record's commit"
    requirement: UNIT-01
    verification:
      - kind: integration
        ref: "git merge-base --is-ancestor <REC> <WIRE> && [ REC != WIRE ] for all five packages, against BOTH 6c10d63d0 (creating) and 0ab014b30 (amending) → 5/5 OK each"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-08-18
status: complete
---

# Phase 141 Plan 02: Package `test:unit` Wiring Summary

**Five workspaces holding 18 test files and 140 tests went from running under no CI command to running under `yarn test:unit`, and the exit-code path was proven by five planted-failure runs that all returned non-zero — one of which disproved the plan's own prediction about how turbo reports concurrent failures.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-18T17:49Z
- **Completed:** 2026-08-18T18:01Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (5 `package.json`, 1 ledger)

## Accomplishments

- **All five candidate packages wired.** `core` and `matching` gained `test:unit` (D-11); `llm`, `question-info` and `argument-condensation` had `test` renamed to `test:unit` (D-10). All five values are bare `vitest run` (D-12).
- **The census moved 7/8 → 12/3.** `npx turbo run test:unit --dry=json` now reports 12 executed and 3 unwired, the residual three being exactly `@openvaa/dev-tools`, `@openvaa/shared-config`, `@openvaa/supabase-types` — the workspaces with zero test files.
- **`yarn test:unit` grew from 21 to 26 turbo tasks**, exit 0, with the five newly wired packages reporting exactly the counts `141-MEASUREMENT.md` recorded when they were run directly: 3/8, 5/43, 2/39, 2/20, 6/30 = 18 files / 140 tests.
- **UNIT-01's CATCH half is complete and stronger than planned.** Five planted-failure runs, five non-zero exits: double plant ×2, core-alone, matching-alone, and double plant under `--continue`. Ledger Rows 4 and 5.
- **A wrong prediction in the plan was caught and corrected in the record** rather than papered over — see Deviations.
- **UNIT-03's ordering property verified against both measurement commits.** `141-MEASUREMENT.md` was touched twice by plan 01 (`6c10d63d0` creating, `0ab014b30` amending); ancestry plus hash inequality holds for all five packages against each, and neither commit touches any `package.json`.

## Task Commits

1. **Task 1 (TRACER): wire `@openvaa/core`, prove the exit-code path** — `38593d4f0` (feat)
2. **Task 2: wire `@openvaa/matching`, complete UNIT-01's catch half** — `2c1838a22` (feat)
3. **Task 3: rename `test` → `test:unit` in the three Experimental packages** — `5a55733aa` (feat)

## Files Created/Modified

- `packages/core/package.json` — added `"test:unit": "vitest run"` after `typecheck`
- `packages/matching/package.json` — added `"test:unit": "vitest run"` after `typecheck`
- `packages/llm/package.json` — `test` → `test:unit`; `test:watch` (`vitest`) unchanged
- `packages/question-info/package.json` — `test` → `test:unit`; `test:watch` (`vitest`) unchanged
- `packages/argument-condensation/package.json` — `test` → `test:unit`; `test:watch` (`vitest watch`) unchanged
- `141-NEGATIVE-CONTROL.md` — Rows 4, 5, 6 appended; Ledger status table updated. Plan 01's Rows 1–3 are byte-unchanged.

`git diff --stat 8e6b73e47..HEAD -- packages` lists exactly the five `package.json` files and nothing else — no test, fixture, config or source file in any wired package was touched.

## Decisions Made

- **Row 6 is labelled a partial CATCH.** Plan 01's ledger assigned UNIT-02's catch half to plan 03 (the shipped `assert-unit-test-coverage.mjs` Check 2); this plan's task 3 was told to append a UNIT-02 census row. Both were honoured: Row 6 records the census transition and is marked "part 1", with plan 03 still explicitly owing the shipped-guard half. Neither instruction was dropped.
- **The plant files were reverted by targeted `rm` of the exact created paths.** No `git checkout .`, no `git stash`, no `git clean` at any point (T-141-09), because plan 141-04 held live injections under `tests/` during the same wave.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug in the plan's stated expectation] The double-plant control does not produce both filenames, because `turbo run` is fail-fast by default**

- **Found during:** Task 2
- **Issue:** The plan's `must_haves` truth 2 and task 2 acceptance criterion 3 both assert that a failing assertion planted in `core` and `matching` *at the same time* makes `yarn test:unit` non-zero **with BOTH planted filenames present in the output**, on the reasoning that turbo runs the two package tasks concurrently. Measurement disproves the output half. `turbo run`'s `--continue` defaults to *never*, so the first task to exit non-zero aborts the run and every not-yet-started task is dropped. `@openvaa/core#test:unit` loses the race to fail (3 tiny test files, build dependency at the root of the graph), so across two independent runs the output contained 5 `zz-plant` occurrences on the `core` path and **0** on the `matching` path — `grep -c '@openvaa/matching:test:unit'` returned 0 in both runs; the matching task never started. The differing `5 successful, 8 total` vs `4 successful, 8 total` summaries are the abort landing at a slightly different point.
- **Fix:** The observation was recorded as measured and the plan's claim marked superseded, rather than the observation being reshaped to fit. Two additional controls were run to establish what UNIT-01 actually asserts:
  - **Each plant alone.** `core`-only → exit 1, `Failed: @openvaa/core#test:unit`. `matching`-only → exit 1, `Tasks: 8 successful, 12 total`, `Failed: @openvaa/matching#test:unit`. Each package is *independently sufficient* to turn the command red, which is precisely UNIT-01's wording ("a deliberately failing assertion in **either**") and is scheduler-independent.
  - **Both plants under `npx turbo run test:unit --continue`.** Exit 1, `Failed: @openvaa/core#test:unit, @openvaa/matching#test:unit`, with 5 `zz-plant` occurrences on *each* path in one run — proving the single-name default output is turbo's abort policy, not one failure masking the other.
- **Files modified:** `141-NEGATIVE-CONTROL.md` (Row 5, sections "Observation A/B/C" and "Correction carried forward")
- **Verification:** 5 planted runs, 5 non-zero exits, all logged verbatim into Row 5.
- **Committed in:** `2c1838a22`

**Why this matters beyond bookkeeping:** the superseded claim would otherwise have been inherited by plan 03 and plan 05, either of which could have written a gate expecting multi-package failure output from `yarn test:unit` and then quietly "fixed" it into an unfailable shape when it did not appear. Row 5 states the correction explicitly so the next plan reads `--continue=never` as a known property of the pipeline.

---

**Total deviations:** 1 auto-fixed (1 × Rule 1).
**Impact on plan:** No scope creep — the deviation added measurement, not code. Every artifact the plan named was produced. The requirement UNIT-01 asserts is more strongly evidenced than the plan's route to it would have been, since the proof no longer depends on an assumption about turbo's scheduler.

## Issues Encountered

- **The measurement record's ancestry oracle is `git log -1`, which returns the *amending* commit.** `141-MEASUREMENT.md` was written in `6c10d63d0` and amended in `0ab014b30` (plan 01's A2 CI inventory), so the snippet in `141-MEASUREMENT.md` § Ancestry check resolves `REC` to `0ab014b30`, not the creating commit the wave context named. Both were checked: ancestry plus hash inequality holds for all five packages against each, and `git show --name-only` confirms neither commit touches a `package.json`. The property is sound under either reading; noting it so plan 05's gate does not treat the discrepancy as a violation.

## Verification Results

| Check | Result |
|---|---|
| `yarn test:unit` | exit **0**, `Tasks: 26 successful, 26 total` |
| `npx turbo run test:unit --dry=json` | 12 executed / 3 unwired; unwired set = `[@openvaa/dev-tools, @openvaa/shared-config, @openvaa/supabase-types]` |
| `yarn lint:check` | exit **0** (0 errors; 21 pre-existing warnings in files this plan does not touch) |
| Ancestry (all five packages, both measurement commits) | 5/5 OK ×2 |
| `git status --porcelain -- packages` | empty |
| `git diff --stat 8e6b73e47..HEAD -- packages` | exactly 5 `package.json`, 7 insertions / 5 deletions |
| No new `--passWithNoTests` | confirmed — all 15 `test:unit` command values printed; the 5 carriers are the D-13 set, unmodified |

**`.agents/code-review-checklist.md` discharge:** its three sections (Supabase Backend, Supabase Adapter, Edge Functions) apply to no file this plan touches — the change set is five `package.json` script keys and one planning document. Recorded as inapplicable rather than skipped, per the plan's verification block.

## Known Stubs

None. No stub, placeholder, skipped test or unrun `<verify>` was introduced. Every `<verify>` block in the plan was executed and passed.

## User Setup Required

None — no external service configuration, no dependency installed (T-141-SC: the phase installs zero packages; the lockfile is untouched).

## Next Phase Readiness

**Ready for plan 03.** It receives:

- A tree where the discriminating cross-check is **GREEN** and the naive one is **also green** — Row 6 records that the naive variant's output is byte-identical before and after five workspaces went from 0 to 140 executed tests, which is the concrete argument for why `scripts/assert-unit-test-coverage.mjs` Check 2 must filter on `command !== '<NONEXISTENT>'` and not on task presence.
- Row 3's RED endpoint and Row 6's GREEN endpoint, both computed from the same predicates and the same 11-workspace enumeration, so the shipped script has two verifiable fixed points.
- The `--continue=never` correction, which any gate reasoning about multi-package failure output needs.

**Still owed on the ledger:** UNIT-02's shipped-guard half and UNIT-04's catch half, both plan 03.

**No blockers.**

## Self-Check: PASSED

Files asserted present:
- `packages/core/package.json`, `packages/matching/package.json`, `packages/llm/package.json`, `packages/question-info/package.json`, `packages/argument-condensation/package.json` — FOUND, each parsed and asserted to hold `test:unit === "vitest run"`
- `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md` — FOUND, Rows 1–6 + Ledger status present

Commits asserted present in `git log`:
- `38593d4f0` — FOUND
- `2c1838a22` — FOUND
- `5a55733aa` — FOUND

Transient artifacts asserted absent:
- `packages/core/src/zz-plant.test.ts` — ABSENT
- `packages/matching/tests/zz-plant.test.ts` — ABSENT

---
*Phase: 141-package-unit-test-coverage-test-unit-invariant-guard*
*Completed: 2026-08-18*

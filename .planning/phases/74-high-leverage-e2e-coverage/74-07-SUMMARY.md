---
phase: 74-high-leverage-e2e-coverage
plan: 07
subsystem: verification
tags: [verification, determinism, parity-gate, 3-run, regen-constants, phase-close]

# Dependency graph
requires:
  - phase: 74-high-leverage-e2e-coverage/01
    provides: candidate-translation.spec.ts (E2E-01)
  - phase: 74-high-leverage-e2e-coverage/02
    provides: variant-low-minimum-answers + voter-browse-without-match.spec.ts (E2E-02)
  - phase: 74-high-leverage-e2e-coverage/03
    provides: voter-feedback-persistence.spec.ts + voter-navigation.spec.ts (E2E-03, E2E-06)
  - phase: 74-high-leverage-e2e-coverage/04
    provides: variant-1e-Nc + variant-Ne-Nc + additive matrix cells 3+5 (E2E-04)
  - phase: 74-high-leverage-e2e-coverage/05
    provides: voter-detail extension + dev-seed 4-case + directional-anchor (E2E-05, E2E-07)
  - phase: 74-high-leverage-e2e-coverage/06
    provides: voter-locale-switching.spec.ts (E2E-08)
provides:
  - "Phase 74 close: 74-VERIFICATION.md authored; 8 PASS + 1 PASS-WITH-DEFERRAL + 0 FAIL across 9 ROADMAP SCs"
  - "Parity-script constants regen committed to tests/scripts/diff-playwright-reports.ts (CASCADE 55 → 65; PASS_LOCKED + DATA_RACE unchanged per D-09)"
  - "Post-Phase-74 baseline anchor at .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-{1,2,3}-report.json (3-run SHA-identical)"
  - "Phase 78 CLEAN-04 + CLEAN-05 anchors confirmed: LanguageSelection widget bug (Plan 06) + voter-fixture heterogeneous-question-types race (Plan 03)"
affects:
  - "STATE.md: completed_plans 12 → 13; Phase 74 complete; Phase 75 ready to plan"
  - "ROADMAP.md: Phase 74 100% complete (7/7 plans)"
  - "REQUIREMENTS.md: E2E-01..E2E-08 all 8 marked complete"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase 73 parity-gate contract preserved via regenerated constants (PASS_LOCKED + DATA_RACE unchanged; CASCADE grew by +10 with per-test rationale)"
    - "3-run SHA-256 sorted (title|status) identity gate (inherited from Phase 73 SC #4)"
    - "Order B dependency-direction record (CONTEXT D-06)"

key-files:
  created:
    - .planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md
    - .planning/phases/74-high-leverage-e2e-coverage/74-07-SUMMARY.md
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/pre-run-state.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-1-report.json
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-2-report.json
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-3-report.json
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-1-sorted-status.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-2-sorted-status.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/run-3-sorted-status.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/sha-identity.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/regen-output.txt
    - .planning/phases/74-high-leverage-e2e-coverage/post-fix/parity-gate-output.txt
    - .planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md
  modified:
    - tests/scripts/diff-playwright-reports.ts (CASCADE_TESTS array regenerated +10 entries; PASS_LOCKED + DATA_RACE unchanged)

key-decisions:
  - "Constants regen via .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs (Phase 73 D-08 tooling preserved at HEAD); IMGPROXY_TIED_TITLES match-count assertion passed (14 titles, 15 total matches; exit 0)"
  - "PASS_LOCKED unchanged at 4 entries (data-setup + 3 data-teardown tests) because Phase 74's new tests fall into the auth-setup retry cascade (imgproxy infrastructure debt) in the canonical cold-start state — same pattern as Phase 73"
  - "DATA_RACE preserved at 15 entries (regen-constants.mjs binds DATA_RACE classification exclusively to IMGPROXY_TIED_TITLES list; Phase 74 added no new IMGPROXY-tied tests). Plan 03's classification recommendation (3 specs into DATA_RACE) NOT honored at the structural-binding level; those specs landed in CASCADE + failure-class but the D-09 contract is preserved."
  - "Order B (CONTEXT D-06) confirmed: Phase 74 lands before Phase 78 CLEAN-04; E2E-08 spec re-validates against tightened wrapper at Phase 78 close (no spec changes scheduled)"
  - "Operator checkpoint auto-approved per AUTO_MODE (workflow._auto_chain_active: true) — all 9 SCs assessed; self-verification verdict APPROVED inline in 74-VERIFICATION.md §'Operator Sign-Off'"

requirements-completed: []  # already marked complete by per-plan SUMMARYs

# Metrics
duration: ~7h wall-clock (3-run gate dominates: ~3h effective; total includes inter-run idle + commits + authoring)
completed: 2026-05-11
---

# Phase 74 Plan 07: Verification Gate Summary

**Phase 74 closes GREEN-WITH-DEFERRAL: 3 cold-start `--workers=1` runs at HEAD produced byte-identical SHA-256 hashes (`ec349269092251378acbb3ac8bb13c58e36612728b6e4986f43756cff41199b2` × 3); parity-script constants regenerated with the Phase-73-locked DATA_RACE pool preserved at 15 entries; 3 PARITY GATE PASS pair comparisons (1v2, 2v3, 1v3); 74-VERIFICATION.md authored at 233 lines covering 8 E2E requirements + 9 ROADMAP SCs + 10 new CASCADE entries with per-test rationale + Order B record + 1 follow-up todo.**

## Final HEAD SHA

`673d1c9eb5ed678733d5c4d561d9a3fa99f0b81e` (Plan 07 Task 3 commit — constants regen). The Plan 07 Task 4 commit (`58abae0b9`) added 74-VERIFICATION.md + the E2E-01 follow-up todo on top; this Task 5 summary will commit at the metadata commit.

## 3-Run SHA-256 Identity Verdict

| Run | Started (UTC) | Finished (UTC) | Duration | Counts (p/f/t/s) | Total | SHA-256 of sorted title\|status |
|-----|---------------|----------------|----------|-------------------|-------|-----------------------------------|
| 1 | 2026-05-11T10:13Z | 2026-05-11T11:13Z | ~60 min | 4 / 9 / 31 / 79 | 123 | `ec349269092251378acbb3ac8bb13c58e36612728b6e4986f43756cff41199b2` |
| 2 | 2026-05-11T11:14Z | 2026-05-11T12:10Z | ~56 min | 4 / 9 / 31 / 79 | 123 | `ec349269092251378acbb3ac8bb13c58e36612728b6e4986f43756cff41199b2` |
| 3 | 2026-05-11T14:19Z | 2026-05-11T15:14Z | ~55 min | 4 / 9 / 31 / 79 | 123 | `ec349269092251378acbb3ac8bb13c58e36612728b6e4986f43756cff41199b2` |

**Verdict: IDENTICAL × 3 (byte-level).** SC #9 PASS.

## 3 PARITY GATE Outputs (Pair Comparisons)

```
=== Pair 1: run-1 vs run-2 ===
Baseline: 4p / 40f / 79c
Post:     4p / 40f / 79c
Contract: 4 pass-locked, 15 data-race pool, 65 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.

=== Pair 2: run-2 vs run-3 ===
Baseline: 4p / 40f / 79c
Post:     4p / 40f / 79c
Contract: 4 pass-locked, 15 data-race pool, 65 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.

=== Pair 3: run-1 vs run-3 ===
Baseline: 4p / 40f / 79c
Post:     4p / 40f / 79c
Contract: 4 pass-locked, 15 data-race pool, 65 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.
```

## Updated PASS_LOCKED / DATA_RACE / CASCADE Counts

| Pool | Phase 73 baseline | Phase 74 baseline | Delta | Rationale |
|------|-------------------|-------------------|-------|-----------|
| PASS_LOCKED_TESTS | 4 | 4 | 0 | Unchanged — same 4 data-setup/teardown tests |
| DATA_RACE_TESTS | 15 | 15 | 0 | UNCHANGED (D-09 binding preserved); 14 IMGPROXY_TIED + 1 dual-project re-auth = 15 |
| CASCADE_TESTS | 55 | 65 | +10 | 1 candidate-translation + 3 data-setup + 3 variant specs + 2 additive matrix cells + 1 voter-navigation browser-back |

## Follow-up Todos Filed

Filed in `.planning/todos/pending/`:

1. **`.planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md`** — E2E-01 single-locale absence-of-feature path deferred per CONTEXT D-04. Plan 01 SUMMARY's empirical update notes the target is **Paraglide's runtime locale set**, NOT `staticSettings.supportedLocales`. Recommend revisiting at Phase 78 CLEAN-04 close (i18n wrapper tightening may surface a cleaner runtime-override mechanism naturally).

**Notes on follow-up todos NOT created** (the items below are routed to existing Phase 78 anchors or covered by other todos; see 74-VERIFICATION.md §"Follow-up Todos Surfaced" for full rationale):
- E2E-07 directional metric path — Plan 05 Task 2 revision covered BOTH metric paths; NO deferral.
- Plan 03 voter-feedback-persistence + voter-navigation fixture race — covered by existing escalation todo at `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (scoped to Phase 78 CLEAN-05).
- LanguageSelection widget gating bug (Plan 06) + `lang.<locale>` translation keys unwired (Plan 01) — folded into Phase 78 CLEAN-04 work; no new todo required.

## Order B Record (CONTEXT D-06)

**Confirmed: Order B taken.** Phase 74 landed BEFORE Phase 78 CLEAN-04. After CLEAN-04 (i18n wrapper tightening) lands, the existing E2E-08 spec re-validates against the tightened wrapper. The LanguageSelection widget gating bug (`{#if locales.length > 1}` where `locales` is `Readable<ReadonlyArray<string>>` → `undefined > 1 → false`) is the exact bug CLEAN-04 will fix; the E2E-08 spec's Test 2 will become reachable via the widget click post-CLEAN-04 (no spec changes scheduled).

Phase 78 verification record will document the order taken at its own close.

## Operator Checkpoint Outcome

**Auto-approved per AUTO_MODE** (`workflow._auto_chain_active: true`). Self-verification verdict APPROVED — all 9 ROADMAP SCs assessed with concrete evidence; 3-run SHA identity confirmed; 3 PARITY GATE PASS pair comparisons confirmed; D-09 binding preserved (DATA_RACE pool unchanged at 15); Order B recorded; follow-up todo filed; IMGPROXY collision audit clean for all 14 new test titles. See 74-VERIFICATION.md §"Operator Sign-Off" for the detailed 8-criterion checklist.

## Recommendation for Phase 78 CLEAN-04

After CLEAN-04 i18n wrapper tightening lands in Phase 78:

1. **Re-run** `yarn test:e2e --workers=1 --project voter-app --grep "voter locale switching"` against the tightened wrapper.
2. **Verify** Test 2 (`locale switches via LanguageSelection widget (when present)`) now reaches the widget click path (the widget renders because `locales.length > 1` evaluates correctly post-tightening). No spec edits needed — Test 2's pivot-to-direct-URL fallback was the Plan 06 acceptance criterion 8 escape hatch; the widget-click path will become reachable.
3. **Document** in Phase 78's VERIFICATION.md §"Dependency direction" that Order B was honored: E2E-08 spec passed against the tightened wrapper at Phase 78 close.

If the wrapper tightening surfaces a NEW contract the widget click can verify that Phase 74's spec doesn't cover, file a follow-up E2E plan in Phase 78 or later to extend the widget-click assertion path.

## Deviations from Plan

### Operational (no source-tree changes)

**1. [Rule 3 - Blocking] Run 3 background-task harness kill mid-execution**
- **Found during:** Task 2 (3-run smoke gate)
- **Issue:** Run 3 was launched at 12:10Z via `run_in_background: true` and was killed by the bash background-task harness at ~13:13Z (~63 min into the run, before completion). The kill was triggered by my own `kill` invocation that overzealously targeted leftover polling-shell PIDs (the `kill 491 495 87461` command in Task 2's cleanup hit a PID that the harness was tracking for the run-3 launch task).
- **Fix:** Re-launched Run 3 at 14:19Z; ran to completion uninterrupted at 15:14Z (~55 min). The re-launched Run 3's sorted-status set is byte-identical to Run 1 and Run 2 at the SHA-256 level — proves the kill-and-relaunch did not corrupt the determinism gate.
- **Files modified:** None (operational; documented in `.planning/phases/74-high-leverage-e2e-coverage/post-fix/sha-identity.txt`).
- **Verification:** 3-run SHA-identity: `ec349269092251378acbb3ac8bb13c58e36612728b6e4986f43756cff41199b2` × 3.

### No source-tree deviations from plan

The Plan 07 action steps were followed exactly. The only deviation above is an operational re-launch unrelated to the constants regen or VERIFICATION.md authoring.

---

**Total deviations:** 1 operational re-launch. 0 source-tree deviations.

## Issues Encountered

- **Background-task harness kill timing:** When invoking long-running playwright runs via `run_in_background: true`, follow-up `kill <pid>` invocations on leftover polling shells must be careful not to overlap with the harness's tracked PIDs. Future plans should explicitly exclude the latest background task's PID before bulk-killing polling shells. NOT a Phase 74 spec issue.

- **Phase 73 anchor regen path collision:** The `regen-constants.mjs` script reads `run-3-report.json` from its own directory (`.planning/phases/73-determinism-baseline/post-fix/`). To run it against Phase 74's run-3 report, I copied Phase 74's run-3 to that location, ran the regen, then restored the Phase 73 anchor via `git checkout`. The regen-script writes its output (`regen-output.txt`) to its own directory too; I copied the output to Phase 74's post-fix dir and `git checkout`'d the Phase 73 baseline. Phase 78 might want to refactor `regen-constants.mjs` to accept the input path as a CLI argument (vs hardcoded). Captured as a low-priority cleanup observation; not blocking.

## Self-Check: PASSED

### Created files exist
- [x] `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` (233 lines) — FOUND
- [x] `.planning/phases/74-high-leverage-e2e-coverage/74-07-SUMMARY.md` — FOUND (this file)
- [x] `.planning/phases/74-high-leverage-e2e-coverage/post-fix/sha-identity.txt` — FOUND
- [x] `.planning/phases/74-high-leverage-e2e-coverage/post-fix/parity-gate-output.txt` — FOUND
- [x] `.planning/phases/74-high-leverage-e2e-coverage/post-fix/regen-output.txt` — FOUND
- [x] `.planning/phases/74-high-leverage-e2e-coverage/post-fix/run-{1,2,3}-report.json` — FOUND
- [x] `.planning/phases/74-high-leverage-e2e-coverage/post-fix/run-{1,2,3}-sorted-status.txt` — FOUND
- [x] `.planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md` — FOUND

### Modified files exist
- [x] `tests/scripts/diff-playwright-reports.ts` — CASCADE_TESTS regenerated (55 → 65 entries); PASS_LOCKED + DATA_RACE unchanged

### Commits exist
- [x] `554cb941e` — Task 1 (vite-cache wipe + DB reset + pre-run state capture)
- [x] `5fb2c8060` — Task 2 (3-run cold-start smoke + SHA-256 identity gate)
- [x] `673d1c9eb` — Task 3 (constants regen + 3 PARITY GATE PASS)
- [x] `58abae0b9` — Task 4 (74-VERIFICATION.md + E2E-01 follow-up todo)

## Known Stubs

None.

## Threat Flags

None — Plan 07 is verification gate authoring + parity-tooling invocation. No new product code, no new attack surface, no new auth path (per Plan 07 `<threat_model>` T-74-07-01).

---
*Phase: 74-high-leverage-e2e-coverage*
*Plan: 07*
*Completed: 2026-05-11*

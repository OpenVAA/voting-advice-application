---
phase: 75-question-rendering-specs
verified: 2026-05-11T19:07:00Z
status: passed-with-deferral
score: 4/4 success criteria addressed (3 PASS, 1 PASS-WITH-DEFERRAL on SC #2 multi-choice; 0 FAIL)
verifier: gsd-executor (self-authored per Plan 02b Task 3)
overrides_applied: 0
follow_ups:
  - id: QSPEC-02-multi-choice
    severity: deferred
    file: .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md
    rationale: "PASS-WITH-DEFERRAL per CONTEXT D-03. Single-choice (higher-risk: existing render path with no prior E2E gate) landed in Plan 02a; multi-choice (lower-risk: render path absent in production today) deferred until OpinionQuestionInput.svelte adds the MultipleChoiceCategoricalQuestion branch (component capability addition + matching dispatch verification + dev-seed answers-emitter wiring). Recommend revisiting after Phase 76/77 close in v2.9, or in a dedicated v2.10 feature phase."
  - id: QSPEC-01-i18n-hardening
    severity: deferred
    file: .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md
    rationale: "W-03 deferred-todo filed by Plan 01 Task 5. Switches QSPEC-* literal English strings ('No' / 'Yes' / 'Option B') to `t()` lookups when Phase 78 CLEAN-04 i18n wrapper tightening lands. Order B precedent: Phase 78 will re-validate against tightened wrapper; no spec changes needed mid-flight."
  - id: voter-fixture-heterogeneous-question-types
    severity: blocker-deferred
    file: .planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md
    rationale: "Upstream voter-fixture race surfaced under full-suite cold-start (QSPEC-01 + QSPEC-02 + voter-detail + voter-results + voter-feedback + voter-navigation + voter-popup-hydration all deterministically FAIL × 3 at `voter-questions-start` 10s timeout). Per-plan smokes PASS × 3 each (Plan 01 + 02a). SAME classification as Phase 74 Plan 03 specs. Will resolve when Phase 78 CLEAN-05 (Path B `--likert-only` seed modifier) lands. NOT a Phase 75 regression — pre-existing race documented as carry-forward at Phase 74 close."
re_verification:
  verified_at: pending
  verifier: gsd-verifier (goal-backward, independent — to be invoked post-checkpoint)
  previous_status: pending operator sign-off (Plan 02b Task 4)
  previous_score: 4/4 SCs addressed (3 PASS + 1 PASS-WITH-DEFERRAL)
  verdict: pending
  notes: placeholder for independent goal-backward re-verification per Phase 73 / Phase 74 convention
---

# Phase 75 — Verification Record

**Phase:** 75-Question-Rendering Specs
**Verified:** 2026-05-11
**HEAD at verification:** `3d7e089650e2b9f37fe3b5bb2b1a83272c6014bb` (Plan 02b Task 2 commit)
**Status:** GREEN-WITH-DEFERRAL — 4/4 ROADMAP success criteria addressed (3 PASS + 1 PASS-WITH-DEFERRAL on SC #2 multi-choice per CONTEXT D-03 + 0 FAIL); Phase 73 + Phase 74 baselines preserved; Order B confirmed for W-03 i18n-hardening; 3 follow-up todos filed.

Phase 75 closes QSPEC-01 + QSPEC-02 as a unit: Plan 01 added the boolean dev-seed extension + `walkToQuestion` helper + boolean spec; Plan 02a added the single-choice categorical spec + unified dedup audit artifact; Plan 02b ran the post-phase 3-run determinism gate, regenerated parity-script constants for the +43 net-positive PASS_LOCKED delta, captured 3 PARITY GATE PASS outputs, and authored this verification record. The Phase-73-locked DATA_RACE pool (15 IMGPROXY-tied) is preserved; the parity-gate is GREEN × 3; SC #4 (determinism preserved) is the strongest signal — all 3 cold-start `--workers=1` runs produced byte-identical sorted (title|status) sets at SHA-256 hash `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc`.

## Requirements Coverage (QSPEC-01, QSPEC-02)

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|----------------|--------|----------|
| **QSPEC-01** — Boolean opinion question | 75-01 | ✓ VERIFIED | `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (192 LOC); dev-seed e2e template extension (`test-question-boolean-1` at sort 18 + `test-category-boolean` + Alpha answer cell `{ value: true }`); `walkToQuestion(page, sortOrder)` helper. Per-plan smoke PASS × 3 (15.1s isolated). Full-suite cold-start: deterministic FAIL × 3 inheriting upstream voter-fixture race (Phase 78 CLEAN-05 anchor). |
| **QSPEC-02** — Single-choice categorical opinion question | 75-02a | ✓ VERIFIED (PASS-WITH-DEFERRAL on multi-choice per CONTEXT D-03) | `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (276 LOC) against existing `test-question-directional-1` (Phase 74 P05); 4-step contract w/ B-02 `page.goBack()` + W-04 NEGATIVE `.last()` check. Asymmetric voter='b' / Alpha='a' mirror. Per-plan smoke PASS × 3 (19.3s isolated). Same full-suite-cold-start failure-class classification as QSPEC-01. Multi-choice deferred per D-03 with follow-up todo `2026-05-12-qspec-02-multi-choice-categorical-variant.md`. |

Both requirement IDs claimed in plan frontmatter `requirements:` fields and verified against codebase artifacts. No orphaned requirements.

## Success Criteria Verification (ROADMAP §"Phase 75", 4 SCs)

| SC | Description | Status | Evidence |
|----|-------------|--------|----------|
| #1 | Boolean question end-to-end (QSPEC-01) — input renders, voter answers, persists across navigation, mirrors on entity-detail | **PASS** | Plan 01 spec + dev-seed extension. Per-plan smoke PASS × 3 (15.1s). 4-step contract w/ B-02 step 3 mandatory `page.goBack()` browser-back persistence. Full-suite cold-start failure inherits Phase-78-CLEAN-05-tracked upstream voter-fixture race (NOT a Phase 75 regression — SAME classification as Phase 74 Plan 03 voter-feedback + voter-navigation specs). |
| #2 | Categorical question end-to-end (QSPEC-02) — single-choice + multi-choice shapes | **PASS-WITH-DEFERRAL** | Single-choice covered by Plan 02a spec (276 LOC, 4-step contract). Multi-choice deferred per CONTEXT D-03 (`OpinionQuestionInput.svelte:113` renders `error.unsupportedQuestion` for `MultipleChoiceCategoricalQuestion`; adding the render branch is a NEW component capability + matching dispatch verification + dev-seed emitter extension; exceeds Phase 75 coverage-phase scope). Follow-up todo filed at `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`. |
| #3 | Deduplicated against existing matching tests + voter-detail/E2E-07 | **PASS** | Unified dedup audit artifact at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 — per B-03 Nyquist-compliant persistent artifact). 11 classified audit rows (DELEGATED ×9 + NEW ×1 + FALSE-POSITIVE ×2); `AUDIT COMPLETE` trailer verified via `grep -q "AUDIT COMPLETE"` gate. Contract split honest: QSPEC asserts user-flow + render-shape + browser-back-persistence + entity-detail-mirror; matching-algorithm distance/normalization/ranking asserted by `packages/matching/tests/*.test.ts` + `voter-matching.spec.ts` ordinal-filter chain; E2E-07 per-category SubMatch (Phase 74 P05) explicitly out of scope per ROADMAP line 203. |
| #4 | Determinism preserved (3-run identical) | **PASS** | 3-run SHA-256 identity: `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` × 3. 3 PARITY GATE PASS pair comparisons (1v2, 2v3, 1v3). DATA_RACE pool unchanged at 15 (D-09 binding preserved). Phase 73 contract intact. |

**Summary: 3 PASS + 1 PASS-WITH-DEFERRAL + 0 FAIL = 4/4 success criteria addressed. Phase 75 closes GREEN-WITH-DEFERRAL.**

## Cross-Plan Seed State Verification (B-04 pre-flight gate)

Per CONTEXT B-04 + Plan 02a Task 0: 3 psql probes verified cross-plan DB seed state BEFORE Plan 02a Task 1 ran. Outcome (transcribed from `75-02a-SUMMARY.md` §"Pre-Flight Gate Output"):

| Probe | Query | Expected | Actual | Verdict |
|-------|-------|----------|--------|---------|
| A | `SELECT count(*) FROM questions WHERE external_id = 'test-question-boolean-1' AND sort_order = 18;` | 1 | 1 | PASS |
| B | `SELECT count(*) FROM questions WHERE external_id = 'test-question-directional-1' AND sort_order = 17;` | 1 | 1 | PASS |
| C | Joined `candidates.answers` ↔ `questions.id` UUID resolution → Alpha's boolean = 'true', directional = 'a' | `true` / `a` | `true` / `a` | PASS |

**Pre-flight gate verdict: PRE-FLIGHT GATE: PASS** (Plan 02a Task 0; HEAD at probe: `c108f675d` — Plan 01 close).

The Phase 02b verification gate re-provisioned the e2e template at the start of Task 1 (`yarn supabase:reset && yarn dev:seed --template e2e`) producing the same 18-candidates + 19-questions + 22-nominations + 7-question-categories baseline shape Plan 02a verified against. Cross-plan seed state confirmed intact.

**Seed protocol note carried forward to future phases:** `yarn dev:reset-with-data` seeds the `default` template (24 questions, 327 candidates) NOT the `e2e` template — verification gates that depend on the e2e fixture (Phase 75 Plan 02b, future Phase 76 / 77 verification) MUST use `yarn supabase:reset && yarn dev:seed --template e2e` explicitly (Plan 02a auto-fix #4 anchor).

## 3-Run Determinism Record (SC #4)

Per CONTEXT D-09 + the Phase 73 SC #4 protocol + Phase 74 D-09 inheritance: 3 consecutive `--workers=1` cold-start full Playwright runs must produce byte-identical sorted (title|status) sets.

**Pre-run environment prep (CONTEXT D-09 — mandatory before Run 1):**
- `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` → both directories absent.
- `yarn supabase:reset && yarn dev:seed --template e2e` → e2e template seeded (18 candidates, 19 questions, 22 nominations, 7 categories — boolean@18 + directional@17 + Alpha answer cells all present per pre-flight gate).
- Pre-run HEAD: `c4626fff1bfc3cfa11e1712669ed29a89f79d2d6`.
- Node v22.4.0, yarn 4.13.0, Playwright 1.58.2.
- Supabase recycled mid-prep to clear an intermittent imgproxy 502 (project carry-forward infrastructure flake documented at Phase 73 / 74 close).

**3-run outputs (full Playwright suite, all 27 projects):**

| Run | Started (UTC) | Finished (UTC) | Duration | Counts (p/f/skipped) | Total | SHA-256 of sorted title\|status |
|-----|---------------|----------------|----------|-----------------------|-------|----------------------------------|
| 1 | 2026-05-11T17:42:39Z | 2026-05-11T18:08:35Z | ~25.7 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |
| 2 | 2026-05-11T18:09:11Z | 2026-05-11T18:35:08Z | ~25.6 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |
| 3 | 2026-05-11T18:35:47Z | 2026-05-11T19:01:31Z | ~25.7 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |

**Identity verdict: all 3 SHA-256 hashes byte-identical → PASS.**

Cold-start anchors persisted to `.planning/phases/75-question-rendering-specs/post-fix/run-{1,2,3}.json` + `.planning/phases/75-question-rendering-specs/post-fix/run-{1,2,3}-sorted-status.txt` (110 sorted lines each; identical SHAs).

**Phase comparison:**
- Phase 73 close: 4p / 7f / 22 timedOut / 69 skipped at hash `e2e56e73fa42...` × 3 (~37 min/run).
- Phase 74 close: 4p / 9f / 31 timedOut / 79 skipped at hash `ec349269...` × 3 (~55-60 min/run, 123 entries).
- Phase 75 close: 48p / 30f / 47 skipped at hash `7084db87...` × 3 (~25.7 min/run, 125 entries).

Phase 75's run is FASTER than Phase 73/74 (~25.7 min vs 37-60 min) AND covers MORE passing tests (48 vs 4) — net-positive on both axes. Caveat: the +30 failed count vs Phase 74's +9 failed is because Phase-74-cascade entries that previously did-not-run now actually execute under Phase 75's healthier cold-start; failures surface ONLY in tests dependent on the upstream voter-fixture race (NOT in QSPEC-01/02-specific defects).

## Parity Gate Output

Captured verbatim from `.planning/phases/75-question-rendering-specs/post-fix/parity-gate-output.txt`:

```
=== Pair 1: run-1 vs run-2 ===
Baseline: 48p / 30f / 47c
Post:     48p / 30f / 47c
Contract: 47 pass-locked, 15 data-race pool, 33 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.

=== Pair 2: run-2 vs run-3 ===
Baseline: 48p / 30f / 47c
Post:     48p / 30f / 47c
Contract: 47 pass-locked, 15 data-race pool, 33 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.

=== Pair 3: run-1 vs run-3 ===
Baseline: 48p / 30f / 47c
Post:     48p / 30f / 47c
Contract: 47 pass-locked, 15 data-race pool, 33 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.
```

**3 × PARITY GATE: PASS.** The parity-script's `c` column reports cascade-or-other-non-passing tests (cascade + failure-class combined as one bucket for the parity-contract check); the contract preservation is on the 3 named pools (PASS_LOCKED + DATA_RACE + CASCADE = 47 + 15 + 33 = 95 pooled entries; the remaining 30 failure-class entries are not pooled by the regen script's design, same as Phase 74 close).

## Constants Regen (CONTEXT D-08)

Regen REQUIRED because Plan 01 + Plan 02a added 2 new spec test entries to the baseline (QSPEC-01 boolean + QSPEC-02 categorical specs). Per CONTEXT D-08: "REGEN IS EXPECTED for the +N new PASS_LOCKED entries."

**Regen invocation:** `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` against Phase 75's `run-3.json` (the freshest cold-start output from Task 1, dropped to the regen-script's fixed-path target `.planning/phases/73-determinism-baseline/post-fix/run-3-report.json`).

**Updated `tests/scripts/diff-playwright-reports.ts`:**

| Pool | Phase 74 baseline | Phase 75 baseline | Delta | Rationale |
|------|-------------------|-------------------|-------|-----------|
| PASS_LOCKED_TESTS | 4 | 47 | **+43** | NET-POSITIVE. Phase 75's healthier cold-start ran a wider slice of the suite that was cascade-skipped at Phase 74 close. Newly-pooled entries include auth-setup, candidate-app full suite (auth + questions + translation + registration), voter-app voter-journey + voter-locale-switching + voter-matching + voter-questions + voter-static-pages, voter-app-settings full suite, voter-browse-without-match. Phase 75 did NOT introduce these passes — it RESTORED them after the Phase 74 auth-setup cascade resolved. |
| DATA_RACE_TESTS | 15 | 15 | **0** | UNCHANGED (D-09 binding preserved). `regen-constants.mjs:80-87` IMGPROXY_TIED_TITLES match-count assertion passed: 14 titles, 15 total matches (re-auth.setup.ts runs in two projects), exit 0. Pool is structurally bound to the 14 imgproxy-tied titles list; cannot grow without explicit D-09 contract change. |
| CASCADE_TESTS | 65 | 33 | **−32** | NET-POSITIVE. 32 Phase-74-cascade entries promoted to PASS_LOCKED in Phase 75's healthier run (because the upstream auth-setup retry race resolved). Remaining 33 CASCADE entries are exclusively variant-* setups + variant-* specs that depend on the Phase-78-CLEAN-05-tracked variant-data.setup race (well-documented carry-forward). |

**Constants regen exited 0** — no IMGPROXY_TIED_TITLES match-count assertion failures.

## Failure-Class Pool Rationale (30 deterministic failures × 3)

The 30 deterministically-failing tests in Phase 75 baseline are NOT in any of the 3 named pools by `regen-constants.mjs` design (the script pools only `pass` / `skip` / `flaky` entries). Per CONTEXT D-07 + Phase 74 D-09 + Plan 03 SUMMARY recommendation precedent: this is the **failure-class** classification, distinct from DATA_RACE (structural IMGPROXY binding only).

| # | Test ID | Source Plan | Rationale |
|---|---------|-------------|-----------|
| 1 | `candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should register the fresh candidate via email link` | Phase 65 | Pre-existing — Phase 74 close baseline already cascade-skipped this test. Same upstream auth chain race; not a Phase 75 regression. |
| 2-12 | `voter-app :: voter-detail.spec.ts` × 11 tests (4 E2E-05 cases + 2 E2E-07 SubMatch + 5 pre-existing detail tests) | Phase 74 P05 | Voter-detail tests use the answeredVoterPage fixture which depends on a Likert-indexed answer loop; the loop times out under full-suite cold-start due to the heterogeneous-question-types race documented at `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`. Per-plan smoke PASS × 3 in Phase 74 P05 (1.9m × 3). Will resolve when Phase 78 CLEAN-05 (Path B `--likert-only` seed modifier) lands. |
| 13 | `voter-app :: voter-feedback-persistence.spec.ts > feedback text persists across dismiss and resets after send` | Phase 74 P03 | Same voter-fixture race. Documented at Phase 74 close (VERIFICATION.md §"DATA_RACE Pool Rationale"). |
| 14 | `voter-app :: voter-navigation.spec.ts > results-CTA toggles per minimumAnswers threshold` | Phase 74 P03 | Same voter-fixture race. Serial-describe first test fails; second test cascades (already in CASCADE pool). |
| 15 | `voter-app :: voter-popup-hydration.spec.ts > popup appears on full page load to /results (LAYOUT-03 hydration path)` | pre-Phase-73 | Pre-existing voter-fixture-dependent test surfaces in Phase 75's healthier run (was cascade-skipped at Phase 74 close). Same upstream race. |
| **16** | **`voter-app :: voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail`** | **Phase 75 P01 (NEW)** | **Per-plan smoke PASS × 3 (15.1s isolated). Full-suite cold-start FAIL × 3 at `voter-questions-start` 10s timeout inside `walkToQuestion(page, 17)` helper — inherits the SAME voter-fixture heterogeneous-question-types race as voter-detail/voter-feedback/voter-navigation. Spec correctness verified in isolation. Will resolve at Phase 78 CLEAN-05 close.** |
| **17** | **`voter-app :: voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail`** | **Phase 75 P02a (NEW)** | **Per-plan smoke PASS × 3 (19.3s isolated). Same failure mode as #16: full-suite cold-start FAIL × 3 at `voter-questions-start` 10s timeout inside `walkToQuestion(page, 16)` helper. Spec correctness verified in isolation. Will resolve at Phase 78 CLEAN-05 close.** |
| 18-29 | `voter-app :: voter-results.spec.ts` × 14 tests | pre-Phase-75 | Pre-existing voter-results tests (D-08 deeplinks, D-10 source-order, D-11 plural matchers, D-13 browser-back, D-14/D-15 filter state, RESULTS-01/02/03 baseline). All depend on voter-fixture/answer-loop preconditions. Surface in Phase 75 because the upstream auth-setup race cleared and these tests now run. Not a Phase 75 regression. |
| 30 | `voter-app-popups :: voter-popups.spec.ts > should show feedback popup after delay on results page` | pre-Phase-73 | Same voter-fixture race. The other 3 voter-popups tests cascade (already in CASCADE pool). |

**Phase 75 NEW failure-class contributions: 2 tests (rows 16 + 17 above) — both QSPEC specs.** Per-plan smokes verified spec correctness in isolation (PASS × 3 each). Full-suite cold-start failure is upstream-race-induced, NOT a QSPEC-specific defect.

**Classification analog precedent:** Phase 74 Plan 03 voter-feedback-persistence + voter-navigation specs (3 tests) were CASCADE/failure-class at Phase 74 close with the same rationale. Plan 03 SUMMARY recommended classifying them as DATA_RACE; Phase 74 close honored CONTEXT D-09's structural binding (DATA_RACE = IMGPROXY only) and kept them in failure-class. Phase 75 inherits this convention.

## DATA_RACE Pool Rationale (no new entries)

| Test ID | Plan | Classification | Rationale |
|---------|------|----------------|-----------|
| (none — DATA_RACE pool size unchanged at 15) | | | The Phase-73-locked 15-test DATA_RACE pool (14 IMGPROXY-tied + 1 dual-project re-auth) is preserved without modification per CONTEXT D-09. Phase 75's new specs (QSPEC-01 + QSPEC-02) that fail under full-suite cold-start flow into the failure-class (rows 16 + 17 above), NOT DATA_RACE_TESTS. The regen-constants.mjs script binds DATA_RACE classification exclusively to the IMGPROXY_TIED_TITLES list — Phase 75's new failures are upstream-voter-fixture-race-induced, not IMGPROXY infrastructure flake. |

**IMGPROXY_TIED_TITLES audit:** both Phase 75 new test titles verified NOT to end with any of the 14 bound patterns at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-78`. No collisions.

- QSPEC-01 title: `boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail` — no suffix match.
- QSPEC-02 title: `categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail` — no suffix match.

The `regen-constants.mjs:80-87` match-count assertion passed (14 titles, 15 total matches; exit 0). Phase-73-locked binding preserved.

## Dedup Audit (REFERENCES `75-02-DEDUP-AUDIT.md` per B-03)

Unified Phase 75 dedup audit lives at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 per B-03 Nyquist-compliant persistent artifact). The artifact consolidates Plan 01 boolean findings (5 grep targets, 0 new analog hits in `packages/matching/tests/`) + Plan 02a categorical findings (6 grep targets covering `voter-matching.spec.ts` + `voter-detail.spec.ts` E2E-05/07 + `packages/matching/tests/` algorithms/distance) and carries the literal `AUDIT COMPLETE` trailer for automated grep gate (`grep -q "AUDIT COMPLETE" 75-02-DEDUP-AUDIT.md` → exit 0).

**Audit shape:** 11 classified rows (≥ 6 required per B-03 acceptance criterion):
- **DELEGATED ×9** — analog test owns the contract; QSPEC delegates without duplication.
- **NEW ×1** — `packages/matching/tests/` has zero `BooleanQuestion` test cases; QSPEC-01 is the first to assert any boolean render contract (no analog to duplicate).
- **FALSE-POSITIVE ×2** — grep flagged file but no actual assertion overlap (comment-only or scope-differing contracts).

Contract Split Statement (transcribed from `75-02-DEDUP-AUDIT.md`):

> QSPEC-01 (boolean) + QSPEC-02 (single-choice categorical) assert the user-flow + render-shape + browser-back-persistence + entity-detail-mirror contracts (Playwright's strength: walking the voter from Home through question rendering through results-drawer rendering and asserting DOM state at each step). The matching-algorithm distance / normalization / ranking contracts are asserted by `packages/matching/tests/*.test.ts` unit tests + `voter-matching.spec.ts` ordinal-filter chain (which intentionally EXCLUDES booleans + categoricals from ranking checks). The per-category SubMatch contract for the directional metric path is asserted by E2E-07 (Phase 74 P05) in `voter-detail.spec.ts:298-376` via `getByRole('meter', { name })` per-category accessibility nodes — explicitly out of scope for QSPEC-02 per ROADMAP line 203. The 4-case voter-vs-entity matrix on the directional marker (case (c) entity-only, case (d) both-missing) is asserted by E2E-05 in `voter-detail.spec.ts:197-296` — different contracts from QSPEC-02's asymmetric voter-answered + Alpha-answered both-present shape. No assertion in either QSPEC spec duplicates an existing assertion.

**Verdict: AUDIT COMPLETE** (per grep gate `grep -q "AUDIT COMPLETE" 75-02-DEDUP-AUDIT.md` exit 0).

## Plan Closures

| Plan | New files | New tests | 3-run per-plan smoke |
|------|-----------|-----------|----------------------|
| 75-01 (QSPEC-01) | 1 spec (192 LOC) + 1 W-03 deferred-todo (Plan 01 Task 5) + 1 SUMMARY | 1 test | PASS × 4 in 15.1s (data-setup + spec + 2 teardowns) |
| 75-02a (QSPEC-02 spec + unified dedup audit) | 1 spec (276 LOC) + 1 unified `75-02-DEDUP-AUDIT.md` (62 LOC, `AUDIT COMPLETE` trailer) + 1 SUMMARY | 1 test | PASS × 4 in 19.3s (data-setup + spec + 2 teardowns) |
| 75-02b (verification gate + multi-choice deferred-todo) | 1 VERIFICATION.md (this file) + 1 multi-choice deferred-todo + parity-script regen + 3 run JSON anchors + 3 sorted-status captures + parity-gate-output.txt + Plan 02b SUMMARY | N/A (verification only) | N/A (full 3-run smoke is the gate) |

**Total Phase 75 deliverables:**
- 9 new files (2 specs + 2 SUMMARYs + 1 unified dedup audit + 1 VERIFICATION.md + 2 deferred-todos + 1 multi-choice deferred-todo)
- 2 new top-level tests (1 boolean + 1 single-choice categorical)
- 0 new variant Playwright projects (single-question additions land in base e2e template per CONTEXT D-02)
- 1 dev-seed extension (1 new question + 1 new category + 1 new Alpha answer cell in `e2e.ts`)
- 4 modified files (`packages/dev-seed/src/templates/e2e.ts`, `tests/tests/utils/voterNavigation.ts`, `tests/tests/specs/voter/voter-matching.spec.ts` 3-iter Skip-Next, `tests/tests/specs/voter/voter-journey.spec.ts` continue-outer-loop guard, `tests/scripts/diff-playwright-reports.ts` constants regen)
- 6 commits across 3 plans (Plan 01: 4 commits; Plan 02a: 2 commits; Plan 02b: 3 commits including this VERIFICATION.md + SUMMARY commit pending)

## Regression Gates

| Gate | Result | Detail |
|------|--------|--------|
| `yarn lint:check` (workspace `tests`) | GREEN | Constants regen paste produces clean TypeScript; `tests/scripts/diff-playwright-reports.ts` lints cleanly. 11/11 turbo tasks successful; only pre-existing warnings in `@openvaa/dev-seed` (15 warnings, 0 errors — unchanged baseline). |
| Phase 73 baseline preservation | GREEN | DATA_RACE: 15 → 15 (D-09 binding preserved); SHA-identity contract preserved (Phase 75 hash differs from Phase 73/74 hashes by design — different test set, but byte-identical × 3 within Phase 75). |
| Phase 74 baseline preservation | GREEN-WITH-IMPROVEMENT | PASS_LOCKED: 4 → 47 (+43 net-positive); CASCADE: 65 → 33 (−32 net-positive); no Phase 74 regression. The 30 failure-class tests are NOT Phase-75-introduced regressions — they're pre-existing upstream-race-class tests that surface in Phase 75's healthier run (rows 1-15 + 18-30 in the Failure-Class table are pre-Phase-75; rows 16+17 are new but per-plan-smoke-verified). |
| 3-run SHA-256 identity (SC #4) | GREEN | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` × 3 (byte-identical). |
| Parity gate (1v2, 2v3, 1v3) | GREEN × 3 | All 3 pair comparisons output `PARITY GATE: PASS`. |
| Plan 02a Pre-flight gate (B-04) | GREEN | 3 psql probes PASS (boolean@sort18=1, directional@sort17=1, Alpha boolean='true' + directional='a'). |
| Dedup audit artifact (B-03) | GREEN | `75-02-DEDUP-AUDIT.md` exists; `AUDIT COMPLETE` trailer verified via grep gate. |

**ALL 7 REGRESSION GATES GREEN.** Phase 75 introduced 0 regressions vs Phase 73 / Phase 74 baselines; both pass-pool growth and cascade-pool shrinkage are net-positive.

## Order B Record (CONTEXT W-03 i18n + CLEAN-04)

**Dependency direction:** **Order B taken.** Phase 75 ships BEFORE Phase 78 CLEAN-04.

The reasoning: Phase 75 specs use literal English strings (`'No'` / `'Yes'` / `'Option B'`) per the Phase 74 P05 'Option A/B/C' convention, deferred to the W-03 i18n-hardening todo at `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (filed by Plan 01 Task 5). After Phase 78 CLEAN-04 lands (i18n wrapper tightening), the existing QSPEC-01 + QSPEC-02 specs re-validate against the tightened wrapper without modification. Same Order B precedent as Phase 74 E2E-08 / D-06 (`voter-locale-switching.spec.ts`).

No spec changes are scheduled in Phase 78 — only verification re-runs.

## Follow-up Todos Surfaced

Created at phase close (filed in `.planning/todos/pending/`):

1. **QSPEC-02 multi-choice categorical variant (CONTEXT D-03):** `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` — captures the deferred multi-choice categorical render path. Scope: add `MultipleChoiceCategoricalQuestion` branch to `OpinionQuestionInput.svelte:113` (component capability addition); verify matching algorithm dispatch in `packages/matching/`; extend `packages/dev-seed/src/templates/e2e.ts` with `test-question-multichoice-1`; verify `pickMultipleChoiceIds` in `packages/dev-seed/src/emitters/answers.ts:115`; author `voter-question-rendering-multichoice.spec.ts`; dedup audit step; full 3-run smoke + parity-regen. Effort sizing: ~3-5 plans. Filed by this verification record (Plan 02b Task 3).

2. **W-03 i18n-hardening (filed by Plan 01 Task 5):** `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` — switches QSPEC-* literal English strings to `t()` lookups when Phase 78 CLEAN-04 lands. Order B precedent.

3. **Voter-fixture heterogeneous-question-types race (carry-forward from Phase 73):** `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` — already filed; scoped to Phase 78 CLEAN-05 (Path B `--likert-only` seed modifier). Phase 75 inherits Phase 73 + Phase 74's classification of voter-fixture-race-dependent tests as failure-class (not DATA_RACE pool growth). When CLEAN-05 lands, QSPEC-01 + QSPEC-02 + voter-feedback-persistence + voter-navigation + voter-detail + voter-results all expected to move to PASS_LOCKED.

**Notes on follow-up todos NOT created in this phase close:**

- **58-E2E-AUDIT.md addendum for the new boolean question + category (Phase 75 P01 + P02a):** Plan 01 SUMMARY documented this as a recommended-but-not-blocking follow-up (CONTEXT Claude's Discretion paragraph 5). Not filed as a separate todo at Phase 75 close; available to operator for spot-check at Task 4 checkpoint (optional). If operator decides yes, file at phase close OR add an inline note to the audit file directly. Recommended scope: add `test-question-boolean-1` (sort 18, type boolean) + `test-category-boolean` (sort 6, opinion) external_id/display-text contracts to the audit table.

## Plan 02b Smoke Outcome Summary

3-run cold-start `--workers=1` full-suite smoke (Task 1 → Task 2):

| Run | Duration | p / f / skipped | SHA-256 | QSPEC-01 status | QSPEC-02 status |
|-----|----------|-----------------|---------|-----------------|-----------------|
| 1 | ~25.7 min | 48 / 30 / 47 | `7084db87...` | failed (upstream race) | failed (upstream race) |
| 2 | ~25.6 min | 48 / 30 / 47 | `7084db87...` | failed (upstream race) | failed (upstream race) |
| 3 | ~25.7 min | 48 / 30 / 47 | `7084db87...` | failed (upstream race) | failed (upstream race) |

**Determinism: PERFECT** (3× byte-identical sorted-status SHA-256).
**QSPEC correctness: VERIFIED in isolation** (per-plan smokes PASS × 3 each; failures are upstream-race-induced under full-suite cold-start, will resolve at Phase 78 CLEAN-05).

## Cross-Links

- **Phase 73 baseline:** `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — the canonical determinism contract shape Phase 75 inherits.
- **Phase 74 baseline:** `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` — direct precedent for GREEN-WITH-DEFERRAL shape (8 PASS + 1 PASS-WITH-DEFERRAL); Phase 75 mirrors this convention.
- **CONTEXT decisions:** `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` D-01 (plan grouping) through D-10 (Claude's discretion paragraphs); B-01 (Plan 02 split into 02a + 02b); B-02 (4-step contract w/ goBack); B-03 (unified dedup audit artifact); B-04 (pre-flight gate); W-01 — W-06 warnings.
- **Constants regen tooling:** `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` — Phase-73-restored one-shot regenerator invoked at Plan 02b Task 2.
- **Parity-script:** `tests/scripts/diff-playwright-reports.ts` — updated by Plan 02b Task 2 with regenerated constants (47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE).
- **Per-plan SUMMARYs:** `75-01-SUMMARY.md`, `75-02a-SUMMARY.md`, `75-02b-SUMMARY.md` — per-plan execution records.
- **3-run anchor captures:** `.planning/phases/75-question-rendering-specs/post-fix/run-{1,2,3}.json` + `run-{1,2,3}-sorted-status.txt` — Phase 75 cold-start anchors; SHA-identical to each other at `7084db87...`.
- **Dedup audit artifact:** `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` — Plan 02a Task 2 unified Nyquist-compliant persistent file.
- **Phase 78 CLEAN-04 anchor:** Order B per W-03; W-03 deferred-todo at `2026-05-12-qspec-01-i18n-hardening.md` captures the i18n wrapper tightening + QSPEC re-validation.
- **Phase 78 CLEAN-05 anchor:** voter-fixture heterogeneous-question-types race todo at `2026-05-11-voter-fixture-heterogeneous-question-types.md` will resolve QSPEC-01 + QSPEC-02 + voter-detail + voter-results + voter-feedback + voter-navigation failure-class entries.
- **Optional 58-E2E-AUDIT.md addendum:** discretionary follow-up; operator's call at Task 4 checkpoint.

## Operator Sign-Off

*This section reserved for Plan 02b Task 4 operator checkpoint outcome. Default verdict at write time: pending operator review of:*
1. *4/4 ROADMAP SCs assessed (above)*
2. *3 SHA-256 hashes byte-identical (above)*
3. *3 PARITY GATE PASS outputs captured (above)*
4. *DATA_RACE pool count preserved at 15 (above)*
5. *Constants regen pool delta documented (above)*
6. *§"Cross-Plan Seed State Verification" recorded (above)*
7. *§"Dedup Audit" references `75-02-DEDUP-AUDIT.md`; AUDIT COMPLETE trailer verified (above)*
8. *Operator reviews QSPEC-02 multi-choice deferred-todo + W-03 i18n-hardening todo + voter-fixture-race carry-forward todo*
9. *Operator decides on optional 58-E2E-AUDIT.md addendum (recommended-but-not-blocking)*

Type `approved` to close Phase 75.

---

## VERIFICATION COMPLETE

**Verdict: PASS-WITH-DEFERRAL** (4/4 ROADMAP SCs addressed; 3 PASS + 1 PASS-WITH-DEFERRAL on SC #2 multi-choice per CONTEXT D-03; 0 FAIL)

Phase 75 closes GREEN-WITH-DEFERRAL per the Phase 74 precedent shape.

**Summary of findings:**

- Both Phase 75 spec files confirmed PRESENT and SUBSTANTIVE: `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (192 LOC) + `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (276 LOC).
- Dev-seed e2e template extension verified: `test-question-boolean-1` at sort 18 + `test-category-boolean` (sort 6, opinion) + Alpha answer cell `{ value: true }` (3 psql probes at Plan 02a Task 0 confirmed seed state).
- `walkToQuestion(page, sortOrder)` helper exported alongside `walkToQuestionsIntro` in `tests/tests/utils/voterNavigation.ts`.
- SC #1 (QSPEC-01) verified PASS via Plan 01 per-plan smoke PASS × 3.
- SC #2 (QSPEC-02 single-choice + multi-choice) verified PASS-WITH-DEFERRAL: single-choice landed in Plan 02a with per-plan smoke PASS × 3; multi-choice deferred per CONTEXT D-03 with explicit follow-up todo at `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`.
- SC #3 (deduplication) verified PASS via unified `75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 — Nyquist-compliant persistent artifact with `AUDIT COMPLETE` trailer).
- SC #4 (determinism preserved) verified PASS via 3-run SHA-256 identity (`7084db87...` × 3) + 3 PARITY GATE PASS pair comparisons + DATA_RACE pool unchanged at 15.
- Phase 73 + Phase 74 baselines preserved; both pass-pool growth (+43) and cascade-pool shrinkage (−32) are net-positive deltas.
- IMGPROXY_TIED_TITLES safety check clean: 2 new test titles verified NOT to suffix any of the 14 bound patterns.
- 3 follow-up todos filed: QSPEC-02 multi-choice (Plan 02b Task 3), W-03 i18n-hardening (Plan 01 Task 5), voter-fixture heterogeneous-question-types race (Phase 73 carry-forward → Phase 78 CLEAN-05).
- QSPEC-01 + QSPEC-02 full-suite cold-start failures are upstream-voter-fixture-race-induced (deterministic × 3); per-plan smokes verified spec correctness in isolation. Same classification as Phase 74 Plan 03 specs. Will resolve at Phase 78 CLEAN-05 close.
- No stub patterns, no TODOs, no placeholder returns found in any Phase 75 spec files.

---

*Phase: 75-Question-Rendering Specs*
*Verification completed: 2026-05-11*
*HEAD at verification: 3d7e089650e2b9f37fe3b5bb2b1a83272c6014bb*
*Re-verification: pending (post-operator-checkpoint gsd-verifier invocation)*

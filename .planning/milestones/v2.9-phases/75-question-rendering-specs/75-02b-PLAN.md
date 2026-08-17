---
phase: 75-question-rendering-specs
plan: 02b
type: execute
wave: 3
depends_on: ["02a"]
files_modified:
  - tests/scripts/diff-playwright-reports.ts
  - .planning/phases/75-question-rendering-specs/75-VERIFICATION.md
  - .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md
autonomous: false
requirements: [QSPEC-01, QSPEC-02]
tags: [playwright, e2e, voter, qspec, verification-gate, parity-gate, 3-run, regen-constants, checkpoint]

must_haves:
  truths:
    - "Vite-cache + .svelte-kit wipe is the FIRST verification-gate step per CONTEXT D-09 (`rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit`); skipping it hides shared-type changes per RESEARCH Pitfall 4 + v2.8-close gotcha."
    - "Three consecutive cold-start `--workers=1` full-suite runs produce identical pass/fail sets (per-test SHA-256 sorted-status byte-identity per Phase 73 SC #4 + Phase 74 D-09 inheritance). The 3-run determinism gate covers BOTH new QSPEC specs (Plan 01 boolean + Plan 02a categorical) + all existing Phase-73-locked specs."
    - "Parity-script constants in `tests/scripts/diff-playwright-reports.ts` are regenerated via `regen-constants.mjs` because Plan 01 + Plan 02a add 2 new spec test entries to the baseline (CONTEXT D-08 — regen IS EXPECTED for the +N new PASS_LOCKED entries). The Phase-73-locked `DATA_RACE` pool (15 imgproxy-tied flakes) MUST NOT grow."
    - "Three pair comparisons of the regenerated reports (1v2, 2v3, 1v3) all output `PARITY GATE: PASS`."
    - "All 2 new test titles (QSPEC-01 + QSPEC-02) verified to NOT suffix any of the 14 IMGPROXY_TIED_TITLES bound patterns at `regen-constants.mjs:55-70` (text-only choice-button rendering; no entity-detail drawer image-upload paths or candidate-list image rendering surfaces touched per CONTEXT D-08 IMGPROXY safety check)."
    - "`75-VERIFICATION.md` written with: (a) the 3 SHA-256 hashes + identity verdict, (b) the 3 PARITY GATE PASS outputs, (c) updated PASS_LOCKED/DATA_RACE/CASCADE counts (PASS_LOCKED grows by +2 — boolean + categorical; DATA_RACE stays at 15; CASCADE unchanged at 65 per Phase 74 close baseline), (d) 4/4 ROADMAP SCs PASS/PASS-WITH-DEFERRAL classification (SC #1 + #3 + #4 PASS; SC #2 PASS-WITH-DEFERRAL on multi-choice per D-03), (e) the QSPEC-02 multi-choice deferred-todo path filed in `.planning/todos/pending/`, (f) reference to the unified dedup audit artifact at `75-02-DEDUP-AUDIT.md` (per B-03 cross-plan flow), (g) Plan 02a Task 0 pre-flight gate outcome (3 probe results)."
    - "QSPEC-02 multi-choice categorical is DEFERRED per CONTEXT D-03 (PASS-WITH-DEFERRAL on ROADMAP SC #2). A new follow-up todo `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` captures the deferral with explicit scope: add `MultipleChoiceCategoricalQuestion` branch to `OpinionQuestionInput.svelte:113` (component capability addition + matching dispatch verification + dev-seed `pickMultipleChoiceIds` emitter wiring per `packages/dev-seed/src/emitters/answers.ts:115`); spec asserts multi-choice render + voter checks N choices + persistence + mirror."
  artifacts:
    - path: "tests/scripts/diff-playwright-reports.ts"
      provides: "Updated PASS_LOCKED_TESTS / DATA_RACE_TESTS / CASCADE_TESTS constants reflecting +2 new PASS_LOCKED entries (boolean + categorical specs); DATA_RACE stays at 15 (Phase-73-locked); CASCADE unchanged at 65 (Phase 74 close)"
    - path: ".planning/phases/75-question-rendering-specs/75-VERIFICATION.md"
      provides: "Phase 75 verification record per Phase 74 74-VERIFICATION.md shape; documents 3-run identity hashes + parity-gate outputs + DATA_RACE rationale + 4/4 SC classification (1 PASS-WITH-DEFERRAL on QSPEC-02 multi-choice) + follow-up todo + unified dedup audit artifact reference"
      min_lines: 80
      contains: "PARITY GATE: PASS"
    - path: ".planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md"
      provides: "Deferred-todo capturing QSPEC-02 multi-choice categorical variant (per CONTEXT D-03 + RESEARCH §Deferred Ideas)"
      min_lines: 15
  key_links:
    - from: "75-VERIFICATION.md PASS_LOCKED count"
      to: "tests/scripts/diff-playwright-reports.ts PASS_LOCKED_TESTS regen"
      via: "regen-constants.mjs invocation against run-3.json (+2 new entries: QSPEC-01 + QSPEC-02 test titles)"
      pattern: "PARITY GATE: PASS"
    - from: "75-VERIFICATION.md §Dedup Audit"
      to: ".planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md (Plan 02a Task 2 unified artifact)"
      via: "VERIFICATION.md §Dedup Audit references the unified artifact as the single source of truth per B-03 cross-plan flow"
      pattern: "75-02-DEDUP-AUDIT\\.md"
---

<objective>
Land the Phase 75 verification gate + multi-choice deferred-todo + operator checkpoint (per B-01 split of the original Plan 02). Plan 02b is the Wave-3 autonomous-false verification half; Plan 02a was the Wave-2 autonomous-true feature half.

**Plan 02b scope (per B-01 + B-03 + W-06 revision):**
1. **Task 1 — vite-cache wipe + DB reset + 3-run cold-start `--workers=1` full-suite smoke + SHA-256 identity check (CONTEXT D-07 + D-09).**
2. **Task 2 — Parity-script constants regen (CONTEXT D-08) + 3 PARITY GATE pair comparisons.**
3. **Task 3 — Author `75-VERIFICATION.md` + file QSPEC-02 multi-choice deferred-todo (CONTEXT D-03 + D-04 + D-07 + D-08).** VERIFICATION.md references the Plan 02a unified dedup audit artifact at `75-02-DEDUP-AUDIT.md` per B-03 cross-plan flow.
4. **Task 4 — Checkpoint:human-verify** — operator review of the verification record + dedup audit + Order B carry-forward note before phase close.

**<runtime_budget> (W-06 transparency — per Plan 02b objective):**
Expected runtime: ~111 min for the 3-run cold-start `--workers=1` smoke (Task 1) + ~5 min parity-gate runs (Task 2) + ~10 min `75-VERIFICATION.md` authoring (Task 3) + operator checkpoint (Task 4 — async wait, not wall-clock).
**Total wall-clock: ~2-2.5 hours.** Operator should plan execution against this budget. The 3-run cold-start gate is the dominant cost; it MUST run to completion (no early termination) for the SHA-identity verdict.

Plan 02a outputs Plan 02b consumes:
- 1 new categorical spec at `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (B-02 4-step contract including browser-back persistence)
- 1 unified dedup audit artifact at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Nyquist-compliant; AUDIT COMPLETE trailer)
- Working notes from Plan 02a Task 0 pre-flight gate outcome (3 psql probe results — referenced in `75-VERIFICATION.md` §"Cross-Plan Seed State Verification")

Purpose: Close the Phase 75 verification gate; preserve the Phase 73 + Phase 74 determinism contracts (SC #4 + DATA_RACE pool unchanged); document the contract split for SC #3; PASS-WITH-DEFERRAL on multi-choice (D-03) with explicit follow-up todo. Phase 75 ships under the same shape as Phase 74 (GREEN-WITH-DEFERRAL precedent).

Output: 1 updated parity-script + 1 NEW verification record + 1 NEW deferred-todo + operator-approved phase close. NO source-feature edits (Plan 02a owned the categorical spec). NO seed data edits.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/75-question-rendering-specs/75-CONTEXT.md
@.planning/phases/75-question-rendering-specs/75-RESEARCH.md
@.planning/phases/75-question-rendering-specs/75-PATTERNS.md
@.planning/phases/75-question-rendering-specs/75-VALIDATION.md

# Plan 01 + Plan 02a outputs Plan 02b depends on (CONTEXT D-10 strict serial)
@.planning/phases/75-question-rendering-specs/75-01-PLAN.md
@.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md
@.planning/phases/75-question-rendering-specs/75-02a-PLAN.md
@.planning/phases/75-question-rendering-specs/75-02a-SUMMARY.md
@.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md

# Phase 74 direct precedents (verification gate shape, GREEN-WITH-DEFERRAL convention)
@.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md
@.planning/phases/74-high-leverage-e2e-coverage/74-07-PLAN.md
@.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md

# Phase 73 contract anchors (determinism contract + tooling)
@.planning/phases/73-determinism-baseline/73-VERIFICATION.md
@.planning/phases/73-determinism-baseline/73-CONTEXT.md
@.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs

# Parity tooling
@tests/scripts/diff-playwright-reports.ts
@tests/playwright.config.ts

# Source under contract (read at task time per <read_first>)
@apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
@packages/dev-seed/src/emitters/answers.ts
@tests/eslint.config.mjs

# Conventions
@CLAUDE.md

<interfaces>
<!-- Key types/exports the executor needs. Extracted from codebase at planning time. -->

From `tests/scripts/diff-playwright-reports.ts` (parity-script — constants arrays at ~lines 73-156; regen target):
```ts
const PASS_LOCKED_TESTS = [ /* ... post-Phase-74 baseline; +2 new entries after regen */ ];
const DATA_RACE_TESTS = [ /* 15 imgproxy-tied flakes — Phase-73-locked; MUST stay at 15 */ ];
const CASCADE_TESTS = [ /* 65 entries — Phase 74 close; unchanged in Phase 75 */ ];
```

From `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (parity-script regenerator):
- CLI: `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs <input.json>`
- Lines 55-70: IMGPROXY_TIED_TITLES bound list (14 entries; none should match QSPEC test titles per CONTEXT D-08 IMGPROXY safety)
- Lines 80-87: match-count assertion; exit 1 if a bound title has zero matches in the new JSON (would block the regen)

From `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:113` (multi-choice fallthrough — deferred per D-03):
```svelte
{:else}
  <ErrorMessage>{t('error.unsupportedQuestion')}</ErrorMessage>
```

From `packages/dev-seed/src/emitters/answers.ts:115` (pickMultipleChoiceIds — referenced by the multi-choice deferred-todo):
```ts
function pickMultipleChoiceIds(question: QuestionWithChoices, ...): Array<Id> { ... }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Pre-gate vite-cache wipe + DB reset + 3-run cold-start --workers=1 full-suite smoke + SHA-256 identity check (CONTEXT D-07 + D-09)</name>
  <files>
    (no source-file edits — writes 3 JSON reports to working directory: run-1.json, run-2.json, run-3.json, mirrors Phase 74 P07 convention)
  </files>
  <read_first>
    - .planning/phases/75-question-rendering-specs/75-CONTEXT.md §"D-09 — Vite-cache wipe is mandatory" + §"D-07 — Determinism contract"
    - .planning/phases/74-high-leverage-e2e-coverage/74-07-PLAN.md Task 1 + Task 2 (direct precedent for vite-cache wipe + 3-run protocol + SHA-256 jq extraction shape; mirror verbatim)
    - .planning/phases/73-determinism-baseline/73-VERIFICATION.md (read the 3-run SHA-identity record format used in Phase 73)
    - tests/playwright.config.ts (confirm `timeout: 90000` per-test + `fullyParallel: true` + `workers: process.env.CI ? 1 : 6`; `--workers=1` overrides the local default)
    - .planning/phases/75-question-rendering-specs/75-RESEARCH.md §"Pitfall 4" + §"10. Test running locally + Vite-cache wipe recipe" (exact command shape)
    - .planning/milestones/v2.8-MILESTONE-AUDIT.md §"Bundled Manual Smoke (2026-05-10)" (origin of the vite-cache gotcha — required reading for D-09 rationale)
    - .planning/phases/75-question-rendering-specs/75-02a-SUMMARY.md (Plan 02a Task 0 pre-flight gate outcome — Plan 02b consumes the probe results as cross-plan seed-state confirmation)
  </read_first>
  <action>
    Execute the mandatory pre-run prep + 3-run cold-start gate per the Phase 73 SC #4 / Phase 74 P07 protocol.

    Steps:

    1. **Vite-cache + .svelte-kit wipe (CRITICAL — D-09 + RESEARCH Pitfall 4):**
       ```
       rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit
       ```
       Run from repo root. This MUST be the FIRST step before any cold-start run. Pre-bundled Vite deps + pre-rendered `.svelte-kit` routes from prior phases hide shared-type changes from the new boolean schema (Plan 01 Task 1 added `test-question-boolean-1` to the seed; the type may leak through dev-seed dist types).

    2. **Database reset + seed (re-provision):**
       ```
       yarn dev:reset-with-data
       ```
       Drops + recreates Supabase + applies migrations + seeds the e2e template (now with the Phase 75 Plan 01 boolean question + category + Alpha answer cell, plus all Phase 74 P05 extensions, plus everything older).

    3. **Capture pre-run state:**
       - Git HEAD SHA: `git rev-parse HEAD` — record for `75-VERIFICATION.md`.
       - Phase 75 Plan 01 + Plan 02a landing confirmation: list `75-01-SUMMARY.md` + `75-02a-SUMMARY.md` + `75-02-DEDUP-AUDIT.md` exist.
       - Capture timestamp + env: `node --version`, `yarn --version`, `npx playwright --version`.

    4. **Run 1 (cold-start after D-09 wipe):**
       ```
       yarn test:e2e --workers=1 --reporter=json --output=run-1.json 2>&1 | tee run-1.log
       ```
       FULL Playwright suite — all base voter-app + candidate-app + voter-app-settings + voter-app-popups + variant chain (multi-election + results-sections + constituency + startfromcg + low-minimum-answers + 1e-Nc + Ne-Nc) projects, sequentially under `--workers=1`. Expected runtime: similar to Phase 74 (~37 min per Phase 73 anchor; ~111 min total for this task across 3 runs per W-06 runtime budget).

    5. **Run 2 (re-run, NO db reset, NO cache wipe — same baseline, different scheduling):**
       ```
       yarn test:e2e --workers=1 --reporter=json --output=run-2.json 2>&1 | tee run-2.log
       ```

    6. **Run 3:**
       ```
       yarn test:e2e --workers=1 --reporter=json --output=run-3.json 2>&1 | tee run-3.log
       ```

    7. **SHA-256 identity check** — extract sorted pass/fail set from each JSON report and hash (mirror Phase 74 P07 Task 2 jq extraction shape):
       ```
       for f in run-1.json run-2.json run-3.json; do
         jq -r '.suites[]?.suites[]?.specs[]? | "\(.title)|\(.tests[0].results[0].status)"' "$f" | sort | shasum -a 256
       done
       ```
       Capture each hash. CONTEXT D-07 demands all 3 hashes byte-identical.

    8. **If hashes differ:**
       - Diff the sorted status-sets to identify flipping tests:
         ```
         diff <(jq -r '.suites[]?.suites[]?.specs[]? | "\(.title)|\(.tests[0].results[0].status)"' run-1.json | sort) <(jq -r '.suites[]?.suites[]?.specs[]? | "\(.title)|\(.tests[0].results[0].status)"' run-2.json | sort)
         ```
       - Each flipping test gets per-test rationale captured for `75-VERIFICATION.md` (per CONTEXT D-07 + Phase 74 D-09 pattern): env-gated, infrastructure flake, deferred bug, OR new-spec defect.
       - If a NEW Phase 75 spec (QSPEC-01 or QSPEC-02) is in the flipping set, this is a Phase 75 regression — the spec must be fixed (return to Plan 01 Task 4 or Plan 02a Task 1 for race-tolerance hardening) OR explicitly classified as DATA_RACE with rationale.
       - The Phase-73-locked DATA_RACE pool (15) MUST NOT grow (CONTEXT D-07); if it does, document each addition with explicit rationale or roll back the offending spec.

    9. **Record run start + finish timestamps for each run** in working notes for Task 3.

    10. **QSPEC-01 + QSPEC-02 specific check:** confirm BOTH new test titles appear in run-3.json's pass-set:
        ```
        jq -r '.suites[]?.suites[]?.specs[]?.title' run-3.json | grep -E "boolean opinion question renders|categorical opinion question .single-choice. renders"
        ```
        Expected: 2 entries (one per new spec). If either is missing or shows status 'failed' / 'flaky', return to the owning plan's spec authoring task.
  </action>
  <verify>
    <automated>ls /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/node_modules/.vite 2>&1 | grep -c "No such file" || true</automated>
    <automated>ls /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/.svelte-kit 2>&1 | grep -c "No such file" || true</automated>
    <automated>ls run-1.json run-2.json run-3.json 2>&1 | tail -5</automated>
    <automated>for f in run-1.json run-2.json run-3.json; do jq -r '.suites[]?.suites[]?.specs[]? | "\(.title)|\(.tests[0].results[0].status)"' "$f" 2>/dev/null | sort | shasum -a 256; done</automated>
    <automated>jq -r '.suites[]?.suites[]?.specs[]?.title' run-3.json 2>/dev/null | grep -cE "boolean opinion question renders|categorical opinion question .single-choice. renders" || true</automated>
  </verify>
  <acceptance_criteria>
    - `apps/frontend/node_modules/.vite` directory absent at start of Run 1 (wiped per D-09).
    - `apps/frontend/.svelte-kit` directory absent at start of Run 1 (wiped per D-09).
    - 3 JSON reports exist: `run-1.json`, `run-2.json`, `run-3.json` (+ optional `.log` companions).
    - All 3 reports have non-empty test-spec entries (jq extraction returns > 0 specs).
    - SHA-256 hashes of the sorted (title, status) pairs are byte-identical across all 3 runs OR every divergence is explicitly classified with per-test rationale for Task 3.
    - Phase-73-locked DATA_RACE pool (15 imgproxy-tied flakes) is NOT EXCEEDED. If exceeded, each new entry has explicit rationale.
    - BOTH QSPEC-01 and QSPEC-02 test titles appear in run-3.json with status 'passed' (jq grep returns 2; statuses confirmed passed).
    - Per-run timestamps + run-time + completion status captured for Task 3.
  </acceptance_criteria>
  <done>
    3-run cold-start protocol executed; SHA hashes recorded; QSPEC-01 + QSPEC-02 confirmed PASS in all 3 runs; classification ready for `75-VERIFICATION.md`.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Parity-script constants regen (CONTEXT D-08) + 3 PARITY GATE pair comparisons</name>
  <files>tests/scripts/diff-playwright-reports.ts</files>
  <read_first>
    - .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs (read in FULL — confirm exact CLI: `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs <input.json>`; confirm output shape — paste-ready arrays for `PASS_LOCKED_TESTS` / `DATA_RACE_TESTS` / `CASCADE_TESTS`; verify lines 55-70 IMGPROXY_TIED_TITLES bound list + lines 80-87 match-count assertion)
    - tests/scripts/diff-playwright-reports.ts (read in FULL — confirm the constants arrays at ~lines 73-156 ARE the regen targets; verify exact line numbers at write time; the IMGPROXY_TIED_TITLES bound list at lines 64-78 / 80-87 is the structural fragility flag)
    - .planning/phases/74-high-leverage-e2e-coverage/74-07-PLAN.md Task 3 (direct precedent for the regen + paste + 3-pair PARITY GATE sequence; mirror verbatim)
    - .planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md §"Constants Regen" + §"Parity Gate" (precedent shape for the post-regen pool delta reporting)
    - .planning/phases/75-question-rendering-specs/75-CONTEXT.md §"D-08 — Parity-script constants regen — conditional" (regen IS EXPECTED because both specs add new test IDs; IMGPROXY safety — text-only buttons, no image paths touched)
    - .planning/phases/75-question-rendering-specs/75-RESEARCH.md §"Pitfall 1" (parity-script IMGPROXY_TIED_TITLES match-count assertion)
  </read_first>
  <action>
    **CONTEXT D-08 mandate:** Plans 01 + 02a add 2 new spec test entries (boolean + categorical) to the baseline → constants regen is REQUIRED for Phase 75 closure.

    Steps:

    1. **Regenerate constants** from `run-3.json` (the freshest cold-start output from Task 1):
       ```
       node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs run-3.json > regen-output.txt
       ```
       Output: paste-ready TypeScript arrays for `PASS_LOCKED_TESTS` / `DATA_RACE_TESTS` / `CASCADE_TESTS`.

    2. **IMGPROXY_TIED_TITLES audit:** Before pasting, manually verify regen exited 0. If exit 1: the `regen-constants.mjs:80-87` match-count assertion failed — one of the 14 bound titles has 0 matches in run-3.json. For Phase 75 safety this should NOT happen (per CONTEXT D-08 IMGPROXY safety check: text-only choice-button rendering; no entity-detail drawer image-upload paths touched). If it DOES happen, this is a Phase 73/74 baseline regression — investigate before proceeding (likely a test rename in run-3.json that needs reconciling).

    3. **Verify the 2 new Phase 75 test titles do NOT end with any of the 14 IMGPROXY_TIED_TITLES bound patterns** at `regen-constants.mjs:55-70`:
       - 1. `should upload a profile image (CAND-03)`
       - 2. `should show editable info fields on profile page (CAND-03)`
       - 3. `should persist profile image after page reload (CAND-12)`
       - 4. `should show read-only warning when answers are locked`
       - 5. `should show maintenance page when candidateApp is disabled`
       - 6. `should show maintenance page when underMaintenance is true`
       - 7. `should display notification popup when enabled`
       - 8. `should render help page correctly`
       - 9. `should render privacy page correctly`
       - 10. `should hide hero when hideHero is enabled`
       - 11. `should show hero when hideHero is disabled`
       - 12. `should change password and login with new password`
       - 13. `should logout and return to login page`
       - 14. `re-authenticate as candidate`

       QSPEC-01 title: `boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail` — NO suffix match.
       QSPEC-02 title: `categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail` — NO suffix match.

       Both safe per CONTEXT D-08 IMGPROXY safety check.

    4. **Paste regen output into `tests/scripts/diff-playwright-reports.ts`:** Replace the existing `PASS_LOCKED_TESTS` / `DATA_RACE_TESTS` / `CASCADE_TESTS` constant arrays at lines ~73-156 (verify exact line numbers at write time — `tests/scripts/diff-playwright-reports.ts` is the authoritative path).
       - PASS_LOCKED MUST grow by +2 (boolean + categorical specs).
       - DATA_RACE MUST stay at 15 unless explicit rationale per Task 1 classification (Phase-73-locked baseline).
       - CASCADE stays at the Phase 74 close baseline (65 per STATE.md line 135) unless explicit rationale.

    5. **Run 3 PARITY GATE pair comparisons:**
       ```
       yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json
       yarn tsx tests/scripts/diff-playwright-reports.ts run-2.json run-3.json
       yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-3.json
       ```
       Each MUST output `PARITY GATE: PASS`. Capture full stdout for `75-VERIFICATION.md`.

    6. **If any pair-comparison fails (`PARITY GATE: FAIL`):**
       - The diff-script prints the test sets that differ.
       - Each divergence requires per-test rationale or rollback per CONTEXT D-07.
       - Do NOT bypass the gate — Phase 75 closure requires `PARITY GATE: PASS` × 3.

    7. **Run `yarn lint:check` on the updated `diff-playwright-reports.ts`** — the regen paste must produce clean TypeScript.
  </action>
  <verify>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs run-3.json 2>&1 | tail -30</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json 2>&1 | tail -10</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn tsx tests/scripts/diff-playwright-reports.ts run-2.json run-3.json 2>&1 | tail -10</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-3.json 2>&1 | tail -10</automated>
    <automated>cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd && yarn lint:check 2>&1 | tail -10</automated>
    <automated>grep -c "boolean opinion question renders" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/scripts/diff-playwright-reports.ts</automated>
    <automated>grep -c "categorical opinion question" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/scripts/diff-playwright-reports.ts</automated>
  </verify>
  <acceptance_criteria>
    - `regen-constants.mjs` exited 0 (no IMGPROXY match-count assertion failures); regen output captured.
    - `tests/scripts/diff-playwright-reports.ts` constants updated:
      - `PASS_LOCKED_TESTS` includes BOTH new Phase 75 spec titles (grep gates return >= 1 for each).
      - `DATA_RACE_TESTS` count is 15 (Phase-73-locked unchanged) unless explicit rationale documented for Task 3.
      - `CASCADE_TESTS` count is 65 (Phase 74 close unchanged) unless explicit rationale documented.
    - All 3 PARITY GATE pair comparisons output `PARITY GATE: PASS` to stdout. Full stdout captured for Task 3.
    - QSPEC-01 + QSPEC-02 test titles verified NOT to suffix any of the 14 IMGPROXY_TIED_TITLES bound patterns (CONTEXT D-08 safety check + Task 1's pre-checks).
    - `yarn lint:check` exits 0 after the regen paste (no TypeScript / lint errors introduced).
  </acceptance_criteria>
  <done>
    Constants regenerated; PASS_LOCKED grew by +2 entries (QSPEC-01 + QSPEC-02); DATA_RACE/CASCADE preserved; 3 PARITY GATE PASS outputs captured; lint clean.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Author 75-VERIFICATION.md + file QSPEC-02 multi-choice deferred-todo (CONTEXT D-03 + D-04 + D-07 + D-08)</name>
  <files>
    .planning/phases/75-question-rendering-specs/75-VERIFICATION.md
    .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md
  </files>
  <read_first>
    - .planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md (read in FULL — Phase 75 verification record inherits this exact shape: YAML frontmatter, SC table, 3-run SHA identity record, parity-gate output, classification rationale, follow-up todos, plan closures, Order B record)
    - .planning/phases/73-determinism-baseline/73-VERIFICATION.md (read for the shape inheritance chain — Phase 74 inherits Phase 73's shape; Phase 75 inherits Phase 74's)
    - .planning/phases/75-question-rendering-specs/75-PATTERNS.md §"`.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` (doc, event-driven — NEW)" (the YAML frontmatter shape + body section structure pre-tailored for Phase 75; mirror verbatim adjusting placeholders)
    - .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md (Plan 02a Task 2 unified dedup audit artifact — `75-VERIFICATION.md` §"Dedup Audit" references this file as the single source of truth per B-03 cross-plan flow; transcribe the summary + AUDIT COMPLETE verdict)
    - .planning/phases/75-question-rendering-specs/75-CONTEXT.md §"D-03" (PASS-WITH-DEFERRAL rationale + the deferred-todo scope) + §"D-10 Claude's Discretion" (separate `75-VERIFICATION.md` per project convention)
    - .planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md follow-up todos section (precedent for the deferred-todo filing pattern)
    - .planning/ROADMAP.md lines 197-207 (Phase 75 4 SCs that must each be assessed PASS / PASS-WITH-DEFERRAL / FAIL)
    - working notes from Tasks 1-2 (SHA hashes, run timestamps, PARITY GATE outputs, regen pool delta)
    - .planning/phases/75-question-rendering-specs/75-02a-SUMMARY.md (Plan 02a Task 0 pre-flight gate outcome — referenced in §"Cross-Plan Seed State Verification")
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (read line 113 — the `error.unsupportedQuestion` fallthrough that makes multi-choice render impossible at HEAD; cite this in the deferred-todo)
    - packages/dev-seed/src/emitters/answers.ts (read lines 110-130 — `pickMultipleChoiceIds` emitter scope; cite this in the deferred-todo for the dev-seed-side multi-choice answer support)
  </read_first>
  <action>
    Author the Phase 75 verification record + the deferred-todo for multi-choice.

    **PART A — `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md`** (per PATTERNS §"75-VERIFICATION.md" shape; mirror Phase 74 `74-VERIFICATION.md` structure):

    Required sections in order:

    1. **YAML frontmatter** (mirror Phase 74 lines 1-46 verbatim, substitute Phase 75 specifics):
       - `phase: 75-question-rendering-specs`
       - `verified: <ISO timestamp>`
       - `status: passed-with-deferral` (because QSPEC-02 multi-choice is deferred per D-03; 1 of 4 ROADMAP SCs lands PASS-WITH-DEFERRAL)
       - `score: 4/4 success criteria addressed (1 PASS-WITH-DEFERRAL on SC #2 multi-choice, 3 PASS; 0 FAIL)`
       - `verifier: gsd-executor (self-authored per Plan 02b Task 3)`
       - `overrides_applied: 0`
       - `follow_ups: [ ... QSPEC-02 multi-choice deferral entry citing the new todo at .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md + QSPEC-01 W-03 i18n hardening todo at .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md ... ]`
       - `re_verification` block left as placeholder for independent gsd-verifier confirmation (mirror Phase 74)

    2. **H1 + status paragraph** — 4 ROADMAP SCs addressed; 1 PASS-WITH-DEFERRAL; Phase 73 + Phase 74 baselines preserved; 2 follow-up todos filed.

    3. **`## Requirements Coverage (QSPEC-01, QSPEC-02)`** — table per PATTERNS:
       | Requirement | Source Plan(s) | Status | Evidence |
       | QSPEC-01 — Boolean opinion question | 75-01 | ✓ VERIFIED | voter-question-rendering-boolean.spec.ts (4-step contract w/ B-02 browser-back); e2e template +1 question +1 category +1 Alpha answer; 3-run per-plan smoke PASS × 3 |
       | QSPEC-02 — Single-choice categorical opinion question | 75-02a | ✓ VERIFIED (PASS-WITH-DEFERRAL on multi-choice per D-03) | voter-question-rendering-categorical.spec.ts (4-step contract w/ B-02 browser-back) against existing test-question-directional-1; 3-run per-plan smoke PASS × 3. Follow-up todo: 2026-05-12-qspec-02-multi-choice-categorical-variant.md |

    4. **`## Success Criteria Verification (ROADMAP §"Phase 75", 4 SCs)`** — table per PATTERNS:
       | SC | Description | Status | Evidence |
       | #1 | Boolean question end-to-end (QSPEC-01) | PASS | Plan 01 spec + dev-seed extension; cite spec path + 3-run outcome |
       | #2 | Categorical question end-to-end (QSPEC-02) — single-choice + multi-choice | PASS-WITH-DEFERRAL | Single-choice covered by Plan 02a spec; multi-choice deferred per CONTEXT D-03 (OpinionQuestionInput.svelte:113 renders error.unsupportedQuestion). Follow-up todo filed. |
       | #3 | Deduplicated against existing matching tests | PASS | Unified dedup audit at `75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 — per B-03 Nyquist-compliant persistent artifact); AUDIT COMPLETE trailer verified; no assertion duplicates |
       | #4 | Determinism preserved (3-run identical) | PASS | 3-run SHA identity below + 3 PARITY GATE PASS pair comparisons |

    5. **`## Cross-Plan Seed State Verification (B-04 pre-flight gate)`** — single paragraph + table:
       - Reference Plan 02a Task 0 pre-flight gate outcome (3 psql probe results): boolean (Plan 01) + directional (Phase 74 P05) + Alpha answer cells.
       - Verdict: PRE-FLIGHT GATE: PASS (or FAIL with rollback documentation).

    6. **`## 3-Run Determinism Record (SC #4)`** — 3-row table with run number / timestamp / SHA-256 hash / runtime; identity verdict line. Hashes from Task 1.

    7. **`## Parity Gate Output`** — 3-pair table (1v2, 2v3, 1v3) with PARITY GATE: PASS verdict per pair. Full stdout captured from Task 2.

    8. **`## Constants Regen (CONTEXT D-08)`** — pool delta table:
       - PASS_LOCKED count: <old> → <new> (+2 new Phase 75 specs)
       - DATA_RACE count: 15 → 15 (Phase-73-locked unchanged)
       - CASCADE count: 65 → 65 (Phase 74 close unchanged)
       IMGPROXY_TIED_TITLES audit: both new Phase 75 test titles verified NOT to end with any of the 14 bound patterns. No collisions.

    9. **`## DATA_RACE Pool Rationale`** — empty table OR per-entry rationale if any new spec landed in DATA_RACE.

    10. **`## Dedup Audit (REFERENCES `75-02-DEDUP-AUDIT.md` per B-03)`** — single paragraph + reference:
       - "Unified Phase 75 dedup audit lives at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 per B-03 Nyquist-compliant persistent artifact). The artifact consolidates Plan 01 boolean findings + Plan 02a categorical findings + carries the literal `AUDIT COMPLETE` trailer. Contract split statement transcribed below:"
       - Transcribe the Contract Split Statement paragraph from `75-02-DEDUP-AUDIT.md`.
       - Verdict: AUDIT COMPLETE (per grep gate `grep -q "AUDIT COMPLETE" 75-02-DEDUP-AUDIT.md` passed).

    11. **`## Plan Closures`**:
       | Plan | New files | New tests | 3-run per-plan smoke |
       | 75-01 (QSPEC-01) | 1 spec + 1 e2e template extension + 1 helper extension + W-03 i18n todo | 1 test | PASS × 3 |
       | 75-02a (QSPEC-02 spec + dedup audit) | 1 spec + 1 unified dedup audit artifact | 1 test | PASS × 3 |
       | 75-02b (verification gate + multi-choice deferred-todo) | 1 VERIFICATION.md + 1 multi-choice deferred-todo + parity-script regen | N/A (verification only) | N/A |

    12. **`## Regression Gates`** — 4-row table (mirror Phase 74): yarn build, yarn test:unit, yarn lint:check, Phase 73 determinism baseline. All GREEN at HEAD post-phase.

    13. **`## Cross-Links`** — anchors to ROADMAP §"Phase 75", CONTEXT D-01..D-10, RESEARCH §1-10 + Pitfalls, PATTERNS file-by-file analogs, VALIDATION map, Phase 73 + Phase 74 verification records, `75-02-DEDUP-AUDIT.md`.

    14. **`## Operator Sign-Off`** — section reserved for Task 4 checkpoint outcome.

    15. **`## VERIFICATION COMPLETE`** trailer (mirror Phase 74) — verdict line + independent re-verification placeholder + trailing metadata.

    Length: 200-330 lines (mirror Phase 74 `74-VERIFICATION.md` which is 325 lines per PATTERNS metadata).

    **PART B — `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`** (the deferred-todo):

    Required sections:

    1. **Header** — date 2026-05-12, scope "QSPEC-02 multi-choice categorical opinion-question rendering", source phase 75.

    2. **Why deferred** — `OpinionQuestionInput.svelte:113` renders `error.unsupportedQuestion` for `MultipleChoiceCategoricalQuestion`. Adding the render branch is a NEW component capability + matching dispatch verification + dev-seed answers-emitter extension (`pickMultipleChoiceIds` in `packages/dev-seed/src/emitters/answers.ts:115` exists for the latent path; the e2e template would need a multi-choice variant or hand-authored multi-choice answer cells); exceeds Phase 75 (coverage phase) scope.

    3. **Scope when picked up** (5-7 bullets):
       - Add `MultipleChoiceCategoricalQuestion` branch to `OpinionQuestionInput.svelte:88-114` (`{:else if isMultipleChoiceQuestion(question)}` branch using `QuestionChoices` with checkbox-style multi-select OR a new component).
       - Verify matching algorithm dispatch in `packages/matching/src/algorithms/matchingAlgorithm.ts` handles `MultipleChoiceCategoricalQuestion` correctly (existing code path may or may not need extension; `packages/data/src/utils/typeGuards.ts:53-55` `isMultipleChoiceQuestion` exists).
       - Extend `packages/dev-seed/src/templates/e2e.ts` with a new `test-question-multichoice-1` (type `multipleChoiceCategorical`) + new category + Alpha multi-choice answer cell.
       - Verify `packages/dev-seed/src/emitters/answers.ts:115 pickMultipleChoiceIds` correctly emits multi-choice answers for the latent / synthetic path.
       - Author `tests/tests/specs/voter/voter-question-rendering-multichoice.spec.ts` per the same 4-step contract (input renders / voter checks N choices / browser-back persistence per B-02 step 3 / entity-detail mirror).
       - Dedup audit step.
       - Verification: full 3-run smoke + parity-script regen if new tests land in PASS_LOCKED.

    4. **Effort sizing** — ~3-5 plans (component branch / dev-seed extension / spec authoring / verification gate); resembles Phase 74 P05 + Phase 75 in shape but smaller (single feature).

    5. **Why now** — preserves the higher-risk single-choice categorical render path (covered by Phase 75); the lower-risk multi-choice absence is a known component limitation today (no production user can hit it because no MultipleChoiceCategoricalQuestion exists in production seeds).

    6. **Dependencies** — none beyond `@openvaa/data` `MultipleChoiceCategoricalQuestion` type definition (already exists per `packages/data/src/utils/typeGuards.ts:53-55`).

    7. **Source references** — cite Phase 75 CONTEXT D-03, RESEARCH §"Deferred Ideas", VERIFICATION.md SC #2 PASS-WITH-DEFERRAL.

    Length: 15-40 lines.
  </action>
  <verify>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md && echo EXISTS</automated>
    <automated>wc -l /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>grep -c "PARITY GATE: PASS" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>grep -c "PASS-WITH-DEFERRAL\\|passed-with-deferral" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>grep -c "75-02-DEDUP-AUDIT" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md && echo EXISTS</automated>
    <automated>wc -l /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md</automated>
    <automated>grep -c "MultipleChoiceCategoricalQuestion\\|OpinionQuestionInput.svelte" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` exists; >= 80 lines; contains YAML frontmatter + 15 H1/H2 sections per PATTERNS shape (revised from 14 due to new §"Cross-Plan Seed State Verification" per B-04).
    - VERIFICATION.md contains 3 occurrences of `PARITY GATE: PASS` (one per pair comparison output from Task 2).
    - VERIFICATION.md contains the verdict line `passed-with-deferral` (or `PASS-WITH-DEFERRAL`) referenced in both frontmatter `status` field AND SC table SC #2 row.
    - VERIFICATION.md SC table addresses all 4 ROADMAP SCs (#1 PASS / #2 PASS-WITH-DEFERRAL / #3 PASS / #4 PASS) with evidence cites for each.
    - VERIFICATION.md 3-Run record contains 3 SHA-256 hashes from Task 1; identity verdict captured.
    - VERIFICATION.md Constants Regen section records the pool delta (PASS_LOCKED +2 / DATA_RACE 15→15 / CASCADE 65→65) per Task 2 outcome.
    - VERIFICATION.md §"Dedup Audit" REFERENCES the unified artifact at `75-02-DEDUP-AUDIT.md` (Plan 02a Task 2) per B-03 cross-plan flow; `grep -c "75-02-DEDUP-AUDIT"` returns >= 1.
    - VERIFICATION.md §"Cross-Plan Seed State Verification" records the Plan 02a Task 0 pre-flight gate outcome (B-04).
    - `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` exists; 15-40 lines.
    - Deferred-todo cites `MultipleChoiceCategoricalQuestion` + `OpinionQuestionInput.svelte` (line 113 fallthrough) + scope when picked up + dependencies + effort sizing.
    - VERIFICATION.md follow_ups frontmatter entry references BOTH the new multi-choice todo path AND the W-03 i18n-hardening todo path (filed by Plan 01 Task 5).
  </acceptance_criteria>
  <done>
    75-VERIFICATION.md authored with full evidence; QSPEC-02 multi-choice deferred-todo filed; Phase 75 verification record complete pending operator sign-off (Task 4).
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4 (CHECKPOINT): Operator review — Phase 75 verification record + dedup audit + multi-choice deferral</name>
  <files>
    .planning/phases/75-question-rendering-specs/75-VERIFICATION.md
    .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md
    .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md
    .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md
    tests/scripts/diff-playwright-reports.ts
    tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts
    tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts
  </files>
  <action>
    BLOCKING HUMAN-VERIFY CHECKPOINT. Operator reviews the Phase 75 verification record, the unified dedup audit artifact, and both deferred-todos before phase close. The detailed review instructions live in `<what-built>` + `<how-to-verify>` below. The operator runs the spot-checks listed in `<how-to-verify>` and types "approved" (per `<resume-signal>`) to proceed to phase close; OR types a description of issues to send the executor back to the relevant prior task (1-3) for fixes.

    No automated action is performed by the executor in this task — the gate IS the operator review. The `<verify>` block below records the automated grep gates the operator may run to spot-check the artifacts BEFORE typing "approved".
  </action>
  <verify>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md && echo VERIFICATION_PRESENT</automated>
    <automated>grep -c "PARITY GATE: PASS" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>grep -c "75-02-DEDUP-AUDIT" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-VERIFICATION.md</automated>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md && grep -q "AUDIT COMPLETE" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md && echo AUDIT_TRAILER_OK</automated>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md && echo MULTICHOICE_TODO_PRESENT</automated>
    <automated>test -f /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md && echo I18N_TODO_PRESENT</automated>
    <automated>grep -c "page.goBack" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts</automated>
    <automated>grep -c "page.goBack" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts</automated>
    <automated>grep -E "getByTestId\('opinion-question-input'\)\.last\(\)" /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts && echo "W04_FAIL" && exit 1 || echo "W04_PASS"</automated>
  </verify>
  <done>
    Operator typed "approved"; phase 75 cleared for close. Or operator identified issues and the executor returned to the relevant task (1-3). Phase ships GREEN-WITH-DEFERRAL per the Phase 74 precedent shape.
  </done>
  <what-built>
    Plan 02b has:
    1. Wiped vite-cache + .svelte-kit + re-provisioned Supabase + run 3× cold-start `--workers=1` full-suite + SHA-256 byte-identity check (Task 1).
    2. Regenerated parity-script constants for the +2 new PASS_LOCKED entries + 3 PARITY GATE PASS pair comparisons (Task 2).
    3. Authored `75-VERIFICATION.md` (4/4 SCs addressed; 1 PASS-WITH-DEFERRAL on QSPEC-02 multi-choice per CONTEXT D-03) + filed the QSPEC-02 multi-choice deferred-todo (Task 3). VERIFICATION.md references the Plan 02a unified dedup audit artifact at `75-02-DEDUP-AUDIT.md` per B-03 cross-plan flow.
  </what-built>
  <how-to-verify>
    1. Open `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` and confirm:
       - All 4 ROADMAP SCs have a status assigned (1 PASS-WITH-DEFERRAL on SC #2; 3 PASS).
       - 3 SHA-256 hashes are recorded; they are byte-identical (or every divergence has explicit per-test rationale).
       - 3 `PARITY GATE: PASS` outputs are captured (one per pair: 1v2, 2v3, 1v3).
       - DATA_RACE pool count is 15 (Phase 73 baseline preserved) OR each new entry has documented rationale.
       - Constants regen pool delta: PASS_LOCKED +2 (boolean + categorical specs); DATA_RACE unchanged; CASCADE unchanged.
       - §"Cross-Plan Seed State Verification" records the Plan 02a Task 0 pre-flight gate outcome (3 psql probes PASS per B-04).
       - §"Dedup Audit" references `75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 unified artifact per B-03); AUDIT COMPLETE trailer in the referenced file verified.

    2. Open `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` directly and confirm:
       - File exists; contains the audit table with ≥ 6 classified rows (DELEGATED / NEW / FALSE-POSITIVE).
       - Carries the literal `AUDIT COMPLETE` trailer.
       - Contract Split Statement paragraph is honest.

    3. Confirm `tests/scripts/diff-playwright-reports.ts` constants arrays were regenerated:
       - `git diff tests/scripts/diff-playwright-reports.ts` shows PASS_LOCKED_TESTS grew by 2 entries (the QSPEC-01 + QSPEC-02 test titles).
       - DATA_RACE_TESTS array unchanged at 15 entries.

    4. Confirm both new spec files exist:
       - `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (Plan 01) — includes B-02 step 3 `page.goBack()` browser-back persistence assertion.
       - `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (Plan 02a) — includes B-02 step 3 `page.goBack()` browser-back persistence assertion AND filter-by-text locator (NOT `.last()` per W-04).
       Both pass under `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "QSPEC-0"` (or equivalent grep).

    5. Confirm the multi-choice deferred-todo exists at `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`:
       - Scope clearly cites `OpinionQuestionInput.svelte:113` + `MultipleChoiceCategoricalQuestion` + `pickMultipleChoiceIds`.
       - Effort sizing (~3-5 plans) recorded.
       - Cross-link back to Phase 75 VERIFICATION.md SC #2 PASS-WITH-DEFERRAL.

    6. Confirm the W-03 i18n-hardening deferred-todo exists at `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (filed by Plan 01 Task 5):
       - Scope cites Phase 78 CLEAN-04 + the literal-English-string convention used in QSPEC-01 + QSPEC-02 specs.

    7. If anything is missing or wrong:
       - Return to the relevant task (1-3) for fixes.
       - The 3-run protocol must run again from a clean vite-cache state if hashes are not identical.

    8. **Operator additional spot-checks (recommended, not blocking):**
       - Open the new boolean spec and read the dedup-audit comment block + the entity-detail mirror's inline `// reason:` justification — confirm the contract-split rationale is clear; confirm the `page.goBack()` step 3 assertion is present.
       - Open the new categorical spec and confirm the `.filter({ has: page.getByText(/Directional/) })` locator is used (NOT `.last()` per W-04 NEGATIVE CHECK); confirm the inline `// reason:` block explains why; confirm the `page.goBack()` step 3 assertion is present.
       - Open `75-VERIFICATION.md` and read the Plan Closures table — confirm all three plans (75-01 / 75-02a / 75-02b) show their expected outcomes.
       - Consider whether the optional `58-E2E-AUDIT.md` addendum for the new boolean question + new category should be authored (per CONTEXT Claude's Discretion paragraph 5; recommended-but-not-blocking) — if yes, file as a separate follow-up todo at phase close OR add an inline note to `75-VERIFICATION.md` deferring this.

    If everything is correct:
    - Type `approved` to close Phase 75.
  </how-to-verify>
  <resume-signal>
    Type "approved" to close Phase 75, or describe issues to address.
  </resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Parity-script regen → diff-playwright-reports.ts constants | Regen writes regenerated arrays into the source-controlled diff-script. Trust model: same as Phase 73/74 — regen output is paste-ready and reviewed at the operator checkpoint (Task 4) before commit. |
| 3-run smoke → Playwright suite | Read-only test execution against the running frontend; no privileged writes. |
| Deferred-todo file → .planning/todos/pending/ | New planning-tier document; same trust model as existing pending-todo workflow. No production impact. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-75-02b-01 | N/A | Plan 02b — verification gate authoring + parity-tooling invocation + deferred-todo filing | accept | No new attack surface. (a) Verification gate (vite-cache wipe + 3-run smoke + parity-gate) is test-infrastructure invocation with no production code change. (b) Deferred-todo + VERIFICATION.md are planning-tier documents; no operational impact. (c) No changes to `apps/frontend/`, `apps/supabase/migrations/`, or `apps/supabase/functions/`. Threat ref: N/A. |
| T-75-02b-02 | T (Tampering) | constants regen pasted into tests/scripts/diff-playwright-reports.ts | mitigate | Operator review checkpoint (Task 4) verifies the regenerated constants match the cold-start outcome before commit. IMGPROXY_TIED_TITLES bound list audited as part of Task 2 acceptance criteria; CONTEXT D-08 IMGPROXY safety check confirmed (text-only choice buttons; no image paths). |
</threat_model>

<verification>
- Task 1 vite-cache wipe + 3-run smoke: pre-run dirs absent; 3 JSON reports captured; SHA-256 byte-identity verified or every divergence classified; both new test titles confirmed PASS in run-3.
- Task 2 parity-script regen: regen exited 0; PASS_LOCKED grew by +2; DATA_RACE stays at 15; CASCADE stays at 65; 3 PARITY GATE PASS outputs captured; lint clean.
- Task 3 VERIFICATION.md + deferred-todo: VERIFICATION.md authored with all sections + frontmatter; deferred-todo filed at `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`; 4/4 SCs addressed (1 PASS-WITH-DEFERRAL); §"Cross-Plan Seed State Verification" + §"Dedup Audit" references present.
- Task 4 operator checkpoint: blocking checkpoint; operator confirms record + dedup audit + deferral path before phase close.
- 3-run determinism contract (CONTEXT D-07) preserved; Phase-73-locked DATA_RACE pool at 15; Phase 74 CASCADE pool at 65.
- IMGPROXY_TIED_TITLES safety: both new test titles verified NOT to suffix any of the 14 bound patterns.
</verification>

<success_criteria>
- ROADMAP SC #1 (Boolean spec) verified PASS via Plan 01 + 3-run smoke evidence in `75-VERIFICATION.md`.
- ROADMAP SC #2 (Categorical spec — single-choice + multi-choice) verified PASS-WITH-DEFERRAL: single-choice landed via Plan 02a; multi-choice deferred per CONTEXT D-03 with explicit follow-up todo.
- ROADMAP SC #3 (Dedup against existing matching tests) verified PASS via the unified dedup audit artifact at `75-02-DEDUP-AUDIT.md` (referenced in VERIFICATION.md per B-03 cross-plan flow).
- ROADMAP SC #4 (Determinism preserved) verified PASS via 3-run SHA identity + 3 PARITY GATE PASS + DATA_RACE pool preserved at 15.
- Phase 73 + Phase 74 baselines preserved (no regression to either).
- Phase 75 ships GREEN-WITH-DEFERRAL per the Phase 74 precedent shape.
- All deferred work is captured in `.planning/todos/pending/` with explicit scope + effort sizing.
- Operator review checkpoint (Task 4) passed.
- Phase 75 ready for `/gsd close-phase` invocation.
</success_criteria>

<output>
After completion, create `.planning/phases/75-question-rendering-specs/75-02b-SUMMARY.md` documenting:
- final HEAD SHA at phase close
- 3-run SHA hashes + identity verdict
- 3 PARITY GATE outputs
- updated PASS_LOCKED/DATA_RACE/CASCADE counts (PASS_LOCKED +2; DATA_RACE preserved at 15; CASCADE preserved at 65)
- list of follow-up todos filed (the QSPEC-02 multi-choice deferral todo path + the W-03 i18n-hardening todo path filed by Plan 01)
- reference to the unified dedup audit artifact at `75-02-DEDUP-AUDIT.md` (Plan 02a Task 2)
- optional `58-E2E-AUDIT.md` addendum decision (recommended-but-not-blocking)
- operator checkpoint outcome
- 4/4 SC classification (1 PASS-WITH-DEFERRAL + 3 PASS)
- recommendation for the next phase (Phase 76 / 77 — both can proceed in parallel)
</output>

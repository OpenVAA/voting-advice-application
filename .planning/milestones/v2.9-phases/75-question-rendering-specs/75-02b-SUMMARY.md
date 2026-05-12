---
phase: 75-question-rendering-specs
plan: 02b
subsystem: e2e-coverage / verification-gate / parity-regen
tags: [playwright, e2e, voter, qspec, verification-gate, parity-gate, 3-run, regen-constants, checkpoint]
completed: 2026-05-11
head_sha_at_close: e19bbbe6d
requirements: [QSPEC-01, QSPEC-02]
dependency_graph:
  requires:
    - phase 73 (determinism baseline, closed 2026-05-11)
    - phase 74 (high-leverage-e2e-coverage, closed 2026-05-11 GREEN-WITH-DEFERRAL)
    - phase 75 plan 01 (QSPEC-01 boolean spec)
    - phase 75 plan 02a (QSPEC-02 categorical spec + unified dedup audit)
  provides:
    - Phase 75 verification record (75-VERIFICATION.md)
    - Parity-script constants regen (Phase 75 baseline: 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE)
    - QSPEC-02 multi-choice deferred-todo (PASS-WITH-DEFERRAL anchor)
    - 3-run cold-start anchor captures (post-fix/run-{1,2,3}.json + sorted-status.txt + parity-gate-output.txt)
  affects:
    - tests/scripts/diff-playwright-reports.ts (regen — net-positive deltas vs Phase 74 baseline)
tech_stack:
  added: []
  patterns:
    - "3-run cold-start --workers=1 SHA-256 identity (Phase 73 SC #4 + Phase 74 D-09 inheritance)"
    - "Conditional constants regen (CONTEXT D-08) — REQUIRED when new specs land in baseline"
    - "IMGPROXY_TIED_TITLES safety check at regen-constants.mjs:80-87 (exit 1 if any bound title has zero matches)"
    - "Failure-class classification (NOT pooled by regen) — distinct from DATA_RACE (IMGPROXY-bound only) per D-09"
    - "Vite-cache + .svelte-kit wipe BEFORE Run 1 (CONTEXT D-09 + v2.8-close gotcha)"
    - "e2e template explicit seeding via yarn supabase:reset && yarn dev:seed --template e2e (Plan 02a auto-fix carry-forward)"
key_files:
  created:
    - .planning/phases/75-question-rendering-specs/75-VERIFICATION.md
    - .planning/phases/75-question-rendering-specs/75-02b-SUMMARY.md
    - .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md
    - .planning/phases/75-question-rendering-specs/post-fix/run-1.json
    - .planning/phases/75-question-rendering-specs/post-fix/run-2.json
    - .planning/phases/75-question-rendering-specs/post-fix/run-3.json
    - .planning/phases/75-question-rendering-specs/post-fix/run-1-sorted-status.txt
    - .planning/phases/75-question-rendering-specs/post-fix/run-2-sorted-status.txt
    - .planning/phases/75-question-rendering-specs/post-fix/run-3-sorted-status.txt
    - .planning/phases/75-question-rendering-specs/post-fix/parity-gate-output.txt
  modified:
    - tests/scripts/diff-playwright-reports.ts (constants regen — PASS_LOCKED +43, DATA_RACE 0, CASCADE -32)
    - .planning/phases/73-determinism-baseline/post-fix/run-3-report.json (regen input staging — overwritten with Phase 75 run-3)
    - .planning/phases/73-determinism-baseline/post-fix/regen-output.txt (regen output capture)
decisions:
  - "Auto-fix Rule 3 (Blocking): dev server not auto-launched by Playwright — frontend Vite server requires manual `yarn _dev:concurrent` before test:e2e. Launched in background; verified via curl probe to localhost:5173 before Run 1."
  - "Auto-fix Rule 1 (Bug recurrence): yarn supabase:reset returned 502 imgproxy mid-flight (the known infrastructure flake). Recycled supabase:stop + supabase:start per project memory + STATE.md, then re-ran supabase:reset successfully. Documented as imgproxy infrastructure carry-forward."
  - "Honest QSPEC classification: full-suite cold-start FAIL × 3 (deterministic) is failure-class, NOT DATA_RACE growth (D-09 binding is IMGPROXY-only). Per-plan smokes PASS × 3 each in Plans 01 + 02a verify spec correctness in isolation. SAME classification as Phase 74 Plan 03 voter-feedback/voter-navigation specs."
  - "PASS_LOCKED grew +43 vs Phase 74 baseline (4 → 47). NET-POSITIVE delta — Phase 75's healthier cold-start ran the auth-setup + candidate-app + voter-app/voter-matching/voter-journey/voter-static-pages/voter-questions/voter-app-settings full slices that were cascade-skipped at Phase 74 close."
  - "regen-constants.mjs uses a FIXED-PATH input at __dirname/run-3-report.json (no CLI arg). Plan 02b Task 2 staged Phase 75's run-3.json there before invocation. Plan 02b Task 1 separately persisted the run JSON to .planning/phases/75-question-rendering-specs/post-fix/ for phase-local provenance."
  - "Parity-script invocation: from tests workspace via `yarn tsx scripts/diff-playwright-reports.ts <run-A>.json <run-B>.json` (NOT yarn workspace exec which fails workspace-name resolution from repo root)."
metrics:
  duration_minutes: 90
  tasks_completed: 3
  files_changed: 11
  commits: 3
---

# Phase 75 Plan 02b: Verification Gate + Multi-Choice Deferred-Todo Summary

Plan 02b ran the Phase 75 end-of-phase verification gate: pre-run vite-cache wipe + DB reset (e2e template) + 3-run cold-start `--workers=1` full Playwright smoke + SHA-256 identity check (Task 1); parity-script constants regen + 3 PARITY GATE PASS pair comparisons (Task 2); authored `75-VERIFICATION.md` + the QSPEC-02 multi-choice deferred-todo (Task 3). Operator checkpoint Task 4 awaits review.

## Tasks Closed (3 of 4 — Task 4 is an operator-blocking checkpoint, reached this commit)

| Task | Outcome | Files | Commit |
|------|---------|-------|--------|
| 1 — Vite-cache wipe + DB reset + 3-run cold-start smoke | Both cache dirs wiped; e2e template provisioned (18 candidates / 19 questions / 22 nominations); 3 cold-start runs at 48p / 30f / 47s ≡ identical × 3; SHA-256 identity: `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` × 3 → PASS. QSPEC-01 + QSPEC-02 deterministically FAIL × 3 under full-suite cold-start (inherits upstream voter-fixture race; per-plan smokes PASS × 3 in isolation per Plans 01 + 02a) → classified as failure-class per CONTEXT D-07. | post-fix/run-{1,2,3}.json + sorted-status.txt | 10279a2bf |
| 2 — Parity-script constants regen + 3 PARITY GATE PASS | regen-constants.mjs exit 0 (IMGPROXY_TIED_TITLES match-count assertion PASS: 14 titles, 15 matches). Pool deltas vs Phase 74 baseline: PASS_LOCKED 4 → 47 (+43 net-positive); DATA_RACE 15 → 15 (D-09 preserved); CASCADE 65 → 33 (−32 net-positive). 3 pair comparisons (1v2, 2v3, 1v3) all output `PARITY GATE: PASS — no regressions detected per D-59-04.` Lint check green. | tests/scripts/diff-playwright-reports.ts + post-fix/parity-gate-output.txt + regen-output.txt | 3d7e08965 |
| 3 — 75-VERIFICATION.md + QSPEC-02 multi-choice deferred-todo | VERIFICATION.md (317 LOC) authored mirroring Phase 74 shape; 4/4 ROADMAP SCs assessed (3 PASS + 1 PASS-WITH-DEFERRAL on SC #2 multi-choice per CONTEXT D-03; 0 FAIL); all 7 regression gates GREEN; 3 follow-up todos cross-referenced. Multi-choice deferred-todo (70 LOC) captures scope (~3-5 plans) + dependencies + cross-links. | .planning/phases/75-question-rendering-specs/75-VERIFICATION.md + .planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md | e19bbbe6d |
| 4 — Operator checkpoint (BLOCKING) | **APPROVED 2026-05-12.** Operator selected "Approved + file 58-E2E-AUDIT addendum todo" from the 3 options presented at the checkpoint. 4th follow-up todo filed at `.planning/todos/pending/2026-05-12-58-e2e-audit-addendum-qspec.md` (committed `3d05c5c6d`). Phase 75 closes GREEN-WITH-DEFERRAL. | `.planning/todos/pending/2026-05-12-58-e2e-audit-addendum-qspec.md` + close-out edits to VERIFICATION.md + SUMMARY.md + STATE.md + ROADMAP.md | 3d05c5c6d (addendum todo) + [close-out commit, this entry] |

## 3-Run SHA Hashes + Identity Verdict

| Run | Started (UTC) | Finished (UTC) | Duration | Counts (p/f/skipped) | Total | SHA-256 |
|-----|---------------|----------------|----------|-----------------------|-------|---------|
| 1 | 2026-05-11T17:42:39Z | 2026-05-11T18:08:35Z | ~25.7 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |
| 2 | 2026-05-11T18:09:11Z | 2026-05-11T18:35:08Z | ~25.6 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |
| 3 | 2026-05-11T18:35:47Z | 2026-05-11T19:01:31Z | ~25.7 min | 48 / 30 / 47 | 125 | `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc` |

**Verdict: 3-run SHA-256 identity = PASS (byte-identical × 3).**

## 3 PARITY GATE Outputs

| Pair | Baseline | Post | Verdict |
|------|----------|------|---------|
| run-1 vs run-2 | 48p / 30f / 47c | 48p / 30f / 47c | `PARITY GATE: PASS — no regressions detected per D-59-04.` |
| run-2 vs run-3 | 48p / 30f / 47c | 48p / 30f / 47c | `PARITY GATE: PASS — no regressions detected per D-59-04.` |
| run-1 vs run-3 | 48p / 30f / 47c | 48p / 30f / 47c | `PARITY GATE: PASS — no regressions detected per D-59-04.` |

**Contract:** 47 pass-locked, 15 data-race pool, 33 cascade-baseline. **3 × PARITY GATE: PASS.**

## Updated Pool Counts (CONTEXT D-08 conditional regen)

| Pool | Phase 74 baseline | Phase 75 baseline | Delta |
|------|-------------------|-------------------|-------|
| PASS_LOCKED_TESTS | 4 | 47 | **+43** (net-positive; Phase-74-cascade entries promoted) |
| DATA_RACE_TESTS | 15 | 15 | **0** (D-09 binding preserved — IMGPROXY structural) |
| CASCADE_TESTS | 65 | 33 | **−32** (net-positive; many Phase-74-cascade entries now pass) |
| Failure-class (NOT pooled) | 9-31 (Phase 74 variable) | 30 deterministic × 3 | — |

**IMGPROXY_TIED_TITLES audit:** clean. 2 new Phase 75 test titles verified to NOT suffix any of the 14 bound patterns. No collisions.

## Follow-Up Todos Filed

1. **QSPEC-02 multi-choice categorical variant** — `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` (70 LOC) — D-03 PASS-WITH-DEFERRAL anchor. Effort: ~3-5 plans. Scope: OpinionQuestionInput.svelte branch + matching dispatch + dev-seed extension + spec + dedup + verification.
2. **W-03 i18n-hardening** — `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (filed by Plan 01 Task 5) — Order B anchor for Phase 78 CLEAN-04 (i18n wrapper tightening retroactively validates QSPEC literal English strings).
3. **Voter-fixture heterogeneous-question-types race** — `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (Phase 73 carry-forward) — Phase 78 CLEAN-05 (Path B `--likert-only` seed modifier). Resolution lifts QSPEC-01 + QSPEC-02 + voter-detail + voter-results + voter-feedback + voter-navigation from failure-class to PASS_LOCKED.
4. **58-E2E-AUDIT.md addendum (QSPEC external_id/display-text contracts)** — `.planning/todos/pending/2026-05-12-58-e2e-audit-addendum-qspec.md` (filed at operator checkpoint approval 2026-05-12, committed `3d05c5c6d`) — Claude's Discretion §5 recommended-but-not-blocking. Adds boolean question + category external_id + display-text rows + cross-references existing `test-question-directional-1` to QSPEC-02. ~10-15 LOC.

## Reference to Unified Dedup Audit Artifact

`75-VERIFICATION.md §"Dedup Audit"` references `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (Plan 02a Task 2 — Nyquist-compliant persistent artifact per B-03 cross-plan flow). 11 classified audit rows (DELEGATED ×9 + NEW ×1 + FALSE-POSITIVE ×2); `AUDIT COMPLETE` trailer verified via grep gate.

## Optional 58-E2E-AUDIT.md Addendum Decision

**OPERATOR ELECTED TO FILE** at Task 4 checkpoint (2026-05-12). Filed at `.planning/todos/pending/2026-05-12-58-e2e-audit-addendum-qspec.md` (committed `3d05c5c6d`). Scope: add `test-question-boolean-1` (sort 18, type boolean) + `test-category-boolean` (sort 6, opinion) external_id/display-text contracts to `.planning/milestones/v2.5-phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`; also spec-anchor existing `test-question-directional-1` to QSPEC-02. Disposition: recommended-but-not-blocking — no v2.9 deadline; address whenever convenient.

## Operator Checkpoint Outcome

**APPROVED 2026-05-12.** Operator approved GREEN-WITH-DEFERRAL close at Task 4 checkpoint. Selected from 3 options presented: chose "Approved + file 58-E2E-AUDIT addendum todo" (vs. plain approval or send-back). Phase 75 cleared for phase close — 4 follow-up todos filed in `.planning/todos/pending/`. ROADMAP.md + STATE.md updated to reflect Phase 75 = Complete with 3/3 plans.

## 4/4 SC Classification

| SC | Status | Evidence anchor |
|----|--------|-----------------|
| #1 — QSPEC-01 Boolean | **PASS** | Plan 01 spec + dev-seed extension; per-plan smoke PASS × 3 in 15.1s (full-suite cold-start failure inherits upstream race; not a regression) |
| #2 — QSPEC-02 Categorical (single-choice + multi-choice) | **PASS-WITH-DEFERRAL** | Single-choice covered by Plan 02a (per-plan smoke PASS × 3 in 19.3s); multi-choice deferred per D-03 with explicit follow-up todo |
| #3 — Deduplicated | **PASS** | 75-02-DEDUP-AUDIT.md (11 rows; AUDIT COMPLETE) |
| #4 — Determinism preserved | **PASS** | 3-run SHA-256 = `7084db87...` × 3; 3 PARITY GATE PASS pair comparisons; DATA_RACE pool unchanged at 15 |

**Phase 75 closes GREEN-WITH-DEFERRAL** (operator sign-off received 2026-05-12).

## Recommendation for the Next Phase

Per ROADMAP line 199 + STATE.md: **Phase 76 (Profile + A11y) AND Phase 77 (Settings Matrix + Question-Customization Gap-Fills) may proceed IN PARALLEL** — both share the Phase 73 determinism baseline prerequisite (preserved by Phase 75 close) and are independent of each other.

**Phase 78 (Cleanup Hygiene Phase)** is also independent and may run in parallel with 76 + 77; CLEAN-04 + CLEAN-05 will retroactively resolve:
- W-03 i18n-hardening todo (CLEAN-04 — switches QSPEC literal English to `t()` lookups)
- voter-fixture heterogeneous-question-types race (CLEAN-05 — Path B `--likert-only` seed modifier; lifts QSPEC + voter-detail + voter-results + voter-feedback + voter-navigation from failure-class to PASS_LOCKED in full-suite cold-start)

## Cross-Links

- **ROADMAP §"Phase 75"** — `.planning/ROADMAP.md:197-207` (4 ROADMAP SCs).
- **Phase 75 VERIFICATION** — `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` (this plan's primary deliverable).
- **Phase 74 VERIFICATION (precedent)** — `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md`.
- **CONTEXT D-01..D-10 + B-01..B-04 + W-01..W-06** — `.planning/phases/75-question-rendering-specs/75-CONTEXT.md`.
- **Parity tooling** — `tests/scripts/diff-playwright-reports.ts` (regen target) + `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (regenerator).
- **Plan 01 SUMMARY** — `.planning/phases/75-question-rendering-specs/75-01-SUMMARY.md`.
- **Plan 02a SUMMARY** — `.planning/phases/75-question-rendering-specs/75-02a-SUMMARY.md`.
- **Unified Dedup Audit (B-03)** — `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md`.
- **Phase 78 CLEAN-04 anchor (W-03 i18n)** — `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`.
- **Phase 78 CLEAN-05 anchor (voter-fixture race)** — `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`.
- **D-03 multi-choice deferred-todo** — `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`.

## Self-Check: PASSED

Verified at SUMMARY-write time:

- `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` (317 LOC, status passed-with-deferral, 5× PARITY GATE PASS occurrences, 10× 75-02-DEDUP-AUDIT references): FOUND
- `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` (70 LOC, cites OpinionQuestionInput.svelte:113 + MultipleChoiceCategoricalQuestion + pickMultipleChoiceIds): FOUND
- `.planning/phases/75-question-rendering-specs/post-fix/run-{1,2,3}.json` (cold-start anchors, SHA-identical at `7084db87...`): FOUND × 3
- `.planning/phases/75-question-rendering-specs/post-fix/run-{1,2,3}-sorted-status.txt` (110 lines each, sorted; SHA-identical): FOUND × 3
- `.planning/phases/75-question-rendering-specs/post-fix/parity-gate-output.txt` (3× PARITY GATE PASS): FOUND
- `tests/scripts/diff-playwright-reports.ts` (constants regen: 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE): FOUND
- Commit 10279a2bf (Task 1 — 3-run smoke): present in git log
- Commit 3d7e08965 (Task 2 — parity regen): present in git log
- Commit e19bbbe6d (Task 3 — VERIFICATION.md + multi-choice todo): present in git log

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Frontend dev server not auto-launched by Playwright**
- **Found during:** Task 1 initial Run 1 attempt
- **Issue:** Playwright config does not include a `webServer` directive; `yarn test:e2e` requires a separately-running frontend dev server at `localhost:5173`. Initial Run 1 produced all-skipped + 42 ERR_CONNECTION_REFUSED failures in ~55 seconds.
- **Fix:** Launched `yarn _dev:concurrent` in background; verified via `curl -sI http://localhost:5173` returning 200 OK before re-launching Run 1. The dev server warms `.vite` + `.svelte-kit` automatically — preserves CONTEXT D-09's intent (wipe BEFORE first warm).
- **Documented for future phases:** Phase 76 / 77 / 78 verification gates must explicitly launch the dev server before running Playwright (CLAUDE.md §"Running tests after changes" already documents this requirement).
- **Files modified:** none (dev-server lifecycle is orchestration, not source-file edit)
- **Commit:** Task 1 commit (10279a2bf) records the re-launched Run 1 outcome.

**2. [Rule 1 - Bug recurrence] yarn supabase:reset returned 502 imgproxy mid-flight**
- **Found during:** Task 1 initial DB reset (after vite-cache wipe)
- **Issue:** `Error status 502: An invalid response was received from the upstream server` from imgproxy container during DB reset. Documented at STATE.md §"Blockers/Concerns" as carry-forward infrastructure debt.
- **Fix:** Followed project memory recipe (`project_gsd_repo_hook_workaround.md` chain + STATE.md blockers): `yarn supabase:stop && yarn supabase:start && yarn supabase:reset` cleanly. Then `yarn dev:seed --template e2e` provisioned the e2e template successfully (18 candidates / 19 questions / 22 nominations).
- **Files modified:** none
- **Commit:** none (recovery is orchestration)

**3. [Plan 02a carry-forward] yarn dev:reset-with-data seeds wrong template — used yarn supabase:reset && yarn dev:seed --template e2e explicitly**
- **Found during:** Task 1 DB reset planning
- **Issue:** Plan 02a Task 0 documented (auto-fix #4) that `yarn dev:reset-with-data` runs `yarn supabase:reset && yarn dev:seed --template default` — provisions the `default` template (24 questions, 327 candidates), NOT the `e2e` template Playwright's `data-setup` project uses.
- **Fix:** Used `yarn supabase:reset && yarn dev:seed --template e2e` directly per Plan 02a's documented protocol. Verified post-seed via psql probe in Task 1 acceptance gates.
- **Documented at:** 75-VERIFICATION.md §"Cross-Plan Seed State Verification" carries this protocol forward to future phases (76 / 77 / 78 verification gates).
- **Files modified:** none
- **Commit:** none

**4. [Honest classification per CONTEXT D-07] QSPEC-01 + QSPEC-02 land in failure-class, NOT PASS_LOCKED (acceptance criterion #1 partial)**
- **Found during:** Task 1 + Task 2 (parity-script regen partition)
- **Issue:** Plan 02b's acceptance criterion #1 (Task 2): "PASS_LOCKED grew by +2 (boolean + categorical specs)". Phase 75 baseline: PASS_LOCKED grew +43 (not +2) because Phase 75's healthier cold-start ran a MUCH wider slice of the suite. But the +43 entries do NOT include QSPEC-01 + QSPEC-02 — both deterministically FAILED × 3 under full-suite cold-start at the upstream voter-fixture race (`voter-questions-start` 10s timeout inside `walkToQuestion(page, N)` helper).
- **Verdict:** Per CONTEXT D-07 + Phase 74 Plan 03 precedent: deterministic-fail-with-explicit-rationale → failure-class (NOT DATA_RACE growth, which is structurally bound to IMGPROXY only per D-09). Per-plan smokes PASS × 3 each in Plans 01 + 02a verify spec correctness in isolation. Will resolve at Phase 78 CLEAN-05 close.
- **Files modified:** Failure-class rationale documented in `75-VERIFICATION.md §"Failure-Class Pool Rationale (30 deterministic failures × 3)"` rows 16 + 17.
- **Commit:** Task 3 commit (e19bbbe6d).

**5. [Plan rephrasing] regen-constants.mjs uses fixed-path input, not CLI arg**
- **Found during:** Task 2 (regen invocation)
- **Issue:** Plan 02b prose specified `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs run-3.json` — implying CLI arg. The script actually reads from a HARDCODED path `__dirname/run-3-report.json` (lines 19-20).
- **Fix:** Staged `tests/run-3.json` to `.planning/phases/73-determinism-baseline/post-fix/run-3-report.json` (regen input target) + invoked `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (no arg). Identical outcome.
- **Documented for future phases:** Phase 76 / 77 / 78 verification gates must stage their run-3 output to this fixed path before regen invocation.
- **Files modified:** `.planning/phases/73-determinism-baseline/post-fix/run-3-report.json` overwritten with Phase 75's run-3. Commit captures the diff.
- **Commit:** Task 2 commit (3d7e08965).

**6. [Plan rephrasing] Parity-script invocation: `yarn workspace @openvaa/tests exec` failed**
- **Found during:** Task 2 (parity-script invocation)
- **Issue:** Plan 02b prose specified `yarn workspace @openvaa/tests exec -- yarn tsx ...` from repo root — failed with "workspace name resolution" error. The workspace is registered as `@openvaa/tests` but yarn-workspace dispatch had trouble.
- **Fix:** Used `cd tests && yarn tsx scripts/diff-playwright-reports.ts <run-A>.json <run-B>.json` directly from the tests workspace. Identical outcome.
- **Documented for future phases:** Phase 76 / 77 / 78 verification gates invoke parity-script from tests workspace, not via `yarn workspace exec`.
- **Files modified:** none
- **Commit:** none

No other deviations. All 6 above are documented + cross-referenced.

## Authentication Gates

None encountered. All operations are anonymous Playwright + admin-client psql probes against local Supabase.

## Known Stubs

None. No hardcoded empty values or placeholder text introduced. Constants regen produces paste-ready arrays from real Playwright JSON output; no mock data.

## Threat Flags

None. Plan 02b adds 1 NEW VERIFICATION.md (planning-tier document) + 1 NEW multi-choice deferred-todo + parity-script constants regen (reviewed at Task 4 checkpoint per CONTEXT threat_model T-75-02b-02 mitigation) + 8 NEW post-fix artifacts (run JSONs + sorted-status + parity-gate output — read-only test execution captures). No production code change; no new attack surface. Threat register T-75-02b-01..02 accepted at PLAN.md time, unchanged at close.

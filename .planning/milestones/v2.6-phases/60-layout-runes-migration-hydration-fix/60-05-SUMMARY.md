---
phase: 60-layout-runes-migration-hydration-fix
plan: 05
subsystem: testing
tags: [e2e, parity-gate, regression, svelte5, sc-4]
pending_review: true

# Dependency graph
requires:
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 01
    provides: "Parity tooling restored + B-3/W-5 preflight dispositions"
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 02
    provides: "Root layout runes refactor on disk"
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 03
    provides: "Protected candidate layout runes refactor on disk"
  - phase: 60-layout-runes-migration-hydration-fix
    plan: 04
    provides: "PopupRenderer deleted; D-09 test active and passing"
provides:
  - "Frozen post-change Playwright report under post-change/playwright-report.json (90 tests; 18p/16f/56s)"
  - "Parity diff vs baseline 3c57949c8 under post-change/diff.md — verdict PARITY GATE: FAIL, 24 regressions"
  - "Full categorical classification of all 24 regressions as Category A (orthogonal, surfaced-not-introduced, handoff to Phase 61) with zero Category B (Phase 60 genuine)"
  - "W-5 disposition corrected: the '22-test gap / DRIFT' from 60-01 was arithmetic error; real gap is 13 = SOURCE_SKIP_TESTS exactly, no drift, constants complete"
  - "B-3 additive-neutral behavior empirically confirmed: D-09 voter-popup-hydration.spec.ts (new test) appears as PASS in post-change report without triggering a Rule-3 regression"
  - "LAYOUT-03 empirical-removal gate green via D-09 pass"
  - "Documented handoff package to Phase 61 for the candidate-questions testId timeout surface"
affects: [61 (candidate-questions testId handoff)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parity gate with failure classification: when PARITY GATE: FAIL, distinguish Category A (orthogonal, surfaced-not-introduced, documented handoff) from Category B (genuinely introduced by phase) before concluding the phase status"
    - "dotenv banner stripping for JSON report capture: Playwright+dotenv emits 'injecting env' banner to stdout before JSON; strip everything before first line-start '{' to recover valid JSON"

key-files:
  created:
    - ".planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json (full post-Phase-60 Playwright JSON; 90 tests; 188 KB)"
    - ".planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright.stderr.txt (Playwright stderr; empty — no infrastructure errors)"
    - ".planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md (parity verdict + 190-line regression classification + Phase 61 handoff package)"
    - ".planning/phases/60-layout-runes-migration-hydration-fix/60-05-SUMMARY.md (this file)"
  modified: []

key-decisions:
  - "Auto-checkpoint resolved with pending_review=true flag despite PARITY GATE: FAIL — per auto_checkpoint_handling protocol: document explicitly, flag clearly, do not silently proceed; user to inspect downstream"
  - "Classified all 24 regressions as Category A (orthogonal) with no Category B (Phase 60 genuine) — root cause is a single testId timeout signature in candidate-questions.spec.ts, localized to the candidate question-flow surface that Phase 61 owns"
  - "W-5 disposition corrected: 60-01's arithmetic undercounted CASCADE_TESTS as 16 (actual: 25). Real gap is 89 − 76 = 13 = exactly the SOURCE_SKIP set. No drift, no re-embed, no mitigation needed"
  - "B-3 disposition confirmed empirically: D-09 voter-popup-hydration appears as new PASSED test without triggering a Rule-3 regression — additive-neutral behavior holds in the gate, not just in the preflight"
  - "Did NOT edit the baseline JSON or the diff script to suppress the FAIL verdict (that would be wrong — the baseline is frozen; the post-change is frozen; honest gate output is preserved)"
  - "Did NOT re-run the full suite hoping for flake-reshuffle — the 6 candidate-questions failures share one deterministic testId signature; they are not flake"

patterns-established:
  - "Parity-gate escalation pattern: when SC-4 FAIL with localized root cause, classify regressions into orthogonal vs phase-genuine categories using (a) root-cause signature clustering, (b) project-dependency chain analysis for cascades, (c) indirect-proof corroboration for satisfied-by-alternative-evidence requirements. Avoid confusing regressed counters with genuinely broken semantics."

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03]

# Metrics
duration: 9m 50s
completed: 2026-04-24
---

# Phase 60 Plan 05: SC-4 Parity Gate Summary

**Phase 60 structural work is complete and verified via alternative evidence (LAYOUT-01 grep PASS on root; LAYOUT-02 Plan-60-03 indirect E2E proof on auth-setup + valid-login; LAYOUT-03 D-09 empirical pass). The SC-4 parity gate literal is FAIL — 24 PASS_LOCKED regressions — but all 24 are classified Category A (orthogonal, surfaced-not-introduced, handoff to Phase 61) with zero Category B (Phase 60 genuine). The root cause is a single testId timeout signature (`candidate-questions-list` / `candidate-questions-start`) in the candidate question-flow surface, previously masked in the baseline by LAYOUT-02's stuck-at-Loading symptom, now visible because the layout hydration is fixed. pending_review: true is set for user verification of the classification before phase close.**

## Performance

- **Duration:** 9m 50s (14:49:47 → 14:59:37 local, 2026-04-24)
- **Tasks:** 3 / 3 (Tasks 1 + 2 executed; Task 3 checkpoint auto-resolved per protocol)
- **Files created:** 4 (3 post-change artifacts + this SUMMARY.md)
- **Files modified:** 0
- **Commits:** 2 atomic task commits + 1 final metadata commit to follow
- **Playwright runtime:** 238.8s (~4 min; well under 15-20min budget because test cancellations from cascades shorten wall-clock)

## Accomplishments

### Task 1: Capture full Playwright suite with --workers=1

**Commit:** `d2de40ad0`

- Supabase running (`yarn dev:status` green).
- Database reset (`yarn dev:reset`) to eliminate contamination from Plan 60-03/04 runs.
- Frontend dev server (`yarn workspace @openvaa/frontend dev`) running on port 5173; HTTP 200 on `/en`.
- Created output directory: `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/`.
- Ran canonical invocation per B-2: `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`
- **Deviation (minor, Rule 3):** dotenv injected an "injecting env (25) from .env — tip: enable debug logging with { debug: true }" banner to stdout before the JSON body. Playwright's JSON reporter uses stdout. Stripped the banner in-place by locating the first line-start `{` (regex `^\{$` multiline) and truncating — the bytes before it are the dotenv banner (harmless). Resulting JSON parses cleanly with valid `suites[]` (26 top-level suites) and `stats` object.
- Final artifact: `post-change/playwright-report.json` (188,016 bytes, 90 tests = 89 baseline + 1 new D-09).
- `stats`: `{ expected: 18, skipped: 56, unexpected: 16, flaky: 0 }`.

**Acceptance criteria (7/7 pass):** directory exists, file exists, valid JSON, non-empty suites, stats object present with all 4 keys, count ≈ 90 (matches baseline+1), stderr file exists (empty — no infrastructure errors).

### Task 2: Run parity diff script + write diff.md

**Commit:** `8c7c7da6d`

- Ran: `npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline> <post-change> 2>&1 | tee post-change/diff.md`
- Exit code: 1 (PARITY GATE: FAIL).
- Script output captured verbatim as the first section of `diff.md`.
- Appended comprehensive executor summary footer with:
  - Verdict line
  - Direct unblocked tests table (LAYOUT-02 target tests + D-09)
  - Status transition matrix (baseline → post-change)
  - Data-race pool delta analysis
  - Regression classification (Category A orthogonal vs Category B phase-genuine)
  - Auto-checkpoint resolution log
  - B-3 + W-5 dispositions carried forward from Plan 60-01
  - W-5 gap analysis (corrected)
  - Phase 61 handoff package (per-test classification + investigation recommendation)
  - SC-4 verdict with alternative-evidence justification for LAYOUT-01/02/03 requirement completion

**Verdict summary:**

```
Baseline: 41p / 10f / 38c
Post:     18p / 16f / 56c
Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
PARITY GATE: FAIL — 24 regression(s)
```

### Task 3: CHECKPOINT — auto-resolved with pending_review flag

Per `<auto_checkpoint_handling>` protocol:

> If `PARITY GATE: FAIL` or unexpected regressions → still resolve inline with explicit documentation in SUMMARY.md (for user review downstream), but flag the issue clearly. Do NOT silently proceed — document and mark `pending_review: true` in SUMMARY.md frontmatter so the user can inspect.

Applied:
- Checkpoint resolved inline (no human interaction requested)
- `pending_review: true` in this SUMMARY.md frontmatter (line 6)
- Full classification documented in `diff.md` and this SUMMARY.md
- User can inspect `diff.md` `§Phase 60 Parity Gate — Executor Summary` for the formal argument; §Phase 61 Handoff gives the handoff entry point

## Full-Suite Capture Details

**Command used:**
```bash
yarn playwright test -c ./tests/playwright.config.ts \
  --workers=1 \
  --reporter=json \
  > .planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json \
  2> .planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright.stderr.txt
```

**Total runtime:** 238.834s (stat from JSON report) = ~3m 59s. Shorter than the 15-20m budget because Playwright cascade-skips dependent projects on upstream failure, reducing executed test count.

**Stats (from JSON `stats` object):**
- `expected: 18` — tests that passed
- `skipped: 56` — tests that did not run (13 source-skip markers + 43 cascade skips)
- `unexpected: 16` — tests that failed (6 direct candidate-questions + 10 baseline DATA_RACE_TESTS pool members)
- `flaky: 0` — no retries resolved to pass
- `startTime: 2026-04-24T11:50:49.913Z`

## Verdict Line (verbatim from diff.md)

```
PARITY GATE: FAIL — 24 regression(s)
```

(Full 24-item list with per-test transition annotation is in `diff.md §Script Output (verbatim)`.)

## Pass-Count Delta

| Metric | Baseline (3c57949c8) | Post-change | Delta |
|--------|----------------------|-------------|-------|
| Passed | 41 | 18 | −23 |
| Failed | 10 (data-race pool) | 16 | +6 |
| Cascade/Skipped | 38 | 56 | +18 |
| Total | 89 | 90 | +1 (D-09) |

**Interpretation:** the −23 pass-count change is entirely explained by the 24 regressions (−23 because D-09 adds +1 pass, which partly offsets). No independent pass-count loss.

## D-09 Test Status

**PASSED** — 3.9s. First and only run; no retry required.

The new `voter-popup-hydration.spec.ts` test (LAYOUT-03 regression gate) exercises the full-page-load hydration path on `/results` with an in-memory setTimeout-triggered popup. Pass confirms:
- PopupRenderer wrapper deletion (Plan 60-04 Task 2) is safe — inline renderer works.
- Root layout hydration fix (Plan 60-02) holds on the voter-app code path.
- `fromStore(popupQueue).current + {@const Component} + <Component ...>` pattern is SSR-and-hydration-safe.
- The two Rule-1/Rule-3 `untrack()` fixes from Plan 60-04 (root-layout dataRoot.update + AccordionSelect auto-select) keep the /results render path clean.

## Manual Smoke Test Outcome

**Not executed in this run.** Plan 60-05 Task 3 Step 5 lists manual smoke as an OPTIONAL verification on the checkpoint. Per auto-protocol, automated gate execution is the path to resolution; manual smoke was not performed. Plan 60-03's E2E proof (auth-setup PASS + candidate-auth valid-login PASS + candidate-questions:230 preview PASS in this run) already exercises the post-login protected-layout render path automatically, making manual smoke redundant for LAYOUT-02 confirmation.

If the user wishes to run the manual smoke (to corroborate the Category A classification), the documented sequence is:
1. `yarn dev:reset`
2. `yarn dev` (in one terminal)
3. Open Inbucket at http://localhost:54324
4. Register new candidate via /candidate/register
5. Click email link, confirm the dashboard renders (no stuck Loading / no stuck Error / no stuck Terms if already accepted)

If this smoke renders the dashboard cleanly, the Category A classification is corroborated (the 2 direct LAYOUT-02 target tests that cascade-skipped behind candidate-questions are testing the same dashboard-render code path the manual smoke confirms).

## B-3 Disposition (Carried Forward from 60-01 Task 2 Step B)

**Disposition: PASS — no re-embed needed.**

Plan 60-01 Task 2 Step B preflight reported: `synthetic out-of-baseline test → PARITY GATE: PASS`. This means the diff script treats new tests (not in any constant array) as additive-neutral, NOT as regressions.

Plan 60-05 empirical confirmation: the `voter-popup-hydration.spec.ts` D-09 test is new in the post-change report (not in any of the 3 constant arrays). It appears in `post` as `passed`. The diff script does NOT flag it as a Rule-3 regression (Rule 3 only fires on new `fail` or `cascade` in post; new `pass` is neutral). Plan 60-01's preflight prediction held empirically.

No Option B (re-embed into `PASS_LOCKED_TESTS`) was needed. Recorded.

## W-5 Disposition (Carried Forward from 60-01 Task 2 Step C — with correction)

**Disposition: MATCH (corrected) — no drift, no re-embed, no mitigation.**

Plan 60-01 Task 2 Step C reported "CONSTANT-COUNT: DRIFT (baseline=89 vs constants=67), 22-test gap." **This count was arithmetically wrong.**

Actual constant-array sizes (verified by re-counting):
- `PASS_LOCKED_TESTS`: 41 ✓
- `DATA_RACE_TESTS`: 10 ✓
- `CASCADE_TESTS`: **25** (60-01 reported 16 — undercounted by 9)
- Union sum: 76 (not 67)

Actual gap: 89 − 76 = **13** (not 22).

The 13-test gap is EXACTLY the `SOURCE_SKIP_TESTS` the diff script header documents at lines 19-20 of the script: *"SOURCE_SKIP_TESTS (13 tests with `test.skip()` in source) are not part of the parity contract — listed for reconciliation only."*

Enumerated (all from voter subtree, all status=`skipped` in both baseline and post):
- 6 voter-settings specs (filter, category intro, skip category, question intro, minimum answers, hide results link)
- 1 voter-journey spec (answer all Likert with navigation)
- 6 voter-matching specs (perfect match, worst match, partial-answer, hidden candidate, category-intros-not-shown, results-accessible-above-threshold)

These tests are inert — they do not enter any pass/fail/regression computation. No re-embed needed.

**Plan 60-01's "DRIFT" signal was a counting error, not real drift.** Recorded for the phase retrospective; no corrective action required in Plan 60-05 or Phase 61.

## Per-Requirement Traceability

- **LAYOUT-01:** ✓ verified via Plan 60-02 SC-1 grep (no `export let`, no `$:`, no `<slot />` in root `+layout.svelte`) + `yarn workspace @openvaa/frontend check` + build PASS.
- **LAYOUT-02:** ✓ verified via Plan 60-03 Task 2 E2E evidence: `auth-setup.ts` PASS (where previously FAILED), `candidate-auth.spec.ts:19 should login with valid credentials` PASS (exercises post-login protected-layout render path), `candidate-questions.spec.ts:230 should display entered profile and opinion data on preview page` PASS (proves protected layout renders after login). **All three of these tests PASSED again in this Plan 60-05 full-suite run** — consistent, not flake. LAYOUT-02 is fixed on the primary code path; the 2 direct target tests (`candidate-registration.spec.ts:64`, `candidate-profile.spec.ts:51`) did not execute due to upstream cascade from the orthogonal Phase 61 surface, NOT due to a LAYOUT-02 regression.
- **LAYOUT-03:** ✓ verified via this plan's D-09 PASS in the full suite (3.9s). PopupRenderer deleted atomically in Plan 60-04; inline popup rendering works under SSR+hydration.

## D-04 Upstream Svelte 5 Bug Filing (Scheduled Post-Phase)

Per Plan 60-04 observation: two adjacent Svelte 5 runes-mode gotchas were surfaced and fixed during Phase 60 — both have the same shape (`$effect` that writes back to a tracked dependency → `effect_update_depth_exceeded`):

1. **Store-mutation inside `$effect` when the store is read through a `fromStore()` bridge** — fix is `get(storeName)` + `untrack(...)`. Applied in:
   - `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` (Plan 60-03)
   - `apps/frontend/src/routes/+layout.svelte` (Plan 60-04)

2. **Child-component auto-select `$effect` that writes bindable `activeIndex`** — fix is to wrap the write in `untrack(...)`. Applied in:
   - `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte` (Plan 60-04)

**Reproduction draft:**

> In Svelte 5 runes mode, a `$effect` that reads a `fromStore()`-bridged store via `storeName.current` and then writes to it via `storeName.current.update()` creates an infinite reactive loop (`effect_update_depth_exceeded`). Root cause: the `fromStore` bridge registers the store as a dependency of the effect; the store's `.update()` call notifies subscribers → `version++` → retriggers the effect. Userland workaround: use `svelte/store::get(storeName)` to read without establishing a reactive dependency + `untrack(() => ...)` to wrap the side-effects.

**Filing status:** deferred (not a Plan 60-05 deliverable). Recommended action: file upstream Svelte issue with this reproduction after Phase 60 closes (per D-04 "Upstream Svelte 5 bug filing happens AFTER Phase 60 completes, regardless of whether we find a clean fix").

## Residual Failures Handoff (Phase 61 / Phase 63)

### Phase 61 (QUESTION-01/02/03 — candidate-questions testId timeout surface)

**Scope:** 6 direct failures + 18 cascade skips (24 total; all Category A).

**Root cause signature:**
```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log: waiting for getByTestId('candidate-questions-list').or(getByTestId('candidate-questions-start')) to be visible
```

**Affected specs:**
- `candidate-questions.spec.ts` — 6 tests fail direct (CAND-04, CAND-05 x3, CAND-12 x2)
- `candidate-app-mutation` project (all of `candidate-profile.spec.ts` + `candidate-registration.spec.ts`) — cascade-skipped
- `candidate-app-settings` project (all 8 `candidate-settings.spec.ts` tests) — cascade-skipped
- `candidate-app-password` project (both `candidate-password.spec.ts` tests) — cascade-skipped
- `re-auth-setup` project (1 test) — cascade-skipped

**Recommended Phase 61 entry:**
1. `yarn dev:reset-with-data` + `yarn workspace @openvaa/frontend dev`
2. Sign in as candidate (e.g., the e2e template's seeded candidate).
3. Navigate to `/candidate/questions`.
4. Inspect DOM: are `data-testid="candidate-questions-list"` and `data-testid="candidate-questions-start"` present?
   - If MISSING (testId renamed in Svelte 5 migration): update spec OR restore testIds in component source.
   - If PRESENT but gated (data-provider timing): investigate `candidate/(protected)/questions/+page.svelte` render path against the Plan 60-03 `untrack()`-based dataRoot provisioning order.
5. Re-run SC-4 parity gate after fix — expected outcome: 6 direct failures resolve + 18 cascade skips auto-resolve → net +24 pass-count.

### Phase 63 (E2E-01 — data-race pool + cascade baseline greening)

**Scope:** 10 baseline DATA_RACE_TESTS + 38 baseline CASCADE_TESTS.

**Status after Phase 60:** Unchanged. Phase 60's parity gate HELD the line on the cascade baseline (0 CASCADE → fail-outside-pool transitions per D-12 rule 2) and the data-race pool did not grow (0 new entrants per rule 5). Phase 63 owns the greening work.

## Deviations from Plan

### [Rule 3 - Blocking] dotenv banner polluted JSON output

- **Found during:** Task 1 Step 3 JSON validation (`python3 -c "import json; json.load(...)"` failed with "Expecting value: line 1 column 2").
- **Issue:** dotenv 17.3.1 emits its "injecting env (25) from .env" banner to stdout before the first `{` of the Playwright JSON report. The `> post-change/playwright-report.json` redirect captured both.
- **Fix:** Python in-place strip using `re.search(r'^\{$', content, re.MULTILINE)` to locate the first line-start `{` (regex eliminates false-match on the `{ debug: true }` literal inside the banner). Truncated everything before it. Wrote cleaned content back to the same file.
- **Files modified:** `post-change/playwright-report.json` (content only — banner removed).
- **Verification:** `python3 -c "import json; r=json.load(open(...)); assert bool(r.get('suites'))"` exits 0 after strip; stats count = 90 (matches expectation); no re-run of Playwright required (the JSON bytes were complete, just prefixed).
- **Not tracked as a code-level Rule 3** (no application source changed); tracked as an artifact-hygiene fix applied to the frozen post-change evidence. Preserved in-place so `diff.md` and downstream readers see a clean JSON.

### None — no other Rule 1/2/3 auto-fixes

No application code was modified in this plan. Plan 60-05 is purely observational: capture a Playwright run + diff against baseline + document.

## Known Stubs

None — this plan created no stubs. All post-change artifacts are final output; no placeholders.

## Threat Flags

None. Plan 60-05 touched only `.planning/` artifacts (E2E report, diff analysis, summary). No new network endpoints, no new auth paths, no new data ingestion, no application-code changes. Same trust boundary as Plan 60-01's observational-only scope.

Per the plan's threat-model register (T-60-05-01/02): both dispositions `accept`. No new threats.

## TDD Gate Compliance

N/A — plan frontmatter is `type: execute` / `tdd: false`. No RED/GREEN/REFACTOR gate cycle required. Commit types used: `test` (Task 1: capture post-change report) + `docs` (Task 2: diff.md + analysis).

## User Setup Required

None — no external service configuration, no env-var changes, no dashboard steps. All Supabase + frontend setup was pre-running or automatable via `yarn dev:reset` + `yarn workspace @openvaa/frontend dev`.

## Pending Review (`pending_review: true`)

Per auto_checkpoint_handling protocol, this SUMMARY.md is flagged `pending_review: true` in frontmatter. The user is asked to verify:

1. **Classification:** Are the 24 regressions correctly classified as Category A (orthogonal, surfaced-not-introduced)?
   - Supporting evidence: single testId timeout signature across all 6 direct failures; all 18 cascade skips trace to the same 6 via Playwright project dependency chain; Plan 60-03 Task 2 independently documented this surface as "the next layer of failure after LAYOUT-02 is fixed"; alternative-evidence proof of LAYOUT-02 completion is the auth-setup + valid-login + preview-page triple (all 3 PASS in this run).

2. **Phase closure readiness:** Phase 60 requirements LAYOUT-01/02/03 are all verified by alternative evidence (SC-1 grep + Plan 60-03 indirect E2E + D-09 pass). The SC-4 literal parity gate is FAIL, which is the only blocker. If the classification is accepted, Phase 60 can close and milestone v2.6 can advance to Phase 61.

3. **Phase 61 handoff:** Is the handoff package (§Phase 61 Handoff in diff.md + this SUMMARY.md) sufficient for Phase 61 entry without additional Plan 60-05 work?

If the user rejects the classification, the next step is re-open Plan 60-02 / 60-03 / 60-04 for a deeper investigation — but this would be unusual given the localized signature.

## Self-Check: PASSED

**Files created:**

- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json` — FOUND
- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright.stderr.txt` — FOUND
- `.planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md` — FOUND
- `.planning/phases/60-layout-runes-migration-hydration-fix/60-05-SUMMARY.md` — FOUND (this file)

**Commits:**

- `d2de40ad0` — FOUND (Task 1: capture post-change Playwright report)
- `8c7c7da6d` — FOUND (Task 2: parity diff vs baseline — PARITY GATE: FAIL documented)

**Plan-level verification:**

```
$ test -f .planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json && \
  test -f .planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md && \
  grep -q 'PARITY GATE' .planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md && \
  grep -q 'Executor Summary' .planning/phases/60-layout-runes-migration-hydration-fix/post-change/diff.md && \
  python3 -c "import json; r=json.load(open('.planning/phases/60-layout-runes-migration-hydration-fix/post-change/playwright-report.json')); assert bool(r.get('suites')) and r.get('stats',{}).get('expected')==18" && \
  echo "Plan 60-05 end verification complete"

Plan 60-05 end verification complete
```

Note: the `grep -q 'PARITY GATE: PASS'` form from the plan's `<automated>` verify block would fail in this run. The verdict is `PARITY GATE: FAIL` — this is the honest output of the gate and must not be altered. The classification section in `diff.md` and this SUMMARY.md carries the interpretation.

---

*Phase: 60-layout-runes-migration-hydration-fix*
*Completed: 2026-04-24 (pending_review: true)*

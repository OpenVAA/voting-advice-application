---
phase: 138
slug: def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
---

# Phase 138 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `138-RESEARCH.md` § Validation Architecture (lines 1525-1571).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright Test 1.58.2 (`node_modules/@playwright/test/package.json`) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line` *(project lands in Wave 0)* |
| **Full suite command** | `yarn test:e2e` (`package.json:27`) |
| **Estimated runtime** | quick ≈ seconds; full suite ≈ 648 s (measured, 134/134) |
| **Unit framework (unaffected)** | vitest via `turbo run test:unit` (`package.json:25`) |

**Execution prerequisite (project-specific):** one freshly started dev server, and a clean DB
(`yarn db:reset`, ≈28-30 s) before any full-suite gate run. Port `:5173` may be held by a Docker
sibling's wildcard bind — use the `FRONTEND_PORT` escape hatch (the Phase-137 gate used `5273`).
Every evidence run must be confirmed by the Phase-137 served-app preflight (D-17).

---

## Sampling Rate

- **After every task commit:** `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line`, plus `yarn typecheck:tests` and `yarn lint:check` (`package.json:32-33`)
- **After every plan wave:** `yarn test:e2e --project=voter-journey` (pulls `data-setup-base`; the EPERM-07 step is inside it)
- **Before `/gsd-verify-work`:** full suite green, then the 16-run determinism batch
- **Max feedback latency:** < 60 s for the isolated spec; ~648 s for a full-suite sample

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 138-01-T1 | 01 | 1 | INTEG-01 | — | N/A | static | U-1 verdict + 3-row hypothesis ledger present in `138-DIAGNOSIS.md` (`grep -cE '^\| H[123] \|'` → 3) | ❌ W0 | ⬜ pending |
| 138-01-T2 | 01 | 1 | INTEG-01 | T-138-02, T-138-03 | forcing knobs neutral by default; CDP reset in `finally` | e2e artifact | `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line`; video + console/requestfailed attachments on a failing run; `--list --grep-invert @probe` → 135 | ❌ W0 | ⬜ pending |
| 138-01-T3 | 01 | 1 | INTEG-01 | T-138-01 | run artifacts land only under git-ignored paths | script | `tests/scripts/e2e-run.sh --run-dir … --project eperm07-term-trigger` → exit 0 with `devserver.log`, `results.json`, `stdout.log`, `exit`, `preflight-failures` | ❌ W0 | ⬜ pending |
| 138-02-T1 | 02 | 2 | INTEG-01 (D-08) | — | N/A | static + e2e | `grep -c 'expect.soft(questionHeading)' tests/tests/specs/voter/voter-journey.spec.ts` → 0; `--project=voter-journey` exits 0 | ✅ file exists | ⬜ pending |
| 138-02-T2 | 02 | 2 | INTEG-01 | T-138-05, T-138-06 | forcing is env-prefix only; counts machine-read | e2e | `EPERM07_FORCE_BUDGET_MS=… npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger`; `eperm07-state` annotation read from `results.json` per run | ❌ W0 | ⬜ pending |
| 138-02-T3 | 02 | 2 | INTEG-01 | — | N/A | e2e A/B | `EPERM07_NO_VT=true` arm vs. unset arm, 10 runs each at the frozen configuration; one of three named verdicts recorded | ❌ W0 | ⬜ pending |
| 138-03-T1 | 03 | 3 | INTEG-01 | T-138-09 | throttle never survives an aborted run | e2e | `EPERM07_FORCE_CPU_RATE=… npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger` at the production budget; post-abort unforced run is a normal-duration pass | ❌ W0 | ⬜ pending |
| 138-03-T2 | 03 | 3 | INTEG-01 | T-138-11 | no experiment reaches a committed file | e2e | isolated vs. worker-pressured arms at one configuration; `git status --porcelain tests/ apps/` prints nothing | ❌ W0 | ⬜ pending |
| 138-03-T3 | 03 | 3 | INTEG-01 | T-138-10 | every quantitative claim cites an experiment section | static | `grep -c 'PENDING — plan 03 writes this section.' 138-DIAGNOSIS.md` → 0; all three ledger rows terminal; `grep -c translateQuestionTerms` → 0 | ❌ W0 | ⬜ pending |
| 138-04-T1 | 04 | 4 | INTEG-01/02 (D-06) | T-138-14 | test-side remedy requires operator authorisation | checkpoint | blocking `checkpoint:decision`; tier recorded in the plan summary with the reasoning sentence | n/a | ⬜ pending |
| 138-04-T2 | 04 | 4 | INTEG-02 | T-138-15 | pre-fix half taken against a provably unfixed tree | negative control | frozen forcing command on the **pre-fix** tree, ≥5 consecutive → FAIL; `git diff --quiet apps/ tests/tests/specs/voter/voter-journey.spec.ts` at capture time | ❌ W0 | ⬜ pending |
| 138-04-T3 | 04 | 4 | INTEG-02 | T-138-15, T-138-16 | adversary byte-identical; no oracle weakened | negative control | byte-identical invocation on the **post-fix** tree, ≥5 consecutive → PASS; `yarn lint:check` exit 0; `grep -c 'element: 2_000' tests/tests/helpers/timeouts.ts` → 1 | ❌ W0 | ⬜ pending |
| 138-05-T1 | 05 | 5 | INTEG-02 | T-138-19 | refuses to start with `CI` set; degenerate run counts rejected | script | `bash -n`; `--runs 0` / `--runs abc` exit non-zero; `CI=1` exits non-zero; `--runs 2 --project eperm07-term-trigger` emits a 2-row self-test ledger | ❌ W0 | ⬜ pending |
| 138-05-T2 | 05 | 5 | INTEG-02 | T-138-19, T-138-21, T-138-22 | executed-count validity, one pinned HEAD, artifact pruning | e2e batch | `tests/scripts/determinism-batch.sh --runs 16` → 16 rows, each executed **135**, failed 0, did-not-run 0, EPERM-07 passed | ❌ W0 | ⬜ pending |
| 138-05-T2 | 05 | 5 | INTEG-02 (D-17) | — | preflight confirmation captured per run | grep | `grep -c 'E2E PREFLIGHT FAILED' run-NN/stdout.log` → 0 for all 16 | ✅ preflight exists | ⬜ pending |
| 138-05-T3 | 05 | 5 | INTEG-02 | T-138-19 | verdict claims criterion 3 only | static | four sections present (`Verdict`, `Retry posture`, `Executed-count baseline`, `Contention environment`), each citing a ledger row or file:line | ❌ W0 | ⬜ pending |
| 138-06-T1 | 06 | 6 | INTEG-03 | — | N/A | static | `! grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests --include='*.ts'`; `grep -c 'describe.skip' tests/README.md` → 0 | ✅ baseline 0 | ⬜ pending |
| 138-06-T2 | 06 | 6 | INTEG-03 (D-18) | T-138-24 | one-way door behind an operator decision | checkpoint | blocking `checkpoint:decision`; decision + weakest-criterion sentence recorded | n/a | ⬜ pending |
| 138-06-T3 | 06 | 6 | INTEG-03 | T-138-24, T-138-25, T-138-27 | archive intact; exactly one waiver; suite green at discharge | static + e2e | `grep -c '^## Discharged' waiver` → 1; `ls .planning/*WAIVER*.md \| wc -l` → 1; `git diff --quiet .planning/milestones/v2.14-REQUIREMENTS.md CLAUDE.md`; `yarn test:e2e` → 135/0/0 | ✅ files exist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs assigned by the planner 2026-08-13. Plan split: 6 plans, 6 sequential waves (no two plans
share a wave — every E2E-running plan contends for the same host port, database and worker pool, so
file-disjointness is not sufficient grounds for parallelism here).*

**Executed-count baseline change:** the map above asserts **135**, not the 134 the draft carried. The
`eperm07-term-trigger` hunt spec ships permanently as a LEAF regression guard (planner decision,
recorded in `138-01-PLAN.md`), adding one test to the default suite. `138-DETERMINISM-LEDGER.md`
§ Executed-count baseline records the change and its cause so a later reader does not read it as
drift.

---

## Wave 0 Requirements

Every item below is created inside this phase; the owning plan/task is named so the map above has no
unowned dependency.

- [ ] `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` — the isolated hunt spec (INTEG-01, criteria 1-2) → **138-01-T2**
- [ ] `eperm07-term-trigger` project entry in `tests/playwright.config.ts` → **138-01-T2**
- [ ] `tests/tests/fixtures/shared/forensicCapture.fixture.ts` + auto registration in `views.ts` (D-11) → **138-01-T2**
- [ ] `video` retention on the `voter-journey` project (D-09) → **138-01-T2**
- [ ] `tests/scripts/e2e-run.sh` — single-run wrapper owning dev-server spawn + log redirection + per-run artifacts (D-10) → **138-01-T3**
- [ ] `tests/e2e-runs/` added to `.gitignore` → **138-01-T3**
- [ ] `138-DIAGNOSIS.md` (U-1 verdict + hypothesis ledger, then the named root cause) → **138-01-T1**, completed by **138-03-T3**
- [ ] `138-FORCED-REPRO.md` (the forcing-configuration search log) → **138-02-T2**
- [ ] `138-NEGATIVE-CONTROL.md` (criterion 2, format per Phase 137) → **138-04-T2** / **138-04-T3**
- [ ] `tests/scripts/determinism-batch.sh` — the serial N-run loop (criterion 3) → **138-05-T1**
- [ ] `138-DETERMINISM-LEDGER.md` (criterion 3, D-12's phase-local alternative) → **138-05-T2** / **138-05-T3**
- [ ] Framework install: **none required** — Playwright 1.58.2 already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Root cause is *named* (mechanism, file:line, ordering, or contended resource) | INTEG-01 | A prose diagnosis cannot be asserted by a command; only its presence can | Read the diagnosis document; confirm it names a mechanism with file:line, not a symptom |
| D-06 escalation decision, if the mechanism proves test-side | INTEG-01/02 | CONTEXT.md D-06 forbids the executor from applying a test-side remedy unilaterally | Executor stops at a `checkpoint:decision` and presents the forced-repro evidence to the operator |
| No "could not reproduce" closure exists anywhere in the record | INTEG-03 | Requires reading the phase record for intent, not just grepping a token | Review all Phase-138 artifacts for non-reproduction closure language |
| Waiver discharge is unrenewed (no successor waiver) | INTEG-03 | Absence-of-a-new-document is a judgement over the planning tree | Confirm no new `*-WAIVER.md` and no re-scoped exception was added |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (isolated spec)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

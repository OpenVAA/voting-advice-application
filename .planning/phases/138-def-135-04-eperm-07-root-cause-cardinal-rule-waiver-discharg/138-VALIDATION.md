---
phase: 138
slug: def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-13
validated: 2026-08-14
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

> Reconciled 2026-08-14 by `/gsd-validate-phase 138`. Rows were seeded at plan time (all `⬜ pending`)
> and are now resolved against the executed phase. Static rows were **re-executed in this session**;
> e2e and negative-control rows cite the durable evidence produced during the phase, since they need
> a live dev server, a clean DB and — for the determinism batch — roughly three hours of serial runs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 138-01-T1 | 01 | 1 | INTEG-01 | — | N/A | static | U-1 verdict + 3-row hypothesis ledger present in `138-DIAGNOSIS.md` (`grep -cE '^\| H[123] \|'` → 3) | ✅ | ✅ green — **re-run 2026-08-14**, count 3 |
| 138-01-T2 | 01 | 1 | INTEG-01 | T-138-02, T-138-03 | forcing knobs neutral by default; CDP reset in `finally` | e2e artifact | `npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger --reporter=line`; video + console/requestfailed attachments on a failing run; `--list --grep-invert @probe` → 135 | ✅ `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` | ✅ green — **baseline re-run 2026-08-14**: `Total: 135 tests in 89 files` |
| 138-01-T3 | 01 | 1 | INTEG-01 | T-138-01 | run artifacts land only under git-ignored paths | script | `tests/scripts/e2e-run.sh --run-dir … --project eperm07-term-trigger` → exit 0 with `devserver.log`, `results.json`, `stdout.log`, `exit`, `preflight-failures` | ✅ `tests/scripts/e2e-run.sh` | ✅ green — script committed; `.gitignore:44` = `tests/e2e-runs/` **re-verified 2026-08-14** |
| 138-02-T1 | 02 | 2 | INTEG-01 (D-08) | — | N/A | static + e2e | **CORRECTED 2026-08-14 — see note below.** `grep -c 'expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7' tests/tests/specs/voter/voter-journey.spec.ts` → **0** AND `grep -c 'await expect(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7' …` → **1**; `--project=voter-journey` exits 0 | ✅ | ✅ green — **re-run 2026-08-14**: soft 0, hard 1; promoted line + two-line `// reason:` provenance at `voter-journey.spec.ts:890-892` |
| 138-02-T2 | 02 | 2 | INTEG-01 | T-138-05, T-138-06 | forcing is env-prefix only; counts machine-read | e2e | `EPERM07_FORCE_BUDGET_MS=… npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger`; `eperm07-state` annotation read from `results.json` per run | ✅ | ✅ green — `138-FORCED-REPRO.md` (forcing-configuration search log) |
| 138-02-T3 | 02 | 2 | INTEG-01 | — | N/A | e2e A/B | `EPERM07_NO_VT=true` arm vs. unset arm, 10 runs each at the frozen configuration; one of three named verdicts recorded | ✅ | ✅ green — `138-FORCED-REPRO.md`; verdict recorded |
| 138-03-T1 | 03 | 3 | INTEG-01 | T-138-09 | throttle never survives an aborted run | e2e | `EPERM07_FORCE_CPU_RATE=… npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger` at the production budget; post-abort unforced run is a normal-duration pass | ✅ | ✅ green — `138-FORCED-REPRO.md` |
| 138-03-T2 | 03 | 3 | INTEG-01 | T-138-11 | no experiment reaches a committed file | e2e | isolated vs. worker-pressured arms at one configuration; `git status --porcelain tests/ apps/` prints nothing | ✅ | ✅ green — **re-verified 2026-08-14**: scoped porcelain empty |
| 138-03-T3 | 03 | 3 | INTEG-01 | T-138-10 | every quantitative claim cites an experiment section | static | `grep -c 'PENDING — plan 03 writes this section.' 138-DIAGNOSIS.md` → 0; all three ledger rows terminal; `grep -c translateQuestionTerms` → 0 | ✅ | ✅ green — **re-run 2026-08-14**: both counts 0 |
| 138-04-T1 | 04 | 4 | INTEG-01/02 (D-06) | T-138-14 | test-side remedy requires operator authorisation | checkpoint | blocking `checkpoint:decision`; tier recorded in the plan summary with the reasoning sentence | n/a | ✅ green — operator decision recorded; confirmed by `138-VERIFICATION.md` § Judgment Calls |
| 138-04-T2 | 04 | 4 | INTEG-02 | T-138-15 | pre-fix half taken against a provably unfixed tree | negative control | frozen forcing command on the **pre-fix** tree, ≥5 consecutive → FAIL; `git diff --quiet apps/ tests/tests/specs/voter/voter-journey.spec.ts` at capture time | ✅ | ✅ green — `138-NEGATIVE-CONTROL.md` §4.3: **5/5 fail**, verbatim output at §4.3.1 |
| 138-04-T3 | 04 | 4 | INTEG-02 | T-138-15, T-138-16 | adversary byte-identical; no oracle weakened | negative control | byte-identical invocation on the **post-fix** tree, ≥5 consecutive → PASS; `yarn lint:check` exit 0; `grep -c 'element: 2_000' tests/tests/helpers/timeouts.ts` → 1 | ✅ | ✅ green — §5.3: **5/5 pass**; §5.4 side-by-side; timeout grep **re-run 2026-08-14** → 1 (no budget raised) |
| 138-05-T1 | 05 | 5 | INTEG-02 | T-138-19 | refuses to start with `CI` set; degenerate run counts rejected | script | `bash -n`; `--runs 0` / `--runs abc` exit non-zero; `CI=1` exits non-zero; `--runs 2 --project eperm07-term-trigger` emits a 2-row self-test ledger | ✅ `tests/scripts/determinism-batch.sh` | ✅ green — script committed with guards; self-test ledger recorded |
| 138-05-T2 | 05 | 5 | INTEG-02 | T-138-19, T-138-21, T-138-22 | executed-count validity, one pinned HEAD, artifact pruning | e2e batch | `tests/scripts/determinism-batch.sh --runs 16` → 16 rows, each executed **135**, failed 0, did-not-run 0, EPERM-07 passed | ✅ | ✅ green — `138-DETERMINISM-LEDGER.md` § Per-run ledger + § Verdict: **16/16**, each 135/135 |
| 138-05-T2 | 05 | 5 | INTEG-02 (D-17) | — | preflight confirmation captured per run | grep | `grep -c 'E2E PREFLIGHT FAILED' run-NN/stdout.log` → 0 for all 16 | ✅ | ✅ green — every run preflight-confirmed (§ Verdict) |
| 138-05-T3 | 05 | 5 | INTEG-02 | T-138-19 | verdict claims criterion 3 only | static | four sections present (`Verdict`, `Retry posture`, `Executed-count baseline`, `Contention environment`), each citing a ledger row or file:line | ✅ | ✅ green — **re-verified 2026-08-14**: all four headings present, plus § "What this batch does NOT establish" |
| 138-06-T1 | 06 | 6 | INTEG-03 | — | N/A | static | `! grep -rnE 'test\.(skip\|fixme\|only)\(\|describe\.(skip\|only)\b' tests/tests --include='*.ts'`; `grep -c 'describe.skip' tests/README.md` → 0 | ✅ | ✅ green — **re-run 2026-08-14**: 0 matches in specs, 0 in README |
| 138-06-T2 | 06 | 6 | INTEG-03 (D-18) | T-138-24 | one-way door behind an operator decision | checkpoint | blocking `checkpoint:decision`; decision + weakest-criterion sentence recorded | n/a | ✅ green — discharge checkpoint recorded with the operator's verbatim caveat; confirmed by `138-VERIFICATION.md` |
| 138-06-T3 | 06 | 6 | INTEG-03 | T-138-24, T-138-25, T-138-27 | archive intact; exactly one waiver; suite green at discharge | static + e2e | `grep -c '^## Discharged' waiver` → 1; `ls .planning/*WAIVER*.md \| wc -l` → 1; `git diff --quiet .planning/milestones/v2.14-REQUIREMENTS.md CLAUDE.md`; `yarn test:e2e` → 135/0/0 | ✅ | ✅ green — **re-run 2026-08-14**: 1 Discharged heading, 1 waiver file; suite 135/0/0 at discharge |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs assigned by the planner 2026-08-13. Plan split: 6 plans, 6 sequential waves (no two plans
share a wave — every E2E-running plan contends for the same host port, database and worker pool, so
file-disjointness is not sufficient grounds for parallelism here).*

> **⚠ ROW 138-02-T1 CORRECTED 2026-08-14 by `/gsd-validate-phase 138`.**
>
> The seeded command was `grep -c 'expect.soft(questionHeading)' …` → **0**. That command is
> **over-broad and would read as a permanent false red**: the pattern matches every heading
> assertion in the file (9 at plan time, **8** today), but D-08 names exactly one — the Base-3
> Likert-7 arrival gate. Promoting all nine was never the intent and was never done.
>
> `138-02-SUMMARY.md` § Deviations from Plan already recorded the scoped replacement at execution
> time; this audit adopts it into the contract so the row is checkable by a later reader. Both
> halves re-run 2026-08-14 and green. The count moving 9 → 8 is exactly the one promotion, at
> `tests/tests/specs/voter/voter-journey.spec.ts:892`.

**Executed-count baseline change:** the map above asserts **135**, not the 134 the draft carried. The
`eperm07-term-trigger` hunt spec ships permanently as a LEAF regression guard (planner decision,
recorded in `138-01-PLAN.md`), adding one test to the default suite. `138-DETERMINISM-LEDGER.md`
§ Executed-count baseline records the change and its cause so a later reader does not read it as
drift. **Re-confirmed 2026-08-14:** `--list --grep-invert @probe` → `Total: 135 tests in 89 files`.

---

## Wave 0 Requirements

All delivered — `wave_0_complete: true` set 2026-08-14. Existence of every committed artifact
re-verified in this session.

- [x] `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` — the isolated hunt spec (INTEG-01, criteria 1-2) → **138-01-T2** — *ships permanently as a LEAF regression guard; this is the +1 in the 135 baseline*
- [x] `eperm07-term-trigger` project entry in `tests/playwright.config.ts` → **138-01-T2**
- [x] `tests/tests/fixtures/shared/forensicCapture.fixture.ts` + auto registration in `views.ts` (D-11) → **138-01-T2**
- [x] `video` retention on the `voter-journey` project (D-09) → **138-01-T2**
- [x] `tests/scripts/e2e-run.sh` — single-run wrapper owning dev-server spawn + log redirection + per-run artifacts (D-10) → **138-01-T3**
- [x] `tests/e2e-runs/` added to `.gitignore` → **138-01-T3** — confirmed at `.gitignore:44`
- [x] `138-DIAGNOSIS.md` (U-1 verdict + hypothesis ledger, then the named root cause) → **138-01-T1**, completed by **138-03-T3**
- [x] `138-FORCED-REPRO.md` (the forcing-configuration search log) → **138-02-T2**
- [x] `138-NEGATIVE-CONTROL.md` (criterion 2, format per Phase 137) → **138-04-T2** / **138-04-T3**
- [x] `tests/scripts/determinism-batch.sh` — the serial N-run loop (criterion 3) → **138-05-T1**
- [x] `138-DETERMINISM-LEDGER.md` (criterion 3, D-12's phase-local alternative) → **138-05-T2** / **138-05-T3**
- [x] Framework install: **none required** — Playwright 1.58.2 already present

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Root cause is *named* (mechanism, file:line, ordering, or contended resource) | INTEG-01 | A prose diagnosis cannot be asserted by a command; only its presence can | Read the diagnosis document; confirm it names a mechanism with file:line, not a symptom |
| D-06 escalation decision, if the mechanism proves test-side | INTEG-01/02 | CONTEXT.md D-06 forbids the executor from applying a test-side remedy unilaterally | Executor stops at a `checkpoint:decision` and presents the forced-repro evidence to the operator |
| No "could not reproduce" closure exists anywhere in the record | INTEG-03 | Requires reading the phase record for intent, not just grepping a token | Review all Phase-138 artifacts for non-reproduction closure language |
| Waiver discharge is unrenewed (no successor waiver) | INTEG-03 | Absence-of-a-new-document is a judgement over the planning tree | Confirm no new `*-WAIVER.md` and no re-scoped exception was added |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s (isolated spec)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-08-14 (`/gsd-validate-phase 138`)

---

## Validation Audit 2026-08-14

| Metric | Count |
|--------|-------|
| Gaps found | 1 (a defective row command, not a coverage gap) |
| Resolved | 1 |
| Escalated | 0 |
| Manual-only (declared at plan time, irreducible) | 4 |
| Rows reconciled from `⬜ pending` to `✅ green` | 19 |

**Method:** State A audit. No auditor subagent was spawned — no gap was fillable by a new test. Six
static rows, the executed-count baseline, the `element: 2_000` timeout guard, the skip/only/fixme
sweep, the waiver-integrity greps and the scoped-porcelain check were **re-executed in this session**
rather than read off the SUMMARY files. The e2e and negative-control rows cite the durable evidence
produced during the phase: they require a live dev server, a clean DB, and — for 138-05-T2 — a
16-run serial batch that is not reproducible inside a validation pass.

**The one gap found was in the contract, not the code.** Row 138-02-T1's seeded command was
over-broad by a factor of nine and would have read as a permanent false red to any later auditor:
`grep -c 'expect.soft(questionHeading)'` matches every heading assertion in `voter-journey.spec.ts`,
while D-08 names exactly one. The executor caught this during Plan 02 and recorded the scoped
replacement in `138-02-SUMMARY.md` § Deviations from Plan; until now that correction lived only in
the summary, so the validation contract still carried the wrong command. It is now adopted into the
row, and both halves are green. **This is the substantive value of running validate-phase
retroactively on this phase** — the coverage was always real; the record of it was not checkable.

**Why `nyquist_compliant: true` despite four manual-only rows.** All four are irreducible judgments
over prose, not unfilled automation: whether a diagnosis *names a mechanism* rather than a symptom,
whether the D-06 escalation was properly routed to a human, whether any "could not reproduce"
closure language survives anywhere in the record, and whether the discharge is unrenewed. Each is a
semantic reading, and each was performed and recorded — `138-VERIFICATION.md` § Judgment Calls
confirms both checkpoint decisions reached a real operator and that the record carries the
operator's verbatim caveat sentence. Every behaviour that *can* be asserted by a command has one.

**Carried open (not a validation gap).** The unlocalised multi-second navigation excursion remains
attributed to a transient dev-server stall by operator judgment 2026-08-14 — explicitly recorded as
unlocalised and falsifiable rather than resolved. `138-VERIFICATION.md` confirms it is framed as an
open judgment, and this audit does not close it.

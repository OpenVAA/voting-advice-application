---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 02
subsystem: testing
tags: [vitest, assertion-quality, negative-control, audit-verification, argument-condensation, injection-testing]

# Dependency graph
requires:
  - phase: 139-01
    provides: "139-VERDICTS.md §§ 1-4 — the HYGIENE-LOOP, the TWO-COLUMN RULE, the COLLATERAL RULE, the 15-row enumeration and the prediction-calibration clause, all applied here by name rather than re-derived"
provides:
  - "F15-B verdict: confirmed, backed by an executed injection at condenser.ts:205 plus an in-band positive control at condenser.ts:204"
  - "F15-C verdict: confirmed, from the same shared injection, with the viz-test sub-prediction recorded as overturned"
  - "F16 verdict: confirmed — but the audit's own named regression is REFUTED by execution, and § 5.4.6 replaces it as Phase 142's negative control"
  - "F20-6 verdict: confirmed, via the message-swap injection that preserves the throw; the removal design is recorded as rejected with its reason"
  - "139-VERDICTS.md § 8 opened and structured (8.1 collateral reds, 8.2 overturned predictions, 8.3 rejected injection designs) for plans 03-07 to append to as they run"
  - "IN-BAND POSITIVE CONTROL — a control injection on a sibling property of the same statement, proving both liveness and the specificity of the blindness"
affects: [139-03, 139-04, 139-05, 139-06, 139-07, phase-142, ASSERT-07-scope]

# Actuals (#2632)
actuals:
  tokens: 27000
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-band positive control: break a sibling property of the same statement the regression targets, and observe the suite red — proves the path is live AND localises the blindness to one field"
    - "Two injections for one finding when the first removes the category rather than varying the detail; both recorded, the overturn kept unrewritten"
    - "Shared-injection pairs: one edit, two verdict records, each with its own invocation and observed outcome"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-02-SUMMARY.md
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
  transient-injected-and-reverted:
    - packages/argument-condensation/src/api.ts
    - packages/argument-condensation/src/core/utils/condensation/planValidation.ts
    - packages/argument-condensation/src/core/condensation/condenser.ts

key-decisions:
  - "F16 is confirmed rather than withdrawn even though the audit's own named regression reds the test, because § 3.4 and RESEARCH Pitfall 2 both settle in advance that a category-removing injection is a design smell and not grounds for withdrawal; the defect the title names is confirmed by a second, category-preserving injection"
  - "The audit's F16 mechanism claim ('at least three independent paths to a throw before language validation') is refuted by execution and recorded as refuted; Phase 142 must take its negative control from § 5.4.6, never from the audit sentence"
  - "F20-6's removal design was written down as REJECTED with its reasoning rather than silently omitted, so the trap is visible in the record rather than merely avoided"
  - "Positive controls are run in band where possible — for F15-B/C the control targeted condensationType at condenser.ts:204, one line from the regression, which localises the blindness to the arguments field instead of merely proving liveness"
  - "Overturned predictions are recorded in § 8.2 unrewritten, in both directions: F16's injection A (predicted PASS, observed FAIL) and F15-C's viz test (predicted FAIL, observed PASS)"

patterns-established:
  - "IN-BAND POSITIVE CONTROL: for a green injection run, break a sibling property of the same statement and observe the expected red; establishes liveness, field-specificity and the absence of a stale build in one run"
  - "TWO-INJECTION RECORD: when the audit's literal regression removes the category, record it in full as injection A with its overturn, then record the category-preserving redesign as injection B and take the verdict from B — never retry until green without recording the first attempt"
  - "§ 8 append-as-you-go: collateral reds, overturned predictions and rejected designs are appended by the plan that produced them rather than deferred to the synthesis plan"

requirements-completed: []

coverage:
  - id: D1
    description: "F16 and F20-6 carry complete, observation-backed verdicts; F20-6's record shows the message swap and names the rejected removal design"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "cd packages/argument-condensation && npx vitest run tests/unit/planValidation.test.ts tests/unit/handleQuestion.test.ts"
        expected: "Tests 11 passed"
        result: pass
  - id: D2
    description: "F15-B and F15-C carry complete verdicts from one shared injection, with collateral recorded and excluded"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "cd packages/argument-condensation && npx vitest run tests/condensation/condenserStandalone.test.ts tests/condensation/condenseQuestions.test.ts"
        expected: "3 passed and 5 passed after revert"
        result: pass
  - id: D3
    description: "The source tree is byte-identical to HEAD; no injected regression survived its HYGIENE-LOOP iteration"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "git status --porcelain -- apps tests packages && grep -rn 'INJECTED (139)' apps packages tests"
        expected: "both empty"
        result: pass

metrics:
  duration: "~25 minutes"
  completed: 2026-08-14

status: complete
---

# Phase 139 Plan 02: The `argument-condensation` Findings Summary

Four of the fifteen findings — F15-B, F15-C, F16 and F20-6 — taken through the HYGIENE-LOOP against the live tree and all four **confirmed**, with the audit's own F16 regression refuted by execution and replaced.

## What was done

Four verdict records filled in `139-VERDICTS.md` (§§ 5.2, 5.3, 5.4, 5.15), four rows of the § 4 summary table updated, and § 8 opened with the collateral, overturned-prediction and rejected-design entries this plan produced. Five injections were applied and reverted across three source files; the tree is byte-identical to HEAD.

| # | Finding | Injection | Site outcome | Verdict |
|---|---|---|---|---|
| 4 | F16 | `api.ts:118-122` — language check deleted (**A**, the audit's own) | **FAIL** (red) — prediction overturned | — |
| 4 | F16 | `api.ts:119-121` — message swapped, guard kept (**B**) | **PASS** (blind) | **confirmed** |
| 15 | F20-6 | `planValidation.ts:169` — message swapped, throw kept | **PASS** (blind) | **confirmed** |
| 2 | F15-B | `condenser.ts:205` — `arguments: []` (shared) | **PASS** (blind), 3/3 green | **confirmed** |
| 3 | F15-C | `condenser.ts:205` — same shared edit | **PASS** (blind), 5/5 green | **confirmed** |
| — | positive control | `condenser.ts:204` — `condensationType` sentinel | **5 of 8 red** (expected) | n/a — control |

## The finding that changed the plan

**The audit's own named regression for F16 is false, and the run proved it.** The audit states: *"Delete the language check entirely and this test still passes."* Applied verbatim, the test went **red** — `promise resolved "[]" instead of rejecting`.

The audit's mechanism is what fails. It claims *"at least three independent paths to a throw before language validation is reached"*, resting on the empty `entities` array and a mock provider that throws from every method. In fact there are **zero**: `getAndSliceComments` guards each group push with `.length > 0` (`getAndSliceComments.ts:143-149`), so empty entities yield no comment groups; `handleBooleanQuestion`'s `for (const group of commentGroups)` loop never executes (`question-handlers.ts:30`); `runSingleCondensation`, `createCondensationSteps` and every mock method are unreachable. The proven throw at `defineCondensationPlan.test.ts:71` is real but off this path, and the mock the finding is *titled* for is inert.

This mattered because a careless application of ROADMAP criterion 2 ("a finding that reads blind but fails correctly is withdrawn") would have **withdrawn F16 on that red**. The phase's own apparatus settles it in advance: § 3.4 and RESEARCH Pitfall 2 both state that an injection which removes the *category* of the behaviour rather than varying the *detail the matcher cannot see* is a design smell, not grounds for withdrawal. A second injection — keeping the guard and its triggering condition, changing only the thrown message — passed blind, confirming the defect the title actually names: a bare `.rejects.toThrow()` under a title promising *"for an unsupported language"* verifies *that* the promise rejected, never *why*.

The practical consequence is recorded in § 5.4.6: **Phase 142 must not use the audit's sentence as its negative control.** It reds before and after any fix, so the remediation would have been unverifiable. § 5.4.6 supplies the message-swap diff instead.

This is the same trap as F20-6, reached from the opposite direction — there the removal injection was foreseen and rejected in writing before it ran; here it was prescribed by the plan, run, and had to be corrected after the fact.

## Evidence highlights

**F20-6 — the trap avoided as designed.** The message swap at `planValidation.ts:169` substitutes a genuinely different invariant's live message (`'refine can only be followed by ground'`, from `planValidation.ts:110`). The site at `:104` stayed green; the sibling at `:89-97`, which pins its message, went red. One injection, one code path, one difference between them: the presence of a matcher. The file's convention was counted rather than trusted — 10 tests, 2 `.not.toThrow()`, **7 message matchers, 1 bare**, exactly as the audit claims.

**F15-B/C — an in-band positive control.** Both runs were green, so a control was needed to distinguish blindness from a no-op injection. Rather than probe out of band, the control broke `condensationType` at `condenser.ts:204` — a sibling property of the *same return literal* — and **5 of 8 tests went red**. That establishes in one run that the return block executes in both files' module graph, that these tests do red when a field they read changes, and that the blindness is therefore specific to the `arguments` property.

The audit's core F15-B claim was re-verified by enumeration: `grep -n 'arguments'` over the whole 222-line file returns three hits, none an assertion (two mock fixtures and the word inside a `reasoning` string). The same check on `condenseQuestions.test.ts` finds argument references only in fixtures and in three test *titles* — in a file where every test is named *"It should condense arguments for …"*.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Evidence contradicts plan] F16's prescribed injection was overturned; a second injection was designed and run**
- **Found during:** Task 1
- **Issue:** The plan (and `139-RESEARCH.md:534-541`) predicted PASS for the language-check deletion and pre-wrote a confirmed-shaped narrative around it. The run returned FAIL. Recording only that run would have forced either a spurious withdrawal or an unsupported verdict.
- **Fix:** Recorded injection A's overturn verbatim and unrewritten (§ 8.2, O-1), traced the mechanism against the live source, then designed injection B per the § 3.4 rule with its PASS prediction fixed **before** it ran. The verdict rests on B; A is recorded in full alongside it. § 5.4.6 now names B's diff as Phase 142's negative control instead of the audit's sentence.
- **Files modified:** `139-VERDICTS.md` (§§ 5.4, 8.2), `.planning/STATE.md` (decision)
- **Commit:** `7f00dd6e5`

**2. [Rule 2 — Missing critical evidence] Added an in-band positive control for the F15-B/C injection**
- **Found during:** Task 2
- **Issue:** The plan specified no positive control for F15-B/C, but both runs came back green. Two green runs alone cannot distinguish "the assertion is blind" from "the injection never took effect" — the wave-1 carry-forward names this explicitly.
- **Fix:** Ran a separate HYGIENE-LOOP iteration with a control injection at `condenser.ts:204` (`condensationType` → sentinel). 5 of 8 tests red, as expected. Recorded in § 5.2.4 and cross-referenced from § 5.3.4, clearly labelled as a control and not a regression candidate.
- **Files modified:** `139-VERDICTS.md` (§§ 5.2.4, 5.3.4)
- **Commit:** `a36b5c337`

**3. [Rule 2 — Missing structure] Opened § 8 rather than leaving it to plan 06**
- **Found during:** Task 1
- **Issue:** § 8 was stubbed as "filled by plan 06", but this plan's acceptance criteria require collateral output to be recorded in § 8 now.
- **Fix:** Gave § 8 three subsections (8.1 collateral reds, 8.2 overturned predictions, 8.3 rejected injection designs) with an explicit note that plan 06 writes the synthesis and plans append entries as they run. Plans 03-07 now have a place to write to.
- **Files modified:** `139-VERDICTS.md` (§ 8)
- **Commit:** `7f00dd6e5`

**4. [Carry-forward from 139-01] `requirements mark-complete ASSERT-01` deliberately not run**
- **Issue:** The standard state-update step would flip ASSERT-01 to complete. It is not — 6 of 15 findings carry verdicts. Plan 07 owns real completion.
- **Fix:** Skipped the call. Updated the REQUIREMENTS.md traceability row from "2 of 15 findings verdicted" to "6 of 15 findings verdicted — 139-01, 139-02; plans 03-07 outstanding". The checkbox stays unchecked.
- **Files modified:** `.planning/REQUIREMENTS.md`

### Divergences recorded, not fixed

**F15-C's visualization test was predicted to red and did not** (§ 8.2, O-2). `139-RESEARCH.md:505-510` predicted 4/5; the file went 5/5. The cause is an ordering detail: `setFinalArguments` runs at `condenser.ts:195` and the tree is written at `:198-199`, both **before** the `return` at `:202` that the injection edits — so the serialized tree keeps the real arguments while the caller gets none. Per § 3.4 the prediction is recorded as overturned rather than adjusted. This **strengthens** F15-C: not even the test reading the pipeline's own serialized output can see a `Condenser.run()` that returns nothing.

## Audit line drifts recorded

| Finding | Audit cite | Actual | Drift |
|---|---|---|---|
| F16 | mock provider "lines 19-26" | `:19-27` | +1 |
| F16 | empty `entities` "line 53" | `:54` | +1 |
| F15-B | `:130-141` | `:131-142` (`:130`/`:141` are comments) | +1 |
| F15-B | `:181-183` | `:184-185` | **+3 — largest in the corpus** |
| F15-C | `:139-145`, `:215-219`, `:268-274` | exact | none |
| F20-6 | `:104` | exact | none |

## Hygiene

Five injections, five complete HYGIENE-LOOP iterations, never two live at once. Every vitest invocation ran from inside `packages/argument-condensation` so `Condenser.run()`'s operation-tree write landed in the package's own gitignored `data/operationTrees/`. All logs were written to `${TMPDIR}/gsd-139/`, outside the repository. No `yarn dev`, no `yarn test:e2e`, no Playwright command ran at any point. No `test:unit` script was added and neither `turbo.json` nor `vitest.workspace.ts` was touched (D-05).

Final state: `git status --porcelain -- apps tests packages` is empty; `grep -rn 'INJECTED (139)' apps packages tests` finds nothing; baselines restored at 11, 3 and 5 passed.

## Known Stubs

None. This plan ships no product code — the three source files it touched are revert-scoped and are byte-identical to HEAD.

Nine of the fifteen verdict placeholders remain, by design; they belong to plans 03-07.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change was introduced — every source edit was reverted within its own task. The two `mitigate` dispositions in the plan's threat register (T-139-03, the input-validation removal in `api.ts`; T-139-05, the working tree across injection windows) were discharged by the per-iteration revert and the three-part post-gate, both verified after every iteration.

## Self-Check: PASSED

- `139-VERDICTS.md` exists and contains `### 5.15 F20-6` — FOUND
- §§ 5.2, 5.3, 5.4, 5.15 carry no `not yet run` placeholder; exactly 9 remain file-wide — VERIFIED
- § 4 rows 2, 3, 4, 15 contain no `pending` — VERIFIED
- Commit `7f00dd6e5` — FOUND
- Commit `a36b5c337` — FOUND
- `git status --porcelain -- apps tests packages` empty — VERIFIED
- `grep -rn 'INJECTED (139)' apps packages tests` finds nothing — VERIFIED

---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 03
subsystem: testing
tags: [vitest, assertion-quality, negative-control, audit-verification, question-info, data, injection-testing, un-injectable]

# Dependency graph
requires:
  - phase: 139-01
    provides: "139-VERDICTS.md §§ 1-4 — the HYGIENE-LOOP, the TWO-COLUMN RULE, the COLLATERAL RULE, the 15-row enumeration and the prediction-calibration clause, applied here by name"
  - phase: 139-02
    provides: "the IN-BAND POSITIVE CONTROL pattern, the § 8.3 rejected-design ledger, and the precedent that a rejected injection design is recorded rather than silently swapped"
provides:
  - "F15-A verdict: confirmed on TWO independent grounds — a proof that the audit's own named regression is un-injectable (scope grep exits 1), plus an executed substitute injection at infoGeneration.ts:76"
  - "The audit's description of questionTypes.test.ts:535-537 corrected on the record: exact string equalities, not toBeDefined() variations — still mock-in/mock-out, so the finding's substance survives"
  - "An unlisted eleventh F15-A site recorded: toHaveLength(3) at questionTypes.test.ts:388"
  - "F20-5 verdict: confirmed, backed by TWO injections (vacuity at variants.ts:94, wrong ID at :100) under one verdict, with two pre-specified regressions for Phase 142"
  - "Two more in-band positive controls, one per finding, both localising blindness to a value rather than a presence"
  - "§ 8.3 entries R-2 through R-5 — the un-injectable original, the considered-and-not-used responseTransformer bypass, and the two controls disqualified as negative controls"
affects: [139-04, 139-05, 139-06, 139-07, phase-142, ASSERT-07-scope]

# Actuals (#2632)
actuals:
  tokens: 31000
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Un-injectability as primary evidence: where the behaviour a finding proposes deleting does not exist in the source, the grep's exit=1 is stronger evidence for the finding than any injection, and the injection is substituted with the substitution recorded prominently"
    - "In-band positive control on the KEY vs the VALUE: rename the key (runtime-visible) where the regression empties the value (runtime-invisible), and the same object literal produces 7/7 red and 7/7 green one line apart"
    - "In-band positive control that makes a VACUOUS pass interpretable: undefined-ing the asserted property proves the loop body executes on real data, without which 'return [] → 1 passed' is indistinguishable from a test that never asserted"
    - "Two injections, two blind spots, one verdict: separate HYGIENE-LOOP iterations, separate observed rows, one verdict paragraph stating which observation supports which claim"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-03-SUMMARY.md
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
    - .planning/REQUIREMENTS.md
  transient-injected-and-reverted:
    - packages/question-info/src/core/infoGeneration.ts
    - packages/data/src/objects/nominations/variants/variants.ts

key-decisions:
  - "F15-A's verdict rests on two grounds rather than one, because the audit's named regression turned out to be un-injectable — packages/question-info/src/ contains zero references to question.type, QUESTION_TYPE or choices, so question type is ALREADY ignored by the shipped code and there is no delta to apply"
  - "The substitution (question: question.name → question: '') is labelled as a substitute in § 5.1.2's own callout box, with the un-injectability grep pasted in § 5.1.1 and the considered-and-not-used alternative recorded, so Phase 142 inherits the substitution rather than rediscovering the dead end"
  - "The audit's description of :535-537 is corrected without withdrawing the finding: they are exact toBe string equalities (the strongest matcher in the file), but the strings are what the test fed the mock 32-78 lines earlier, so the tautology is a different defect from the one described and the same one the heading names"
  - "F20-5 carries two injections under one verdict rather than two verdicts, because the audit names two blind spots on one row; § 5.14.4 keeps them as separate labelled sub-blocks so the two PASSes are not read as the same fact"
  - "The F20-5 control (electionId: undefined) was run specifically to make injection A's green interpretable — a vacuous pass and a never-ran test are observationally identical without it"
  - "requirements mark-complete ASSERT-01 deliberately NOT run — 8 of 15 findings carry verdicts; plan 07 owns real completion"

patterns-established:
  - "UN-INJECTABILITY PROOF: where a finding's named regression cannot be applied, paste the grep INCLUDING its exit status as the primary evidence, state the conclusion plainly, and substitute a live regression with the substitution flagged in a callout rather than a footnote"
  - "KEY-vs-VALUE CONTROL: for a suite that guards the presence of a field but not its content, the control renames the key while the regression empties the value — one line apart in the same literal, opposite outcomes, and the blindness is localised to the value in a single run"
  - "VACUITY CONTROL: a return-[] injection's green is only interpretable alongside a control proving the loop body executes on non-empty real data; the control's stack trace showing the failure INSIDE the forEach callback is the evidence"

requirements-completed: []

coverage:
  - id: D1
    description: "F15-A carries a complete verdict resting on both the un-injectability proof and the substituted injection's observed outcome, with the substitution and the audit's corrected description on the record"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "cd packages/question-info && npx vitest run tests/questionTypes.test.ts"
        expected: "Tests 7 passed after the revert"
        result: pass
      - kind: automated
        command: "grep -rnE 'question\\.type|QUESTION_TYPE|choices' packages/question-info/src/ ; echo exit=$?"
        expected: "no output, exit=1 — the audit's named regression has no injectable delta"
        result: pass
  - id: D2
    description: "F20-5 carries a complete verdict backed by two observed injections with two pre-specified regressions"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "cd packages/data && npx vitest run src/objects/nominations/variants/variants.test.ts"
        expected: "Tests 1 passed after both reverts"
        result: pass
  - id: D3
    description: "The source tree is byte-identical to HEAD; no injected regression outlived its own HYGIENE-LOOP iteration"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "git status --porcelain -- apps tests packages && grep -rn 'INJECTED (139)' apps packages tests"
        expected: "both empty"
        result: pass
  - id: D4
    description: "The question-info tests were run ad hoc and in-package; no wiring was changed (D-05)"
    requirement: "ASSERT-01"
    verification:
      - kind: automated
        command: "grep -q '\"test:unit\"' packages/question-info/package.json ; git status --porcelain -- packages/question-info/package.json turbo.json vitest.workspace.ts"
        expected: "no test:unit script; porcelain empty"
        result: pass

metrics:
  duration: "~20 minutes"
  completed: 2026-08-14

status: complete
---

# Phase 139 Plan 03: F15-A and F20-5 — the phase's first trap Summary

Two more of the fifteen findings taken through the HYGIENE-LOOP and both **confirmed** — F15-A on two independent grounds after its named regression proved un-injectable, F20-5 on two injections against a twelve-line test file.

## What was done

Two verdict records filled in `139-VERDICTS.md` (§§ 5.1 and 5.14), two rows of the § 4 summary table updated, and four entries appended to § 8.3. Five injections were applied and reverted across two source files (two regressions, two controls, one un-run design recorded); the tree is byte-identical to HEAD. Seven of the fifteen placeholders remain, by design.

| # | Finding | Injection | Site outcome | Verdict |
|---|---|---|---|---|
| 1 | F15-A | *the audit's own — "ignore question type"* | **UN-INJECTABLE** (grep exits 1) | — |
| 1 | F15-A | `infoGeneration.ts:76` — `question: ''` (**substitute**) | **PASS** (blind), 7/7 green | **confirmed** |
| — | positive control | `infoGeneration.ts:77` — `generalInstructions` key renamed | **7 of 7 red** (expected) | n/a — control |
| 14 | F20-5 | `variants.ts:94` — `return []` (**A**, vacuity) | **PASS** (vacuous), 1/1 green | **confirmed** |
| 14 | F20-5 | `variants.ts:100` — `'WRONG-ELECTION-ID'` (**B**, wrong ID) | **PASS** (blind), 1/1 green | **confirmed** |
| — | positive control | `variants.ts:100` — `electionId: undefined` | **red at `:9`** (expected) | n/a — control |

## The trap, and how the record handles it

**The audit's named F15-A regression cannot be applied, because the code already does it.** The audit predicted that *"a `generateQuestionInfo` that ignored question type entirely … keeps all 540 lines green"*. Run against the live tree:

```console
$ grep -rnE 'question\.type|QUESTION_TYPE|choices' packages/question-info/src/ ; echo "exit=$?"
exit=1
```

Zero hits. The prompt at `infoGeneration.ts:75-82` is built from `question.name` plus five fixed instruction constants; the only branch downstream is on `promptKey` — the *operation* requested — never on the question's type. **The audit's hypothetical is the production reality.** The test file's three top-level `describe` blocks (`Configuration 1: Boolean Questions` / `2: Ordinal` / `3: Categorical`) are answering a distinction the implementation never draws.

This is the shape plan 02 met twice from the opposite direction. There, the audit's injection removed the *category* and reddened the test; here it removes nothing at all. In both cases the response is the same one § 3.4 fixes in advance: record the dead end, substitute a correctly-scoped injection, and take the verdict from the substitute. § 5.1.2 opens with a callout box labelling the substitution, § 5.1.1 pastes the grep including its exit status, § 8.3 gains R-2 (the un-injectable original) and R-3 (the `responseTransformer` bypass, considered and not run for blast radius without discrimination), and plan 06 lifts the substitution into § 7's scope limits.

**Consequence for Phase 142, stated in § 5.1.6:** its negative control must come from that section, never from the audit's sentence — the same conclusion F16 reached in plan 02 for the opposite reason.

## The correction the finding survives

The audit describes the ten F15-A sites as *"all variations of `expect(results[0].data.infoSections).toBeDefined()`"*. Seven are. **`:535`, `:536` and `:537` are not** — they are `toBe` on exact strings, the *strongest* matcher in the file. They are nonetheless mock-in/mock-out: the three strings (`'Tax Policy'`, `'Income Inequality Priority'`, `'Policy Preference Analysis'`) are what the test itself fed to `mockLLMProvider.generateObjectParallel.mockResolvedValue` at `:452`, supplied at `:457`, `:480` and `:503` — 78, 56 and 34 lines earlier. (Research called the gap "about twenty lines"; measured, 32-78. Recorded rather than repeated.)

So the finding's *substance* survives and its *description* does not, and the remediation changes shape: those three lines cannot be fixed by tightening the matcher, only by ceasing to assert on values the test supplied to the mock.

The audit's enumeration also **misses** an eleventh site — `expect(results[0].data.terms).toHaveLength(3);` at `:388` — which widens the finding by one. (The same unlisted pattern recurs at `:140` and `:264`.)

## Evidence highlights

**A key-versus-value control.** Both F15-A runs were green, so a control was required. The regression empties the *value* at `:76`; the control renames the *key* at `:77` — one line apart in the same object literal. `loadPrompt`'s `throwIfVarsMissing: true` at `:98` makes the missing key fatal: **7 of 7 red**, each reporting `[PromptRegistry] Missing required parameters for prompt '<key>': generalInstructions`. One run establishes liveness, that the literal is genuinely consumed, that these tests do red, and — the sharp part — that the suite guards the **presence** of prompt variables and is blind to their **content**. That last sentence is the whole of F15-A.

**A control that makes a vacuous pass interpretable.** F20-5's injection A (`return []`) reported `1 passed`, which is what vacuity looks like — and also exactly what a test that never asserted anything looks like. The control (`electionId: undefined` at `:100`) reds with a stack showing `variants.test.ts:9:26` called from `:8:18` — *inside* the `forEach` callback, reachable only if the array had at least one element. Without that, injection A's green would have been uninterpretable rather than confirmatory.

**Two PASSes that are not the same fact.** § 5.14.4 keeps injections A and B in separate labelled sub-blocks precisely because collapsing them loses the finding: under A the assertions at `:9-10` never ran; under B they ran, evaluated `'WRONG-ELECTION-ID'` and were satisfied by it. Vacuity and blindness are different defects this one matcher exhibits at once, and § 5.14.6 pre-specifies a distinct regression and a distinct remediation target for each — a length guard, and equality assertions on the specific expected ids.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — Missing critical evidence] Added in-band positive controls for both findings**
- **Found during:** Tasks 1 and 2
- **Issue:** The plan specified no positive control for either finding, but all three regression runs came back green. Two green runs alone cannot distinguish "the assertion is blind" from "the injection never took effect" — the wave-1/2 carry-forward names this explicitly, and for F20-5's `return []` the risk is sharper still, since a vacuous pass and a never-executed test are observationally identical.
- **Fix:** Ran a separate HYGIENE-LOOP iteration per finding. F15-A's control renamed the `generalInstructions` key at `infoGeneration.ts:77` (7/7 red); F20-5's set `electionId: undefined` at `variants.ts:100` (red at `:9`, from inside the `forEach`). Both recorded in their `.4` sub-parts, clearly labelled as controls, and both disqualified as Phase 142 negative controls in § 8.3 (R-4, R-5) because they red before *and* after any fix.
- **Files modified:** `139-VERDICTS.md` (§§ 5.1.4, 5.14.4, 8.3)
- **Commits:** `02301b839`, `86f4c8a46`

**2. [Rule 2 — Missing record] Recorded R-2..R-5 in § 8.3 rather than only in the record bodies**
- **Found during:** Tasks 1 and 2
- **Issue:** The plan required the substitution and the considered-and-not-used alternative to appear in § 5.1's body, but plan 02 had established § 8.3 as the cross-plan ledger of rejected designs. Leaving them only in § 5.1 would make plan 06's synthesis miss them.
- **Fix:** Appended four entries — R-2 (the un-injectable original, with the grep and the consequence for Phase 142), R-3 (the `responseTransformer` bypass, not run), R-4 and R-5 (both controls, disqualified as negative controls with their reasons).
- **Files modified:** `139-VERDICTS.md` (§ 8.3)
- **Commits:** `02301b839`, `86f4c8a46`

**3. [Carry-forward from 139-01/139-02] `requirements mark-complete ASSERT-01` deliberately not run**
- **Issue:** The standard state-update step would flip ASSERT-01 to complete. It is not — 8 of 15 findings now carry verdicts. Plan 07 owns real completion.
- **Fix:** Skipped the call. Updated the `REQUIREMENTS.md` traceability row from "6 of 15" to "8 of 15 findings verdicted — 139-01, 139-02, 139-03; plans 04-07 outstanding". The checkbox stays unchecked.
- **Files modified:** `.planning/REQUIREMENTS.md`

### Divergences recorded, not fixed

**None overturned.** All three regression predictions were PASS and all three observed PASS, so § 8.2 gains no entry from this plan. The one prediction that needed adjusting was not an outcome but a *premise*: the plan (following research) expected an injection to be possible for F15-A at all. That is recorded as R-2 in § 8.3 — a rejected design, not an overturned prediction — because no run contradicted it; a grep did.

## Audit and research line drifts recorded

| Finding | Cite source | Cited | Actual | Drift |
|---|---|---|---|---|
| F15-A | audit — all ten assertion lines | `:84,139,199,263,323,387,532,535-537` | exact | **none** |
| F15-A | research — injection target | `infoGeneration.ts:75` | `:76` (`:75` is the literal's opener) | **+1** |
| F15-A | research — mock-feed gap | "about twenty lines" | 32-78 lines (`:457`/`:480`/`:503` → `:535-537`) | description, not a line |
| F20-5 | audit — test file | `variants.test.ts:5-12` | exact | **none** |
| F20-5 | research — function body | `variants.ts:93-101` | function runs to `:107`; injection targets `:94`/`:100` exact | end of range only |

## Hygiene

Five injections, five complete HYGIENE-LOOP iterations, never two live at once. Every vitest invocation ran from inside its own workspace directory. All logs were written to `${TMPDIR}/gsd-139/`, outside the repository. The one out-of-repo `npx tsx` probe attempted (to count the parsed nominations for § 5.14) failed on package-export resolution and was abandoned and deleted; the in-band control already establishes the non-emptiness the probe would have quantified, so no claim in the record depends on it. No `yarn dev`, no `yarn test:e2e`, no Playwright command ran at any point. No `test:unit` script was added to `packages/question-info` or `packages/data`, and neither `turbo.json` nor `vitest.workspace.ts` was touched (D-05).

Final state: `git status --porcelain -- apps tests packages` is empty; `grep -rn 'INJECTED (139)' apps packages tests` finds nothing; baselines restored at 7 passed and 1 passed.

## Known Stubs

None. This plan ships no product code — the two source files it touched are revert-scoped and are byte-identical to HEAD.

Seven of the fifteen verdict placeholders remain, by design; they belong to plans 04-07.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change was introduced — every source edit was reverted within its own task. The plan's three `mitigate` dispositions were discharged: **T-139-05** (the working tree across the injection windows) by one live injection at a time plus the three-part post-gate after each of five iterations; **T-139-12** (`variants.ts` — `parseNominationTree` returning `[]` or a wrong id, consumed by the frontend) by in-task revert with the scoped porcelain and marker grep asserted before task completion; **T-139-14** (an unrecorded substitution in § 5.1) by the callout box in § 5.1.2, the pasted grep in § 5.1.1, the considered-and-not-used alternative, and § 8.3 R-2/R-3. **T-139-13** (`infoGeneration.ts`) was accepted per the register and reverted in-task regardless. **T-139-SC** — no package-manager install ran.

## Self-Check: PASSED

- `139-VERDICTS.md` exists and contains `### 5.1 F15-A` — FOUND
- §§ 5.1 and 5.14 carry no `not yet run` placeholder; exactly 7 remain file-wide — VERIFIED
- § 5.1 carries sub-labels `5.1.1`-`5.1.6`; § 5.14 carries `5.14.1`-`5.14.6` — VERIFIED
- § 4 rows 1 and 14 contain no `pending` — VERIFIED
- § 5.1.5 and § 5.14.5 both end in the literal word `confirmed` — VERIFIED
- Commit `02301b839` — FOUND
- Commit `86f4c8a46` — FOUND
- `cd packages/question-info && npx vitest run tests/questionTypes.test.ts` → `Tests 7 passed` — VERIFIED
- `cd packages/data && npx vitest run src/objects/nominations/variants/variants.test.ts` → `Tests 1 passed` — VERIFIED
- `git status --porcelain -- apps tests packages` empty — VERIFIED
- `grep -rn 'INJECTED (139)' apps packages tests` finds nothing — VERIFIED
- `packages/question-info/package.json` has no `test:unit` script — VERIFIED

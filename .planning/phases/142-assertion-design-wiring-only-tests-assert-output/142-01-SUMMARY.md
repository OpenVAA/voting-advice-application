---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 01
subsystem: testing
tags: [vitest, negative-control, assertion-design, question-info, prompt-composition, product-change, checkpoint]

# Dependency graph
requires:
  - phase: 139-single-source-sweep-findings-confirm-or-withdraw
    provides: 'The substitute injection diff at § 5.1.2, the recorded OLD-half green at § 5.1.4, the three pre-specified regression targets at § 5.1.6, and the prohibitions R-2 / R-3 / R-4 (§ 8.3)'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 03
    provides: 'The 12-row ledger with row 1 created; the inverted HYGIENE-LOOP mechanics; the sibling-ordering, log-path and written-down-twice conventions'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 05
    provides: 'Five carried cautions — a stated colour is a prediction not a fact; commit the durable edit before probing inside the same path; A-08 fixes the internal order for product-fix plans; expect.soft stays unused absent a mechanical reason; R-2 and A-04 bind this plan specifically'
provides:
  - "D-01 landed: question type and choice labels reach the info-generation prompt, so ROADMAP criterion 2 is satisfiable — two questions sharing a name and differing only in type no longer compose byte-identical prompts"
  - 'A boundary guard closing the framework-level hole that made the `required` param declaration weaker than it looks: `throwIfVarsMissing` tests key-PRESENCE, so `questionType: undefined` would have shipped the literal token `undefined` to the LLM'
  - 'F15-A remediated: a call-count-guarded prompt-capture helper, T1, a NEW same-name/varying-type fixture (T2/T3), D-03''s repoint onto the transform''s three renames, and D-05''s sibling at `:388`'
  - 'F15-A ledger row 1 closed with BOTH halves measured this session against the correct trees — OLD pre-fix (green blind, package-wide 20/20), NEW post-fix (red at T1 specifically)'
  - 'The D-03 finding on the record: `responseTransformer.ts:24-51` inspected and found NOT identity, with its three renames named'
  - "D-01's three named scope exclusions recorded in all three places for `142-06` to capture as standing todos"
affects: [142-04, 142-06]

actuals:
  tokens: 21500
  tasks: 4
  commits: 6

tech-stack:
  added: []
  patterns:
    - 'Roll back only the PRODUCT source (`git checkout <pre-fix-sha> -- src/`) while the strengthened test file stays at HEAD — this measures "was this assertion red before the fix?" with the plan''s own fixture instead of citing a research figure'
    - 'When two assertions in one test are sequentially dependent, the second one''s pre-fix colour needs the first transiently muted — otherwise it never executes and its colour is asserted rather than measured'
    - 'Read a runtime hazard through an `unknown` local when the static type declares the field non-nullable: testing it directly narrows the object to `never` and makes the real hazard inexpressible'
    - 'Anchor a guard-message assertion at `^` — that is what proves the message is not re-wrapped by an enclosing catch, and it pins that the failing input is NAMED rather than merely that something threw'
    - '`expect.soft` again NOT used — a fourth consecutive wave. The capture helper''s guard and its dereference are sequentially dependent by construction, which is the same mechanical ground wave 3 recorded'

key-files:
  created: []
  modified:
    - packages/question-info/src/core/infoGeneration.ts
    - packages/question-info/src/prompts/en/generateInfoSections.yaml
    - packages/question-info/src/prompts/en/generateTerms.yaml
    - packages/question-info/src/prompts/en/generateBoth.yaml
    - packages/question-info/tests/questionTypes.test.ts
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "The OLD half's collateral was measured package-wide rather than left at the row's scope, and it changed the finding's size: the WHOLE package (20/20, including `api.test.ts`) passes with the prompt carrying no question at all. 'The package was blind' is a materially stronger and truer statement than 'eleven assertions were blind'"
  - "T2/T3's pre-fix RED was MEASURED with this plan's own fixture (product source rolled back to 68d5669c3, test file left at HEAD) rather than cited from RESEARCH § B.1(c). The plan's own contract is that a stated colour is a prediction; citing would have made the phase's central claim the one unmeasured link"
  - "No consumer site was edited, and the reason is recorded rather than left implicit: `DataRoot` selects a question's constructor BY its type discriminant, so an instance that exists at all necessarily has a valid type. Adding a redundant mapping at the admin call site would have been cargo-cult and would have implied a live DTO path that does not exist"
  - "The D-01 guard was hoisted ABOVE `generateInfo`'s try after operator review: thrown inside, the catch re-wrapped it into `Error generating question info: Error: [question-info] …`. A guard whose message does not say what it means is the shape this phase removes"
  - "139 § 5.1.6's headline target 2 was deliberately NOT written (A-04), and the omission is grep-verifiable: the file's only `not.toBe` is inside the new same-name/varying-type fixture"
  - "D-03 resolved to REPOINT, not delete — `responseTransformer.ts` renames three provider fields. The `questionId` mapping was deliberately not re-asserted, since `:83`/`:322`/`:527-529` already cover it and re-asserting would duplicate rather than repoint"

patterns-established:
  - "A negative-control pair is strongest when both halves are run with the SAME command and the sizes are stated together: 'before, the whole package passed 20/20; after, exactly one assertion fails and nothing else does' is a single sentence carrying both halves"
  - "`git checkout <commit> -- <path>` writes the INDEX as well as the worktree, so a later `git checkout -- <path>` restores the staged (reverted) content, not HEAD. The correct restore is `git checkout HEAD -- <path>`. This is the wave-3 revert trap in a new costume"

requirements-completed: [ASSERT-07]

coverage:
  - id: D1
    description: "D-01 landed minimally — `questionType` and `choices` reach the prompt variables and the three `en/` templates render them, confined to the four named files with `generalInstructions` (R-4's control) byte-unchanged"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/question-info/tests/questionTypes.test.ts#composes different prompts for two questions that share a name and differ only in type'
        status: pass
      - kind: other
        ref: "grep -rnE 'question\\.type|QUESTION_TYPE|choices' packages/question-info/src/ → hits (exited 1 with no output before); git diff --stat shows exactly 4 files; R-4 key byte-unchanged; package green 22/22"
        status: pass
    human_judgment: false
  - id: D2
    description: "The boundary guard closes the key-presence hole: a question arriving without a type throws a named, un-rewrapped error before the provider is reached"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/question-info/tests/questionTypes.test.ts#rejects a question that arrives without a type, naming the question'
        status: pass
      - kind: other
        ref: "Assertion is an anchored regex /^\\[question-info\\] Question 'no-type-1' …/ plus expect(provider).not.toHaveBeenCalled(); measured pre-guard behaviour was the literal token `undefined` rendered under its own prompt heading"
        status: pass
    human_judgment: false
  - id: D3
    description: "F15-A's OLD half re-run against the pre-fix tree (D-06 exception) — all eleven assertions green blind, and the whole package green 20/20"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: '${TMPDIR}/gsd-142/F15-A-OLD-1.log — exit 0, Tests 7 passed (7); F15-A-OLD-collateral-1.log — exit 0, Tests 20 passed (20); test file verified byte-identical to HEAD before injecting'
        status: pass
    human_judgment: false
  - id: D4
    description: "F15-A's NEW half red on the named axis — T1 specifically, with T2/T3 green under the injection exactly as predicted in advance"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "${TMPDIR}/gsd-142/F15-A-NEW-1.log — exit 1, AssertionError at questionTypes.test.ts:113:36 'expected … to contain Do you support universal healthcare?', Tests 1 failed | 8 passed (9); collateral package-wide 1 failed | 21 passed (22)"
        status: pass
    human_judgment: false
  - id: D5
    description: "T2 and T3 measured RED on the pre-fix tree with this plan's own fixture and GREEN after the fix"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: '${TMPDIR}/gsd-142/F15-A-T2T3-prefix.log — exit 1 at :646:33, byte-identical prompts; F15-A-T3-prefix.log — exit 1, "expected … to contain Yes, lower it to 16"; both green at HEAD (22/22)'
        status: pass
    human_judgment: false
  - id: D6
    description: "D-03's repoint onto the transform's three renames, D-05's sibling at :388, and A-04's prohibition all discharged and independently checkable"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "questionTypes.test.ts:580-582 assert processingTimeMs / nLlmCalls / modelsUsed with the E9 distinction stated inline; :388 block paired with choice-label assertions; exactly 1 not.toBe in the file, inside the new fixture"
        status: pass
    human_judgment: false
  - id: D7
    description: "Injection hygiene held across both loop iterations, and nothing cross-workspace broke"
    requirement: ASSERT-07
    verification:
      - kind: integration
        ref: 'root yarn test:unit → 25/25 tasks successful, exit 0 (frontend 773 tests, question-info 22)'
        status: pass
      - kind: other
        ref: "git status --porcelain -- apps tests packages → empty; grep -rn 'INJECTED (142)' apps packages tests → no hits; three-condition post-gate passed after each injection; git diff --exit-code HEAD -- packages/question-info → 0"
        status: pass
    human_judgment: false

duration: 31 min
completed: 2026-08-21
status: complete
---

# Phase 142 Plan 01: F15-A + D-01's `question-info` Product Fix Summary

**Measured F15-A's blindness as broader than the audit claimed — the whole `question-info` package passes 20/20 with the prompt carrying no question at all — then landed D-01 so question type and choice labels reach the prompt, closed the framework-level `required`-param hole that would have let `undefined` ship to the LLM, and drove the strengthened file red on exactly one named axis while the two criterion-2 assertions it does not touch stayed green.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-08-20T19:26Z
- **Completed:** 2026-08-21T05:57Z (elapsed working time 31 min; the gap is the operator checkpoint)
- **Tasks:** 4 of 4
- **Files modified:** 8 (4 product, 1 test, 3 records)

## The checkpoint decision, verbatim

Task 2 stopped and returned the decision. The operator replied:

> **approve**
>
> 1. **Land parts 1 and 2 exactly as described.** The three gaps in (d) are captured as standing todos for `142-06` under D-19 iii — not absorbed. D-01's scope stays as locked: question type + choice labels reach the prompt variables, no feature redesign.
> 2. **`questionType` stays a REQUIRED param.** … a silent empty type string is the exact failure this phase exists to make impossible, and a loud immediate throw that reds all 20 package tests is the correct failure mode. Optional's auto-fill would reintroduce the silent-degradation shape we are removing.

No file under `apps/` or `packages/` was modified during Task 2 (`changed_paths=0`).

## Accomplishments

- **The OLD half is a measurement, not a citation — and it came back larger than the row's scope.** Injected at HEAD `68d5669c3` with the test file verified byte-identical to HEAD first, all eleven assertions passed blind with the question emptied (`Tests 7 passed (7)`, exit 0). Then the collateral run: the **whole package**, `api.test.ts` included, is green **20/20** under the same injection. 139 § 5.1.4's value was *reproduced* (7/7, no divergence), not borrowed.
- **D-01 landed in four files and nothing else.** `questionType` and `choices` joined the prompt-variables literal; the three `en/` YAMLs gained the params and — the load-bearing half — the **placeholders**. `git diff --stat` confirms `responseTransformer.ts`, `api.ts`, `determinePrompt.ts` and `schemaGenerator.ts` are untouched, and `generalInstructions` (R-4's in-band positive control, two lines from the edit) is byte-unchanged.
- **The `required` declaration turned out to be weaker than it looks, and the guard closes it.** `promptRegistry.ts:352` is `!(param in variables)` — key-**presence**, not value-definedness — so `questionType: undefined` satisfies it, and `setPromptVars.ts:54` then interpolates `String(undefined)`. Measured before the guard existed: the composed prompt read `## The question's type:\nundefined`. That is silent degradation wearing the costume of a loud guard, and it is now a named throw at the package boundary.
- **The NEW half red is on the axis named in advance.** `questionTypes.test.ts:113:36`, `expected '…' to contain 'Do you support universal healthcare?'`, exit 1, `Tests 1 failed | 8 passed (9)`. **T2 and T3 stayed green under the injection** — emptying the question *name* leaves types and choices differing — exactly as the plan predicted, so the ledger names T1 rather than recording an anonymous red.
- **T2/T3's pre-fix RED was measured with this plan's own fixture.** Product source rolled back to `68d5669c3` with the strengthened test file left at HEAD: T2 red at `:646:33` (`not to be` — byte-identical prompts), T3 red on the choice label. Both green at HEAD.
- **A-04's trap avoided and the avoidance is checkable.** The file's only `not.toBe` is inside the new same-name/varying-type fixture. 139 § 5.1.6's pairwise comparison of the three differently-named Configuration blocks — which passes today for the wrong reason — is nowhere in the tree.
- **D-03 resolved to repoint, on evidence.** `responseTransformer.ts:24-51` renames `latencyMs → processingTimeMs`, `attempts → nLlmCalls`, `response.modelId → metadata.modelsUsed[0]`. None was asserted anywhere. The `:535-537` tautology now asserts exactly those three, with the E9 distinction stated inline so a later reader does not delete them as wall-clock decoration.
- **Root `yarn test:unit` green**: 25/25 tasks, exit 0, with the frontend's 773 tests unaffected.

## Why no consumer site was edited

Recorded deliberately, so a later reader does not "notice the gap" and add a redundant mapping.

There is exactly **one** production call site — `apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts:126`. Its questions come from `loadElectionData` → `new DataRoot()` → `getQuestion` / `findQuestions`, which return stored **`Question` subclass instances**. `+page.server.ts` imports only the `QUESTION_INFO_OPERATION` const and passes ids, never question objects.

The structural reason `type` cannot be absent there is worth keeping: `DataRoot` selects a question's **constructor by its type discriminant**, so an instance that exists at all necessarily has a valid type — a bad type fails during `DataRoot` population, long before `infoGeneration.ts` runs. Behind that sit a `NOT NULL` enum column and an adapter that assigns `type` explicitly after the spread.

So the hole the guard closes is **real at the framework level and unreachable from production today**. The guard belongs at the package boundary regardless; a mapping at the consumer would imply a live DTO path that does not exist.

## Task Commits

1. **Task 1: OLD half** — `d4e0cbe3f` (docs, ledger row 1 OLD half)
2. **Task 2: CHECKPOINT** — no commit by construction; decision recorded above
3. **Task 3: D-01 product fix** — `0bc21e3b3` (feat) + `0b15c5e86` (fix — the guard hoist, from operator review)
4. **Task 4: assertion strengthening + NEW half** — `0d3700e58` (test) + `80acc432c` (test, comment reword) + `98ff18f86` (docs, ledger row 1 NEW half + deferrals)

Product and test commits are separate, so the two revert independently. Every durable edit was committed **before** the injection that measured it.

## Deviations from Plan

**1. [Rule 2 — missing critical functionality, operator-directed] The boundary guard for an absent question type**

- **Found during:** Task 3, on operator review of the approved diff.
- **Issue:** `questionType` as a `required` param is not the loud guard it appears to be. `promptRegistry.ts:352` and `setPromptVars.ts:60` both test key-**presence**, so `questionType: undefined` passes and `String(undefined)` is interpolated into the shipped prompt. Measured before the fix: `## The question's type:\nundefined`.
- **Fix:** a named throw at the package boundary, plus a test proving it. Verified by probe, not assumed.
- **Files modified:** `packages/question-info/src/core/infoGeneration.ts`, `packages/question-info/tests/questionTypes.test.ts`.
- **Committed in:** `0bc21e3b3`, `0b15c5e86`, `0d3700e58`

**2. [Rule 1 — bug in my own Task 3 change] The guard's message was double-prefixed**

- **Found during:** operator review of `0bc21e3b3`.
- **Issue:** the guard threw inside `generateInfo`'s `try`, whose catch re-wraps everything as `Error generating question info: Error: [question-info] …`.
- **Fix:** hoisted the guard above the `try`. The test assertion is an **anchored** regex, so the anchoring itself proves the message arrives intact.
- **Committed in:** `0b15c5e86`

**3. [Improvement over the plan's minimum] T2/T3's pre-fix colour measured rather than cited**

- **Found during:** Task 4, Step 3.
- **Issue:** the plan says T2/T3 "were measured RED on the pre-D-01 tree", citing RESEARCH § B.1(c). But that measurement used *research's* fixture; mine is a different fixture with different strings. Citing would have left the phase's central claim — "these assertions were red before the fix" — as the one unmeasured link.
- **Fix:** rolled the product source back to `68d5669c3` with the test file at HEAD and measured both. T3 additionally needed T2 transiently muted, since T2 fails first and T3 would otherwise never execute.
- **Verification:** `F15-A-T2T3-prefix.log`, `F15-A-T3-prefix.log`; mute reverted and file re-verified byte-identical to HEAD.

**4. [Forced by an acceptance criterion] Comment wording in the capture helper**

- **Found during:** Task 4 criteria check.
- **Issue:** the criterion requires `toHaveBeenCalledTimes` to appear *before* the first `mock.calls` in the file. The executable ordering was already correct (`:40` guard, `:41` dereference), but the guard's rationale comment named the token literally at `:37`, so the grep read the comment first. Same class as wave 2's and wave 3's deviation 3.
- **Fix:** reworded to "the provider's recorded call". Reasoning unchanged; the literal check now measures the assertion.
- **Committed in:** `80acc432c`

**5. [Improvement over the plan's minimum] OLD-half collateral measured package-wide**

- **Found during:** Task 1.
- **Issue:** the plan asked only for the file outcome. A file-scoped result cannot say whether the blindness extends past the eleven named sites.
- **Fix:** ran the whole package under the live injection: **20/20 green**. Operator confirmed this belongs in the phase record.

---

**Total deviations:** 5 (1 operator-directed missing-critical, 1 bug in my own change, 2 improvements over the plan's minimum, 1 forced by a literal acceptance criterion).
**Impact:** No scope creep beyond what the operator directed. No assertion was weakened; no injection was redesigned; no package installed. Deviations 3 and 5 changed how outcomes were *measured*, never what was asserted.

## Issues Encountered

**None that blocked the plan.** Three observations recorded honestly:

1. **`git checkout <commit> -- <path>` writes the INDEX as well as the worktree.** After rolling the product source back to `68d5669c3` for the T2/T3 probe, the obvious restore (`git checkout -- <path>`) restored from the *index*, i.e. the reverted content — leaving the pre-fix source in place and the suite red 3/22. The correct restore is `git checkout HEAD -- <path>`. This is wave 3's revert trap in a new costume, and it was caught by the suite rather than by the porcelain check, which showed the paths as *staged* rather than dirty.
2. **The plan's `:439` anchor for the "Mixed Question Type Scenarios" block has drifted** — the block is at `:392` at this HEAD. Consistent with A-01's locate-by-content rule; no impact.
3. **`packages/question-info` passes `tsc --noEmit`, `eslint` and `prettier --check`** over every edited file. No pre-existing failure was found or absorbed. `grep -c ': any'` is 0 before and after; the one pre-existing `as any` at `:17` is untouched.

## Deferred Items

**Three new, all deliberate scope boundaries rather than defects found in passing** — D-01's named exclusions, approved as deferrals at the checkpoint and recorded in all three places (ledger § Deferred product findings, `deferred-items.md`, `.planning/WINDOWS.md` rows 42/43/44). `142-06` captures them via `/gsd-capture` per D-19 iii:

- **D-01-i** — the question's own `info` text still never reaches the prompt (measured `false`).
- **D-01-ii** — `questionType` reaches the prompt as its **raw** discriminant string, not human-readable or localised; the prompt tree has only an `en/` directory, so a localised label needs a locale-aware tree first.
- **D-01-iii** — a 5-point and a 7-point ordinal are both `singleChoiceOrdinal`. Substantially mitigated: the new `choices` variable supplies the discriminating information. The residual is that scale *semantics* stay implicit.

Wave 2's **P-1** remains open; nothing here touches it.

## Evidence — run logs (outside the repository, per D-07)

Resolved `$TMPDIR`: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/`. HEAD at plan open: `68d5669c3`.

| Log | Purpose | Result |
| --- | --- | --- |
| `F15-A-OLD-0-cleantree.log` | Pre-injection baseline, untouched tree | `7 passed (7)`, exit 0 |
| `F15-A-OLD-1.log` | **OLD half — the GREEN** (blindness) | `7 passed (7)`, exit 0 |
| `F15-A-OLD-collateral-1.log` | OLD half, package-wide | `20 passed (20)`, exit 0 — the whole package is blind |
| `F15-A-OLD-postrevert.log` | Post-revert | `20 passed (20)`, exit 0 |
| `F15-A-D01-postfix.log` | Package suite after the product fix | `20 passed (20)`, exit 0 |
| `F15-A-T2T3-prefix.log` | **T2 pre-fix RED** (src at `68d5669c3`, tests at HEAD) | exit 1, `:646:33`, prompts byte-identical |
| `F15-A-T3-prefix.log` | **T3 pre-fix RED** (T2 transiently muted) | exit 1, `to contain 'Yes, lower it to 16'` |
| `F15-A-NEW-0-cleantree.log` | Strengthened file, clean post-fix tree | `22 passed (22)`, exit 0 |
| `F15-A-NEW-1.log` | **NEW half — the RED at T1** | exit 1, `:113:36`, `1 failed \| 8 passed (9)` |
| `F15-A-NEW-collateral-1.log` | NEW half, package-wide | `1 failed \| 21 passed (22)`, exit 1 |
| `F15-A-NEW-postrevert.log` | Post-revert | `22 passed (22)`, exit 0 |
| `F15-A-root-testunit.log` | Root `yarn test:unit`, all workspaces | 25/25 tasks, exit 0 |

## Plan Verification

| Check | Result |
| --- | --- |
| `git status --porcelain -- apps tests packages` at plan close | **empty** |
| `grep -rn 'INJECTED (142)' apps packages tests` at plan close | **no hits** |
| `yarn workspace @openvaa/question-info test:unit` | **exit 0** — 22 tests |
| `grep -rnE 'question\.type\|QUESTION_TYPE\|choices' packages/question-info/src/` | **returns hits** (exited 1 with no output before) |
| Ledger row 1 has no `pending` cells | **pass** (0 in the register line and the row section) |
| Row 1's OLD half is a measurement taken this session | **pass** — `re-run`, with this session's log path |
| Row 1's NEW half names **T1** specifically | **pass** — `questionTypes.test.ts:113:36` |
| Row 1 cites the product and test commits separately | **pass** |
| D-03 non-identity finding recorded | **pass** — three renames named in ledger and here |
| 139 § 5.1.6's target 2 absent from the test file | **pass** — exactly 1 `not.toBe`, inside the new fixture |
| A-09 guard precedes the first `mock.calls` dereference | **pass** — `:40` before `:41` |
| `git diff --exit-code HEAD -- packages/question-info` | **exit 0** |
| Root `yarn test:unit` | **exit 0** — 25/25 tasks |
| `tsc --noEmit` + `eslint` + `prettier --check` over edited files | **clean** |
| Withdrawal count | **0** — unchanged |

## User Setup Required

None — no external service configuration, no package installed, no network call.

## Next Phase Readiness

**Ready for `142-04` (wave 5: F20-1 + D-02/A-02's endpoint fix, F20-3 + A-07's third product change).** It is also `autonomous: false`, with a **four-part** checkpoint, and it fills rows 7 and 9 — the only rows still carrying `pending` cells.

Cautions to carry forward:

1. **A-08's internal order held and earned its keep.** Re-run the OLD half against the **pre-fix** tree first; after the product change the OLD assertion does not exist to run. `142-04` has the same constraint, sharpened: per A-03 its NEW half also uses a *different* injection (A, not B), because post-fix injection B goes off-path.
2. **`git checkout <commit> -- <path>` stages what it restores.** Use `git checkout HEAD -- <path>` to get back. `142-04` will roll the endpoint back the same way for F20-1's OLD half and will hit this exactly.
3. **A plan's stated colour is still a prediction.** It held here for all four (OLD green, T1 red, T2/T3 red-then-green) — but only because each was measured. Where the plan cites a research figure for a colour, measure it with *your own* fixture; the strings differ.
4. **A `required` param declaration is not a guard.** Key-presence checks pass for `undefined`. If `142-04`'s A-07 error-code change adds a field consumed by a template or a strict validator, check whether its absence is caught by presence or by value.
5. **`expect.soft` remains unused across all four waves.** Declined here on the same mechanical ground as wave 3: the capture helper's guard and its dereference are sequentially dependent by construction.

**No blockers.**

---

_Phase: 142-assertion-design-wiring-only-tests-assert-output_
_Completed: 2026-08-21_

## Self-Check: PASSED

All claims verified against disk and git, not asserted from reasoning:

- **Files** — 9/9 present (4 product, 1 test, 3 records, this SUMMARY).
- **Commits** — 6/6 resolve in `git log --all`: `d4e0cbe3f`, `0bc21e3b3`, `0b15c5e86`, `0d3700e58`, `80acc432c`, `98ff18f86`.
- **Logs** — 12/12 present and non-empty under `${TMPDIR}/gsd-142/`, each the source of the outcome cell that cites it.
- **Tree** — `git status --porcelain -- apps tests packages` empty; no `INJECTED (142)` marker anywhere under `apps packages tests`; `git diff --exit-code HEAD -- packages/question-info` exit 0.
- **Gates** — `question-info` green 22/22 via both `npx vitest run` and the Phase-141 `test:unit` script; root `yarn test:unit` 25/25 tasks exit 0; `tsc --noEmit`, `eslint` and `prettier --check` clean over every edited file.
- **Ledger** — row 1 carries zero `pending` cells in both the register line and the row section; the only remaining `pending` cells belong to rows 7 and 9, which are `142-04`'s.
- **Records** — the three D-01 deferrals appear in all three places: ledger § Deferred product findings, `deferred-items.md`, and `.planning/WINDOWS.md` rows 42/43/44.

Every outcome recorded in this SUMMARY and in ledger row 1 is a measured exit code plus the assertion
text that produced it, with its log path. The two places where I went beyond the plan's minimum — the
package-wide OLD-half collateral, and measuring T2/T3's pre-fix colour with this plan's own fixture
rather than citing research's — are recorded as the improvements they were, and both made the finding
*larger and more specific*, not more flattering.

---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 02
subsystem: testing
tags: [vitest, negative-control, assertion-design, argument-condensation, wall-clock-sweep, collateral-rule]

# Dependency graph
requires:
  - phase: 139-single-source-sweep-findings-confirm-or-withdraw
    provides: 'The verbatim injection diffs at §§ 5.2.2 / 5.3.2 / 5.4.2 (injection B) / 5.15.2, the recorded OLD-half greens at §§ 5.2.4 / 5.3.4 / 5.4.4 / 5.15.4, collateral C-1 (§ 8.1), and the ten prohibited injection designs (§ 8.3)'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 03
    provides: 'The 12-row negative-control ledger with rows 2, 3, 4 and 12 pre-created as `pending`; the proven inverted HYGIENE-LOOP mechanics; and three conventions this plan inherited unchanged (sibling ordering, the `${TMPDIR}/gsd-142` log path, reasoned exceptions written down twice)'
provides:
  - 'F15-B remediated: exact length + canned-text equality on `result.data.arguments`, with a measured RED under 139 § 5.2.2'
  - 'F15-C remediated: per-cluster content assertions across all three clusters, with a measured RED in all three under the same injection instance'
  - 'F16 remediated: the exact rejection prefix `Unsupported language: lol` against a non-empty `entities` fixture, with a measured RED under injection B'
  - 'F20-6 remediated: the traced exact invariant message (batch count 100), with a measured RED in an isolated verdict run and the C-1 collateral held in its own column'
  - "E9's wall-clock decoration deleted, not weakened; D-12's sweep executed and recorded (2 packages, 1 site, 0 additional)"
  - 'Deferred product finding P-1: `data.arguments` is nested one level deeper than its declared type on the single-batch-MAP path — recorded in the ledger, `deferred-items.md` and `.planning/WINDOWS.md`, not fixed'
affects: [142-05, 142-01, 142-04, 142-06]

actuals:
  tokens: 26000
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Sibling ordering carried from wave 1: the strengthened assertion is placed AFTER its siblings so the injected run measures, rather than cites, that only the new assertion reds"
    - "One injection instance, two vehicle runs, one revert — legitimate when two findings share an injection site and each row cites the same instance plus its own log (F15-B/F15-C at `condenser.ts:205`)"
    - "Collateral measured rather than cited: where a swapped message is reachable from sibling suites, run the whole package under the live injection and record the counts (F16: `1 failed | 29 passed (30)`)"
    - "`expect.soft` NOT used — every finding here has a single injection axis, so a hard `expect` is correct and the guarded soft-assertion budget is untouched"

key-files:
  created:
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/deferred-items.md
  modified:
    - packages/argument-condensation/tests/condensation/condenserStandalone.test.ts
    - packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
    - packages/argument-condensation/tests/unit/handleQuestion.test.ts
    - packages/argument-condensation/tests/unit/planValidation.test.ts
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
    - .planning/WINDOWS.md

key-decisions:
  - "F15-C's assertion uses `flat()`, and that is load-bearing rather than a convenience: a green clean-tree probe measured `run.data.arguments` as `[[arg, arg]]`, not `[arg, arg]`, so the un-flattened form cannot satisfy D-11 E8's `each argument carrying non-empty text` at all"
  - "The nesting is a PRODUCT defect and was NOT fixed — `142-02` is test-only by its own success criteria, and collapsing the list-of-lists changes `Condenser.run()`'s observable output for every consumer (Rule 4). Filed as P-1"
  - "RESEARCH § B.3's `[ASSUMED] 2 per run` is confirmed in substance (2 arguments per run after flattening) but NOT in shape — recorded as a contradiction rather than silently reconciled"
  - "F16's collateral was MEASURED package-wide under the live injection rather than cited from 139, because `api.ts` is imported by three sibling test files"
  - "F20-6's `NEW-assertion outcome` cites the isolated `-t` run only; the whole-file run fills `File outcome` and the `:94:62` red fills `Collateral`. Crediting the sibling would be exactly the D-08 error"

patterns-established:
  - "Shared-injection discipline: two findings on one site are two complete records, taken under one live instance with two separate logs and one revert — never two concurrent injections"
  - "When a strengthened assertion exposes a product defect in a test-only phase, record it in three places (ledger row, phase `deferred-items.md`, `.planning/WINDOWS.md`) and leave the product alone"

requirements-completed: [ASSERT-07]

coverage:
  - id: D1
    description: 'F15-B remediated — `condenserStandalone.test.ts` asserts the exact argument count and the mocked provider''s canned texts on `result.data.arguments`, and 139 § 5.2.2''s recorded injection drives it RED on its own axis'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/argument-condensation/tests/condensation/condenserStandalone.test.ts#It should run the complete condensation pipeline with mock data'
        status: pass
      - kind: other
        ref: '${TMPDIR}/gsd-142/F15-B-NEW-1.log — AssertionError at condenserStandalone.test.ts:155:35 (`expected [] to have a length of 2 but got +0`), exit 1 (the negative control; RED is the success signal)'
        status: pass
    human_judgment: false
  - id: D2
    description: 'F15-C remediated — `condenseQuestions.test.ts` asserts per-cluster argument content across all three clusters, paired with (not replacing) the existing counts, and reds in all three under the same injection instance'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/argument-condensation/tests/condensation/condenseQuestions.test.ts#likert/categorical/boolean clusters'
        status: pass
      - kind: other
        ref: '${TMPDIR}/gsd-142/F15-C-NEW-1.log — three AssertionErrors at :163:82, :246:82, :311:82, exit 1; the visualization test stayed green and is recorded as NOT collateral'
        status: pass
    human_judgment: false
  - id: D3
    description: "E9's wall-clock decoration deleted (not weakened) and D-12's sweep executed, bounded to `packages/question-info` + `packages/argument-condensation`, with a per-hit disposition recorded"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "grep -n 'processingTimeMs' condenserStandalone.test.ts | grep -c 'toBeGreaterThan' → 0; nLlmCalls count unchanged at 2; sweep hit list transcribed into the ledger § D-12 with 6 dispositions and zero additional yield"
        status: pass
    human_judgment: false
  - id: D4
    description: 'F16 remediated — the exact rejection prefix `Unsupported language: lol` is asserted against a non-empty `entities` fixture, and injection B (guard kept, message swapped) drives it RED'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/argument-condensation/tests/unit/handleQuestion.test.ts#It should throw an error for an unsupported language'
        status: pass
      - kind: other
        ref: "${TMPDIR}/gsd-142/F16-NEW-1.log — `expected [Function] to throw error including 'Unsupported language: lol' but got 'Cannot read properties of undefined (…'`, exit 1; collateral measured package-wide as 1 failed | 29 passed (30)"
        status: pass
    human_judgment: false
  - id: D5
    description: "F20-6 remediated — the traced exact invariant message (batch count 100) is pinned at `:104`, the isolated verdict run reds on it, and the `:94` C-1 collateral is kept in its own column"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/argument-condensation/tests/unit/planValidation.test.ts#It should throw if a final map step would produce multiple batches'
        status: pass
      - kind: other
        ref: '${TMPDIR}/gsd-142/F20-6-NEW-1.log — AssertionError at :111:62, exit 1, `Tests 1 failed | 9 skipped (10)` (exactly 1 matched the filter); ${TMPDIR}/gsd-142/F20-6-NEW-collateral-1.log — `2 failed | 8 passed (10)` with the second red at :94:62'
        status: pass
    human_judgment: false
  - id: D6
    description: 'Injection hygiene held across all three loop iterations: every injection reverted, the three-condition post-gate passed before the next began, and the package suite is green on the reverted tree'
    requirement: ASSERT-07
    verification:
      - kind: integration
        ref: 'yarn workspace @openvaa/argument-condensation test:unit → 6 files / 30 tests passed, exit 0'
        status: pass
      - kind: other
        ref: "git status --porcelain -- apps tests packages → empty; grep -rn 'INJECTED (142)' apps packages tests → no hits; planValidation.test.ts:89-97 byte-identical to pre-plan HEAD 17b597cdf"
        status: pass
    human_judgment: false

duration: 13 min
completed: 2026-08-20
status: complete
---

# Phase 142 Plan 02: argument-condensation — F15-B, F15-C, F16, F20-6 Summary

**Drove all four `packages/argument-condensation` findings through the inverted HYGIENE-LOOP — one shared `condenser.ts:205` injection instance covering F15-B and F15-C, injection B for F16, and the `planValidation.ts:169` message swap for F20-6 — each measured RED on its own axis; deleted E9's wall-clock decoration outright, executed D-12's bounded sweep, and filed a product-level nesting defect the strengthened assertion exposed rather than papering over it.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-20T18:49:xxZ (first run 21:50:11 local)
- **Completed:** 2026-08-20T19:02:52Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- **F15-B carries a complete negative-control pair.** `result.data.arguments` — the field the file never read — is now pinned by an `Array.isArray` shape guard, `toHaveLength(2)`, exact equality on the two canned texts, and a non-blank check. Under 139 § 5.2.2's recorded injection it reds with `expected [] to have a length of 2 but got +0` at `condenserStandalone.test.ts:155:35`, exit 1. Collateral: none.
- **F15-C carries a complete negative-control pair in all three clusters.** Content assertions were **added beside** the existing `toHaveLength` / `condensationType` matchers, not substituted for them (139 § 5.3.6's "pair, don't replace"). Under the **same live injection instance** all three cluster tests red at `:163:82`, `:246:82`, `:311:82`, exit 1. One injection, two vehicle runs, one revert — both ledger rows cite the same instance and their own logs.
- **The visualization test is recorded as NOT collateral, with its mechanism.** It stayed green under the injection because `setFinalArguments` runs at `condenser.ts:195`, *before* the injected return. Its own progress output changed (`Found 0 pros!` vs `Found 1 pros!`) without changing its verdict — a restatement of the file's blindness, not a collateral red.
- **E9's decoration is gone, not shrunk.** `expect(result.llmMetrics.processingTimeMs).toBeGreaterThan(0)` is deleted; the executable grep for `processingTimeMs` + `toBeGreaterThan` now returns **0**. It was not replaced with `toBeGreaterThanOrEqual(0)`. The call-counter and token-counter siblings were kept (`nLlmCalls` count unchanged at 2).
- **D-12's sweep was executed, not inherited.** Bounded to exactly `packages/question-info` and `packages/argument-condensation`, run with both the matcher grep D-12 names and a widened time-metric net. Six dispositions recorded, one DELETE (E9's, already removed), five KEEP. **Zero additional sites** — matching A-01's measured expectation.
- **F16 carries a complete negative-control pair, with collateral measured rather than cited.** The bare `rejects.toThrow()` is now `toThrow('Unsupported language: lol')`, and the call passes a two-element typed `entities` fixture. Injection B reds it with a *message mismatch* — the rejection still happens, which is what distinguishes an on-axis red here from injection A's `promise resolved "[]" instead of rejecting`. The whole package was run under the live injection to measure collateral: `1 failed | 29 passed (30)`.
- **F20-6 carries a complete negative-control pair with its collateral quarantined.** `:104` now pins the traced message with batch count **100** (not the sibling's 2). The isolated `-t` verdict run reds at `:111:62` with `Tests 1 failed | 9 skipped (10)` — exactly one test matched the filter. The whole-file run reds twice; the second red at `:94:62` is recorded in the `Collateral` column with its C-1 reason and never in the assertion column. `:94-96` is byte-identical to the pre-plan tree.

## Task Commits

1. **Task 1: F15-B + F15-C content assertions, E9's deletion, D-12's sweep** — `fbb103c10` (test) + `9fef8bc1e` (docs, ledger rows 2 and 3 + D-12 record + deferred finding P-1)
2. **Task 2: F16 — exact prefix against non-empty entities** — `73eda4ff7` (test) + `8dde6fb10` (docs, ledger row 4)
3. **Task 3: F20-6 — traced exact invariant message** — `8e71038c1` (test) + `695cbec43` (docs, ledger row 12)

Each durable edit was committed **before** its injection ran, per RESEARCH § E.2 — otherwise the next iteration's pre-gate would have failed on this plan's own work.

## The measurement that contradicted the plan

**RESEARCH § B.3 marked F15-C's per-run argument count `[ASSUMED] 2, by analogy with the measured standalone case`. It is right about the number and wrong about the shape, and the difference is not cosmetic.**

A green clean-tree probe (no injection anywhere) printed:

```
PROBE [[[{"id":"d00ed0c2-…","text":"Test argument 1"},{"id":"4a378ea0-…","text":"Test argument 2"}]], …]
```

On the `handleQuestion` path `run.data.arguments` is **nested one level deeper than its declared `Array<Argument>` type** — `[[arg, arg]]`, not `[arg, arg]`. `Array.isArray` is `true`, `.length` is **1**, and the one element is an *array*, so a naive `.map((a) => a.text)` yields `[undefined]`. The first attempt at the assertion — written straight from § B.3 — went red on the clean tree with `expected [ [ undefined ], [ undefined ] ] to deeply equal [ [ 'Test argument 1', … ] ]`. That red was on a clean tree with no injection, so it was a measurement, not a control.

Cause: the fixtures here build single-batch **MAP-terminated** plans. `planValidation.ts:149` records `structure = batchCount > 1 ? 'listOfLists' : 'list'`, so the bookkeeping says `'list'` while the payload is still physically nested, and `condenser.ts:205`'s `as Array<Argument>` cast hides it from the type checker. `condenserStandalone.test.ts` never shows this because its plan ends in a REDUCE, which collapses the nesting — which is also why its own assertions went green on the first attempt.

Two consequences, both handled explicitly rather than absorbed:

1. **The assertion uses `flat()`, and that is load-bearing.** After flattening the per-run count is 2 and each text is the canned response — which is what D-11 E8 requires. The un-flattened form cannot satisfy E8 at all, because its single element has no `text`. The reason is written inline in the test with a "do not simplify this back" note.
2. **The nesting itself was NOT fixed.** See Deferred Items below.

So § B.3's assumption is confirmed **in substance** and refuted **in shape**. It was confirmed on a green clean-tree run, per Pitfall 8 — never read out of an injected one.

## Decisions Made

**1. `flat()` in F15-C, with the reason written twice.** Inline in the test and again in ledger row 3, following wave 1's "reasoned exceptions get written down twice" convention.

**2. The nesting is a product defect and this plan did not fix it.** Collapsing the list-of-lists changes `Condenser.run()`'s observable output for every consumer — Rule 4 territory — and `142-02`'s own success criteria say no product source is durably modified. Recorded as P-1 in three places. The test asserts real content either way and will keep passing once the product is fixed.

**3. F16's collateral was measured, not cited.** 139 predicted zero collateral, and the file holds one test so no in-file collateral is possible — but `api.ts` is imported by three sibling test files, and injection B changes a message they could in principle reach. The whole package was therefore run under the live injection: `1 failed | 29 passed (30)`. The siblings pass a supported language (`'en'`), so the guard never fires for them.

**4. `expect.soft` was deliberately NOT used.** Wave 1 introduced it and the phase prompt flags it as a *guarded* category (`tests/playwright.config.ts` enforces a SOFT-ASSERTION-BUDGET; ASSERT-06 exists because one was mis-documented). Each of this plan's four findings has a single injection axis, so a hard `expect` reports it fully. Nothing here needed more than one axis from one run.

**5. A-09's guard applied in its non-`mock.calls` form.** No `mock.calls` dereference exists in these four files, but the same hazard does: `Array.isArray(result.data.arguments)` precedes every dereference in F15-B, and `results.map(... .flat())` in F15-C is preceded by the same reasoning. An absent payload reds as an assertion failure, not a `TypeError` — a red the ledger could not credit.

## Deviations from Plan

**1. [Measurement contradicting locked research] F15-C's argument shape**

- **Found during:** Task 1, Step 3 (green clean-tree confirmation, before any injection)
- **Issue:** RESEARCH § B.3's `[ASSUMED]` per-run shape is wrong — `data.arguments` is nested one level deeper than declared on this path.
- **Fix:** the assertion flattens before comparing, satisfying D-11 E8 literally; the anomaly is recorded as a finding rather than encoded as "expected".
- **Files modified:** `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts`
- **Verification:** clean-tree run `Tests 5 passed (5)` exit 0; injected run reds in all three clusters on the content matcher.
- **Committed in:** `fbb103c10`

**2. [Scope boundary — recorded, not fixed] Product finding P-1**

- **Found during:** Task 1, Step 3
- **Issue:** `CondensationRunResult.data.arguments` is typed `Array<Argument>` but is `Array<Array<Argument>>` at runtime for single-batch-MAP-terminated plans.
- **Fix:** none applied. Recorded in ledger § Deferred product findings, `142-.../deferred-items.md`, and `.planning/WINDOWS.md`.
- **Verification:** the probe output is quoted verbatim in ledger row 3.
- **Committed in:** `9fef8bc1e` (record), `deferred-items.md` in the final metadata commit

**3. [Forced by an acceptance criterion] Comment wording in `condenserStandalone.test.ts`**

- **Found during:** Task 1, Step 8 verification
- **Issue:** the criterion `grep -c 'nLlmCalls'` must be unchanged from its pre-task value (2), but my deletion-rationale comment originally used the literal token, raising the count to 3.
- **Fix:** reworded to "the call-counter and token-counter assertions below" — the rationale is unchanged, the literal grep is satisfied, and the executable count is provably untouched.
- **Verification:** pre-task 2, now 2.
- **Committed in:** `fbb103c10`

**4. [Improvement over the plan's minimum] F16 collateral measured package-wide**

- **Found during:** Task 2, Step 5
- **Issue:** the plan says "139 recorded zero collateral at this site; confirm and record whatever is observed" — a single-test file gives no in-file signal to confirm.
- **Fix:** ran the whole package under the live injection as an explicit collateral record.
- **Verification:** `${TMPDIR}/gsd-142/F16-NEW-collateral-1.log`, `Tests 1 failed | 29 passed (30)`.
- **Committed in:** `8dde6fb10`

---

**Total deviations:** 4 (1 measurement contradicting locked research, 1 scope-boundary record, 1 forced by an acceptance criterion, 1 improvement).
**Impact on plan:** No scope creep. No product source durably modified, no package installed, no `any` introduced, no assertion weakened. Deviation 1 changed the *implementation* of an assertion, never its strength.

## Issues Encountered

**None that blocked the plan.** Three observations recorded honestly:

1. **The `TypeError` token appears once in `F15-B-NEW-1.log` and is not an error.** It is the word inside the quoted source frame of the guard's own comment at `:153`, echoed by vitest's code frame. The only error class in that log is `AssertionError`. Stated here so a later reader grepping for `TypeError` does not misread the axis check.
2. **`condenseQuestions.test.ts`'s progress logging changed under the injection** (`Found 0 pros!` where the clean tree prints `Found 1 pros!`) without changing the visualization test's verdict. That is the file's blindness restated, not collateral, and it is recorded as such.
3. **The package's `lint` script covers `src/` only** (`eslint … src/`), so these four test files sit outside the lint gate entirely — the same observation wave 1 made for `packages/dev-seed`. `npx tsc --noEmit` (exit 0) and `prettier --check` (clean) were run over them instead. No pre-existing lint failure was found or absorbed.

## Deferred Items

**P-1 — `data.arguments` is nested one level deeper than its declared type.** `condenser.ts:205` + `condensationResult.ts:32`. Recorded in `142-NEGATIVE-CONTROL-LEDGER.md` § Deferred product findings, in `.planning/phases/142-.../deferred-items.md`, and in `.planning/WINDOWS.md` (kind `deviation`). Not fixed: a Rule-4-class product change in a test-only plan.

## Evidence — run logs (outside the repository, per D-07)

Resolved `$TMPDIR`: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/`. HEAD at plan open: `17b597cdf`. Every injected run was taken at the strengthened-assertion commit for its own finding, with the injection live in the working tree.

| Log | Purpose | Result |
| --- | --- | --- |
| `gsd-142/F15-BC-0-cleantree-baseline.log` | Both F15 files, pre-edit baseline | `8 passed (8)`, exit 0 |
| `gsd-142/F15-BC-NEW-0-cleantree.log` | Both F15 files, post-edit clean tree | `8 passed (8)`, exit 0 |
| `gsd-142/F15-B-NEW-1.log` | **F15-B NEW half — the red** | `1 failed \| 2 passed (3)`, exit 1, `:155:35` |
| `gsd-142/F15-C-NEW-1.log` | **F15-C NEW half — the red** (same injection instance) | `3 failed \| 2 passed (5)`, exit 1, `:163:82` `:246:82` `:311:82` |
| `gsd-142/F15-BC-postrevert.log` | Post-revert green | `8 passed (8)`, exit 0 |
| `gsd-142/F16-NEW-0-cleantree.log` | F16 post-edit clean tree | `1 passed (1)`, exit 0 |
| `gsd-142/F16-NEW-1.log` | **F16 NEW half — the red** | `1 failed (1)`, exit 1, message mismatch |
| `gsd-142/F16-NEW-collateral-1.log` | F16 package-wide collateral record | `1 failed \| 29 passed (30)`, exit 1 |
| `gsd-142/F16-postrevert.log` | Post-revert green | `1 passed (1)`, exit 0 |
| `gsd-142/F20-6-NEW-0-cleantree.log` | F20-6 post-edit clean tree, whole file | `10 passed (10)`, exit 0 |
| `gsd-142/F20-6-clean-isolated.log` | F20-6 filter check on the clean tree | `1 passed \| 9 skipped (10)`, exit 0 |
| `gsd-142/F20-6-NEW-1.log` | **F20-6 NEW half — the isolated VERDICT run** | `1 failed \| 9 skipped (10)`, exit 1, `:111:62` |
| `gsd-142/F20-6-NEW-collateral-1.log` | F20-6 whole-file collateral record | `2 failed \| 8 passed (10)`, exit 1, `:94:62` + `:111:62` |
| `gsd-142/F20-6-postrevert.log` | Post-revert green | `10 passed (10)`, exit 0 |
| `gsd-142/argument-condensation-test-unit.log` | Package gate on the reverted tree | `6 passed (6)` files, `30 passed (30)` tests, exit 0 |

## Plan Verification

| Check | Result |
| --- | --- |
| `git status --porcelain -- apps tests packages` at plan close | **empty** |
| `grep -rn 'INJECTED (142)' apps packages tests` at plan close | **no hits** |
| `yarn workspace @openvaa/argument-condensation test:unit` | **exit 0** — 6 files, 30 tests |
| Ledger rows 2, 3, 4, 12 have no `pending` cells | **pass** (0 in each row section and in the register) |
| D-12 sweep record present, scope stated as exactly two packages | **pass** |
| Five NEW-half logs exist and each names the strengthened assertion | **pass** |
| `planValidation.test.ts:89-97` byte-unchanged vs `17b597cdf` | **pass** (`diff` empty) |
| `npx tsc --noEmit` over the package | **exit 0** |
| `prettier --check` over all four edited test files + the ledger | **clean** |

## User Setup Required

None — no external service configuration, no package installed. The LLM provider is mocked throughout; no live provider call was made.

## Next Phase Readiness

**Ready for `142-05` (wave 3: F17 + A-06's supplementary pair, F20-2, F20-5).** Rows 5, 5s, 8 and 11 await it.

Four things `142-05` should carry forward:

1. **The three wave-1 conventions still hold and were used unchanged** — sibling ordering, `${TMPDIR:-/tmp}/gsd-142/` logs, reasoned exceptions written down twice.
2. **`expect.soft` is available but was not needed here.** Reach for it only where a finding genuinely has more than one injection axis — F17's supplementary pair (A-06) is the likeliest candidate in `142-05`, and F20-5 has injections **A** and **B** at `variants.ts:94` / `:100` which may warrant it. Say why in the row either way.
3. **Do not trust an `[ASSUMED]` value in RESEARCH without a green clean-tree confirmation.** § B.3's assumption was right in number and wrong in shape, and the wrong shape would have produced an unwritable assertion. `142-05`'s F20-5 count (`[VERIFIED] 35` per A-01) is measured, but F17's supplementary shape is new work.
4. **`packages/data`'s F20-5 injection is the one site under a `src/` that other packages consume via `dist/`** (A-09's second clause). It must never be live during a root `turbo run test:unit`. Nothing in this plan exercised that hazard — all four of this plan's targets are consumed as source within their own package.

**Two prohibitions that bind `142-05` specifically, carried from § 8.3:** **R-5** (F20-5's `electionId: undefined` at `variants.ts:100`) reds before *and* after — it is 139's positive control, not a regression. **R-10** (F17's deliberate syntax error at `EntityListWithControls.svelte:120`) reds **neither** — the module is not in the test's import graph, which is F17's whole record. Row 5's `NEW-assertion outcome` is already pre-filled `N/A — by construction` per A-06; do not overwrite it with a manufactured red.

**No blockers.**

---

_Phase: 142-assertion-design-wiring-only-tests-assert-output_
_Completed: 2026-08-20_

## Self-Check: PASSED

All claims verified against disk and git, not asserted from reasoning:

- **Files** — 7/7 present (SUMMARY, `deferred-items.md`, the four edited test files, `.planning/WINDOWS.md`).
- **Commits** — 6/6 resolve in `git log --all`: `fbb103c10`, `9fef8bc1e`, `73eda4ff7`, `8dde6fb10`, `8e71038c1`, `695cbec43`.
- **Logs** — 15/15 present under `${TMPDIR}/gsd-142/`, each the source of the outcome cell that cites it.
- **Tree** — `git status --porcelain -- apps tests packages` empty; no `INJECTED (142)` markers anywhere under `apps packages tests`.
- **Gate** — `yarn workspace @openvaa/argument-condensation test:unit` exit 0 (6 files, 30 tests).
- **D-05 invariant** — `planValidation.test.ts:89-97` byte-identical to pre-plan HEAD `17b597cdf` (`diff` empty).

Every outcome recorded in this SUMMARY and in ledger rows 2, 3, 4 and 12 is a measured exit code plus
the assertion text that produced it, with its log path. No outcome here was predicted.

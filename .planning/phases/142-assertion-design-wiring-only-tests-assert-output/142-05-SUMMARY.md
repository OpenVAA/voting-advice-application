---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 05
subsystem: testing
tags: [vitest, negative-control, assertion-design, frontend, packages-data, scoped-exception, collateral-rule]

# Dependency graph
requires:
  - phase: 139-single-source-sweep-findings-confirm-or-withdraw
    provides: 'The verbatim injection diffs at §§ 5.11.2 / 5.14.2 (A and B), the recorded OLD-half greens at §§ 5.5.4 / 5.11.4 / 5.14.4, § 5.5.6''s advance prediction that F17''s pre-specified regression cannot red under the rename branch, and the prohibited designs R-5, R-8, R-10 (§ 8.3)'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 03
    provides: 'The 12-row ledger with rows 5 (pre-filled `N/A — by construction`), 5s, 8 and 11 created; the inverted HYGIENE-LOOP mechanics; the sibling-ordering, log-path and written-down-twice conventions'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 02
    provides: 'Four carried cautions — probe before asserting on an [ASSUMED] value, R-5/R-10 bind this plan, the packages/data dist propagation hazard, and expect.soft as a guarded rather than default primitive'
provides:
  - 'F17 remediated across all four D-04 items: the test file is renamed to the helper contract it verifies, and its `:84-95` assertion compares an observed per-cycle result list against an independently-derived expectation'
  - 'F17 ledger row 5 closed honestly as a scoped, pre-predicted exception to ROADMAP criterion 1 — remediated, not withdrawn; withdrawal count still 0'
  - 'F17 supplementary row 5s: a NEW injection at `helpers.ts:19` with BOTH halves measured — OLD green (blind), NEW red on the value axis at `:129:24`'
  - 'F20-2 remediated: exact equality against the raw ICU template, with a measured RED under 139 § 5.11.2 and zero collateral'
  - 'F20-5 remediated: a fixture-derived count with a non-vacuity guard plus id membership, with TWO measured REDs on DIFFERENT axes — injection A on the length assertion, injection B on the membership assertion'
  - 'A corrected stale cross-reference: the docblock pointer to `filterContext.svelte.test.ts` "Contract 5" named a test that does not exist in that file'
affects: [142-01, 142-04, 142-06]

actuals:
  tokens: 10600
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - 'Isolated `-t` verdict run + separate whole-file collateral run, applied to BOTH halves of a pair — required here because F17''s supplementary injection reds a pre-existing sibling in both halves, so a whole-file OLD half is red and only the assertion-level run answers the question the ledger asks'
    - 'Assertion ORDERING as evidence: the retained call-count assertion is placed before the value assertion, so one injected run shows the call count satisfied and the value assertion failing — blindness and catch in a single transcript rather than two stitched claims'
    - 'A-09 applied in its ordering form: a hard, first-placed membership assertion IS the guard for the dereference that follows it, and keeping it hard is what stops a wrong-id injection reding as a TypeError'
    - '`expect.soft` again NOT used — and in F20-5 the reason is mechanical, not stylistic: a soft membership assertion would continue into the dereference and produce the wrong-axis TypeError the ordering exists to prevent'
    - 'Confirm a research figure by throwaway probe rather than by trust, and revert the probe without pinning the number (F20-5''s count of 35)'

key-files:
  created:
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.test.ts
  modified:
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts
    - apps/frontend/src/lib/i18n/tests/overrides.test.ts
    - packages/data/src/objects/nominations/variants/variants.test.ts
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "F17's supplementary OLD half was measured with an isolated `-t 'Contract 4'` run, NOT a whole-file run, because the whole-file run is RED — the pre-existing `Contract 3` sibling also sees the injection. The plan expected a green file; the file is not green, the assertion is. Reading the whole-file red as the OLD half would have been the exact D-08 error"
  - "Recorded plainly that F17's FILE was never wholly blind to the supplementary regression — `Contract 3` catches it. What was blind is the assertion F17 names. Stating this qualifies the finding rather than inflating it"
  - "Row 5's `File outcome` and `Collateral` are filled `N/A` with the reason (no injection was applied), not left `pending` and not padded with the supplementary row's measurements, which belong to row 5s"
  - "F20-5's collateral was MEASURED package-wide for each injection separately (7 and 11 further tests) rather than cited from 139's `file green 1/1`, which for a one-test file says nothing about blast radius"
  - "The F20-5 count was confirmed by a throwaway `toBe(-1)` probe (printed `expected 35 to be -1`, matching A-01) and the probe reverted; the literal 35 was never written into the file"

patterns-established:
  - 'When an injection reds a pre-existing sibling in BOTH halves of a pair, run both halves isolated and keep two whole-file collateral logs — the collateral cell then carries a value that is stable across the pair rather than one that looks like it appeared with the remediation'
  - 'An honest `N/A` cell states what was not done and why, in the same cell — it is never left `pending`, and it is never quietly backfilled from a different row'

requirements-completed: [ASSERT-07]

coverage:
  - id: D1
    description: 'F17 remediated across all four D-04 items — file renamed to `EntityListWithControls.helpers.test.ts` with history preserved, back-reference moved, outer describe naming the helpers, docblock rewritten as the contract, and `:84-95` comparing an observed per-cycle list against an independently-derived expectation'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.test.ts#returns the group-narrowed list on every mutation cycle, with exactly one apply() per call'
        status: pass
      - kind: other
        ref: "grep -rn 'EntityListWithControls.test.ts' apps packages tests → 0 hits; executable grep for toHaveBeenCalledTimes(10) → 0; file green 8/8 both before and after the rewrite; git log --follow reaches 60593d2b3"
        status: pass
    human_judgment: false
  - id: D2
    description: "F17's ledger row 5 records the `N/A — by construction` exception with its four-part reasoning (D-04's branch, 139 § 5.5.6's advance prediction, § 8.3 R-10's independent prohibition, remediated-not-withdrawn), and the withdrawal count stays 0"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: '142-NEGATIVE-CONTROL-LEDGER.md row 5 register line + row 5 section + § Scoped exceptions to ROADMAP criterion 1 (exactly one entry); § Withdrawals still reads "Running count: 0"'
        status: pass
    human_judgment: false
  - id: D3
    description: "F17's supplementary pair (row 5s) measured in both directions against a NEW `helpers.ts:19` injection — OLD half green (blindness), NEW half red on the value axis (catch), both isolated, with whole-file collateral kept separately"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: '${TMPDIR}/gsd-142/F17-supp-OLD-1.log — exit 0, Tests 1 passed | 7 skipped (8); ${TMPDIR}/gsd-142/F17-supp-NEW-1.log — exit 1, AssertionError at helpers.test.ts:129:24, Tests 1 failed | 7 skipped (8)'
        status: pass
    human_judgment: false
  - id: D4
    description: 'F20-2 remediated — the ICU parse-error fallback test asserts the raw template exactly, and the empty-string injection at `overrides.ts:36` drives it RED with zero collateral'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/i18n/tests/overrides.test.ts#getOverride returns raw template on ICU parse error'
        status: pass
      - kind: other
        ref: "${TMPDIR}/gsd-142/F20-2-NEW-1.log — AssertionError: expected '' to be '{broken, plural, }' at overrides.test.ts:39:20, exit 1, Tests 1 failed | 6 passed (7)"
        status: pass
    human_judgment: false
  - id: D5
    description: 'F20-5 remediated — a fixture-derived count with a non-vacuity guard closes the vacuous-forEach hole and id membership closes the wrong-id hole, with injections A and B reding on DIFFERENT assertions'
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'packages/data/src/objects/nominations/variants/variants.test.ts#ParseNominationTree should return one item per tree leaf, each carrying its own election and constituency id'
        status: pass
      - kind: other
        ref: '${TMPDIR}/gsd-142/F20-5-NEW-A-1.log — expected [] to have a length of 35 but got +0 at :21:26, exit 1; ${TMPDIR}/gsd-142/F20-5-NEW-B-1.log — expected [ election-1, election-2 ] to include WRONG-ELECTION-ID at :33:25, exit 1'
        status: pass
    human_judgment: false
  - id: D6
    description: 'Injection hygiene held across all four loop iterations, and the packages/data build hazard was not exercised: every run was in-package, no root turbo run overlapped either injection, and A was fully reverted before B was applied'
    requirement: ASSERT-07
    verification:
      - kind: integration
        ref: 'cd packages/data && npx vitest run → 47 files / 244 tests passed, exit 0 on the reverted tree'
        status: pass
      - kind: other
        ref: "git status --porcelain -- apps tests packages → empty; grep -rn 'INJECTED (142)' apps packages tests → no hits; three-condition post-gate passed after each of the four injections"
        status: pass
    human_judgment: false

duration: 12 min
completed: 2026-08-20
status: complete
---

# Phase 142 Plan 05: F17 (rename + supplementary pair), F20-2, F20-5 Summary

**Renamed F17's test file to the helper contract it actually verifies and replaced its self-referential `10 === 10` with an observed-versus-derived comparison; recorded F17's missing NEW half as an honest, pre-predicted `N/A — by construction` exception and paid for it with a real supplementary pair measured in both directions; and drove F20-2 and F20-5 red on their own axes — F20-5 twice, on two different assertions, closing vacuity and blindness separately.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-20T19:08Z (22:08 local)
- **Completed:** 2026-08-20T19:20Z
- **Tasks:** 3 of 3
- **Files modified:** 5 (1 renamed, 4 edited — 3 test files, 1 docblock, 1 ledger)

## Accomplishments

- **F17's rename is complete across all four D-04 items, and each is independently verifiable.** The file moved with `git mv` (history reaches `60593d2b3` through `--follow`); the back-reference at `EntityListWithControls.helpers.ts:12` — the only other mention in the tree — moved with it, so `grep -rn 'EntityListWithControls.test.ts' apps packages tests` returns **0 hits**; the outer describe now names `computeFiltered` / `countActiveFilters`; and the header docblock is a contract statement with `[VERIFIED: …]` citations rather than an apology for not mounting the component.
- **The `:84-95` assertion now compares observed against independently-derived.** Ten mutation cycles are driven as before, but the returned array from each `computeFiltered` call is **collected**, and the expectation is built from the fakes' documented semantics (`FakeGroup.apply` returns `[]` while active, a copy otherwise) rather than from the loop bound. The executable grep for `toHaveBeenCalledTimes(10)` returns **0**. The file is green **8/8** — the same count as before the rewrite.
- **The supplementary pair split cleanly, and the split is visible in a single transcript.** Under the new `helpers.ts:19` injection the retained call-count assertion (ordered first, at `:121`) **passed**, execution reached `:129`, and the value assertion **failed** with `expected [ [ { name: 'A' }, …(2) ], …(9) ] to deeply equal [ [], …`. Blindness and catch are one measurement, not two.
- **F17's row 5 is filled honestly rather than manufactured.** `NEW-assertion outcome` stays `N/A — by construction`; `File outcome` and `Collateral` are filled `N/A` **with the reason** (no injection was applied) rather than left `pending` or backfilled from row 5s. `Verdict` is `remediated`. The withdrawal count is still **0** and D-13's bar is not engaged.
- **F20-2 asserts the raw template exactly and reds with zero collateral.** `expect(typeof result).toBe('string')` — which every wrong string value also satisfies — became `expect(result).toBe('{broken, plural, }')`. The empty-string injection reds it at `overrides.test.ts:39:20` with `expected '' to be '{broken, plural, }'`, `Tests 1 failed | 6 passed (7)`: exactly the one test that reaches the catch arm.
- **F20-5 closes two different holes and proves it by reding on two different lines.** The derived count with its `toBeGreaterThan(0)` guard closes vacuity; membership against the tree's own keys closes blindness. Injection A reds the **length** assertion at `:21:26`; injection B reds the **membership** assertion at `:33:25`. Under B the length assertion passed — which is what makes "A and B are not the same fact" an observation rather than an assertion.
- **The build hazard was not exercised.** Every `packages/data` run was `cd packages/data && npx vitest run`. No root `turbo run test:unit` was executed while either injection was live, and none was running concurrently (checked before the first injection). The package is green **47 files / 244 tests** on the reverted tree.

## Task Commits

1. **Task 1: F17 — rename to the contract + supplementary pair** — `a25355369` (test) + `3c72e4b73` (docs, ledger rows 5 and 5s)
2. **Task 2: F20-2 — the exact raw ICU template** — `cba97b2a1` (test) + `45548026e` (docs, ledger row 8)
3. **Task 3: F20-5 — derived count, non-vacuity guard, id membership** — `a02b92e51` (test) + `d69ecb2fc` (docs, ledger row 11)

Each durable edit was committed **before** its injection ran (RESEARCH § E.2), so no commit in this plan was taken while an injection was live.

## The measurement that contradicted the plan

**The plan expected F17's supplementary OLD half to be a GREEN run. The run is RED — and the assertion under test is green inside it.**

The plan's Step 1 said *"Run the file as it stands today … **Expect GREEN**"*, and its acceptance criterion asked for `F17-supp-OLD-1.log` to show "the run **green**". Measured, the whole-file OLD half is:

```
 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```

The one red is **`Contract 3`** at `:98:63` (*"list shrinks when a filter becomes active"*), which asserts `toEqual([])` after activating the filter and therefore also sees the discarded-result injection. `Contract 4` — the assertion F17 actually names — passed.

Handled by measuring at the assertion rather than at the file, per D-08 and wave 1's F18/F20-6 precedent:

- `F17-supp-OLD-1.log` is the **isolated** `-t 'Contract 4'` run: exit **0**, `Tests 1 passed | 7 skipped (8)`. That green is the blindness demonstration.
- `F17-supp-OLD-collateral-1.log` holds the whole-file result, recorded as collateral.
- The same split was taken for the NEW half (`F17-supp-NEW-1.log` isolated, `F17-supp-NEW-collateral-1.log` whole file, `Tests 2 failed | 6 passed (8)`).

**Why this mattered rather than being bookkeeping.** Had the whole-file run been logged as the OLD half, its red would have looked like "the old assertion caught the regression" — the precise D-08 error the two-column rule exists to prevent, and worse here than usual because the red belongs to a test that was never blind. `Contract 3` is now recorded as collateral `C-142-1` in **both** halves and credited as neither.

**A qualification worth stating plainly, because it makes the finding smaller and truer.** F17's *file* was never wholly blind to this particular regression — `Contract 3` sees it. What was blind is the assertion F17 names: `:84-95` claimed a bounded-invocation contract and tested only its own loop bound. That is the defect, and it is now closed. Both injections in Task 3 produce the same shape of observation on a larger scale (7 and 11 collateral tests), and all of it is recorded rather than smoothed.

## Decisions Made

**1. Both halves of the supplementary pair measured isolated, with two extra collateral logs.** Five logs were planned; nine were taken. The extras are the whole-file records for each half plus post-revert greens.

**2. Row 5's `File outcome` and `Collateral` read `N/A` with the reason in the cell.** They are not `pending` (which would read as unrun) and not backfilled from row 5s (which would read as evidence for a row that has none). The clean-tree green 8/8 is cited alongside, so a reader can see the file's real state.

**3. F20-5's collateral was measured package-wide per injection, not cited.** 139 recorded "file green 1/1", which for a one-test file carries no blast-radius information, and `parseNominationTree` feeds `testUtils`' fixture construction. A: `8 failed | 236 passed (244)`. B: `12 failed | 232 passed (244)`. Neither is credited.

**4. The F20-5 count was confirmed by probe and the probe discarded.** A throwaway `toBe(-1)` edit printed `expected 35 to be -1`, matching A-01. The probe was reverted (which also discarded the durable edit, since `git checkout --` is path-scoped, not hunk-scoped — the edit was rewritten immediately). The literal `35` appears nowhere in executable code; injection A's own failure message re-states it, which is the derivation reporting itself.

**5. `expect.soft` deliberately NOT used — for the second consecutive wave, but for a new reason.** Wave 2 declined it on the grounds that each finding had one axis. Here F17's pair and F20-5's A/B were the flagged candidates, and both were declined on **mechanical** grounds: F17's two assertions are sequentially dependent by design (reaching the value assertion is what proves the call count held), and in F20-5 a soft membership assertion would continue into the `tree[d.electionId]` dereference and produce exactly the wrong-axis `TypeError` A-09's ordering exists to prevent. The guarded soft-assertion budget is untouched.

**6. Both `expect.soft` refusals and both ordering choices are written down twice** — inline in the tests with explicit "do not simplify/tidy this back" notes, and in the ledger rows.

## Deviations from Plan

**1. [Measurement contradicting the plan] F17's supplementary OLD half is red at file level**

- **Found during:** Task 1, Step 1
- **Issue:** the plan expected a green run; the whole-file run is `1 failed | 7 passed (8)` because the pre-existing `Contract 3` sibling also catches the injection.
- **Fix:** the OLD half was measured with an isolated `-t 'Contract 4'` run (green, exit 0, `1 passed | 7 skipped`), and the whole-file result kept as a separate collateral log. The same split was applied to the NEW half for symmetry.
- **Files modified:** none beyond the plan's own targets — this changed the measurement method, never an assertion's strength.
- **Verification:** four logs — `F17-supp-OLD-1.log`, `F17-supp-OLD-collateral-1.log`, `F17-supp-NEW-1.log`, `F17-supp-NEW-collateral-1.log`.
- **Committed in:** `3c72e4b73` (record)

**2. [Stale cross-reference found in passing — corrected, because it sat inside the text being rewritten] `filterContext.svelte.test.ts` "Contract 5"**

- **Found during:** Task 1, Step 4 (the docblock rewrite)
- **Issue:** the old docblock pointed at *"`filterContext.svelte.test.ts` Contract 5"*. That file's tests are titled by behaviour and contain **no** "Contract 5"; the version-counter test is at `:204`. Confusingly, `Contract 5` **does** exist in *this* file, on a `countActiveFilters` test, under a different numbering scheme.
- **Fix:** the rewritten docblock cites the line and the actual title, and states that the old label did not resolve. This is not scope creep — D-04 item 3 required rewriting exactly this docblock, and carrying a false pointer into a "contract statement" would have been writing a new falsehood.
- **Verification:** `grep -n "Contract 5" filterContext.svelte.test.ts` → no hits; the version-counter test is `:204`.
- **Committed in:** `a25355369`

**3. [Forced by an acceptance criterion] Comment wording in `variants.test.ts`**

- **Found during:** Task 3, criteria check
- **Issue:** the criterion `grep -c 'toBeDefined()'` must return 0, but my rationale comment used the literal token when explaining what the *old* assertion could not see, raising the count to 1. Same class as wave 2's deviation 3.
- **Fix:** reworded to "the previous mere-definedness check". Reasoning unchanged, literal grep satisfied.
- **Verification:** now 0.
- **Committed in:** `a02b92e51`

**4. [Improvement over the plan's minimum] F20-5 collateral measured package-wide**

- **Found during:** Task 3, Steps 3-4
- **Issue:** the plan said "139 recorded none at this site" — but 139's record is `file green 1/1` for a one-test file, which cannot show collateral at all.
- **Fix:** ran the whole package under each live injection.
- **Verification:** `F20-5-NEW-A-collateral-1.log` (`8 failed | 236 passed`), `F20-5-NEW-B-collateral-1.log` (`12 failed | 232 passed`).
- **Committed in:** `d69ecb2fc`

---

**Total deviations:** 4 (1 measurement contradicting the plan, 1 in-scope correction of a stale reference, 1 forced by an acceptance criterion, 1 improvement).
**Impact on plan:** No scope creep. No product source durably modified (the `helpers.ts` change is a docblock back-reference), no package installed, no `any` introduced, no assertion weakened. Deviation 1 changed how an outcome was *measured*, never what was asserted.

## Issues Encountered

**None that blocked the plan.** Three observations recorded honestly:

1. **`timeout` is not available on this macOS host** (`exit 127`). The one command that used it was re-run without it. No result depended on the timeout.
2. **`git checkout --` is path-scoped, not hunk-scoped.** Reverting the F20-5 count probe also discarded the uncommitted durable edit in the same file. Rewritten immediately and re-verified green; noted here because the same trap will recur in any plan that probes inside a file it is also editing. Committing the durable edit *before* probing would have avoided it.
3. **`packages/data`'s eslint and `tsc --noEmit` both pass over the edited test** (exit 0 each), as does `prettier --check`. No pre-existing failure was found or absorbed.

## Deferred Items

**None new.** No product defect surfaced in this plan — the three strengthened assertions all matched their contracts on the clean tree. Wave 2's **P-1** remains open in `deferred-items.md` and `.planning/WINDOWS.md`; nothing here touches it.

## Evidence — run logs (outside the repository, per D-07)

Resolved `$TMPDIR`: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/`. HEAD at plan open: `1edd0c744`. Every injected run was taken at the strengthened-assertion commit for its own finding (except the supplementary OLD half, which is taken at the **pre-rewrite** file by design), with the injection live in the working tree.

| Log | Purpose | Result |
| --- | --- | --- |
| `gsd-142/F17-supp-OLD-0-cleantree.log` | Pre-edit baseline, no injection | `8 passed (8)`, exit 0 |
| `gsd-142/F17-supp-OLD-1.log` | **F17-supp OLD half — the GREEN** (isolated `-t 'Contract 4'`, pre-rewrite file) | `1 passed \| 7 skipped (8)`, exit 0 |
| `gsd-142/F17-supp-OLD-collateral-1.log` | F17-supp OLD half, whole file | `1 failed \| 7 passed (8)`, exit 1, `Contract 3` |
| `gsd-142/F17-NEW-0-cleantree.log` | Post-rewrite clean tree | `8 passed (8)`, exit 0 |
| `gsd-142/F17-supp-NEW-1.log` | **F17-supp NEW half — the RED** (isolated) | `1 failed \| 7 skipped (8)`, exit 1, `:129:24` |
| `gsd-142/F17-supp-NEW-collateral-1.log` | F17-supp NEW half, whole file | `2 failed \| 6 passed (8)`, exit 1 |
| `gsd-142/F17-postrevert.log` | Post-revert green | `8 passed (8)`, exit 0 |
| `gsd-142/F20-2-NEW-0-cleantree.log` | F20-2 post-edit clean tree | `7 passed (7)`, exit 0 |
| `gsd-142/F20-2-NEW-1.log` | **F20-2 NEW half — the RED** | `1 failed \| 6 passed (7)`, exit 1, `:39:20` |
| `gsd-142/F20-2-postrevert.log` | Post-revert green | `7 passed (7)`, exit 0 |
| `gsd-142/F20-5-NEW-0-cleantree.log` | F20-5 post-edit clean tree | `1 passed (1)`, exit 0 |
| `gsd-142/F20-5-NEW-A-1.log` | **F20-5 NEW half, injection A — the RED** (length axis) | `1 failed (1)`, exit 1, `:21:26` |
| `gsd-142/F20-5-NEW-A-collateral-1.log` | Injection A, package-wide | `8 failed \| 236 passed (244)`, exit 1 |
| `gsd-142/F20-5-NEW-B-1.log` | **F20-5 NEW half, injection B — the RED** (membership axis) | `1 failed (1)`, exit 1, `:33:25` |
| `gsd-142/F20-5-NEW-B-collateral-1.log` | Injection B, package-wide | `12 failed \| 232 passed (244)`, exit 1 |
| `gsd-142/F20-5-postrevert-package.log` | `packages/data` gate on the reverted tree | `47 passed (47)` files, `244 passed (244)` tests, exit 0 |

## Plan Verification

| Check | Result |
| --- | --- |
| `git status --porcelain -- apps tests packages` at plan close | **empty** |
| `grep -rn 'INJECTED (142)' apps packages tests` at plan close | **no hits** |
| `grep -rn 'EntityListWithControls.test.ts' apps packages tests` | **no hits** |
| `cd apps/frontend && npx vitest run …helpers.test.ts …overrides.test.ts` | **exit 0** — 2 files, 15 tests |
| `cd packages/data && npx vitest run …variants.test.ts` | **exit 0** — 1 test |
| `cd packages/data && npx vitest run` (whole package, reverted tree) | **exit 0** — 47 files, 244 tests |
| Ledger rows 5, 5s, 8, 11 have no `pending` cells | **pass** (0 in each row section and in the register) |
| § Withdrawals still reads `Running count: 0` | **pass** |
| § Scoped exceptions to ROADMAP criterion 1 holds exactly the F17 entry | **pass** (1) |
| Five required logs exist; nine were taken | **pass** |
| No root `turbo run test:unit` overlapped Task 3's injections | **pass** — every run in-package; checked for concurrent runs before injecting |
| `npx tsc --noEmit` over `packages/data` | **exit 0** |
| `eslint` + `prettier --check` over all edited files | **clean** |

## User Setup Required

None — no external service configuration, no package installed, no network call.

## Next Phase Readiness

**Ready for `142-01` (wave 4: F15-A + D-01's `question-info` product fix, D-03, D-05 — an `autonomous: false` checkpoint plan).** Rows 1 and its siblings await it.

Five things `142-01` should carry forward:

1. **Wave 1's three conventions still hold and were used unchanged** — sibling ordering (used here as *assertion* ordering, and it earned its keep twice), the `${TMPDIR:-/tmp}/gsd-142/` log path, and reasoned exceptions written down twice.
2. **A plan's stated colour expectation is a prediction, not a fact.** F17's supplementary OLD half was predicted green and is red at file level. When a prediction and a measurement disagree, split the measurement (isolated verdict + whole-file collateral) rather than adjusting either the assertion or the record.
3. **`142-01` is a D-06 *re-run* exception, and A-08 fixes its internal order:** re-run the OLD half **against the pre-fix tree**, then land D-01's product fix, then strengthen the assertion, then run the NEW half. Getting this backwards makes the OLD half unmeasurable, exactly as it would for `142-04`'s F20-1.
4. **Commit the durable edit before probing inside the same file.** `git checkout --` is path-scoped; reverting a probe discards any uncommitted edit sharing the path (cost here: one file rewrite).
5. **`expect.soft` remains unused across all three completed waves.** Both candidates flagged for this plan were declined on mechanical grounds. If `142-01` reaches for it, the ledger row must say why one run genuinely needs more than one axis — and must confirm no dereference follows a soft assertion.

**One prohibition that binds `142-01` specifically, carried from § 8.3: R-2** — F15-A's audit sentence is un-injectable and zero-delta; 139's **substitute** injection at `infoGeneration.ts:76` is the one to use. And per A-04, D-11's headline F15-A target *passes today for the wrong reason* and must not be written as stated: F15-A needs a **new fixture**, not an edit.

**No blockers.**

---

_Phase: 142-assertion-design-wiring-only-tests-assert-output_
_Completed: 2026-08-20_

## Self-Check: PASSED

All claims verified against disk and git, not asserted from reasoning:

- **Files** — 6/6 present (the renamed test file, the helper docblock, `overrides.test.ts`, `variants.test.ts`, the ledger, this SUMMARY).
- **Commits** — 6/6 resolve in `git log --all`: `a25355369`, `3c72e4b73`, `cba97b2a1`, `45548026e`, `a02b92e51`, `d69ecb2fc`.
- **Logs** — 16/16 present under `${TMPDIR}/gsd-142/`, each the source of the outcome cell that cites it.
- **Tree** — `git status --porcelain -- apps tests packages` empty; no `INJECTED (142)` markers anywhere under `apps packages tests`; no reference to the old test filename anywhere under `apps packages tests`.
- **Gates** — `apps/frontend` two files exit 0 (15 tests); `packages/data` whole package exit 0 (47 files, 244 tests) on the reverted tree; `tsc --noEmit` over `packages/data` exit 0.
- **Ledger** — rows 5, 5s, 8 and 11 carry zero `pending` cells in both the register and their row sections; § Withdrawals reads `Running count: 0`; § Scoped exceptions holds exactly one entry.

Every outcome recorded in this SUMMARY and in ledger rows 5, 5s, 8 and 11 is a measured exit code plus
the assertion text that produced it, with its log path. The one place where a prediction and a
measurement disagreed — F17's supplementary OLD half — is recorded as the disagreement it was, not
reconciled.

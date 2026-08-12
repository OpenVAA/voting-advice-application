---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 02
subsystem: testing
tags: [vitest, arrayContaining, assertions, filters, data-model, negative-control]

# Dependency graph
requires:
  - phase: 135
    provides: "The negative-control discipline (prove the guard fails before claiming it guards)"
provides:
  - "Eleven subset matchers on the matching pipeline's input path converted to exact equality — over-inclusion now fails"
  - "Demonstrated (not asserted) proof that the old assertions passed a no-op filter and the new ones do not"
  - "The dataWriter File->path substitution is asserted for the first time"
  - "A corrected matcher: `info` stays localized `{ en: ... }` through the answer spread"
affects: [136-03, future filter/data-model changes, any lint rule banning toEqual(expect.arrayContaining(x))]

actuals:
  tokens: 3100
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Two-run negative control: stub the primitive, run OLD assertions (pass = blind) and NEW assertions (fail = real guard), then revert"

key-files:
  created:
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/deferred-items.md
  modified:
    - packages/data/src/root/dataRoot.test.ts
    - packages/data/src/objects/election/election.test.ts
    - packages/data/src/objects/nominations/base/nomination.test.ts
    - packages/data/src/objects/questions/category/questionCategory.test.ts
    - packages/filters/tests/filter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts

key-decisions:
  - "Plain `toEqual(ids)` everywhere — ordering proved deterministic empirically, so no sort/length fallback was needed at any of the eleven sites"
  - "Converted two same-class sites the audit's enumeration missed (election.test.ts:29, filter.test.ts:271) rather than leaving them to satisfy the plan's own grep criterion"
  - "Kept three `arrayContaining` uses that are already paired with a length/size check — they are correct as-is"
  - "Broke the IMPLEMENTATION rather than the test input for the F14 negative control — that is the regression the guard exists to catch"
  - "Tightened F14's `objectContaining` to exact args; all three RPC params are known, so subset matching bought nothing"
  - "Did NOT touch production filter code — all eleven converted assertions passed unchanged, so no real filter bug was uncovered"

patterns-established:
  - "Negative control must be run twice: once against the old assertion to prove blindness, once against the new one to prove the fix. A single failing run only proves the stub worked."
  - "A matcher that has never been used as an assertion cannot be trusted to be correct — F14's was wrong about `info`."

requirements-completed: [REAL-02]

coverage:
  - id: D1
    description: "Nine F12 subset matchers (plus two the audit missed) converted so a no-op filter fails them"
    requirement: REAL-02
    verification:
      - kind: unit
        ref: "vitest run packages/data packages/filters — 265 passed, 1 pre-existing unrelated failure"
        status: pass
      - kind: unit
        ref: "Negative control: appliesTo + Filter.apply stubbed to no-ops — old assertions 17 failures, new assertions 25 failures (8 newly caught)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dataWriter test asserts the File->path substitution it is named for"
    requirement: REAL-02
    verification:
      - kind: unit
        ref: "apps/frontend/.../supabaseDataWriter.test.ts#uploads File objects to Storage and replaces with path in answers"
        status: pass
      - kind: unit
        ref: "Negative control: substitution stubbed out — old assertion 34/34 PASS (blind), new assertion FAILS on `\"value\": File {}`"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-08-11
status: complete
---

# Phase 136 Plan 02: F12 subset matchers + F14 unused matcher Summary

**Eleven subset matchers on the matching pipeline's input path converted to exact equality, with a two-run negative control proving the old assertions passed a no-op filter and the new ones do not — plus the dataWriter's File→path substitution asserted for the first time, which required correcting a matcher that had never been run.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-11T20:03:00Z
- **Completed:** 2026-08-11T20:15:00Z
- **Tasks:** 2
- **Files modified:** 6 (+1 created)

## Accomplishments

- **All nine F12 sites verified by grep against the audit and converted** — the audit's enumeration was accurate, verbatim, at every line it cited.
- **Two additional same-class sites found that the audit missed** (`election.test.ts:29`, `filter.test.ts:271`) and converted.
- **The negative control is the deliverable, and it was run twice per task** — once against the original assertions to demonstrate blindness, once against the converted ones to demonstrate the fix. Numbers below.
- **F14 exposed a second defect the audit did not predict:** the never-used matcher was *wrong*, so the audit's literal suggested fix fails. That is the strongest possible evidence it had never been exercised as an assertion.
- **No production code changed.** All eleven converted assertions passed unchanged against the real implementations, so no genuine filter bug was uncovered.

## Task Commits

1. **Task 1: Convert the nine subset matchers to equality** — `2f1cc3b9f` (test)
2. **Task 2: Use the matcher F14 builds** — `2fe94f933` (test)

## The negative controls

### Task 1 — both filter primitives stubbed to no-ops

Two probes applied simultaneously, each the exact "filter deleted / short-circuited" regression the audit describes:

```diff
# packages/data/src/objects/questions/base/questionAndCategoryBase.ts:54
   appliesTo(targets: FilterTargets): boolean {
+    return true; // NEGATIVE-CONTROL PROBE

# packages/filters/src/filter/base/filter.ts:93
-    return targets.filter((t) => this.test(t));
+    return targets; // NEGATIVE-CONTROL PROBE
```

| Run (identical stub in both) | Result |
|---|---|
| **Original `arrayContaining` assertions** | `Test Files 4 failed \| 44 passed` — `Tests 17 failed \| 249 passed` |
| **Converted `toEqual` assertions** | `Test Files 8 failed \| 40 passed` — `Tests 25 failed \| 241 passed` |

**Eight tests newly catch the no-op.** Absent from the first list and present in the second:

1. `dataRoot.test.ts > FindQuestions > Should find questions`
2. `dataRoot.test.ts > FindQuestions > Should exclude those where filter is different` ← the one literally titled for exclusion
3. `dataRoot.test.ts > FindQuestions > Should apply filters to categories`
4. `election.test.ts > GetQuestions > Should get questions`
5. `nomination.test.ts > Should return applicableQuestions`
6. `questionCategory.test.ts > GetApplicableQuestions should return applicable questions`
7. `filter.test.ts > TextQuestionFilter: multiple values > Should return all that have the included item`
8. `filter.test.ts > TextQuestionFilter: multiple values > Should return all that partally match the included item`

Real output from the converted run:

```
FAIL |@openvaa/data| dataRoot.test.ts > FindQuestions > Should exclude those where filter is different
AssertionError: expected [ 'question-8', 'question-9', …(4) ] to deeply equal [ 'question-8', 'question-9', …(3) ]

FAIL |@openvaa/data| nomination.test.ts > Should return applicableQuestions
AssertionError: expected [ 'question-1', 'question-2', …(12) ] to deeply equal [ 'question-1', 'question-2', …(4) ]

FAIL |@openvaa/filters| filter.test.ts > TextQuestionFilter: multiple values > Should return all that have the included item
AssertionError: expected [ AnsweringEntity{ …(1) }, …(2) ] to deeply equal [ AnsweringEntity{ …(1) }, …(1) ]
```

Both probes reverted; `grep -rn 'NEGATIVE-CONTROL PROBE' packages/ apps/` returns clean and the suite is back to its exact baseline.

**Honest accounting — three converted sites still cannot detect *this particular* no-op**, and it would be misleading to imply otherwise:

- `dataRoot.test.ts:101` (`'Should include questions where filter is not defined'`) and `filter.test.ts:271` (`'Should not return all if none are excluded'`) both *expect the full set*. No no-op stub can be caught by an assertion whose expectation is already "everything". They are nonetheless strictly better as equality: they now fail on over-inclusion beyond the full set and on ordering/identity drift.
- `election.test.ts:29` (`constituencyGroups`) is not routed through `appliesTo`, so the stub does not reach it. It now fails if an election gains an unexpected constituency group.

### Task 2 — the substitution stubbed out

```diff
# apps/frontend/.../supabaseDataWriter.ts:303
-        processedAnswers[questionId] = { ...answer, value: { path: storagePath } };
+        processedAnswers[questionId] = answer; // NEGATIVE-CONTROL PROBE
```

The raw `File` now reaches the RPC — precisely the failure mode F14 says was missed.

| Run (identical stub) | Result |
|---|---|
| **Original assertion** (`objectContaining` without `p_answers`) | **34/34 PASS** — completely blind |
| **Corrected assertion** | **FAILS** |

```
AssertionError: expected "spy" to be called with arguments: [ 'upsert_answers', …(1) ]
@@ -4,13 +4,11 @@
       "p_answers": {
         "q-image": {
-         "value": {
-           "path": StringMatching /^proj-1\/candidates\/entity-1\/.*\.png$/,
-         },
+         "value": File {},
```

Probe reverted; 34/34 green again.

## `arrayContaining` deliberately KEPT (3 sites)

All three pair the subset matcher with an explicit cardinality check, which closes the over-inclusion hole. The audit independently classifies these as already-correct.

| Site | Justification |
|---|---|
| `packages/data/src/objects/constituency/constituencyGroup.test.ts:54` | Followed by `expect(found.size).toBe(parentGroup.constituencies.length)`. Source is a `Set`, so ordering is genuinely unspecified — matcher + size is the right shape here, and is the in-repo reference the plan cites. |
| `packages/data/src/root/dataRoot.test.ts:308` | Followed by `expect(elections).toHaveLength(2)`. |
| `packages/data/src/root/dataRoot.test.ts:315` | Followed by `expect(elections).toHaveLength(3)`. |

One further site was found **outside** the plan's grep scope and deliberately left alone: `packages/dev-seed/tests/templates/base.test.ts:254`. See `deferred-items.md` — it is not clear the SE/SW pair is the complete intended sentinel set rather than a required subset, and converting it on assumption risks turning a correct assertion into a brittle one.

## Files Created/Modified

- `packages/data/src/root/dataRoot.test.ts` — 4 sites converted (lines 85/93/101/109)
- `packages/data/src/objects/election/election.test.ts` — 2 sites (121 from the audit; 29 found by grep)
- `packages/data/src/objects/nominations/base/nomination.test.ts` — 1 site (73)
- `packages/data/src/objects/questions/category/questionCategory.test.ts` — 1 site (34)
- `packages/filters/tests/filter.test.ts` — 3 sites (255/260 from the audit; 271 found by grep)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — `p_answers` asserted; matcher's `info` corrected; `objectContaining` tightened to exact args
- `deferred-items.md` — created, 2 out-of-scope findings

## Decisions Made

- **Plain `toEqual(ids)` at all eleven sites.** The plan allowed a sort-both-sides or length-assertion fallback where ordering is genuinely unspecified. It was not needed: every converted assertion passed unchanged against the real implementation on the first run, which empirically establishes deterministic ordering. Adding a sort would have weakened the guard for no benefit, and I did not want to keep `arrayContaining` merely because it was convenient.
- **Converted the two extra sites.** The plan's acceptance criterion requires every surviving `arrayContaining` in `packages/data`/`packages/filters` to be justifiable as "a subset is genuinely the invariant". Neither `election.test.ts:29` nor `filter.test.ts:271` meets that bar, so leaving them would have failed the criterion.
- **F14: exact args instead of `objectContaining`.** The RPC is called with exactly three known parameters. Subset matching there is the same defect class the phase is remediating.
- **F14: broke the implementation, not the test input.** The plan suggested breaking the test's input; breaking the production substitution is the stronger control because it is the actual regression the guard must catch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan named the wrong file path for F14**
- **Found during:** Task 2
- **Issue:** The plan's `<read_first>` and `files_modified` place `supabaseDataWriter.test.ts` under `packages/dev-seed/tests/**`. No such file exists there. The audit (§F14) gives the correct location: `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`.
- **Fix:** Used the audit's path. Consequently the "owning package" for Task 2's `test:unit` gate is `@openvaa/frontend`, not `@openvaa/dev-seed`.
- **Verification:** `yarn workspace @openvaa/frontend test:unit` → **773/773 pass, 54 files**.

**2. [Rule 3 - Blocking] Plan's verification commands do not exist**
- **Found during:** Task 1
- **Issue:** `yarn workspace @openvaa/data test:unit` and the `@openvaa/filters` equivalent both fail with `Couldn't find a script named "test:unit"`. Neither package defines that script; `packages/*` tests run through the root vitest workspace (`vitest.workspace.ts` → `packages/**/vitest.config.ts`).
- **Fix:** Used `./node_modules/.bin/vitest run packages/data packages/filters`, the equivalent scoped invocation. Root `yarn test:unit` was deliberately not run, per the environment constraint.
- **Verification:** Command runs both packages' suites (48 files, 266 tests).

**3. [Rule 1 - Bug] F14's never-used matcher was itself incorrect**
- **Found during:** Task 2
- **Issue:** The audit's suggested fix is "add `p_answers: expectedAnswers` — the matcher already exists; it just needs to be passed to the right function." Applying that literally **fails**: the built matcher claims `info: 'My photo'`, but `_setAnswers` spreads the answer (`{ ...answer, value: { path } }`), so `info` passes through as the localized `{ en: 'My photo' }`. This is a defect in the *matcher*, not the implementation — localized `info` is correct per `LocalizedAnswers`.
- **Fix:** Corrected the matcher to `info: { en: 'My photo' }`. No production code touched.
- **Verification:** Real failure output from the audit's literal fix is quoted above under Task 2. After correction: 34/34 pass, and the negative control still fails as required.
- **Committed in:** `2fe94f933`
- **Note:** This is the clearest available proof of F14's central claim. A matcher that has never been run as an assertion is not merely unused — it drifts silently from reality.

**4. [Rule 2 - Missing coverage] Converted two sites beyond the audit's list**
- **Found during:** Task 1
- **Issue:** `grep` surfaced `election.test.ts:29` and `filter.test.ts:271`, both the same subset-matcher-for-equality defect, neither in §F12's table.
- **Fix:** Converted both. Documented above.
- **Committed in:** `2f1cc3b9f`

---

**Total deviations:** 4 auto-fixed (2 blocking plan-accuracy corrections, 1 bug, 1 missing coverage)
**Impact on plan:** No scope creep. Two deviations were corrections to the plan's own file paths and commands; one was a genuine matcher bug that blocked the plan's stated fix; one closed two sites the plan's own acceptance criterion required.

## Issues Encountered

- **One pre-existing test failure in `@openvaa/data`, out of scope and untouched.** `formatAnswer.test.ts:25` expects the `en-US` rendering `'10/5/2023'` but `formatDateAnswer` falls back to the ambient machine locale (`fi` here), producing `'5.10.2023'`. Present on the baseline run *before* any edit and identical after — confirmed by capturing the baseline first. Logged to `deferred-items.md` rather than fixed, per the scope boundary. It is thematically adjacent (a test whose outcome depends on the environment rather than the code) but it is a false *failure*, not a fake guard.
- **`perl -0777` mangled a regex literal** while editing the F14 matcher: `$/` was interpolated as Perl's input-record-separator variable, truncating `/…\.png$/` to `/…\.png)`. Caught immediately on diff review and repaired with a targeted edit. No trace in the committed result.

## Verification Gates

| Gate | Result |
|---|---|
| `vitest run packages/data packages/filters` | 265 passed, 1 pre-existing unrelated failure (identical to baseline) |
| `yarn workspace @openvaa/frontend test:unit` | **773/773 pass** (54 files) |
| `yarn format:check` | **exit 0** |
| `yarn lint:check` | **exit 0** (2 pre-existing warnings in untouched E2E files) |
| `git status --porcelain` | only `supabase/.temp/cli-latest` — no probe residue |

E2E suite deliberately not run (unit-only plan, per the execution environment).

## Next Phase Readiness

- REAL-02 satisfied and demonstrated rather than asserted.
- The audit's closing suggestion — an ESLint rule banning `toEqual(expect.arrayContaining(x))` outright — is now well-supported: of the 14 occurrences in `packages/`, 11 were defects and 3 were correct only because a sibling length assertion rescued them. A rule requiring the paired cardinality check would have caught all eleven.
- Two items await a decision in `deferred-items.md` (the locale-dependent `formatAnswer` test; the dev-seed sentinel matcher).

## Self-Check: PASSED

- Commits `2f1cc3b9f`, `2fe94f933` — both present in `git log`
- All claimed created/modified files exist on disk
- `p_answers: expectedAnswers` present in the committed dataWriter test
- No `NEGATIVE-CONTROL PROBE` residue anywhere in `apps/` or `packages/`

---
*Phase: 136-real-guards-visual-repair-sweep-remediation*
*Completed: 2026-08-11*

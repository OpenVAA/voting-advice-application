---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 05
subsystem: ui
tags: [svelte5, candidate-app, openvaa-data, isEmptyValue, falsy-guard, type-narrowing]

# Dependency graph
requires:
  - phase: 134-03
    provides: the frontend-side changes this plan's static gates (svelte-check 0/0, lint, format) run on top of
provides:
  - "`getSavedAnswer` on the candidate questions overview guards on `isEmptyValue`, so a saved boolean `false` (and a saved `0`) renders as answered instead of being discarded"
  - "One canonical emptiness predicate, from one import source (`@openvaa/data`), shared by the overview card and `candidateContext`'s completion gating — the two can no longer disagree"
  - "A reproduced, fully-classified repo-wide falsy-guard sweep (4 patterns, 11 distinct hits) recorded as evidence"
affects: [134-06, 134-07]

actuals:
  tokens: 2282
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Answer-emptiness is tested with `isEmptyValue()` from `@openvaa/data` — never with a truthiness test, never with a bare `== null`"

key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte"

key-decisions:
  - "D-12 deviation from the roadmap's literal `== null` wording is deliberate and operator-approved: `isEmptyValue()` keeps the overview card and `unansweredOpinionQuestions` in agreement, whereas `== null` would render a saved `''`/`[]` as answered while the completion counter still called it unanswered"
  - "Imported `isEmptyValue` from `@openvaa/data`, not `@openvaa/core` (D-19), matching the sibling at `candidateContext.svelte.ts:2`"
  - "Added an explicit trailing `|| localizedAnswer == null` clause purely to restore TypeScript narrowing — the predicate returns a plain `boolean`, not a type guard. Unreachable at runtime and commented as such"
  - "No unit test added, per the plan's own verification section and D-14: the helper is module-local to a `+page.svelte`; the behavioural lock is Plan 06's E2E round-trip"

patterns-established:
  - "Falsy-guard sweep as recorded evidence: 4 grep patterns over `apps/` + `packages/`, every hit classified genuine/benign with a one-line reason, reproduced rather than quoted"

requirements-completed: [FIX-03]

coverage:
  - id: D1
    description: "A saved boolean `false` on a candidate opinion question is returned by the overview's saved-answer helper, so the card renders as answered rather than showing an 'Answer this question' CTA"
    requirement: FIX-03
    verification:
      - kind: other
        ref: "grep -c 'isEmptyValue(localizedAnswer?.value)' \"apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte\" → 1"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check → 2683 FILES 0 ERRORS 0 WARNINGS"
        status: pass
      - kind: unit
        ref: "yarn test:unit (root aggregate, 19 tasks) → 1254 tests passed, exit 0"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts step 18.6 — DEFERRED to Plan 06 (D-14/D-21 lock)"
        status: unknown
    human_judgment: true
    rationale: "Static and type gates prove the guard is in place and nothing regressed, but the save→reload→render round-trip that the defect actually lives in is not exercised until Plan 06 flips step 18.6 to `selectChoice(0)`. Until that lands, the behavioural claim is unproven by automation."
  - id: D2
    description: "No falsy guard anywhere in `apps/` or `packages/` swallows a legitimate `false`/`0` on an answer-like value"
    requirement: FIX-03
    verification:
      - kind: other
        ref: "grep -rnE '!\\w+(\\?)?\\.value\\b' apps packages --include='*.ts' --include='*.svelte' | grep -v node_modules | grep -v '\\.test\\.' | wc -l → 0"
        status: pass
      - kind: other
        ref: "4-pattern sweep table in this SUMMARY — 11 distinct hits, 1 genuine (fixed), 10 benign, each inspected in source"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-08-10
status: complete
---

# Phase 134 Plan 05: Boolean Answer Guard (FIX-03) Summary

**`getSavedAnswer` on the candidate questions overview now guards on `isEmptyValue()` from `@openvaa/data` instead of a truthiness test, so a saved boolean `false` renders as answered — and a reproduced 4-pattern repo-wide sweep proves it was the only such guard in the codebase.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-08-10T11:36:30Z
- **Completed:** 2026-08-10T11:45:00Z
- **Tasks:** 2
- **Files modified:** 1 (product), 1 created (this SUMMARY)

## Accomplishments

- **The defect is closed at its single source.** `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` swapped `if (!localizedAnswer?.value)` for `if (isEmptyValue(localizedAnswer?.value) || localizedAnswer == null)`. A candidate who answers a boolean opinion question "No" (`false`) now gets the answer readout and an "edit" CTA instead of a page telling them they never answered.
- **The internal contradiction is gone.** The overview card and `candidateContext`'s `#unansweredOpinionQuestions` / `#profileComplete` now apply the identical predicate to the identical value shape, so a question can no longer count as answered for completion while the card asks the candidate to answer it.
- **The sweep was reproduced, not quoted.** All four documented grep patterns re-run over `apps/` + `packages/`; every one of the 11 distinct hits inspected in source and classified. Result matches `134-RESEARCH.md` §C.5 exactly — 1 genuine (now fixed), 10 benign.
- **Static gates all green:** svelte-check 2683 files / 0 errors / 0 warnings, `yarn lint:check` exit 0, `yarn format:check` exit 0, `yarn test:unit` exit 0 (1254 tests across 19 workspace tasks).

## Task Commits

1. **Task 1: Guard the overview's saved-answer helper with the canonical emptiness predicate** — `2b5666edc` (fix)
2. **Task 2: Re-run and record the repo-wide falsy-guard sweep as evidence** — no code change; the sweep found nothing further to fix. Evidence is the table below, carried by the plan-metadata commit.

**Plan metadata:** see the `docs(134-05)` commit that adds this file.

## Files Created/Modified

- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — added the `isEmptyValue` value import from `@openvaa/data` (line 14) and replaced the truthiness guard in `getSavedAnswer` with the canonical emptiness predicate. 6 insertions, 1 deletion.

## The change, verbatim

```svelte
  function getSavedAnswer(question: AnyQuestionVariant): Answer | undefined {
    const localizedAnswer = userData.savedCandidateData?.answers?.[question.id];
    // Use the canonical emptiness predicate, not a truthiness test (which discarded a saved `false`) nor a bare
    // null check, so this stays consistent with candidateContext's completion gating. `isEmptyValue(undefined)` is
    // `true`, so the first clause already covers a missing `localizedAnswer`; the second is unreachable at runtime
    // and exists only to narrow the type, since the predicate returns a plain `boolean`.
    if (isEmptyValue(localizedAnswer?.value) || localizedAnswer == null) return undefined;
    const { value, info } = localizedAnswer;
    …
```

Behaviour table (from `isEmptyValue`'s definition at `packages/core/src/matching/missingValue.ts:18-26`, re-exported at `packages/data/src/internal.ts:19`):

| Saved `value` | `isEmptyValue` | `getSavedAnswer` returns | Card renders |
|---|---|---|---|
| `false` | `false` | `{ value: false, … }` | **answered** (was: unanswered — the bug) |
| `0` | `false` | `{ value: 0, … }` | **answered** (was: unanswered) |
| `true` / `'text'` / `[1]` | `false` | the answer | answered (unchanged) |
| `undefined` / `null` | `true` | `undefined` | "Answer this question" (unchanged) |
| `''` / `'   '` / `[]` / all-empty object | `true` | `undefined` | "Answer this question" (unchanged) |
| no key for the question | `true` (`isEmptyValue(undefined)`) | `undefined` | "Answer this question" (unchanged, no throw) |

Downstream was already `false`-safe and needed no change: `ensureAnswer` → `ensureValue(false)` (`value == null` is false) → `BooleanQuestion._ensureValue(false)` → `ensureBoolean(false)` → `false`, and `isMissingValue(false)` is `false`.

## Task 2 — repo-wide falsy-guard sweep (D-13/D-20), reproduced

Patterns re-run over `apps` + `packages`, `--include='*.ts' --include='*.svelte'`, excluding `node_modules` and `*.test.*`.

### Pattern counts — reproduced vs. `134-RESEARCH.md` §C.5

| # | Pattern | Research (pre-fix) | Reproduced pre-fix | Reproduced post-fix |
|---|---|---|---|---|
| 1 | `!\w+(\?)?\.value\b` | 1 | **1** ✅ | **0** |
| 2 | `(if\|\?\|&&\|\|\|\|return\|!)\s*!?(\w+\.)*answers\?*\.?\[[^]]+\]\??(\.value)?\b` minus `isEmptyValue`/`isMissingValue` lines | 1 | **1** ✅ | **1** (benign) |
| 3 | `if \(!\w*[Aa]nswer` | 10 | **10** ✅ | **9** |
| 4 | `\.value \|\|` | 0 | **0** ✅ | **0** |

**No discrepancy with research.** Pre-fix counts reproduce exactly. The post-fix deltas in patterns 1 and 3 are both accounted for by the single Task-1 line: `if (!localizedAnswer?.value)` matched both patterns (it was double-counted), so fixing it drops pattern 1 from 1→0 and pattern 3 from 10→9. Verified by running all four patterns against the pre-fix blob (`git show HEAD~1:…/questions/+page.svelte`), which hits patterns 1 and 3 at line 58 and neither 2 nor 4. Distinct sites across all patterns: **11** (1 genuine + 10 benign) — matching research's "1 genuine hit, 10 benign".

### Classification of every hit — all 11, each inspected in source

| # | Site | Guard | Verdict + reason |
|---|---|---|---|
| 1 | `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` | `if (!localizedAnswer?.value)` | 🔴 **GENUINE — the FIX-03 site, and the only one. FIXED in `2b5666edc`.** |
| 2 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts:108` | `if (proxy) return proxy.answers[question.id]?.value;` | benign — guards the *proxy object* from a `Map.get`, then returns the value including `false`. The collected values are filtered with `.filter((v) => v != null)` (line 112), which is already `false`-safe. |
| 3 | `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts:274` | `if (!updatedAnswers) throw …` | benign — guards the `dataWriter.updateAnswers` *response object*, not an answer value. |
| 4 | `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:90` | `if (!hasAllAnswers)` | benign — `hasAllAnswers` is a `boolean` from `.every((q) => n.entity.getAnswer(q) != null)`; the inner test is already `!= null`. |
| 5 | `apps/frontend/src/lib/api/utils/parseAnswers.ts:14` | `if (!answers) return undefined;` | benign — guards the whole `LocalizedAnswers \| null` *container*. |
| 6 | `apps/frontend/src/lib/api/utils/parseAnswers.ts:17` | `if (!answer) return;` | benign — guards the per-entry answer *object*; `const { info, value } = answer` follows and a `value` of `false` flows through untouched. |
| 7 | `packages/filters/src/filter/base/filter.ts:65` | `if (!hasAnswers(entity)) throw …` | benign — `hasAnswers` is a boolean type guard on the *entity*; the value read on the next line uses `?.value` with no falsy test. |
| 8 | `packages/argument-condensation/src/core/utils/condensation/getAndSliceComments.ts:55` | `if (!answer?.info?.trim())` | benign — tests the free-text `info` field, never `value`. Skipping a blank comment is correct domain behaviour. **Deliberately left alone** per the plan. |
| 9 | `packages/data/src/objects/questions/base/question.ts:97` | `if (!answer) return undefined;` | benign — guards the `Answer` *object* (objects are never falsy); `ensureValue` on the next line handles `false` correctly. |
| 10 | `packages/dev-seed/src/supabaseAdminClient.ts:268` | `if (!answersByExtId) continue;` | benign — guards the `Record<string, unknown> \| undefined` *lookup map*. |
| 11 | `packages/dev-seed/src/supabaseAdminClient.ts:302` | `if (!answersByExtId) continue;` | benign — same lookup map, second loop. |

**Sweep conclusion: 0 genuine `false`/`0`-swallowing guards on answer-like values remain anywhere in `apps/` or `packages/`.** Task 2 produced no code change — the expected outcome per the plan.

## Decisions Made

- **`isEmptyValue()` over `== null` (D-12, operator-approved roadmap deviation).** See the Deviations section below.
- **Import from `@openvaa/data`, not `@openvaa/core` (D-19).** The predicate is *defined* in `@openvaa/core` and re-exported by `@openvaa/data` at `internal.ts:19`. The sibling completion-gating path imports it from `@openvaa/data` (`candidateContext.svelte.ts:2`), and the file already imports types from `@openvaa/data` — so this adds one value import rather than a second import source in the same feature area. The existing type-only import was left untouched (`verbatimModuleSyntax`).
- **No unit test (D-14).** The plan's own `<verification>` states this: `getSavedAnswer` is module-local to a `+page.svelte` and would need extraction to be testable. The behavioural lock is Plan 06's E2E round-trip on `candidate-journey.spec.ts` step 18.6.
- **Svelte 5 context rule respected.** No reactive accessor was destructured; the file's existing `candCtx.X` property reads were not touched, and `appSettings` remains a `$derived(candCtx.appSettings)` alias exactly as it was.

## Deviations from Plan

### 1. [Documented, pre-approved] `isEmptyValue()` instead of the roadmap's literal `== null`

Not a deviation from *this plan* — the plan mandates it — but a deviation from the ROADMAP/REQUIREMENTS wording that must be recorded here per D-12.

- **What the roadmap says:** `questions/+page.svelte:58` should get an explicit `== null` check.
- **What was implemented:** `isEmptyValue(localizedAnswer?.value)`.
- **Why:** with `== null`, a saved `''` or `[]` would begin rendering as **answered** on the overview card while `candidateContext`'s `#unansweredOpinionQuestions` — which uses `isEmptyValue` — still counted it **unanswered**. That trades one internal inconsistency for another. `isEmptyValue` keeps the card and the completion gating in exact agreement while still widening the guard strictly to `false` and `0`.
- **Status:** operator-approved (D-12). Plan 07 corrects the ROADMAP/REQUIREMENTS wording.

### 2. [Rule 3 — Blocking] Restored TypeScript narrowing lost with the predicate swap

- **Found during:** Task 1, on the first `yarn workspace @openvaa/frontend check` run.
- **Issue:** the original `if (!localizedAnswer?.value)` narrowed `localizedAnswer` to non-nullish as a side effect of truthiness narrowing through the optional chain. `isEmptyValue()` returns a plain `boolean`, not a type predicate, so that narrowing vanished and the next line's `const { value, info } = localizedAnswer;` produced 2 svelte-check errors ("Property 'value' does not exist on type '… | null | undefined'", same for `info`).
- **Fix:** appended `|| localizedAnswer == null` to the guard. Ordering matters — the predicate clause stays first so the plan's acceptance grep for `isEmptyValue(localizedAnswer?.value)` still holds and the forbidden `if (!localizedAnswer` shape is not reintroduced. The added clause is **unreachable at runtime** (if `localizedAnswer` is nullish, `localizedAnswer?.value` is `undefined` and `isEmptyValue(undefined)` is `true`, short-circuiting), and the in-code comment says exactly that so a reviewer does not read it as a redundant belt-and-braces check.
- **Verification:** svelte-check back to 0 errors / 0 warnings; all five of Task 1's acceptance greps still pass.
- **Committed in:** `2b5666edc` (part of the Task 1 commit).

---

**Total deviations:** 1 pre-approved roadmap-wording deviation (D-12) + 1 auto-fixed blocking issue (Rule 3).
**Impact on plan:** none on scope. The narrowing clause adds one term to one line; the diff is still 6 insertions / 1 deletion, inside the plan's "fewer than 10 lines" bound.

## Issues Encountered

- **svelte-check narrowing failure on first run** — resolved as documented above. Worth flagging for future work: swapping a truthiness test for a non-predicate boolean helper silently drops TS narrowing, and `isEmptyValue` is not declared as a type guard. Making it one (`value is null | undefined | …`) is not straightforward because it also returns `true` for non-nullish values like `''` and `[]`, so the narrowing workaround is the right local answer.
- **`yarn test:unit` root aggregate passed** (exit 0, 19/19 tasks, 1254 tests) — the `@openvaa/dev-seed` wall-clock assertion flagged in the execution brief did **not** reproduce on this run; dev-seed reported 444/444 passed inside the aggregate. Nothing was done to it.
- Pre-existing lint warnings (2 in `tests/`, 1 in `candidateContext.svelte.test.ts`) are untouched and unrelated; `lint:check` exits 0 regardless.

## Verification Results

| Gate | Command | Result |
|---|---|---|
| Guard present | `grep -c 'isEmptyValue(localizedAnswer?.value)' <file>` | **1** ✅ |
| Predicate referenced ≥2× | `grep -c 'isEmptyValue' <file>` | **3** (import, comment, call site) ✅ |
| Not imported from core | `grep -cE "^\s*import .*'@openvaa/core'" <file>` | **0** ✅ |
| Old guard gone | `grep -cE 'if \(!localizedAnswer' <file>` | **0** ✅ |
| Diff size < 10 lines | `git diff --stat` | 6 insertions, 1 deletion ✅ |
| Type/compile | `yarn workspace @openvaa/frontend check` | 2683 files, **0 errors, 0 warnings** ✅ |
| Lint | `yarn lint:check` | exit **0** ✅ |
| Format | `yarn format:check` | exit **0**, "All matched files use Prettier code style!" ✅ |
| Unit (frontend) | `yarn workspace @openvaa/frontend test:unit` | 54 files, **773 passed**, exit 0 ✅ |
| Unit (root aggregate) | `yarn test:unit` | 19/19 tasks, **1254 passed**, exit 0 ✅ |
| Sweep clean | pattern-1 count over `apps`+`packages` | **0** ✅ |
| No file deletions | `git diff --diff-filter=D HEAD~1 HEAD` | none ✅ |

E2E was deliberately **not** run — Plan 06 owns the E2E lock for this fix.

## TDD Gate Compliance

Task 1 carries `tdd="true"`, but no `test(...)` RED commit was made. This is **intentional and plan-sanctioned**, not a skipped gate: the plan's own `<verification>` block states "no unit test is added here because the helper is module-local to a `+page.svelte` and would need extraction to be testable (D-14)", and D-14 assigns the behavioural proof to Plan 06's E2E round-trip. The `tdd="true"` attribute on the task is inconsistent with the plan's verification section; the verification section was followed.

## Known Stubs

None. No placeholder values, no TODO/FIXME introduced, no component left without a data source.

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or schema change. The change is one predicate swap inside a module-local helper on an already-authenticated `(protected)` route; the route-group guard was untouched (T-134-13 disposition `accept` holds). T-134-11 is mitigated by this plan; T-134-12's widening is bounded to `false`/`0` because `isEmptyValue` still reports `''`, whitespace-only strings, `[]` and all-empty objects as empty — and the sibling completion gating uses the identical predicate, so the two paths cannot diverge. No packages installed; `yarn.lock` untouched (T-134-SC).

## Next Phase Readiness

- **Plan 06 can proceed immediately.** The product fix it locks is in place on `feat-gsd-roadmap` at `2b5666edc`. The edit it needs is `candidate-journey.spec.ts` step 18.6: `selectChoice(1)` → `selectChoice(0)`, replace the 8-line workaround comment (`:887-893`) with a FIX-03 lock note, keep both existing round-trip assertions, and add the discriminating assertion that the card action reads `editAnswer` rather than `answerQuestion`. Those assertions fail on the pre-`2b5666edc` build, which is what makes them a lock.
- **Plan 07 must correct the roadmap wording** — ROADMAP and REQUIREMENTS still prescribe `== null` for FIX-03; the shipped implementation uses `isEmptyValue()` per D-12.
- **No blockers.**

---
*Phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure*
*Completed: 2026-08-10*

## Self-Check: PASSED

- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — FOUND
- `.planning/phases/134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure/134-05-SUMMARY.md` — FOUND
- Commit `2b5666edc` — FOUND in `git log --all`
- `yarn format:check` with this SUMMARY present — exit 0, file not flagged

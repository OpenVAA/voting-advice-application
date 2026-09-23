---
phase: 159-component-context-consolidation
plan: 07
subsystem: ui
tags: [svelte5, runes, contexts, dataroot, reactivity, refactor, typescript, vitest]

# Dependency graph
requires:
  - phase: 159-06
    provides: the contexts/utils/ destination convention (direct file paths, no barrel) established by the reactiveHandle.type move
  - phase: 159-01
    provides: Guard A, the committed source scan forbidding a derived alias over the identity-stable data root, and the cold-entry negative control extended to cover exactly the two routes this extraction disturbs
  - phase: 117
    provides: the direct-read codemod and the CLAUDE.md version-bridge carve-out this plan had to preserve rather than reintroduce
provides:
  - One shared rollup utility (`contexts/utils/questionRollup.ts`) replacing the twice-written question-category rollup, parameterising all three measured differences
  - A seven-case unit test pinning the extracted contract, including the empty-input boundary and the entity-type-scope propagation case
  - The array-content equality helper relocated to the bottom of the voter context with its regression comment attached
affects: [159-11, any phase touching the voter or candidate orchestrator question chain]

actuals:
  tokens: 18278   # chars/4 over the four changed files (73111 chars). The realized-diff figure is 6761 (27042 chars/4).
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Rollup extraction with the reactive read left at the call site: the identity-stable data root is read inside the caller's own effect body and handed to a plain, rune-free, module-state-free function BY VALUE, so the utility never re-enters a reactive scope"
    - "Structural-generic utility signature: the utility constrains its category parameter structurally and derives the question type from the category's own return type, so the real `QuestionCategory`/`AnyQuestionVariant` flow through unwidened AND a plain-object test fixture typechecks without a cast"
    - "Sigil-free rune names in a doc comment whose file is under a no-rune acceptance scan, stated in-place, so the scan stays meaningful instead of the scan being loosened"

key-files:
  created:
    - apps/frontend/src/lib/contexts/utils/questionRollup.ts
    - apps/frontend/src/lib/contexts/utils/questionRollup.test.ts
  modified:
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts

key-decisions:
  - "The utility is generic over the category type with the question type derived from `ReturnType<TCategory['getApplicableQuestions']>[number]`, rather than typed against the concrete `DataRoot`. The concrete signature the research recommended would have forced an `as unknown as DataRoot` cast in every test fixture; the structural form keeps both call sites' concrete types flowing and lets the fixtures be honest plain objects."
  - "The applicability targets object is built ONCE and reused for every category call. That is the mechanism that makes the T-159-22 threat (the entity-type scope reaching one of its two call sites and missing the other) unrepresentable rather than merely tested."
  - "The category-inclusion filter still calls `getApplicableQuestions(...).length > 0` WITHOUT the question predicate, exactly as both originals did. A voter category whose applicable questions are all hidden therefore stays in the category list and contributes zero questions. This is preserved behaviour, not an oversight."
  - "`sameRefs` went to the bottom of its own file rather than to `contexts/utils/`. Criterion 5 permits either; both call sites are file-local, so the file bottom is the smaller change and keeps the helper next to the only code that needs it."
  - "Three of Task 2's acceptance greps were miscounted in the plan. They were measured and reported rather than satisfied by editing the code to fit a wrong number."

patterns-established:
  - "Pattern 1: a shared utility extracted out of two reactive callers takes its reactive input BY VALUE, read at the call site inside the existing tracking scope — never a derived alias, never a thunk it would invoke later"
  - "Pattern 2: when an acceptance scan asserts a file contains no rune, that file's own prose spells the rune names without their sigil and says so, rather than the scan being widened to tolerate prose"

requirements-completed: []  # REVIEW-CMP-05 is also declared by 159-11, which has no SUMMARY yet; the shared-ID gate (#2388) holds it.

coverage:
  - id: D1
    description: "One shared rollup utility that is pure, synchronous and holds no module-level mutable state, so two context classes calling it in the same tick cannot interleave and neither call can observe the other's intermediate state."
    requirement: REVIEW-CMP-05
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/utils/questionRollup.test.ts (7 cases, all pass)"
        status: pass
      - kind: other
        ref: "grep -cE '\\$state|\\$derived|\\$effect' questionRollup.ts -> 0; grep -cE '^(let|var) ' -> 0; grep -c 'export function rollUpQuestionCategories' -> 1; filename carries no rune-module suffix"
        status: pass
    human_judgment: false
  - id: D2
    description: "The data root is read once inside each caller's existing effect body and passed by value; no derived alias and no thunk is introduced, so the version-bridge dependency survives the extraction."
    requirement: REVIEW-CMP-05
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts (Guard A, green in the 86-file run)"
        status: pass
      - kind: other
        ref: "grep -c 'const dr = this.#dataRoot' -> 4 (candidate) and 3 (voter), byte-identical to `git show HEAD:<file>` before the change, so no read moved; grep -c 'rollUpQuestionCategories({' -> 1 per file"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e --grep \"cold-entry\" -> 7 passed (4 cold-entry cases plus 3 setup/teardown), 0 failed, 0 did-not-run; re-run after Task 3"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two rollups' three real differences are parameterised rather than collapsed: an entity-type scope reaching BOTH category calls, an optional question predicate applied to BOTH question kinds, and the question-block computation left out of the utility entirely."
    requirement: REVIEW-CMP-05
    verification:
      - kind: unit
        ref: "questionRollup.test.ts#passes the entity-type scope into BOTH the applicability check and the applicable-question lookup; #omits the entity-type scope when the caller supplies none; #excludes filtered questions from both the informational and the opinion lists"
        status: pass
      - kind: other
        ref: "block computation still present in both contexts: `nextBlocks` in candidateContext's rollup effect and `#selectedQuestionBlocks` in voterContext's separate effect; neither appears in questionRollup.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The opinion-matchability guard survives the move verbatim, status code and message shape included, so a non-matchable opinion question still fails loudly."
    requirement: REVIEW-CMP-05
    verification:
      - kind: unit
        ref: "questionRollup.test.ts#raises the server error when an opinion category holds a non-matchable question (asserts status 500 and the exact body.message)"
        status: pass
      - kind: other
        ref: "grep -c 'error(500' questionRollup.ts -> 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The array-content equality helper sits at the bottom of its own file with the multi-line comment that records the filter-badge navigation regression it guards, and the move is a pure relocation."
    requirement: REVIEW-CMP-05
    verification:
      - kind: other
        ref: "git diff --numstat -> 7 added / 7 removed for voterContext.svelte.ts; grep -c 'sameRefs' -> 3 (unchanged); grep -n 'sameRefs' | tail -1 -> the declaration at :546; grep -c 'filter badge' -> 1"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit -> 86 files / 1571 tests / 0 failed"
        status: pass
    human_judgment: false
  - id: D6
    description: "End-to-end behaviour of the voter and candidate question chains after both orchestrator contexts were restructured."
    verification:
      - kind: e2e
        ref: "yarn test:e2e --grep \"cold-entry\" -> 7 passed (the plan's <verification> block scopes the E2E gate to this subset)"
        status: pass
    human_judgment: true
    rationale: "Only the 4-case cold-entry control was run, which is what the plan's verification block requires. 159-CONTEXT.md § O5 budgets ONE full-suite E2E run at phase level (plan 159-11), so the wider question-flow, results and candidate-profile behaviour that these two contexts feed is not measured by this plan and must be confirmed by that phase-level run."

# Metrics
duration: 14 min
completed: 2026-09-02
status: complete
---

# Phase 159 Plan 07: Shared Question-Category Rollup Summary

**One `rollUpQuestionCategories` utility replaces the twice-written question-category rollup in the voter and candidate orchestrator contexts, parameterising the entity-type scope and the hidden-question predicate while the data root stays read inside each caller's own effect body and travels by value.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-02T21:45:00Z
- **Completed:** 2026-09-02T21:58:28Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Extracted the duplicated rollup into `contexts/utils/questionRollup.ts`: a plain module with no rune, no module-level mutable binding, and no reactive read of its own, imported by direct file path with no barrel.
- Parameterised all three measured differences. The entity-type scope is built into a single targets object reused by every category call, so it cannot reach one call site and miss the other. The hidden-question predicate is supplied by the voter caller and applied to both question kinds. The question-block computation stays in each context, because the candidate app builds blocks from every opinion category and the voter app from a category-filtered, first-question-reordered subset.
- Kept the reactivity property that made the extraction risky. `const dr = this.#dataRoot` still sits where it always did inside each effect body, and the counts (4 in the candidate context, 3 in the voter context) are byte-identical to their pre-change values, so no read left a tracking scope. Guard A and the four-case cold-entry control are both green.
- Carried the opinion-matchability guard across verbatim and strengthened its test: the assertion now pins the 500 status and the exact message string rather than a substring that `HttpError` never exposed.
- Relocated `sameRefs` and its regression comment to the bottom of the voter context as a pure 7-for-7 relocation, both call sites untouched.

## Task Commits

1. **Task 1: Lock both rollups' outputs with a unit test before extracting anything** - `bbc8cb381` (test)
2. **Task 2: Create the shared rollup utility and call it from inside both effect bodies** - `36d04ccf7` (refactor)
3. **Task 3: Move the array-content equality helper with its regression comment** - `7b637955f` (refactor)

## Files Created/Modified

- `apps/frontend/src/lib/contexts/utils/questionRollup.ts` - The shared rollup. Takes the data root by value plus the selected elections and constituencies, an optional entity-type scope and an optional question predicate; returns the two category groups and the two question lists.
- `apps/frontend/src/lib/contexts/utils/questionRollup.test.ts` - Seven cases: the info/opinion split, the entity-type scope reaching both category calls, the scope's absence when omitted, the predicate applied to both question kinds, exclusion of categories with no applicable questions, the matchability server error, and the empty-collection boundary.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` - Rollup effect now destructures the shared utility's result; block computation retained; the now-unused `QUESTION_CATEGORY_TYPE` import dropped.
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` - Same, with the hidden-question predicate passed in; `sameRefs` and its comment moved to the file bottom; the now-unused `QUESTION_CATEGORY_TYPE` import dropped.

## Decisions Made

- **Structural generics over a concrete `DataRoot` parameter.** The research's recommended signature typed `dataRoot: DataRoot`, which would have forced an `as unknown as DataRoot` cast into every fixture. The utility instead constrains its category parameter structurally and derives the question type from the category's own return type, so `QuestionCategory` and `AnyQuestionVariant` flow through unwidened at both call sites while plain-object fixtures typecheck as themselves.
- **One targets object, built once.** T-159-22 (the entity-type scope reaching only one of its two call sites) is the easiest difference to drop silently. Building the targets once and reusing it makes the failure unrepresentable rather than merely detected.
- **Category inclusion is still computed without the question predicate.** Both originals decided category membership from the unfiltered applicable-question count, so a voter category whose applicable questions are all hidden stays listed and contributes nothing. Preserved deliberately.
- **`sameRefs` to the file bottom, not to `contexts/utils/`.** Criterion 5 permits either. Both call sites are file-local, so the file bottom is the smaller change and keeps the helper adjacent to the only code that needs it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The matchability assertion could not observe the error it was written to catch**

- **Found during:** Task 2 (first green run of the Task 1 test)
- **Issue:** The Task 1 case asserted `toThrow(/opinion-broken/)`. SvelteKit's `error()` throws an `HttpError` whose text lives under `body.message`, not `message`, so vitest compared the regex against `''`. The case would have stayed red no matter how correct the guard was, and a laxer rewrite would have made it pass without observing anything.
- **Fix:** Replaced with an explicit catch plus `toMatchObject({ status: 500, body: { message: '…' } })`, which pins both the status code and the exact message string. Strictly stronger than the original intent and matches what T-159-19 asks the guard to prove.
- **Files modified:** `apps/frontend/src/lib/contexts/utils/questionRollup.test.ts`
- **Verification:** 7/7 cases pass; temporarily removing the guard from the utility reddens this case on the status assertion.
- **Committed in:** `36d04ccf7`

**2. [Rule 3 - Blocking] `QUESTION_CATEGORY_TYPE` became an unused import in both contexts**

- **Found during:** Task 2
- **Issue:** The category-type split moved into the utility, leaving the import dangling. `yarn lint:check` failed with `unused-imports/no-unused-imports` in both files.
- **Fix:** Dropped the specifier from the candidate context's `@openvaa/data` import and removed the voter context's now-empty `@openvaa/data` value import line.
- **Files modified:** both context files
- **Verification:** `yarn lint:check` exits 0; `yarn typecheck` exits 0.
- **Committed in:** `36d04ccf7`

**3. [Rule 3 - Blocking] The house `func-style` rule rejected two arrow-const helpers**

- **Found during:** Task 2
- **Issue:** `applicableQuestions` in the utility and `notHidden` in the test were written as arrow constants; ESLint's `func-style` requires function declarations.
- **Fix:** Converted both to function declarations. No behaviour change; `applicableQuestions` still closes over the shared targets object and the caller's predicate.
- **Files modified:** `questionRollup.ts`, `questionRollup.test.ts`
- **Verification:** `yarn lint:check` exits 0.
- **Committed in:** `36d04ccf7`

**4. [Plan-document defect - measured, not satisfied by editing] Three of Task 2's acceptance greps are miscounted**

- **Found during:** Task 2 acceptance verification
- **Issue:** Three criteria specify counts that no correct implementation could produce.
  - `grep -c 'const dr = this.#dataRoot'` was specified to return **1** per file. It returns **4** in the candidate context and **3** in the voter context. All of those occurrences are pre-existing reads belonging to other effects and one `$derived.by`; the rollup effect is only one of them.
  - `grep -c 'rollUpQuestionCategories'` was specified to return **1** per file. It returns **2**, because `grep -c` counts matching lines and both the import line and the call line match.
- **Fix:** Neither the code nor the criteria were bent to fit. The criteria's intent was verified directly instead: the `const dr = this.#dataRoot` counts are **byte-identical to their pre-change values** (confirmed against `git show HEAD:<file>` for both files), which proves no data-root read moved out of a tracking scope — the property the criterion was reaching for. The call-site count is exactly **1** per file, measured with `grep -c 'rollUpQuestionCategories({'`.
- **Files modified:** none
- **Verification:** counts recorded above; Guard A and the cold-entry control both green, which are the two independent signals for the same property.
- **Committed in:** n/a (documentation)

**5. [Rule 2 - Missing critical] The utility's own doc comment would have voided its no-rune acceptance scan**

- **Found during:** Task 2 acceptance verification
- **Issue:** `grep -cE '\$state|\$derived|\$effect' questionRollup.ts` is specified to return 0. The first draft's header explained the forbidden shapes using the literal rune names, so the scan returned 1 — matching prose, not a rune. Loosening the scan to tolerate comments would have made it a scan that a future rune could hide behind.
- **Fix:** The header now spells the rune names without their leading sigil and states in-place why, so the scan remains a genuine proof that the file carries no rune. The explanation's precision is unchanged. This mirrors the discipline Guard A already uses, where the scan excludes its own file and asserts that the exclusion excludes exactly one file.
- **Files modified:** `apps/frontend/src/lib/contexts/utils/questionRollup.ts`
- **Verification:** `grep -cE '\$state|\$derived|\$effect' questionRollup.ts` -> 0.
- **Committed in:** `36d04ccf7`

---

**Total deviations:** 5 (1 bug, 2 blocking, 1 missing-critical, 1 documented plan-document defect)
**Impact on plan:** No scope change. Four of the five are mechanical consequences of the extraction; the fifth is a measurement correction recorded rather than papered over.

## Issues Encountered

- **The dev server was restarted, and it binds 5173 rather than the 5273 the wave brief recorded.** The 5273 server was a one-off `FRONTEND_PORT=5273 yarn dev`; a fresh root `yarn dev` binds 5173, and Playwright's preflight resolves the same way, so the two agree. The preflight printed `E2E PREFLIGHT OK` against this checkout. The restart was deliberate: this plan edits large context modules, and the recorded HMR hazard is that Vite serves stale SSR modules mid-debug, which would have made a green cold-entry run untrustworthy. **Next wave: the dev server is on 5173.**
- A pre-existing `lint-staged automatic backup` entry sits in the shared stash stack. It was left untouched, per the cross-worktree stash prohibition.
- A pre-existing lint WARNING (`'question' is assigned a value but never used` in `candidateContext.svelte.test.ts:19`) is out of this plan's scope and was not touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REVIEW-CMP-05's three sub-items are all delivered: `reactiveHandle.type.ts` moved in 159-06, the duplicated rollup is now one shared utility, and `sameRefs` sits at the bottom of its file. 159-11 can close the requirement.
- The phase-level full-suite E2E run (159-11, per CONTEXT § O5) is the only outstanding gate for this plan's work; D6 is flagged `human_judgment: true` accordingly.
- No blockers.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-02*

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/utils/questionRollup.ts` — FOUND on disk.
- `apps/frontend/src/lib/contexts/utils/questionRollup.test.ts` — FOUND on disk.
- Commits `bbc8cb381`, `36d04ccf7`, `7b637955f` — all FOUND in `git log --oneline --all`.
- Plan-level verification re-run at close: unit 86 files / 1571 tests / 0 failed; `yarn typecheck` exit 0; `yarn lint:check` exit 0; `yarn test:e2e --grep "cold-entry"` 7 passed / 0 failed / 0 did-not-run; `grep -cE '\$state|\$derived|\$effect' questionRollup.ts` -> 0.

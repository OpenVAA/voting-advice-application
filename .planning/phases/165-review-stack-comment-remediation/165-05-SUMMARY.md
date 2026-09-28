---
phase: 165-review-stack-comment-remediation
plan: 05
subsystem: experimental-packages
tags: [argument-condensation, llm, question-info, jsdoc, comment-hygiene, vitest]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments: hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, assert-absent.sh"
provides:
  - "Condenser.run() returns a flat Array<Argument> on every pipeline, MAP- and ITERATE_MAP-terminated included, with no cast"
  - "handleQuestion tests assert the flat shape instead of flattening it themselves"
  - "Every collapsed @example in argument-condensation and llm restored as a ts fence, all 24 typechecked against the package sources"
  - "generateBoth composed-request assertions (type + joined choice labels per question)"
  - "hygiene-reads/165-05.tsv covering all 19 files this plan changed"
affects: [165-24, 165-36, frontend condenseArguments consumer]

actuals:
  tokens: 16813
  tasks: 3
  commits: 6
plan_head_before: 049c8a28d019599bc614467d850b4ec26e25bf14
plan_head_after: af48443d0f126fb5949b10476c4997af73575fa2

tech-stack:
  added: []
  patterns:
    - "JSDoc @example bodies go inside a ```ts fence so the comment-hygiene lint's CODE_FENCE exclusion keeps their line breaks"
    - "Examples are verified by extracting each fence into a throwaway .ts file in the package, declaring the placeholders, and running tsc with paths mapped to the workspace sources"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-05.tsv
  modified:
    - packages/argument-condensation/src/core/condensation/condenser.ts
    - packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
    - packages/argument-condensation/src/api.ts
    - packages/argument-condensation/src/core/types/condensation/condensationInput.ts
    - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
    - packages/llm/src/prompts/promptRegistry.ts
    - packages/llm/src/prompts/index.ts
    - packages/question-info/tests/questionTypes.test.ts
    - "11 further argument-condensation / llm files (comments only; see Deviations)"
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "Condenser.run() tracks the last step's output separately and flattens it with flat(), which is a no-op on an already flat list; validatePlan guarantees at least one step, so no cast or VAAComment branch is needed"
  - "The RED test and the GREEN fix for C-4080487670 share one commit, so the thread is answerable with a single link (D-05); the RED run is quoted below"
  - "Restored examples use the tip API, not the stack-base text verbatim: LLMProvider (OpenAIProvider no longer exists), uppercase operation names, required prompt ids, choice labels, answer.info, throwIfVarsMissing"
  - "The same reflow collapse in 11 more files of the two packages was fixed in a separate Hygiene: D-04 commit, because the plan's done criterion claims every example in both packages is copyable"
  - "The generateBoth assertion commit and the test files' comment rewrite are separate commits, so C-4080487730's link shows only the assertion"

patterns-established:
  - "Example typecheck harness: python extractor over ```ts fences + a tsconfig with paths to ../src, run from a scratch directory inside the package and deleted afterwards"

requirements-completed: [165-SC2, 165-SC3, C-4080487670, C-4080487730, C-4080487775, C-4080487819, C-4080487851, C-4080487884, C-4080487924]

coverage:
  - id: D1
    description: "Condenser.run() returns a flat argument list on MAP-terminated pipelines; the test fails if an element is ever an array"
    requirement: "C-4080487670"
    verification:
      - kind: unit
        ref: "packages/argument-condensation/tests/condensation/condenseQuestions.test.ts (RED before the fix: 3 failed on the no-nested-array assertion; GREEN after: 30/30)"
        status: pass
      - kind: other
        ref: "bash scripts/assert-absent.sh 'arguments\\.flat\\(\\)' -- packages/argument-condensation/tests (exit 0); grep -c 'currentData as Array<Argument>' condenser.ts = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The six threaded files' @example blocks are fenced, multi-line and copyable, and typecheck against the current API"
    requirement: "C-4080487775"
    verification:
      - kind: other
        ref: "node scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE <5 files> (exit 0) and code-identity.mjs 583b4ac82 WORKTREE condenser.ts (exit 0)"
        status: pass
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --files <6 files> (exit 0); node scripts/assert-comment-hygiene.mjs (0 violations); assert-absent.sh on the collapse pattern (exit 0)"
        status: pass
      - kind: other
        ref: "tsc over the 10 extracted example files from the 6 threaded files (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The mixed-operation test asserts generateBoth's composed prompt carries each question's type and joined choice labels"
    requirement: "C-4080487730"
    verification:
      - kind: unit
        ref: "packages/question-info/tests/questionTypes.test.ts#should handle combination of all three question types (22/22 green; red under a scratch rename of the choices placeholder that the old test passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All 19 files this plan changed are hygiene-clean with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --check-reads --files <8 planned files> (exit 0) and over all 19 (exit 0)"
        status: pass
    human_judgment: false

duration: 19min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 05: Experimental-Package Review Fixes Summary

**`Condenser.run()` now returns a flat argument list on every pipeline, with a test that fails if the result ever nests again. Every collapsed `@example` in `argument-condensation` and `llm` is a typechecked ```` ```ts ```` fence again, and the `generateBoth` prompt placeholders are covered by an assertion that a scratch placeholder rename turns red.**

## Performance

- **Duration:** about 19 min
- **Started:** 2026-09-27T17:54:54Z
- **Completed:** 2026-09-27T18:13:32Z
- **Tasks:** 3 of 3
- **Files modified:** 19 source/test files, plus the read log and `deferred-items.md`

## Accomplishments

- **Flat result contract (C-4080487670).** `run()` records the last step's output (`CondensationStepResult['arguments']`) and flattens it once, before both `setFinalArguments` and `data.arguments`. Both `currentData as Array<Argument>` casts are gone. The frontend's `data.arguments.map(({ id, text }) => …)` now receives objects rather than arrays.
- **Six threaded files' examples restored (C-4080487775, -819, -851, -884, -924).** Each example is a ```` ```ts ```` fence, one statement per line. The identifiers match the tip API, because the stack-base text itself no longer compiled (`OpenAIProvider`, lowercase `'map'`, missing prompt ids, `llmModel`/`modelTPMLimit` options, `comment` instead of `info`, `strict` instead of `throwIfVarsMissing`).
- **Eleven further files in the same two packages.** Their examples had the same collapse (`parseWaitTimeFromError`'s example was entirely inside a `//`), so they are fenced too. That makes the done criterion true for the whole of both packages.
- **generateBoth coverage (C-4080487730).** The two-operation test asserts that each prompt came from `generateBoth` (`Task 2: Term Definition Generation`), and that each carries `QUESTION_TYPE.*` and the `', '`-joined choice labels.
- **Hygiene.** The test files' comments no longer carry planning ids, log names, line anchors, history or do-not-simplify warnings. Reads are recorded for all 19 files.

## Task Commits

1. **Task 1: flat final-argument contract (tracer)** — `583b4ac82` (fix)
2. **Task 2: fenced JSDoc examples, six threaded files** — `ef49309bc` (docs)
   - Deviation, same class, eleven more files — `949e5e9bf` (docs, `Hygiene: D-04`)
3. **Task 3: generateBoth assertion** — `9b415cb1f` (test)
   - Test-file comment hygiene — `756aaaa0b` (docs, `Hygiene: D-04`)
   - Hygiene read log and deferred items — `af48443d0` (chore, `Hygiene: D-04`)

## Review-comment dispositions

| Comment | Disposition | Commit subject | Evidence command | Draft reply |
|---|---|---|---|---|
| C-4080487670 | fix | `583b4ac82` fix(165-05): return a flat argument list from Condenser.run() on every path | `yarn workspace @openvaa/argument-condensation test:unit` (30/30); `bash scripts/assert-absent.sh 'arguments\.flat\(\)' -- packages/argument-condensation/tests` (exit 0) | Fixed in 583b4ac82: `run()` flattens the last step's output once, so `data.arguments` is a flat `Argument[]` on MAP/ITERATE_MAP pipelines too, with no cast. The test now asserts that no element is an array instead of calling `flat()`. |
| C-4080487730 | fix | `9b415cb1f` test(165-05): assert the composed generateBoth request in the mixed-operation test | `yarn workspace @openvaa/question-info test:unit` (22/22); a scratch rename of `choices` in `generateBoth.yaml` passes the old test and fails the new one | Fixed in 9b415cb1f: the mixed-operation test captures the `generateBoth` requests and asserts each question's type and its joined choice labels. A renamed `choices` placeholder now fails it. |
| C-4080487775 | fix | `ef49309bc` docs(165-05): restore the collapsed JSDoc examples as fenced, copyable code | `node scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE packages/argument-condensation/src/api.ts` (exit 0); tsc over the extracted example | Fixed in ef49309bc: the `handleQuestion` example is multi-line code in a `ts` fence again, updated to the current API (`answer.info`, `LLMProvider`), and it typechecks. |
| C-4080487819 | fix | `ef49309bc` (same) | `node scripts/code-identity.mjs 583b4ac82 WORKTREE packages/argument-condensation/src/core/condensation/condenser.ts` (exit 0) | Fixed in ef49309bc: the `Condenser` example is fenced and multi-line, and uses `LLMProvider`, uppercase operations and the required prompt ids, so it compiles as written. |
| C-4080487851 | fix | `ef49309bc` (same) | `bash scripts/assert-absent.sh '^\s*\*\s.*//\s.*\b(const\|import\|await\|let)\s' -- packages/argument-condensation/src packages/llm/src` (exit 0) | Fixed in ef49309bc: all three `condensationInput.ts` examples (including the line-26 one) are fenced, so the inline comments end at their line. The options examples use today's `CondensationOptions` fields. |
| C-4080487884 | fix | `ef49309bc` (same) | `bash scripts/hygiene-changed-files.sh --files packages/argument-condensation/src/core/types/condensation/condensationResult.ts` (exit 0) | Fixed in ef49309bc: the `CondensationRunResult` example is multi-line in a fence, and the `// Optional` note sits at the end of its own line. |
| C-4080487924 | fix | `ef49309bc` (same) | `node scripts/assert-comment-hygiene.mjs` (0 violations) | Fixed in ef49309bc: the `registerPrompts`/`loadPrompt` examples in `promptRegistry.ts`, and the same class in `prompts/index.ts`, are fenced multi-line code. `loadPrompt` now shows `throwIfVarsMissing`, the real option name. |

## Red runs (quoted)

**Task 1 RED**, run before the `condenser.ts` edit (`yarn workspace @openvaa/argument-condensation test:unit`, exit 1):

```
   × handleQuestion > It should condense arguments for both pros and cons of a likert question 7ms
     → expected false to be true // Object.is equality
 ❯ tests/condensation/condenseQuestions.test.ts:150:97
    150|     expect(argumentsPerRun.every((args) => args.every((argument) => !A…
      Tests  3 failed | 27 passed (30)
```

The categorical and boolean tests failed on the same assertion. After the fix: `Tests 30 passed (30)`, exit 0.

**Task 3, scratch edits to `generateBoth.yaml`** (backed up, restored byte-for-byte, never committed; the old test was run from a temporary copy of the pre-change file):

| Scratch edit | Old test | New test |
|---|---|---|
| `choices` → `choiceList` in `params.optional` and the text | exit 0 (`Tests 9 passed`) | exit 1: `expected '\n\nYou are a political expert tasked…' to contain 'Not important, Somewhat important, Im…'` |
| `{{questionType}}` and `{{choices}}` removed from the text | exit 0 (`Tests 9 passed`) | exit 1: `expected '\n\nYou are a political expert tasked…' to contain 'boolean'` |
| `questionType` → `questionKind` (a required param) | exit 1: registry `Missing required parameters for prompt 'generateBoth': questionKind` | exit 1 (same) |

The third row shows the registry already guards a renamed *required* placeholder. The gap the thread described was the optional `choices` placeholder and a placeholder dropped from the text, and the new assertion now covers both.

## Files Created/Modified

- `packages/argument-condensation/src/core/condensation/condenser.ts`: the flatten, the fenced `Condenser` example, the stage headings split out of the reflow, and the `main.ts` → `api.ts` reference.
- `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts`: no `flat()`, a no-array assertion, shorter comments.
- `packages/argument-condensation/src/api.ts`, `.../condensationInput.ts`, `.../condensationResult.ts`, `packages/llm/src/prompts/promptRegistry.ts`, `packages/llm/src/prompts/index.ts`: fenced examples (comments only).
- `packages/question-info/tests/questionTypes.test.ts`: the `generateBoth` assertions and the comment rewrite.
- Comments only: `runner.ts`, `responseValidators/responseWithArguments.ts`, `types/api/apiConfig.ts`, `processDefinition.ts`, `processParams.ts`, `processStepResult.ts`, `llm/promptInstance.ts`, `llm/responseWithArguments.ts`, `llm-providers/llmProvider.ts`, `types/llmPipelineResult.ts`, `utils/parseRateLimitError.ts`.
- `.planning/.../scripts/hygiene-reads/165-05.tsv`: 19 read rows.
- `.planning/.../deferred-items.md`: two out-of-scope findings.

## Decisions Made

See `key-decisions`. The ones that affect later plans:

- **`flat()` on the last step's output, not a first-element test.** The plan sketched "flatten when the first element is an array". `flat()` does the same for this data: arguments are objects, so a flat list passes through unchanged. Tracking the step output in a `CondensationStepResult['arguments']` local lets the flatten typecheck without either cast.
- **Examples track the tip API.** The stack-base text was the source of structure only. Copying it verbatim would have restored examples that do not compile (for instance, the tip has no `OpenAIProvider` and no lowercase operation names).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The same collapsed-example class in 11 more files of the two packages**
- **Found during:** Task 2
- **Issue:** The plan's class scan (`//` followed by `const|import|await|let`) found nine lines, all in the six threaded files. Examples collapsed without a `//` were not in that scan: `runner.ts`, `apiConfig.ts`, `processDefinition.ts`, five in `processParams.ts`, `processStepResult.ts`, `promptInstance.ts`, both `ResponseWithArguments` files, `llmPipelineResult.ts`, and `parseRateLimitError.ts`, whose code sat entirely after `// returns 6154`. Several also used identifiers that no longer exist (`RESPONSE_WITH_ARGUMENTS_CONTRACT`, `condensationPrompt`, lowercase operations, `input/output/total` token fields). `llmProvider.ts` had four TODOs merged onto two lines, and `runner.ts` had a merged sentence and a wrong prompts path. The done criterion ("every public example in the two packages is copyable again") was false without these fixes.
- **Fix:** Fenced every example, updated identifiers, split the merged TODOs and the sentence, and corrected the path. `commentGroup.ts` was edited and then reverted: its example is prose, and the tip's one-line form passes rule 2 while the split form does not.
- **Verification:** `code-identity.mjs ship/v2.15-12-planning WORKTREE <11 files>` exit 0; hygiene gate exit 0; tsc over the 14 extracted example files exit 0.
- **Committed in:** `949e5e9bf`

**2. [Rule 2 - Correctness] Restored examples updated to the current API and typechecked**
- **Found during:** Task 2
- **Issue:** The plan asked to update changed identifiers. A first tsc run over the extracted examples showed the stack-base text also used lowercase `'map'`/`'reduce'`, which is a compile error at the tip.
- **Fix:** A throwaway harness under `packages/argument-condensation/.example-check-165-05/` (deleted, never committed) extracted every fence, declared placeholders such as `dataRoot`, and ran tsc with paths mapped to `packages/*/src`. All 24 examples compile.
- **Committed in:** `ef49309bc`, `949e5e9bf`

**3. [Rule 3 - Blocking] `yarn workspace <pkg> lint` cannot find `eslint`**
- **Found during:** Task 1
- **Issue:** `eslint` is a root devDependency, so Yarn 4 does not expose it to a workspace script (`command not found: eslint`).
- **Fix:** Ran the same script command, `eslint --flag v10_config_lookup_from_file src/`, with `node_modules/.bin/eslint` from each package directory. All three packages exit 0. No configuration changed.

**4. [Rule 2 - Hygiene] Comment fixes in the plan's own files beyond the examples**
- `condenser.ts`: "STAGE 1: CREATE TREE NODES Create a tree node…" (and stages 2-4, plus the comment-allocation heading) were reflow joins; `handleQuestion` is in `api.ts`, not `main.ts`; "the new provider" was historical narrative.
- `api.ts`: a merged two-sentence comment; `promptsIds`.
- `promptRegistry.ts`: "Global index of all registered prompts Structure: …"; "as it features".
- **Committed in:** `ef49309bc` (verified comment-only by `code-identity.mjs`)

---

**Total deviations:** 4 auto-fixed (1 bug class, 2 correctness/hygiene, 1 blocking tool path). **Impact:** there are more files than planned (19 against 8), but every extra edit is comment-only, proven by `code-identity.mjs`, and covered by a recorded read.

## Issues Encountered

- zsh does not word-split unquoted path lists, so multi-file gate calls ran under `bash -c`. One `git commit -m` inside `bash -c '…'` broke on an apostrophe; messages went through `git commit -F <scratch file>` after that.
- The `hygiene-allow/165-05.tsv` listed in `files_modified` was not created: the gate reported no false positives.

## Known Stubs

None.

## Threat Flags

None. The flatten mitigates T-165-09. `code-identity.mjs` proves T-165-10 for every comment-only file. No package was installed (T-165-SC).

## User Setup Required

None.

## Next Phase Readiness

- The frontend consumes these packages through their built `dist/`, which this plan did not rebuild (wave safety). Plan 165-24's repo-wide `yarn build` picks up the flat result.
- `deferred-items.md` has two new entries for the phase-wide residue read: the `packages/core/src/pipelines/metrics.type.ts` merged headings, and `packages/question-info/src/core/infoGeneration.ts`'s guard comment, whose line anchors include `promptRegistry.ts:352`.
- The ledger rows for the seven threads are still `pending`. Their commit, evidence and reply cells can be filled from the table above.

## Self-Check: PASSED

- Commits `583b4ac82`, `ef49309bc`, `949e5e9bf`, `9b415cb1f`, `756aaaa0b` and `af48443d0` all exist (`git cat-file -e`).
- All 21 paths in `git diff --name-only 049c8a28d HEAD` exist on disk.
- Final re-run at 18:13Z. Every command exited 0: the three package test suites, the three typechecks, three eslint runs, prettier over the 19 files, both `code-identity.mjs` proofs, the hygiene gate, `assert-comment-hygiene.mjs`, both `assert-absent.sh` checks, `--check-reads` over 8 and over 19 files, and `tip-proofs.sh`. The cast count is 0, and each of the six threaded files has at least one ```` ```ts ```` fence (1/1/3/1/3/1).
- `git status --short` lists only the maintainer's `MainContent.svelte` and `.planning/milestone.lock`.

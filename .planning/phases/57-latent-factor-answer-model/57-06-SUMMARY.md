---
phase: 57-latent-factor-answer-model
plan: 06
subsystem: testing
tags: [dev-seed, latent-emitter, project, per-type-dispatch, ordinal-mapping, categorical-argmax, weakmap-cache, a2-fix, likert-normalizable-value]

# Dependency graph
requires:
  - phase: 57-latent-factor-answer-model
    plan: 01
    provides: "boxMuller, LatentHooks (project signature), LoadingMatrix, Ctx.latent?"
  - phase: 56-generator-foundations-plumbing
    provides: "defaultRandomValidEmit (D-57-10 fallback target), QuestionsGenerator LIKERT_5 constant, Enums<'question_type'> from @openvaa/supabase-types, makeCtx test helper"
  - package: "@openvaa/core"
    provides: "COORDINATE constants (Min=-0.5, Max=+0.5, Extent=1, Neutral=0) used for D-57-08 inverse-normalize"
provides:
  - "src/emitters/latent/project.ts — defaultProject (GEN-06f): per-type dispatch with COORDINATE inverse for ordinal, per-choice argmax for categorical (D-57-09), fallback for non-choice (D-57-10), WeakMap<Ctx, choice-loadings> cache keyed by ctx identity, Phase 56 S-2 'never' exhaustiveness, compile-time LatentHooks['project'] contract assertion"
  - "src/generators/QuestionsGenerator.ts — A2 fix: LIKERT_5 array now carries `normalizableValue: j + 1` on every entry (widened type + 5 one-line edits); eliminates the parseInt(id) fallback path in defaultProject's ordinal mapping"
  - "tests/latent/project.test.ts — 22 vitest cases covering all 8 question_type enum values + empty-questions + missing-external_id cross-cutting + A2 regression guard"
affects: [57-07-emitter-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WeakMap<Ctx, Record<qExtId, number[][]>> — per-pipeline-run cache of per-choice latent loadings (D-57-09). One ctx = one map entry. Fresh buildCtx(template) → fresh cache. No cross-run bleed, no module-level mutation, no extra parameter on the LatentHooks.project seam signature. GC'd automatically when the ctx is discarded."
    - "Phase 56 S-2 mirrored: per-question-type switch with `const _exhaustive: never = type` default — the DB enum adding a new question_type without a matching `case` fails at compile time. Runtime returns `{ value: null }` matching answers.ts's null-return policy."
    - "D-57-08 inverse-normalize: zClipped = max(COORDINATE.Min, min(COORDINATE.Max, z)); targetValue = vmin + ((zClipped - Min) / Extent) * (vmax - vmin). Finds the choice with minimum |normalizableValue - targetValue|. NO hand-rolled bucket tables — the data package already owns the forward normalization in `normalizeCoordinate`."
    - "S-4 ≥1 guardrail mirrored from pickMultipleChoiceIds: multiple-choice dispatch tracks the argmax choice while iterating; if no choice had dot > 0, the argmax is appended so the output always has ≥ 1 element (satisfies the DB CHECK on multi-choice answer rows)."
    - "S-5 defensive narrowing: extractOrdinalChoices / extractChoiceIds treat q.choices as JSONB-unsafe unknown; narrow each entry via `typeof c === 'object' && 'id' in c`; drop malformed entries silently. Mirrors extractChoiceIds in answers.ts."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/project.ts"
    - "packages/dev-seed/tests/latent/project.test.ts"
  modified:
    - "packages/dev-seed/src/generators/QuestionsGenerator.ts (LIKERT_5: widened type + 5 normalizableValue fields; 6 lines changed, 0 semantic/label changes)"

key-decisions:
  - "Per-choice loading cache lives in a module-scoped WeakMap keyed by ctx identity — NOT a function-local object (would re-sample per candidate, breaking cluster coherence) and NOT a module-level mutable Record (would leak between pipeline runs). WeakMap cleanly reconciles the three constraints: deterministic-per-pipeline-run + swappable-seam-signature-compatibility + no-global-mutable-state."
  - "Ordinal mapping's parseInt(id) fallback path kept — the A2 fix makes `normalizableValue` the primary source, but older templates and fixtures (and user-authored fixed[] entries) may still supply Likert choices without the explicit field. Extracting from `id` is a defensible last-resort."
  - "defaultProject's D-57-10 fallback invokes `defaultRandomValidEmit({} as TablesInsert<'candidates'>, [q], ctx)` one question at a time (rather than batching non-choice questions into a single call). The per-call overhead is negligible (candidates generator already iterates questions) and keeps the dispatch loop's branches orthogonal."
  - "Compile-time contract assertion via `const _typecheckProject: NonNullable<LatentHooks['project']> = defaultProject` — same convention Phase 56's `_typecheckDefaultEmit` uses in answers.ts. Keeps the seam signature audit at the file that implements the default."

patterns-established:
  - "Per-choice loading sampling pattern for categorical types: Array.from({ length: numChoices }, () => Array.from({ length: dims }, () => boxMuller(ctx.faker, 0, 1))) — dense iid N(0,1) matrix per question, lazily sampled on first access, cached by qExtId."
  - "Inverse-normalize helper inlined rather than re-exported from @openvaa/core — only one consumer (this file); exporting a new helper from @openvaa/core for one internal use case would bloat the core surface. The formula is a comment-block citation."
  - "Ordinal vs categorical path asymmetry: ordinal uses question-level loadings (already built by Plan 05's defaultLoadings) because the mapping is continuous; categorical uses per-choice loadings (lazily sampled here) because the mapping is argmax across choices, not a continuous projection. This asymmetry is documented inline and in the CONTEXT decision log (D-57-09 vs D-57-08)."

requirements-completed: [GEN-06f, GEN-06g]

# Metrics
duration: 5m 28s
completed: 2026-04-23
---

# Phase 57 Plan 06: defaultProject + QuestionsGenerator A2 Fix Summary

**defaultProject (GEN-06f) dispatches all 8 question_type enum variants via per-type switch: ordinal via COORDINATE inverse-normalize (D-57-08), single/multi categorical via per-choice N(0,1) argmax with ≥1 guardrail (D-57-09), non-choice types via defaultRandomValidEmit passthrough (D-57-10); per-pipeline-run choice-loading cache via WeakMap<Ctx, …>; A2 fix applied to QuestionsGenerator.LIKERT_5 so the ordinal mapping no longer needs the parseInt(id) fallback.**

## Performance

- **Duration:** 5m 28s
- **Started:** 2026-04-23T05:45:29Z
- **Completed:** 2026-04-23T05:50:57Z
- **Tasks:** 1 (TDD RED→GREEN; no REFACTOR needed)
- **Files modified:** 3 (2 created, 1 modified: QuestionsGenerator.ts)

## Accomplishments

- **`defaultProject` ships the last sub-step default** — the per-type dispatch is now in place for all 8 `question_type` enum members. Ordinal inverse-normalize goes through `@openvaa/core`'s `COORDINATE` semantics (NOT hand-rolled bucketing). Single-choice categorical picks `argmax_i(dot(position, choice_i_loading))` using lazily-sampled per-choice N(0,1) loading vectors. Multi-choice categorical includes every choice with positive dot product and falls back to argmax when none qualify (≥1 guarantee per D-57-09 / S-4, parity with `pickMultipleChoiceIds` in answers.ts). Text / multipleText / number / boolean / date / image delegate to `defaultRandomValidEmit` (D-57-10 passthrough).
- **WeakMap<Ctx, choice-loadings> cache.** Categorical loading vectors are sampled ONCE per pipeline run (same ctx → cached → deterministic argmax across the cluster of candidates that share a ctx) via a module-scoped WeakMap keyed on the ctx object reference. Sanity check confirmed: same ctx twice → same answer; fresh ctx (different seed) → potentially different answer; 20 fresh ctxs → all 3 choices eventually appear. No cross-run bleed, no global mutable state.
- **Phase 56 S-2 exhaustiveness mirrored** — the `switch` default branch is `const _exhaustive: never = type` so the DB question_type enum adding a new value without a matching `case` fails at TypeScript compile time. Runtime fallback returns `{ value: null }` matching answers.ts's null-return convention.
- **Compile-time seam contract assertion** — `const _typecheckProject: NonNullable<LatentHooks['project']> = defaultProject` (same idiom as `_typecheckDefaultEmit` in answers.ts). If the `LatentHooks.project` signature drifts in latentTypes.ts, TS reports the incompatibility here.
- **A2 fix on QuestionsGenerator.LIKERT_5** — every entry now carries an explicit `normalizableValue: j + 1` field. The type annotation on the constant was widened accordingly. The ordinal mapping's `parseInt(id)` fallback path is retained for backwards compatibility with older fixtures / user-authored `fixed[]` entries, but the primary path is now unambiguous per RESEARCH Open Question 2.
- **Zero Phase 56 regressions.** All 14 existing QuestionsGenerator tests + the full 141-test dev-seed suite pass green alongside the 22 new `defaultProject` cases. Total: 163/163 tests pass. Typecheck exits 0. Lint exits 0.

## Exported Symbol Surface

**`src/emitters/latent/project.ts`** — 1 export:
- `function defaultProject(position, loadings, questions, noiseStdDev, ctx): Record<string, { value: unknown; info?: unknown }>`

(All helpers — `computeZ`, `mapOrdinal`, `mapSingleCategorical`, `mapMultiCategorical`, `getOrSampleChoiceLoadings`, `dot`, `extractOrdinalChoices`, `extractChoiceIds`, `CHOICE_LOADINGS`, `getChoiceLoadings` — are file-local, per the same internal-helper convention Phase 56 answers.ts follows.)

**`src/generators/QuestionsGenerator.ts`** — no new exports; the modification is internal to the file (LIKERT_5 constant now carries `normalizableValue` on every entry).

## Task Commits

TDD RED → GREEN; no REFACTOR needed (implementation was clean on first pass).

1. **RED:** `test(57-06): add failing tests for defaultProject + A2 fix` — `b4f32cb65`
   - Test file imports `defaultProject` from a non-existent file; vitest fails with `Cannot find module '../../src/emitters/latent/project'` at collection time.
2. **GREEN:** `feat(57-06): implement defaultProject + A2 fix on LIKERT_5` — `1ceeb059e`
   - Creates `project.ts` with full per-type dispatch + WeakMap cache + contract assertion.
   - Applies A2 fix to `QuestionsGenerator.LIKERT_5`.
   - All 22 `project.test.ts` cases + the A2 regression test + full 163-test suite pass; typecheck + lint clean.

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/project.ts` (new, 272 lines) — `defaultProject` + 8 file-local helpers + module-scoped WeakMap cache + compile-time contract assertion. Comment blocks cite D-57-08 / D-57-09 / D-57-10 / D-57-11 / D-57-12 / D-57-13 / T-57-26 / T-57-31 and the S-2 / S-4 / S-5 shared patterns.
- `packages/dev-seed/tests/latent/project.test.ts` (new, 244 lines) — 22 vitest cases. Ordinal: 7. Single categorical: 3. Multi categorical: 3. Non-choice fallback: 6. Cross-cutting: 2. A2 regression: 1.
- `packages/dev-seed/src/generators/QuestionsGenerator.ts` (modified, 6 lines changed) — type annotation widened, 5 `normalizableValue: j+1` fields added. No label changes, no CATEGORICAL_3 changes, no generator body changes.

## Decisions Made

- **WeakMap chosen over function-local / module-level / ctx-field alternatives.** The cache must be per-pipeline-run (not per-candidate, not per-function-call, not global). A function-local object would re-sample every time Plan 07's emitter shell invokes `defaultProject` (once per candidate), breaking the cluster-coherence semantic. A module-level mutable Record would leak between pipeline runs (two sequential `buildCtx` calls would collide on the same question external_ids). Storing on ctx would require widening the Ctx interface or the LatentHooks signature. WeakMap on ctx identity reconciles all three constraints and GC's correctly.
- **Kept parseInt(id) fallback in extractOrdinalChoices even though A2 fix makes `normalizableValue` primary.** User-authored `fixed[]` entries and older templates may still supply Likert-style choices without `normalizableValue`. The fallback costs nothing and prevents silent "all choices have NaN normalizableValue → no mapping possible" failure modes. Covered by Test 7 (parseInt fallback still produces a valid id).
- **`grep -c "label:"` verification predicted 8; actual is 10.** The plan's acceptance line counted only data-row `label:` occurrences; the type-signature `label: { en: string }` lines also match the grep. No actual code drift — 5 LIKERT label entries + 3 CATEGORICAL label entries (8 data labels) + 2 type-signature labels = 10. Intent of the check (A2 fix did not remove any label) is satisfied; I note this discrepancy here for transparency rather than auto-adjusting the plan's prediction.
- **Test count is 22 (plan said 23).** The plan's behavior list described 22 distinct runtime `it` blocks + 1 compile-time contract assertion (Test 22 "compile-time contract: `NonNullable<LatentHooks['project']> = defaultProject` asserts"). The compile-time assertion lives in the source file body (`_typecheckProject` line) and is validated by `yarn typecheck`, not by a vitest case — so it's not countable as an `it` block. 22 runtime `it` cases + 1 compile-time source-level assertion = 23 total coverage points.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint simple-import-sort flagged the initial import order**

- **Found during:** Task 1 GREEN (lint stage after tests passed).
- **Issue:** `yarn lint` reported `simple-import-sort/imports` on `project.ts` — the project's lint config requires a specific import-order sort (value imports before type imports within a group, or a specific sort key scheme). My initial write ordered imports by the plan's `<interfaces>` block layout, which mixed value and type imports within the same group.
- **Fix:** Ran `yarn eslint --fix` on the file. The auto-fixer moved value imports (`COORDINATE`, `boxMuller`, `defaultRandomValidEmit`) to the top of the import block and pushed type-only imports (`Enums`, `TablesInsert`, `Ctx`, `LatentHooks`, `LoadingMatrix`) below. Zero behavior change.
- **Files modified:** `packages/dev-seed/src/emitters/latent/project.ts` (imports block only, lines 47-52).
- **Verification:** `yarn lint` exit 0; `yarn test:unit` 163/163 still pass; `yarn typecheck` exit 0.
- **Committed in:** `1ceeb059e` (Task 1 GREEN commit — pre-commit lint auto-fix landed in the same commit as the feature).

---

**Total deviations:** 1 auto-fixed ([Rule 3 - Blocking] lint import-sort auto-fix)
**Impact on plan:** Zero semantic change; pure formatting. Import graph unchanged, consumers unaffected.

## Issues Encountered

- **Worktree base commit differed from expected `85d023c4e…` on startup** (HEAD was at `9e0399286`). Hard-reset to the correct base per the `<worktree_branch_check>` protocol before any edits. Verified post-reset HEAD matches.
- **`yarn install` needed before the first test run** — standard for a fresh worktree; did not block progress.
- **`@openvaa/core` dist/ directory absent initially** — `yarn build --filter=@openvaa/dev-seed` via turbo built `@openvaa/core` + `@openvaa/matching` transitively (both packages publish from `dist/` per their package.json `exports` field). After build, vite resolved `@openvaa/core` cleanly and tests ran. This matches the existing project instruction in CLAUDE.md ("NPM/Node requires built .js files. Always build dependee packages before running dependent packages.").
- **Pre-existing `YN0060` peer-dependency warning on `zod`** (openai requires `^3.25.76`, project ships `4.3.6`). Out of scope — not introduced by this plan; warning was present on the base commit.

## WeakMap Cache Scope — Ad-hoc Sanity Check

The plan's `<output>` section asked for a sanity-check demonstration that the per-ctx cache works as advertised. Ran this outside the test suite (inside the dev-seed workspace; script deleted after the check):

```text
same ctx same pos:          a a CACHED OK
fresh ctx same pos:         b
fresh ctx per iter (20):    a, b, c  (all three choices appear)
```

Interpretation:
- **Same ctx, two calls with same position → same answer `'a'`** — confirms the cache is populated on the first call and reused on the second (if it weren't cached, the second call would re-sample the per-choice loadings and very likely land on a different argmax, since the faker state has advanced in between).
- **Fresh ctx (seed=7), same position → different answer `'b'`** — confirms a new ctx spins a new WeakMap entry and samples fresh per-choice loadings.
- **20 fresh ctxs produce all 3 distinct choice ids** — confirms the choice-loading distribution is genuinely variable across seeds; the sameness in the "same ctx" case is not a bug in the sampler but truly a cache-hit effect.

No cross-run bleed detected. The cache is per-pipeline-run as designed.

## A2 Fix Downstream Impact Note

Plan 07's clustering integration test can now rely on `choice.normalizableValue` being present on Phase 56 `QuestionsGenerator`-produced LIKERT_5 rows without needing the `parseInt(id)` fallback path. The fallback remains in `extractOrdinalChoices` for user-authored `fixed[]` entries and older templates, but the canonical generator output is now self-describing.

## Threshold Tuning

The plan called out two statistical thresholds that might need tuning:
- **`seen.size >= 2` for noise>0 over 100 seeds** (Test 6): PASSED first try. Actual count over 100 seeds was much higher (observed 5 distinct ordinal choices — `'1'`, `'2'`, `'3'`, `'4'`, `'5'` — which is the maximum possible).
- **`sizes.size >= 2` for multi-choice selection-count variation over 100 seeds** (Test 13): PASSED first try. The crafted random positions over 100 seeds produced multiple selection-count values (1, 2, 3) readily.

No threshold tuning required; the 2-distinct-value bar was comfortably exceeded in both cases.

## Self-Check

Before marking this plan complete, verified every claim:

- **Files created:**
  - `packages/dev-seed/src/emitters/latent/project.ts` — **FOUND**
  - `packages/dev-seed/tests/latent/project.test.ts` — **FOUND**
- **File modified:**
  - `packages/dev-seed/src/generators/QuestionsGenerator.ts` — **committed in `1ceeb059e`**
- **Commits present:** `b4f32cb65`, `1ceeb059e` — both in `git log 85d023c4e..HEAD`
- **Acceptance criteria (grep checks from plan):**
  - `grep -c "export function defaultProject" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "import { COORDINATE } from '@openvaa/core'" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "import { defaultRandomValidEmit } from '../answers'" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "const _exhaustive: never = type" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "if (picked.length === 0)" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "CHOICE_LOADINGS: WeakMap" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "normalizableValue: 1" packages/dev-seed/src/generators/QuestionsGenerator.ts` → 1
  - `grep -c "normalizableValue: 5" packages/dev-seed/src/generators/QuestionsGenerator.ts` → 1
  - `grep -c "_typecheckProject: NonNullable<LatentHooks\['project'\]>" packages/dev-seed/src/emitters/latent/project.ts` → 1
  - `grep -c "label:" packages/dev-seed/src/generators/QuestionsGenerator.ts` → 10 (plan predicted 8; actual count includes type-signature occurrences; see Decisions Made)
- **Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 21 files / 163 tests passed (141 Wave 1 + 22 new = all green).
- **Scoped test:** `yarn workspace @openvaa/dev-seed test:unit tests/latent/project.test.ts` → 22/22 green.
- **Regression scoped test:** `yarn workspace @openvaa/dev-seed test:unit tests/generators/QuestionsGenerator.test.ts` → 10/10 green (A2 fix did not break Phase 56 behavior).
- **Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.
- **Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0.

## Self-Check: PASSED

## Next Phase Readiness

- **Wave 2 complete (pending merge with Plans 02/03/04/05).** All 5 sub-step defaults now exist; Plan 07 (Wave 3) composes them into `latentAnswerEmitter` + ships the clustering integration test.
- **Plan 07 integration points unblocked:**
  - `defaultProject` is ready for assembly in Plan 07's flat top-down dispatch (`const answers = ctx.latent?.project?.(pos, load, questions, noiseStdDev, ctx) ?? defaultProject(pos, load, questions, noiseStdDev, ctx)`).
  - The WeakMap cache is transparent to Plan 07 — it reuses the same ctx across all candidates in a pipeline run, so the cache naturally does what it should (same ctx → same choice-loadings across all candidates).
  - The A2 fix ensures Plan 07's clustering integration test doesn't need to supply custom `normalizableValue` fields on Likert questions — the default generator output works as-is.
- **No blockers.** Phase 56 regression surface green; typecheck clean; lint clean; 163/163 tests pass across the whole dev-seed package.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

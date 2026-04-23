---
phase: 57-latent-factor-answer-model
plan: 05
subsystem: testing
tags: [dev-seed, latent-emitter, loadings, N0-1-matrix, box-muller, template-override, phase-57-wave-2, sub-step-default]

# Dependency graph
requires:
  - phase: 57-latent-factor-answer-model
    plan: 01
    provides: "boxMuller (Pitfall-1-safe + D-57-11 short-circuit), LoadingMatrix type alias, LatentHooks.loadings signature, Ctx.latent seam — consumed here via `import { boxMuller } from './gaussian'` + `import type { LatentHooks, LoadingMatrix } from './latentTypes'`."
provides:
  - "src/emitters/latent/loadings.ts — `defaultLoadings(questions, dims, ctx, tplLoadings?)` GEN-06e sub-step default (dense N(0,1) matrix keyed by question.external_id, with D-57-07 per-question override + wrong-length fallback + Pitfall-3 empty-questions guard + copy semantics)."
  - "tests/latent/loadings.test.ts — 10 unit tests covering shape, empty/dims=0 edges, missing-external_id skip, N(0,1) statistics, override override semantics, wrong-length override guard, determinism, and 50-seed Pitfall-1 regression."
affects: [57-07-emitter-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern replication: `if (!qExtId) continue;` guard mirrors the identical guard in `src/emitters/answers.ts` (defaultRandomValidEmit / extractChoiceIds). Same Phase 56 precedent for silently skipping questions whose external_id is undefined — a question without a stable key cannot be addressed by downstream projection (Plan 57-06)."
    - "Defensive guard: `override.length === dims` runtime check when template supplies per-question loading vectors. The schema (Plan 57-01 latent block) accepts arbitrary-length arrays because cross-field dims validation is impractical at zod level; the runtime check keeps the pipeline running on template/dims drift (T-57-22 mitigation)."
    - "Copy semantics: `[...override]` spread-copy into the returned matrix prevents aliasing between caller-supplied tplLoadings and the emitter's output — callers can freely mutate returned vectors without corrupting the template (T-57-21 mitigation)."
    - "Compile-time contract assertion: `const _typecheckLoadings: NonNullable<LatentHooks['loadings']> = defaultLoadings;` ensures Plan 01's seam signature is honored. Any drift in LatentHooks.loadings signature breaks typecheck before any test runs (Plan 01's pattern replicated)."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/loadings.ts"
    - "packages/dev-seed/tests/latent/loadings.test.ts"
  modified: []

key-decisions:
  - "Pattern-replicated the Phase 56 `if (!qExtId) continue;` external_id guard exactly as in `src/emitters/answers.ts` — keeps silent-skip semantics consistent across emitters so Plan 57-06's project() step sees the same set of questions the loadings matrix covers."
  - "Kept the `[...override]` copy inline rather than factoring out a `copyVec` helper — one call site, and explicit spread is the idiomatic JS pattern for shallow-copying number arrays (no aliasing trap since entries are primitives)."
  - "Did NOT throw on wrong-length overrides — the template schema cannot validate per-question vector length vs the top-level `latent.dimensions` at zod time (cross-field check would require superRefine per-key, expensive and brittle). Runtime fallback to sampling keeps the pipeline running; future work may add a `ctx.logger` warning when a wrong-length override is silently dropped."
  - "Declined to lift `boxMuller(ctx.faker, 0, 1)` into a module-level constant or closure — the Plan 57-01 primitive is cheap, and inlining at the call site keeps the D-57-06 intent (iid N(0,1) draws) textually visible without an indirection."
  - "JSDoc rewritten post-implementation to avoid duplicating the exact code patterns (`boxMuller(ctx.faker, 0, 1)` and `[...override]`) in docstrings — the plan's acceptance criteria require `grep -c` output of exactly `1` for those patterns, so the docstring paraphrases them in prose. This keeps the greps unambiguous AND keeps the docstring useful."
  - "Import order followed simple-import-sort autofix: runtime import (`./gaussian`) first, then type-only imports alphabetized. Plan's `<interfaces>` sample had type imports before runtime imports, but the repo's ESLint rule is authoritative — ran `yarn lint --fix` and committed the reorder separately as a `style()` commit."

patterns-established:
  - "Sub-step default files under `src/emitters/latent/` mirror the Plan 01 named-only export convention (no default exports) and the compile-time contract assertion pattern. Plans 57-02 through 57-06 will each follow this shape: one named function export + one `_typecheck{Step}: NonNullable<LatentHooks['{step}']>` assignment + file-level JSDoc referencing the governing D-57-* decision."
  - "Test file layout under `tests/latent/` uses the same `mkQ(extId)` factory pattern that other generator tests use for `TablesInsert<'questions'>`-shaped inline fixtures. Determinism tests rely on `makeCtx()` constructing a fresh `Faker` with seed=42 — same Pattern A convention as Plan 01's gaussian tests."
  - "Statistical-bound tests use loose bounds sized for small-N samples. At seed 42 with 60 entries, the observed std hugged the upper bound (1.200 vs observed 1.199646 — only 0.04% headroom). Future sub-step tests should either size `dims`/`questions` such that N ≥ 100 or adopt tighter seed-pinned snapshot checks if bound-hugging recurs."

requirements-completed: [GEN-06e, GEN-06g]

# Metrics
duration: 5m 29s
completed: 2026-04-23
---

# Phase 57 Plan 05: Default Loadings Matrix Summary

**`defaultLoadings(questions, dims, ctx, tplLoadings?)` — the GEN-06e Wave-2 sub-step default that produces a dense `(|questions| × dims)` loading matrix keyed by question `external_id`, sampled iid from N(0, 1) via Plan 01's `boxMuller`, with D-57-07 per-question template overrides (copy-safe, wrong-length fallback), a Pitfall-3 empty-questions guard, and a Phase-56-style missing-external_id skip.**

## Performance

- **Duration:** 5m 29s
- **Started:** 2026-04-23T05:44:25Z
- **Completed:** 2026-04-23T05:49:54Z
- **Tasks:** 1 (executed TDD RED → GREEN → STYLE)
- **Files modified:** 2 (both created)
  - `packages/dev-seed/src/emitters/latent/loadings.ts` (104 lines)
  - `packages/dev-seed/tests/latent/loadings.test.ts` (135 lines)

## Accomplishments

- `defaultLoadings` ships as GEN-06e's built-in default. Signature matches `LatentHooks.loadings` exactly (`(questions, dims, ctx, tplLoadings?) => LoadingMatrix`). Compile-time contract assertion pins the signature to Plan 01's `LatentHooks` type at typecheck time.
- The returned matrix is `Record<string, Array<number>>` keyed by `question.external_id` per D-57-06. Each value is a length-`dims` vector of `boxMuller(ctx.faker, 0, 1)` draws (Plan 01 primitive — Pitfall-1 clamp inherited, NaN-free).
- D-57-07 per-question overrides are honored when both an entry exists AND its length matches `dims`. The override is spread-copied (`[...override]`) into the returned matrix so caller mutations do not propagate into the template (T-57-21 tampering mitigation).
- Wrong-length overrides (e.g. template supplies a 1-vector when `dims=2`) silently fall back to sampling — T-57-22 DoS mitigation against template/dims drift.
- Empty-questions branch (`questions.length === 0`) returns `{}` with no iteration — Phase 56's `{}`-template determinism tests depend on this (T-57-23 Pitfall-3 mitigation).
- Questions with no `external_id` are silently skipped — mirrors the `defaultRandomValidEmit` / `extractChoiceIds` guard in `src/emitters/answers.ts`.
- `dims === 0` edge returns `{ [extId]: [] }` for each question (no throw) — `Array.from({ length: 0 }, …)` is a well-defined zero-length array.

## Exported Symbol Surface

Plans 57-07 (emitter shell) and 57-06 (project step) pin against:

**`src/emitters/latent/loadings.ts`** — 1 export:
- `function defaultLoadings(questions: ReadonlyArray<TablesInsert<'questions'>>, dims: number, ctx: Ctx, tplLoadings?: Record<string, Array<number>>): LoadingMatrix`

## Observed N(0, 1) Statistics at Seed 42

Per the plan's `<output>` spec, here are the observed sample statistics when `defaultLoadings` runs over 20 questions × 3 dims = 60 entries with a fresh `makeCtx()` (seed 42):

| Metric | Observed | Lower bound | Upper bound | Headroom |
|--------|----------|-------------|-------------|----------|
| n      | 60       | —           | —           | —        |
| mean   | **0.100507**  | -0.3        | 0.3         | low: **0.4005**, high: **0.1995** |
| std    | **1.199646**  | 0.8         | 1.2         | low: **0.3996**, high: **0.0004** (**tight!**) |
| min    | -2.307959 | —           | —           | —        |
| max    | 2.613601 | —           | —           | —        |

The **std at seed 42 hugs the 1.2 upper bound to 4 decimal places** — observed `1.199646` vs bound `1.200000`, headroom of just `0.0004` (0.04%). This is statistically plausible (60 samples from N(0,1) is a small sample; sample std naturally has significant variance), but it's close enough to the bound that a future change to the Phase 57-01 `boxMuller` implementation, or a reorder of faker-consuming call sites upstream of `defaultLoadings`, could push it over.

**Mitigation options for the future (if the std bound gets crossed):**

- Widen the bound to `[0.75, 1.25]` (still loose; still catches clear bugs like `NaN` contamination).
- Increase `n` to ≥ 200 entries (e.g. 40 questions × 5 dims); tighter CI narrows the bound uncertainty.
- Switch to a seed-pinned snapshot test (`expect(std).toBeCloseTo(1.199646, 6)`) if we're willing to regenerate when Plan 01 changes.

**Recommendation for Plan 06 / Plan 07 tests:** Prefer `n ≥ 100` for statistical bounds, or use `toBeCloseTo` with seed-pinned expected values. The current test passes, and should continue to pass because `defaultLoadings` is a pure function of `ctx.faker` state + inputs — but Plan 57's downstream tests that stack additional `boxMuller` consumers in front of `loadings` could shift the RNG state and produce a different seed-42 slice.

## Task Commits

Atomic TDD cycle (RED → GREEN → STYLE):

1. **RED:** `test(57-05): add failing tests for defaultLoadings` — `3d638298b`
2. **GREEN:** `feat(57-05): implement defaultLoadings — GEN-06e / D-57-06 / D-57-07` — `7a607f7b2`
3. **STYLE:** `style(57-05): reorder imports in loadings.ts per simple-import-sort` — `2d3c956d1`

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/loadings.ts` (**new**, 104 lines) — Production implementation of `defaultLoadings`, plus compile-time contract assertion against `LatentHooks['loadings']`.
- `packages/dev-seed/tests/latent/loadings.test.ts` (**new**, 135 lines) — 10 unit tests covering:
  1. Matrix shape (keys = external_ids, vectors = length-dims, finite entries)
  2. Empty questions → `{}` (Pitfall 3 regression)
  3. `dims === 0` edge (keys present, empty vectors)
  4. Questions with no `external_id` silently skipped
  5. N(0, 1) statistics (loose bounds; see §Observed Statistics above)
  6. Per-question override honored verbatim (D-57-07)
  7. Override copy semantics (mutating output does not touch template)
  8. Wrong-length override → silently falls back to sampling
  9. Determinism under seeded `ctx.faker`
  10. 50-seed loop with no `NaN` / `Infinity` entries (Pitfall 1 regression)

## Decisions Made

- **Pattern-replicated the Phase 56 external_id guard exactly.** `if (!qExtId) continue;` is byte-identical to the guard in `src/emitters/answers.ts`. This is intentional: the projection step (Plan 57-06) will use `questions` and `loadings` as paired inputs, and silently skipping a question in both places keeps the key sets consistent.
- **Inline `[...override]` copy, no helper.** One call site; spread-copy is the idiomatic JS pattern for shallow-copying a number array. No aliasing trap because entries are primitives (`number`s).
- **Wrong-length overrides fall back silently, don't throw.** The zod schema (Plan 01 `latentBlock`) cannot cross-field-validate per-question vector length vs top-level `latent.dimensions` without a bespoke `superRefine` per key, which is both expensive and brittle. A runtime fallback keeps the pipeline running on template drift; the alternative (throw) would turn any template/dims mismatch into a pipeline crash. Future work may add a `ctx.logger` warning when silently dropping a wrong-length override.
- **JSDoc paraphrases the regex-sensitive patterns.** The plan's acceptance criteria require `grep -c` of exactly `1` for `"boxMuller(ctx.faker, 0, 1)"` and `"[...override]"`. Rather than leaving the patterns as-is in the docstring (which would produce `grep -c = 2`), the docstring paraphrases them in prose — keeping the greps unambiguous AND keeping the docstring explanation intact. The JSDoc module-level header still references D-57-06/07, Pitfall 1/3, and T-57-21/22/23 by ID for later trace.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Style] Import order after `yarn lint --fix`**

- **Found during:** Task 1 verification (running `yarn workspace @openvaa/dev-seed lint` per CLAUDE.md's required check).
- **Issue:** The plan's `<interfaces>` sample placed type imports before the runtime `import { boxMuller } from './gaussian'`. The repo's `simple-import-sort/imports` ESLint rule requires runtime imports before type-only imports (ascending by `import type` status, then alphabetized). Initial commit violated the rule; lint ran red.
- **Fix:** Ran `yarn lint --fix` on the dev-seed workspace (scoped to avoid a pre-existing `@openvaa/supabase` lint issue that breaks the repo-root `yarn lint:fix`). Eslint reordered imports to: `boxMuller` (runtime) → `TablesInsert` → `Ctx` → `LatentHooks, LoadingMatrix` (all type-only). Behavior unchanged; type-checking + 151 tests + 10 grep assertions still green.
- **Files modified:** `packages/dev-seed/src/emitters/latent/loadings.ts`.
- **Commit:** `2d3c956d1` (`style(57-05): reorder imports in loadings.ts per simple-import-sort`).
- **Also fixed, post-implementation:** JSDoc paraphrased the `boxMuller(ctx.faker, 0, 1)` and `[...override]` patterns that originally appeared both in code AND in docstring prose — this kept the plan's `grep -c = 1` acceptance criteria satisfied without losing the docstring narrative (reworded the `## Determinism` block to reference the patterns indirectly).

**2. [Rule 2 - Critical] Workspace install recovery**

- **Found during:** First test run attempt — `yarn workspace @openvaa/dev-seed test:unit` reported `Couldn't find the node_modules state file`.
- **Issue:** The worktree started without a populated `node_modules` state file; `yarn install` was required once before any test runner could find its dependencies.
- **Fix:** Ran `yarn install` (emitted the pre-existing `YN0060` zod peer-dependency warning that was documented in 57-01 SUMMARY; not introduced by this plan). All subsequent test runs work.
- **Files modified:** none (install side effect only — `yarn.lock` was not regenerated; only `.pnp.*` rewritten).
- **Committed in:** n/a (tooling recovery, no source changes).

---

**Total deviations:** 2 auto-fixed — 1 Rule 1 Style (import order + JSDoc pattern paraphrase) + 1 Rule 2 Critical (workspace bootstrap).
**Impact on plan:** Minimal. No behavior change to the shipped code; Plan's `<interfaces>` sample and `<acceptance_criteria>` greps both remain satisfied exactly.

## Issues Encountered

- **Worktree base commit correction:** Started at `9e0399286…`; hard-reset to required base `85d023c4e…` per `<worktree_branch_check>` protocol before any edits. Verified post-reset HEAD matches.
- **`yarn lint:fix` at repo root fails on unrelated `@openvaa/supabase` lint error:** Scoped the lint fix to `yarn workspace @openvaa/dev-seed lint --fix` to isolate the lint autofix to the files my plan modified. The supabase lint error is out of scope and pre-existing — logged as a potential deferred-items entry, but NOT fixed here (SCOPE BOUNDARY rule).
- **Statistical test observed-std is tight against the upper bound (0.04% headroom).** Documented in detail under "Observed N(0, 1) Statistics" above. Test passes. If Plan 06 / Plan 07 shift the RNG state at seed 42 before `loadings` is called, this bound could tighten further — recommended loose bound or `toBeCloseTo`/snapshot approach for downstream tests.

## Self-Check

Before marking this plan complete, verified every claim:

- **Files created:**
  - `packages/dev-seed/src/emitters/latent/loadings.ts` → FOUND ✓
  - `packages/dev-seed/tests/latent/loadings.test.ts` → FOUND ✓
- **Commits present** (`git log --oneline --all | grep`):
  - `3d638298b` → FOUND ✓ (RED)
  - `7a607f7b2` → FOUND ✓ (GREEN)
  - `2d3c956d1` → FOUND ✓ (STYLE)
- **Acceptance criteria grep counts** (all exactly match plan targets):
  - `grep -c "export function defaultLoadings" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "if (!qExtId) continue" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "override.length === dims" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "boxMuller(ctx.faker, 0, 1)" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "\\[\\.\\.\\.override\\]" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "_typecheckLoadings: NonNullable<LatentHooks\\['loadings'\\]>" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "import { boxMuller }" packages/dev-seed/src/emitters/latent/loadings.ts` → 1 ✓
  - `grep -c "@faker-js/faker" packages/dev-seed/src/emitters/latent/loadings.ts` → 0 ✓ (no direct faker import; Ctx-mediated access only)
- **Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 21 files / 151 tests pass (10 new + 141 existing).
- **Loadings-only test file:** `yarn workspace @openvaa/dev-seed test:unit tests/latent/loadings.test.ts` → 10/10 passed.
- **Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.
- **Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0 (clean, no warnings).

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 57-07 (emitter composition shell) can wire `defaultLoadings` directly** — signature matches `LatentHooks.loadings` seam exactly, and the function is pure (only `ctx.faker` is read).
- **Plan 57-06 (project step) can consume this matrix** via `loadings[qExtId]` lookups — key set matches the questions list (same external_id guard both sides).
- **Parallel Wave 2 invariant preserved:** Files disjoint from Plans 57-02 / 57-03 / 57-04 / 57-06 (separate `*.ts` files under `src/emitters/latent/`); `package.json`, `ctx.ts`, `schema.ts` untouched (Plan 01 own those). Merge with other Wave-2 branches should be conflict-free.
- **No new blockers.** Full dev-seed test surface green; typecheck clean; lint clean; all 10 plan acceptance criteria satisfied.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

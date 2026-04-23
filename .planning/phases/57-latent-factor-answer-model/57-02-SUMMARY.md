---
phase: 57-latent-factor-answer-model
plan: 02
subsystem: testing
tags: [dev-seed, latent-emitter, sub-step-default, dimensions, spread, eigenvalues, phase-57-wave-2]

# Dependency graph
requires:
  - phase: 57-latent-factor-answer-model
    plan: 01
    provides: "LatentHooks type surface (dimensions + spread signatures), Template type with .latent? block, Ctx with latent?: LatentHooks field"
provides:
  - "src/emitters/latent/dimensions.ts — defaultDimensions(template): { dims, eigenvalues } — GEN-06a (D-57-01 dims=2, D-57-02 geometric decay ratio 1/3)"
  - "src/emitters/latent/spread.ts — defaultSpread(ctx, tplSpread?): number — GEN-06c (D-57-04 default 0.15, scalar override)"
affects: [57-07-emitter-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-57-13 pure sub-step default: `defaultDimensions` takes ONLY `Template`, no `ctx` — no RNG, no I/O. Called once per pipeline run; memoized into `SpaceBundle` by Plan 57-07's closure cache."
    - "Nullish-coalesce override precedence: `tplSpread ?? DEFAULT_SPREAD` (not `||`) — preserves legal `0` as a deterministic / centroid-collapse mode."
    - "Geometric-decay generalization: `Array.from({ length: dims }, (_, i) => Math.pow(1/3, i))` — D-57-02 ratio expressed as a named `EIGENVALUE_DECAY_RATIO` constant so Plans 03-07 can pin against it without magic-number duplication."
    - "Compile-time contract assertion: `const _x: NonNullable<LatentHooks['dimensions']> = defaultDimensions` guards drift between a sub-step default and its seam signature at TS-check time, not at runtime."
    - "Fresh-array return: `[...tplEig]` spreads the user-supplied eigenvalues so downstream consumers can safely mutate the result without corrupting template state. Default path already produces a fresh `Array.from(...)`."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/dimensions.ts"
    - "packages/dev-seed/src/emitters/latent/spread.ts"
    - "packages/dev-seed/tests/latent/dimensions.test.ts"
    - "packages/dev-seed/tests/latent/spread.test.ts"
  modified: []

key-decisions:
  - "Named `EIGENVALUE_DECAY_RATIO = 1 / 3` constant in dimensions.ts — the plan's acceptance criteria grep against this literal so later plans can also pin against it without re-deriving magic numbers from D-57-02."
  - "Explicit `eigenvalues` override takes precedence AND derives `dims` from `eigenvalues.length` when `dimensions` is unset. When both are supplied, the schema's `.superRefine()` (Plan 01) enforces the length match; this default trusts the validator and honors both."
  - "`defaultSpread(_ctx, tplSpread?)` takes `ctx` purely for signature parity with `LatentHooks.spread`. The `_` prefix communicates the built-in default ignores ctx — future overrides MAY consume it (e.g. random-spread hooks sampling from `ctx.faker`)."
  - "Purity test for spread.ts uses a pre/post faker-draw comparison instead of mocking — proves `defaultSpread` consumed zero draws by checking that `pre` equals the first draw and `post` equals the second draw of a fresh instance. Mocking would test the mock, not the function."

patterns-established:
  - "Sub-step file template: ~25-50 lines, JSDoc header citing decision IDs (D-57-XX), single named export, ONE compile-time contract assertion at the bottom. No barrel re-export."
  - "Sub-step test template: mirror file path under `tests/latent/`, 5-8 focused tests, determinism + purity always covered. Tests construct `Template` via type assertions rather than calling `validateTemplate`, since these defaults receive already-validated templates at runtime."
  - "Hook-signature parity via `NonNullable<LatentHooks[K]>` — every default sub-step (this plan + Plans 03-06) asserts its type against the hook slot it fills. Provides compile-time guardrail so Plan 07 can drop any default into `ctx.latent?.[K]` without adapters."

requirements-completed: [GEN-06a, GEN-06c]

# Metrics
duration: 2m 45s
completed: 2026-04-23
---

# Phase 57 Plan 02: Dimensions + Spread Sub-Step Defaults Summary

**Pure sub-step defaults for `LatentHooks.dimensions` (GEN-06a) and `LatentHooks.spread` (GEN-06c) — zero RNG, zero I/O, <80 lines across two files. Wave-2 parallel-safe (no overlap with Plans 03-06).**

## Performance

- **Duration:** 2m 45s
- **Started:** 2026-04-23T05:44:07Z
- **Completed:** 2026-04-23T05:46:52Z
- **Tasks:** 2 (both executed per TDD RED→GREEN)
- **Files created:** 4 (2 sources + 2 test files)
- **Files modified:** 0

## Accomplishments

- `defaultDimensions(template)` resolves `{ dims, eigenvalues }` per D-57-01 (default `dims = 2`) and D-57-02 (geometric decay ratio `1/3`). Honors all three override paths: `dimensions` only, `eigenvalues` only (derives `dims` from length), or both (respects schema `.superRefine` invariant).
- `defaultSpread(ctx, tplSpread?)` returns `0.15` by default (D-57-04), honors scalar overrides via nullish-coalesce (preserves `0` as a legal deterministic mode), and consumes ZERO faker draws — proven by pre/post sequence-comparison test.
- Both defaults carry compile-time contract assertions against `NonNullable<LatentHooks['dimensions']>` / `NonNullable<LatentHooks['spread']>`, so Plan 07's wiring cannot drift from the seam signatures.
- Exact eigenvalue outputs (for downstream Plans 03-07 that predict cluster-margin / directional-margin behavior):
  - `dims = 1` → `[1]`
  - `dims = 2` → `[1, 1/3]` ≈ `[1, 0.3333333333333333]`
  - `dims = 3` → `[1, 1/3, 1/9]` ≈ `[1, 0.3333333333333333, 0.1111111111111111]`
  - `dims = 4` → `[1, 1/3, 1/9, 1/27]` ≈ `[1, 0.3333333333333333, 0.1111111111111111, 0.037037037037037035]`
- Zero regressions: Phase 56 test suite (141 tests) + Plan 01 tests remain green. Full `yarn workspace @openvaa/dev-seed test:unit` → 22 files / 153 tests passed (+12 from Plan 01 baseline).

## Exported Symbol Surface

Plans 03-07 can pin against these without ambiguity:

**`src/emitters/latent/dimensions.ts`** — 1 export:
- `function defaultDimensions(template: Template): { dims: number; eigenvalues: Array<number> }`

**`src/emitters/latent/spread.ts`** — 1 export:
- `function defaultSpread(_ctx: Ctx, tplSpread?: number): number`

Both files also carry internal `_typecheckDimensions` / `_typecheckSpread` compile-time assertions (no runtime surface); these are intentionally NOT exported.

## Task Commits

Each task committed atomically under a TDD cycle:

1. **Task 1 RED:** `test(57-02): add failing tests for defaultDimensions` — `146529654`
2. **Task 1 GREEN:** `feat(57-02): implement defaultDimensions sub-step (GEN-06a)` — `f7e3be0fe`
3. **Task 2 RED:** `test(57-02): add failing tests for defaultSpread` — `ab10da62c`
4. **Task 2 GREEN:** `feat(57-02): implement defaultSpread sub-step (GEN-06c)` — `5b4bc29d9`

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/dimensions.ts` (new, 47 lines) — `defaultDimensions` pure function + compile-time contract assertion.
- `packages/dev-seed/src/emitters/latent/spread.ts` (new, 28 lines) — `defaultSpread` pure function + compile-time contract assertion.
- `packages/dev-seed/tests/latent/dimensions.test.ts` (new, 71 lines) — 7 tests covering default + all three override paths + purity/determinism.
- `packages/dev-seed/tests/latent/spread.test.ts` (new, 62 lines) — 5 tests covering default + scalar override + `spread=0` edge + purity (zero-faker-draws).

## Decisions Made

- **Eigenvalue decay expressed via named `EIGENVALUE_DECAY_RATIO` constant.** The plan's acceptance criteria grep against this literal; using a named constant also keeps the D-57-02 ratio self-documenting if Plans 03-07 want to reference it.
- **Explicit eigenvalues derive dims from length when `dimensions` is unset.** The alternative (always falling back to `DEFAULT_DIMS = 2`) would silently produce inconsistent state when a user supplies `eigenvalues: [2, 0.5, 0.1]` without `dimensions`. Deriving `dims` from `eigenvalues.length` matches the user's evident intent.
- **Fresh-array return (`[...tplEig]`).** The default-path already produces a fresh array via `Array.from(...)`. Spreading the user-supplied eigenvalues in the override branch ensures consistent mutability semantics — consumers can safely mutate the returned array without corrupting template state.
- **`_ctx` underscore prefix on `defaultSpread`.** Signals the built-in default ignores ctx, while keeping the signature identical to `LatentHooks.spread` so overrides (which MAY read ctx) drop in without adapters.
- **Purity test uses real faker state comparison, not mocks.** A fresh `makeCtx()` with the same seed produces a deterministic draw sequence; by checking that `pre` equals the 1st draw and `post` equals the 2nd draw after calling `defaultSpread` three times, we prove zero draws were consumed. This tests the actual function behavior, not a mock.

## Deviations from Plan

None — plan executed exactly as written. All 12 tests (7 dimensions + 5 spread) passed on the first GREEN run; no auto-fixes required.

## Issues Encountered

- Worktree needed `yarn install` before running tests (clean worktree had no `node_modules`). Single `yarn install` resolved it; no scope impact.
- Pre-existing YN0060 peer-dependency warning on `zod` (openai requires `^3.25.76`, project ships `4.3.6`) — out of scope; not introduced by this plan.

## Threat Flags

None — no new security-relevant surface introduced. Both functions are pure data transformations over pre-validated template input (schema validation happens upstream in Plan 01's `.superRefine`).

## Self-Check

Before marking this plan complete, verified every claim:

- **Files created:** `packages/dev-seed/src/emitters/latent/dimensions.ts`, `packages/dev-seed/src/emitters/latent/spread.ts`, `packages/dev-seed/tests/latent/dimensions.test.ts`, `packages/dev-seed/tests/latent/spread.test.ts` — all FOUND.
- **Commits present:** `146529654`, `f7e3be0fe`, `ab10da62c`, `5b4bc29d9` — all in `git log`.
- **Acceptance criteria (grep checks):**
  - `grep -c "export function defaultDimensions" packages/dev-seed/src/emitters/latent/dimensions.ts` → 1 ✓
  - `grep -c "EIGENVALUE_DECAY_RATIO = 1 / 3" packages/dev-seed/src/emitters/latent/dimensions.ts` → 1 ✓
  - `grep -c "Math.pow(EIGENVALUE_DECAY_RATIO, i)" packages/dev-seed/src/emitters/latent/dimensions.ts` → 1 ✓
  - `grep -c "_typecheckDimensions" packages/dev-seed/src/emitters/latent/dimensions.ts` → 2 ✓ (declaration + `void` reference)
  - `grep -c "export function defaultSpread" packages/dev-seed/src/emitters/latent/spread.ts` → 1 ✓
  - `grep -c "DEFAULT_SPREAD = 0.15" packages/dev-seed/src/emitters/latent/spread.ts` → 1 ✓
  - `grep -c "tplSpread ?? DEFAULT_SPREAD" packages/dev-seed/src/emitters/latent/spread.ts` → 1 ✓
  - `grep -c "_typecheckSpread" packages/dev-seed/src/emitters/latent/spread.ts` → 2 ✓
  - Neither source file imports `@faker-js/faker` (pure functions) ✓
- **Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 22 files / 153 tests passed (Phase 56 regressions + Plan 01 tests + new 12 Plan 02 tests all green).
- **Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.
- **Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0.

## Self-Check: PASSED

## Next Phase Readiness

- **Wave 2 remains parallel-safe.** Files delivered here (`dimensions.ts` / `spread.ts` + their tests) are disjoint from Plans 03-06's file sets — no cross-contamination risk when worktrees merge.
- **Plan 07 (composition shell) can import `defaultDimensions` and `defaultSpread` directly** to wire `ctx.latent?.dimensions ?? defaultDimensions` and `ctx.latent?.spread ?? defaultSpread` into the emitter closure. Signatures are drop-in compatible with the hook slots (compile-time asserted).
- **Eigenvalue values pinned** for Plans 03-07 cluster-margin predictions: default `[1, 1/3]` anisotropy means the first dimension dominates — expect tighter within-party clusters along dim 0, more variance along dim 1. No blockers.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

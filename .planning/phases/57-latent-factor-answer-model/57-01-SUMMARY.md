---
phase: 57-latent-factor-answer-model
plan: 01
subsystem: testing
tags: [dev-seed, latent-emitter, gaussian, box-muller, zod, ctx, schema, phase-57-foundation]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing
    provides: "Ctx + AnswerEmitter D-27 seam, TemplateSchema v4 with .extend()-ready base, @openvaa/dev-seed workspace with vitest, @faker-js/faker v10 seeded-instance pattern (Pattern A), @openvaa/supabase-types for TablesInsert<'questions'>"
provides:
  - "src/emitters/latent/gaussian.ts — boxMuller(faker, mean, stdDev) with Pitfall-1 clamp + D-57-11 stdDev=0 short-circuit (sole Gaussian primitive for Plans 02-06)"
  - "src/emitters/latent/latentTypes.ts — shared type surface: Centroids, LoadingMatrix, SpaceBundle, LatentHooks (D-57-12 swappable seam)"
  - "Ctx.latent?: LatentHooks — optional nested function-pointer seam on ctx; buildCtx leaves undefined by default (Phase 56 callers unaffected)"
  - "TemplateSchema.latent? — zod v4 .extend()'d block with .strict() (typo rejection) + .superRefine() (dimensions/eigenvalues invariant per D-57-02)"
  - "@openvaa/core + @openvaa/matching as workspace runtime deps on dev-seed (unlocks Plan 06 COORDINATE imports + Plan 07 MatchingSpace / manhattanDistance)"
affects: [57-02-dimensions, 57-03-centroids, 57-04-spread, 57-05-positions, 57-06-loadings-project, 57-07-emitter-integration]

# Tech tracking
tech-stack:
  added:
    - "@openvaa/core (workspace:^, runtime dep) — Plan 06 imports COORDINATE"
    - "@openvaa/matching (workspace:^, runtime dep) — Plan 07 integration test imports MatchingSpace, OrdinalQuestion, manhattanDistance"
  patterns:
    - "Box-Muller with Pitfall-1 clamp: `Math.max(faker.number.float({ min: 0, max: 1 }), Number.MIN_VALUE)` — Math.log(0) = -Infinity propagates as NaN; clamping u1 to Number.MIN_VALUE keeps the draw finite."
    - "D-57-11 short-circuit: `if (stdDev === 0) return mean` — skips faker draws entirely for deterministic / noise-free runs; preserves RNG sequence for the next consumer that does need noise."
    - "D-57-12 nested optional seam on ctx: one LatentHooks field with six independently swappable function pointers (dimensions/centroids/spread/positions/loadings/project). Each default built by Plans 02-06 is replaced individually, not wholesale."
    - "D-57-13 closure-memoized space bundle: `SpaceBundle` one-shot state lives in the `latentAnswerEmitter` closure (Plan 07), NOT on ctx — prevents cross-test bleed via shared ctx objects."
    - "zod v4 nested-block extension: `TemplateSchema.extend({ latent: latentBlock.optional() })` with `.strict() + .superRefine()` on the block. `.strict()` catches typos at the offending sub-object (path `['latent']` + issue.keys listing). `.superRefine()` enforces cross-field invariants (eigenvalues.length === dimensions)."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/gaussian.ts"
    - "packages/dev-seed/src/emitters/latent/latentTypes.ts"
    - "packages/dev-seed/tests/latent/gaussian.test.ts"
    - "packages/dev-seed/tests/template/latent.schema.test.ts"
  modified:
    - "packages/dev-seed/package.json (added @openvaa/core + @openvaa/matching workspace deps)"
    - "packages/dev-seed/src/ctx.ts (added `latent?: LatentHooks` field + import)"
    - "packages/dev-seed/src/template/schema.ts (added `latentBlock` + `.extend({ latent: latentBlock.optional() })`)"

key-decisions:
  - "Adopted Box-Muller with Pitfall-1 clamp (Math.max u1 Number.MIN_VALUE) and D-57-11 stdDev=0 short-circuit — single Gaussian primitive for all Plans 02-06; no parallel boxMullerPair variant."
  - "Placed SpaceBundle in latentTypes.ts (not a runtime file) — it's a type-only artifact used by the Plan 07 closure; leaving it here keeps the type barrel canonical and lets downstream plans import it with `import type { SpaceBundle }`."
  - "latentTypes.ts imports ONLY TablesInsert/Ctx/Template (no Faker) — the LatentHooks signatures don't reference Faker directly (Faker is used inside default implementations, not in the seam surface). Avoids a dangling import."
  - "Test 6 (TMPL-09 + .strict) regex adjusted to match zod v4's actual output `template.latent: Unrecognized key: \"loading\"`. zod v4 emits unrecognized_keys with path `['latent']` (not `['latent','loading']`); the key name appears in the message body. Test intent — proving typos surface — preserved; Phase 56 error formatter untouched."

patterns-established:
  - "Latent emitter directory convention: `src/emitters/latent/` holds the six sub-step defaults (Plans 02-06), the emitter shell (Plan 07), and the shared type barrel. Tests mirror in `tests/latent/`. No barrel `index.ts` at src/emitters/latent/ — Plan 07 owns the assembly step."
  - "Named-only exports (D-57-15): every type / helper in latentTypes.ts and gaussian.ts is named-exported. No default exports; keeps downstream `import { boxMuller } from './gaussian'` and `import type { LatentHooks } from './latentTypes'` unambiguous."
  - "Test determinism pattern: `seededFaker(seed = 42)` helper constructs a fresh `Faker({ locale: [en] })` + `.seed()` per test — mirrors Pattern A from RESEARCH §5 and dev-seed's determinism.test.ts."

requirements-completed: [GEN-06, GEN-06a, GEN-06g]

# Metrics
duration: 7m 11s
completed: 2026-04-23
---

# Phase 57 Plan 01: Latent-Factor Foundation Summary

**Box-Muller helper (Pitfall-1-safe, D-57-11 short-circuit) + LatentHooks type barrel + Ctx/TemplateSchema `.latent?` extension — ships the Wave 1 foundation that every downstream Plan 57-02..57-07 file imports.**

## Performance

- **Duration:** 7m 11s
- **Started:** 2026-04-23T05:29:55Z
- **Completed:** 2026-04-23T05:37:06Z
- **Tasks:** 2 (both executed per TDD RED→GREEN)
- **Files modified:** 7 (3 created under `src/`, 2 created under `tests/`, 3 modified: `package.json`, `ctx.ts`, `schema.ts`)

## Accomplishments

- `boxMuller(faker, mean, stdDev)` ships with both Phase 57 invariants in place: Pitfall-1 `Math.max(u1, Number.MIN_VALUE)` clamp prevents `NaN` propagation; D-57-11 `if (stdDev === 0) return mean` short-circuit avoids faker draws on deterministic / noise-free runs. Validated by 5 tests over 10,000-draw statistics + determinism + finiteness.
- `LatentHooks` (D-57-12 swappable seam) plus `SpaceBundle`, `Centroids`, `LoadingMatrix` are exported byte-for-byte matching the plan's `<interfaces>` block. Every Plan 57-02..57-07 file can now `import type { LatentHooks } from '../latentTypes'` and satisfy the seam contract without negotiating the shape with its peers.
- `ctx.ts` carries the optional `latent?: LatentHooks` field per D-57-12 with `buildCtx` body untouched — Phase 56 callers (14 existing unit tests, 3 determinism runs, writer/pipeline tests) stay untouched and remain green.
- `TemplateSchema` accepts a nested `latent` block with `.strict()` (typos rejected) + `.superRefine()` (dimensions/eigenvalues length invariant enforced per D-57-02). The existing `validateTemplate` formatter continues to emit `template.<path>: <message>` errors without modification.
- `@openvaa/core` and `@openvaa/matching` are pinned as workspace `dependencies` (not devDeps) so Plan 06's `project.ts` can import `COORDINATE` and Plan 07's `clustering.integration.test.ts` can import `MatchingSpace` / `manhattanDistance` at runtime.

## Exported Symbol Surface

Plans 02-07 can pin against these without ambiguity:

**`src/emitters/latent/gaussian.ts`** — 1 export:
- `function boxMuller(faker: Faker, mean?: number, stdDev?: number): number`

**`src/emitters/latent/latentTypes.ts`** — 4 exports:
- `type Centroids = Array<Array<number>>`
- `type LoadingMatrix = Record<string, Array<number>>`
- `interface SpaceBundle { dims; eigenvalues; centroids; loadings; spread; noiseStdDev; parties }`
- `interface LatentHooks { dimensions?; centroids?; spread?; positions?; loadings?; project? }` (function signatures identical to plan `<interfaces>` block)

**`src/ctx.ts`** — Ctx interface gains one additive field:
- `latent?: LatentHooks` (behind the existing `answerEmitter?: AnswerEmitter` field, preserving D-27 seam ordering)

**`src/template/schema.ts`** — TemplateSchema gains one additive top-level optional:
- `latent?: { dimensions?; eigenvalues?; centroids?; spread?; loadings?; noise? }` (all nested fields optional; block carries `.strict()` + `.superRefine()`)

## Task Commits

Each task committed atomically under a TDD cycle:

1. **Task 1 RED:** `test(57-01): add failing tests for Box-Muller gaussian helper` — `10e9c7eff`
2. **Task 1 GREEN:** `feat(57-01): add latent emitter foundation — deps, types, gaussian helper` — `e3a77b38e`
3. **Task 2 RED:** `test(57-01): add failing tests for template latent block` — `50821b22f`
4. **Task 2 GREEN:** `feat(57-01): extend Ctx + TemplateSchema with latent block` — `93a4fc464`

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/gaussian.ts` (new) — `boxMuller` helper with Pitfall-1 clamp + D-57-11 short-circuit.
- `packages/dev-seed/src/emitters/latent/latentTypes.ts` (new) — Shared Phase 57 type barrel: `LatentHooks`, `SpaceBundle`, `Centroids`, `LoadingMatrix`.
- `packages/dev-seed/tests/latent/gaussian.test.ts` (new) — 5 tests: N(0,1) statistics, mean/std scaling, NaN/Infinity guard, stdDev=0 short-circuit, seeded determinism.
- `packages/dev-seed/tests/template/latent.schema.test.ts` (new) — 7 tests: empty-template regression, empty latent accepted, matching dims/eigenvalues accepted, mismatch rejected (D-57-02), negative noise rejected, typo rejected via `.strict()`, Ctx.latent compile-time smoke check.
- `packages/dev-seed/package.json` (modified) — Added `@openvaa/core: workspace:^` and `@openvaa/matching: workspace:^` under dependencies.
- `packages/dev-seed/src/ctx.ts` (modified) — Added `import type { LatentHooks } from './emitters/latent/latentTypes'` and `latent?: LatentHooks` field on the `Ctx` interface. `buildCtx` body unchanged.
- `packages/dev-seed/src/template/schema.ts` (modified) — Added `latentBlock` constant (z.object with `.strict()` + `.superRefine()`); converted `TemplateSchema` export to `z.object({...}).extend({ latent: latentBlock.optional() })`.

## Decisions Made

- **Box-Muller clamp + short-circuit inline, no helper wrapper.** The two guards (`Math.max u1 Number.MIN_VALUE` and `if (stdDev === 0) return mean`) live in one `boxMuller` function body per the plan's `<interfaces>` block. Keeps the Pitfall-1 audit surface at one file and avoids a parallel `boxMullerPair` helper — sub-step files that need two independent draws call `boxMuller` twice.
- **`latentTypes.ts` is type-only (no runtime imports).** `Faker` was originally in the imports list but no `LatentHooks` signature references it; dropped the unused import rather than paper over it with a `void` statement. All imports now satisfy `import type` semantics.
- **Zod `.strict()` + `.superRefine()` at the block level.** The plan prescribed both at the `latent` block; neither got lifted to the top-level `TemplateSchema`, which would have changed Phase 56 regression behavior. The `.superRefine()` runs only when both `dimensions` and `eigenvalues` are provided — leaving either undefined still passes (consistent with D-18 optional-field philosophy).
- **Imports in ctx.ts stay alphabetized by specifier path.** `LatentHooks` import slots between `AnswerEmitter` (`./emitters/answers`) and `Template` (`./template/types`) to match the existing sort convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 6 regex adjusted to match zod v4's `.strict()` error path**

- **Found during:** Task 2 (Extend Ctx + TemplateSchema)
- **Issue:** Plan prescribed `expect(...).toThrow(/template\.latent\.loading/)` for the `.strict()` typo-catching test. zod v4 emits `unrecognized_keys` with `path: ['latent']` (not `['latent','loading']`) and lists the offending keys in the message body. The validator's existing formatter produces `template.latent: Unrecognized key: "loading"` — which does not contain the literal substring `template.latent.loading`. The test was genuinely asserting against a zod v3 path convention that zod v4 no longer uses.
- **Fix:** Updated the regex to `/template\.latent:.*Unrecognized key.*"loading"/`. The test still proves the typo surfaces to the user (intent preserved) without touching the Phase 56 error formatter.
- **Files modified:** `packages/dev-seed/tests/template/latent.schema.test.ts` (Test 6 body + docstring bullet).
- **Verification:** `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` → 7/7 pass.
- **Committed in:** `93a4fc464` (Task 2 GREEN commit — documented in commit body).

---

**Total deviations:** 1 auto-fixed ([Rule 1 - Bug] test regex vs zod v4 behavior)
**Impact on plan:** Minimal. The test intent (prove `.strict()` catches typos) is fully preserved; only the pattern-matching regex was adjusted to match zod v4's actual output format. Phase 56 error-format behavior untouched. No new code needed and no scope change.

## Issues Encountered

- Worktree base commit differed from the expected `67f1d365...` on startup (HEAD was at `9e0399286`). Hard-reset to the correct base per the `<worktree_branch_check>` protocol before any edits. Verified post-reset HEAD matches.
- `yarn install` emitted a pre-existing `YN0060` peer-dependency warning on `zod` (openai requires `^3.25.76`, project ships `4.3.6`). Out of scope — not introduced by this plan; the warning already existed on the base commit.

## Self-Check

Before marking this plan complete, verified every claim:

- **Files created:** `packages/dev-seed/src/emitters/latent/latentTypes.ts`, `packages/dev-seed/src/emitters/latent/gaussian.ts`, `packages/dev-seed/tests/latent/gaussian.test.ts`, `packages/dev-seed/tests/template/latent.schema.test.ts` — all FOUND.
- **Files modified:** `packages/dev-seed/package.json`, `packages/dev-seed/src/ctx.ts`, `packages/dev-seed/src/template/schema.ts` — all committed.
- **Commits present:** `10e9c7eff`, `e3a77b38e`, `50821b22f`, `93a4fc464` — all in `git log`.
- **Acceptance criteria** (grep checks from plan):
  - `grep -c "@openvaa/core" packages/dev-seed/package.json` → 1 ✓
  - `grep -c "@openvaa/matching" packages/dev-seed/package.json` → 1 ✓
  - `grep -c "export function boxMuller" packages/dev-seed/src/emitters/latent/gaussian.ts` → 1 ✓
  - `grep -c "Math.max(faker.number.float" packages/dev-seed/src/emitters/latent/gaussian.ts` → 1 ✓
  - `grep -c "if (stdDev === 0) return mean" packages/dev-seed/src/emitters/latent/gaussian.ts` → 1 ✓
  - `grep -c "^export" packages/dev-seed/src/emitters/latent/latentTypes.ts` → 4 ✓
  - `grep -c "latent?: LatentHooks" packages/dev-seed/src/ctx.ts` → 1 ✓
  - `grep -c "const latentBlock = z" packages/dev-seed/src/template/schema.ts` → 1 ✓
  - `grep -c ".extend({ latent: latentBlock.optional() })" packages/dev-seed/src/template/schema.ts` → 1 ✓
- **Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 20 files / 141 tests passed (Phase 56 regressions + new 12 Phase 57 tests all green).
- **Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.
- **Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0.

## Self-Check: PASSED

## Next Phase Readiness

- **Wave 2 unblocked.** Plans 57-02, 57-03, 57-04, 57-05, 57-06 can now run in parallel — each imports `boxMuller` / `LatentHooks` from files shipped here. Template schema changes mean sub-step files can also read `template.latent?.dimensions`, `template.latent?.eigenvalues`, etc. with full type inference via `z.infer<typeof TemplateSchema>`.
- **Plan 57-07 (composition shell) can reference `SpaceBundle` directly** for its memoized-closure cache — type is already in place.
- **No blockers.** Phase 56 regression surface green; typecheck clean; lint clean; 141/141 tests pass.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

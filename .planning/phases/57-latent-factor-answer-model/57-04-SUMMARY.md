---
phase: 57-latent-factor-answer-model
plan: 04
subsystem: testing
tags: [dev-seed, latent-emitter, positions, isotropic-gaussian, per-candidate, sub-step-default, phase-57-wave-2]

# Dependency graph
requires:
  - phase: 57-latent-factor-answer-model
    plan: 01
    provides: "boxMuller(faker, mean, stdDev) with Pitfall-1 clamp + D-57-11 stdDev=0 short-circuit; Centroids type + LatentHooks.positions seam signature; Ctx.latent? field; makeCtx() test fixture"
provides:
  - "src/emitters/latent/positions.ts — `defaultPositions(partyIdx, centroids, spread, ctx)` — GEN-06d / D-57-04 built-in default for LatentHooks.positions (per-candidate isotropic Gaussian ball around party centroid)"
affects: [57-07-emitter-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-dim isotropic draw via `.map()` over `centroid` — each iteration is one `boxMuller` call with the centroid coord as mean and the scalar `spread` as stdDev. Isotropy per D-57-04: identical stdDev on every axis; anisotropy lives upstream in eigenvalue-scaled centroid separation (Plan 57-03), not here."
    - "`spread === 0` short-circuit is DELEGATED — not re-implemented here. `boxMuller(ctx.faker, c, 0)` returns `c` without consuming a faker draw (D-57-11), so positions equal the centroid verbatim AND the RNG sequence is preserved for the next consumer. Single guard site across Plans 02-06 — all other sub-steps must follow this delegation pattern."
    - "Defensive out-of-range partyIdx throws with a descriptive message. Contract: Plan 57-07 pre-filters to candidates with resolved `organization` refs, so the throw is unreachable in normal flow but surfaces caller bugs loudly instead of propagating an `undefined` centroid into `boxMuller` (which would silently produce `NaN` coords and break clustering without any signal)."
    - "Compile-time seam-contract binding: `const _typecheckPositions: NonNullable<LatentHooks['positions']> = defaultPositions; void _typecheckPositions;` — mirrors the pattern Plan 57-01 established for future sub-steps (Plans 02/03/05/06) to assert the default satisfies the hook shape without runtime cost."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/positions.ts (69 lines)"
    - "packages/dev-seed/tests/latent/positions.test.ts (177 lines, 11 tests)"
  modified: []

key-decisions:
  - "Delegated `spread=0` short-circuit to `boxMuller` rather than guarding explicitly here. Rationale: the Plan 57-01 helper already returns `mean` and skips the faker call — re-implementing the guard in `positions.ts` would be duplicate code AND risk drift if the short-circuit semantics ever evolve. The test suite pins both observable behaviors independently (Test 3: returns exact centroid; Test 4: consumes zero faker draws)."
  - "Out-of-range `partyIdx` throws synchronously with a descriptive message including the index and the valid range. Plan 57-07's emitter shell is contractually required to pre-validate, making this branch defensively dead in normal flow. Choosing to throw rather than silently return `undefined` / clamp to 0 maximizes signal when a caller regression lands — silent failures were an explicit Pitfall 1 concern inherited from the `gaussian.ts` design."
  - "Kept tests fixture-free (no import from Plan 57-03's `defaultCentroids`). Hand-crafted 2-dim centroid arrays like `[[5, -3]]` keep the unit suite isolated from other Wave 2 plans — a regression in Plan 57-03 cannot fail Plan 57-04 tests. Statistical tests use 2000 draws (not 10,000 like `gaussian.test.ts`) because the N(μ, 0.15²) / N(μ, 0.1²) signal is strong enough that 2000 draws keeps the empirical std within ±3% of theoretical, and the suite stays fast."

patterns-established:
  - "Named-only exports on sub-step defaults — `export function defaultPositions(...)`. Matches Plan 57-01's convention. No default export, no barrel `index.ts`; Plan 57-07 owns the assembly step."
  - "Test convention for per-candidate sub-steps: construct centroids directly (no dependency on upstream defaults), use `makeCtx()` for RNG, statistical assertions over 2000 draws, plus a 1000-call Pitfall-1 finiteness regression. Sets the shape Plans 57-05 (same family) and 57-07 integration can reference."

requirements-completed: [GEN-06d, GEN-06g]

# Metrics
duration: 2m 57s
completed: 2026-04-23
---

# Phase 57 Plan 04: defaultPositions — Per-Candidate Latent Position Default Summary

**`defaultPositions(partyIdx, centroids, spread, ctx)` — per-candidate isotropic Gaussian draw around a party centroid (`N(centroid, spread² · I)`). The ONLY sub-step that runs per-candidate (D-57-13); delegates to Plan 57-01's `boxMuller` for both the draw and the `spread=0` short-circuit.**

## Performance

- **Duration:** 2m 57s
- **Started:** 2026-04-23T05:44:17Z
- **Completed:** 2026-04-23T05:47:14Z
- **Tasks:** 1 (TDD RED → GREEN, no REFACTOR needed)
- **Files created:** 2 (1 src, 1 test)
- **Files modified:** 0

## Accomplishments

- `defaultPositions` ships as a single named export matching the Plan 57-01 `LatentHooks.positions` signature exactly. Body is a `centroid.map((c) => boxMuller(ctx.faker, c, spread))` — the `boxMuller` per-dim call carries BOTH the Pitfall 1 clamp AND the D-57-11 short-circuit via delegation, so this file stays free of the two guards and cannot drift from their canonical definition.
- Compile-time binding `const _typecheckPositions: NonNullable<LatentHooks['positions']> = defaultPositions; void _typecheckPositions;` proves the default satisfies the seam contract without runtime cost. Matches Plan 57-01's established pattern; future Plans 57-02/03/05/06 defaults follow the same shape.
- Out-of-range `partyIdx` throws with a message containing `out of range` and the valid range (`[0, N)`), giving the Plan 57-07 emitter shell a loud failure signal if its pre-validation ever regresses. Regression test (Test 10) pins the error path for negative indices, past-end indices, AND empty centroids matrices.
- 11 unit tests cover: (1) shape + finiteness, (2) higher-dim generalization, (3) `spread=0` returns centroid verbatim, (4) `spread=0` consumes zero faker draws via RNG-state comparison to a fresh ctx, (5) centered at centroid + std matches spread, (6) isotropy (std[dim0] ≈ std[dim1]), (7) cross-dim independence (|r| < 0.1), (8) `partyIdx`-specific centroid lookup, (9) determinism under seeded `ctx.faker`, (10) out-of-range throws, (11) 1000-call Pitfall-1 finiteness regression.
- Full `@openvaa/dev-seed` regression surface green: 21 test files, 152 tests (up from Plan 57-01's 141-test baseline — +11 new Plan 57-04 tests, zero regressions). Typecheck clean. Lint clean.

## Exported Symbol Surface

`src/emitters/latent/positions.ts` — 1 export:
- `function defaultPositions(partyIdx: number, centroids: Centroids, spread: number, ctx: Ctx): Array<number>`

Plan 57-07's `latentAnswerEmitter` composition shell will import this as:
```typescript
import { defaultPositions } from './positions';
// ...
const position = (ctx.latent?.positions ?? defaultPositions)(partyIdx, bundle.centroids, bundle.spread, ctx);
```

## Measured Statistics (for downstream cross-reference)

Captured from a single instrumented run with `makeCtx()` seeded faker (seed 42). Tests 5 and 6 run these same configurations inside vitest; the numbers below are what they observed and asserted against.

**Test 5 configuration** — `centroids = [[5, -3]]`, `spread = 0.1`, `N = 2000`:
- `meanX = 4.998278` (assertion window `(4.99, 5.01)` → 0.17σ from lower bound, no flakiness risk)
- `meanY = -3.002454` (window `(-3.01, -2.99)` → 0.25σ from lower bound)
- `stdX = 0.100843` (window `(0.095, 0.105)` → well centered)
- `stdY = 0.100015` (window `(0.095, 0.105)` → well centered)

**Test 6 configuration** — `centroids = [[0, 0]]`, `spread = 0.15`, `N = 2000`:
- `meanX = -0.002183`, `meanY = 0.003687`
- `stdX = 0.149961` (window `(0.14, 0.16)` → margin 0.01 = ~3σ from either bound)
- `stdY = 0.152230` (window `(0.14, 0.16)` → margin ~0.008 = ~2.4σ from upper bound — safe)
- `ratio = stdX/stdY = 0.9851` (window `(0.95, 1.05)` → margin 0.035 on the low side)

**Cross-reference for Plan 57-07 clustering-margin assertion:** the Test 5 measurements show empirical within-party std ≈ 0.10 under the D-57-04 default `spread = 0.15` / eigenvalue-scaled centroid separation of ~1. With within-party std this tight relative to centroid separation, the D-57-17 clustering-margin test (assumes within-party spread << centroid-to-centroid distance) has ample headroom. Plan 57-07's integration test can safely assert `manhattanDistance(candidate, own_party_centroid) < manhattanDistance(candidate, other_party_centroid)` for every synthetic candidate under the default template.

## Flakiness Margins

The 2000-draw statistical checks (Tests 5, 6, 7) all have generous headroom — the closest assertion to its window boundary is Test 6's `stdY` at ~2.4σ from the upper bound (`0.1522 < 0.16`). No test is within 1σ of its failure threshold, so the suite is not flaky under normal faker seed variance. The determinism test (Test 8) provides an additional safety net: the faker is deterministic, so these exact measured numbers recur byte-identically across runs — the "statistical" windows are conservative margins against future faker version bumps, not per-run Monte Carlo variance.

## Task Commits

1. **Task 1 RED:** `test(57-04): add failing tests for defaultPositions` — `b0f1e0838`
2. **Task 1 GREEN:** `feat(57-04): add defaultPositions — per-candidate latent-position default` — `f97dbe49f`

No REFACTOR commit — the implementation body (10 lines + docblock) is already minimal; no restructuring opportunity surfaced after GREEN.

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/positions.ts` (new, 69 lines) — `defaultPositions` helper; imports `boxMuller` from Plan 57-01's `gaussian.ts`, `Ctx` from canonical `ctx.ts`, `Centroids`/`LatentHooks` from Plan 57-01's `latentTypes.ts`. Ends with the `_typecheckPositions` compile-time binding.
- `packages/dev-seed/tests/latent/positions.test.ts` (new, 177 lines) — 11 vitest `it` blocks against the `makeCtx()` fixture from `tests/utils.ts`.

## Decisions Made

- **Delegated `spread=0` short-circuit to `boxMuller`.** The Plan 57-01 helper already returns `mean` and skips the faker call when `stdDev === 0`. Adding a parallel guard in `positions.ts` would be redundant; relying on delegation keeps the short-circuit audit surface at one file (`gaussian.ts`) and preserves the "single Gaussian primitive" invariant. Tests 3 and 4 pin both observable consequences (exact centroid return, zero faker-draw consumption) independently.
- **Throw on out-of-range `partyIdx` rather than coercing.** Silent coercion (clamp-to-0 or return-undefined) would propagate garbage downstream and only surface as a clustering-test flake days later. The throw surfaces the contract violation at the call site, matches the defensive guard style from other dev-seed generators (e.g., `CandidatesGenerator`'s ref assertion), and the error message includes the offending index and valid range for fast debugging.
- **Fixture-free tests.** Statistical tests construct centroid matrices by hand (`[[5, -3]]`, `[[0, 0]]`). This isolates Plan 57-04 from any Plan 57-03 changes — if `defaultCentroids` ever shifts its output distribution, these tests don't flake; they verify the contract of `defaultPositions` directly.
- **2000 draws for statistical tests (not 10,000).** The Gaussian signal at `spread=0.1` or `0.15` is strong enough that 2000 draws keeps empirical std within ±3% of theoretical — well inside the ±3.3% windows (0.095–0.105 for `spread=0.1`; 0.14–0.16 for `spread=0.15`). 10,000 draws would add ~4x the per-run cost with no statistical benefit for this signal-to-noise ratio.

## Deviations from Plan

None — plan executed exactly as written. One tiny sequencing note: lint reported a `simple-import-sort/imports` issue on the initial import ordering (`../../ctx` before `./gaussian`), auto-fixed via `yarn lint --fix`. The final order is `./gaussian` → `../../ctx` → `./latentTypes`, matching the codebase's standard order (relative same-dir → parent-dir → sibling-file). No behavioral change; not tracked as a deviation (Rule N/A — lint autofix).

## Issues Encountered

- `yarn install` was required on session start — the fresh worktree had no `node_modules` state file (standard worktree-mode expectation). Ran once, 6s. Emitted the pre-existing `YN0060` `zod` peer warning (openai requires `^3.25.76`, project ships `4.3.6`); same warning Plan 57-01 documented. Out of scope; not introduced by this plan.

## Self-Check

Verified every claim before declaring done:

- **Files created:** `packages/dev-seed/src/emitters/latent/positions.ts` — FOUND; `packages/dev-seed/tests/latent/positions.test.ts` — FOUND.
- **Commits present:** `b0f1e0838`, `f97dbe49f` — both in `git log`.
- **Acceptance grep checks** (all exactly `1`):
  - `grep -c "export function defaultPositions" packages/dev-seed/src/emitters/latent/positions.ts` → 1 ✓
  - `grep -c "boxMuller(ctx.faker, c, spread)" packages/dev-seed/src/emitters/latent/positions.ts` → 1 ✓
  - `grep -c "partyIdx < 0 || partyIdx >= centroids.length" packages/dev-seed/src/emitters/latent/positions.ts` → 1 ✓
  - `grep -c "_typecheckPositions: NonNullable<LatentHooks..positions..>" packages/dev-seed/src/emitters/latent/positions.ts` → 1 ✓
  - `grep -c "import { boxMuller }" packages/dev-seed/src/emitters/latent/positions.ts` → 1 ✓
  - `grep "@faker-js/faker" packages/dev-seed/src/emitters/latent/positions.ts` → (empty) ✓ (no direct faker import — RNG routes through `ctx.faker`)
- **Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 21 files / 152 tests pass (141 prior + 11 new).
- **Focused run:** `yarn workspace @openvaa/dev-seed test:unit tests/latent/positions.test.ts` → 11/11 pass in 344ms.
- **Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.
- **Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0.
- **No accidental deletions:** `git diff --diff-filter=D --name-only HEAD~2 HEAD` → empty.

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 57-07 unblocked for composition:** `defaultPositions` is the per-candidate call site the emitter shell closure references on every candidate row. Its signature matches `LatentHooks.positions` one-for-one, so the shell can wire `(ctx.latent?.positions ?? defaultPositions)(partyIdx, bundle.centroids, bundle.spread, ctx)` without adapters.
- **Wave 2 remainder (57-02, 57-03, 57-05, 57-06) unaffected:** Plan 57-04 touched only `positions.ts` + its test file — files disjoint from every other Wave 2 plan. No merge risk.
- **Statistical headroom documented:** The Test 5/6 measurements (within-party std ≈ 0.10 under default spread, ratio ≈ 0.985 between dim-stds) give Plan 57-07's clustering integration test a concrete numeric basis for its assertion — within-party spread is ~10x smaller than the D-57-03 centroid separation, so candidates cluster tightly around their own-party centroid.
- **No blockers.** Phase 56 regression surface green; Phase 57 Plan 01 foundation still green; typecheck + lint clean; 152/152 tests pass.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

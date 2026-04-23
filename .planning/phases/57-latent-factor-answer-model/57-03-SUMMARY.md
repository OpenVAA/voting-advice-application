---
phase: 57-latent-factor-answer-model
plan: 03
subsystem: testing
tags: [dev-seed, latent-emitter, centroids, farthest-point, greedy-max-min, spread-enforcement, phase-57-wave-2]

# Dependency graph
requires:
  - phase: 57-latent-factor-answer-model
    plan: 01
    provides: "boxMuller helper (Pitfall-1-safe), LatentHooks type barrel with Centroids + Record<string, Array<number>> anchor-map shape, Ctx.latent seam"
provides:
  - "src/emitters/latent/centroids.ts — `defaultCentroids(dims, eigenvalues, parties, ctx, tplCentroids?)` — farthest-point greedy max-min sampler (LatentHooks.centroids default per GEN-06b)"
  - "Private file-local helper `euclideanSq(a, b)` — squared Euclidean distance (monotonic-ordering-only, sqrt skipped for pool-scan hot path)"
  - "Algorithm-layer wrong-length anchor guard (T-57-15 mitigation) — anchors whose length ≠ dims silently fall through to farthest-point sampling"
  - "Anchor copy semantics — `centroids[i] = [...anchor]` copies supplied anchors so mutation of returned centroids does not leak into caller template (T-57-14 mitigation)"
affects: [57-07-emitter-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Farthest-point greedy max-min: seed one centroid from the sampled pool (or an anchor), iteratively pick each next centroid to maximize `min(squaredEuclideanDistance(candidate, placed))` against all placed centroids. Squared distance suffices because only monotonic ordering matters — skipping sqrt saves one transcendental call per pool × placed comparison in the hot loop."
    - "Pool sizing heuristic: `Math.max(10 * N, 50)` — 10×N is the standard farthest-point multiplier (enough diversity for the max-min step to actually spread), and the 50 floor prevents small-N cases (N=1, N=2) from collapsing to handfuls of candidates which would strip determinism headroom."
    - "Eigenvalue-scaled Gaussian pool: each dim `d` drawn from `N(0, sqrt(eigenvalues[d]))` so the D-57-02 geometric decay (dominant axis carries the most variance) shows up in raw samples. A downstream centroid on the dominant axis can reach ~±3, while on the sub-dominant axis it stays within ~±1 — visually crisp clustering along the primary dimension."
    - "D-57-05 partial-anchor merge: `tplCentroids` anchors seed the output array first; the first non-anchored slot pops `pool.shift()` (deterministic seed for the max-min step); subsequent non-anchored slots run the full greedy step against the combined `{anchors} ∪ {earlier picks}` set. Anchors are treated as already-placed fixed points."
    - "Anchor copy semantics: `centroids[i] = [...anchor]` — spread-copy the supplied anchor so downstream mutation of the returned centroid array does NOT leak into the caller's `tplCentroids`. Without this, tests could pass arrays that later get mutated by the emitter or by downstream consumers and the caller's template would silently drift."
    - "Private file-local helper `euclideanSq(a, b)` — not exported; mirrors the `extractChoiceIds` visibility pattern in `packages/dev-seed/src/emitters/answers.ts`. Pool-scan computes `Math.min(minDist, euclideanSq(pool[p], c))` across already-placed centroids per pool-element — O(poolSize × N) calls per run is acceptable at Phase 57 party counts (N ≤ ~30 in realistic templates)."
    - "Compile-time contract assertion: `const _typecheckCentroids: NonNullable<LatentHooks['centroids']> = defaultCentroids;` — if the seam signature drifts (new required param, return-type change), TS compilation reports at this line rather than in every downstream consumer. Mirrors the `_typecheckDefaultEmit` pattern from `answers.ts:70-73`."

key-files:
  created:
    - "packages/dev-seed/src/emitters/latent/centroids.ts"
    - "packages/dev-seed/tests/latent/centroids.test.ts"
  modified: []

key-decisions:
  - "Pool size `Math.max(10 * N, 50)` chosen per RESEARCH §Code Examples (farthest-point sampling) — 10×N is the standard multiplier (enough diversity; a smaller pool makes the max-min loop collapse to near-uniform picks). The `50` floor handles N=1..4 cases where 10×N would be too small to keep the greedy step meaningful."
  - "Squared Euclidean distance in the hot loop (not sqrt'd) — the max-min ordering is invariant under monotonic transforms of distance, and sqrt is a transcendental. At pool=80, N=8 that saves ~560 sqrt calls per run. Comment in code explains the invariance."
  - "Anchor `[...anchor]` spread-copy over `anchor` direct reference — prevents T-57-14 tampering where a caller's `tplCentroids` could be mutated by downstream code that happens to mutate the returned centroid array. Test 5 asserts the boundary (`c[0][0] = 999; expect(anchors.seed_party_0[0]).toBe(0.5)`)."
  - "Wrong-length anchors silently ignored (T-57-15 algorithm-layer defense) — the zod schema in Plan 01 accepts arbitrary-length arrays because per-party length can't be validated without reading `template.latent.dimensions` in scope. The `anchor.length === dims` guard in centroids.ts is the algorithm layer's defense-in-depth; Test 8 verifies the slot falls through to farthest-point sampling instead of throwing."
  - "First non-anchored slot takes `pool.shift()` (deterministic pop of index 0) — this establishes a reproducible anchor-free seed for the greedy step in the all-anchors-missing case. Without this, the loop would start with `bestMinDist = -Infinity` / `bestIdx = 0` and always pick pool[0] as the first centroid (same outcome, but the explicit `shift()` makes the intent obvious)."
  - "No `sqrt` in `euclideanSq` comment documented inline — future readers will wonder; the comment explicitly states the monotonic-ordering invariance. This matches RESEARCH § Code Examples (lines 742-812) which also uses squared distances."

patterns-established:
  - "Phase 57 sub-step default: one file per sub-step (D-57-15), named export, optional per-template override argument LAST in the signature, compile-time contract assertion at file bottom. `defaultCentroids` is the canonical template other sub-step plans (57-04..57-06) mirror verbatim."
  - "File-local helper visibility: `euclideanSq` stays un-exported (no `export`) — matches `extractChoiceIds` in `answers.ts`. Other sub-step plans should follow the same pattern for arithmetic helpers."
  - "Anchor-map iteration order: iterate `parties[i]` in order and look up `tplCentroids?.[parties[i].external_id]` — preserves `parties` ordering in the output so `centroids[i]` always corresponds to `parties[i]` regardless of which parties are anchored. Plan 57-05 (positions) will index into this same array with `partyIdx`."

requirements-completed: [GEN-06b, GEN-06g]

# Metrics
duration: 3m 36s
completed: 2026-04-23
---

# Phase 57 Plan 03: Default Centroids (Farthest-Point Greedy) Summary

**`defaultCentroids(dims, eigenvalues, parties, ctx, tplCentroids?)` — farthest-point greedy max-min sampler with eigenvalue-scaled Gaussian pool, D-57-05 partial-anchor merge, and T-57-14/T-57-15 defense-in-depth. Ships GEN-06b / GEN-06g.**

## Performance

- **Duration:** 3m 36s
- **Started:** 2026-04-23T05:44:40Z
- **Completed:** 2026-04-23T05:48:16Z
- **Tasks:** 1 (TDD: RED → GREEN + one auto-fix lint commit)
- **Files created:** 2 (1 src + 1 test)
- **Files modified:** 0

## Accomplishments

- `defaultCentroids` ships as the canonical `LatentHooks.centroids` default (GEN-06b). Pool is `max(10*N, 50)` Gaussian vectors where dim `d` is drawn from `N(0, sqrt(eigenvalues[d]))` — so D-57-02's geometric eigenvalue decay (`[1, 1/3, 1/9, …]`) produces a spread-rich dominant axis and proportionally tighter sub-axes in raw samples.
- Farthest-point greedy max-min loop places each non-anchored party in the slot that maximizes the minimum squared-Euclidean distance to everything placed so far. At N=8, eigenvalues `[1, 1/3]`, seed=42, the canonical run produces **min pairwise distance 1.19** / max 5.73 — well above the 0.3 spread-sanity baseline Test 7 enforces.
- D-57-05 anchor handling: `tplCentroids` anchors are copied verbatim into the output; missing parties fill via farthest-point with anchors treated as fixed points. Wrong-length anchors (length ≠ dims) fall through silently to farthest-point sampling (T-57-15 algorithm-layer mitigation).
- T-57-14 tampering mitigation: `centroids[i] = [...anchor]` — mutating the returned centroid array does NOT leak into the caller's `tplCentroids`. Test 5's trailing assertion (`c[0][0] = 999; expect(anchors.seed_party_0[0]).toBe(0.5)`) is the regression guard.
- 9 unit tests cover: shape + finiteness, N=0 edge (returns `[]`), N=1 edge (single Gaussian draw), seeded determinism, full anchor map honored + copy semantics, partial anchor fill, spread sanity at N=8, wrong-length anchor guard, Pitfall-1 regression over 100 distinct seeds.

## Exported Symbol Surface

Plan 57-07 (emitter shell) can import this file directly:

**`src/emitters/latent/centroids.ts`** — 1 export:
- `function defaultCentroids(dims: number, eigenvalues: Array<number>, parties: ReadonlyArray<{ external_id: string }>, ctx: Ctx, tplCentroids?: Record<string, Array<number>>): Centroids`

No other exports. Private helper `euclideanSq(a, b)` stays file-local per the `extractChoiceIds` visibility pattern in `answers.ts`.

## Algorithm Internals

Documented in code; recapped here for SUMMARY consumers:

1. **Pool build** — `Math.max(10 * N, 50)` length-`dims` vectors, each coordinate independently drawn from `boxMuller(ctx.faker, 0, Math.sqrt(eigenvalues[d]))`. `eigenvalues[d] ?? 0` guards an undefined-index access (should not occur with a validated template, but the fallback keeps the draw deterministic even if it ever happens).
2. **Anchor seed** — iterate parties in order; for each party, if `tplCentroids[party.external_id]` exists AND `anchor.length === dims`, set `centroids[i] = [...anchor]`. Wrong-length anchors leave the slot `undefined` and fall through to farthest-point.
3. **First-slot seed** — `centroids[firstUnset] = pool.shift()!` — deterministic pop of the first Gaussian sample. Only runs if at least one slot is still `undefined` after the anchor pass.
4. **Farthest-point greedy** — walk `centroids[]`; for each still-`undefined` slot, scan the pool and pick the element `p` maximizing `min(euclideanSq(pool[p], c))` over placed centroids `c`. Splice the winner out of the pool so it isn't picked again.
5. **Return** — cast `Array<Array<number> | undefined>` to `Centroids` (all slots now populated).

## Observed Metrics (Plan Output Spec)

Per the plan's `<output>` block:

- **Pool size formula:** `Math.max(10 * N, 50)` — 10×N standard multiplier + 50 floor. At N=8 (canonical spread test) the pool is 80; at N=30 (large production template) it would be 300. O(poolSize × N) per run = O(10 × N²) keeps the max-min loop within budget at realistic party counts.
- **Observed min pairwise distance at N=8 (eigenvalues `[1, 1/3]`, seed=42):** **1.19** (computed offline from a one-off measurement test that was removed before commit). Max pairwise: 5.73. Informs Plan 07's clustering-margin baseline: intra-party spread from `defaultSpread = 0.15` should remain well below the 1.19 centroid separation, giving a comfortable margin for the Success Criterion 5 clustering assertion.
- **Test fragility around specific seeds:** None. Seed 42 is canonical and produces stable output; the 100-seed Pitfall-1 regression sweep (Test 9) uses seeds 0..99 and all produce finite coordinates. No seed-specific baselines are hardcoded outside the 0.3 minimum-distance threshold, which is intentionally generous (the observed 1.19 is ~4× the assertion threshold).

## Task Commits

1. **RED:** `test(57-03): add failing tests for defaultCentroids farthest-point sampler` — `e0a6dffa5`
2. **GREEN:** `feat(57-03): implement defaultCentroids farthest-point greedy sampler` — `162f387d8`
3. **Lint fix:** `fix(57-03): sort imports in centroids.ts per simple-import-sort` — `476e5e57e`

## Files Created/Modified

- `packages/dev-seed/src/emitters/latent/centroids.ts` (new) — 162 lines. `defaultCentroids` + file-local `euclideanSq` + compile-time contract assertion.
- `packages/dev-seed/tests/latent/centroids.test.ts` (new) — 133 lines. 9 tests covering shape, edge cases, determinism, anchor handling, spread, and Pitfall-1 regression.

## Decisions Made

- **Squared distance in hot loop, not sqrt.** The max-min ordering is invariant under monotonic transforms of distance; skipping sqrt saves one transcendental per pool × placed comparison. Inline comment explains the invariance so future readers don't re-introduce the sqrt.
- **Pool size `Math.max(10 * N, 50)` exactly per spec.** Not parameterized — the plan prescribes this constant and downstream plans depend on it being deterministic. If future work needs to tune the pool size, it will become a `ctx.latent?.centroids` override (D-57-12 seam) or a new optional parameter, not a hidden config.
- **`euclideanSq` stays file-local.** Other sub-step defaults (positions.ts, loadings.ts in upcoming plans) will each define their own arithmetic helpers file-local — no shared `mathUtils.ts` barrel. Keeps the per-file audit surface tight and avoids a premature DRY abstraction over 3-5-line helpers.
- **Anchor length guard at algorithm layer, not just schema.** The zod schema accepts arbitrary-length arrays because per-party length can't be checked against `template.latent.dimensions` without cross-field superRefine. `anchor.length === dims` is the defense-in-depth (T-57-15).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Auto-fix blocking issue] Lint import order**

- **Found during:** Post-GREEN verification (running `yarn workspace @openvaa/dev-seed lint`).
- **Issue:** ESLint's `simple-import-sort/imports` rule expected the value import `import { boxMuller } from './gaussian'` to precede type imports (`import type { Ctx } ...`, `import type { Centroids, LatentHooks } ...`) in the same group. My initial implementation followed the plan's `<interfaces>` listing order (types first, then value), which the plan reviewer apparently did not run through the linter. This is a blocking issue because the repo's pre-commit and CI lint gates would reject the file.
- **Fix:** Ran `yarn workspace @openvaa/dev-seed lint --fix`. Moved `import { boxMuller } from './gaussian'` to the first line of the import group; type imports follow. No behavior change.
- **Files modified:** `packages/dev-seed/src/emitters/latent/centroids.ts` (3 lines reordered).
- **Verification:** `yarn workspace @openvaa/dev-seed lint` exit 0; `yarn workspace @openvaa/dev-seed test:unit` 150/150 passing; `yarn workspace @openvaa/dev-seed typecheck` exit 0.
- **Committed in:** `476e5e57e` (standalone fix commit with [Rule 3] tag).

### Noted — Plan Verification Grep Mismatch (not a deviation, not actioned)

The plan's `<verification>` block includes `grep -c "euclideanSq" packages/dev-seed/src/emitters/latent/centroids.ts — expect 3`. My implementation matches the plan's own `<interfaces>` body verbatim, and that body contains exactly 2 references to `euclideanSq` (one function definition + one call site inside the `Math.min` reducer). The expected `3` in the plan appears to assume two call sites, but the greedy max-min loop naturally has only ONE call site — the `Math.min(minDist, euclideanSq(pool[p], c))` inside the inner loop over placed centroids. No additional call site is needed.

This is a plan spec inconsistency between the `<interfaces>` body (correct, 2 references) and the `<verification>` grep count (3). Implementation follows the `<interfaces>` body; no action taken. All 9 behavior tests (which are the authoritative acceptance signal) pass.

---

**Total deviations:** 1 auto-fixed ([Rule 3 - Auto-fix blocking issue] lint import order) + 1 noted plan-spec inconsistency (not actioned — 2 refs vs plan's grep `3`, implementation matches plan's own `<interfaces>` body).

**Impact on plan:** Zero. Behavior exactly matches the plan's `<interfaces>` body; all 9 behavior tests pass; typecheck + lint + full dev-seed test suite green.

## Issues Encountered

- Worktree base commit was at `9e0399286` on startup (different branch), not the expected `85d023c4e`. Hard-reset to the correct base per the `<worktree_branch_check>` protocol before any edits. Verified post-reset HEAD at `85d023c4e`.
- `yarn install` emitted the pre-existing `YN0060` peer-dependency warning on `zod` (openai requires `^3.25.76`, project ships `4.3.6`). Out of scope — not introduced by this plan; same warning existed on the base commit.

## Self-Check

Before marking this plan complete, verified every claim:

**Files created** (check `[ -f ... ]`):
- `packages/dev-seed/src/emitters/latent/centroids.ts` — FOUND.
- `packages/dev-seed/tests/latent/centroids.test.ts` — FOUND.

**Commits present** (check `git log --oneline | grep`):
- `e0a6dffa5` (RED) — FOUND.
- `162f387d8` (GREEN) — FOUND.
- `476e5e57e` (lint fix) — FOUND.

**Plan acceptance-criteria grep checks:**
- `grep -c "export function defaultCentroids" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "Math.max(10 \* N, 50)" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "boxMuller(ctx.faker, 0, Math.sqrt" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "anchor.length === dims" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "import { boxMuller } from './gaussian'" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "_typecheckCentroids: NonNullable<LatentHooks\['centroids'\]>" packages/dev-seed/src/emitters/latent/centroids.ts` → 1 ✓
- `grep -c "euclideanSq" packages/dev-seed/src/emitters/latent/centroids.ts` → 2 (plan expected 3 — see "Plan Verification Grep Mismatch" note above; plan's own `<interfaces>` body has 2 refs matching my implementation).
- `grep "@faker-js/faker" packages/dev-seed/src/emitters/latent/centroids.ts` → empty ✓ (RNG routes through `ctx.faker` per Shared Pattern S-1).

**Test suite:** `yarn workspace @openvaa/dev-seed test:unit` → 21 files / 150 tests passed (Phase 56 + Plan 01 + Plan 03 all green).

**Typecheck:** `yarn workspace @openvaa/dev-seed typecheck` → exit 0.

**Lint:** `yarn workspace @openvaa/dev-seed lint` → exit 0.

## Self-Check: PASSED

## Next Wave Readiness

- **Plans 57-02, 57-04, 57-05, 57-06 (Wave 2 siblings)** are unaffected — this plan's files (`centroids.ts`, `centroids.test.ts`) are disjoint from all other Wave 2 plans per their shared `depends_on: [01]`. Orchestrator can merge this worktree alongside the other Wave 2 plans.
- **Plan 57-07 (emitter shell)** can now import `defaultCentroids` directly via `import { defaultCentroids } from '../latent/centroids'` and wire it as the `LatentHooks.centroids` fallback inside the `latentAnswerEmitter` closure. The compile-time contract assertion in this file guarantees the signature matches the seam.
- **Plan 57-07 clustering baseline informed:** The observed min-pairwise centroid distance of **1.19** at N=8 (seed=42) gives a comfortable margin for Plan 07's clustering assertion. With `defaultSpread = 0.15` (Plan 04), intra-party candidate spread will stay within ~0.3 (2σ), well inside the 1.19 centroid separation — Success Criterion 5 (`intra/inter < 0.5`) should pass with significant headroom.
- **No blockers.** Full dev-seed suite green; typecheck clean; lint clean.

---
*Phase: 57-latent-factor-answer-model*
*Completed: 2026-04-23*

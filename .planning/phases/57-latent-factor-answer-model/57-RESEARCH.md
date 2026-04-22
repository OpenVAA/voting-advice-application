# Phase 57: Latent-Factor Answer Model — Research

**Researched:** 2026-04-22
**Domain:** synthetic survey-response generation (latent-factor model) inside an existing TypeScript monorepo seam
**Confidence:** HIGH — the phase is codebase-internal; almost every claim below is VERIFIED by reading source files or CONTEXT.md, plus one CITED faker-docs claim and zero unverified external claims. No external library search is required for implementation (D-57-12/13/15 lock the architecture to hand-written small functions using `ctx.faker`).

## Summary

Phase 57 drops a latent-factor answer emitter into the `ctx.answerEmitter`
function-pointer seam that Phase 56 already carved into
`CandidatesGenerator.ts`. The phase's entire algorithmic scope consists of six
small pure functions — dimensions, centroids, spread, positions, loadings,
projection+noise — composed by a single top-down driver. Every decision about
distribution, default values, noise scaling, centroid strategy, test shape, and
margin threshold is already locked in `57-CONTEXT.md` (D-57-01 through
D-57-21). The researcher's job is to surface the **concrete APIs, signatures,
constants, and algorithmic snippets** the planner needs so D-57-08's "leverage
`@openvaa/data` normalization" is actionable, not aspirational.

Four facts dominate the phase's implementation shape:

1. **`@openvaa/data` question classes already know Likert bucketing.** The
   planner must NOT hand-roll bucket boundaries. `SingleChoiceOrdinalQuestion`
   computes each choice's normalized coordinate in `[COORDINATE.Min, COORDINATE.Max]`
   (i.e. `[-0.5, +0.5]`) via `normalizeCoordinate({ value, min, max })`. The
   latent emitter produces a z in the same coordinate range (via a bounded
   tanh / clip), then selects the choice whose normalized position is closest
   to z (or, because ordinals have uniform spacing, the index equivalent to
   `round((z + 0.5) * (scale - 1))`).

2. **The clustering test needs neither Supabase nor the real `@openvaa/data`
   hierarchy.** `MatchingSpace.fromQuestions({ questions })` only requires an
   array of `MatchableQuestion` — a 2-field interface (`id`,
   `normalizeValue(value)`, optional `normalizedDimensions`). The convenience
   helper `OrdinalQuestion.fromLikert({ id, scale })` exported from
   `@openvaa/matching` returns a ready `MatchableQuestion` and matches exactly
   the test shape D-57-18 describes (12 ordinal questions). The emitter's
   output JSONB key (choice `id`) feeds straight into `normalizeValue`.

3. **`@faker-js/faker` has no Gaussian API** — this is VERIFIED against
   fakerjs.dev. Box-Muller built from two `ctx.faker.number.float()` calls
   (range `(0, 1)`) is the only path. The RNG is already seeded per pipeline
   run by Phase 56's `buildCtx`.

4. **Every sub-step cache lives in a closure captured by the emitter
   factory**, not on ctx. The D-57-13 composition sketch builds dims →
   centroids → loadings at first invocation and reuses them for every
   subsequent candidate. No mutation of `ctx`.

**Primary recommendation:** Build `packages/dev-seed/src/emitters/latent/` as
seven files — one per sub-step default (`defaultDimensions`,
`defaultCentroids`, `defaultSpread`, `defaultPositions`, `defaultLoadings`,
`defaultProject`) plus the composition shell (`latentAnswerEmitter`) — each
exported by name per D-57-15. Extend `ctx.ts` with
`latent?: { dimensions?, centroids?, spread?, positions?, loadings?, project? }`.
Extend `TemplateSchema` with a `latent` block via `.extend()` per D-18 / D-57-21.
Place the clustering integration test at
`packages/dev-seed/tests/latent/clustering.integration.test.ts` and unit tests
at `packages/dev-seed/tests/latent/*.test.ts` (one per sub-step). The Phase 57
wire-up of `ctx.answerEmitter` happens in `pipeline.ts` — the only file in
`src/` that changes besides the new `emitters/latent/` tree and the schema
extension.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `57-CONTEXT.md` `<decisions>` block.

#### Latent-Space Geometry (GEN-06a, GEN-06b, GEN-06c, GEN-06d)

- **D-57-01:** Default latent dimension count is **2** (political-compass
  shape). Template override: `latent.dimensions: number`.
- **D-57-02:** Default eigenvalues decay geometrically with ratio **1/3 per
  dimension**: `[1, 1/3, 1/9, ...]` generalizing to `(1/3)^i`. Override:
  `latent.eigenvalues: number[]` (length must equal `latent.dimensions`;
  validator rejects mismatches).
- **D-57-03:** Default centroid sampling: **farthest-point** (greedy max-min
  distance). Seed one centroid at `ctx.faker`-sampled Gaussian position,
  iteratively pick each subsequent centroid to maximize min-distance to the
  already-placed set. Deterministic with seeded faker.
- **D-57-04:** Spread parameter is the **std-dev of an isotropic Gaussian**
  around the party centroid (`candidate_latent ~ N(centroid, spread² · I)`).
  Default `spread = 0.15`. Scalar override only — anisotropic-vector spread
  rejected (eigenvalues already anisotropize variance).
- **D-57-05:** When `template.latent.centroids` supplies literal centroids for
  only some parties, the sampler fills missing parties using farthest-point
  sampling with the supplied centroids treated as fixed anchors. No party
  goes without a centroid.

#### Loadings (GEN-06e) + Latent → Answer Mapping (GEN-06f)

- **D-57-06:** Default question-loading matrix is **dense, entries iid
  N(0,1)**. Shape `(questions.length × latent.dimensions)`. Sampled once per
  run via `ctx.faker`.
- **D-57-07:** Per-question override shape: **numeric array of length
  `latent.dimensions`** attached to the question via
  `questions.fixed[i].loadings: number[]`.
- **D-57-08:** Likert/ordinal mapping **leverages `@openvaa/data`
  question-class normalization contracts**. Planner MUST read
  `packages/data/src/objects/questions/variants/*.ts` +
  `packages/data/src/objects/questions/base/*.ts` + relevant
  `@openvaa/matching` code before hand-rolling bucketing logic.
- **D-57-09:** Categorical / multi-choice uses **per-choice latent loadings**.
  Single-choice: `argmax_i(dot(latent, choice_i_loading))`. Multi-choice:
  include choice if `dot > 0`, guaranteeing ≥1 selection.
- **D-57-10:** Non-Likert / non-choice question types (text, number, boolean,
  date, image, multipleText) **fall back to `defaultRandomValidEmit`** per
  D-21.
- **D-57-11:** Noise = **Gaussian added to z before mapping to answer space**.
  Default std-dev `0.1 · mean(eigenvalues)`. Template override `latent.noise:
  number` (scalar). Draws via `ctx.faker.number.float` Box-Muller; no
  `Math.random`.

#### Sub-Step Hook Architecture (GEN-06g)

- **D-57-12:** Swappable seam: `ctx.latent?: { dimensions?, centroids?,
  spread?, positions?, loadings?, project? }`. Each optional function falls
  back to built-in default.
- **D-57-13:** Internal composition = **flat top-down function**. Space state
  (dims, centroids, loadings) built ONCE on first invocation, memoized in a
  closure; only position + projection run per candidate.
- **D-57-14:** Override precedence when BOTH template data and sub-step hook
  are present: **hook wins over template**. Hooks receive template-supplied
  values as arguments.
- **D-57-15:** Each sub-step default is **exported as a named function** (e.g.
  `defaultCentroidSampler`, `defaultLoadings`). Co-located in
  `packages/dev-seed/src/emitters/latent/`.

#### Clustering Verification (Success Criterion 5)

- **D-57-16:** Verification metric: **Manhattan distance** in
  `@openvaa/matching`'s `MatchingSpace`. Default metric used by the UI.
- **D-57-17:** Margin threshold: **`mean_intra_party / mean_inter_party < 0.5`**.
  Asserted against `seed: 42`.
- **D-57-18:** Test shape: **unit-style, no DB**. 4 parties × 10 candidates ×
  12 ordinal questions, `seed: 42`. Built MatchingSpace, computed margin,
  asserted. Location: `packages/dev-seed/tests/latent/clustering.integration.test.ts`
  (or similar — planner picks exact path).
- **D-57-19:** Per-sub-step unit tests — one test file per default function,
  asserting shape, determinism under fixed `ctx.faker` seed, and boundary
  behavior (n=1, questions.length=0).

#### Fixed + Synthetic Interaction

- **D-57-20:** `candidates.fixed[]` rows **skip the latent pipeline entirely**.
  - Fixed + `answersByExternalId` → used verbatim.
  - Fixed without `answersByExternalId` → falls back to `defaultRandomValidEmit`
    (NOT latent).
  - Synthetic rows → always latent.

#### Template Schema Extension

- **D-57-21:** New top-level field: `latent?: z.object({...}).partial()`
  extending Phase 56 schema. Zod `.strict()` on the nested object for
  field-pointing errors per TMPL-09.

### Claude's Discretion

- Exact layout under `packages/dev-seed/src/emitters/latent/` (one file per
  sub-step vs grouped by theme).
- Whether the "space bundle" cache lives in a closure captured by
  `latentAnswerEmitter` or on `ctx.latent._cache` — no behavior impact.
- Box-Muller vs other Gaussian-from-uniform transform — any approach using
  `ctx.faker.number.float` is acceptable.
- Multi-choice threshold value (exact `> 0` vs a small positive bias).
- Naming: `latentAnswerEmitter` vs `emitLatentAnswers` vs `latentFactorEmitter`.
- Whether the `spread` sub-step hook runs once (returning scalar/array) or
  per-candidate — default implementation is once; hook signature allows either.

### Deferred Ideas (OUT OF SCOPE)

- **Anisotropic spread per dimension** — rejected in Phase 57 (D-57-04).
- **Latin hypercube / max-min-optimization centroid strategies** — rejected as
  default (D-57-03); consumers can plug via `ctx.latent.centroids`.
- **Gaussian-CDF quantile Likert bucketing** — rejected in favor of leveraging
  `@openvaa/data` normalization (D-57-08).
- **DB round-trip integration test** — rejected in Phase 57 in favor of Phase
  58's DX-03.
- **Fixed rows running through latent when they have `organization` ref** —
  rejected (D-57-20).
- **Sparse loading defaults (1-2 dims per question)** — rejected in favor of
  dense Gaussian (D-57-06).
- **Named-dimension override shape (`{ econ: 0.8, social: -0.3 }`)** — rejected
  (D-57-07). Numeric array matches matrix shape.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-06 | Answer-space generative model producing realistic candidate answers with visible party clustering and plausible inter-question correlations | Composition shell `latentAnswerEmitter` in `emitters/latent/` + D-27 seam (§ "Architecture Patterns → Pipeline wiring") |
| GEN-06a | Configurable latent dimensions (optionally with eigenvalues) | `defaultDimensions(template)` returns `{ dims: 2, eigenvalues: [1, 1/3] }` by default (§ "Sub-step defaults → Dimensions") |
| GEN-06b | Party centroids with spread enforcement (default farthest-point) | `defaultCentroids(dims, parties, ctx)` — farthest-point algorithm in § "Algorithmic Snippets → Farthest-point sampling" |
| GEN-06c | Per-party spread controls candidate-to-centroid std-dev | `defaultSpread(ctx)` returns scalar 0.15; signature tolerates vector return for anisotropic hook overrides (§ "Sub-step defaults → Spread") |
| GEN-06d | Candidate latent positions ~ N(centroid, spread²·I) | `defaultPositions(candidate, centroids, spread, ctx)` builds per-dim Box-Muller draws around centroid (§ "Algorithmic Snippets → Box-Muller Gaussian") |
| GEN-06e | Question loadings (question × dim) define inter-question correlations | `defaultLoadings(questions, dims, ctx)` samples dense N(0,1) matrix; per-question override at `questions.fixed[i].loadings` (§ "Sub-step defaults → Loadings") |
| GEN-06f | Projection + noise → valid answer per question type | `defaultProject(position, loadings, questions, ctx)` computes `z = dot + noise` then dispatches by question.type (§ "Algorithmic Snippets → Latent → Likert mapping" + § "Don't Hand-Roll") |
| GEN-06g | Each sub-step is a standalone hook; unit tests cover each in isolation | `ctx.latent = { dimensions?, centroids?, spread?, positions?, loadings?, project? }` seam (D-57-12); one unit test file per default fn (D-57-19) |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives extracted from `/CLAUDE.md` that the planner must honor — any
recommendation in this document implicitly respects them:

- **No `any` in public surface** (NF-03 + CLAUDE.md "Use TypeScript strictly").
  The sub-step signatures below use `Ctx`, `Faker`, `TablesInsert<'questions'>`,
  and concrete number/array types — no `any` escape hatches.
- **Never commit sensitive data** — no .env / credentials in test fixtures.
  Phase 57 is pure pipeline code with no secret surface.
- **TypeScript project references + Turborepo dependency flow.** The new
  latent module imports from `@openvaa/data`, `@openvaa/matching`, and
  `@openvaa/core` (clustering test only). Add these as workspace deps on
  `@openvaa/dev-seed` IF they are not already present (§ "Integration Points
  → package.json changes").
- **Faker catalog dep only.** No new external packages in the catalog — the
  Gaussian draws come from hand-written Box-Muller over
  `ctx.faker.number.float`.
- **Vitest as the runner** for `yarn test:unit`; new `tests/latent/*.test.ts`
  files are picked up automatically by the existing `test:unit` task.
- **Tests must not require env** (D-15 / NF-02). The clustering integration
  test does NOT go through the Writer; it runs the pipeline in-memory and
  feeds synthetic candidates straight into `MatchingSpace`. No Supabase client
  constructed.
- **Localization / WCAG / UI conventions** — not applicable; Phase 57 is
  pipeline code, no UI.
- **Matching conventions:** `MISSING_VALUE` from `@openvaa/core` in matching
  contexts; the latent emitter does NOT emit `MISSING_VALUE` for synthetic
  candidates (every question gets an answer). The D-21 fallback for
  non-ordinal/non-choice types goes through `defaultRandomValidEmit`, which
  currently returns JS primitives (not `MISSING_VALUE`) — consistent with
  Phase 56 behavior.

## Architectural Responsibility Map

Per Step 1.5. The phase is narrow — one tier owns everything.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Latent space construction (dims, eigenvalues) | dev-seed package (Node/tsx pipeline) | — | Pure in-memory computation; reads template, writes to closure-local cache |
| Party centroid sampling | dev-seed package | — | Reads `ctx.refs.organizations` + `ctx.faker`; no external I/O |
| Candidate position sampling | dev-seed package | — | Per-candidate draw, runs inside `CandidatesGenerator` loop via the D-27 seam |
| Loading matrix (Q × D) generation | dev-seed package | — | One-shot at first invocation, cached in closure |
| Latent → valid answer mapping | dev-seed package | `@openvaa/data` (read-only, via the question-variant normalization contracts) | The emitter borrows `normalizeCoordinate` semantics but does NOT instantiate `@openvaa/data` classes; it works directly on raw JSONB choice arrays for simplicity |
| Clustering verification test | dev-seed test suite (vitest, pure Node) | `@openvaa/matching` (`MatchingSpace`, `manhattanDistance`, `OrdinalQuestion.fromLikert`) | Test constructs synthetic `MatchableQuestion`s from `@openvaa/matching`, feeds emitter output as `HasAnswers.answers`, measures pairwise distances |
| Pipeline wire-up (`ctx.answerEmitter = latentAnswerEmitter`) | dev-seed `pipeline.ts` | — | Single assignment at pipeline start, no code path change for `CandidatesGenerator` |

**Why this matters:** All logic lives in one package (`@openvaa/dev-seed`)
and consumes two sibling workspaces (`@openvaa/matching` for the test only,
`@openvaa/data` contracts by reference — see Don't-Hand-Roll note about the
decision NOT to instantiate full Question classes). The emitter does NOT cross
the SvelteKit frontend, Supabase backend, or any other tier.

## Standard Stack

### Core (VERIFIED against installed packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@faker-js/faker` | `^8.4.1` (catalog) — [VERIFIED: yarnrc catalog, installed in `node_modules/@faker-js/faker/package.json` = 8.4.1] | Seeded RNG for Box-Muller draws, centroid sampling, loading matrix entries | Already in catalog + already the `ctx.faker` instance Phase 56 built. No new dep. |
| `zod` | `^4.3.6` (catalog) — [VERIFIED: yarnrc catalog] | `TemplateSchema.extend()` for the `latent` block | Phase 56 `template/schema.ts` is already zod. D-18 pattern is `.extend()`. |
| `@openvaa/matching` | workspace — [VERIFIED: source read] | `MatchingSpace`, `manhattanDistance`, `OrdinalQuestion.fromLikert` for clustering test | D-57-16 mandates using the UI's default distance metric |
| `@openvaa/core` | workspace — [VERIFIED: source read] | `COORDINATE` constants (`Min=-0.5`, `Max=0.5`, `Extent=1`), `normalizeCoordinate`, `MISSING_VALUE` | Used by `@openvaa/data` normalization; latent emitter borrows the same coordinate range semantics |
| `@openvaa/supabase-types` | workspace — [VERIFIED: Phase 56 already depends on this] | `TablesInsert<'candidates'>`, `TablesInsert<'questions'>`, `Enums<'question_type'>` | Already depended on; no change |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/data` | workspace — [VERIFIED: workspace present] | Reference-only for normalization contracts (§ "Don't Hand-Roll") | The emitter does NOT import `@openvaa/data` classes at runtime; we borrow the normalization *formula* (`normalizeCoordinate`) from `@openvaa/core` directly. Adding `@openvaa/data` as a dep would pull the full entity hierarchy for a contract we can satisfy with one primitive |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written Box-Muller | `d3-random` (`randomNormal`) | d3-random is NOT in the catalog; adding it for one function fails the "no new external deps" constraint. Box-Muller is ~5 lines. |
| Hand-written farthest-point | `k-means++` seeding or Latin hypercube | D-57-03 locks farthest-point as default; alternates are hook-overrideable |
| Instantiate `SingleChoiceOrdinalQuestion` for mapping | Borrow `normalizeCoordinate` from `@openvaa/core` | Instantiating would require building `DataRoot` + full `Choice<number>[]` schema — the Question class expects a live data hierarchy. Phase 56 emits raw JSONB rows, not `@openvaa/data` objects. Using the primitive directly is simpler and matches what the data package's `_normalizeValue` does internally. [VERIFIED: `singleChoiceOrdinalQuestion.ts:78` is literally `normalizeCoordinate({ value: numeric, min: this.min, max: this.max })`] |
| Use `@faker-js/faker` Gaussian API | N/A — **does not exist** [VERIFIED: fakerjs.dev/api/number.html, WebFetch 2026-04-22] | Must hand-roll Box-Muller |

**No installation needed.** Every dep listed is already a workspace dep of
`@openvaa/dev-seed` (or resolvable via `workspace:^` once added for the
clustering test).

**Version verification (VERIFIED 2026-04-22 against `.yarnrc.yml` catalog + `packages/dev-seed/node_modules/@faker-js/faker/package.json`):**

```bash
cat .yarnrc.yml | grep faker    # '@faker-js/faker': ^8.4.1
# Installed: 8.4.1
```

## Architecture Patterns

### System Architecture Diagram

```
                 ┌────────────────────────────────────────────┐
                 │ Template (validated by zod, with .latent {}) │
                 └──────────────────┬─────────────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  buildCtx(tpl)   │  Phase 56 already does this
                           │  (ctx.faker,     │
                           │   ctx.refs, …)   │
                           └────────┬─────────┘
                                    │
                                    ▼
                  ┌────────────────────────────────────┐
                  │  pipeline.runPipeline(tpl, …, ctx) │
                  │  NEW in 57: before topo loop,      │
                  │  set ctx.answerEmitter =           │
                  │    latentAnswerEmitter(tpl)        │
                  └──────────────────┬─────────────────┘
                                     │ topo order: …questions → candidates…
                                     ▼
                           ┌───────────────────────┐
                           │ CandidatesGenerator   │  Phase 57 does NOT change this file
                           │ line 93:              │
                           │   emit =              │
                           │   ctx.answerEmitter ?? defaultRandomValidEmit
                           └──────────┬────────────┘
                                      │ per candidate
                                      ▼
           ┌──────────────────────────────────────────────────────┐
           │ latentAnswerEmitter(candidate, questions, ctx)        │
           │                                                       │
           │  ┌─ On first call, build space-bundle cache ──────┐  │
           │  │  dims       = latent.dimensions?(tpl) ?? def   │  │
           │  │  centroids  = latent.centroids?(…) ?? def      │  │
           │  │  loadings   = latent.loadings?(…)  ?? def      │  │
           │  │  spread     = latent.spread?(ctx)  ?? def      │  │
           │  └────────────────────────────────────────────────┘  │
           │                                                       │
           │  per-candidate:                                       │
           │    pos      = latent.positions?(…)   ?? def           │
           │    answers  = latent.project?(…)     ?? def           │
           │                                                       │
           │  For each question q in questions:                    │
           │    if q.type in {ordinal, single-cat, multi-cat}      │
           │       → project latent through loadings + noise → map │
           │    else                                                │
           │       → fall back to defaultRandomValidEmit(q)         │
           └──────────────────┬───────────────────────────────────┘
                              │ Record<questionExtId, { value }>
                              ▼
                    candidate.answersByExternalId
                              │
                              ▼
                  (downstream: importAnswers writes JSONB;
                   Phase 57 verifier test pulls these values
                   straight into a MatchingSpace — no DB.)
```

### Recommended Project Structure

```
packages/dev-seed/src/
├── ctx.ts                       # EXTENDED: add `latent?: { … }` field
├── emitters/
│   ├── answers.ts               # unchanged — defaultRandomValidEmit stays
│   └── latent/                  # NEW — all Phase 57 code
│       ├── index.ts             # re-exports each default + latentAnswerEmitter
│       ├── latentEmitter.ts     # latentAnswerEmitter (the D-57-13 shell)
│       ├── dimensions.ts        # defaultDimensions(template) → { dims, eigenvalues }
│       ├── centroids.ts         # defaultCentroids(dims, eigenvalues, parties, ctx, tplCentroids?)
│       ├── spread.ts            # defaultSpread(ctx, tplSpread?)
│       ├── positions.ts         # defaultPositions(partyIndex, centroids, spread, ctx)
│       ├── loadings.ts          # defaultLoadings(questions, dims, ctx, tplLoadingsByQExtId?)
│       ├── project.ts           # defaultProject(position, loadings, questions, noiseStdDev, ctx)
│       ├── gaussian.ts          # boxMuller(ctx.faker, mean, stdDev) — shared helper
│       └── latentTypes.ts       # LatentHooks, SpaceBundle, LoadingMatrix, Centroids, ...
├── template/
│   └── schema.ts                # EXTENDED: .extend({ latent: z.object({...}).partial() })
├── pipeline.ts                  # MODIFIED: set ctx.answerEmitter = latentAnswerEmitter(tpl)
└── ... (everything else unchanged)

packages/dev-seed/tests/
└── latent/                      # NEW
    ├── dimensions.test.ts
    ├── centroids.test.ts
    ├── spread.test.ts
    ├── positions.test.ts
    ├── loadings.test.ts
    ├── project.test.ts
    ├── gaussian.test.ts         # Box-Muller determinism + mean/variance sanity
    └── clustering.integration.test.ts  # D-57-16/17/18 — the headline assertion
```

**Why per-file, not grouped by theme:** Each sub-step is independently
hook-overrideable; one file per default makes the D-57-19 "unit test per hook"
pattern trivial (one test file imports one source file) and mirrors the
`defaultRandomValidEmit` style Phase 56 established (single named export per
module).

### Pattern 1: Closure-captured space bundle

**What:** Build the one-shot state (dims, centroids, loadings) on first call
and reuse for every subsequent candidate.

**When to use:** The D-57-13 composition — it's the only way to make "one pass
per pipeline run" work without mutating `ctx`.

**Example:**

```typescript
// Source: derived from Phase 56 D-26 pattern + D-57-13 composition spec.
// [VERIFIED: pattern matches existing `defaultRandomValidEmit` in emitters/answers.ts:56]
export function latentAnswerEmitter(template: Template): AnswerEmitter {
  // Closure-scoped cache. Built lazily on first invocation so we have access
  // to ctx.faker (seeded per-run) and ctx.refs.organizations (populated after
  // pipeline topo reaches `candidates`).
  let bundle: SpaceBundle | undefined;

  return function emit(candidate, questions, ctx) {
    if (bundle === undefined) {
      const { dims, eigenvalues } =
        ctx.latent?.dimensions?.(template) ?? defaultDimensions(template);
      const parties = ctx.refs.organizations;
      const centroids =
        ctx.latent?.centroids?.(dims, eigenvalues, parties, ctx, template.latent?.centroids) ??
        defaultCentroids(dims, eigenvalues, parties, ctx, template.latent?.centroids);
      const loadings =
        ctx.latent?.loadings?.(questions, dims, ctx, template.latent?.loadings) ??
        defaultLoadings(questions, dims, ctx, template.latent?.loadings);
      const spread =
        ctx.latent?.spread?.(ctx, template.latent?.spread) ??
        defaultSpread(ctx, template.latent?.spread);
      const noiseStdDev =
        template.latent?.noise ?? 0.1 * mean(eigenvalues); // D-57-11
      bundle = { dims, eigenvalues, centroids, loadings, spread, noiseStdDev, parties };
    }

    // Per-candidate step — the only step that runs for every candidate.
    const partyIdx = findPartyIndexForCandidate(candidate, bundle.parties);
    if (partyIdx < 0) {
      // Candidate has no organization ref — fall back to random-valid
      // (matches Phase 56 behavior for candidates without organization).
      return defaultRandomValidEmit(candidate, questions, ctx);
    }

    const position =
      ctx.latent?.positions?.(partyIdx, bundle.centroids, bundle.spread, ctx) ??
      defaultPositions(partyIdx, bundle.centroids, bundle.spread, ctx);

    return (
      ctx.latent?.project?.(position, bundle.loadings, questions, bundle.noiseStdDev, ctx) ??
      defaultProject(position, bundle.loadings, questions, bundle.noiseStdDev, ctx)
    );
  };
}
```

### Pattern 2: Per-question dispatch in `defaultProject`

**What:** Switch on `question.type`; send ordinal + single-choice + multi-choice
through the latent path, everything else through `defaultRandomValidEmit`.

**When to use:** D-57-10 fallback path — latent projection is semantically
meaningless for text, number, date, image, boolean, multipleText.

**Example:**

```typescript
// Source: Phase 56's emitters/answers.ts:77 `emitValueFor` switch pattern, with
// latent-specific branches. [VERIFIED: Phase 56 pattern preserved for exhaustiveness]
export function defaultProject(
  position: number[],
  loadings: LoadingMatrix,
  questions: Array<TablesInsert<'questions'>>,
  noiseStdDev: number,
  ctx: Ctx
): Record<string, { value: unknown; info?: unknown }> {
  const out: Record<string, { value: unknown; info?: unknown }> = {};
  for (const q of questions) {
    if (!q.external_id) continue;
    const type = q.type as Enums<'question_type'>;

    switch (type) {
      case 'singleChoiceOrdinal':
        out[q.external_id] = { value: mapOrdinal(q, position, loadings, noiseStdDev, ctx) };
        break;
      case 'singleChoiceCategorical':
        out[q.external_id] = { value: mapSingleCategorical(q, position, ctx) };
        break;
      case 'multipleChoiceCategorical':
        out[q.external_id] = { value: mapMultiCategorical(q, position, ctx) };
        break;
      // D-57-10 fallback path — latent has no semantic meaning for these types
      case 'text':
      case 'multipleText':
      case 'number':
      case 'boolean':
      case 'date':
      case 'image': {
        const fallback = defaultRandomValidEmit(
          {} as TablesInsert<'candidates'>, [q], ctx
        );
        out[q.external_id] = fallback[q.external_id];
        break;
      }
      default: {
        const _exhaustive: never = type;
        void _exhaustive;
        out[q.external_id] = { value: null };
      }
    }
  }
  return out;
}
```

### Anti-Patterns to Avoid

- **Hand-rolling bucket boundaries for Likert.** D-57-08 + `@openvaa/core`'s
  `normalizeCoordinate` already define the canonical formula. If your code
  contains a `switch (scale) { case 5: …; case 7: …; }` you are re-implementing
  the data package. Use the primitive (§ "Algorithmic Snippets → Latent →
  Likert mapping").
- **Mutating `ctx` to cache space state.** D-57-13 says the cache lives in a
  closure captured by the emitter factory. Mutating `ctx` would break the
  unit-test pattern (tests construct fresh ctx per scenario; cached state on
  ctx would leak between tests).
- **Using `Math.random()`** anywhere. All stochasticity routes through
  `ctx.faker` (D-07 + D-57-11). [VERIFIED: Phase 56 `emitters/answers.ts`
  already enforces this — no `Math.random` present in the dev-seed package.]
- **Skipping `noise = 0` validation.** D-57-11's template override accepts
  `noise: 0`. The Box-Muller path divides by `stdDev`, so `noise = 0` must
  short-circuit — return the deterministic `z` value without a Gaussian draw.
- **Instantiating `SingleChoiceOrdinalQuestion` and friends to get
  normalization.** Requires a `DataRoot` object; Phase 56 emits raw JSONB
  rows, not `@openvaa/data` instances. Build your own Choice-id selection.
- **Re-running farthest-point sampling per candidate.** The D-57-13 cache
  guarantees centroids are sampled once per pipeline run. The per-candidate
  step is only `defaultPositions` + `defaultProject`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Normalize a Likert choice to [-0.5, +0.5] | A per-scale lookup table | `normalizeCoordinate({ value, min, max })` from `@openvaa/core` | Data package already uses it; formula is literally `COORDINATE.Min + COORDINATE.Extent * ((value - min) / (max - min))`. [VERIFIED: `packages/core/src/matching/distance.ts:28-32`] |
| Map a z in [-0.5, +0.5] back to a Likert choice id | A hand-written bucket boundary table | Choose choice whose `normalizableValue` is closest to `(z + 0.5) · (max - min) + min` (inverse of `normalizeCoordinate`) | `SingleChoiceOrdinalQuestion` internally computes `min = Math.min(...values)`, `max = Math.max(...values)`. Ordinal choices have evenly-spaced values, so `round((z_clipped + 0.5) * (scale - 1))` picks the correct index. [VERIFIED: `packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts:59-78`] |
| Construct a MatchingSpace for the clustering test | A bespoke n-dimensional array | `MatchingSpace.fromQuestions({ questions })` where `questions` are `OrdinalQuestion.fromLikert({ id, scale })` | `fromQuestions` static method exists. [VERIFIED: `packages/matching/src/space/matchingSpace.ts:49-64`] |
| Compute Manhattan distance between two candidates | A hand-rolled loop | `manhattanDistance({ a, b, space })` from `@openvaa/matching` | Already handles subdimensions, missing values, shape compatibility. [VERIFIED: `packages/matching/src/distance/metric.ts:57-77`] |
| Likert MatchableQuestion for tests | A hand-rolled `normalizeValue` | `OrdinalQuestion.fromLikert({ id, scale })` | Test shape: `numQuestions × likertScale` — the example in `packages/matching/examples/example.ts:19-21` does exactly this pattern for a test context |
| Gaussian-distributed random number | A rejection-sampling loop or lookup | Box-Muller on two `ctx.faker.number.float({ min: 0, max: 1 })` draws (§ "Algorithmic Snippets → Box-Muller Gaussian"). **Note:** exclude u1 = 0 to avoid `log(0) = -Infinity`. | Standard 5-line transform. faker has no native Gaussian API [CITED: fakerjs.dev/api/number.html via WebFetch 2026-04-22] |
| Farthest-point centroid sampler | PCA-based init or k-means++ | Greedy max-min algorithm over sampled Gaussian candidates (§ "Algorithmic Snippets → Farthest-point sampling") | D-57-03 locks farthest-point as default; algorithm is ~20 lines |
| Intra/inter party distance margin | Integration via a synthetic VAA session | Direct pairwise distance computation over `MatchingSpace.fromQuestions` positions (§ "Validation Architecture → Clustering test shape") | No matching algorithm needed; we measure raw position distances |
| Party lookup for a candidate (latent path) | Re-scan `ctx.refs.organizations` per candidate | Pre-compute `partyIndex` during `CandidatesGenerator`'s existing round-robin (`i % orgs.length`) | Phase 56 already does `i % refs.organizations.length` at `CandidatesGenerator.ts:106`. The emitter can derive partyIndex from `candidate.external_id` suffix parsing OR the Phase 57 plan adds a `_partyIndex` sentinel to the candidate row that CandidatesGenerator passes through. **Planner call:** which of these two is simpler — see Open Question 1. |

**Key insight:** Every mathematical primitive (coordinate normalization,
Manhattan distance, subdimension flattening) exists in `@openvaa/core` or
`@openvaa/matching`. Phase 57's job is **composition**, not implementation.
The only fully hand-written pieces are Box-Muller (5 lines), farthest-point
sampling (20 lines), and the sub-step composition shell (50 lines including
defaults). Total net new code is ~300-400 lines excluding tests.

## Runtime State Inventory

Phase 57 is a **greenfield code addition** (not a rename/refactor/migration).
There is no existing latent-emitter state in any database, workflow, secret
store, or build artifact that needs migrating.

However, since Phase 57 adds a new `ctx.answerEmitter` assignment in
`pipeline.ts`, I verified the following runtime-state categories:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — latent coefficients are not persisted; answers round-trip through JSONB but the coefficients that generated them do not. | — |
| Live service config | None — no n8n, Datadog, Tailscale, Cloudflare, etc. in this monorepo. Local Supabase config lives in `apps/supabase/` and is untouched. | — |
| OS-registered state | None — no task schedulers, pm2 processes, or system services involved. | — |
| Secrets/env vars | None — the latent emitter reads `ctx.faker` and `ctx.refs`, not env. Existing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (for Writer) are unchanged. | — |
| Build artifacts | None — `@openvaa/dev-seed` is tsx-only (D-28), no build step, no installed binaries. Seed data JSON fixtures in `tests/fixtures/` are Phase 59's concern. | — |

**Conclusion:** This section is technically not required for greenfield
phases per the researcher guide; included for completeness and to document
the "nothing to migrate" state explicitly.

## Common Pitfalls

### Pitfall 1: `Math.log(0)` = `-Infinity` in Box-Muller

**What goes wrong:** `ctx.faker.number.float({ min: 0, max: 1 })` can return
`0`; feeding 0 into `Math.log` yields `-Infinity`, then `Math.sqrt(Infinity) *
cos(…)` = `Infinity * something` = `NaN` or `Infinity`. NaN propagates through
the entire candidate's position, producing NaN projections, then NaN answer
indices, then `choices[NaN]` = `undefined` → JSONB writes `null` → downstream
crash.

**Why it happens:** faker's uniform float range is `[min, max]` inclusive.

**How to avoid:** Sample `u1` as `Math.max(faker.number.float(), Number.MIN_VALUE)`
OR loop until `u1 !== 0`. Prefer the clamp — deterministic, no unbounded loop.

**Warning signs:** `expect(answer).not.toBeNaN()` should be part of
`gaussian.test.ts` and `positions.test.ts`.

### Pitfall 2: `eigenvalues: 0` edge case

**What goes wrong:** D-57-11's default noise std-dev is `0.1 · mean(eigenvalues)`.
If a template override passes `eigenvalues: [0]` (degenerate 1D space) or
`[1, 0]`, the mean includes zero and the noise scales toward zero — not
necessarily a bug, but `z = 0 + 0 = 0` for every candidate in that dimension
produces a flat projection. Clustering still works, but the dimension
contributes nothing.

**Why it happens:** Zero eigenvalues are mathematically legal; they just
collapse the effective dimensionality.

**How to avoid:** Document the behavior in `defaultDimensions` JSDoc. Add a
validator-level warning (zod `.superRefine`) if any eigenvalue is 0 — guide
the user to reduce `dimensions` instead. Do NOT throw — the default
`[1, 1/3]` path never hits this.

**Warning signs:** Unit test for `defaultDimensions` with `eigenvalues: [1, 0]`
asserts the second dimension's contribution to projections is 0.

### Pitfall 3: `questions.length === 0` zero-matrix

**What goes wrong:** A `{}` template still emits 8 candidates (Phase 56's
CandidatesGenerator default count), but zero questions. The loading matrix
shape `(0 × 2)` is legal but the projection loop runs zero times, producing
`{ answersByExternalId: {} }` — arguably correct, but the test should guard.

**Why it happens:** Upstream generator order guarantees `ctx.refs.questions`
is populated BEFORE candidates run, but if the template sets
`questions: { count: 0 }`, the refs array is empty.

**How to avoid:** `defaultLoadings` returns `[]` when `questions.length === 0`.
`defaultProject` returns `{}` when questions is empty. No throw. The `{}`
template test already covered by Phase 56 `determinism.test.ts` must keep
passing — Phase 57 must not regress it.

**Warning signs:** Plan includes a unit test for
`defaultLoadings(questions=[], dims=2, ctx)` → `[]`.

### Pitfall 4: `refs.organizations.length === 0` — no parties

**What goes wrong:** Phase 56's CandidatesGenerator already handles this:
`party = refs.organizations.length > 0 ? … : undefined`. The latent emitter
must handle the same case. If `party` is undefined, the candidate has no
centroid → no latent position → the emitter MUST fall back to
`defaultRandomValidEmit` for that candidate.

**Why it happens:** Minimal `{}` template with zero organizations; or a
user-supplied template with 5 candidates but 0 organizations.

**How to avoid:** In the per-candidate branch of `latentAnswerEmitter`, check
`partyIdx < 0` and fall back. Matches D-19/D-21 philosophy.

**Warning signs:** Unit test: `latentAnswerEmitter` with `refs.organizations =
[]` returns the same shape as `defaultRandomValidEmit`.

### Pitfall 5: Choice `id`-vs-index confusion in `argmax`

**What goes wrong:** `defaultRandomValidEmit` returns the choice `id` as a
string (e.g. `"3"` for a 5-point Likert, `"a"` for categorical). The latent
emitter must also return the `id`, not the index. Returning index `2` instead
of id `"3"` → `importAnswers` writes `2` into JSONB → `@openvaa/data`
normalization can't find choice with id `2` → answer is treated as
`MISSING_VALUE` → clustering test fails silently.

**Why it happens:** Mental conflation of "3rd option" (index 2, id "3") in
the 5-point-Likert case.

**How to avoid:** Always round-trip through `q.choices[index].id`. Write unit
tests that assert the returned answer is one of `q.choices.map(c => c.id)`
for the categorical types.

**Warning signs:** Clustering test sanity assertion —
`expect(rows[0].answersByExternalId['seed_q_000'].value).toMatch(/^[1-5]$/)`
for a 5-point Likert.

### Pitfall 6: `MatchingSpace.fromQuestions` requires `MatchableQuestion`, not `TablesInsert<'questions'>`

**What goes wrong:** The clustering integration test takes
`ctx.refs.questions` (which are `TablesInsert<'questions'>` rows) and tries to
pass them straight to `MatchingSpace.fromQuestions`. The types don't align
— `MatchableQuestion` wants `id` + `normalizeValue(value)`, not JSONB `choices`.

**Why it happens:** Two different shapes live in the monorepo — the DB row
type (`TablesInsert<'questions'>`) and the matching interface
(`MatchableQuestion`).

**How to avoid:** The clustering test constructs `OrdinalQuestion.fromLikert`
instances separately (`Array.from({ length: 12 }, (_, i) =>
OrdinalQuestion.fromLikert({ id: 'seed_q_' + pad(i, 3), scale: 5 }))`) and
passes THOSE to `MatchingSpace`. The emitter output's keys are the same
question external_ids, so the answer dict lines up. [VERIFIED: pattern matches
`packages/matching/examples/example.ts:19-21`]

**Warning signs:** Test file imports `OrdinalQuestion` from `@openvaa/matching`
(not from `@openvaa/data`).

### Pitfall 7: Hook precedence (D-57-14) reversed by mistake

**What goes wrong:** Implementer writes `ctx.latent?.centroids?.(…) ??
templateCentroids ?? defaultCentroids(…)` — but D-57-14 says hook wins even
when template data exists. The hook receives template data AS AN ARGUMENT.

**Why it happens:** Nullish-coalescing chains read cleanly left-to-right,
tempting a wrong ordering.

**How to avoid:** The default function signature always accepts optional
`tplCentroids` as its last argument:
`defaultCentroids(dims, parties, ctx, tplCentroids?)`. The hook's signature
mirrors it. The driver resolves `hook ?? default`, and `hook(dims, parties,
ctx, tplCentroids)` gets the template data as input, not as fallback.

**Warning signs:** Unit test with BOTH a `ctx.latent.centroids` hook AND
`template.latent.centroids: [[0,0],[0.5,0]]` — assert hook is called, verify
it receives the template centroids in its args.

## Code Examples

### Box-Muller Gaussian draw (shared helper)

```typescript
// Source: standard Box-Muller transform. faker has no native Gaussian
// [CITED: fakerjs.dev/api/number.html via WebFetch 2026-04-22]
// Pitfall 1: clamp u1 away from 0 so Math.log(0) doesn't return -Infinity.
import type { Faker } from '@faker-js/faker';

export function boxMuller(
  faker: Faker,
  mean: number = 0,
  stdDev: number = 1
): number {
  if (stdDev === 0) return mean; // short-circuit for deterministic runs (D-57-11)
  const u1 = Math.max(faker.number.float({ min: 0, max: 1 }), Number.MIN_VALUE);
  const u2 = faker.number.float({ min: 0, max: 1 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}
```

### Farthest-point centroid sampling

```typescript
// Source: canonical greedy max-min algorithm (the form used in k-means++
// init, Lloyd-Max VQ, and poisson-disk sampling). Algorithm per D-57-03.
import type { Ctx } from '../ctx';

export function defaultCentroids(
  dims: number,
  eigenvalues: number[],
  parties: Array<{ external_id: string }>,
  ctx: Ctx,
  tplCentroids?: Record<string, number[]>  // keyed by party external_id
): number[][] {
  const N = parties.length;
  if (N === 0) return [];

  // Pool size: 10*N Gaussian-sampled candidates per party — enough diversity
  // for the greedy step to actually spread out. Deterministic with seeded faker.
  const poolSize = Math.max(10 * N, 50);
  const pool: number[][] = Array.from({ length: poolSize }, () =>
    // Sample each dim from N(0, sqrt(eigenvalue)) so the eigenvalue
    // structure is reflected in raw samples too.
    Array.from({ length: dims }, (_, d) => boxMuller(ctx.faker, 0, Math.sqrt(eigenvalues[d])))
  );

  const centroids: number[][] = [];

  // Seed anchors from template if provided
  for (let i = 0; i < N; i++) {
    const anchor = tplCentroids?.[parties[i].external_id];
    if (anchor && anchor.length === dims) {
      centroids[i] = [...anchor];
    }
  }

  // First centroid: if no anchor at index 0, pick first pool member
  if (centroids[0] === undefined) {
    centroids[0] = pool.shift()!;
  }

  // Greedy: for each remaining party slot (in order), pick the pool element
  // farthest from the min-distance to already-placed centroids.
  for (let i = 1; i < N; i++) {
    if (centroids[i] !== undefined) continue; // anchored from template
    let bestIdx = 0;
    let bestMinDist = -Infinity;
    for (let p = 0; p < pool.length; p++) {
      let minDist = Infinity;
      for (const c of centroids) {
        if (!c) continue;
        minDist = Math.min(minDist, euclideanSq(pool[p], c));
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestIdx = p;
      }
    }
    centroids[i] = pool[bestIdx];
    pool.splice(bestIdx, 1);
  }

  return centroids;
}

function euclideanSq(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}
```

### Latent → Likert mapping (the D-57-08 payoff)

```typescript
// Source: inverse of normalizeCoordinate from @openvaa/core
// [VERIFIED: packages/core/src/matching/distance.ts:28-32]
// [VERIFIED: packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts:59-78]
import { COORDINATE } from '@openvaa/core';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Faker } from '@faker-js/faker';
import { boxMuller } from './gaussian';

export function mapOrdinal(
  q: TablesInsert<'questions'>,
  position: number[],
  loadings: LoadingMatrix,
  noiseStdDev: number,
  ctx: { faker: Faker }
): string | null {
  const choices = extractOrdinalChoices(q); // each has { id, normalizableValue }
  if (choices.length === 0) return null;

  const qLoading = loadings[q.external_id!] ?? [];
  let z = 0;
  for (let d = 0; d < position.length; d++) {
    z += position[d] * (qLoading[d] ?? 0);
  }
  z += boxMuller(ctx.faker, 0, noiseStdDev); // D-57-11 noise
  // Clip z into the COORDINATE range [-0.5, +0.5]; D-57-08 maps through the
  // same normalized coordinate space @openvaa/data uses.
  const zClipped = Math.max(COORDINATE.Min, Math.min(COORDINATE.Max, z));
  // Inverse normalizeCoordinate: value = (zClipped - Min) / Extent * (max - min) + min
  const values = choices.map((c) => c.normalizableValue);
  const vmin = Math.min(...values);
  const vmax = Math.max(...values);
  const targetValue =
    vmin + ((zClipped - COORDINATE.Min) / COORDINATE.Extent) * (vmax - vmin);
  // Find the choice whose normalizableValue is closest to targetValue
  let best = choices[0];
  let bestDiff = Math.abs(best.normalizableValue - targetValue);
  for (const c of choices) {
    const diff = Math.abs(c.normalizableValue - targetValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best.id;
}

function extractOrdinalChoices(q: TablesInsert<'questions'>): Array<{ id: string; normalizableValue: number }> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((c) => {
      if (c && typeof c === 'object' && 'id' in c) {
        const id = String((c as { id: unknown }).id);
        // Ordinal choices follow the same shape `@openvaa/data` expects: each
        // has an integer `normalizableValue`. The Phase 56 seed questions use
        // choice ids '1'..'5' with implicit value = parseInt(id); accept both
        // an explicit `normalizableValue` field and the numeric-id convention.
        const nv =
          typeof (c as { normalizableValue?: unknown }).normalizableValue === 'number'
            ? (c as { normalizableValue: number }).normalizableValue
            : Number.isFinite(Number(id)) ? Number(id) : NaN;
        if (!Number.isFinite(nv)) return null;
        return { id, normalizableValue: nv };
      }
      return null;
    })
    .filter((v): v is { id: string; normalizableValue: number } => v !== null);
}
```

### Clustering test structure

```typescript
// Source: pattern from packages/matching/examples/example.ts + D-57-16/17/18
// No DB. Pure in-memory pipeline run + MatchingSpace construction.
import { describe, expect, it } from 'vitest';
import { Faker, en } from '@faker-js/faker';
import {
  OrdinalQuestion,
  MatchingSpace,
  manhattanDistance,
  Position
} from '@openvaa/matching';
import type { MatchableQuestion } from '@openvaa/core';
import { latentAnswerEmitter } from '../../src/emitters/latent/latentEmitter';
import type { Ctx } from '../../src/ctx';

it('D-57-17: mean_intra_party / mean_inter_party < 0.5 (seed 42)', () => {
  // D-57-18 shape
  const NUM_PARTIES = 4;
  const CANDIDATES_PER_PARTY = 10;
  const NUM_QUESTIONS = 12;
  const LIKERT_SCALE = 5;

  // Build synthetic template + ctx + refs. 12 questions all ordinal.
  const faker = new Faker({ locale: [en] });
  faker.seed(42);
  const parties = Array.from({ length: NUM_PARTIES }, (_, i) => ({
    external_id: `seed_party_${i}`
  }));
  const questions = Array.from({ length: NUM_QUESTIONS }, (_, i) => ({
    external_id: `seed_q_${String(i).padStart(3, '0')}`,
    project_id: '00000000-0000-0000-0000-000000000001',
    type: 'singleChoiceOrdinal' as const,
    category_id: '00000000-0000-0000-0000-000000000099',
    choices: Array.from({ length: LIKERT_SCALE }, (_, j) => ({
      id: String(j + 1),
      normalizableValue: j + 1
    }))
  }));
  const ctx: Ctx = {
    faker,
    projectId: '00000000-0000-0000-0000-000000000001',
    externalIdPrefix: 'seed_',
    refs: {
      accounts: [{ id: '...' }], projects: [{ id: '...' }],
      elections: [], constituency_groups: [], constituencies: [],
      organizations: parties, alliances: [], factions: [],
      candidates: [], question_categories: [],
      questions: questions as unknown as Array<{ external_id: string }>,
      nominations: [], app_settings: [], feedback: []
    },
    logger: () => {}
  };
  const emit = latentAnswerEmitter({ seed: 42 } as Template);

  // Generate candidates and collect their (id, partyIdx, answers) tuples.
  type Row = { id: string; partyIdx: number; answers: Record<string, { value: unknown }> };
  const rows: Row[] = [];
  let idx = 0;
  for (let p = 0; p < NUM_PARTIES; p++) {
    for (let c = 0; c < CANDIDATES_PER_PARTY; c++) {
      const candExtId = `seed_cand_${String(idx++).padStart(4, '0')}`;
      const candidate = {
        external_id: candExtId,
        project_id: '00000000-0000-0000-0000-000000000001',
        first_name: 'test',
        last_name: 'test',
        organization: { external_id: parties[p].external_id }
      };
      rows.push({
        id: candExtId,
        partyIdx: p,
        answers: emit(
          candidate as unknown as TablesInsert<'candidates'>,
          questions as unknown as Array<TablesInsert<'questions'>>,
          ctx
        )
      });
    }
  }

  // Build MatchableQuestions (Likert, id matches the extId).
  const matchable: MatchableQuestion[] = questions.map((q) =>
    OrdinalQuestion.fromLikert({ id: q.external_id!, scale: LIKERT_SCALE })
  );
  const space = MatchingSpace.fromQuestions({ questions: matchable });

  // Convert each candidate's answers to a Position in that space.
  const positions = rows.map((r) => {
    const coords = matchable.map((q) => q.normalizeValue(r.answers[q.id]?.value ?? undefined));
    return new Position({ coordinates: coords, space });
  });

  // Compute intra and inter distances.
  let intraSum = 0, intraN = 0, interSum = 0, interN = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const d = manhattanDistance({ a: positions[i], b: positions[j] });
      if (rows[i].partyIdx === rows[j].partyIdx) {
        intraSum += d; intraN++;
      } else {
        interSum += d; interN++;
      }
    }
  }
  const meanIntra = intraSum / intraN;
  const meanInter = interSum / interN;
  const ratio = meanIntra / meanInter;
  expect(ratio).toBeLessThan(0.5); // D-57-17
  expect(Number.isFinite(ratio)).toBe(true);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 56 random-valid-per-question-type (`defaultRandomValidEmit`) | Phase 57 latent-factor emitter behind the D-27 seam | Phase 57 plan | Candidates cluster by party; matching-UI rendering becomes visually meaningful; E2E tests can (Phase 59) rely on clustered data instead of uniform random |
| Bespoke Gaussian bucket tables per question type | Leverage `@openvaa/core.normalizeCoordinate` + `SingleChoiceOrdinalQuestion` convention | D-57-08 decision | Removes a potential source of drift between dev-seed and `@openvaa/matching` UI rendering |
| `Math.random()` in test data generators | Seeded `ctx.faker` (Phase 56 D-07) | Phase 56 | Determinism for CI clustering assertion (D-57-17) |

**Deprecated/outdated:**

- None — Phase 57 is an additive extension. `defaultRandomValidEmit` remains
  the fallback for non-ordinal/non-choice types (D-57-10) and the default for
  fixed-row candidates without explicit answers (D-57-20).

**Prior art noted (not adopted):**

- [AlexChristensen/latentFactoR](https://github.com/AlexChristensen/latentFactoR)
  — R package for latent-factor data simulation. Conceptually similar
  (simulate from centroids + loadings + noise) but (a) R, not TypeScript, and
  (b) focused on psychometric modeling rather than party-clustering VAA
  responses. No code reuse possible; confirms our algorithmic approach is
  standard (farthest-point / centroid + loading matrix + Gaussian noise is a
  well-trodden pattern in psychometrics and survey simulation).

## Assumptions Log

Claims in this research that are tagged `[ASSUMED]` — the planner and
discuss-phase should confirm these with the user before treating them as
locked.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CandidatesGenerator's `i % orgs.length` round-robin assignment means `partyIndex = i mod parties.length` — the latent emitter can derive `partyIdx` the same way | § "Don't Hand-Roll → Party lookup" | If wrong (e.g. CandidatesGenerator changes to random party assignment in a future phase), latent positions are drawn from the wrong centroid. Mitigation: the emitter re-derives from the candidate row's `organization.external_id` (VERIFIED present on generated rows at `CandidatesGenerator.ts:120-122`). Fail-soft path: if lookup fails, fall back to `defaultRandomValidEmit`. See Open Question 1. |
| A2 | Seed-stored Likert questions follow the convention `id = "1".."5"` with `normalizableValue = parseInt(id)` — matching Phase 56's LIKERT_5 array at `QuestionsGenerator.ts:56-62`, which supplies `{ id, label }` only (no explicit `normalizableValue`) | § "Code Examples → Latent → Likert mapping" | If user-supplied `questions.fixed[]` ships choices with a different convention (e.g. `id = "a"`, no `normalizableValue`), the parseInt fallback returns `NaN` → the question is silently skipped. Mitigation: the planner's QuestionsGenerator task can explicitly add `normalizableValue: j+1` to the LIKERT_5 constant as part of Phase 57 (minimal change). See Open Question 2. |
| A3 | Margin threshold 0.5 (D-57-17) is achievable with default eigenvalues `[1, 1/3]`, spread 0.15, noise `0.1 · mean(eig)`, 4 parties × 10 candidates × 12 ordinal q, seed 42 | § "Validation Architecture → Margin assertion" | If the threshold is not reached at defaults, either (a) the planner tunes `spread` / `noise` downward in the test template, or (b) we revisit D-57-17 with the user. Prior art (latentFactoR in psychometrics) and basic intuition (N(0, 0.15²) clusters at one-tenth the eigenvalue-1 axis range) suggest 0.5 is comfortably achievable, but this must be verified empirically. Planner should treat "clustering test passes at default knobs" as a runtime verification milestone in plan XX-verify. |

**Planner action:** Treat A1, A2, A3 as soft constraints; each has a
straightforward fallback path (A1 → re-derive from org ref; A2 → add
normalizableValue to the seeded questions; A3 → tune template-level knobs in
the test's template input, not in the emitter defaults).

## Open Questions (RESOLVED)

1. **How does the latent emitter look up a candidate's party index?** Two
   options:
   - **(a) Re-derive from the candidate row.** The row has
     `candidate.organization = { external_id }` attached by
     `CandidatesGenerator.ts:120-122`. The emitter scans
     `ctx.refs.organizations` for that external_id, returns the index.
     O(N_parties) per candidate — fine for N_parties ≤ ~100.
   - **(b) CandidatesGenerator adds a `_partyIndex` sentinel.** Simpler
     lookup but requires a Phase 56 file modification (57-CONTEXT.md says
     Phase 57 does NOT change `CandidatesGenerator.ts`).
   - **Recommendation:** Go with (a). Preserves D-27's "Phase 57 does not
     change this file" promise. Cost is trivial (linear scan of 8 parties).
     Edge case: if the emitter receives `candidate.organization` undefined
     (the candidate had no org ref), fall back to `defaultRandomValidEmit`
     (Pitfall 4).

2. **Does the Phase 57 plan modify `QuestionsGenerator.LIKERT_5` to add
   `normalizableValue`?** The constant at
   `packages/dev-seed/src/generators/QuestionsGenerator.ts:56-62` emits
   `{ id, label }` without `normalizableValue`. The A2 fallback parses id as
   integer. Either works, but adding `normalizableValue: 1..5` is more
   explicit and matches the `@openvaa/data` `Choice<number>` contract (the
   `normalizableValue: TValue` field when `TValue = number`).
   - **Recommendation:** Yes, modify it as part of Phase 57. Single-line
     change (extend each entry), test impact is zero, and it removes an
     entire class of fragility in the mapping code.

3. **Where does `ctx.latent` go on the `Ctx` type — top-level or nested
   under `ctx.latent`?** D-57-12 locks it as top-level `ctx.latent?.{…}`.
   - **No question — this is locked. Noted for completeness.**

4. **Does the clustering test assert anything BEYOND the margin ratio?**
   D-57-17 only requires the ratio < 0.5, but the phase goal also mentions
   "non-trivial inter-question correlations". Should the test also check
   Pearson correlation between pairs of questions?
   - **Recommendation:** YES, add a soft assertion — pick two questions whose
     loading vectors have cosine similarity > 0.5 (or < -0.5 for
     anti-correlated); assert `|corr(answers_q1, answers_q2)| > 0.2`. Fast
     sanity check; avoids "clustering passes but correlations are still
     uniform random" silent-success case. Planner's call on exact threshold
     — 0.2 is a loose lower bound; defaults should easily exceed it.

5. **Eigenvalue validation at schema level?** D-57-02 says "validator rejects
   mismatches" when `latent.eigenvalues.length !== latent.dimensions`.
   Implement via zod `.superRefine`?
   - **Recommendation:** YES. The `latent` zod block uses `.strict()` + a
     `.superRefine` that asserts `(data.eigenvalues?.length ?? data.dimensions
     ?? 2) === (data.dimensions ?? 2)`. Error message points at
     `latent.eigenvalues` per TMPL-09.

## Environment Availability

Phase 57 has **no external-tool dependencies beyond what Phase 56 already
verified**. All workspace deps are present; no CLI, database, or service
invocation is added.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@faker-js/faker` | Box-Muller, centroid sampling, loading matrix | ✓ | 8.4.1 [VERIFIED: `node_modules/.../package.json`] | — |
| `@openvaa/matching` | clustering test only | ✓ | workspace [VERIFIED: package present in repo] | — |
| `@openvaa/core` | `COORDINATE`, `normalizeCoordinate`, `MISSING_VALUE` | ✓ | workspace | — |
| `@openvaa/supabase-types` | row types | ✓ | workspace (already a dev-seed dep) | — |
| `zod` | schema `.extend()` | ✓ | ^4.3.6 (catalog) | — |
| `vitest` | test runner | ✓ | catalog | — |
| Supabase local | — **NOT required** for Phase 57 — D-57-18 runs test in-memory | n/a | n/a | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

**package.json changes needed:**

- `packages/dev-seed/package.json` MUST add `@openvaa/matching` and
  `@openvaa/core` to `dependencies` (they are needed by the clustering
  integration test which imports from these packages). Both are workspace
  packages; adding `"@openvaa/matching": "workspace:^"` and `"@openvaa/core":
  "workspace:^"` with no version bump. [VERIFIED: current package.json does
  NOT list these.]
- `packages/dev-seed/tsconfig.json` MAY need TypeScript project references
  added for IDE resolution, following the pattern at CLAUDE.md "Module
  Resolution & Dependencies" — though in practice dev-seed is tsx-only so
  references are optional. **Planner call.**

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (catalog: ^3.2.4) — [VERIFIED: `.yarnrc.yml` catalog] |
| Config file | `packages/dev-seed/vitest.config.ts` (empty config; project inherits from root workspace) — [VERIFIED: file contents read] |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` |
| Full suite command | `yarn test:unit` (root, via Turborepo) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-06a | Configurable latent dimensions + eigenvalues; default `{2, [1, 1/3]}` | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/dimensions.test.ts` | ❌ Wave 0 |
| GEN-06b | Farthest-point centroid sampling; fills missing anchors; deterministic under seed | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/centroids.test.ts` | ❌ Wave 0 |
| GEN-06c | Default spread 0.15 scalar; scalar template override | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/spread.test.ts` | ❌ Wave 0 |
| GEN-06d | Positions drawn from N(centroid, spread²·I); deterministic | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/positions.test.ts` | ❌ Wave 0 |
| GEN-06e | Dense N(0,1) loadings matrix; per-question template override by external_id | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/loadings.test.ts` | ❌ Wave 0 |
| GEN-06f | Latent → valid-answer mapping for ordinal / single-cat / multi-cat; fallback for non-choice types; noise = 0 is deterministic | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/project.test.ts` | ❌ Wave 0 |
| GEN-06g (hook isolation) | Each of 6 sub-step hooks can be overridden independently; hook wins over template (D-57-14) | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/*.test.ts` | ❌ Wave 0 |
| GEN-06 headline (clustering) | `mean_intra / mean_inter < 0.5` on seed 42, 4×10×12 | integration (no DB) | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/clustering.integration.test.ts` | ❌ Wave 0 |
| D-57-11 (noise = 0 deterministic) | Two runs with `template.latent.noise = 0` produce byte-identical answers | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/project.test.ts` | ❌ Wave 0 |
| D-57-14 (hook beats template) | Hook provided + template value provided → hook runs, receives template value | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/latentEmitter.test.ts` | ❌ Wave 0 |
| D-57-20 (fixed rows skip latent) | `candidates.fixed[]` with `answersByExternalId` → verbatim; without → `defaultRandomValidEmit`; synthetic → latent | unit | extend `tests/generators/CandidatesGenerator.test.ts` OR new `tests/latent/fixedRows.test.ts` | ❌ Wave 0 (add to existing or new file — planner's call) |
| Box-Muller sanity | mean ≈ 0, std ≈ 1 over 10_000 draws; deterministic under seed; no NaN/Infinity | unit | `yarn workspace @openvaa/dev-seed test:unit -- tests/latent/gaussian.test.ts` | ❌ Wave 0 |
| Phase 56 regression | `{}` template still produces valid candidates with random-valid answers when no `latent` template block supplied | integration | `yarn workspace @openvaa/dev-seed test:unit -- tests/determinism.test.ts` (existing) | ✅ (Phase 56) |
| Phase 56 determinism | Seed 42 → byte-identical output over two runs (latent path) | integration | extend `tests/determinism.test.ts` OR new `tests/latent/determinism.test.ts` | ✅ extend (planner's call) |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` — vitest
  is fast (~1-2s for the full dev-seed suite) so full-suite-per-task is
  sustainable. No per-task-targeted runs needed.
- **Per wave merge:** `yarn test:unit` (root) — runs the dev-seed suite plus
  `@openvaa/matching`, `@openvaa/data`, `@openvaa/core` tests to catch
  cross-package regressions.
- **Phase gate:** Full suite green before `/gsd-verify-work`; clustering
  integration test MUST pass at default template knobs (no per-test tuning).

### Wave 0 Gaps

All test files below must exist before the implementation tasks begin
generating code that they verify.

- [ ] `packages/dev-seed/tests/latent/dimensions.test.ts` — covers GEN-06a
- [ ] `packages/dev-seed/tests/latent/centroids.test.ts` — covers GEN-06b
- [ ] `packages/dev-seed/tests/latent/spread.test.ts` — covers GEN-06c
- [ ] `packages/dev-seed/tests/latent/positions.test.ts` — covers GEN-06d
- [ ] `packages/dev-seed/tests/latent/loadings.test.ts` — covers GEN-06e
- [ ] `packages/dev-seed/tests/latent/project.test.ts` — covers GEN-06f (incl.
  D-57-10 fallback, D-57-11 noise=0, D-57-09 argmax + threshold)
- [ ] `packages/dev-seed/tests/latent/gaussian.test.ts` — Box-Muller helper
- [ ] `packages/dev-seed/tests/latent/latentEmitter.test.ts` — D-57-13
  composition, D-57-14 hook precedence, Pitfall 4 (no party → fallback)
- [ ] `packages/dev-seed/tests/latent/clustering.integration.test.ts` — the
  D-57-17 headline assertion. MUST be named `*.integration.test.ts` if the
  project splits unit/integration runs — but there's no such split in Phase
  56 (all tests run via `test:unit`), so the name is for grouping only.
- [ ] (Optional) `packages/dev-seed/tests/latent/fixedRows.test.ts` — D-57-20;
  OR extend `tests/generators/CandidatesGenerator.test.ts` with the three
  scenarios. Planner's call.

**Framework install:** None — vitest already installed. No new test infrastructure.

**Threshold soundness check:** The D-57-17 threshold of 0.5 is a
*measurement validity* gate, not a statistical-significance test. With 4
parties × 10 candidates, N_intra = 4 · C(10,2) = 180 pairs and N_inter =
C(40,2) - 180 = 600 pairs; the sample sizes are comfortably above the
~30-pair regime where means are reliable. [ASSUMED — A3] The default
knobs should produce a ratio well below 0.5 (clusters at 0.15 std from
centroids separated by ~1.0 means roughly 0.15 / 0.5 ≈ 0.3 ratio on the
dominant axis); planner should treat a failing ratio as a signal to tune
the TEST template's knobs (spread, noise, scale) rather than the defaults.

## Security Domain

Phase 57 has **no security-relevant surface.** Config `.planning/config.json`
has no `security_enforcement` field; greenfield dev-tooling code that
generates synthetic test data does not introduce:

- Authentication / authorization paths (V2, V3, V4)
- User input parsing (V5) — the only "input" is the developer-authored
  template, and that's already validated by Phase 56's zod schema
- Cryptographic operations (V6) — Box-Muller is not crypto; the PRNG is
  `faker.seed` which is a deterministic Mersenne twister, explicitly
  non-cryptographic (appropriate for test data)
- Logging of sensitive data — no PII flows; all candidate names are
  faker.person.*
- Database writes during Phase 57 — the clustering test runs entirely
  in-memory; the latent emitter's output is persisted by Phase 56's
  Writer via `bulk_import`, which has already been threat-modeled in Phase
  56.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (template validation via zod, inherited from Phase 56) | zod `.extend()` + `.strict()` + `.superRefine` per D-57-21 |
| V6 Cryptography | no (faker PRNG is deterministic + non-crypto by design) | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed template crashes pipeline | Denial-of-Service (local dev only) | zod schema .strict() + field-path error per TMPL-09; existing Phase 56 `validateTemplate` already guards |
| Unseeded RNG produces non-deterministic test output | Reproducibility (not classic STRIDE) | `ctx.faker.seed(template.seed ?? 42)` in `buildCtx` already enforces — Phase 57 must NOT introduce `Math.random` (see Anti-Patterns) |

**Out of scope:** No production data flow is added; the emitter only runs in
local dev / CI seeding contexts where `SUPABASE_SERVICE_ROLE_KEY` is already
required (Phase 56 D-15). The service-role requirement lives entirely in the
Writer, untouched by Phase 57.

## Sources

### Primary (HIGH confidence)

- `packages/dev-seed/src/ctx.ts` — `Ctx` interface, `buildCtx(template)`, `answerEmitter?: AnswerEmitter` field at line 50 [VERIFIED: full source read]
- `packages/dev-seed/src/emitters/answers.ts` — `AnswerEmitter` type, `defaultRandomValidEmit`, `emitValueFor` switch pattern [VERIFIED: full source read]
- `packages/dev-seed/src/generators/CandidatesGenerator.ts` — D-27 seam at line 93, `candidate.organization` ref sentinel at line 120-122 [VERIFIED: full source read]
- `packages/dev-seed/src/template/schema.ts` — zod schema + `.extend()` pattern for Phase 57 [VERIFIED: full source read]
- `packages/dev-seed/src/pipeline.ts` — `runPipeline` with D-26 class bridge and topo order (questions → candidates) [VERIFIED: full source read]
- `packages/dev-seed/tests/utils.ts` — `makeCtx` factory for tests [VERIFIED: full source read]
- `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` — D-27 seam test pattern [VERIFIED: full source read]
- `packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts` — `_normalizeValue` = `normalizeCoordinate({ value, min, max })` [VERIFIED: full source read, lines 72-79]
- `packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.ts` — categorical normalization with one-hot subdims [VERIFIED: full source read]
- `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts` — stub (matching not yet implemented) [VERIFIED: full source read]
- `packages/data/src/objects/questions/base/question.ts` — base `normalizeValue` + `ensureValue` contracts [VERIFIED: full source read]
- `packages/data/src/objects/questions/base/choiceQuestion.ts` — `getChoice(id)`, `getChoiceIndex(id)` helpers [VERIFIED: full source read]
- `packages/data/src/objects/questions/base/choice.type.ts` — `Choice<TValue>` shape with `normalizableValue` [VERIFIED: full source read]
- `packages/core/src/matching/distance.ts` — `COORDINATE` (Min=-0.5, Max=0.5, Extent=1), `normalizeCoordinate` [VERIFIED: full source read]
- `packages/matching/src/space/matchingSpace.ts` — `MatchingSpace.fromQuestions({ questions })` [VERIFIED: full source read]
- `packages/matching/src/space/position.ts` — `Position` class [VERIFIED: full source read]
- `packages/matching/src/distance/metric.ts` — `manhattanDistance`, `DISTANCE_METRIC.Manhattan` [VERIFIED: full source read]
- `packages/matching/src/question/ordinalQuestion.ts` — `OrdinalQuestion.fromLikert({ id, scale })` [VERIFIED: full source read]
- `packages/matching/examples/example.ts` — canonical Likert test fixture pattern [VERIFIED: full source read]
- `packages/core/src/matching/hasAnswers.type.ts` — `HasAnswers`, `AnswerDict` [VERIFIED: full source read]
- `packages/core/src/matching/matchableQuestion.type.ts` — `MatchableQuestion` interface [VERIFIED: full source read]
- `packages/supabase-types/src/database.ts` — `question_type` enum [VERIFIED: full source read, lines 1286-1296]
- `packages/dev-seed/package.json` — current deps [VERIFIED: full source read]
- `.yarnrc.yml` — catalog versions for `@faker-js/faker ^8.4.1`, `zod ^4.3.6`, `vitest ^3.2.4` [VERIFIED: full source read]
- `.planning/config.json` — `commit_docs: true`, no `nyquist_validation` key (treat as enabled), no `security_enforcement` key [VERIFIED: full source read]
- `.planning/phases/57-latent-factor-answer-model/57-CONTEXT.md` — D-57-01 through D-57-21 [VERIFIED: full source read]
- `.planning/phases/56-generator-foundations-plumbing/56-CONTEXT.md` — D-07, D-18, D-19, D-20, D-21, D-26, D-27, D-28 [VERIFIED: full source read]
- `.planning/ROADMAP.md` — Phase 57 goal + 6 success criteria [VERIFIED: full source read]
- `.planning/REQUIREMENTS.md` — GEN-06 / GEN-06a-g [VERIFIED: full source read]
- `/CLAUDE.md` — project instructions [VERIFIED: full source read]

### Secondary (MEDIUM confidence)

- [fakerjs.dev/api/number.html](https://fakerjs.dev/api/number.html) via
  WebFetch 2026-04-22 — confirms `@faker-js/faker` v8 has no Gaussian API;
  Box-Muller is the recommended approach. [CITED]

### Tertiary (LOW confidence)

- [AlexChristensen/latentFactoR](https://github.com/AlexChristensen/latentFactoR)
  — prior art reference only, not adopted. Confirms the centroid + loadings
  + Gaussian-noise pattern is standard in psychometric simulation. [CITED]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every dep is already a workspace dep or in the
  catalog; versions verified against `node_modules` for `@faker-js/faker` and
  `.yarnrc.yml` for the rest.
- Architecture (D-57-13 shell, closure cache, per-sub-step defaults): HIGH —
  shape dictated by CONTEXT.md; only the per-file layout under
  `emitters/latent/` is Claude's discretion.
- Likert mapping: HIGH — literally the inverse of
  `normalizeCoordinate` from `@openvaa/core`; the data package uses the same
  primitive.
- Clustering test shape: HIGH — pattern extracted from
  `packages/matching/examples/example.ts` + MatchingSpace API signatures.
- Margin threshold 0.5 at default knobs: MEDIUM-LOW (A3) — numerically
  plausible but not empirically verified in this research. First
  implementation may need to tune test-template knobs if the default defaults
  don't clear the bar.
- Fixed-row party lookup path (A1): MEDIUM — two options identified, one
  recommended; no blocker.
- Seeded questions' `normalizableValue` convention (A2): MEDIUM — current
  Phase 56 questions omit the field; the mapping code has a parseInt
  fallback, OR the planner adds the field as a one-line change.

**Research date:** 2026-04-22

**Valid until:** 2026-05-22 (30 days — the entire research surface is
codebase-internal and version-pinned; the one external dep `@faker-js/faker`
is pinned at 8.4.1 in `node_modules` via the catalog)

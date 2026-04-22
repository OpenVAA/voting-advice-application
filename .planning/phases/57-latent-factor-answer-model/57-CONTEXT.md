# Phase 57: Latent-Factor Answer Model - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the latent-factor candidate-answer model behind the D-27 seam established
in Phase 56. Replace `defaultRandomValidEmit` with a pluggable 6-sub-step
pipeline (GEN-06a-g) that produces answers exhibiting visible party clustering
and plausible inter-question correlations.

Deliverables:

- A `latentAnswerEmitter` function assignable to `ctx.answerEmitter` (D-27 seam)
- Six independently overridable sub-steps (dimensions, centroids, spread,
  positions, loadings, projection+noise) — each exported as a named default
- Template schema extension: `latent: { dimensions, eigenvalues, centroids,
  spreads, loadings, noise }` via `.extend()` on the Phase 56 schema
- Unit tests per sub-step (GEN-06g requirement)
- Integration-style clustering assertion (Success Criterion 5)
- Mapping rules from latent projection → valid answer per question type,
  leveraging `@openvaa/data` normalization contracts

Explicitly **out of scope** for this phase:
- Built-in `default` / `e2e` templates → Phase 58
- Portrait seeding → Phase 58
- CLI surface (`seed`, `seed:teardown`) → Phase 58
- DB integration test against local Supabase → Phase 58's DX-03
- Rewriting `tests/seed-test-data.ts` → Phase 59

**Carried forward from Phase 56 (no re-asking):**
- D-27 outer seam is `ctx.answerEmitter` (single function pointer, NO interface
  ceremony). `CandidatesGenerator.ts` does NOT change in Phase 57 — only
  `ctx.answerEmitter` gets populated.
- D-21 fallback: categoricals without explicit per-choice loadings may fall
  back to `defaultRandomValidEmit` behavior. Phase 57 uses this fallback for
  non-ordinal question types (text, image, date, number, boolean,
  multipleText) where latent projection does not make semantic sense.
- D-26 pattern: stateful objects (latent space bundle) are built once per
  pipeline run and captured in a closure; per-candidate calls are pure.
- D-07 ctx: seeded faker + projectId + externalIdPrefix + refs already
  provided. Latent pipeline reads `ctx.faker` for all RNG (no `Math.random`).
- D-18 schema-extension pattern: Phase 57's `latent` block is added via
  `.extend()` on the Phase 56 schema; every field remains optional.
- D-11 / D-11a / D-11b boundaries: Phase 57 does not touch feedback,
  app_settings, accounts, projects, or bulk_import routing.

</domain>

<decisions>
## Implementation Decisions

### Latent-Space Geometry (GEN-06a, GEN-06b, GEN-06c, GEN-06d)
- **D-57-01:** Default latent dimension count is **2** (political-compass
  shape). Matches the canonical VAA 2D visualization and the mental model most
  end-users carry. Template can override via `latent.dimensions: number`.
- **D-57-02:** Default eigenvalues decay geometrically with ratio **1/3 per
  dimension**: 2D → `[1, 0.333]`; 3D → `[1, 0.333, 0.111]`; generalizes
  to `[1, 1/3, 1/9, 1/27, …]` for any `latent.dimensions`. Enforces a clear
  dominant axis so clustering is visually crisp along the primary dimension
  even when D > 2. Template can override via `latent.eigenvalues: number[]`
  (length must equal `latent.dimensions`; validator rejects mismatches).
- **D-57-03:** Default centroid sampling: **farthest-point (greedy max-min
  distance)** — seed one centroid at `ctx.faker`-sampled Gaussian position,
  iteratively pick each subsequent centroid to maximize min-distance to the
  already-placed set. Deterministic with seeded faker. Listed first in
  GEN-06b requirement.
- **D-57-04:** Spread parameter is the **std-dev of an isotropic Gaussian**
  around the party centroid (`candidate_latent ~ N(centroid, spread² · I)`).
  Matches GEN-06d "normal distribution around centroid using spread as
  std. dev." Default `spread = 0.15` in units where centroid-to-centroid
  mean distance is ~1 (after eigenvalue scaling). Template override accepts
  a scalar (broadcast to all dims) — a vector override is out of scope for
  v1 (eigenvalues already anisotropize variance; an anisotropic spread would
  double-count).
- **D-57-05:** When `template.latent.centroids` supplies literal centroids
  for only some parties, the sampler fills missing parties using farthest-
  point sampling with the supplied centroids treated as fixed anchors. No
  party goes without a centroid.

### Loadings (GEN-06e) + Latent → Answer Mapping (GEN-06f)
- **D-57-06:** Default question-loading matrix is **dense, entries iid
  N(0,1)**. Matrix shape `(questions.length × latent.dimensions)`. Sampled
  once per pipeline run via `ctx.faker`.
- **D-57-07:** Per-question override shape: **numeric array of length
  `latent.dimensions`** attached to the question via
  `questions.fixed[i].loadings: number[]`. Simplest, type-checkable, aligns
  with the matrix row shape.
- **D-57-08:** Likert/ordinal answer mapping **leverages
  `@openvaa/data` question-class normalization contracts**. Planner
  MUST read `packages/data/src/objects/questions/variants/*.ts` +
  `packages/data/src/objects/questions/base/*.ts` + relevant
  `@openvaa/matching` space/distance code before hand-rolling bucketing
  logic. The latent projection produces a `z` value (sum of
  `latent_i · loading_i` + noise); this z is mapped to a valid ordinal
  choice id by using the question class's normalization to find the
  choice whose normalized position matches z (after bounding z into the
  question's normalized range). **No hand-rolled bucket boundaries**
  parallel to what the data package already knows.
- **D-57-09:** Categorical / multi-choice mapping uses **per-choice latent
  loadings** — each `q.choices[]` entry gets a random loading vector
  (length D) sampled the same way as question loadings. Single-choice:
  pick `argmax_i(dot(candidate_latent, choice_i_loading))`. Multi-choice:
  include choice if `dot > 0` (or per-question threshold), guaranteeing
  at least one choice picked if the DB CHECK requires it (mirrors
  `pickMultipleChoiceIds` guardrail from the Phase 56 stub). Producing
  clustered candidates favoring similar choices captures the
  inter-question correlation needed by Success Criterion 5.
- **D-57-10:** Non-Likert / non-choice question types (text, number,
  boolean, date, image, multipleText) **fall back to
  `defaultRandomValidEmit`** per D-21. Latent projection does not
  produce a semantically meaningful text / date / image value, and
  clustering on those types is out of scope for GEN-06.
- **D-57-11:** Noise model is **Gaussian added to the latent projection
  `z` before mapping to answer space**. Default noise std-dev is
  `0.1 · mean(eigenvalues)`. Template override `latent.noise: number`
  (scalar). Setting `noise: 0` produces deterministic z values. Noise
  draws come from `ctx.faker.number.float({ min, max })` via a
  Box-Muller transform (or equivalent); no `Math.random`.

### Sub-Step Hook Architecture (GEN-06g)
- **D-57-12:** Swappable seam is a **single nested object on ctx**:
  `ctx.latent?: { dimensions?, centroids?, spread?, positions?, loadings?,
  project? }`. Each field is an optional function; unset fields fall back
  to the built-in default. Overriding one sub-step looks like
  `ctx.latent = { centroids: myCentroidFn }`. Matches D-27's
  "single-pointer, no interface" philosophy, extended one level.
- **D-57-13:** Internal composition: **flat top-down function**.
  `latentAnswerEmitter` resolves each sub-step in order:
  ```
  const dims    = ctx.latent?.dimensions?.(tpl)   ?? defaultDimensions(tpl);
  const cents   = ctx.latent?.centroids?.(dims, ctx) ?? defaultCentroids(dims, ctx);
  const spread  = ctx.latent?.spread?.(ctx)       ?? defaultSpread(ctx);
  const pos     = ctx.latent?.positions?.(candidate, cents, spread, ctx)
                                                 ?? defaultPositions(...);
  const load    = ctx.latent?.loadings?.(questions, dims, ctx)
                                                 ?? defaultLoadings(...);
  const answers = ctx.latent?.project?.(pos, load, questions, ctx)
                                                 ?? defaultProject(...);
  ```
  Space state (dims, centroids, loadings) is built ONCE on first invocation
  and memoized in a closure; only position + projection run per candidate.
- **D-57-14:** Override precedence when both template data and sub-step
  hook are present: **hook wins over template**. The hook is the
  programmatic override — it runs after template defaults are resolved and
  gets to see / transform the template-supplied values. Template data flows
  into the hook as an argument, not as a fallback behind it. Rationale: a
  consumer who wires a custom `centroids` function wants it to apply
  unconditionally; a consumer who supplies explicit `template.latent.
  centroids: [...]` but no hook still gets their literal values because
  `defaultCentroids` reads `template.latent.centroids` first. The two
  surfaces do NOT conflict in practice — hooks are code-level customization,
  template data is a flat declarative override — but when they do, the hook
  wins.
- **D-57-15:** Each sub-step default is **exported as a named function**
  (e.g. `defaultCentroidSampler`, `defaultLoadings`). Tests import
  directly, feed deterministic ctx stubs, assert output shape and
  determinism. Mirrors how `defaultRandomValidEmit` is exported today.
  Co-located in `packages/dev-seed/src/emitters/latent/` (planner-final
  dir name); one file per sub-step or grouped by theme — planner's call.

### Clustering Verification (Success Criterion 5)
- **D-57-16:** Verification metric is **Manhattan distance in
  `@openvaa/matching`'s MatchingSpace** — the same distance metric users
  see in the UI. Proves the model produces clustering _as the app renders
  it_, not only in raw latent space. Uses the matching package's default
  distance algorithm (Manhattan) unless an explicit override is configured
  in the test.
- **D-57-17:** Margin threshold: **`mean_intra_party / mean_inter_party <
  0.5`**. Asserted against a seeded pipeline run (`seed: 42`) so it is
  deterministic across CI runs. Computed over all candidate pairs within
  the same party (intra) vs all candidate pairs across different parties
  (inter).
- **D-57-18:** Test shape: **unit-style, no DB**. Runs the pipeline with a
  fixed template (e.g. 4 parties × 10 candidates × 12 ordinal questions,
  `seed: 42`), builds a MatchingSpace from the emitted answers, computes
  the clustering margin, and asserts. No Supabase needed. DB round-trip
  coverage is Phase 58's DX-03. Placed under
  `packages/dev-seed/tests/latent/clustering.integration.test.ts` (or
  similar — planner picks exact path).
- **D-57-19:** Per-sub-step unit tests: one test file per default
  function, asserting shape, determinism under fixed `ctx.faker` seed,
  and boundary behavior (e.g. centroid sampler with `n=1`, loading
  matrix with `questions.length=0`). Satisfies GEN-06g "unit tests
  cover each hook in isolation."

### Fixed + Synthetic Interaction
- **D-57-20:** `candidates.fixed[]` rows **skip the latent pipeline
  entirely**. Behavior:
  - Fixed row with `answersByExternalId` supplied → used verbatim;
    emitter not invoked.
  - Fixed row without `answersByExternalId` → falls back to
    `defaultRandomValidEmit` (NOT latent), because latent requires
    knowing the candidate's party centroid and deliberate placement
    within a spread envelope; putting a hand-authored row into a latent
    position would silently alter its semantics.
  - Synthetic rows (count-generated) → always run through the latent
    pipeline.
  Rationale: preserves the "hand-authored is pinned, synthetic is
  procedural" mental model from TMPL-03 and keeps test assertions on
  fixed rows predictable. If a consumer truly wants a hand-authored row
  at a specific latent position, they can compute the answers externally
  and pass them via `answersByExternalId`.

### Template Schema Extension
- **D-57-21:** New top-level field: `latent?: z.object({...}).partial()`
  extending the Phase 56 schema. All nested fields optional. Zod
  `.strict()` on the nested object so typos (e.g. `latent.loading`
  vs `latent.loadings`) surface at validation with a clear
  field-pointing error per TMPL-09.

### Claude's Discretion
- Exact layout under `packages/dev-seed/src/emitters/latent/` (one file per
  sub-step vs grouped by theme) — planner's call.
- Whether the "space bundle" cache lives in a closure captured by
  `latentAnswerEmitter` or on `ctx.latent._cache` — no behavior impact.
- Box-Muller vs other Gaussian-from-uniform transform — any approach using
  `ctx.faker.number.float` is acceptable.
- Multi-choice threshold value (exact `> 0` vs a small positive bias to
  avoid near-ties) — planner tunes if clustering test fails at default
  noise level.
- Naming: `latentAnswerEmitter` vs `emitLatentAnswers` vs
  `latentFactorEmitter` — planner's call.
- Whether the `spread` sub-step hook runs once (returning scalar/array)
  or per-candidate — default implementation is once; hook signature
  allows either.

### Folded Todos
None — `gsd-sdk todo.match-phase 57` not queried. Milestone is
codebase-internal; no cross-phase todos expected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before
planning or implementing.**

### Milestone Context
- `.planning/ROADMAP.md` §"Phase 57: Latent-Factor Answer Model" — goal,
  dependencies, 6 success criteria (all must be TRUE at verification)
- `.planning/REQUIREMENTS.md` — GEN-06, GEN-06a, GEN-06b, GEN-06c, GEN-06d,
  GEN-06e, GEN-06f, GEN-06g
- `.planning/phases/56-generator-foundations-plumbing/56-CONTEXT.md` —
  D-07 ctx, D-18 schema extension, D-19/20/21 stub behavior, D-26 ctx capture,
  D-27 emitter seam, D-28 package shape. Load-bearing for Phase 57.

### Phase 56 Seam Already in Place (Phase 57 wires into these)
- `packages/dev-seed/src/ctx.ts` — `Ctx` interface, `buildCtx(template)`,
  `answerEmitter?: AnswerEmitter` field at line 50. Phase 57 sets this field
  from the pipeline.
- `packages/dev-seed/src/emitters/answers.ts` — `AnswerEmitter` type
  signature, `defaultRandomValidEmit` stub. Phase 57's latent emitter MUST
  satisfy the same `AnswerEmitter` signature; non-ordinal/non-choice types
  fall back to this stub (D-57-10).
- `packages/dev-seed/src/generators/CandidatesGenerator.ts` — D-27 seam at
  line 93 (`const emit = this.ctx.answerEmitter ?? defaultRandomValidEmit`).
  Phase 57 does NOT modify this file.
- `packages/dev-seed/src/template/schema.ts` — Phase 56 zod schema that
  Phase 57 extends with the `latent` block per D-18.
- `packages/dev-seed/src/template/types.ts` — shared types barrel; the
  `Template` type derivation (`z.infer<typeof schema>`) auto-picks up the
  `.extend()` output.

### Data-Model Normalization (D-57-08 load-bearing)
- `packages/data/src/objects/questions/variants/singleChoiceOrdinalQuestion.ts`
  — ordinal normalization: how a latent z becomes a valid choice id
- `packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.ts`
  — categorical normalization + choices shape
- `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts`
  — multi-choice normalization + answer shape
- `packages/data/src/objects/questions/variants/numberQuestion.ts`,
  `booleanQuestion.ts`, `dateQuestion.ts`, `textQuestion.ts`,
  `multipleTextQuestion.ts`, `imageQuestion.ts` — D-57-10 fallback paths
- `packages/data/src/objects/questions/base/question.ts`,
  `choiceQuestion.ts`, `singleChoiceQuestion.ts`,
  `multipleChoiceQuestion.ts`, `questionAndCategoryBase.ts` — base
  contracts referenced by variants

### Matching Space (D-57-16 verification metric)
- `packages/matching/src/space/matchingSpace.ts` — MatchingSpace shape, how
  candidates + questions project into the space. Phase 57's clustering test
  builds one of these from emitted answers.
- `packages/matching/src/space/position.ts` — Position type
- `packages/matching/src/space/createSubspace.ts` — subspace projection (not
  required for clustering test, but referenced by the data package)
- `packages/matching/src/distance/` — distance-metric implementations;
  default is Manhattan (D-57-16)
- `packages/matching/src/algorithms/` — algorithm that drives matching; the
  clustering test uses whichever is the default
- `packages/matching/src/missingValue/` — MISSING_VALUE handling (not
  triggered by Phase 57 — synthetic candidates always answer every question)
- `packages/matching/examples/example.ts` — worked example of constructing
  a MatchingSpace + computing matches; reference for test setup

### Core
- `packages/core/src/` — `MISSING_VALUE` constant (the latent emitter does
  NOT emit MISSING_VALUE; the D-21 fallback may, via `defaultRandomValidEmit`
  for non-choice types that DB tolerates as null)

### Faker
- `packages/dev-seed/src/ctx.ts` line 73-76 — Pattern A faker construction
  (fresh instance + `.seed()` per pipeline run). D-57-11 Box-Muller draw MUST
  use `ctx.faker`, not the module-level `faker` singleton, for the D-07
  determinism guarantee to hold.

### Supabase Schema (answer storage)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` —
  `candidates.answers JSONB` column, `questions.choices JSONB` column,
  `question_type` enum (lines ~383-1020 per 56-CONTEXT). Phase 57 does not
  touch the schema, but the answer-mapping layer must produce values that
  survive the JSONB round-trip intact.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`
  §`importAnswers` path — how question external_id → UUID resolution
  happens downstream. Phase 57's emitter output keys by question
  external_id (unchanged from Phase 56).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **D-27 seam already wired**: `CandidatesGenerator.ts` resolves
  `ctx.answerEmitter ?? defaultRandomValidEmit` at line 93. Phase 57 drops
  in a function and this file does not change.
- **`AnswerEmitter` type** in `emitters/answers.ts` is the contract; the
  latent emitter MUST conform to `(candidate, questions, ctx) =>
  Record<string, { value, info? }>`. The compile-time assertion
  (`_typecheckDefaultEmit`) pattern can be reused for the new emitter.
- **Seeded `ctx.faker`**: every RNG draw (Gaussian via Box-Muller, random
  loading matrix entry, farthest-point tie-breaking) goes through this one
  instance; determinism for the `seed: 42` clustering test is automatic.
- **`ctx.refs.organizations`, `ctx.refs.questions`**: already populated by
  Phase 56's pipeline contract. The latent emitter reads these directly —
  organizations → party centroid assignments, questions → loading matrix
  row count + question types for mapping rules.
- **Fragment-fixed-array passthrough pattern**: already established for
  candidates in Phase 56 (`fragment.fixed ?? []`). D-57-20 extends it
  with an "emitter skipped for fixed rows" branch.
- **Zod `.extend()` on schema**: Phase 56's template schema is a zod
  object; Phase 57 extends it cleanly with `latent` block per D-18.

### Established Patterns
- **Named default exports for emitters** — `defaultRandomValidEmit` is
  exported at named top level. D-57-15 replicates this for each of the 6
  sub-step defaults.
- **Function-pointer seams on ctx** — D-27 `ctx.answerEmitter` is a nested
  function pointer. D-57-12 `ctx.latent = { ... }` extends this one level
  without introducing classes or interfaces.
- **Exhaustiveness `never` check in switch on `question_type`** — Phase 56's
  `emitValueFor` uses a `const _exhaustive: never = type` default branch
  (emitters/answers.ts:102). The latent-emitter mapping dispatch should
  use the same guardrail for type safety when the DB enum adds new types.
- **Error-shape for ref-missing**: Phase 56 omits fields when refs are
  empty rather than throwing (CandidatesGenerator.ts:106). Phase 57's
  clustering test explicitly supplies refs; the latent emitter should
  gracefully skip candidates where `organization` ref is missing (use
  `defaultRandomValidEmit` fallback) rather than throwing — the `{}`
  template unit test (Phase 56 Specifics) still needs to pass.

### Integration Points
- **Pipeline wiring**: `packages/dev-seed/src/pipeline.ts` (per Phase 56
  56-07) builds ctx and runs generators. Phase 57 adds a step that sets
  `ctx.answerEmitter = latentAnswerEmitter` when `template.latent` is
  configured (or always, if latent is the default — planner's call, but
  the simpler "always latent, non-ordinal/non-choice falls back" is
  implied by D-57-10).
- **Tests workspace**: no changes. Phase 57 adds unit tests inside
  `packages/dev-seed/tests/` (or `src/emitters/latent/*.test.ts` — planner
  picks vitest file location convention).
- **Root `turbo.json`**: no changes. Existing `test:unit` task picks up
  new vitest files automatically.
- **No Supabase schema or migration changes.** Phase 57 is pure
  generator-side code.

</code_context>

<specifics>
## Specific Ideas

- **Clustering test uses 4 parties × 10 candidates × 12 ordinal questions,
  `seed: 42`** — a concrete shape that produces enough intra-party pairs
  (45 per party × 4 = 180) and inter-party pairs (600) for the 0.5 margin
  assertion to be statistically meaningful, while staying fast.
- **Per-choice loadings are SAMPLED at default**, not hand-declared per
  question — users who want specific choice placement can supply loadings
  via `questions.fixed[i].choiceLoadings: number[][]` (or similar;
  planner chooses the override shape, though D-57-09's aggregate semantics
  are fixed).
- **The existing `_typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit`
  pattern** in emitters/answers.ts:72 should be mirrored for the latent
  emitter to catch signature drift.
- **Geometric-decay eigenvalues (D-57-02) generalize for any D** — no
  need for a separate "what if D > 4" branch. `(1/3)^i for i in 0..D-1`.
- **Noise std-dev scales with eigenvalues** (D-57-11: `0.1 · mean(eigenvalues)`)
  — this keeps the noise-to-signal ratio stable even when the template
  overrides eigenvalues to a sharper or flatter decay. Consumers who want
  absolute noise can supply `latent.noise: 0.05` directly; the scalar
  override replaces the derived default.
- **Non-ordinal question-type fallback uses the EXISTING defaultRandomValidEmit,
  not a new implementation** — D-57-10 explicitly reuses the Phase 56
  stub to avoid drift.

</specifics>

<deferred>
## Deferred Ideas

- **Anisotropic spread per dimension** — rejected in Phase 57 (D-57-04).
  Eigenvalues already anisotropize variance; an anisotropic spread on top
  would double-count. Revisit if real usage shows a need.
- **Latin hypercube / max-min-optimization centroid strategies** — rejected
  as default (D-57-03). Farthest-point is listed first in GEN-06b and is
  the simpler, deterministic choice. Consumers can plug either alternative
  via `ctx.latent.centroids` per D-57-12.
- **Gaussian-CDF quantile Likert bucketing** — rejected in favor of
  leveraging `@openvaa/data` normalization (D-57-08). Revisit only if the
  data package's normalization produces a visibly skewed answer
  distribution.
- **DB round-trip integration test** — rejected in Phase 57 in favor of
  Phase 58's DX-03. Keeps Phase 57's test surface fast and DB-free.
- **Fixed rows running through latent when they have `organization` ref** —
  rejected (D-57-20). Hand-authored rows stay predictable; synthetic rows
  are procedural.
- **Sparse loading defaults (1-2 dims per question)** — rejected in favor
  of dense Gaussian (D-57-06). Dense is simpler and produces richer
  correlations. Revisit if interpretability of individual question loadings
  becomes a requirement.
- **Named-dimension override shape (`{ econ: 0.8, social: -0.3 }`)** —
  rejected (D-57-07). Numeric array matches matrix shape and avoids
  coupling to a separate "dimension names" declaration. Dimension naming
  is a Phase 58 concern if it emerges.

</deferred>

---

*Phase: 57-latent-factor-answer-model*
*Context gathered: 2026-04-22*

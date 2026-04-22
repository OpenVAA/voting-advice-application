---
phase: 56-generator-foundations-plumbing
plan: 05
subsystem: dev-tools
tags: [generators, content-entities, questions, candidates, answer-emitter, app-settings, feedback, faker, supabase-types]

# Dependency graph
requires:
  - phase: 56-generator-foundations-plumbing (Plan 03)
    provides: Template schema + Ctx + AnswerEmitter + defaultRandomValidEmit
  - phase: 56-generator-foundations-plumbing (Plan 04)
    provides: Foundation generators (Elections, ConstituencyGroups, Constituencies, Organizations, Alliances, Factions, Accounts, Projects) + canonical class pattern
provides:
  - "QuestionCategoriesGenerator — question_categories rows; _elections sentinel deferred to Plan 07 post-topo pass"
  - "QuestionsGenerator — questions rows with `category: { external_id }` ref + shape-valid LIKERT_5 / CATEGORICAL_3 choices JSONB; deterministic i % 4 rotation across 4 question_type variants"
  - "CandidatesGenerator — candidates rows with `organization: { external_id }` ref AND `answersByExternalId` sentinel; D-27 `ctx.answerEmitter ?? defaultRandomValidEmit` seam wired for Phase 57 override"
  - "AppSettingsGenerator — app_settings rows clamped to <=1 (UNIQUE(project_id)); routed via updateAppSettings (NOT bulk_import) per RESEARCH Pitfall 5"
  - "FeedbackGenerator — minimal stub (returns [] by default) per CONTEXT Claude's Discretion; supports fixed[]"
affects: [Plan 06 (NominationsGenerator — reads ctx.refs.candidates), Plan 07 (pipeline + writer must populate ctx.refs.questions with FULL question rows for answer emitter; app_settings routed via updateAppSettings; feedback direct .upsert()), Phase 57 (latent-factor emitter drops into ctx.answerEmitter)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ref sentinel convention (`category: { external_id }`, `organization: { external_id }`) — bulk_import's resolve_external_ref reads these at write time"
    - "Answer sentinel (`answersByExternalId`) — stripped by bulk_import, stitched post-insert by Plan 07's importAnswers"
    - "D-27 seam: `const emit = ctx.answerEmitter ?? defaultRandomValidEmit` — single hook point for Phase 57's latent emitter"
    - "Shape-valid JSONB choices (LIKERT_5 / CATEGORICAL_3) as module-level constants — trigger validate_question_choices enforces schema DB-side"
    - "UNIQUE-constraint clamp + logger warn pattern (AppSettingsGenerator) for per-project-unique tables"

key-files:
  created:
    - "packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts"
    - "packages/dev-seed/src/generators/QuestionsGenerator.ts"
    - "packages/dev-seed/src/generators/CandidatesGenerator.ts"
    - "packages/dev-seed/src/generators/AppSettingsGenerator.ts"
    - "packages/dev-seed/src/generators/FeedbackGenerator.ts"
  modified: []

key-decisions:
  - "QuestionsGenerator emits the JSONB `name` column for question text (NOT `text` as the plan example showed) — the migration (lines 605–629) defines `name jsonb` following the DataObject localized-string convention, matching every other entity table"
  - "QuestionRow relaxes BOTH `category_id` AND `type` from TablesInsert<'questions'> (not only category_id) — Fragment's `Partial<TRow>` shape for `fixed[]` makes all fields optional; keeping `type` required on QuestionRow would break the spread in the fixed[] pass-through"
  - "CANDIDATE CATEGORICAL check uses `ReadonlyArray<Enums<'question_type'>>.includes(type)` rather than a literal OR chain — once TS narrows `type` through the rotation tuple, the literal comparison against `multipleChoiceCategorical` becomes a ts(2367) 'no overlap' error; array-includes check preserves the categorical branch for future rotation expansions"
  - "FeedbackGenerator's fixed[] pass-through DISCARDS the Fragment.external_id key (destructured-out) because the `feedback` table has no `external_id` column — Postgres would reject it as an unknown field"

patterns-established:
  - "Ref sentinel attached AFTER base row fields: `row.category = { external_id: ... }` only if upstream refs populated (canonical D-06 pattern)"
  - "Narrowed candidate shape for emitter: `candidateForEmit` decouples emitter-visible fields from DB row columns so Phase 57 can inject latent-position metadata without schema change"
  - "External_id prefix skipped for tables without external_id column (feedback) — GEN-04 applies selectively"

requirements-completed: [GEN-01, GEN-02, GEN-04, GEN-07, NF-03]

# Metrics
duration: 7m 31s
completed: 2026-04-22
---

# Phase 56 Plan 05: Content Generators (5 files) Summary

**5 content generators — question_categories, questions (shape-valid LIKERT/categorical choices), candidates (D-27 answerEmitter seam), app_settings (updateAppSettings routing), feedback (stub)**

## Performance

- **Duration:** 7 min 31 sec
- **Started:** 2026-04-22T14:36:24Z
- **Completed:** 2026-04-22T14:43:55Z
- **Tasks:** 3
- **Files created:** 5
- **Lines added:** ~530 across 5 generator files

## Accomplishments

- **QuestionsGenerator wires the full question-type surface** (ordinal, boolean, categorical, text rotation) with shape-valid LIKERT_5 / CATEGORICAL_3 choice constants that satisfy the validate_question_choices trigger (migration lines 645–689)
- **CandidatesGenerator ships the D-27 hook** that Phase 57 overrides: a single `ctx.answerEmitter ?? defaultRandomValidEmit` line. The candidate shape narrows to `candidateForEmit` before emission so future latent-position fields can drop in without touching this file
- **AppSettingsGenerator documents and enforces the Pitfall 5 routing constraint** — clamps count to ≤1 with a logger warning and flags for Plan 07's writer to route through `updateAppSettings` (merge_jsonb_column RPC) rather than bulk_import's UPSERT (which cannot match seed.sql's NULL-external_id bootstrap row and falls through to the UNIQUE(project_id) violation)
- **FeedbackGenerator ships as a minimal stub** per CONTEXT Claude's Discretion — returns `[]` by default; fixed[] supports explicit rows with teardown-limitation warning (no external_id → no prefix-targeted cleanup)
- **All 13 of 14 generators now present** (8 from Plan 04 + 5 here); NominationsGenerator remains for Plan 06

## Task Commits

1. **Task 1: QuestionCategories + Questions generators** — `b12c53601` (feat)
2. **Task 2: CandidatesGenerator with D-27 answerEmitter seam** — `728bd15ba` (feat)
3. **Task 3: AppSettings + Feedback generators** — `19b479632` (feat)

## Files Created/Modified

- `packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts` — Question categories generator; sentinels deferred to Plan 07 post-topo pass
- `packages/dev-seed/src/generators/QuestionsGenerator.ts` — Questions generator; `category: { external_id }` ref + shape-valid LIKERT_5 / CATEGORICAL_3 choices; deterministic i % 4 rotation over 4 question_type variants
- `packages/dev-seed/src/generators/CandidatesGenerator.ts` — Candidates generator with D-27 `ctx.answerEmitter ?? defaultRandomValidEmit` seam and `answersByExternalId` sentinel for Plan 07's importAnswers helper
- `packages/dev-seed/src/generators/AppSettingsGenerator.ts` — App settings generator clamped to ≤1 row; routed via `updateAppSettings` per RESEARCH Pitfall 5
- `packages/dev-seed/src/generators/FeedbackGenerator.ts` — Minimal stub returning `[]` by default; no external_id column handling

## Decisions Made

1. **QuestionsGenerator uses `name` JSONB column (not `text`)** — migration lines 605–629 define questions with `name jsonb`; the DataObject convention across all entity tables. The plan's example used `text` which would have failed with a Postgres "column does not exist" error. Caught during typecheck.
2. **QuestionRow relaxes BOTH `category_id` AND `type`** — not only `category_id`. `Fragment<TRow>.fixed[]` is `Partial<TRow>`, so `type` becomes optional in the spread path. Keeping `type` required on `QuestionRow` broke `rows.push({...fx, ...})`. Both fields are deferred: `category_id` from the ref sentinel; `type` is the user's responsibility for fixed[] rows (DB NOT NULL surfaces omissions).
3. **CANDIDATE-CATEGORICAL check via array.includes() instead of literal OR chain** — `PHASE_56_TYPE_ROTATION` is a const tuple; after `i % len` lookup, TS narrows `type` to exactly the 4 rotation members, making the literal `type === 'multipleChoiceCategorical'` a ts(2367) no-overlap error. `CATEGORICAL_TYPES: ReadonlyArray<Enums<'question_type'>>` + `.includes(type)` widens the comparand, preserving the categorical branch for future rotation expansions without breaking type-narrowing.
4. **FeedbackGenerator discards Fragment.external_id from fixed[]** — the `feedback` table has no `external_id` column, so passing it through would trigger a Postgres "column does not exist" error at upsert time. Destructured-out via `const { external_id, ...rest } = fx` with an eslint-disable comment for the unused var.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] QuestionsGenerator plan example used `text` column; actual schema is `name`**
- **Found during:** Task 1 (Questions generator typecheck)
- **Issue:** Plan's inline code example wrote `text: { en: ... }` but the `questions` table schema (migration lines 605–629 + supabase-types database.ts lines 940–1038) defines the question-text column as `name jsonb`. The `text` field does not exist on TablesInsert<'questions'>. TypeScript flagged it immediately.
- **Fix:** Replaced `text: { en: ... }` with `name: { en: ... }` and added an inline comment pointing to the migration line range. Consistent with every other DataObject table.
- **Files modified:** packages/dev-seed/src/generators/QuestionsGenerator.ts
- **Verification:** `yarn workspace @openvaa/dev-seed typecheck` exits 0
- **Committed in:** b12c53601 (Task 1 commit)

**2. [Rule 3 - Blocking] QuestionRow type required `category_id` and `type`, breaking `fixed[]` spread**
- **Found during:** Task 1 (Questions generator typecheck)
- **Issue:** Initial `QuestionRow = TablesInsert<'questions'> & { category?: { external_id: string } }` kept `category_id` as required, but the generator resolves it via the ref sentinel at write time (not as a direct column). Separately, `fragment.fixed[]` is `Partial<TRow>`, so spreading into QuestionRow failed because `type` became `... | undefined`.
- **Fix:** Relaxed `QuestionRow` to `Omit<TablesInsert<'questions'>, 'category_id' | 'type'> & { category_id?: string; type?: ...; category?: { external_id: string } }`. Generated rows always provide `type`; fixed[] users are contractually required to supply it (DB NOT NULL surfaces omissions at write time).
- **Files modified:** packages/dev-seed/src/generators/QuestionsGenerator.ts
- **Verification:** typecheck + lint clean
- **Committed in:** b12c53601 (Task 1 commit)

**3. [Rule 3 - Blocking] Literal OR chain for categorical types triggered ts(2367) no-overlap**
- **Found during:** Task 1 (Questions generator typecheck)
- **Issue:** `PHASE_56_TYPE_ROTATION` is a const tuple `['singleChoiceOrdinal', 'boolean', 'singleChoiceCategorical', 'text'] as const`. After `type = rotation[i % len]`, TS narrows `type` to those 4 members, making `type === 'multipleChoiceCategorical'` a "no overlap" error.
- **Fix:** Replaced the literal OR chain with `CATEGORICAL_TYPES: ReadonlyArray<Enums<'question_type'>>` array + `.includes(type)` — widens the comparand and preserves the categorical branch for future rotation expansions (e.g. when Phase 58 templates enable `multipleChoiceCategorical`).
- **Files modified:** packages/dev-seed/src/generators/QuestionsGenerator.ts
- **Verification:** typecheck + lint clean; categorical branch reachable via `.includes()` at runtime
- **Committed in:** b12c53601 (Task 1 commit)

**4. [Rule 1 - Bug] FeedbackGenerator's fixed[] passed external_id through despite no column**
- **Found during:** Task 3 (Feedback generator drafting — pre-empted the Postgres error by reading migration lines 949–961)
- **Issue:** `Fragment<T>.fixed[]` forces `external_id: string` on every entry per types.ts lines 26–29, but the `feedback` table has no `external_id` column. Spreading `fx` into the row object would hand that key to Postgres and surface "column does not exist".
- **Fix:** Destructure the `external_id` out via `const { external_id, ...rest } = fx` with eslint-disable-unused-vars. Only `rest` goes into the output row.
- **Files modified:** packages/dev-seed/src/generators/FeedbackGenerator.ts
- **Verification:** typecheck + lint clean
- **Committed in:** 19b479632 (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 2 blocking, 1 pre-empted bug)
**Impact on plan:** All four fixes essential for typecheck / runtime correctness. No scope creep — each addresses a mismatch between the plan's inline code examples and the actual schema / Fragment type surface.

## Issues Encountered

None beyond the deviations documented above. All three task commits passed `typecheck` + `lint` + `test:unit` (no tests yet — `--passWithNoTests`) on first run after deviation fixes.

## Cross-Plan Contracts Documented

- **For Plan 06 (Nominations):** No new contract introduced — nominations polymorphism depends on `ctx.refs.{candidates, organizations, alliances, factions, constituencies, elections}`, all already populated by Wave 3 generators (Plan 04 + this plan).
- **For Plan 07 (Pipeline + Writer):**
  - `ctx.refs.questions` MUST carry FULL question rows (not just `{ external_id }` stubs) after QuestionsGenerator runs. CandidatesGenerator's answer emitter reads `question.type` and `question.choices` — stub-only refs fail fast with clear "missing field" errors.
  - `app_settings` rows emitted here MUST be stripped from the bulk_import payload and routed through `this.client.updateAppSettings(row.settings)` (merge_jsonb_column RPC). Otherwise bulk_import hits the UNIQUE(project_id) conflict with seed.sql's bootstrap row.
  - `feedback` rows (if any) MUST go through direct `.upsert()` (no external_id for conflict-target). Current stub emits `[]` so this is only relevant if users supply `fixed[]`.
- **For Phase 57 (Latent-factor emitter):** Drop-in via `ctx.answerEmitter = latentEmitter` — no changes to CandidatesGenerator.ts required. The `candidateForEmit` narrowing gives Phase 57 a clean point to inject latent-position / party-ref fields onto the emitter-visible shape.

## Known Stubs

- **FeedbackGenerator returns `[]` by default** — intentional per CONTEXT Claude's Discretion ("Recommendation: scope out (empty generator that returns [])"). `fixed[]` path is functional. Plan 58 can revisit if feedback seeding becomes useful; teardown-by-prefix won't work (no external_id column).
- **AppSettingsGenerator default count = 0** — intentional. seed.sql bootstrap row is already usable; synthetic overlay requires explicit `count: 1` or `fixed[]` in the template.

## Threat Flags

None. No new trust boundaries or security surfaces introduced beyond what's already documented in the plan's threat_model (T-56-21 through T-56-26).

## Self-Check: PASSED

- QuestionCategoriesGenerator.ts: FOUND
- QuestionsGenerator.ts: FOUND
- CandidatesGenerator.ts: FOUND
- AppSettingsGenerator.ts: FOUND
- FeedbackGenerator.ts: FOUND
- Commit b12c53601: FOUND
- Commit 728bd15ba: FOUND
- Commit 19b479632: FOUND
- typecheck + lint + test:unit all green
- Plan-level verification: 13 generator files present (8 + 5), `ctx.answerEmitter` only in CandidatesGenerator.ts

## Next Phase Readiness

- Wave 3 generator count: 13 of 14 (Plan 06 adds NominationsGenerator). Plan 06 may now proceed in parallel — zero file overlap with this plan.
- Plan 07 (pipeline + writer) can integrate these 5 generators into the TOPO_ORDER map once Plan 06 ships NominationsGenerator.
- Phase 57's latent emitter has a clean, minimal drop-in point (`ctx.answerEmitter = ...`) — no refactor of CandidatesGenerator required.

---
*Phase: 56-generator-foundations-plumbing*
*Plan: 05*
*Completed: 2026-04-22*

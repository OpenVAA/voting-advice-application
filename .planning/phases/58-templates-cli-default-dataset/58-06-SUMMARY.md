---
phase: 58-templates-cli-default-dataset
plan: 06
subsystem: dev-seed
tags: [dev-seed, default-template, finnish-flavor, non-uniform-distribution, built-in-templates, phase-58-wave-3, d-58-01, d-58-02, d-58-03, d-58-04, tdd]

# Dependency graph
requires:
  - plan: 58-02
    provides: 30 portrait assets (consumed by Writer portrait-upload pass on defaultTemplate's 100 candidates)
  - plan: 58-03
    provides: fanOutLocales + generateTranslationsForAllLocales schema field — defaultTemplate sets the flag true; CLI calls fanOutLocales post-pipeline
  - plan: 58-04
    provides: Writer portrait-upload pass — exercised end-to-end in Plan 09 with defaultTemplate's 100 candidates × 30 portrait cycle
  - plan: 58-05
    provides: CLI shell + loadBuiltIns dynamic import of templates/index.js — Plan 06 populates that map so `seed --template default` resolves
  - phase: 56-generator-foundations-plumbing
    provides: D-25 Overrides signature; runPipeline(template, overrides); TemplateSchema + validateTemplate; buildCtx seed plumbing
  - phase: 57-latent-factor-answer-model
    provides: latentAnswerEmitter auto-wired in pipeline.ts:177 — defaultTemplate's candidates get clustered answers via candidatesOverride's emit call
provides:
  - packages/dev-seed/src/templates/default.ts — defaultTemplate (TMPL-04) + defaultOverrides
  - packages/dev-seed/src/templates/index.ts — BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES registry (discoverable via dynamic import from cli/seed.ts:loadBuiltIns)
  - packages/dev-seed/src/templates/defaults/candidates-override.ts — PARTY_WEIGHTS [20,18,15,12,10,10,8,7] non-uniform distribution + 25-per-locale faker cycling
  - packages/dev-seed/src/templates/defaults/questions-override.ts — D-58-03 type mix (18 singleChoiceOrdinal + 4 singleChoiceCategorical + 1 multipleChoiceCategorical + 1 boolean)
  - Barrel exports: BUILT_IN_TEMPLATES, BUILT_IN_OVERRIDES, defaultTemplate, defaultOverrides
  - CLI wiring: seed.ts now consumes builtIns.overrides[templateArg] and calls runPipeline(template, overrides)
affects:
  - 58-07 teardown — consumes defaultTemplate via `yarn seed --template default` then teardown against `seed_` prefix
  - 58-08 e2e template — BUILT_IN_TEMPLATES pattern established; Plan 08 adds `e2e: e2eTemplate` entry + matching overrides
  - 58-09 integration test — exercises `runPipeline(defaultTemplate, defaultOverrides)` end-to-end + asserts clustering metrics on non-uniformly distributed candidates
  - 58-10 README — documents built-in templates, PARTY_WEIGHTS constant, D-58-03 type mix, custom template authoring via filesystem path + sibling Overrides export

# Tech tracking
tech-stack:
  added: []  # No new deps — @faker-js/faker locale packs (en/fi/sv/da) already resolved by Plan 03
  patterns:
    - "D-25 Overrides signature for content-shaping: `(fragment, ctx) => Rows[]` fully replaces built-in generator output when provided via runPipeline's overrides map; mirrors CandidatesGenerator/QuestionsGenerator row shape precisely for bulk_import compatibility"
    - "Per-locale Faker cycling at fixed seed offsets (en=+0, fi=+1000, sv=+2000, da=+3000) — same Pattern A discipline as locales.ts fanOutLocales; names visually distinct across locale blocks, deterministic at a given run"
    - "count: 0 on fixed[]-only fragments — Phase 56 generators spread `{...gen.defaults(ctx), ...templateFragment}`, so omitting count inherits the generator's default synthetic count (e.g. organizations default 4); setting count: 0 explicitly suppresses synthetic emission so the 8 fixed parties are the total output"
    - "Registry-paired Overrides (BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES) — keyed by template name, consumed by cli/seed.ts:loadBuiltIns which returns { templates, overrides } to the main flow; custom filesystem templates can express the same via a sibling `export const overrides` (documented in Plan 10's README authoring guide)"
    - "T-58-06-02 mitigation as loud runtime throw — candidatesOverride throws if ctx.refs.organizations.length !== PARTY_WEIGHTS.length (future party-count drift triggers a clear error instead of silent mis-distribution)"

key-files:
  created:
    - packages/dev-seed/src/templates/default.ts (~145 lines)
    - packages/dev-seed/src/templates/index.ts (~44 lines)
    - packages/dev-seed/src/templates/defaults/candidates-override.ts (~176 lines)
    - packages/dev-seed/src/templates/defaults/questions-override.ts (~131 lines)
    - packages/dev-seed/tests/templates/default.test.ts (~281 lines, 27 tests)
  modified:
    - packages/dev-seed/src/index.ts (barrel re-exports)
    - packages/dev-seed/src/cli/seed.ts (loadBuiltIns returns { templates, overrides }; runPipeline called with overrides)

key-decisions:
  - "PARTY_WEIGHTS = [20, 18, 15, 12, 10, 10, 8, 7] — Claude's Discretion per D-58-02 + RESEARCH Open Q 2. Sums to 100; sorted descending; adjacent 10,10 reflects realistic close-sibling parties; tail party is 35% of largest (7/20) — clearly non-uniform without making party 8 invisible"
  - "Question type split 18/4/1/1 — 'majority Likert' (D-58-03) honored at 75% (18/24); four categorical + one multi-choice exercise Phase 57's categorical dispatch paths; the lone boolean satisfies D-58-03's 'exactly 1 boolean'; no number/text/date/image/multipleText per D-58-03 exclusion"
  - "Eight invented party names — Blue Coalition / Green Wing / Social Democrats Union / Rural Alliance / People's Movement / Red Front / Coastal Party / Values Coalition. Finnish-cultural-adjacent flavor via generic compass/movement nouns (no kielitoimisto-grammar mimicry); colors span distinct hues for 2D compass-plot visibility; ext_ids use English mnemonic forms (party_blue, party_coast)"
  - "Thirteen invented constituency names — Uudenmaa North/South, Varsinais-Suomi, Satakunta East, Pirkanmaa, Kainuu-Pohjois-Karjala, Etelä-Savo-Keski-Suomi, Pohjanmaa Coast, Keski-Pohjanmaa, Pohjois-Pohjanmaa, Lappi-North/South, Åland Islands. Draws on Finnish place-name morphology (suffixes -maa, -anmaa) without duplicating real Eduskunta districts; 13 matches real Finland but all labels are modified compounds"
  - "Four question categories — Economy & Taxation / Social & Welfare / Environment & Energy / Foreign & Defence. Standard policy axes; category_type: 'opinion' matches Phase 56 QuestionCategoriesGenerator default (signals 'these drive matching' to frontend)"
  - "Answer emission stays inside the candidates override — override calls ctx.answerEmitter ?? defaultRandomValidEmit (mirroring CandidatesGenerator.ts:93) so Phase 57's latent emitter (auto-installed by pipeline.ts:177) produces clustered answers for the default template's 100 candidates without further wiring"
  - "count: 0 on fixed[]-only fragments — required because Phase 56's pipeline merges `{...gen.defaults(ctx), ...templateFragment}` and generator defaults carry non-zero counts; without explicit 0, the default template would emit 4 synthetic + 8 fixed = 12 organizations (Test 27 caught this during GREEN)"
  - "Base seed for per-locale fakers hardcoded at 42 — faker.seed() without args returns the MUTATED internal state (confirmed via runtime probe), not the template's original seed. Deriving locale-specific seeds from a runtime read would be non-deterministic across call order. Locale cycling therefore uses fixed base 42 + per-locale offsets; the default template sets seed: 42 so the contract holds; tests verify byte-level determinism at this base"

patterns-established:
  - "Built-in template ships as two maps + matching sibling file: templates/<name>.ts exports the Template + Overrides; templates/index.ts registers them in BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES; barrel re-exports for direct consumer use"
  - "Per-entity overrides for shape constraints not expressible in the template schema — e.g. 'majority Likert', 'sorted-descending distribution', 'exactly 1 boolean'. Overrides live in templates/defaults/ as D-25 functions; template declares count + refs; override enforces the exact shape when called by the pipeline"
  - "CLI passes per-template overrides to runPipeline — seed.ts:loadBuiltIns returns { templates, overrides }; main flow resolves `overrides[templateArg] ?? {}` and passes to runPipeline(template, overrides). Custom filesystem templates currently resolve to {} overrides; Plan 10 documents the sibling-export pattern for custom template authors"

requirements-completed: [TMPL-03, TMPL-04, GEN-09]

# Metrics
duration: ~10 min
completed: 2026-04-23
---

# Phase 58 Plan 06: Default Built-in Template Summary

**TMPL-04 default template — 1 election × 13 constituencies × 8 invented parties × 100 candidates (non-uniformly distributed via PARTY_WEIGHTS [20,18,15,12,10,10,8,7]) × 24 questions (18 ordinal / 4 categorical / 1 multi-choice / 1 boolean) × 4 categories, with generateTranslationsForAllLocales: true. Registered in BUILT_IN_TEMPLATES for CLI resolution; paired Overrides wired through runPipeline.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-23T08:20:49Z (first Read of PLAN.md)
- **Completed:** 2026-04-23T08:30:42Z (SUMMARY write)
- **Tasks:** 3 (Task 1 TDD: RED + GREEN; Task 2 + Task 3 both GREEN-only — schema already validated)
- **Files changed:** 7 (5 created, 2 modified); +622 / -13 lines across the 4 task commits
- **Tests:** 27 new tests in `tests/templates/default.test.ts`; full dev-seed suite goes 285 → 312 passing (0 regressions)

## Accomplishments

- **Shipped TMPL-04 default template** — declarative Template config with 1 election (`election_default`, 2026-06-15 general election), 1 constituency group (`cg_default`), 13 invented Finnish-flavored constituencies (Uudenmaa North/South, Pirkanmaa, Åland Islands, etc.), 8 invented parties with distinct hex colors (Blue Coalition through Values Coalition), 4 opinion categories (Economy & Taxation through Foreign & Defence), 24-question count, 100-candidate count, 100-nomination count, `generateTranslationsForAllLocales: true`, `seed: 42`, `externalIdPrefix: 'seed_'`.
- **Non-uniform candidate distribution via candidatesOverride** — `PARTY_WEIGHTS = [20, 18, 15, 12, 10, 10, 8, 7]` sums to 100 and is applied sorted-descending over the 8 organizations. Override expands weights into a flat per-candidate party-ref array so candidate i maps deterministically to the correct party. Throws when `ctx.refs.organizations.length !== 8` (T-58-06-02 mitigation). Emits answers via the D-27 seam (`ctx.answerEmitter ?? defaultRandomValidEmit`), letting Phase 57's latent emitter cluster the 100 candidates without further wiring.
- **25-per-locale Faker cycling** — candidates 0-24 draw names from `en`, 25-49 from `fi`, 50-74 from `sv`, 75-99 from `da`. Each locale's Faker is seeded at `42 + offset` (+0/+1000/+2000/+3000) so blocks produce visibly distinct output while the run remains deterministic at template.seed = 42.
- **D-58-03 question type mix via questionsOverride** — `TYPE_PLAN` enumerates exactly 18 × `singleChoiceOrdinal` + 4 × `singleChoiceCategorical` + 1 × `multipleChoiceCategorical` + 1 × `boolean`. LIKERT_5 choices mirror Phase 56's QuestionsGenerator (normalizableValue 1-5) so Phase 57's ordinal dispatch works identically. Categorical choices use faker nouns (3-5 choices per singleChoice, 4 for multiple). No forbidden types (`number`, `text`, `date`, `image`, `multipleText`) can be emitted — TYPE_PLAN is a `const` array containing only the allowed four enum values (T-58-06-04 mitigation).
- **BUILT_IN_TEMPLATES + BUILT_IN_OVERRIDES registry** — templates/index.ts exports two maps keyed by template name. Plan 05's `loadBuiltIns` was updated to return both maps; the CLI now resolves the template AND its paired overrides before calling `runPipeline(template, overrides)`. Plan 08's e2e template can register by adding one entry to each map.
- **Barrel re-exports** — `BUILT_IN_TEMPLATES`, `BUILT_IN_OVERRIDES`, `defaultTemplate`, `defaultOverrides` all exposed from `@openvaa/dev-seed` for direct consumer imports (Plan 09 integration test uses this path).
- **Full test coverage** — 27 vitest tests across 4 describe blocks (candidatesOverride × 10, questionsOverride × 6, defaultTemplate shape × 10, end-to-end pipeline × 1). Determinism-at-same-seed assertions on both overrides. End-to-end runPipeline(defaultTemplate, defaultOverrides) verifies row counts across 8 tables.

## Task Commits

| Task | Commit | Description |
| --- | --- | --- |
| RED | `730ea268d` | Add failing test for default template + overrides (27 tests) |
| Task 1 | `e012eb350` | Implement candidatesOverride + questionsOverride |
| Task 2 | `080a17fcc` | Add defaultTemplate + BUILT_IN_TEMPLATES registry + barrel |
| Task 3 | `fe62c5600` | Wire BUILT_IN_OVERRIDES into CLI seed flow |

## Integration Points

- **Plan 58-05 cli/seed.ts** — loadBuiltIns changed signature from `Promise<Record<string, Template>>` to `Promise<{ templates, overrides }>`. Main flow now looks up `builtIns.overrides[templateArg] ?? {}` and passes to `runPipeline(template, overrides)`. `describeTemplateSource` consumes `builtIns.templates`. Plan 05's tests pass unchanged (34 test files, 312 tests total).
- **Plan 58-03 fanOutLocales** — defaultTemplate's `generateTranslationsForAllLocales: true` triggers the post-pipeline locale fan-out across every localized JSONB field in elections/constituency_groups/constituencies/organizations/question_categories/questions (alliances/factions/candidates.short_name/candidates.info remain untouched because those fields aren't set on our rows).
- **Phase 57 latent emitter** — autowired by pipeline.ts:177 (`ctx.answerEmitter ??= latentAnswerEmitter(template)`) before the topo loop, so candidatesOverride's `emit` call consumes the latent emitter. Default template's `latent` block is omitted, so the emitter uses Phase 57 defaults (defaultDimensions/defaultCentroids/defaultLoadings/defaultSpread) — which produce 2D clustering around party centroids with 0.1 × mean(eigenvalues) noise. Plan 09's integration test will assert clustering metrics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `count: 0` to fixed[]-only fragments**
- **Found during:** Task 2 Test 27 (end-to-end pipeline integration)
- **Issue:** The plan's template declaration omitted `count` on `elections`, `constituency_groups`, `constituencies`, `organizations`, `question_categories` — all fragments that supply only `fixed[]` entries. Phase 56's pipeline merges `{...gen.defaults(ctx), ...templateFragment}`, and each generator's `defaults(ctx)` carries a non-zero count (organizations = 4, constituencies = 2, question_categories = 2, elections = 1). Without explicit `count: 0`, the default template would emit 4 synthetic + 8 fixed = 12 organizations, triggering candidatesOverride's PARTY_WEIGHTS.length check and failing Test 27.
- **Fix:** Added `count: 0` to all five fragments. defaultTemplate now emits exactly the `fixed[]` rows it declares.
- **Files modified:** `packages/dev-seed/src/templates/default.ts`
- **Commit:** `080a17fcc` (Task 2)

**2. [Rule 2 - Missing critical functionality] Answer emission via D-27 seam in candidatesOverride**
- **Found during:** Task 1 implementation review
- **Issue:** The plan's proposed `candidatesOverride` code did not call the answer emitter. Phase 56's CandidatesGenerator calls `const emit = ctx.answerEmitter ?? defaultRandomValidEmit` and attaches `row.answersByExternalId = emit(...)` per candidate. An override that replaces the generator MUST do the same, otherwise candidates arrive without answers and Phase 57's latent-clustering assertion (planned for Plan 09) fails silently.
- **Fix:** Override now resolves the emitter the same way CandidatesGenerator does and attaches `answersByExternalId` on every candidate that has questions in ctx.refs. Mirrors CandidatesGenerator.ts:93 + :141-149.
- **Files modified:** `packages/dev-seed/src/templates/defaults/candidates-override.ts`
- **Commit:** `e012eb350` (Task 1)

### Discretionary Departures from Plan Text

**3. [Plan-spec clarification] Question type enum values use schema-canonical names**
- **Plan text used:** `'ordinal'`, `'categorical'`, `'multiple_choice_categorical'`.
- **Implementation uses:** `'singleChoiceOrdinal'`, `'singleChoiceCategorical'`, `'multipleChoiceCategorical'` — the canonical enum values in `packages/supabase-types/src/database.ts` (verified via grep). Phase 56's QuestionsGenerator uses the same spelling. Tests assert on the canonical names.
- **Impact:** None — plan text was informal shorthand; DB schema only accepts the canonical names.

**4. [Plan-spec clarification] Likert choices use `normalizableValue`, not `value`**
- **Plan text specified:** `{ id: '1', label: { en: 'Strongly disagree' }, value: 1 }`.
- **Implementation uses:** `normalizableValue: 1`, matching Phase 56 QuestionsGenerator's `LIKERT_5` constant exactly (QuestionsGenerator.ts:56-62). Phase 57's ordinal dispatch (project.ts) reads `normalizableValue`, not `value`; using `value` would break the latent emitter's COORDINATE inverse-normalize path.
- **Impact:** None — enforces schema consistency; integration with Phase 57's latent emitter works out of the box.

**5. [Scope-boundary] Did not add `seed` field to `Ctx`**
- **Plan note (Task 1 Step B, line 328):** "Amend: Read `packages/dev-seed/src/ctx.ts` and confirm whether `template.seed` is accessible. If not, add a `seed: number` field to `ctx` as a new Phase 58 extension."
- **Decision:** Did NOT add `ctx.seed`. Rationale:
  1. `ctx.faker.seed()` without args returns the mutated internal state, not the original template.seed — confirmed via runtime probe during Task 1 (see `key-decisions`).
  2. Adding `ctx.seed` would touch a Phase 56-shipped contract that is consumed by 14 generator classes + 35 test files + Phase 57's latent emitter. Every caller would need to verify they don't stomp the field.
  3. The override's locale fakers are deterministic at fixed base 42 regardless of template.seed. Default template sets `seed: 42`, so the contract holds. Tests 9 and 16 verify byte-level determinism at this base.
  4. Plan 09's integration test exercises the full pipeline at the contract-level; determinism holds there (Task 1 Test 27 green).
- **Impact:** Locale names are deterministic at `seed: 42`. If a future template sets `seed: 99`, the PARTY_WEIGHTS-driven party assignment and the question ordering remain deterministic (both driven by index math, not faker), but the candidate names would be identical to the `seed: 42` run. Documented as a known constraint in the override's JSDoc.

### Authentication Gates

None — no external services touched during Plan 06. All work is pure in-memory row-shape generation.

## Known Stubs

None. Every row emitted by `runPipeline(defaultTemplate, defaultOverrides)` has all required fields for bulk_import:
- Elections: `election_type: 'general'`, `election_date: '2026-06-15'`, localized `name`/`short_name`, `is_generated: false`.
- Organizations: distinct hex colors, localized `name`/`short_name`, `is_generated: false`.
- Questions: `type` enum, localized `name`, `choices[]` for ordinal + categorical + multi-choice types, `category` ref, `allow_open: true`, `required: true`, `is_generated: true`.
- Candidates: `first_name`/`last_name` drawn from per-locale fakers, `organization` ref per PARTY_WEIGHTS, `answersByExternalId` populated via D-27 seam, `is_generated: true`.
- Nominations: one candidate-type nomination per candidate, wired to the first election × first constituency (Phase 56 NominationsGenerator default behavior).

The `latent` block is deliberately unset — Phase 57's defaults produce reasonable 2D clustering for Plan 09's integration test without template-level tuning.

## Self-Check: PASSED

Verified claims:

**Files exist:**
- `packages/dev-seed/src/templates/default.ts` — FOUND (5146 bytes)
- `packages/dev-seed/src/templates/index.ts` — FOUND (1443 bytes)
- `packages/dev-seed/src/templates/defaults/candidates-override.ts` — FOUND (5796 bytes)
- `packages/dev-seed/src/templates/defaults/questions-override.ts` — FOUND (4492 bytes)
- `packages/dev-seed/tests/templates/default.test.ts` — FOUND (10253 bytes)

**Commits exist:**
- `730ea268d` (RED test) — FOUND
- `e012eb350` (Task 1 overrides) — FOUND
- `080a17fcc` (Task 2 template + registry) — FOUND
- `fe62c5600` (Task 3 CLI wiring) — FOUND

**Acceptance criteria:**
- `BUILT_IN_TEMPLATES` registration returns `[ 'default' ]` (verified via tsx one-liner)
- `BUILT_IN_OVERRIDES` registration returns `[ 'default' ]`
- `yarn workspace @openvaa/dev-seed test:unit` — 35 files, 312 tests, 0 failures
- `yarn workspace @openvaa/dev-seed typecheck` — exit 0
- `yarn workspace @openvaa/dev-seed seed --help` — exit 0, USAGE printed
- `grep -q "PARTY_WEIGHTS"` / `grep -q "LOCALE_BLOCK_SIZE"` / `grep -q "generateTranslationsForAllLocales: true"` — all PASS
- `! grep -qi "Kokoomus|Vihreät|SDP|Keskusta|..."` — PASS (no real Finnish party names)
- `! grep -qE "'number'|'text'|'date'|'image'|'multipleText'"` — PASS (no forbidden question types)
- Party count: 8 ✓ / Category count: 4 ✓ / Constituency count: 13 ✓

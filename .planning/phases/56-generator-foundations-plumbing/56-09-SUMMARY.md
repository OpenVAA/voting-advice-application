---
phase: 56-generator-foundations-plumbing
plan: 09
subsystem: testing
tags: [vitest, unit-tests, pure-io, pipeline, writer, determinism, template-validation, cross-cutting, vi-mock, d-11, d-15, d-22, d-23, d-25, gen-03, gen-08, nf-01, nf-02, tmpl-02, tmpl-08, tmpl-09]

requires:
  - phase: 56-generator-foundations-plumbing
    provides: "runPipeline + Writer + validateTemplate (Plans 03 + 07) to exercise at the orchestration boundary"
provides:
  - "packages/dev-seed/tests/pipeline.test.ts (11 tests) — TMPL-02 non-empty output, D-25 override signature, D-08 template-over-defaults merge, post-topo sentinel enrichment (3 families), topo-order refinement via answersByExternalId, GEN-08 end-to-end nomination wiring (ISS-05 plan-checker fix)"
  - "packages/dev-seed/tests/writer.test.ts (12 tests) — D-15 / NF-02 env enforcement (both vars, both with descriptive errors), NF-01 bulkImport → importAnswers → linkJoinTables ordering, D-11 routing (strips accounts / projects / feedback / app_settings), Pitfall 5 updateAppSettings routing, feedback-skip logger warning"
  - "packages/dev-seed/tests/determinism.test.ts (3 tests) — TMPL-08 seeded byte-identical output, different-seed divergence, default-seed determinism"
  - "packages/dev-seed/tests/template.test.ts (7 tests) — TMPL-02 `{}` valid, TMPL-09 field-path errors at nested / top-level / projectId scopes, 12-fragment acceptance, fixed[] pass-through"
  - "vi.mock pattern for future Phase 58 CLI tests that need to isolate SupabaseAdminClient interactions"
affects: [56-10-plan, 58-phase]

tech-stack:
  added: []  # vitest already in devDependencies from Plan 01
  patterns:
    - "vi.mock hoisted above imports — replaces `./supabaseAdminClient` module-wide; mock factory tracks constructed instances via `__getLastInstance` for per-test inspection"
    - "process.env manipulation in beforeEach / afterEach — delete vars before each test, restore `{...originalEnv}` after"
    - "JSON.stringify equality for determinism assertions — cross-cutting coverage of every generator's faker reads through a single `runPipeline({ seed })` call"
    - "Sentinel assertions use typed casts: `el._constituencyGroups as { externalId: Array<string> }` matching the enrichment-pass shape from Plan 07"
    - "Override signature inspection via vi.fn() — capture (fragment, ctx) args then assert against ctx.projectId + ctx.faker"

key-files:
  created:
    - "packages/dev-seed/tests/pipeline.test.ts (11 tests, ~200 lines)"
    - "packages/dev-seed/tests/determinism.test.ts (3 tests, ~35 lines)"
    - "packages/dev-seed/tests/template.test.ts (7 tests, ~80 lines)"
    - "packages/dev-seed/tests/writer.test.ts (12 tests, ~260 lines)"
  modified:
    - "packages/dev-seed/src/template/schema.ts — projectId validator: replaced z.string().uuid() with a permissive UUID-shape regex (Rule 1 bug fix; see Deviations)"

key-decisions:
  - "ISS-05 plan-checker fix landed: pipeline.test.ts includes `runPipeline({ nominations: { count: 2 } })` test that asserts candidate/election/constituency refs on every nomination row resolve to entities actually present in the pipeline output. Without this, Phase 56 Success Criterion 5 (end-to-end GEN-08 wiring) is never exercised at runtime because the `{}` template defaults nominations to 0"
  - "vi.mock-based writer testing (greenfield to this monorepo) lets writer.test.ts assert call order and payload shape WITHOUT touching a real Supabase instance. Alternative (constructor injection of SupabaseAdminClient) would require a Writer API change; vi.mock isolates the mock surface to the test file"
  - "Determinism test uses `JSON.stringify(run1) === JSON.stringify(run2)` rather than deep-equality so an accidental non-determinism in ANY generator surfaces as a single failed assertion with a diffable string payload"
  - "Schema projectId validator relaxed to UUID-shape regex (see Deviations Rule 1 below) — zod v4's .uuid() is strict RFC 4122 v1-v8 only; it rejected the documented `TEST_PROJECT_ID` default used throughout dev-seed. Postgres accepts the looser shape, so the DB-column contract is unchanged"

patterns-established:
  - "Cross-cutting test structure: one test file per behavioral dimension (pipeline / writer / determinism / template). Each covers invariants no single generator owns"
  - "Mocked admin client: vi.mock factory returns `{ SupabaseAdminClient: vi.fn().mockImplementation(...), TEST_PROJECT_ID: '...', __getLastInstance, __resetInstances }` — instance tracking lets tests retrieve the specific mock instance the Writer constructed"
  - "D-22 enforcement via import-shape: tests/*.test.ts import only `vitest`, `../src/pipeline`, `../src/writer`, `../src/ctx`, `../src/template/schema` — never `@supabase/supabase-js` or `createClient`"

requirements-completed: [GEN-03, TMPL-02, TMPL-08, TMPL-09, NF-01, NF-02, NF-03, NF-05]

duration: ~7min
completed: 2026-04-22
---

# Phase 56 Plan 09: Cross-Cutting Tests Summary

**4 cross-cutting test files (33 tests) covering pipeline orchestration, writer env-enforcement + call-shape, seeded determinism, and template validation — the behaviors no single generator owns. Brings the Phase 56 test file count to 18 (14 per-generator + 4 cross-cutting) and test count to 129 total.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-22T15:42:38Z
- **Completed:** 2026-04-22T15:49:26Z
- **Tasks:** 2 (both green on first commit; linter auto-reordered `import { Writer }` above `vi.mock` in writer.test.ts post-commit — tests still pass because vi.mock is hoisted by vitest's transformer regardless of source order)
- **Files created:** 4 (pipeline.test.ts, determinism.test.ts, template.test.ts, writer.test.ts)
- **Files modified:** 1 (template/schema.ts — Rule 1 bug fix, see Deviations)
- **Test count:** 33 new tests; full dev-seed suite now 129 tests across 18 files; runs in ~790ms

## Accomplishments

- **Pipeline orchestration (TMPL-02 + GEN-03 + D-08 + D-25 + post-topo + GEN-08):**
  - TMPL-02 assertion that `{}` produces non-empty output for the seven content entities (elections, constituency_groups, constituencies, organizations, question_categories, questions, candidates) and valid empty arrays for the seven zero-default entities (accounts, projects, alliances, factions, nominations, app_settings, feedback).
  - D-25 override signature fully verified: (a) override that returns `[]` fully replaces built-in output; (b) override receives `(fragment, ctx)` where fragment matches the D-08-merged shape and ctx exposes seeded faker + bootstrap projectId.
  - D-08 merge: `{ elections: { count: 5 } }` wins over generator's `defaults(ctx) = { count: 1 }`.
  - Post-topo sentinel enrichment asserted for all three families: `_constituencyGroups` (full-fanout across elections), `_constituencies` (full-fanout across constituency_groups), `_elections` (full-fanout across question_categories).
  - Topo-order refinement validated indirectly: `candidates[0].answersByExternalId` is populated with exactly `questions.length` entries, proving QuestionsGenerator ran before CandidatesGenerator.
  - **ISS-05 (plan-checker revision):** the `runPipeline({ nominations: { count: 2 } })` test asserts polymorphic candidate/election/constituency refs on every nomination row resolve to real entities in the output. This is the ONLY runtime proof that Phase 56 Success Criterion 5 wires correctly — the `{}` template emits zero nominations because `NominationsGenerator.defaults(ctx)` returns `{ count: 0 }`.

- **Writer env enforcement + call shape (D-15 + NF-01 + NF-02 + D-11 + Pitfall 5):**
  - Two dedicated env-missing constructor tests (one per required var); two further tests verify error messages contain both the env-var name AND a remediation hint (`supabase start` / `supabase status`).
  - NF-01 bulk-call order asserted: `['bulkImport', 'importAnswers', 'linkJoinTables']` — via mock instance's `callOrder` array.
  - D-11 routing: four separate tests assert `accounts`, `projects`, `feedback`, `app_settings` are stripped from the `bulk_import` payload.
  - Pitfall 5 (app_settings → `updateAppSettings`): asserts `bulk_import` payload lacks `app_settings` AND `updateAppSettings` was called with the exact settings blob (`{ key: 'value' }`).
  - Feedback-skip warning: asserts logger called with substring `'feedback writes skipped'` when feedback rows supplied, and NOT called with any feedback message when they aren't.
  - Extra: "10 bulk-import tables preserved" positive test confirms the writer doesn't over-strip — elections / constituency_groups / constituencies / organizations / alliances / factions / question_categories / questions / candidates / nominations all reach `bulk_import`.

- **Determinism (TMPL-08):**
  - `seed: 42` byte-identical across fresh `runPipeline` calls (JSON.stringify equality) — exercises every generator's faker reads through a single cross-cutting call.
  - `seed: 42` vs `seed: 99` produces non-equal output.
  - `{}` (no seed field, buildCtx falls back to `seed: 42`) is still deterministic across runs.

- **Template validation (TMPL-02 + TMPL-09):**
  - `validateTemplate({})` passes and returns `{}`.
  - TMPL-09 field-path errors for: nested field (`candidates.count` as string), top-level field (`seed` as string), and UUID-shape rejection (`projectId: 'not-a-uuid'`).
  - All 12 non-system public-table fragments accepted simultaneously (elections through feedback).
  - Arbitrary `fixed[]` row shapes (via `z.unknown` values) accepted.
  - Valid top-level fields (seed + externalIdPrefix + projectId) accepted.

- **D-22 pure I/O enforcement:** no `createClient`, no `@supabase/supabase-js`, no `.rpc()` in any of the 4 files (the strings appear only in docstring comments documenting the contract). Verified by grep.

- **NF-03 no-any enforcement:** only 4 `any` usages in writer.test.ts, all behind `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments gating the vi.mock internals. Zero `any` in the other 3 files.

## Decisions Made

- **ISS-05 GEN-08 end-to-end nomination integration test** placed in pipeline.test.ts rather than a separate file because the behavior it exercises (pipeline correctly threads nomination refs through the `{ nominations: { count: 2 } }` path) is fundamentally a pipeline-orchestration concern — NominationsGenerator's unit tests already cover the in-isolation behavior with pre-populated `ctx.refs`.
- **vi.mock over constructor injection** for writer tests: the writer's public API (`new Writer(opts?)`) is opaque to the SupabaseAdminClient dependency. Injecting it as a constructor arg would leak internal wiring; vi.mock scopes the mock to the test file and leaves the production API unchanged.
- **`JSON.stringify` equality for determinism** rather than `toEqual`: deep-equality tolerates minor shape drift (e.g., key-insertion order); stringification catches those too, and a diff on two strings is faster for a human to scan than a 14-entity deep-equal failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema projectId validator rejected documented TEST_PROJECT_ID default**
- **Found during:** Task 1 (template.test.ts — "accepts valid top-level fields" test).
- **Issue:** `TemplateSchema.projectId` used `z.string().uuid()`, but zod v4's `.uuid()` enforces RFC 4122 version-nibble compliance (only v1-v8 accepted, plus nil/max sentinels). The `TEST_PROJECT_ID` fixture used throughout the codebase — `00000000-0000-0000-0000-000000000001` — has `0` in the version position (bit 52-55) and is therefore NOT a valid v1-v8 UUID. `buildCtx({})` documents this exact value as the default projectId (see `packages/dev-seed/src/ctx.ts` line 79), and the same value lives in `SupabaseAdminClient.TEST_PROJECT_ID`. The schema thus contradicts the documented runtime default: any consumer that ran `validateTemplate({ projectId: TEST_PROJECT_ID })` would get a validation error for the default value used by dev-seed itself.
- **Fix:** Replaced `z.string().uuid()` with `z.string().regex(UUID_SHAPE, 'Invalid UUID')` where `UUID_SHAPE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/`. This matches what Postgres' `uuid` column accepts (no version-nibble constraint), so the DB contract is unchanged and the dev-seed TEST_PROJECT_ID is accepted.
- **Files modified:** `packages/dev-seed/src/template/schema.ts`
- **Commit:** 880a7d564 (`test(56-09): add pipeline, determinism, template cross-cutting tests`)
- **Downstream:** still surfaces TMPL-09 field-path error for genuinely malformed inputs (`'not-a-uuid'`), preserving the plan's required validation behavior.

**2. [Rule 3 - Blocking] Lint auto-reordered `import { Writer }` above `vi.mock`**
- **Found during:** Task 2 pre-commit hook (`eslint --fix` + `prettier --write` in lint-staged).
- **Issue:** The source-author convention is `vi.mock(...)` placed ABOVE `import { Writer }` (even though `vi.mock` is hoisted by vitest's transformer, source order helps human readers). The lint pipeline re-sorted imports alphabetically, placing `import { Writer }` above `vi.mock`.
- **Fix:** None needed — vitest hoists `vi.mock` at compile time regardless of source position, so all 129 tests still pass. Added an explanatory comment above the import noting the hoist behavior.
- **Files modified:** None (lint auto-fix already applied).
- **Commit:** 12ca00fd1 (`test(56-09): add writer env-enforcement and mocked-client tests`)

### Intentional Scope Additions

- **"10 bulk-import tables preserved" positive test in writer.test.ts** (not in the plan's acceptance criteria): added to catch a regression where D-11's strip pass might accidentally strip a legitimate table. Complements the four negative `not.toHaveProperty` assertions with a single positive payload-shape check.
- **"override map uses TOPO_ORDER table names" test in pipeline.test.ts**: not in the plan's primary assertion list but aligns with D-06 documentation — confirms mid-topo tables can still be overridden, not just the head/tail of the topo order.
- **"accepts a pre-populated ctx as optional third argument" test in pipeline.test.ts**: exercises the seldom-used third arg of `runPipeline(template, overrides, ctx?)` that lets callers inject a logger. Caught by using the clamp-count warning from NominationsGenerator as a verification signal.

## Verification

```
yarn workspace @openvaa/dev-seed test:unit        # 18 files / 129 tests / ~790ms
yarn workspace @openvaa/dev-seed typecheck        # exit 0
yarn workspace @openvaa/dev-seed lint             # exit 0
find packages/dev-seed/tests -name '*.test.ts' | wc -l   # 18 ✓
```

Plan-acceptance greps (from `<acceptance_criteria>`):
- pipeline.test.ts has `{} template` + `toBeGreaterThan(0)` + D-25 override captures + `toHaveLength(5)` for D-08 + all three sentinel keys + `answersByExternalId` + nomination `count: 2` + populated candidate/election/constituency refs
- writer.test.ts has `SUPABASE_URL.*missing` + `SUPABASE_SERVICE_ROLE_KEY.*missing` + bulk-call-order `toEqual(['bulkImport', 'importAnswers', 'linkJoinTables'])` + all four strip assertions + Pitfall 5 `updateAppSettings.toHaveBeenCalledWith` + `feedback writes skipped` + `vi.mock(` + `delete process.env.SUPABASE_URL` + `afterEach`
- determinism.test.ts has `runPipeline({ seed: 42 })` + `JSON.stringify.*toEqual` + `seed: 99` + `not.toEqual`
- template.test.ts has `validateTemplate({})` + `not.toThrow` + 3 field-path error cases (`template.candidates.count`, `template.seed`, `template.projectId`)

## Phase 56 Coverage After Plan 09

| Requirement | Tested by                                                |
| ----------- | -------------------------------------------------------- |
| GEN-01      | 14 per-generator tests (Plan 08)                         |
| GEN-02      | per-generator fixed[] pass-through assertions (Plan 08)  |
| GEN-03      | pipeline.test.ts D-25 override tests                     |
| GEN-04      | per-generator external_id prefix assertions (Plan 08)    |
| GEN-05      | seed.sql coverage (Plan 01)                              |
| GEN-07      | per-generator determinism + pipeline/determinism.test.ts |
| GEN-08      | NominationsGenerator.test.ts + pipeline.test.ts ISS-05   |
| TMPL-01     | template.test.ts (12-fragment acceptance)                |
| TMPL-02     | template.test.ts + pipeline.test.ts                      |
| TMPL-08     | determinism.test.ts                                      |
| TMPL-09     | template.test.ts (3 field-path scenarios)                |
| NF-01       | writer.test.ts bulk-call-order test                      |
| NF-02       | writer.test.ts env enforcement tests                     |
| NF-03       | grep + lint: zero-any enforcement                        |
| NF-05       | writer.test.ts (D-12 atomicity via call-order contract)  |
| DX-02       | full 18-file suite (<10s, 129 tests)                     |

Every P1 requirement from 56-VALIDATION.md now has an automated `<automated>` command in this plan or a prior one.

## Next Steps (Plan 10)

- Rewrite `tests/tests/utils/supabaseAdminClient.ts` as a thin subclass of the dev-seed base per D-03 / D-24.
- Run final verification: `yarn build && yarn test:unit && yarn test:e2e` (full stack).
- Sync downstream docs (README references, migration guides) per D-03 cross-repo sync hook.

## Self-Check: PASSED

All artifacts verified present:

- `packages/dev-seed/tests/pipeline.test.ts` — FOUND
- `packages/dev-seed/tests/writer.test.ts` — FOUND
- `packages/dev-seed/tests/determinism.test.ts` — FOUND
- `packages/dev-seed/tests/template.test.ts` — FOUND
- `packages/dev-seed/src/template/schema.ts` — FOUND (modified; UUID_SHAPE regex present)

Commits verified:

- 880a7d564 — FOUND (`test(56-09): add pipeline, determinism, template cross-cutting tests`)
- 12ca00fd1 — FOUND (`test(56-09): add writer env-enforcement and mocked-client tests`)

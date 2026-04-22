---
phase: 56-generator-foundations-plumbing
plan: 08
subsystem: testing
tags: [vitest, unit-tests, pure-io, generators, dev-seed, determinism, gen-08, d-22, d-27]

requires:
  - phase: 56-generator-foundations-plumbing
    provides: "14 generator classes (Plans 04–06) + ctx/types/emitter seam (Plan 03) to unit-test"
provides:
  - "14 per-generator unit test files at packages/dev-seed/tests/generators/*.test.ts (DX-02)"
  - "Shared `makeCtx` test factory at packages/dev-seed/tests/utils.ts for Plan 09's cross-cutting tests"
  - "Executable verification for GEN-04 external_id prefix across all 14 generators"
  - "Executable verification for D-27 answerEmitter seam (default + injected paths)"
  - "Executable verification for GEN-08 client-side ref validation (3 missing-ref cases)"
  - "Executable verification for RESEARCH §4.13 choices-per-type contract"
  - "Executable verification for RESEARCH §9 clean polymorphism (no redundant org ref, no entity_type)"
affects: [56-09-plan, 56-10-plan, 57-phase, 58-phase]

tech-stack:
  added: []  # vitest already in devDependencies from Plan 01
  patterns:
    - "Shared `makeCtx` test-context factory (overrides spread last; fresh Faker seeded to 42 per call)"
    - "Per-generator test file covers 5 canonical D-22 assertions (count / prefix-generated / prefix-fixed / fixed-passthrough / determinism) plus 1–6 generator-specific assertions"
    - "Ref-shape casts use `as unknown as { external_id: string }[]` (or narrower) — same boundary as the generator's own internal re-cast"
    - "vi.fn() / toHaveBeenCalled() for logger + answerEmitter spies; no mock libraries"

key-files:
  created:
    - "packages/dev-seed/tests/utils.ts — shared makeCtx factory"
    - "packages/dev-seed/tests/generators/AccountsGenerator.test.ts (4 tests)"
    - "packages/dev-seed/tests/generators/ProjectsGenerator.test.ts (4 tests)"
    - "packages/dev-seed/tests/generators/ElectionsGenerator.test.ts (7 tests)"
    - "packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts (7 tests)"
    - "packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts (6 tests)"
    - "packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts (7 tests)"
    - "packages/dev-seed/tests/generators/AlliancesGenerator.test.ts (6 tests)"
    - "packages/dev-seed/tests/generators/FactionsGenerator.test.ts (6 tests)"
    - "packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts (6 tests)"
    - "packages/dev-seed/tests/generators/QuestionsGenerator.test.ts (10 tests)"
    - "packages/dev-seed/tests/generators/CandidatesGenerator.test.ts (9 tests)"
    - "packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts (7 tests)"
    - "packages/dev-seed/tests/generators/FeedbackGenerator.test.ts (4 tests)"
    - "packages/dev-seed/tests/generators/NominationsGenerator.test.ts (13 tests)"
  modified: []

key-decisions:
  - "D-22 boundary enforced by import-shape alone: tests import only vitest, @faker-js/faker, @openvaa/supabase-types, and relative paths to src/ — no Supabase client, no .rpc()"
  - "Ref-populated scenarios use a local `populatedRefs()` / inline override rather than extending makeCtx with presets — keeps each test's ref shape visible at the call site"
  - "CandidatesGenerator tests cast questionRefs through `unknown` to match the generator's internal `refs.questions as unknown as Array<TablesInsert<'questions'>>` — the pipeline contract (Plan 07) is that refs.questions carries full rows, not ext_id stubs"
  - "Accounts/Projects pass-through tests assert `[]` return PLUS exactly-once logger call for non-empty fragment, AND no logger call for empty fragment — catches regressions in either direction"

patterns-established:
  - "Test structure: one describe block per generator; 5 canonical D-22 it() + N generator-specific it(); ~40–140 lines per file"
  - "makeCtx overrides: pattern `makeCtx({ refs: { ...base.refs, organizations: [...] } })` where `const base = makeCtx()` — spreads base refs then overrides one category; avoids rebuilding the 14-key refs literal"
  - "NominationsGenerator GEN-08 thrown-error assertions use `.toThrow(/regex/)` matching both 'ctx.refs is empty' phrase and the ref-category name — double-anchored so message drift gets caught"

requirements-completed: [DX-02, GEN-01, GEN-02, GEN-04, GEN-07, GEN-08]

duration: 8min
completed: 2026-04-22
---

# Phase 56 Plan 08: Per-Generator Unit Tests Summary

**14 per-generator vitest suites + shared `makeCtx` factory — 96 tests covering D-22 pure I/O, GEN-04 external_id prefix, GEN-08 ref validation, D-27 answerEmitter seam, and RESEARCH §4.13/§9 invariants.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-22T15:30:34Z
- **Completed:** 2026-04-22T15:38:35Z
- **Tasks:** 3 (all green on first commit; linter reformatted 2 files post-commit)
- **Files created:** 15 (14 test files + 1 shared utils.ts)
- **Test count:** 96 tests across 14 files; full suite runs in ~820ms

## Accomplishments

- 14 generator unit test files cover every non-system public table's generator (GEN-01)
- D-22 pure I/O boundary enforced: no Supabase / DB imports in tests (grep-verified)
- D-27 answer-emitter seam validated: default `defaultRandomValidEmit` path AND injected custom emitter both exercised (Phase 57 drop-in contract locked)
- GEN-08 client-side ref validation exercised for all 3 missing-ref cases (candidates / elections / constituencies) with message-regex assertions
- RESEARCH §4.13 choices contract: ordinal (LIKERT_5) / categorical (CATEGORICAL_3) / text / boolean branches all covered
- RESEARCH §9 clean polymorphism: NominationsGenerator test asserts no redundant `organization` on candidate-type rows, no `entity_type` emission
- AppSettingsGenerator count-clamp semantics (Pitfall 5 UNIQUE on project_id) verified
- Determinism: every generator's output asserted identical across two fresh seeded runs

## Task Commits

1. **Task 1: Shared utils + 8 foundation generator tests** — `327b0c964` (test)
2. **Task 2: 5 content generator tests** — `44cc7ad4d` (test)
3. **Task 3: NominationsGenerator test (GEN-08 + polymorphism)** — `ea5ab8f5a` (test)

## Per-Generator Test Count + Additions

| Generator | Tests | D-22 (a)–(e) | Additions |
|-----------|-------|--------------|-----------|
| AccountsGenerator | 4 | n/a (pass-through) | `[]` return; logger called once on non-empty; NO logger on empty |
| ProjectsGenerator | 4 | n/a (pass-through) | Same as Accounts |
| ElectionsGenerator | 7 | ✓ | `project_id` set; no `_constituencyGroups` sentinel |
| ConstituencyGroupsGenerator | 7 | ✓ | `project_id` set; no `_constituencies` sentinel |
| ConstituenciesGenerator | 6 | ✓ | Parent self-FK is backward-only (no cycles) |
| OrganizationsGenerator | 7 | ✓ | No `auth_user_id` emitted (Phase 56 no-auth scope) |
| AlliancesGenerator | 6 | ✓ | Default count = 0 |
| FactionsGenerator | 6 | ✓ | Default count = 0 |
| QuestionCategoriesGenerator | 6 | ✓ | `category_type: 'opinion'` default |
| QuestionsGenerator | 10 | ✓ | Choices: ordinal (≥2 string ids), categorical (≥2), text/boolean absent; category ref attach/omit |
| CandidatesGenerator | 9 | ✓ | Organization ref attach/omit; D-27 seam (default + injected); `answersByExternalId` attach/omit |
| AppSettingsGenerator | 7 | ✓ | Clamps count>1 to 1 with logger warning; default count=0 |
| FeedbackGenerator | 4 | partial (no external_id) | `[]` on count>0; fixed[] drops external_id; project_id defaulted |
| NominationsGenerator | 13 | ✓ | GEN-08 throws (3 cases); polymorphic candidate ref; no redundant organization; no entity_type; clamps to refs.candidates.length |

## D-22 Pure-I/O Boundary Verification

```bash
$ grep -rn "^import.*from '@supabase/supabase-js'\|createClient(" packages/dev-seed/tests/
# (no matches — the word `createClient` appears only inside a doc comment in utils.ts)
```

Only allowed test imports:
- `vitest` (runner + `vi` mock helpers)
- `@faker-js/faker` (Faker class for makeCtx)
- `@openvaa/supabase-types` (TablesInsert types — compile-time only)
- Relative paths into `../../src/generators/*` and `../utils`

No `createClient`, no `.rpc(`, no `@supabase/supabase-js`.

## Decisions Made

- **Shared `makeCtx` with spread-last overrides:** single factory, tests own scenario-specific overrides inline (`{ refs: { ...base.refs, organizations: [...] } }`) rather than a parameterized factory with preset scenarios. Keeps each test's ref shape locally visible.
- **Ref-shape cast via `unknown`:** CandidatesGenerator test casts `[SAMPLE_QUESTION] as unknown as Array<{ external_id: string }>` to mirror the generator's internal re-cast; documents the pipeline contract (Plan 07 fills refs.questions with full rows).
- **Regex message assertions on GEN-08 throws:** `.toThrow(/ctx\.refs is empty.*candidates/)` double-anchors to both the phrase and the ref category so message drift surfaces in CI.
- **Logger-spy assertions use `.toHaveBeenCalledTimes(1)` + message substring check:** catches both regression directions (missing warning AND spurious warning) without coupling to exact wording.

## Deviations from Plan

None — plan executed exactly as written. Linter reformatted 2 files post-commit (import order, line breaks); behavior identical.

## Issues Encountered

None. All 3 tasks landed green on first test run. Typecheck and lint clean throughout.

## User Setup Required

None — tests run fully in-memory, no env vars, no local Supabase.

## Next Phase Readiness

- **Plan 09 (cross-cutting tests):** can reuse `packages/dev-seed/tests/utils.ts` `makeCtx` helper. Plan 09 will add tests for pipeline (TOPO_ORDER, ref passing), writer (env-var enforcement, bulk_import call shape with mocked client), determinism at pipeline level, and template validator (Zod schema).
- **Plan 10 (final rewrite of tests/ admin client + verification):** Phase 56 generators' behavior is now executably locked by Plan 08's unit tests — Plan 10's rewrite of `tests/tests/utils/supabaseAdminClient.ts` to extend the dev-seed base class cannot accidentally regress GEN-04 / GEN-08 / D-27 semantics without a red CI signal.
- **Phase 57 (latent-factor emitter):** CandidatesGenerator D-27 seam test confirms the single-function-pointer contract holds. Phase 57 populates `ctx.answerEmitter = latentEmitter`; the same injected-emitter test shape will exercise the latent model without touching CandidatesGenerator.

## Self-Check

Verifying each claim in this summary.

- [x] `packages/dev-seed/tests/utils.ts` exists — verified
- [x] 14 test files under `packages/dev-seed/tests/generators/` — verified (`ls | wc -l` = 14)
- [x] Commit `327b0c964` (Task 1) — verified in `git log`
- [x] Commit `44cc7ad4d` (Task 2) — verified in `git log`
- [x] Commit `ea5ab8f5a` (Task 3) — verified in `git log`
- [x] `yarn workspace @openvaa/dev-seed test:unit` exits 0 with 96 tests — verified
- [x] `yarn workspace @openvaa/dev-seed typecheck` exits 0 — verified
- [x] `yarn workspace @openvaa/dev-seed lint` exits 0 — verified (and direct `npx eslint tests/` clean)
- [x] `yarn test:unit` (repo-wide) exits 0 — verified (18/18 tasks, 613 frontend tests + new 96 dev-seed tests)
- [x] No Supabase / DB imports in `packages/dev-seed/tests/` — verified via grep

## Self-Check: PASSED

---
*Phase: 56-generator-foundations-plumbing*
*Completed: 2026-04-22*

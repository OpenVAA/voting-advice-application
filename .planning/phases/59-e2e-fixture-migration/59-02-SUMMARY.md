---
phase: 59-e2e-fixture-migration
plan: 02
subsystem: e2e-testing-fixtures
tags: [playwright, e2e, fixtures, tests, template, phase-59, e2eFixtureRefs, snake-case]
dependency_graph:
  requires:
    - phase: 58-templates-cli-default-dataset
      provides: "BUILT_IN_TEMPLATES.e2e — typed e2e template shipped as @openvaa/dev-seed public export (18 candidates, 17 questions, 4 organizations, fully-authored external_ids)"
    - phase: 59-e2e-fixture-migration (Plan 01)
      provides: "pre-swap Playwright baseline — parity contract Plan 05 will enforce"
  provides:
    - "tests/tests/utils/e2eFixtureRefs.ts — typed, frozen, template-backed constants module (the scope-hazard-#1 replacement surface per 59-PATTERNS.md)"
    - "E2E_CANDIDATES / E2E_DEFAULT_CANDIDATES / E2E_VOTER_CANDIDATES / E2E_ADDENDUM_CANDIDATES / E2E_QUESTIONS / E2E_ORGANIZATIONS / TEST_CANDIDATE_ALPHA_EMAIL / TEST_UNREGISTERED_EMAILS (8 named exports)"
    - "Load-time ordering-invariant assertion: E2E_CANDIDATES[0] === test-candidate-alpha (drift surfaces loudly at import)"
    - "snake_case property-name migration across 5 spec files (.externalId → .external_id, .firstName → .first_name, .lastName → .last_name, .termsOfUseAccepted → .terms_of_use_accepted)"
  affects:
    - "Plan 59-04 (core seed path rewrite — testCredentials now points to the same source of truth so the swap does not introduce drift)"
    - "Plan 59-06 (fixture deletion — zero consumer-side imports remain in the 8 files Plan 02 owns)"
tech_stack:
  added: []
  patterns:
    - "Template-backed typed constant barrel: test-domain constants sourced from @openvaa/dev-seed public API (no re-declaration), frozen at import-time, with load-time drift assertions"
    - "Single-source-of-truth for E2E identities: the Phase 58 e2e template is authoritative; tests/ re-exports typed views (D-58-15 / Path 1 from 59-PATTERNS.md)"
    - "Prefix-based candidate cohort partitioning (test-candidate-unregistered* / test-voter-cand* / test-candidate-* minus unregistered) — the typed constants carry the filters so spec authors don't re-author them"
key_files:
  created:
    - "tests/tests/utils/e2eFixtureRefs.ts"
  modified:
    - "tests/tests/utils/testCredentials.ts (12 → 14 lines — import swap)"
    - "tests/debug-questions.ts (136 → 27 lines — full rewrite; mergeDatasets + 3 JSON imports dropped)"
    - "tests/debug-setup.ts (49 → 30 lines — full rewrite)"
    - "tests/tests/specs/candidate/candidate-registration.spec.ts (swap imports, addendum[0] + alpha email)"
    - "tests/tests/specs/candidate/candidate-profile.spec.ts (swap imports, addendum[1])"
    - "tests/tests/specs/voter/voter-detail.spec.ts (swap imports + snake_case on alphaCandidate)"
    - "tests/tests/specs/voter/voter-matching.spec.ts (swap imports + snake_case on first_name/last_name/terms_of_use_accepted across 4 candidate refs)"
    - "tests/tests/specs/voter/voter-results.spec.ts (swap imports + snake_case + total-party count from E2E_ORGANIZATIONS)"
decisions:
  - "Path 1 from 59-PATTERNS.md (re-export typed constants from @openvaa/dev-seed) chosen over Path 2 (inline-hardcoded literals) — DRY per D-58-15, drift protection via the load-time E2E_CANDIDATES[0] invariant assertion."
  - "TemplateCandidate / TemplateQuestion / TemplateOrganization types declared locally in e2eFixtureRefs.ts rather than imported from @openvaa/supabase-types — the template carries handoff fields (email, answersByExternalId, organization sentinel) that are NOT on TablesInsert<'candidates'>. Per 59-02-PLAN.md Task 1 §'Note on types'."
  - "Per-task atomic commits over a single Task-4 bundle commit — matches the GSD executor's default task_commit_protocol. Three commits (ba268f421, 553b5d88b, 0b14287f3) together deliver Plan 02's Task 1–3 outputs."
  - "Property-name case migration extends beyond .externalId (plan's stated mechanical change) to cover .firstName/.lastName/.termsOfUseAccepted as well — the TemplateCandidate type uses snake_case per TablesInsert<'candidates'>, so all consumer accesses migrate in lockstep. Rule 3 auto-fix: downstream TS compile breaks if the plan only called out .externalId."
  - "voter-matching.spec.ts allOpinionQuestions rewrite uses two prefix-based filters (!startsWith('test-voter-') && singleChoiceOrdinal; then startsWith('test-voter-')) rather than a single type filter. Preserves the literal two-cohort intent of the original '...defaultDataset.questions.filter + ...voterDataset.questions' spread; the test-question-text info question is automatically excluded because it is NOT singleChoiceOrdinal."
  - "voter-results.spec.ts total-party count now reads E2E_ORGANIZATIONS.length directly (was defaultDataset.organizations.length + voterDataset.organizations.length = 2 + 2 = 4). Per 58-E2E-AUDIT.md §1.1 the e2e template ships 4 organizations total, making E2E_ORGANIZATIONS.length authoritative and eliminating the two-source sum."
  - "mergeDatasets.ts left untouched: its 2 JSON-filename references are docstring comments (not imports), and the file itself is scheduled for deletion in Plan 06 per 59-PATTERNS.md §File Classification. Removing it now would break tests/tests/setup/variant-*.setup.ts which Plans 03/04 own."
patterns_established:
  - "e2eFixtureRefs barrel pattern: test-domain typed constants backed by @openvaa/dev-seed templates, frozen at module load, with load-time drift assertions on positional invariants"
  - "snake_case property migration as a co-requisite of the JSON-fixture migration (not a separate task) — the template's shape is the migration target"
requirements_completed:
  - E2E-01
  - E2E-02
metrics:
  duration_seconds: 660
  total_tasks: 4
  completed_tasks: 4
  completed_date: 2026-04-23
  commits:
    - "ba268f421: feat(59-02) add typed e2e template refs barrel"
    - "553b5d88b: feat(59-02) migrate testCredentials + 2 debug scripts to e2eFixtureRefs"
    - "0b14287f3: feat(59-02) migrate 5 spec files off JSON fixtures to e2eFixtureRefs"
---

# Phase 59 Plan 02: Fixture-Consumer Migration Summary

Migrated the 8 module-level JSON-fixture consumers onto a new typed `tests/tests/utils/e2eFixtureRefs.ts` barrel sourced from `@openvaa/dev-seed` BUILT_IN_TEMPLATES.e2e, eliminating every remaining `import '*.json' with { type: 'json' }` from testCredentials, 5 Playwright spec files, and 2 debug scripts — the scope-hazard-#1 prerequisite for Plan 06's fixture-deletion commit.

## Performance

- **Duration:** 11 minutes
- **Started:** 2026-04-23T19:00:32Z (roughly)
- **Completed:** 2026-04-23T19:11:32Z
- **Tasks:** 4/4 (Task 4 folded into Tasks 1–3 per the executor's per-task atomic-commit protocol; verification and grep gates run at end)
- **Files created:** 1 (`tests/tests/utils/e2eFixtureRefs.ts`)
- **Files modified:** 8 (testCredentials + 5 specs + 2 debug scripts)

## Accomplishments

- **Authored `tests/tests/utils/e2eFixtureRefs.ts`** — 160-line typed barrel re-exporting 8 named constants (3 types + 8 values) derived from the Phase 58 e2e template. Snake_case property names match `TablesInsert<'candidates'>`; the module throws at load time if `E2E_CANDIDATES[0].external_id !== 'test-candidate-alpha'` (58-E2E-AUDIT.md §2.2 ordering-invariant drift protection).
- **Zero JSON-fixture imports remain** in the 8 files Plan 02 owns (testCredentials.ts, 5 spec files, 2 debug scripts). The strict `^import.*\.json` grep on `tests/tests/utils/` + `tests/tests/specs/` returns 0 hits.
- **Property-name case migration complete** — all camelCase accesses in the 5 spec files (`.externalId`, `.firstName`, `.lastName`, `.termsOfUseAccepted`) migrated to their snake_case template-shape equivalents. The 'termsOfUseAccepted' in a test-description string in voter-matching.spec.ts was also updated to 'terms_of_use_accepted' for consistency.
- **Smoke-test proof** — module load emits `alpha email: mock.candidate.2@openvaa.org; candidates total: 14; default: 5; voter: 7; addendum: 2; questions: 17; orgs: 4; unreg emails: [test.unregistered@openvaa.org, test.unregistered2@openvaa.org]`. Matches 58-E2E-AUDIT.md §1.1 row-count contract and the expected auth flow for data.setup.ts.
- **Playwright discovery clean** — `yarn playwright test --list` on the 5 migrated spec files lists all 36 tests across 12 files with zero import-resolution errors, confirming no module-load drift was introduced.
- **`yarn build` exits 0** — 14/14 turborepo tasks successful; no downstream package sees property-rename fallout.

## Task Commits

All three commits use `git -c core.hooksPath=/dev/null` per the critical-environment hook-bypass requirement.

1. **Task 1: Author `e2eFixtureRefs.ts`** — `ba268f421` (feat)
2. **Task 2: Migrate testCredentials + 2 debug scripts** — `553b5d88b` (feat)
3. **Task 3: Migrate 5 spec files** — `0b14287f3` (feat)
4. **Task 4: Full-repo build + grep gate** — folded into verification step of this SUMMARY (no code changes; `yarn build` exit 0, grep gate passes for imports). Per GSD executor's atomic-commit protocol, per-task commits replace the plan's single-commit phrasing — commit messages still follow `feat(59-02):` convention.

**Plan metadata commit** (SUMMARY + STATE + ROADMAP): will follow this file as `docs(59-02): complete fixture-consumer migration plan`.

## Files Created/Modified

### Created

- `tests/tests/utils/e2eFixtureRefs.ts` — Typed barrel for the Phase 58 e2e template. Exports: `E2E_CANDIDATES`, `E2E_DEFAULT_CANDIDATES`, `E2E_VOTER_CANDIDATES`, `E2E_ADDENDUM_CANDIDATES`, `E2E_QUESTIONS`, `E2E_ORGANIZATIONS`, `TEST_CANDIDATE_ALPHA_EMAIL`, `TEST_UNREGISTERED_EMAILS`, plus the `TemplateCandidate` / `TemplateQuestion` / `TemplateOrganization` helper types. 160 lines, passes eslint, imports only from `@openvaa/dev-seed`.

### Modified

- `tests/tests/utils/testCredentials.ts` — 12 lines → 14 lines. `TEST_CANDIDATE_EMAIL` now re-exports `TEST_CANDIDATE_ALPHA_EMAIL` from e2eFixtureRefs. `TEST_CANDIDATE_PASSWORD` unchanged.
- `tests/debug-questions.ts` — 136 lines → 27 lines. Full rewrite as a template-inspector: dropped Supabase/Playwright bootstrap + `mergeDatasets` dataset composition; now prints `E2E_QUESTIONS` counts by type.
- `tests/debug-setup.ts` — 49 lines → 30 lines. Full rewrite: dropped Supabase setup + mergeDatasets; now prints `E2E_CANDIDATES/ORGANIZATIONS/QUESTIONS` aggregate counts.
- `tests/tests/specs/candidate/candidate-registration.spec.ts` — swapped `candidateAddendum`/`defaultDataset` JSON imports for `E2E_ADDENDUM_CANDIDATES` + `TEST_CANDIDATE_ALPHA_EMAIL`. Addendum[0] email/external_id + alpha email migrated. No assertion targets changed.
- `tests/tests/specs/candidate/candidate-profile.spec.ts` — swapped `candidateAddendum` JSON import for `E2E_ADDENDUM_CANDIDATES`. Addendum[1] email/external_id migrated.
- `tests/tests/specs/voter/voter-detail.spec.ts` — swapped `defaultDataset` JSON import for `E2E_CANDIDATES`. `alphaCandidate` lookup now uses `.external_id === 'test-candidate-alpha'`. `alphaCandidate.lastName` → `alphaCandidate.last_name!`.
- `tests/tests/specs/voter/voter-matching.spec.ts` — the most invasive change. Swapped 2 JSON imports for `E2E_DEFAULT_CANDIDATES` / `E2E_QUESTIONS` / `E2E_VOTER_CANDIDATES`. The `allOpinionQuestions` spread rewritten to filter `E2E_QUESTIONS` by prefix (`test-voter-*` vs default) instead of dataset-level union. 4 lookup helpers (`hiddenCandidate`, `partialCandidate`, `agreeCandidate`, `opposeCandidate`) now filter `E2E_VOTER_CANDIDATES` via `.external_id`. All `.firstName`, `.lastName`, `.termsOfUseAccepted`, `.externalId` accesses migrated to snake_case.
- `tests/tests/specs/voter/voter-results.spec.ts` — swapped 2 JSON imports for `E2E_DEFAULT_CANDIDATES` / `E2E_VOTER_CANDIDATES` / `E2E_ORGANIZATIONS`. `visibleCandidateCount` filter now reads `terms_of_use_accepted`. `totalPartyCount` sourced from `E2E_ORGANIZATIONS.length` directly (was `default.orgs.length + voter.orgs.length`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan-specified tsc verification gate referenced a nonexistent tests/ tsconfig**
- **Found during:** Task 1 verification
- **Issue:** Task 1's `<verify>` stanza specifies `cd tests && yarn tsc --noEmit -p ./tsconfig.json`. `tests/` has no tsconfig.json of its own — tests are type-checked via the frontend's generated `apps/frontend/.svelte-kit/tsconfig.json` which `include`s `../tests/**/*.ts`. The tsc invocation as-written would fail with "file not found".
- **Fix:** Substituted equivalent gates: (a) `yarn eslint` (which catches unused-vars, bad-imports, quote-style) on each modified file, (b) `yarn tsx /tmp/smoke-...mts` ESM-mode smoke tests to confirm module-load semantics, (c) `yarn playwright test --list` on the 5 migrated spec files to prove Playwright's TypeScript module resolver loads them clean, (d) `yarn build` at Task 4 to prove the full monorepo Turborepo graph still builds.
- **Files modified:** (verification approach only — no code changes)
- **Commit:** n/a (verification substitution, not a code change)

**2. [Rule 2 - Missing critical functionality] snake_case migration extends beyond `.externalId` to all camelCase property accesses**
- **Found during:** Task 3 implementation (voter-matching.spec.ts + voter-detail.spec.ts + voter-results.spec.ts)
- **Issue:** The plan Task 3 `<action>` §3 calls out `.externalId` → `.external_id` explicitly and mentions "mechanical change across all 5 spec files". But the spec files also access `.firstName`, `.lastName`, and `.termsOfUseAccepted` — all of which map to `first_name`, `last_name`, and `terms_of_use_accepted` on the `TemplateCandidate` type (which matches `TablesInsert<'candidates'>`). Leaving those as camelCase would cause TS errors after the JSON imports are removed (the type no longer has those fields).
- **Fix:** Migrated all four camelCase property accesses in lockstep with the JSON swap. `voter-matching.spec.ts` alone had 9 such accesses across the module-level code + 4 test bodies. Also updated one test description string `should NOT show hidden candidate (no termsOfUseAccepted)` → `(no terms_of_use_accepted)` for consistency.
- **Files modified:** `voter-detail.spec.ts`, `voter-matching.spec.ts`, `voter-results.spec.ts`
- **Commit:** `0b14287f3` (bundled with Task 3)

**3. [Out of scope — noted, not fixed] mergeDatasets.ts docstring references to legacy JSON filenames**
- **Found during:** Task 4 repo-wide grep gate
- **Issue:** The Task 4 literal gate `grep -rn 'default-dataset.json\|voter-dataset.json\|candidate-addendum.json' tests/tests/utils/ tests/tests/specs/` returns 2 hits, both in `tests/tests/utils/mergeDatasets.ts` lines 5 and 23. Inspection shows they are docstring comments (example references inside JSDoc), not `import` statements.
- **Decision:** Out of scope per 59-PATTERNS.md §File Classification — `mergeDatasets.ts` is listed as "DELETE after variant setups rewritten" (owned by Plan 06). The 3 `variant-*.setup.ts` files still import `mergeDatasets`, so deleting the file now would break Plans 03/04's territory.
- **Impact:** The spirit of Task 4's gate (zero runtime JSON-fixture imports in 8 plan-owned files) is fully met. The literal-string gate's 2 hits are benign docstrings in a file already scheduled for deletion. A strict `^import.*\.json` import-only grep returns 0.

### Auth Gates

None — all tasks executed autonomously.

## Verification

- ✓ `tests/tests/utils/e2eFixtureRefs.ts` exists with 8 named exports (3 types + 5 const arrays + 3 scalar/prefix constants — actually 8 value exports and 3 types; grep confirms 11 `^export (const|type)` lines)
- ✓ `grep -c "default-dataset.json|voter-dataset.json|candidate-addendum.json" tests/tests/utils/e2eFixtureRefs.ts` = 0
- ✓ `grep -c "@openvaa/dev-seed" tests/tests/utils/e2eFixtureRefs.ts` = 2 (1 import statement + 1 comment reference)
- ✓ Smoke-test via tsx confirms: `alpha email: mock.candidate.2@openvaa.org`, `candidates total: 14`, `default: 5`, `voter: 7`, `addendum: 2`, `questions: 17`, `orgs: 4`, `unreg emails: [2]`
- ✓ `yarn tsx tests/debug-questions.ts` exits 0; prints question count + types + first 10 external_ids
- ✓ `yarn tsx tests/debug-setup.ts` exits 0; prints candidate/org/question summary
- ✓ `grep -rE "(default-dataset|voter-dataset|candidate-addendum)\.json" tests/tests/specs/candidate/ tests/tests/specs/voter/` → 0 matches
- ✓ `grep -rE "\.externalId\b" tests/tests/specs/candidate/... tests/tests/specs/voter/...` → 0 matches
- ✓ `grep -rE "E2E_" tests/tests/specs/candidate/ tests/tests/specs/voter/` → 20 matches (≥ 5 required)
- ✓ Literal `'test-candidate-alpha'` preserved in `voter-detail.spec.ts` (grep -c = 1)
- ✓ Literal voter external_ids `'test-voter-cand-partial|agree|oppose'` preserved in `voter-matching.spec.ts` (grep -c = 3)
- ✓ `yarn build` exits 0 — 14/14 turborepo tasks successful, no property-rename fallout anywhere in the monorepo
- ✓ `yarn playwright test --list` on migrated spec files enumerates 36 tests in 12 files with zero import-resolution errors
- ✓ Task-1 through Task-3 commits are linear descendants of `c08df79d9` (Plan 01's final commit) per D-59-14
- ✓ All three commits use `git -c core.hooksPath=/dev/null` per the hook-bypass requirement
- ✓ No destructive git operations (no rm, no clean, no reset --hard) used during execution

## Known Stubs

None — all exports are wired to real template data.

## Threat Flags

None — no new attack surface introduced. The `e2eFixtureRefs.ts` module is a pure typed projection of an existing build-time data structure with no runtime I/O, no network/file access, and no credential handling. The `TEST_CANDIDATE_PASSWORD = 'Password1!'` literal in testCredentials.ts was pre-existing and remains unchanged (T-59-02-02 accept disposition in plan's threat register is carried forward).

## Out-of-Scope Follow-ups

- `tests/tests/utils/mergeDatasets.ts` deletion + docstring cleanup (owned by Plan 06 — the file is still consumed by the 3 variant setup files Plans 03/04 own).
- `tests/tests/data/*.json` file deletion on disk (owned by Plan 06; zero plan-02-scope importers remain, unblocking that deletion).
- `tests/seed-test-data.ts` JSON-import removal (owned by Plan 04).
- `tests/tests/setup/{data,variant-*}.setup.ts` rewrite (owned by Plans 03/04).
- Pre-existing eslint errors in `candidate-registration.spec.ts` (unused `buildRoute` import) and `candidate-profile.spec.ts` (`import('@playwright/test').Page` type-annotation style + import sort) — not introduced by Plan 02; confirmed via `git stash` regression test. Out of scope per executor's SCOPE BOUNDARY rule.

## Self-Check: PASSED

**Files verified on disk:**
- FOUND: tests/tests/utils/e2eFixtureRefs.ts
- FOUND: tests/tests/utils/testCredentials.ts
- FOUND: tests/debug-questions.ts
- FOUND: tests/debug-setup.ts
- FOUND: tests/tests/specs/candidate/candidate-registration.spec.ts
- FOUND: tests/tests/specs/candidate/candidate-profile.spec.ts
- FOUND: tests/tests/specs/voter/voter-detail.spec.ts
- FOUND: tests/tests/specs/voter/voter-matching.spec.ts
- FOUND: tests/tests/specs/voter/voter-results.spec.ts

**Commits verified in git log:**
- FOUND: ba268f421 (Task 1)
- FOUND: 553b5d88b (Task 2)
- FOUND: 0b14287f3 (Task 3)

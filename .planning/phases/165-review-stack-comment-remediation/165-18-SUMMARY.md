---
phase: 165-review-stack-comment-remediation
plan: 18
subsystem: dev-seed
tags: [dev-seed, is_generated, seed-templates, negative-controls, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, assert-absent.sh, ledger-check.sh); 165-14 edge-function env guard (wave dependency)"
provides:
  - "Every dev-seed generator, helper, override, template, test and fixture stops supplying is_generated; the schema drop in 165-27 needs no seed-data change"
  - "hygiene-reads/165-18.tsv read records for the 34 dev-seed files this plan changed"
affects: [165-27, 165-24, 165-36]

actuals:
  tokens: 40914
  tasks: 3
  commits: 6
plan_head_before: 40dcf255a2a49bfa66a505ddbd94680ea7bea510
plan_head_after: 3148317f188a8eab9a0ef2df87aa58b473cf6174

tech-stack:
  added: []
  patterns:
    - "Property removal through a count-asserting script (own-line `is_generated: <bool>,?` and inline `, is_generated: false }`), then prettier to drop the trailing commas the removal leaves"
    - "A labelled section divider followed by a description is separated by a blank line: the repo's rule 2 treats only pure rule lines as banners, so a divider line directly above a continuing comment line is a forced break"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-18.tsv
  modified:
    - packages/dev-seed/src/generators/AlliancesGenerator.ts
    - packages/dev-seed/src/generators/CandidatesGenerator.ts
    - packages/dev-seed/src/generators/ConstituenciesGenerator.ts
    - packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts
    - packages/dev-seed/src/generators/ElectionsGenerator.ts
    - packages/dev-seed/src/generators/FactionsGenerator.ts
    - packages/dev-seed/src/generators/OrganizationsGenerator.ts
    - packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts
    - packages/dev-seed/src/generators/QuestionsGenerator.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/templates/defaults/alliances-override.ts
    - packages/dev-seed/src/templates/defaults/candidates-override.ts
    - packages/dev-seed/src/templates/defaults/questions-override.ts
    - packages/dev-seed/src/templates/default.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts
    - packages/dev-seed/src/templates/e2e/perm/shared.ts
    - packages/dev-seed/tests/locales.test.ts
    - packages/dev-seed/tests/templates/default.test.ts
    - packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
    - packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts

key-decisions:
  - "Each removal lands in its own commit with the Review-Comment: C-4094555940 trailer, and each comment rewrite in a separate Hygiene: D-04 commit, so the removal diffs stay mechanical and reviewable"
  - "locales.test uses sort_order: 3 as its example of a non-localized column; default.test's 'Test 4' case was deleted and no other test was renumbered"
  - "The file-local PHASE_56_TYPE_ROTATION const in QuestionsGenerator is now TYPE_ROTATION. It carried a phase number in shipped source, and it is not exported"
  - "permittedKeys.ts is untouched: 10 is_generated entries, the same count as at ship/v2.15-12-planning. It changes with the column in 165-27"
  - "No hygiene-allow/165-18.tsv was created. Every gate hit was rewritten; none needed an exception"

patterns-established:
  - "Negative-control fixtures are re-proven after an edit by running them through validateTemplate + runPipeline + assertKnownRowProps in a throwaway tsx script, since two of the four are never imported by a test"

requirements-completed: [165-SC2, 165-SC3]

coverage:
  - id: D1
    description: "No dev-seed generator, template, helper, override, test or fixture supplies is_generated"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/assert-absent.sh 'is_generated' -- packages/dev-seed/src/generators packages/dev-seed/src/templates packages/dev-seed/tests (exit 0, absent)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit --exclude 'tests/integration/**' (60 files, 794 tests passed)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/dev-seed typecheck (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All four negative-control fixtures still trip the check they exist for"
    requirement: "165-SC2"
    verification:
      - kind: unit
        ref: "tests/assertKnownRowProps.test.ts#BOTH negative-control fixtures fire against the shipped guard, snake and camel alike"
        status: pass
      - kind: other
        ref: "scratch tsx: validateTemplate + runPipeline + assertKnownRowProps over each negctl-*.ts fixture (four throws, each naming the intended key)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every changed dev-seed file passes the per-changed-file hygiene gate with a current read record"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files <the 34 files> (exit 0, total failing items: 0, unread=0)"
        status: pass
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs (0 violations)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The seeded E2E data is exercised end to end by the full E2E run in plan 165-24"
    requirement: "165-SC2"
    verification:
      - kind: e2e
        ref: "plan 165-24 full-suite run (tests/scripts/e2e-run.sh)"
        status: unknown
    human_judgment: false

duration: 15min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 18: dev-seed is_generated removal Summary

**Every dev-seed producer (nine generators, `buildMinimal`, three default overrides, `default`, `e2e/base`, `e2e/perm/shared` and twelve perm templates) and every dev-seed test and fixture has stopped writing `is_generated`. That is 178 template occurrences plus 23 elsewhere. The column still exists and defaults to false, so seeding is valid today, and plan 165-27 can drop it without touching seed data. The comment layer of all 34 changed files is now hygiene-clean.**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-09-27T21:19:58Z
- **Completed:** 2026-09-27T21:34:36Z
- **Tasks:** 3 of 3
- **Files modified:** 34 shipped files, plus one new read record

## Accomplishments

- **The removal is behaviour-neutral.** The column defaults to false. Nothing in the product reads it for behaviour, and teardown keys on the `external_id` prefix (research row 19). The dev-seed suite is unchanged apart from two tests: 60 files and 794 tests pass after every commit.
- **Tests adjusted with no trace of the field.** `locales.test.ts` now shows that the localizer leaves `color` and `sort_order` alone. `default.test.ts` lost the case that asserted the flag on every candidate, and the header that counted "29 behaviors" no longer states a count.
- **`permittedKeys.ts` is untouched.** `grep -c is_generated` gives 10 at the tip and 10 at `ship/v2.15-12-planning`. Its `TABLE_COLUMNS` is checked against the generated types in both directions, so it changes in 165-27 together with the column.
- **Comment hygiene (D-04) on all 34 files.** The gate itself flagged 7 items: `TMPL-07`, the `162-07b` / `162-12` plan ids in FactionsGenerator, narrative in CandidatesGenerator, default.test and base.ts, and two forced line breaks. Reading the files found more that the gate does not catch:
  - the reflowed fragment "apply — see ElectionsGenerator.ts" in seven generators;
  - `162-07b` in CandidatesGenerator;
  - a quick-task id `(260525-tea)`, a spec-section number `9.6.5-8` and the threat id `T-121-AN`;
  - rename history (`(was: …)`, "formerly", "pre-port", "the retired idiom");
  - descriptions swallowed onto section dividers;
  - stale facts, listed below.

## Negative-control fixtures: what each still trips

I removed only `is_generated`, which was a permitted key, so no fixture's first offending key changed. I re-proved all four by running each through `validateTemplate` → `runPipeline` → `assertKnownRowProps` in a throwaway tsx script. The script is deleted and nothing was committed.

| Fixture | Check it trips (message head) | Also covered by |
|---|---|---|
| `negctl-elections-sentinel.ts` | `unknown property '_constituencies' on collection 'elections' (row external_id: 'negctl144-el-1'…)` | CLI only (`yarn db:seed --template <abs path>`) |
| `negctl-questions-answers.ts` | `unknown property 'answersByExternalId' on collection 'questions' (row external_id: 'negctl144-qu-1'…)` | CLI only |
| `negctl-questions-entity-type.ts` | `property 'entity_type' on collection 'questions' … is a real column, but the bulk_import RPC discards it via skip_columns` | `assertKnownRowProps.test.ts` "BOTH negative-control fixtures fire…" (passes) |
| `negctl-questions-entity-type-camel.ts` | `property 'entityType' on collection 'questions' … discards it via skip_columns` | the same test (passes) |

## Task Commits

1. **Task 1: ElectionsGenerator (tracer)** — `8c03a9ae7` (fix, `Review-Comment: C-4094555940`). This commit removes the property and repairs the reflowed header in one go. Tracer gate: interactive mode, end-of-phase, automated-only verify. I re-ran the verify commands (tests 7/7, typecheck, hygiene gate all exit 0) and continued.
2. **Task 2: eight generators, overrides, `buildMinimal`, tests, fixtures** — `34d5c9b43` (fix, `Review-Comment: C-4094555940`) and `5edb46636` (docs, `Hygiene: D-04`).
3. **Task 3: templates, then hygiene over everything** — `e9e7702b3` (fix, `Review-Comment: C-4094555940`), `4cdfafa5b` (docs, `Hygiene: D-04`) and `3148317f1` (chore, the read record).

The run-time `git grep -l is_generated -- packages/dev-seed/src/templates` returned exactly the files the plan listed: `default.ts`, `e2e/base.ts`, `e2e/perm/shared.ts` and twelve perm templates, plus `_helpers/buildMinimal.ts` and the three `defaults/` overrides, which were handled in Task 2. No file outside the plan's list was involved.

## Gate results (read directly, never through a pipe)

| Command | Exit |
|---|---|
| `bash scripts/assert-absent.sh 'is_generated' -- packages/dev-seed/src/generators packages/dev-seed/src/templates packages/dev-seed/tests` | 0 (`absent`) |
| `yarn workspace @openvaa/dev-seed test:unit --exclude 'tests/integration/**'` | 0 (60 files, 794 tests) |
| `yarn workspace @openvaa/dev-seed typecheck` | 0 |
| `eslint --flag v10_config_lookup_from_file src/` from `packages/dev-seed`, which is the package `lint` script run with the root binary | 0 (15 warnings, all pre-existing: unused `ctx` in `defaults()` and similar) |
| `node_modules/.bin/eslint <the 34 changed files>` | 0 (9 pre-existing unused-`ctx` warnings) |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <the 34 files>` | 0 (`total failing items: 0`, `unread=0`) |
| `node scripts/assert-comment-hygiene.mjs` | 0 (0 violations over 1719 files) |
| `bash scripts/tip-proofs.sh` | 0 (the C-4080520413 `election_type` proof still reads ElectionsGenerator and default.ts) |
| `bash scripts/ledger-check.sh` | 0 |
| `grep -c is_generated packages/dev-seed/src/template/permittedKeys.ts` | 10 (same as at the phase base) |

The seeded E2E data is exercised end to end by the full E2E run in plan 165-24. Under this plan's wave-safety rules, no E2E run, build or database command was run here.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale or false comment facts, corrected during the hygiene read**
- **Found during:** Tasks 2 and 3
- **Issue:** Several comments stated things that are not true at the tip:
  - `negctl-questions-entity-type.ts` said "nothing … imports it and no gate executes it", but `assertKnownRowProps.test.ts` imports it.
  - The camel fixture said it was imported "unlike the other three".
  - Three fixtures quoted `template/types.ts:23` wording that the file no longer contains.
  - `questions-override.ts` said "1/5 of the 24 questions → indices 0…20" for a 26-question plan.
  - `default.test.ts` described the question mix as "18 + 4 + 1 MC + 1 boolean".
  - `e2e/base.ts` named the renamed question `qu-opin-base-b-1` / `B-1` in the partial-answer arrangement.
  - `buildMinimal.ts` and `perm-localisation-positive.ts` pointed at a `buildElectionConstituencyNomsSingleOrg` helper that no longer exists.
- **Fix:** Each comment was rewritten to the tip's facts: `Opt-A-1`, 26 questions at indices 0-25, 18+5+1+1+1, and `buildSingleOrgNoms`.
- **Commits:** `5edb46636`, `4cdfafa5b`

**2. [Rule 2 - Hygiene] `PHASE_56_TYPE_ROTATION` renamed to `TYPE_ROTATION`**
- **Found during:** Task 2
- **Issue:** A phase number was embedded in a shipped identifier. The codemod does not flag identifiers.
- **Fix:** Renamed the file-local, unexported const. This is the only code-token change in the `Hygiene: D-04` commits. The other string edit is the describe title `'fanOutLocales (TMPL-07)'` → `'fanOutLocales'`.
- **Commit:** `5edb46636`

**3. [Rule 3 - Blocking] Splitting a swallowed divider directly tripped rule 2**
- **Found during:** Tasks 2 and 3
- **Issue:** Putting the description on the line under a labelled divider (`// --- Questions ---`) made the lint rule report a forced break. A labelled divider is not a pure rule line, so the rule does not treat it as a banner. Two list/table rewrites (`likert7 … / categorical …` in base.ts, `q-cat 1/2/3` in perm-question-video) tripped the same rule.
- **Fix:** A blank line now separates each labelled divider from its description. The table row uses a `key:` followed by aligned spaces, and the `q-cat` lines became `- ` list items.
- **Commits:** `5edb46636`, `4cdfafa5b`

**4. Task 1 combines removal and hygiene in one commit.** The later tasks split them. Task 1's hygiene edit was three header lines and one inline comment.

**5. `hygiene-allow/165-18.tsv` was not created.** It is listed in `files_modified`, but no gate hit needed an exception, so no row and no file were written. This matches 165-10.

**6. The negative-control fixtures describe themselves as "BYTE-FROZEN".** The plan required editing them. That rule concerns the two halves of a paired control run, and no such pair is in flight, so the edit is safe. The table above re-proves each fixture's check.

## Out-of-scope observations (not fixed)

- `node_modules/.bin/eslint packages/dev-seed` over the whole package, tests included, reports 36 errors (`func-style`, `simple-import-sort`, `import/first`) in 18 test files and one script that this plan did not touch. No gate covers that path: the package `lint` script lints `src/` only, and root `lint:check` lints `src/` per package plus the root `tests/`. So I did not add them to `deferred-items.md`.
- Several comments in the changed files cite `file:line` locations, such as `supabaseDataProvider.ts:391-405` and `ConstituenciesGenerator.ts:34-39`. The D-04 rules do not cover that form, so I left them.

## Known Stubs

None.

## Next Phase Readiness

- Plan 165-27 can drop the `is_generated` column from the schema and regenerate `packages/supabase-types`. It will need to remove the 10 `is_generated` entries in `permittedKeys.ts` together with the column, because `TABLE_COLUMNS` is checked against the generated types in both directions. The ledger row for C-4094555940 stays with 165-27.

## Self-Check: PASSED

- All 34 shipped files and `hygiene-reads/165-18.tsv` exist on disk.
- Commits `8c03a9ae7`, `34d5c9b43`, `5edb46636`, `e9e7702b3`, `4cdfafa5b` and `3148317f1` are reachable from HEAD; `git rev-list --count 40dcf255a..HEAD` = 6.

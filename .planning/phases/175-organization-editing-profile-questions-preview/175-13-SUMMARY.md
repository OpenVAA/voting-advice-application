---
phase: 175-organization-editing-profile-questions-preview
plan: 13
subsystem: docs, skills, todos, closing gate
tags: [docs, skills, todos, closing-gate, e2e, pgtap, determinism, a11y, organization, contestant-app]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plans 01 to 12, and the overflow fix between 12 and 13)
    provides: the tree this plan describes, closes and gates; the lists each summary carries of what its plan made false, deferred or left unverified
provides:
  - docs and skills that describe the nominations lock as an app setting, the frozen columns, the two validation triggers, what the import carries, the two settings keys, the colour kind and the required locale
  - the database skill's pgTAP counts as measured on a freshly reset database (41 files, 1888 assertions)
  - nine regenerated component pages
  - three todos closed with a Resolution, four annotated, thirteen filed
  - the phase's closing evidence on one tree — the fourteen-row gate set, the full run `175-13-final` and three isolated runs of the new spec
affects: [176, 177, 177.1, 179]

actuals:
  tokens: 26143 # chars/4 over the diff of dbf30f0e5..1c413c8fc outside .planning/ (104571 chars); 45135 with the todo files (180541 chars)
  tasks: 3
  commits: 7 # MEASURED: git rev-list --count dbf30f0e5..HEAD at the time this file was written
plan_head_before: dbf30f0e5d8ca8e09ac3296705cd94074202fcd4
plan_head_after: 7fde35f13a95f0dd0224cac518da68664ac12658

tech-stack:
  added: []
  patterns:
    - "A count a skill states is measured through the gate driver before the sentence is written, and the closing gate set confirms it, so no closing run goes stale on a count"
    - "A comment that stated a count of things that grow states the invariant instead"

key-files:
  created:
    - .planning/todos/pending/2026-10-09-175-*.md (thirteen files)
  modified:
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md
    - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
    - apps/docs/src/routes/(content)/developers-guide/backend/data-import-and-deletion/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/ (nine pages)
    - apps/supabase/README.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/components/SKILL.md
    - .claude/skills/data/object-model.md
    - scripts/assert-a11y-scan-wiring.mjs
    - tests/README.md
    - tests/tests/utils/contestantEntityUrl.ts
    - tests/tests/utils/axeScan.ts
    - tests/tests/fixtures/contestant/contestant-entity-selection.ts
    - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
    - tests/tests/fixtures/voter/organizationDetail.fixture.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts

key-decisions:
  - "The per-project baseline of the closing run is 175-12-overflow-close, not 175-12-close as the plan's text says: the overflow fix between plans 12 and 13 added two tests to one project"
  - "The pgTAP counts were measured through the gate driver's database rows before the skill was written, and confirmed by the closing gate set, so that the skill's commit did not make the closing gate stale"
  - "Three findings of the whole-phase checklist pass were fixed before the closing runs: the wiring gate's missing file, two duplicated test helpers, and comments that stated stale counts"
  - "The unquoted import key has a todo since 2026-08-23; it was annotated and no second one filed"
  - "Nothing was appended to .planning/WINDOWS.md, as plans 01 to 12 left it"

requirements-completed: [GEN-01, GEN-03]

duration: about 50 min
completed: 2026-10-09
status: complete
---

# Phase 175 Plan 13: The Close — Docs, Skills, Todos and the Closing Gate — Summary

**The docs and three skills describe the tree as it is, three todos are closed and thirteen filed, and on one tree — `4c930217c`, and `1c413c8fc` which differs from it under `.planning/` alone — the fourteen-row gate set is green on a database rebuilt from the schema (pgTAP `Files=41, Tests=1888`), the full default suite is 268 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 110 projects, and the organization-editing spec is green three times in isolation, each run on a database it reset itself.**

Everything below was measured in this session unless it says "read" or "not measured".

## Read this first

1. **One verify stage cannot pass as written, and was not edited.** Task 3's verify, and the plan's `<verification>` block, compare the closing run with `175-12-close`. The overflow fix made between plans 12 and 13 added two tests to `perm-organization-editing` (46 against 44), so that comparison exits 1 on that one project for any correct tree. The same command with `175-12-overflow-close` in its place exits 0. Both statuses are in the table below. The substitution is the orchestrator's instruction.
2. **The batch prunes its own valid runs.** `tests/scripts/determinism-batch.sh` deletes the HTML report directory of each run it judges valid, as its header says. That is the tool's own act inside its own ledger directory. I deleted nothing under `tests/e2e-runs/`.
3. **No void run and no red run** was made by this plan. Nothing was retried.
4. **Known limits of the phase**, stated plainly under *The five criteria* and filed as todos: the six locales beyond the three the dataset renders were not read; seven reads are left to a person; `hideIfMissingAnswers.organization` was not exercised in a browser; a candidate's profile with a multiple-text question is 8 px too wide at 320 px; the privacy statement a party reads is written for candidates.

## Performance

- **Duration:** about 50 min (22:38Z → 23:27Z)
- **Tasks:** 3 of 3
- **Files outside `.planning/`:** 31 changed, 364 lines added, 67 removed
- **Power:** AC, 100 %, at every launch and at the end of every gate and run

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `d11713b95` | `docs(175-13): the docs describe organization editing, the nominations lock as a setting and the validated columns` | 1 |
| 2 | `98d1474f6` | `docs(175-13): the database, components and data skills describe the tree as it is` | 1 |
| 3 | `a750eada7` | `test(175-13): the a11y wiring gate reads the closed-project spec` | 3, step 1b |
| 4 | `0b5498f20` | `refactor(175-13): one escape helper and one page-width measure in the E2E fixtures` | 3, step 1b |
| 5 | `4c930217c` | `chore(175-13): comments and one test title state no count of built-ins or of scanned surfaces` | 3, step 1b |
| 6 | `1c413c8fc` | `docs(todo): the todos Phase 175 closes and files` | 2 |
| 7 | `7fde35f13` | `docs(todo): the settings page was opened by no test as an organization's editor` | 2, after the batch |

Each was made by pathspec. No commit of another agent came between them. Task 3's own commit (`docs(175-13): the database skill states the measured pgTAP counts`) was not needed: see *The pgTAP counts*.

## Each task's verify command, with its real exit status

The three `<automated>` blocks were written to script files by a script that reads the plan file; each is byte-identical to its block. Evidence: `tests/e2e-runs/175-unit/175-13-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit |
|---|---|---|
| **Task 1, as written** | `98d1474f6` | **0** |
| **Task 2, as written** | `1c413c8fc` | **0** |
| **Task 3, as written** | `1c413c8fc` | **1** — stops at the comparison with `175-12-close` (point 1 above); every stage before it passed |
| **Task 3, with `175-12-overflow-close` in place of `175-12-close`** (one token changed, `175-13-t3-verify-substituted.sh`) | `1c413c8fc` | **0** |

## Task 1 — what the docs and the skills now say

### The populations, as derived

Each of the plan's six searches was run before the first edit:

| Population | Lines found | Outcome |
|---|---|---|
| the lock | 2, both in `.claude/skills/components/context-reactivity.md`, true | the lock was described nowhere else; it is now in two docs pages, the README and all three database skill files |
| the frozen columns | 8 | one docs sentence was incomplete (the authentication page); the skill lines were true and incomplete |
| the import and the type list | none said what the import skips or carries | the import page, the skill and the README say it |
| the settings | 6 | two docs pages lacked both keys; "currently only supported for candidates" was false |
| removed and moved message keys | 0 | nothing to correct |
| `Input` kinds and props | 2, both in the generated `Input` page | regenerated |

### Docs (`d11713b95`)

- **Developers' app-settings page:** rows for `entities.hideIfMissingAnswers.organization` (default `false`) and `access.nominationsLocked` (default `false`); a section on what each `hideIfMissingAnswers` key hides and who reads it; a section on the nominations lock — the database enforces it through three named policies, only the JSON boolean `true` locks, a missing row or key is unlocked and a missing project locked, whoever holds `project.edit_app_settings` sets it, project editors included, and the contestant context exposes it as `nominationsLocked`.
- **Publishers' app-settings page:** both `hideIfMissingAnswers` keys; `nominationsLocked` under `access`; `answersLocked` now says "candidates and parties".
- **Authentication page:** what confirmation freezes on each entity table, `entity.edit_immutable`, that the rules bind the `authenticated` role, and the colour check.
- **Data import page:** the keys the import leaves out, `entity_type` carried on the two question tables as an array, and both validations.
- **Invitation page (O-3):** a confirmed entity's name columns and `short_name` are read-only for its editor from the first sign-in.
- **Entity routes page:** a new section, *What an entity's pages show* — the profile by entity type, when a name is editable, the refused name, the colour stored as chosen and adjusted when read, the questions addressed to a type and the known zero, and the preview.
- **Contexts page:** `nominationsLocked` and `questionsReady` among the reactive accessors, and how a page reads the known zero through `opinionQuestionsStateOf`.
- **`apps/supabase/README.md`:** a section naming the three trigger rules, their pgTAP files and the lock's source.
- **`packages/dev-seed/README.md`:** read, and already true as plan 175-03 left it. Not changed.
- **`developers-guide/development/seed-data`:** read; names nothing the phase made false. Not changed.

### The generated pages, once

`yarn workspace @openvaa/docs generate:docs`, exit 0. Nine pages changed and were read: `Input`, `ImagePart`, `MultilingualTextPart`, `MultipleTextPart`, `SelectMultiplePart`, `ErrorMessage`, `LogoutButton`, `EntityDetails` and `ContestantNav`. The index's footer reads `Total: 105 components` and did not change. `ContactSupport` did not change. No component was added, removed, renamed or moved in the phase (`git diff --diff-filter=ADR` over the three component directories is empty for non-test files), and the counts the components skill states are still what the tree holds: 103 files calling `$props()`, 103 co-located type files, `concatClass` in 61 and 68 files.

`yarn workspace @openvaa/docs validate:links --check`: exit 0, 0 findings. The docs workspace's format check: exit 0.

### Skills (`98d1474f6`)

- **`database/SKILL.md`:** the description and three passages state the measured pgTAP counts; Schema Conventions § 1 states the validated shape of an entity's `color`, § 8 lists `enforce_entity_immutability` with the columns it protects on each table and the two validation triggers; RLS and Auth Patterns § 6 describes the lock, § 8 says why the name columns are in the grants; Service Patterns § 2 names the skipped keys and where `entity_type` is carried; a dated Freshness Record entry with the command behind each re-measured count.
- **`database/schema-reference.md`:** the frozen columns and the colour check under the entity tables; the filter list under the question tables; the one settings key the database reads (`access.nominationsLocked`); three trigger rows and four function rows.
- **`database/rls-policy-map.md`:** what "unless locked" is, which policies ask it and who writes it; the protected columns under the column grants; four rows in the table of where the assertions live.
- **`components/SKILL.md`:** how `Input` describes its controls, the `color` kind, `requiredLocale`, and the label that wraps.
- **`data/object-model.md`:** the entity type filter is stored and imported as an array.
- **`components/context-reactivity.md`:** already names both accessors (plan 175-08). Not changed.

### The pgTAP counts

The plan writes the counts after the closing gate and then makes the gate set again, because the skill's commit is outside `.planning/`. I measured them first instead, through the gate driver's own database rows (`175-gates.sh 175-13-premeasure --rows db-reset,types-regen,types-clean,pgtap`, head `d11713b95`, all four rows 0), wrote them in the skills commit, and let the closing gate set confirm them:

| | Pre-measure, `d11713b95` | Closing gate set, `4c930217c` |
|---|---|---|
| the run's own line | `Files=41, Tests=1888` | `Files=41, Tests=1888` |
| files (`git ls-files`) | 41 | 41 |
| files that declare a plan, and their sum | 40, 1879 | the same files |
| lines | 37,275 | the same files |

Read from the applied, freshly reset database for the same entry: 21 tables in `public` and 4 in `private`; 92 policies in `public` and 15 in `storage`; 4, 4 and 2 registrations of `enforce_entity_immutability`, `validate_entity_color` and `validate_entity_type_list`; no lock column on `projects`. **So Task 3's step 3 found nothing to correct, and no closing run was made twice.**

### The skill audit (PROH-175-35)

`bash .claude/scripts/audit-skill-links.sh database`:

| | Exit | Lines | Checked | Dangling | Skipped |
|---|---|---|---|---|---|
| before the first edit | **1** | 45 | 166 | 30 | 30 |
| on the closing tree | **1** | 45 | 176 | 30 | 30 |

It is not green and is not claimed green. The thirty dangling citations are the same thirty: `diff` of the two logs shows three changed lines, the two per-file totals and the footer. The ten citations this plan added all resolve. What it prints: 11 in `extension-patterns.md` (schema and test files cited by a package-relative path), 5 in `rls-policy-map.md` and 14 in `SKILL.md` (dotted names such as `feedback.read` and `organization.name` read as file names, and package-relative paths). The same audit for `components` exits 0. For `data` it exits 1 with 23 dangling, none in the file this plan edited (`object-model.md`: OK, 12 citations).

### `CLAUDE.md`

Read against the same six populations: **no sentence of it is false.** It names neither the lock nor the frozen columns nor either setting, and its count-free sentences on the backend and the skills still hold. Its Context Destructuring Rule lists six accessors "and some twenty more" and does not name `nominationsLocked` or `questionsReady`; that is operator decision B4, whose recommended option leaves the file as it is.

## Task 2 — the todos

All under `.planning/todos/`. Commits `1c413c8fc` and, for one item added to one of the new todos after the batch, `7fde35f13`.

**Closed, moved to `done/` with a Resolution:**

| File | Resolution in one line |
|---|---|
| `2026-10-08-175-input-ownership-invalid-mutation-on-the-contestant-profile.md` | option B, commits `26f8e73a7` and `548fc75b9`; the guard at zero for every kind; the closing run's dev-server log holds no `ownership_invalid_mutation` line and no `[svelte]` warning |
| `2026-03-28-generalize-candidate-app-to-party-app.md` | done across Phases 171, 173 and 175; the organization-editing spec is its evidence (D-03) |
| `2026-10-06-173-widened-page-params-annotation-in-contestant-context.md` | removed in `2c97f01b8` (plan 175-08); the string no longer occurs in the file |

**Annotated in place, staying pending:**

| File | What the update says |
|---|---|
| `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` | item 1 is not true of the tree: `mergeAppSettings` merges "member by member at every depth" since `05a10320c`; item 2, no Admin editor, stands and now covers the lock |
| `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md` | 16 cases, run by the gate's `integration` row; no CI job runs it |
| `2026-08-27-147-answers-locked-warning-unscanned.md` | scanned on an organization's profile in both themes; the other two routes and a candidate's view are not |
| `2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md` | still true at the phase's close, with one more carried key; accepted as T-175-17 |

**Filed** (each names its source, its files, its owner, what is measured and what is inferred, and options):

| File | Subject |
|---|---|
| `2026-10-09-175-native-speaker-review-organization-editing-strings.md` | 204 constructed strings in six locales, by key; Luxembourgish least certain (D-17) |
| `2026-10-09-175-a-project-editor-can-lock-and-unlock-nominations.md` | a consequence of the lock being a setting (OD08-B2 (a); O-8) |
| `2026-10-09-175-three-unconnected-default-locales.md` | the adapters' fallback, the i18n default and `projects.default_locale`; the name rule reads the i18n default |
| `2026-10-09-175-no-database-shape-check-for-entity-names.md` | `name` and `short_name` have no shape check; `_bulk_upsert_record` is one of their writers |
| `2026-10-09-175-seven-reads-the-ui-contract-leaves-to-a-person.md` | the seven backstop rows, each with what the suite holds of it today |
| `2026-10-09-175-privacy-statement-shown-to-a-party-is-written-for-candidates.md` | `dynamic.contestantAppPrivacy.registryStatement.content` (operator decision B2, as (a) describes) |
| `2026-10-09-175-election-colour-reaches-style-unparsed-and-the-colour-parser.md` | deferred items 1 to 3 (operator decision B3) |
| `2026-10-09-175-multiple-text-row-overflows-a-320px-profile-by-8px.md` | deferred item 4 (operator decision B6) |
| `2026-10-09-175-input-row-gives-its-label-less-than-its-width.md` | deferred items 5 and 6 |
| `2026-10-09-175-local-storage-volume-holds-gigabytes-no-row-accounts-for.md` | 9477 MB in the volume against 174 MB in `storage.objects`; what the files are is not established |
| `2026-10-09-175-states-held-by-component-cases-and-seen-in-no-browser.md` | eight behaviours, `hideIfMissingAnswers.organization` first |
| `2026-10-09-175-e2e-steps-that-work-around-a-missing-shared-step.md` | `resultsPage.openEntityDetailsForCard` and the hydration wait |
| `2026-10-09-175-small-rulings-and-repetitions-the-plans-left-open.md` | six small rulings, four repetitions, eight behaviours noted and left |

**Not filed, with the reason:**

- **The label that cannot wrap** (`inputLabelClass`): `2026-10-07-174.1-daisyui-label-nowrap-is-a-latent-overflow-in-other-label-users.md` already carries the finding, the fix and what remains, written by the overflow fix. Read again; nothing was left unsaid, so it was not edited.
- **The unquoted import key:** the existing todo of 2026-08-23 was annotated. The plan's verify asks that a todo added in this phase name `_bulk_upsert_record`; the name-shape todo does, because that function is one of the writers a name check would have to bind.
- **The bank-auth driver copy:** already filed (`2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md`); left.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` is unchanged (D-03).

## Task 3 — the closing gate

### One tree

| | Head | Tree outside `.planning/` |
|---|---|---|
| the gate set and the full run | `4c930217c` | the closing tree |
| the batch | `1c413c8fc` | equal to it: `1c413c8fc` adds the todo commit alone |
| the verdicts and the verify commands | `1c413c8fc` | the same; `7fde35f13`, made after them, changes one todo file |

No commit under `apps/`, `packages/`, `tests/`, `scripts/` or `.claude/` was made after the gate set started. `175-verdict.mjs scope` and `hygiene` exit 0 before the gate set and again after the batch.

### The code review checklist over the whole phase diff (step 1b, before any closing run)

`git diff c030a0d4f HEAD -- . ':(exclude).planning'`: 220 files, 14,465 lines added, 1,162 removed, in 84 commits. Each plan walked its own part; this pass read what falls between plans.

| Item | Outcome over the phase |
|---|---|
| Solves the issue | yes: the five criteria below, each with its evidence |
| OWASP top 10 | the stored-CSS path for an entity's colour is closed at the database and at every read; the name freeze is the database's and the page mirrors it; no `any` cast reaches a query. **Found beside it, not changed, filed:** an election's colour is painted unparsed |
| Code style guide | walked per plan; this pass found nothing between plans |
| No `any` | none added in the phase (searched the added lines). Three `@ts-expect-error` lines are dev-seed's type-layer controls; four `eslint-disable-next-line` lines are raw locators in fixtures, each with its reason |
| No repetition | **fixed in `0b5498f20`:** `escapeRegExp` was private in three test files and is the frontend's own now; the page-width measure was in two fixtures and the terms-of-use fixture calls the shared step. **Not fixed, filed:** the colour-adjusting expression in two places; the `matchMedia` stub; two "inside the viewport" measures that differ in what they hold |
| New entities documented | yes; the generated pages are current |
| Repo markdown | this plan's Task 1; `tests/README.md` for the wiring gate |
| Tracking events | the phase adds functions a user can reach (editing a name, a short name and a colour; the neutral page). **The Contestant App tracks none of its edits:** `git grep -n -e "startEvent" -e "track(" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contestant` finds `untrack(` and two test stubs and nothing else. Nothing was added, as nothing exists to follow |
| Svelte component guidelines | no component was added |
| Errors handled and logged | walked per plan; a refused name and a failed save each have their own sentence and outcome |
| Failing checks | none on the closing tree |
| Parts sharing a dependency | **fixed in `a750eada7`:** `perm-closed-project.spec.ts` scans through `assertAxeScan` and was in no list of the wiring gate's check 4a; it is now the fifth file, with a control (an `AxeBuilder` constructed in that spec makes the gate exit 1 and name the file; restored, exit 0; `175-13-wiring-control.log`) |
| WCAG A and AA, keyboard and screen reader | 18 scans of the new spec and 22 of `contestant-a11y-scan` at 0 violations. **1.4.10 still fails at 320 px on a candidate's profile that holds a multiple-text question**, by 8 px; filed |
| Docs guides | this plan's Task 1 |
| Comment hygiene | **fixed in `4c930217c`:** four passages of `permittedKeys.ts`, one test title and one comment of `assertKnownRowProps.builtins.test.ts`, and two comments of `axeScan.ts` stated counts that were no longer true (30 built-ins and 1,481 rows where the registry holds 32 and emits 1,520; 36 scanned surfaces). Each now states the invariant, which was measured for every built-in: `externalId` is a top-level key on 0 rows, `project_id` is on every row, and no `accounts` or `projects` row is emitted. `yarn assert:comment-hygiene` exit 0 before each commit |
| Commit history | linear |
| No fixes of itself | **finding, not fixed:** named per plan in the summaries of 02, 03, 05, 08 and 12; for the stack reconstruction, filed |
| Formatting in its own commit | none in this plan |
| `[db]` tag | every commit of the phase that touches `apps/supabase/supabase/schema` or `migrations` carries it (derived from `git rev-list`, none without) |
| § Supabase Backend | no table and no policy added in the phase; both new functions and the lock helper set `search_path = ''` (read from `pg_proc` on the applied database); trigger names follow `enforce_` and `validate_`; files 40 and 41 follow the transaction pattern |
| § Supabase Adapter | the writer maps its editable properties through `PROPERTY_MAP` |
| § Shipping a large branch, § Edge Functions | name nothing the phase touches |

### The gate set — `175-13-final`

`tests/e2e-runs/175-gates/175-13-final`, head `4c930217c`, driver exit 0, in the background. `175-verdict.mjs gates 175-13-final` (no `--rows`): **PASS** — "rows: 14 expected (the full gate set), 14 recorded", "not stale", "no Sleep entry inside the run window".

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 44 | `yarn lint:check`, every link |
| db-reset | 0 | 29 | the database rebuilt from the one migration and `seed.sql` |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | no diff in `packages/supabase-types/src/database.ts` |
| pgtap | 0 | 5 | **`Files=41, Tests=1888`**, `Result: PASS` |
| sql-lint | 0 | 3 | |
| integration | 0 | 3 | 16 of 16 against the reset stack |
| unit | 0 | 64 | frontend **182 files passed, 1 skipped; 3146 tests passed**, 16 skipped; dev-seed 1037; supabase 462; data 244; app-shared 148; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 9 | |
| build | 0 | 15 | |
| format | 0 | 18 | |
| docs-links | 0 | 1 | |
| name-gate-self-test | 0 | 0 | |

### The full run — `175-13-final`

`bash 175-e2e.sh 175-13-final --require-project perm-organization-editing`, `tests/e2e-runs/175-e2e/175-13-final`, head `4c930217c`, in the background, after the gate set had ended. Docker VM free before it: **19.84 GiB** (the driver's own reading). Driver exit 0, wrapper exit 0, Playwright exit 0, no void marker, `sleep_entries_in_window: 0`. Playwright 6.6 min.

**268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 110 projects.** `perm-organization-editing` 46 of 46; 18 of its tests have a title containing "axe accessibility scan", all passed. `contestant-a11y-scan` 22 of 22, `contestant-journey` 1 of 1, `voter-journey` 2 of 2. The dev server's log holds no `[svelte]` line.

| Verdict | Exit | Output |
|---|---|---|
| against **`175-12-overflow-close`** (268 in 110), with the three expected projects and `…axe accessibility scan=18` | **0** | "per project: 110 compared, 0 not as expected"; PASS. **Every project is equal to its total in that run** |
| against `175-12-close`, as the plan writes it | **1** | "per project: 110 compared, 1 not as expected"; `perm-organization-editing 46 … equal to 44 DOES NOT HOLD`. The other 109 hold |
| against the pre-phase baseline `tests/e2e-runs/261008-quick-g2-g4-g6`, with the three new projects excepted | **0** | "per project: 110 compared, 0 not as expected"; PASS. **Every project that existed before the phase is at its baseline total** |

Files: `tests/e2e-runs/175-e2e/175-13-final.verdict-overflow-close.txt`, `.verdict-12-close-as-written.txt`, `.verdict-baseline.txt`.

### The three isolated runs — `175-13-final`

`tests/scripts/determinism-batch.sh --runs 3 --project perm-organization-editing --ledger-dir tests/e2e-runs/175-determinism/175-13-final`, in the background, alone, after the full run had ended and with nothing on the dev-server port. Docker VM free before it: **19.79 GiB** (20,756,372 KiB, read with `docker run --rm alpine df -k /`); after it: **19.81 GiB (20,774,132 KiB)**. Pinned head `1c413c8fc`. Batch exit **0**.

| Run | Start → end (UTC) | Wall clock | Head | Wrapper exit | Total | Passed | Failed | Flaky | Skipped | Did not run | `perm-organization-editing` | Void |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 23:04:40 → 23:11:03 | 383 s (suite 346 s) | `1c413c8fc` | 0 | 194 | 194 | 0 | 0 | 0 | 0 | 46 of 46 | no |
| 02 | 23:11:03 → 23:17:25 | 382 s (suite 345 s) | `1c413c8fc` | 0 | 194 | 194 | 0 | 0 | 0 | 0 | 46 of 46 | no |
| 03 | 23:17:25 → 23:23:45 | 380 s (suite 343 s) | `1c413c8fc` | 0 | 194 | 194 | 0 | 0 | 0 | 0 | 46 of 46 | no |

Each run reset the database itself and ran the project with what it depends on: 194 tests. The batch judged every run VALID; its abort list is empty. The 18 scans are among the 46 in every run.

`175-verdict.mjs determinism <dir> --project perm-organization-editing --runs 3`: exit **0**. The same asked for four runs: exit **1 ("the ledger holds 3 run directories, not 4")**, as it must be (ruling 10).

The ledger's own header calls the batch a scoped self-test that satisfies no sixteen-run threshold; that is the tool's stamp on any scoped batch of fewer than sixteen runs, and D-22 asks for three.

**`yarn db:seed:default` after the batch: exit 0.** `175-verdict.mjs scope`: exit 0, PASS. `hygiene`: exit 0, PASS, 0 hits.

### Every database reset, with its guard

| # | By | When (local) | In-flight check |
|---|---|---|---|
| 1 | the gate driver's `db-reset` row, `175-13-premeasure` | 01:43 | the driver's own; no run in flight |
| 2 | the gate driver's `db-reset` row, `175-13-final` | 01:51 | the driver's own; no run in flight |
| 3 to 5 | the batch's three runs, each through the wrapper | 02:04, 02:11, 02:17 | the full run had ended; nothing on the port; nothing else used the database |

Docker and the Supabase stack were never restarted. `docker builder prune -af` ran once, inside the E2E driver.

## The five criteria, each with what shows it and what does not

All on the closing tree. Test titles are those of `perm-organization-editing.spec.ts` in the full run `175-13-final` and in each batch run.

| # | Criterion | What shows it | What does not |
|---|---|---|---|
| 1 | An organization user signs in, lands on the organization's pages, edits and saves its profile; the saved values are what a reload shows and what the voter app displays | `dataset: the confirmed organization's editor lands on that organization's home` and its sibling for the unconfirmed one; `profile: an unconfirmed organization fills in its required name, a short name and a logo, and the menu names it by the saved name`; `profile: a confirmed organization sets a colour and saves it…`; `voter: the saved name and short name of organization B are shown after a reload, in its preview and, once it is confirmed, to a voter`; `voter: the saved colour and answers of organization A are what a voter sees`; `voter: the saved logo of organization B is the image a voter sees`; the writer's 16 integration cases | the voter side is read in `en`; the six locales beyond `en`, `fi` and `sv` were opened by nobody |
| 2 | The organization user answers the questions addressed to organizations, with the editing, saving and progress behaviour a candidate has | `holds: a confirmed organization answers the opinion question it has left and an info question, and is not asked a candidate's question` (answer, comment, progress, the list); `questions: a candidate with no opinion question to answer is offered no questions entry, and the questions URL says so`; pgTAP file 40 for the type list; the context's unit cases for the question scope | where the save of the last unanswered question leads is asserted as the list, which is what the page does and not what its comment says; Phase 176 rebuilds it |
| 3 | The preview shows the organization as voters will see it, presented as an organization | `preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone`; `holds: the candidate's preview shows its card and no tag line`; scan entry `org-preview` with `#ffe600` stored, both themes; `phone: the preview of an organization with a long name…` | the loading and not-found views are component cases; a long short name in the tag line was not looked at |
| 4 | Name and short name are multilingual fields, editable while the organization is unconfirmed and answers are not locked, read-only once confirmed whatever the nominations lock says; the same for a candidate's names; the database freezes `short_name` with the name on all four tables and `entity.edit_immutable` lets an admin correct either | `profile: a confirmed organization reads its name and short name in every seeded locale, locked`; the unconfirmed organization's `profile:` test; `profile: a name edited before a confirmation is refused by name`; scan entry `org-profile-answers-locked` (the locked-by-answers state); `profile: an unconfirmed candidate changes its first and last name and saves them…`; `19-entity-immutability.test.sql`, plan (90): each protected column on each of the four tables, both directions, and the admin's correction; `nameRule.test.ts` | **"whatever the nominations lock says" is shown by construction and by unit cases, not in a browser:** `nameState` takes the entity and the answers lock and no other input, and no test turns `access.nominationsLocked` on beside a profile. A confirmed **candidate's** locked names are held by component cases and by the base candidate's journey, not by a test of this spec. An organization created through the identity provider does not exist yet (Phase 179); `39-invitations.test.sql` holds that seeding confirms a named entity |
| 5 | The candidate journey is unchanged and the full suite, with the organization-editing coverage added, is green at close | the full run above: 268 / 0 / 0 / 0 / 0; `contestant-journey` 1 of 1 and every pre-phase project at its baseline total; the three isolated runs | "unchanged" is by the suite: `contestant-journey` asserts "Support" where it asserted "Candidate Support" (UI contract U-17, plan 175-04), and a label inside an `Input` row may now take two lines at 320 px (operator decision B5) |

**GEN-01** (profile, questions, preview) is carried by plans 01, 04 to 12 and shown by criteria 1 to 3. **GEN-03** (the name rule) is carried by plans 02, 04, 07, 08, 09 and 12 and shown by criterion 4. **E2E-03** for this phase is criterion 5. `requirements-completed` names GEN-01 and GEN-03 on that evidence, with the limits in the right-hand column: none of them is a behaviour a criterion names that failed; each is a state shown below the browser, or not shown at all, and each is in a filed todo.

**Known limits, in one place:**

- The six locales beyond the three the dataset renders were not read; no native speaker read any of the 204 constructed strings.
- Seven reads are left to a person by the UI contract; none was made.
- `entities.hideIfMissingAnswers.organization` — the phase's one change to voter-side behaviour — is held by unit cases and was not exercised in a browser.
- A candidate's profile on the base dataset is 8 px wider than the viewport at 320 px (the multiple-text row); not fixed.
- The registry and privacy statement an organization's user reads is written for candidates; not changed.

## Phase 173's human-verification item (O-5)

`173-VERIFICATION.md`'s one open item — "Open an organization editor's profile, questions, preview and settings pages in a browser, and save an answer through the UI" — **is discharged by this phase's E2E evidence**, on the closing tree, by these tests of `perm-organization-editing`:

- `holds: a confirmed organization answers the opinion question it has left and an info question, and is not asked a candidate's question` — the questions pages opened and an answer saved through the UI;
- `voter: the saved colour and answers of organization A are what a voter sees` — the answer read back, on the voter side;
- `preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone` — the preview;
- the four organization `profile:` tests — the profile.

**One page of the item is not opened by them: the settings page.** An organization editor's settings page is reached by no test of this spec; `contestant-a11y-scan` scans the settings route as a candidate's editor. The item is discharged for the profile, the questions, the preview and the saved answer, and not for the settings page as an organization's editor.

## The UI contract's items

The proposals U-01 to U-30 stand at their recommended option and are built as recommended (operator decision B1, unticked when this was written). Four are isolated so that each can be swapped out, and none was exercised in its fallback:

| Item | Built | Where its fallback lives |
|---|---|---|
| **U-05** — a candidate's first and last name required while editable | yes | two literals, `required: 'always'` on `firstName` and `lastName` in `ENTITY_DESCRIPTORS.candidate.identityFields` (`entityDescriptor.ts`), each `'never'` under the fallback; `CANDIDATE_FIELDS` in `entityDescriptor.test.ts`; two cases of the profile page's test |
| **U-12** — a refused name does not cost the other edits | yes | the store sends the names in a statement of their own (`contestantUserDataState.svelte.ts`): one line and five store cases; the fourteen `contestantApp.error.nameLocked.*` strings lose "your other changes were saved" |
| **U-19** — the voter app hides an organization with missing answers when its key is on | yes, shipped `false` | `hideIfMissingAnswersKey: 'organization'` in `ENTITY_DESCRIPTORS.organization` is removed (the member is optional); the organization arm of `nominationAndQuestionState.svelte.ts` and the settings key are two commits of plan 175-08 |
| **U-30** — an unconfirmed candidate as the dataset's third identity | yes | one block each in the template, the data module, the setup, the teardown and the spec: the table `UNCONFIRMED_CANDIDATE_SCANS` with its describe, the candidate's describes and its phone tests. The scan count would then be 14 and every `=18` of this plan's verdicts `=14` |

## For Phase 176

**The closing run.** Label `175-13-final`; `node $P/175-verdict.mjs dir e2e 175-13-final` prints `tests/e2e-runs/175-e2e/175-13-final/`. Head `4c930217c`. 268 tests in 110 projects, all passed. Per-project totals (`summary.json`, `byProject`): 81 projects hold one test each — 30 `data-setup-*`, 31 `data-teardown-*` and 20 others — and the 29 that hold more are:

`a11y-smoke` 16 · `auth-service-contract` 2 · `auth-setup` 2 · `cold-entry-dataroot` 3 · `contestant-a11y-scan` 22 · `contestant-entity-selection` 8 · `contestant-terms-gate-phone` 2 · `data-setup-entity-selection` 3 · `invitation-contract` 15 · `invitation-landing` 3 · `perm-2e-shared` 2 · `perm-access-disable` 3 · `perm-answers-locked` 3 · `perm-closed-project` 11 · `perm-disable-allow-open` 3 · `perm-disjoint-1co` 2 · `perm-interactive-info` 4 · `perm-localisation-positive` 2 · `perm-not-located-2e2cg` 5 · `perm-org-matching` 3 · `perm-organization-editing` 46 · `perm-per-app-notifications` 2 · `perm-question-video` 4 · `perm-show-feedback-survey` 6 · `perm-startfromcg` 2 · `storage-cleanup` 3 · `voter-journey` 2 · `voter-prefs-tracking` 3 · `voter-results-redraw` 5

**The closing gate run.** Label `175-13-final` under `tests/e2e-runs/175-gates/`, head `4c930217c`, fourteen rows at 0.

**Counts.** pgTAP: 41 files, `Tests=1888`, 40 plans summing to 1879. Unit: frontend 182 files and 3146 tests passed (1 file and 16 tests skipped); dev-seed 1037; supabase 462; data 244; app-shared 148; the harness's own 102 in 7 files. The writer's integration file: 16.

**Names a later phase reads**, each checked in the tree at the close:

| Name | Where | Note |
|---|---|---|
| `ctx.nominationsLocked` | the contestant context | a reactive accessor over `access.nominationsLocked`: read it on the context, never destructure. The database locks on the JSON boolean `true` alone |
| `ctx.questionsReady` | the contestant context | false until the question lists were rolled up for a loaded entity with a selected election. **It stays false for an entity with no selected election**, one with no nomination included: decide "no nomination" from the entity's own nominations before it is consulted |
| `opinionQuestionsStateOf({ questionsReady, questionCount })` | `$lib/contestant/utils/opinionQuestionsState` | `loading`, `none` or `some`; four callers: the questions layout, `ContestantNav`, the home page, the profile page |
| `isHiddenIfMissingAnswers({ entityType, appSettings })` | `$lib/contestant/utils/hideIfMissingAnswers` | reads the key the type's descriptor names |
| `entityDescriptorOf(type)`, `ENTITY_DESCRIPTORS` | `$lib/contestant/utils/entityDescriptor` | members: `identityFields` (each `property`, `inputType`, `label`, `required`, `testId`, `autocomplete?`, `info?`), `identityTitle`, `nameSentence`, `lockedInfoPlaceholder`, `imageLabel`, `imageInfo?`, `colorField`, `nameRefusedMessage`, `instructions`, `instructionsNoQuestions`, `homeNotDone`, `homeNotDoneNoQuestions`, `greetingName`, `nominationsDescription`, `electionSymbolLabel`, `hideIfMissingAnswersKey?`, `previewTip`, `previewExcludeTabs`, `previewTagLine`. The candidate's is returned while the type is not known |
| `nameState`, `isNameEditable`, `isRequiredNameMissing`, `requiredNameLocale` | `$lib/contestant/utils/nameRule` | one rule for every name field of both types |
| `tests/tests/utils/contestantAxeScan.ts` | | `ContestantAxeRoute`, `assertContestantReach`, `toScanEntry`, `assertDarkThemeIfDark`, `declareScans`. A new spec that declares scans through it is added to check 4a of `scripts/assert-a11y-scan-wiring.mjs`, which reads five files now |
| `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | | `createPageGeometry(page)`: `expectNoHorizontalOverflow`, `expectWithinViewportWidth`, `expectShowsWholeText`, `expectInside`, `expectNoOverlap`, `expectAtLeast`; `MIN_TARGET_SIZE`. The terms-of-use fixture's page-width step calls it since this plan |
| `contestant-profile-identity` | the profile's identity section | `data-entity-type` (`candidate`, `organization`, absent while unknown) and `data-name-state` (`editable`, `locked-confirmed`, `locked-answers`); the alert region `profile-save-message` carries `data-outcome` (`failed`, `name-refused`) |
| the state steps | `tests/tests/fixtures/contestant/perm-organization-editing.ts` | `setOrganizationState(externalId, state)`, `setCandidateState(externalId, state)`, `setAnswersLocked(on)`, `organizationEditingPagesOf(page)`, `groupTitleNaming(name)`, and the composed `test` |
| the dataset's external ids | `tests/tests/utils/permOrganizationEditingData.ts` | prefix `e2e-perm-organization-editing-`; `CONFIRMED_ORGANIZATION_EXTERNAL_ID` (`…or-confirmed`), `UNCONFIRMED_ORGANIZATION_EXTERNAL_ID` (`…or-unconfirmed`), `UNCONFIRMED_CANDIDATE_EXTERNAL_ID` (`…ca-unconfirmed`), `OPINION_QUESTION_EXTERNAL_IDS` (three), `ORGANIZATION_INFO_QUESTION_EXTERNAL_ID` (`…qu-info-org`), `ORGANIZATION_LOCKED_INFO_QUESTION_EXTERNAL_ID` (`…qu-info-org-locked`), `CANDIDATE_INFO_QUESTION_EXTERNAL_ID` (`…qu-info-cand`); for each identity a grant, an editor email and a storage state |

**What Phase 176 meets by name:**

- `contestantProfilePage.open()` waits on a nomination listed in the profile's nominations block. When that block changes, the wait breaks by name.
- `saveAndExpect('list')` in the test of organization A pins today's routing after the last answer.
- The questions layout's required-info redirect, the home's `computeNextAction` and the menu's item list are described, with what to delete, in `175-10-SUMMARY.md` § For Phase 176.
- `contestantApp.basicInfo.requiredInfo` still names the old gate.
- The profile's nominations block is a group of the same component as the locked info questions: a long election or constituency label there wraps, and one long word does not.

**Phase 177** reads `ctx.nominationsLocked` for NOM-06; a self-registered organization is absent from the parent list until it is confirmed. **Phase 179** imports `updateEntityProperties` (a property outside the entity type's entry rejects by name), the multilingual name inputs with `requiredLocale` and `required` beside it, `missingRequiredLocale`, `normalizeLocalizedName`, `sameLocalizedName`, `isBlankText`, `isNameEditable`, `isRequiredNameMissing`, `requiredNameLocale`, the `autocomplete` prop of `Input`, and the neutral labels `common.name` and `common.shortName`; the vocabulary for its CI1 sentence is "party". **Every later E2E dataset** states `entity_type` on the two question tables as an array.

## What the orchestrator should write

Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited by this plan.

- **`REQUIREMENTS.md`:** GEN-01 and GEN-03 ticked and their traceability rows "Complete", if the verifier accepts the per-criterion table above with its right-hand column. E2E-03 holds for Phase 175.
- **`ROADMAP.md`:** Phase 175 at 13 of 13 plans; `175-13-PLAN.md` ticked.
- **`STATE.md`:** the phase closed; the closing evidence is `175-13-final` under `175-gates`, `175-e2e` and `175-determinism`; the per-project baseline for Phase 176 is the closing run.
- **`CLAUDE.md`:** no sentence is false. If decision B4 is ticked (b), the Context Destructuring Rule would name `nominationsLocked` and `questionsReady`.
- **The operator decisions document:** B2, B3 and B6 are each filed as their option (a) describes; nothing was acted on.

## Deviations from Plan

**1. The baseline of the closing comparison is `175-12-overflow-close`.** The orchestrator's instruction. Task 3's verify exits 1 as written and 0 with the one label substituted; no check was edited.

**2. The pgTAP counts were written before the closing gate and confirmed by it** (above). The plan writes them after and makes the gate set twice. One reset more was made for it, by the gate driver, and one full gate set fewer.

**3. Three commits under `scripts/`, `tests/` and `packages/` that the plan's file list does not hold** (`a750eada7`, `0b5498f20`, `4c930217c`). They are findings of the checklist pass of step 1b, which the plan orders fixed before the gate set, and the orchestrator named each of them for this plan. All three are before every closing run.

**4. [Rule 1] `SKIP_COLUMNS_NOT_DENIED.project_id` is a reason string, not a comment**, and it stated the same stale figures; it was reworded with the comments. Nothing reads its text (searched).

**5. The Contestant App section went into the entity routes page**, not into a page of its own: the docs' navigation is generated from the route tree, and that page's title already names the entity routes.

**6. `apps/docs/.../seed-data/+page.md` and `packages/dev-seed/README.md` were not changed**, although the plan lists them: both were read and neither states anything false.

**7. Thirteen todos were filed where the plan names seven**, because twelve summaries, the overflow fix and the deferred items listed more than the plan, written before any of them, could know.

**8. The unquoted import key and the label that cannot wrap were not filed anew** (above).

**9. The widened-annotation todo was closed**, as the plan allows when plan 175-08 removed the annotation, which it did.

**10. Nothing was appended to `.planning/WINDOWS.md`.** Plans 01 to 12 left that shared ledger alone and the orchestrator named no write to it. What would go there, each already in a summary or a todo: the three verify chains of the phase that do not exit 0 as written (plans 04, 05 and 10) and this plan's Task 3; the seven backstop reads; the five known limits above.

## Not done, or not verified

- **Task 3's verify does not exit 0 as written** (deviation 1).
- **No person read anything.** The seven backstops, the six unread locales and the native-speaker review are todos.
- **The settings page was not opened as an organization's editor** (Phase 173's item, above).
- **`access.nominationsLocked` was turned on beside a profile by no test** (criterion 4).
- **What the 9.3 GB of the storage volume are** was not looked into; the todo says so.
- **The visual-regression project was not run**: it is outside the default suite, and no baseline holds a surface the phase touches (read by the overflow fix).
- **The skill audit for `database` exits 1**, as before the phase.
- **CI was not run**: nothing of this branch runs in CI on push.

## The state the local stack is left in

Read with `psql` after the default seed:

- **Schema:** the tree's, applied by the batch's last reset at about 02:17 local. pgTAP has not run since, so no test helper is in `public` and `yarn db:types` is valid as the database stands.
- **Data:** `seed.sql` plus the **`default` dataset in the default project**, written by `yarn db:seed:default` (exit 0, 752 rows): 1 election, 328 candidates, 8 organizations, 26 questions, 377 nominations.
- **The E2E project `…00e2`** exists and holds no election, candidate, organization, question or nomination: every teardown of the last batch run passed. Its settings row reads `access.answersLocked: false`.
- **Auth users:** 2, those of `seed.sql`.
- **The stack:** up; neither it nor Docker was restarted; nothing listens on the wrapper's port. Docker VM free: 19.81 GiB at the end, against 19.84 before the full run and 19.79 before the batch.
- **The working tree:** clean but for the operator's untracked `CAND-APP-PLAN.md`.

## Files touched that the plan did not list

- `scripts/assert-a11y-scan-wiring.mjs`, `tests/README.md` (`a750eada7`)
- `tests/tests/utils/contestantEntityUrl.ts`, `tests/tests/fixtures/contestant/contestant-entity-selection.ts`, `tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts`, `tests/tests/fixtures/voter/organizationDetail.fixture.ts` (`0b5498f20`)
- `packages/dev-seed/src/template/permittedKeys.ts`, `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts`, `tests/tests/utils/axeScan.ts` (`4c930217c`)
- `apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md`, `…/backend/authentication/+page.md`, `…/backend/data-import-and-deletion/+page.md`, `…/contestant-app/entity-selection/+page.md`, `…/contestant-app/pre-registration-and-invitation/+page.md` are inside the plan's two listed directories.

Listed by the plan and not changed: `packages/dev-seed/README.md`.

Gitignored evidence: under `tests/e2e-runs/175-gates/`, `175-13-premeasure` and `175-13-final`, each with its `.log`, `.exit` and `.launched`, the second with `.verdict.txt`. Under `tests/e2e-runs/175-e2e/`, `175-13-final` with its `.log`, `.exit`, `.launched` and three verdict files. Under `tests/e2e-runs/175-determinism/`, `175-13-final` with its `.log`, `.exit`, `.launched` and its ledger. Under `tests/e2e-runs/175-unit/`, `175-13-skill-audit-before.*` and `-after.*`, `175-13-skill-audit-components.log` and `-data.log`, `175-13-t1-verify.*` to `-t3-verify.*` and `175-13-t3-verify-substituted.*`, `175-13-generate-docs.log`, `175-13-docs-links.log`, `175-13-docs-format.log`, `175-13-wiring-control.log`, `175-13-scope-pre.txt`, `175-13-hygiene-pre.txt` and their closing twins, and the logs of the checks run before each commit. A scratch counting script was run from the session's scratch directory and never placed in the repository.

## Known Stubs

None.

## Threat Flags

None. This plan adds no endpoint, no auth path, no file access and no schema change. The one existing surface outside the phase's register, an election's colour painted unparsed, was flagged by plan 175-08 and is filed.

## Self-Check: PASSED

Checked after writing:

- `d11713b95`, `98d1474f6`, `a750eada7`, `0b5498f20`, `4c930217c`, `1c413c8fc` and `7fde35f13` are ancestors of `HEAD`; `git rev-list --count dbf30f0e5..7fde35f13` is 7, and every one is this plan's.
- The three closed todos are under `.planning/todos/done/` and thirteen files match `.planning/todos/pending/2026-10-09-175-*.md`.
- `175-13-t1-verify.exit` and `-t2-verify.exit` hold 0; `175-13-t3-verify.exit` holds 1 and `175-13-t3-verify-substituted.exit` holds 0; `175-13-skill-audit-before.exit` and `-after.exit` hold 1; `175-13-seed-default.exit` holds 0.
- The `.exit` markers of `175-gates/175-13-premeasure`, `175-gates/175-13-final`, `175-e2e/175-13-final` and `175-determinism/175-13-final` hold 0.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `dbf30f0e5` and `HEAD`.

---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 08
subsystem: dev-seed
tags: [dev-seed, template, smoke, hosted, open-for-voters]
status: complete

requires:
  - "184-07: ruled PUBLIC_PROJECT_ID canonical (00000000-0000-0000-0000-000000000001) on both hosted projects"
provides:
  - "Ruling: hosted projects are opened for voters by BOOTSTRAP_OPEN_FOR_VOTERS=true at each hosted bootstrap (ruled by the operator, 2026-10-26)"
  - "Built-in dev-seed template `smoke` (export smokeTemplate, default export too): 1001 candidates + 1001 candidate nominations in the canonical project, prefix smoke_, no auth user, no storage_config row, no openForVoters, no projectId"
  - "`smoke` registered in BUILT_IN_TEMPLATES (no BUILT_IN_OVERRIDES entry), in the --help built-in list and as README § Built-in Templates ### `smoke`"
  - "packages/dev-seed/tests/templates/smoke.test.ts: registration, validateTemplate, counts + project, smoke_ prefix on every row, no auth/account/project/storage_config table, openness and project id absent"
affects: [184-15, 184-22, 185, 186]

actuals:
  tokens: 3100
  tasks: 2
  commits: 2
plan_head_before: 6f506e4bd8c899e829ce77ce4e099f8d62485fff
plan_head_after: 4b0fb272b0c7364b2928b4f0cfc583612b08a3b0

tech-stack:
  added: []
  patterns:
    - "A non-E2E built-in reuses the perm family's LIKERT_5_EN and MINIMAL_BASE_APP_SETTINGS, so it falls in the `perm` family of the contestantApp registry test without a test edit"

key-files:
  created:
    - packages/dev-seed/src/templates/smoke.ts
    - packages/dev-seed/tests/templates/smoke.test.ts
  modified:
    - packages/dev-seed/src/templates/index.ts
    - packages/dev-seed/src/cli/help.ts
    - packages/dev-seed/README.md

key-decisions:
  - "Hosted projects are opened for voters through BOOTSTRAP_OPEN_FOR_VOTERS=true at each hosted bootstrap, not by the smoke template (ruled by the operator, 2026-10-26)"
  - "The smoke template states app_settings (the perm family's MINIMAL_BASE_APP_SETTINGS): the registry test requires every built-in to state a contestantApp root, and the hosted bootstrap writes an empty settings row"

requirements-completed: []  # OBS-07 and SUPA-06 need the template seeded on a hosted project and read there (plans 184-15, 184-22); nothing is seeded here

duration: about 5 min
completed: 2026-10-26
---

# Phase 184 Plan 08: The `smoke` dev-seed template for the more-than-1000-row read Summary

**Openness ruling: hosted projects are opened for voters by `BOOTSTRAP_OPEN_FOR_VOTERS=true` at each hosted bootstrap (`bootstrap`, ruled by the operator, 2026-10-26). The template sets neither `openForVoters` nor `projectId`.**

**Emitted by `runPipeline(smokeTemplate, {})`: 1001 candidates and 1001 nominations**, plus 1 election, 1 constituency group, 1 constituency, 4 organizations, 1 question category, 6 questions and 1 app_settings row. It emits 0 rows for accounts, projects, alliances, factions and feedback. Every row is in project `00000000-0000-0000-0000-000000000001`, and every external id starts with `smoke_`.

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-26T14:59:26Z
- **Completed:** 2026-10-26T15:02:45Z
- **Tasks:** 2 (1 decision, ruled in advance; 1 auto, TDD)
- **Files modified:** 5

## Accomplishments

- Task 1 ruling recorded: `bootstrap`. `infra/scripts/bootstrap.sql` still reads `BOOTSTRAP_OPEN_FOR_VOTERS` (grep count 2).
- `packages/dev-seed/src/templates/smoke.ts` defines the dataset. It has a fixed seed (1001) and is English only. Elections, constituency groups, constituencies and organizations use synthetic counts. There is one fixed opinion category with six fixed Likert-5 `singleChoiceOrdinal` statements, `candidates.count` 1001 and `nominations.count` 1001. It uses no overrides, so nothing is count-locked.
- `smoke` is registered in `BUILT_IN_TEMPLATES`, re-exported from the barrel, listed in `--help` and documented in the README under "Built-in Templates". The README's perm paragraph now reads "every built-in other than `default`, `e2e/base` and `smoke`".
- `smoke.test.ts` failed first: the module was missing, and the suite reported "no tests" with exit 1. All six cases pass now.

## Task Commits

1. **Task 1: How the hosted projects are opened for voters.** Decision, ruled in advance as `bootstrap`. No commit, because no files changed.
2. **Task 2: The `smoke` template, registered and tested** (TDD):
   - RED `413ff90ea`: `test(184-08): add failing cases for the smoke template's counts, prefix and absence of auth rows`
   - GREEN `4b0fb272b`: `feat(184-08): add the smoke built-in template with 1001 candidates and nominations and no auth user`

## Verification

- `yarn workspace @openvaa/dev-seed test:unit tests/templates/smoke.test.ts tests/assertKnownRowProps.builtins.test.ts tests/nominationShapeCensus.builtins.test.ts tests/templates/built-in-templates-contestant-app.test.ts` gave exit 0: 4 files, 126 tests passed.
- Two more registry consumers were run too, `tests/cli/resolve-template.test.ts` and `tests/templates/base-app-settings.test.ts`: exit 0, 35 tests passed.
- `yarn workspace @openvaa/dev-seed typecheck` gave exit 0. `yarn assert:comment-hygiene` gave exit 0 with 0 violations. `prettier --check` on the five files gave exit 0.
- Acceptance greps:
  - `smoke` in help.ts: 2 (the requirement is at least 1).
  - `^ *smoke: smokeTemplate` in index.ts: 1.
  - `` ### `smoke` `` in the README: 1.
  - `createUser|auth\.admin|storage_config` in smoke.ts: 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The template states `app_settings`**
- **Found during:** Task 2 (GREEN run of the plan's gate)
- **Issue:** `tests/templates/built-in-templates-contestant-app.test.ts` requires every `BUILT_IN_TEMPLATES` entry to state `app_settings.fixed[0].settings.contestantApp`, and it has no skip list. Registering `smoke` without settings failed 3 cases with "built-in template 'smoke' has no app_settings.fixed[0].settings object". Also, the hosted bootstrap inserts the settings row as `{}`. The default template documents that voter route loaders throw when `entities` is absent, and phase 185 renders a voter page from this data.
- **Fix:** `app_settings.fixed: [{ external_id: 'appsettings', settings: MINIMAL_BASE_APP_SETTINGS }]`, taken from the perm family's shared settings. `smoke` therefore belongs to the registry test's `perm` family, and no test was edited. The header and the README say so, and they also say that teardown keeps the settings row it merged into.
- **Files modified:** packages/dev-seed/src/templates/smoke.ts, packages/dev-seed/README.md
- **Commit:** 4b0fb272b

**2. [Rule 1 - Acceptance grep] The header names no `storage_config`**
- **Issue:** The first header said "no `storage_config` row", which broke the acceptance grep (`createUser|auth\.admin|storage_config` must count 0).
- **Fix:** The header now says "no storage-configuration row". The README keeps the table name, and the grep does not cover the README.
- **Commit:** 4b0fb272b

## Notes for the orchestrator

- **Teardown reopens the project.** `yarn db:seed:teardown --prefix smoke_` removes the smoke content rows. Like every teardown, it then sets `open_for_voters = true` on the default project and keeps `app_settings`. Under the `bootstrap` ruling this does no harm, and both the README and the template header say so.
- **No local seed run.** The plan asks for none: the template is proven in memory through `runPipeline`. Seeding happens on the hosted projects from the operator's shell (plans 184-15 and 184-22).
- **Stack not touched.** The full `yarn test:unit` was not run, because the plan does not require it and the shared stack is in use. Only the offline test files listed above were run.

## Known Stubs

None.

## Threat Flags

None. T-184-23 is mitigated: the template has no auth path, the test asserts that no accounts or auth table is emitted, and the grep counts 0. T-184-24 is mitigated: every emitted external id is asserted to start with `smoke_`. T-184-SC: nothing was installed.

## Self-Check: PASSED

- FOUND: packages/dev-seed/src/templates/smoke.ts
- FOUND: packages/dev-seed/tests/templates/smoke.test.ts
- FOUND: 413ff90ea (ancestor of HEAD)
- FOUND: 4b0fb272b (ancestor of HEAD)

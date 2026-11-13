---
phase: 182-analytics-relay
plan: 02
subsystem: database
tags: [supabase, pgtap, security-definer, app-settings, analytics, baseline-migration, data-provider]
status: complete

# Dependency graph
requires:
  - phase: 182-01
    provides: the running isolated instance p182 (openvaa-iso-p182, database on 56201) and the proven rebuild route `supabase db reset --workdir`
  - phase: 178-04
    provides: contestant_app_public_config with its fourth value access.answersLocked (commit 591404682, already in this branch and in feat/entity-signup-multi-grant)
provides:
  - contestant_app_public_config answers a fifth value, analytics.trackEvents, as stored and null where unset (schema/106-app-settings.sql and the regenerated 00001_initial_schema.sql)
  - the Supabase data provider returns an analytics root for a closed project, false when nothing valid is stored (CLOSED_PROJECT_TRACK_EVENTS_DEFAULT)
  - one cherry-pickable [db] commit, 87ae648f6f8808240ca939a79e19885332cc72ad, holding no .planning file
affects: [181-17, 182-11, 182-19, 182-23, 182-24, 182-28, 182-31, v2.16 feat/entity-signup-multi-grant]

# Actuals (#2632)
# tokens is chars/4 over this plan's commit diff (41339 chars), its four evidence records (17934 chars) and this summary.
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD. The docs commit follows it.
actuals:
  tokens: 17000
  tasks: 4
  commits: 1
plan_head_before: 876100781401ea19bf0ff6b01168ceb95c1f22f8
plan_head_after: 87ae648f6f8808240ca939a79e19885332cc72ad

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A value a signed-out reader of a closed project needs is added as a member of contestant_app_public_config at its storage path, never as a second function"
    - "The closed-project answer is returned through a typed local, because analytics is a static setting that Partial<DynamicSettings> does not declare"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/02-d13-decision.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/02-d13-red.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/02-d13-green.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/02-d13-commit.txt
  modified:
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md

key-decisions:
  - "D-13 landed in the baseline (operator answer land-in-baseline for attempt 20261019T064123Z.876100781401, head 876100781401ea19bf0ff6b01168ceb95c1f22f8)"
  - "The function now answers five values, not the plan's four: v2.16's 178-04 had already added access.answersLocked before this plan ran, so analytics.trackEvents is the fifth"
  - "A non-boolean stored trackEvents is rejected by StoredSettingsSchema, reported once by path, and the closed-project answer falls back to false"

patterns-established:
  - "Raw TAP for a red record: pg_prove's summary prints no 'not ok' lines, so the single file is also run through psql with pgTAP created in schema extensions and dropped afterwards"

requirements-completed: [RELAY-19, RELAY-12]

# Metrics
duration: 9min
completed: 2026-10-19
---

# Phase 182 Plan 02: D-13, the closed-project analytics member Summary

**D-13 is commit `87ae648f6f8808240ca939a79e19885332cc72ad` (`feat[db]: contestant_app_public_config also answers analytics.trackEvents`). The change is in `schema/106-app-settings.sql` and the regenerated baseline `00001_initial_schema.sql`. A signed-out reader of a project not open for voters now gets `analytics.trackEvents` as stored, `null` where unset, and no other member of `analytics`. The data provider turns that into an `analytics` root, `false` when nothing valid is stored. pgTAP failed 8 of 20 on the unchanged function and passed 47 files and 2605 tests on the rebuilt isolated instance.**

## Performance

- **Duration:** about 9 min for Tasks 2 to 4. The decision checkpoint (Task 1) was presented at 06:41Z and answered before this run.
- **Started:** 2026-10-19T09:42:59Z (`D13_STARTED`)
- **Completed:** 2026-10-19T09:50:18Z
- **Tasks:** 4 (1 decision checkpoint, 3 auto)
- **Files modified:** 9 in the `[db]` commit, plus 4 evidence records
- **Start sha:** `876100781401ea19bf0ff6b01168ceb95c1f22f8`

## Accomplishments

- **Decision recorded and used once.** The operator's reply `land-in-baseline 20261019T064123Z.876100781401` was appended, quoted and indented, followed by `OPERATOR_D13_DECISION=land-in-baseline attempt=20261019T064123Z.876100781401 head=876100781401ea19bf0ff6b01168ceb95c1f22f8`. HEAD was still that sha. The answer check exited 0, and `D13_STARTED=` was appended straight after it.
- **Red.** Whole-tree status showed only the pgTAP file. The whole directory was run against the unchanged function and exited 1, failing `38-contestant-app-public-config` on 8/20 (tests 9, 10, 13, 15, 17-20, all new or extended assertions). Every other file passed (47 files, 2605 tests).
- **Function.** One member: `'analytics', jsonb_build_object('trackEvents', v.settings #> '{analytics,trackEvents}')`. The comments now say five values and name the tracking switch. No function, grant or policy was added, and `search_path = ''` is unchanged.
- **Regenerate.** `yarn schema:regenerate` exited 0. The migration diff has two hunks, both inside `contestant_app_public_config` and its comment.
- **Green, isolated instance only.** `supabase db reset --workdir` exited 0 (`REBUILD_ROUTE=reset`). pgTAP over the whole directory exited 0 (47 files, 2605 tests, PASS). `supabase db lint --fail-on warning` exited 0 with no results. `lint-schema.mjs` exited 0 (0 errors and the 3 existing foreign-key-index warnings). Parity exited 0. The generated type entry for `contestant_app_public_config` matches the tracked one (`TYPES_ENTRY_DIFFERS=no`). `assert:rpc-nullability` and `assert:grant-permission-enum` both exited 0. The 13 `_openvaa-local` containers match the 182-01 record (`cmp` 0).
- **Provider.** Four new cases plus updated whole-answer expectations: red 6 failed / 116 passed, then green 122/122. `storedPublicConfig` narrows `answer.analytics` with `isJsonObject` and copies `trackEvents` only when it is `!= null`. The closed-project return adds `analytics: { trackEvents: declared.analytics?.trackEvents ?? CLOSED_PROJECT_TRACK_EVENTS_DEFAULT }`. Nothing reads `dynamicSettings.analytics`, and the change has no `any`.
- **Docs.** Each statement of the count now names five values: SKILL.md § 4, rls-policy-map.md (two rows), schema-reference.md (one row) and the app-settings docs page. The dated 2026-10-16 history entry in SKILL.md ("fourth value") is history and was left as it is.
- **Gate.** After the commit, on a clean tree with HEAD = `87ae648f6` before and after, `yarn workspace @openvaa/frontend typecheck` exited 0 (2999 files, 0 errors, 0 warnings).

## For the v2.16 session (follow-up X-1)

1. Cherry-pick `87ae648f6f8808240ca939a79e19885332cc72ad` to `feat/entity-signup-multi-grant` and run `yarn schema:regenerate` there. Resolve any conflict in `00001_initial_schema.sql` by keeping both `schema/` edits and regenerating, never by hand.
2. Plan 178-04 must be written on top of it, or its `CREATE OR REPLACE` removes the `analytics` member. At execution, 178-04 was already executed (commit `591404682`, which added `access.answersLocked`) and is on both branches, and this commit was built on top of it. So the rule now applies to any later `CREATE OR REPLACE` of `contestant_app_public_config` on v2.16 (a 178-04 follow-up, a rerun, or another plan): it must keep the `analytics` member.
3. The pgTAP file's key-set assertion names five values (`ARRAY['access', 'analytics', 'contestantApp']` at the top, `ARRAY['trackEvents']` under `analytics`) and fails if that happens.

## Task Commits

1. **Task 1: Decision checkpoint.** No commit. Answer `land-in-baseline`, recorded in `evidence/02-d13-decision.txt`.
2. **Tasks 2-4: Function member, provider, docs: one commit** `87ae648f6` (`feat[db]`), as the plan requires (Tasks 2 and 3 make no commit of their own).

**Plan metadata:** the docs commit that follows, holding this SUMMARY and the four evidence records.

## Files Created/Modified

- `apps/supabase/supabase/schema/106-app-settings.sql`: the `analytics` member and the five-value comments
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated, never hand-edited
- `apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql`: B stores `analytics.trackEvents = true` beside bait `analytics.platform`, and A stores `false`. Adds the top-level key set with `analytics`, a key set under `analytics`, and a value assertion. Updates the whole-answer and all-null literals. `plan (18)` becomes `plan (20)`.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`: `CLOSED_PROJECT_TRACK_EVENTS_DEFAULT`, the copy in `storedPublicConfig`, the `analytics` root, and doc comments
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`: `NOTHING_DECLARED` gains `analytics`. Four new cases: stored true, stored null, extra member not copied, non-boolean rejected and reported once.
- `.claude/skills/database/{SKILL,schema-reference,rls-policy-map}.md` and the app-settings docs page: five values
- `evidence/02-d13-{decision,red,green,commit}.txt`: copies of the current attempt files

## Decisions Made

- `tests/tests/specs/perm/perm-closed-project.spec.ts` was **not edited**. Its last describe asserts what the login and registration screens show, not the exact member set of the settings. It was not run, because an E2E run needs the shared stack.
- `packages/supabase-types/src/database.ts` was not changed: the function's signature is unchanged.

## Deviations from Plan

**1. [Rule 1 - Stale plan anchors] Five values, not four; `plan (18)`, not `plan (16)`.**
- **Found during:** Task 2, Step 1.
- **Issue:** The plan assumed the function answered three values and the test planned 16 assertions. v2.16's 178-04 (commit `591404682`) had already added `access.answersLocked`, so the function answered four values with `plan (18)`, and the comment and doc anchors already said "four".
- **Fix:** Same intent, adapted to the tree. `analytics.trackEvents` is the fifth value, every "four" statement about this function became "five", and the count rose by exactly the 2 assertions added (18 to 20). The plan's artifact strings (`ARRAY['access', 'analytics', 'contestantApp']`, `'analytics', jsonb_build_object('trackEvents'`, `CLOSED_PROJECT_TRACK_EVENTS_DEFAULT`) all hold.
- **Commit:** `87ae648f6`.

**2. [Rule 3 - Blocking] Raw TAP for the red record.**
- **Found during:** Task 2, Step 2.
- **Issue:** `supabase test db` runs pg_prove in summary mode, which prints `# Failed test N` but no `not ok` lines, and the red verify looks for `not ok`. A bare psql run of the file failed with `function plan(integer) does not exist`, because the CLI creates pgTAP only for its own run.
- **Fix:** In the same red attempt, against the same unchanged function: `CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions`, then file 38 through psql, then `DROP EXTENSION pgtap`. That run showed 8 `not ok` lines, the same 8 tests. `PGTAP_RED_EXIT=1` is the CLI's status. The failed first psql try is noted in the record.

**3. [Rule 3 - Blocking] Closed-project answer returned through a local.**
- **Found during:** Task 3.
- **Issue:** `DPDataType['appSettings']` is `Partial<DynamicSettings>`, and `analytics` is a static setting, so returning it in an object literal fails the excess-property check.
- **Fix:** The answer is built in `closedAnswer` and returned, with a one-line comment saying why. There is no cast and no `any`. The readable-row path already returns `analytics` through its cast. Typecheck: 0 errors.

**4. [Orchestrator instruction] State pointer not advanced.** `state.advance-plan` and `state.record-session` were not run. The STATE pointer stays on 181 plan 17 with its note about the p182 instance.

## Issues Encountered

- The `timeout` command is not on this macOS host (status 127), so long runs went to the background with status files.
- The CLI prints a newer-version notice (v2.121.0 available, v2.118.0 installed), which has no effect here.

## Known Stubs

`CLOSED_PROJECT_TRACK_EVENTS_DEFAULT = false` is intentional, as the plan says: this commit must not depend on the later move of `trackEvents` into the dynamic settings. Plan 182-19 replaces it with the shipped dynamic default.

## Next Phase Readiness

- Phase 181's freeze plan (181-17) can find D-13 here. The baseline already holds it.
- The isolated instance `p182` is **left running** on the regenerated migration (rebuilt by `db reset`). The shared `openvaa-local` stack was not addressed. It must be reset from this checkout in the operator-confirmed windows of 182-11, 182-23, 182-24, 182-31 and 182-28, each with a schema probe showing the `analytics` member, before an E2E run counts as evidence about D-13.

## Self-Check: PASSED

- FOUND: the 9 committed files and the 4 evidence records. Each record is `cmp`-equal to its current attempt file.
- FOUND: `87ae648f6f8808240ca939a79e19885332cc72ad` is HEAD. Its parent is `876100781401ea19bf0ff6b01168ceb95c1f22f8`, the sha in the decision. It holds no `.planning` path.
- All five automated verify blocks of Tasks 2 and 4 exit 0, as do the parity and member grep.

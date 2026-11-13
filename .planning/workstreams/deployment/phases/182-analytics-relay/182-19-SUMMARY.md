---
phase: 182-analytics-relay
plan: 19
subsystem: settings
tags: [analytics, app-settings, dynamic-settings, zod, stored-settings, dev-seed, data-provider]
status: complete

requires:
  - phase: 182-02
    provides: the closed-project analytics root and the placeholder CLOSED_PROJECT_TRACK_EVENTS_DEFAULT
  - phase: 182-16
    provides: the Umami component and mount deleted
  - phase: 182-17
    provides: no frontend file reads analytics.platform
  - phase: 182-18
    provides: TermsOfUse reads ctx.appSettings.analytics.trackEvents, and six tests stub analytics { trackEvents }
provides:
  - DynamicSettings.analytics { trackEvents: boolean } with the shipped default { trackEvents: false }
  - StaticSettings has no analytics member
  - StoredSettingsSchema.analytics = z.strictObject({ trackEvents: z.boolean().optional() }).optional()
  - perm-analytics-tracking stores only analytics { trackEvents: true }
  - the closed-project analytics root built as { ...dynamicSettings.analytics, ...declared.analytics }
affects: [182-20, 182-21, 182-22, 182-24, 182-28]

estimate:
  tokens: 85000
  tasks: 3
actuals:
  tokens: 9500      # chars/4 over the three code commits' diff (30126 chars) plus the gate record and this summary
  tasks: 3
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 17d893c8342562eccd3381cab9eef0be72008d9c
plan_head_after: 96bb107f0c777121d6a9fde50342567273c50e8a

tech-stack:
  added: []
  patterns:
    - "A setting a publisher changes without a rebuild lives on DynamicSettings with a shipped default; AppSettings = StaticSettings & DynamicSettings keeps every reader's path unchanged"
    - "A schema test that pins partial preserve removes the top-level members the issues name and parses the rest again, as parseWithPartialPreserve does"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/19-gates.txt
  modified:
    - packages/app-shared/src/settings/staticSettings.type.ts
    - packages/app-shared/src/settings/staticSettings.ts
    - packages/app-shared/src/settings/dynamicSettings.type.ts
    - packages/app-shared/src/settings/dynamicSettings.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.ts
    - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
    - packages/dev-seed/src/templates/index.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts

key-decisions:
  - "analytics.trackEvents is a dynamic setting with the shipped default false; analytics.platform exists in no type, schema or seed (D-11b)"
  - "A stored row that still has analytics.platform fails at the path analytics alone; partial preserve drops the whole member, keeps the siblings and emits one error record per read (T-182-80)"
  - "requireUserDataVersion is unchanged, so a consent grant given under the old text stays a grant (A-05)"
  - "The pgTAP bait analytics.platform in 38-contestant-app-public-config.test.sql is left as it is: it is a deliberate stale-row fixture in a [db] test file shared with v2.16"

patterns-established:
  - "The closed-project answer builds each root as the shipped dynamic default with the declared member over it, so no literal default lives in the provider"

requirements-completed: []

duration: 10min
completed: 2026-10-19
---

# Phase 182 Plan 19: analytics.trackEvents becomes a dynamic setting Summary

**`analytics.trackEvents` now lives on `DynamicSettings` with the shipped default `{ trackEvents: false }`, `StaticSettings` has no `analytics` member, the strict stored schema accepts only `trackEvents` under `analytics`, the `perm-analytics-tracking` template stores only `{ trackEvents: true }`, and the data provider's closed-project root is `{ ...dynamicSettings.analytics, ...declared.analytics }`. A stored row that still names a provider loses its whole `analytics` member, keeps its siblings and emits one error record. Build, typecheck, unit and lint gates are green on `96bb107f0`.**

Start sha: `17d893c8342562eccd3381cab9eef0be72008d9c`.

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-19T19:33:53Z
- **Completed:** 2026-10-19T19:43Z
- **Tasks:** 3 of 3
- **Files modified:** 10, plus 1 evidence record

## Accomplishments

- **Settings (Task 1).** The `analytics` member is gone from `staticSettings.type.ts` and `staticSettings.ts`. `DynamicSettings.analytics` is documented: it says whether usage events other than the identifier-free page-view count are collected, and that the provider, consent mode and visit-id mode are server configuration. `dynamicSettings.ts` ships `analytics: { trackEvents: false }`. The `survey.linkTemplate` doc now says `{sessionId}` is replaced with the in-memory visit id when this visitor's usage events carry it, and with nothing otherwise. `requireUserDataVersion` is not touched by any 182-19 commit. After the package build, `"analytics" in staticSettings` is false (checked from `apps/frontend`).
- **Schema, tests and seed (Task 2).** `StoredSettingsSchema.analytics` is `z.strictObject({ trackEvents: z.boolean().optional() }).optional()`. Its comment says it is a dynamic setting stored in this column, and that a stored provider object fails at `analytics` and is dropped by partial preserve. The two cases that accepted a platform object are gone. The old LEVEL 3 case is now "LEVEL 2: rejects `platform` as an unknown key inside `analytics`", with path `['analytics']` and `keys: ['platform']`. New cases cover:
  - `trackEvents: true` parses;
  - `trackEvents: 'yes'` is rejected at `['analytics', 'trackEvents']`;
  - partial preserve drops only `analytics` and keeps `matching`.

  The header's list of nesting levels and the schema docstring's two lists name `analytics`. Run against the HEAD schema, 2 of 40 failed (the two new rejection cases). With the change, 40 of 40 passed. `perm-analytics-tracking.ts` stores `analytics: { trackEvents: true }`, and its header says the template turns usage events on for the tracking spec, consent is given at run time and nothing in it is a secret. The templates index comment is corrected (deferred item from 182-16).
- **Provider (Task 3).** The stale-row case is a readable row with `matching` and `analytics: { platform: {...}, trackEvents: true }`. It returns `{ matching: { minimumAnswers: 1 } }` with no `analytics` member, exactly one `ERROR` record with `issues: ['analytics']` and `rejectedKeys: ['platform']`, and none of the stored value. It failed on the stale app-shared build, which still held the old schema, and passed after the rebuild. `CLOSED_PROJECT_TRACK_EVENTS_DEFAULT` and its comment are deleted. The closed-project return is a direct literal again, because `analytics` is now declared on `Partial<DynamicSettings>`. The "returned through a variable" comment went with the variable. The `_getAppSettings` doc no longer lists `analytics.platform` (deferred item from 182-17), and it says the default comes from `dynamicSettings.analytics`. The stray-member fixture is now `platform: { name: 'other', code: 'x' }` (deferred item from 182-23). The case and its intent are kept. Provider file: 123 of 123 tests passed.
- **182-18 handover holds.** `TermsOfUse.svelte` reads `ctx.appSettings.analytics.trackEvents`, and the six test stubs (`analytics: { trackEvents }`) still resolve, because `AppSettings = StaticSettings & DynamicSettings`. Frontend typecheck: 3059 files, 0 errors. Frontend unit: 5946 passed, 31 skipped.

## Gates (slot `19-gates`, attempt `20261019T193842Z.96bb107f0`)

On `96bb107f0c777121d6a9fde50342567273c50e8a`, tree clean before and after, HEAD unchanged:

| Gate | Status |
|------|--------|
| `yarn build` | `BUILD_EXIT=0` |
| `yarn typecheck` | `TYPECHECK_ALL_EXIT=0` |
| `yarn test:unit` | `TEST_UNIT_EXIT=0` (app-shared 149, dev-seed 1203, frontend 5946 + 31 skipped, tests 189) |
| `yarn lint:check` | `LINT_CHECK_EXIT=0` (comment hygiene, i18n namespaces and schema-migration parity included, 0 violations) |

Each status was read from its own status file. `evidence/19-gates.txt` is a `cp` of the attempt file, and the plan's pointer verify exits 0. The shared stack was started with `yarn db:start` (no reset) before the gates, because the dev-seed integration tier needs it, and stopped with `yarn db:stop` afterwards (exit 0).

## Task Commits

1. **Task 1:** `0c11d074a`, `feat(182-19): analytics.trackEvents is a dynamic setting …`
2. **Task 2:** `ca961cb09`, `feat(182-19): the stored analytics member holds only trackEvents …`
3. **Task 3:** `96bb107f0`, `feat(182-19): the closed-project analytics root is built over dynamicSettings.analytics …`

## Deviations from Plan

**1. [Plan scope] `packages/dev-seed/src/templates/index.ts` edited.** The file is not in `files_modified`. `deferred-items.md` assigned its "dummy umami code" comment to this plan, and Task 2's `git grep -i umami -- packages` verify needs it gone. The edit is to the comment only. Commit `ca961cb09`.

**2. [Stale acceptance grep] `git grep -n -E "analytics\??\.platform" -- apps packages tests ':!apps/docs'` prints two lines.** Both are comments in `apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql`, the pgTAP file of 182-02's `[db]` commit. They describe its deliberate bait: a stored `analytics.platform` member (named `legacy`) that the function must not copy. The comments are true as written. The bait is exactly the stale row this plan makes fail safe. The file is not this plan's, it is shared with v2.16 (178-04), and it sits in the `[db]` area the orchestrator keeps under operator awareness. So it was not edited. No source, type, schema or seed file names the member. `git grep -i umami -- apps packages tests ':!apps/docs'` prints nothing.

**3. [Rule 3 - Blocking] app-shared rebuilt before the provider test.** The frontend reads `@openvaa/app-shared` from its build output. The first provider run used the build from Task 1, which still held the old schema, and the stale-row case failed there. That run served as the red. `yarn workspace @openvaa/app-shared build` then made it pass. No code change was needed.

**4. [Comment hygiene] Closed-project answer returned directly.** 182-02 returned it through `closedAnswer` with a comment saying `Partial<DynamicSettings>` does not declare `analytics`. That is no longer true, so the variable and its comment were removed and the literal is returned. Typecheck: 0 errors.

**5. [Orchestrator instruction] State not advanced.** `state.advance-plan` and `state.record-session` were not run, STATE.md was not edited, and no requirement was ticked.

## Issues Encountered

None beyond the stale build in deviation 3.

## Known Stubs

None. `CLOSED_PROJECT_TRACK_EVENTS_DEFAULT` was the stub 182-02 recorded for this plan, and it is gone.

## Notes for later plans

- **182-20** (pageview-only project): with `trackEvents` off, only pageviews are sent. The shipped default is now `dynamicSettings.analytics.trackEvents === false`, and `MINIMAL_BASE_APP_SETTINGS` stores `analytics: { trackEvents: false }`, which the reduced schema accepts. A seed that turns events on stores only `analytics: { trackEvents: true }`. Any `platform` key fails the strict schema, drops the whole `analytics` member and logs one error per read.
- **182-21:** a fake `AppSettings` in a test needs only `analytics: { trackEvents }`. No `platform` stub exists anywhere under `apps/frontend/src`, `packages` or `tests`.
- **182-22** (docs and umami sweep):
  - The docs still describe the old setting. `apps/docs/.../configuration/app-settings/+page.md` says "`StoredSettingsSchema` also accepts `analytics`, which is a static setting", which is now false. Its static-settings, intro and features pages, and `publishers-guide/.../what-data-should-be-collected`, are listed in RESEARCH § 4.
  - `packages/app-shared/src/settings/README.md` needs no change.
  - Outside `apps/docs`, `git grep -i umami` over `apps packages tests` is empty.
  - The only other `analytics.platform` text is the pgTAP bait comments (deviation 2) and a spike-findings source under `.claude/skills/spike-findings-voting-advice-application-gsd/sources/004-matchstore-integration/`. Decide in the sweep whether those are in scope.
- **v2.16 merge:** the `perm-analytics-tracking.ts` overlay and header changed here, and v2.16 changed one other line (`election_type`), so expect a small merge there.

## Self-Check: PASSED

- FOUND: all 10 modified files and `evidence/19-gates.txt`. The record is `cmp`-equal to the current attempt file.
- FOUND: `0c11d074a`, `ca961cb09` and `96bb107f0` are ancestors of HEAD.
- Verify results:
  - Task 1 verify: exit 0.
  - Task 2 verifies: the schema test passed 40 of 40; the overlay grep and the `umami` grep over `packages` both exit 0.
  - Task 3 verifies: the provider test passed 123 of 123; the `umami` grep over `apps packages tests` minus `apps/docs` exits 0; the `19-gates` pointer verify exits 0.

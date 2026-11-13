---
phase: 173-multi-entity-grants-entity-selection
plan: 06
subsystem: e2e-harness
tags: [playwright, vitest, e2e, route-builder, url-assertions, multi-entity, harness]
status: complete

requires:
  - phase: 173-multi-entity-grants-entity-selection
    provides: "173-05: the three param matchers, the widened entry gate, and the green boundary run 173-05-prep (180 of 180, 100 projects) this plan's harness changes are measured against"
provides:
  - "The tests' route builder fills param segments from an optional params record and throws, naming the route and the param, on an unfilled required or rest segment"
  - "One tests-side helper, contestantEntityUrl.ts, holding the single declaration of the entity segment (optional until 173-08) with the URL-pattern builders and the entity-less path builder"
  - "Every URL-shape assertion on a protected contestant page, and every entity-route navigation by route key, re-pointed to the helper"
  - "tests/vitest.config.ts with a stated root: the from-root Vitest command collects the tests-utility files"
  - "Gate subset 173-06-harness: typecheck, lint, unit at 0 on tree 262854acd"
affects: [173-07, 173-08, 173-12, 173-13]

estimate:
  tokens: 45000
actuals:
  tokens: 13973
  tasks: 3
  commits: 3
plan_head_before: 049954855e8147bca68246184e95583d9900510a
plan_head_after: 8f1aec033ed71e1a22ecf63f26d515aec2ac0aed

tech-stack:
  added: []
  patterns:
    - "A tests-side URL pattern is built from one fragment constant, so a change to the URL shape is one edit"
    - "A pattern builder returns a RegExp without flags, safe to test repeatedly in a loop"
    - "A route builder refuses an unfilled param instead of emitting the bracketed segment as text"
    - "A unit test of a URL pattern enumerates every spelling of a page (root x prefix x suffix) and asserts on the list of misses"

key-files:
  created:
    - tests/tests/utils/buildRoute.test.ts
    - tests/tests/utils/contestantEntityUrl.ts
    - tests/tests/utils/contestantEntityUrl.test.ts
  modified:
    - tests/tests/utils/buildRoute.ts
    - tests/vitest.config.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
    - tests/README.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "The entity segment is optional from this plan to the end of 173-08: ENTITY_SEGMENT_SOURCE ends in `?`, and 173-08 removes it in one edit"
  - "A fifth builder, contestantUrlOutsideRe, states 'has left this page for another page of the app'; the plan listed four"
  - "tests/vitest.config.ts gained a root, because the from-root command the plan and the config's docblock give found no test file on the starting tree"
  - "The optional full E2E run was not made: 173-07's full run is the boundary proof, as the plan rules"
  - "The route builder's own test uses route keys outside the entity tree, so 173-08's move does not touch it"

requirements-completed: []

metrics:
  duration: 35min
  completed: 2026-10-06
---

# Phase 173 Plan 06: E2E Harness Prep Summary

**The tests' route builder now throws on an unfilled `[param]` segment, one helper (`contestantEntityUrl.ts`) holds the shape of a contestant entity URL with the entity segment optional until 173-08, and fifteen URL assertions and five route-key navigations go through it — closed on typecheck, lint and unit at 0, with no E2E run.**

## Performance

- **Tasks:** 3 of 3
- **Commits:** 3 (measured: `git rev-list --count 049954855..8f1aec033`), before this summary's own
- **Files:** 3 created, 10 modified; none under `apps/` or `packages/`
- **Started from:** `049954855` (plan 05's summary commit; no orchestrator commit since)

## Accomplishments

- `buildRoute({ route, locale, params? })` fills `[name]`, `[name=matcher]` and `[...name]` segments or throws `buildRoute: the param "<name>" of route "<key>" (<route id>) is not filled`; an unfilled `[[name]]` segment is dropped. No path it returns holds a bracket.
- `contestantEntityUrl.ts` declares the entity segment once (`ENTITY_SEGMENT_SOURCE`, the alternation `candidate|organization` and a canonical uuid, wrapped optional) and builds every pattern from it.
- Every hand-written pattern for a protected contestant path is gone from specs and fixtures: the acceptance search exits 1.
- The suite still lists 180 tests, the baseline's total.

## Task Commits

1. **Task 1: the route builder refuses an unfilled param; one helper holds the entity URL shape** — `8a8a7a877` (feat)
2. **Task 2: re-point every URL-shape assertion and every entity-route navigation** — `262854acd` (test)
3. **Task 3: close on typecheck, lint, unit and the helpers' own tests** — `8f1aec033` (docs, the name map)

## The helper's final export names

| Module | Exports |
|---|---|
| `tests/tests/utils/buildRoute.ts` | `buildRoute`, `fillRouteId`, `parseParamSegment`, types `RouteParams`, `ParamSegment` |
| `tests/tests/utils/contestantEntityUrl.ts` | `ENTITY_SEGMENT_SOURCE`, `contestantUrlRe(subPath, tail = 'exact')`, type `ContestantUrlTail` (`'exact'`, `'child'`, `'any'`), `contestantUrlOutsideRe(subPath)`, `contestantHomeUrlRe()`, `isContestantHomePath(pathname)`, `dropEntitySegments(routeId)`, `buildEntityLessRoute({ route, locale, params? })` |

**The entity segment is optional until 173-08.** `ENTITY_SEGMENT_SOURCE` ends in `?`, with a comment saying why. Each re-pointed assertion therefore accepts `/contestant/profile` and `/contestant/<type>/<uuid>/profile` for two plans; 173-08 removes the `?`.

## Files re-pointed

The six the plan lists, and no spec or fixture beyond them. Two files outside the plan's list changed: `tests/vitest.config.ts` (deviation 1) and, in Task 2, `tests/tests/utils/buildRoute.test.ts` (it is in the plan's list; its route keys were changed there — deviation 3).

| File | What changed |
|---|---|
| `contestant-journey.spec.ts` | `PER_QUESTION_URL_RE` and five `toHaveURL` → `contestantUrlRe('/questions', 'child')`; three → `contestantUrlRe('/profile')`; one → `contestantUrlRe('/questions', 'any')`; one → `contestantUrlRe('/questions')`; the home settle → `contestantHomeUrlRe()`; the dispatcher's home comparison → `isContestantHomePath(stripped)`; one comment restated |
| `contestantProfilePage.fixture.ts` | "has left the profile page" → `contestantUrlOutsideRe('/profile')` |
| `contestant-a11y.spec.ts` | the question-page wait → `contestantUrlRe('/questions', 'child')`; the runner's two `goto` calls → `buildEntityLessRoute` |
| `perm-localisation-positive.spec.ts` | the overview wait → `contestantUrlRe('/questions')` |
| `visual-regression.spec.ts` | two `goto` calls → `buildEntityLessRoute` |
| `cold-entry-dataroot.spec.ts` | one `goto` → `buildEntityLessRoute` |

Left alone, as the plan says: every expectation on `/contestant/login`, the a11y spec's `CONTESTANT_APP_URL` and `CONTESTANT_LOGIN_URL` (they name no protected path and hold for both shapes), the dispatcher's third alternative, the bank-auth journey's preregister wait, and every literal entity-less `page.goto`.

Per changed file, before and after: `test(` 2/0/3/2/0/4, `test.step(` 27, soft-assertion text 5/7/0/1/0/1 — identical. `SOFT_ASSERTION_BUDGETS` and `tests/playwright.config.ts` are untouched. No changed line holds a title or a step; the only changed lines that hold a timeout keep its value.

## Verification

| Check | Exit |
|---|---|
| `yarn vitest run --config tests/vitest.config.ts buildRoute contestantEntityUrl` (2 files, 43 tests) | 0 |
| `yarn vitest run --config tests/vitest.config.ts` (5 files, 64 tests; 3 and 21 before) | 0 |
| `yarn typecheck:tests`, at each of the two code commits | 0 |
| ESLint on the changed files and directories | 0 |
| `node scripts/assert-no-candidate-app-names.mjs` (run with the new files staged: it scans tracked files only) | 0 |
| The acceptance search for a hand-written protected pattern in `tests/tests` | 1, as required |
| A plain `buildRoute(` call naming one of the five entity keys | none |
| `yarn playwright test -c tests/playwright.config.ts --grep-invert @probe --list` | 0 — 180 tests |
| `git diff --stat 049954855..HEAD -- apps packages` | prints nothing |
| `173-verdict.mjs gates 173-06-harness --rows typecheck,lint,unit` | 0 |

**Gate subset `tests/e2e-runs/173-gates/173-06-harness`** — first attempt, exit 0, on tree `262854acd`, on battery power under `caffeinate -dimsu`, window 16:12:22 to 16:14:18 local, `sleep_entries_in_window: 0`. Judged as a subset: without `--rows` the verdict exits 1, as it must.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 42 |
| unit | 0 | 55 |

Frontend unit tests: 2290 passed and 7 skipped in 143 files, unchanged. The tests-utility Vitest files are in no gate row (`yarn test:unit` does not collect `tests/vitest.config.ts`); they were run by hand, above.

**A negative control on the refusal.** With one line added to the builder so that an unfilled param is passed through as text, the two files go red with four failures (the three refusal cases of `buildRoute.test.ts` and the one of `contestantEntityUrl.test.ts`); restored, 43 pass. Each family of re-pointed assertions has a rejection case in `contestantEntityUrl.test.ts`: the profile pattern rejects the questions, login, home and preview paths and a path outside the app; the exact-questions pattern rejects a question page; the child pattern rejects the overview and a deeper path; the home pattern rejects every sub-page; the outside pattern rejects the profile page in both shapes and any URL outside the app; every pattern but the outside one rejects an unserved type and a malformed uuid.

**No E2E run was made, and none was added.** The plan rules that 173-07's full run, compared per project with `173-01-baseline`, is the boundary proof. The optional run the handover allowed was not made: the re-pointing is mechanical, each pattern is unit-tested against both URL shapes, and the suite lists its 180 tests. No directory under `tests/e2e-runs/173-e2e/` belongs to this plan, the stack was not touched, and no dev server was started (nothing listened on 5173 or 5273).

## What in 173-07's run would point back here

- A URL assertion failing on a page whose URL has not changed — look first at the three places the helper is tighter than what it replaced (below).
- An error `buildRoute: the param "…" of route "…" … is not filled` from a spec or fixture. No caller on the tree passes a route with a param (measured: every `buildRoute(` call names a param-less key), so on an unmoved tree this cannot fire; after 173-08 it fires for any plain `buildRoute` call on an entity key.
- A project whose test count differs from the baseline's, or a spec that fails to load on an import of `contestantEntityUrl`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's Vitest command found no test file**
- **Found during:** Task 1
- **Issue:** `yarn vitest run --config tests/vitest.config.ts <filter>` exits 1 with "No test files found" from the repository root — on the starting tree too (`… preflight` on `049954855`). The config's `include` (`tests/utils/**/*.test.ts`) was read against the directory the run started from; only `cd tests && … --config vitest.config.ts` collected anything. The plan's `<automated>` checks of Tasks 1 and 3, and two commands of 173-08, use the from-root form, which the config's own docblock also gives.
- **Fix:** `tests/vitest.config.ts` states `root` as its own directory. Both forms now collect the same 5 files.
- **Files modified:** `tests/vitest.config.ts` (not in the plan's file list)
- **Commit:** `8a8a7a877`

**2. [Rule 2 - Missing piece] A fifth builder**
- **Found during:** Task 1
- **Issue:** the profile fixture's "has left the profile page" cannot be stated with the plan's four builders without hand-writing the entity segment in the fixture.
- **Fix:** `contestantUrlOutsideRe(subPath)`: under the app's root, and not the named page or anything below it, in either shape. It keeps the fixture at one assertion.
- **Commit:** `8a8a7a877`, used in `262854acd`

**3. [Rule 1 - Consistency] The builder's own test used entity route keys**
- **Found during:** Task 2
- **Issue:** Task 1's `buildRoute.test.ts` called the plain `buildRoute` with `ContestantAppQuestion` and `ContestantAppProfile`, which Task 2's second acceptance criterion forbids and 173-08's move would have broken.
- **Fix:** it uses `Question`, `AdminAppJob`, `About` and `ContestantAppLogin`.
- **Commit:** `262854acd`

### Measured, not bent

- **`tests/README.md` had no place that tells an author how to assert a contestant URL or build a contestant route.** One bullet naming the helper, `contestantUrlRe` and `buildEntityLessRoute` was added to the fixture taxonomy; nothing else.
- **The name gate's `/candidate URL` expression already lists `contestant` in its lookbehind** (the research measured it absent), so a literal `/contestant/candidate/…` is no finding today. The helper spells the alternation and the tests interpolate the type regardless. One finding did occur and was removed: `'/list/a/candidate'` in a local route table of `buildRoute.test.ts`.
- **What the helper tightened and loosened beside the optional segment.** Tighter: `'exact'` and `'child'` are anchored at the end of the path (`/contestant/profile/x` is not the profile page; `/contestant/questions/a/b` is not a question page), and `'any'` rejects `/contestant/questionsX`. Looser: `'exact'` accepts a trailing slash and a fragment for both of its callers, where the journey's overview pattern accepted no trailing slash and the localisation spec's no fragment — the union of the two hand-written forms, chosen so that no URL either accepted is refused. Neither names a different page.
- **Where the handover and the plan differ, the plan was followed:** no full E2E run.
- **Not read in full:** `173-05-SUMMARY.md` beyond its frontmatter, and the bodies of `173-07-PLAN.md` and `173-08-PLAN.md` beyond every line that names this plan or its helper; the name map's `## After 173-05` and its closing list were read whole.

## Known Stubs

None.

## Deferred Issues

None filed.

## Next Phase Readiness

- **173-07** runs the full gate set and the full suite; that run is this plan's boundary proof, judged with `--same-projects-as 173-01-baseline`. The gate set resets the database; this plan reset nothing.
- **173-08** removes the trailing `?` of `ENTITY_SEGMENT_SOURCE` and updates `contestantEntityUrl.test.ts` (its `ROOTS` list holds the entity-less root; `BAD_ROOTS` and the outside pattern's cases need a read). `buildEntityLessRoute` already drops `[entityType…]` and `[entityId…]` in each of their forms (`dropEntitySegments` is tested on the future route ids). Any plain `buildRoute` call on an entity key will throw from then on, naming the param.
- **173-12** can build a path with an entity through `buildRoute({ route, locale, params: { entityType, entityId } })`.
- The name map's closing list gained items 27 to 31.

## Self-Check: PASSED

- Created files exist: `tests/tests/utils/buildRoute.test.ts`, `tests/tests/utils/contestantEntityUrl.ts`, `tests/tests/utils/contestantEntityUrl.test.ts`.
- Commits are ancestors of HEAD: `8a8a7a877`, `262854acd`, `8f1aec033`.

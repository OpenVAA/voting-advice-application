---
phase: 176-contestant-home-task-state-nominations-view
plan: 08
subsystem: frontend
tags: [route-group, server-load, no-nomination, gate, redirect, focus, e2e, tdd]
requires:
  - phase: 176-06
    provides: the entity-level load that serves an entity with no nomination, and hasNomination
  - phase: 176-07
    provides: the perm-no-nomination dataset, its sessions, composition root and state steps
provides:
  - the route group `(nominated)` under the entity, holding profile, questions and preview
  - the group's server load — a 307 to the entity's home while the entity has no nomination — with a server test and a read-recording test
  - `CONTESTANT_NOMINATED` in route.ts and four route ids built from it
  - the fixture `contestantEntityPages` on the no-nomination root
  - five `gate:` tests and one `holds:` test in the no-nomination spec
  - the per-project baseline `176-08-close` (279 tests, 113 projects)
affects: [176-09, 176-10, 176-12, 176-13, 176-14, 176-15, 176-16, 176-17, 176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "A route group whose only file is a server load: the first in the tree, accepted by svelte-kit sync, svelte-check, the route-consistency test and the build"
    - "A server test that asserts a redirect target's locale replaces the runtime stub's localizeHref with one that prefixes a non-base locale"
key-files:
  created:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.server.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/layout.tracking.test.ts"
    - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/routes/route.test.ts
    - apps/frontend/src/lib/routes/routeConsistency.test.ts
    - tests/tests/utils/contestantEntityUrl.test.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/README.md
decisions:
  - "The group is (nominated); its prefix is the exported constant CONTESTANT_NOMINATED"
  - "The gate reads params only on the path that builds a target, and decides on the parent's nominations list alone"
  - "The 'nomination the administrator adds' assertion is two tests, one per session, because a test runs under one stored session"
metrics:
  duration: ~35 min (02:50Z → 03:25Z)
  completed: 2026-10-09
status: complete
requirements-completed: []
actuals:
  tokens: 14969
  tasks: 3
  commits: 6
commits: 6
plan_head_before: 5411de1043de9544850a1a056b847f8931292e33
plan_head_after: b677af431977dd5c6460f4288d18e526646b06a0
---

# Phase 176 Plan 08: The No-Nomination Gate of the Profile, the Questions and the Preview — Summary

**The profile, the questions and the preview sit in one route group, `(nominated)`, whose server load sends an entity with no nomination to its own home with a 307 before any of them renders; every URL is what it was; a browser shows it for a candidate and for a party, shows a nomination opening the profile at the next full load, and shows a stale entry ending on home with focus on its heading; the full suite is 279 of 279 in 113 projects.**

Everything below was measured in this session unless it says "read" or "not done".

## Read this first

1. All three tasks are done. The three `<automated>` blocks, run byte for byte from the plan with `bash`, each exit **0**.
2. **Assumption A1 holds.** Every `gate:` test was red on the tree with no gate and is green with it, on the first attempt: one control, one pre-commit run, one full run; no `-rN`, no void run, nothing retried.
3. **No state-step defect.** The insert branch of `setNominationState` (`'pending'` on an entity with no row, through `bulkImport`) ran for the first time here, for a candidate and for an organization, and worked.
4. **`requirements-completed` is empty on purpose.** NOM-07 has a second half (the entries on home and in the menu, plans 176-14 to 176-16) and the preview's own rule (176-10).
5. Six commits, not the plan's four: one test correction and one README line (deviations 4 and 5).

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `20d796752` | `test(176-08): fixture steps that open an entity's page by URL` | 1 |
| 2 | `cc95abf5a` | `refactor(176-08): the profile, the questions and the preview move under one route group` | 2, step 1 |
| 3 | `b2fc5b1b4` | `test(176-08): the gate of the pages an entity needs a nomination for` | 2, step 2 (red) |
| 4 | `46273d08d` | `test(176-08): the gate's server test reads the locale from the target` | 2, a correction of the red test |
| 5 | `51135044a` | `docs(176-08): the tests README names the fixture that opens an entity's pages by URL` | 3, checklist |
| 6 | `b677af431` | `feat(176-08): the profile, the questions and the preview lead to the entity's home while it has no nomination` | 3, after `control … --green --were-red-in` passed |

All by pathspec on `feat/entity-signup-multi-grant`. Commit 6 holds exactly the load and the spec.

## Each verify, with its real exit status

Scripts extracted from the plan by a script; evidence in `tests/e2e-runs/176-unit/176-08-t<N>-verify.{sh,log,exit,head}`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `20d796752` (spec uncommitted) | **0** |
| Task 2, as written | `46273d08d` (load and spec uncommitted) | **0** |
| Task 3, as written (after the full run) | `b677af431` | **0** |
| `176-verdict.mjs control 176-08-control … --red "gate:"` | run head `20d796752` | **0** — PASS |
| the same run offered with `--green` | | **1** — refuses (`FAIL (6)`) |
| `176-verdict.mjs control 176-08-precommit … --green --were-red-in 176-08-control` | run head `51135044a` | **0** — PASS |
| the same run offered with `--red "gate:"` | | **1** — refuses (`FAIL (6)`) |
| `176-verdict.mjs gates 176-08-close --rows typecheck,lint,unit,check-frontend,build,format` | `b677af431` | **0** — PASS |
| `176-verdict.mjs e2e 176-08-close …` as in Task 3 step 3 | `b677af431` | **0** — PASS |

## The group and the move

**The constant, as written in `apps/frontend/src/lib/routes/route.ts`:**

```ts
export const CONTESTANT_NOMINATED = `${CONTESTANT_ENTITY}/(nominated)`;
```

with a doc block saying which pages it holds and why. **The four route ids:**

| Key | Value |
|---|---|
| `ContestantAppPreview` | `${CONTESTANT_NOMINATED}/preview` |
| `ContestantAppProfile` | `${CONTESTANT_NOMINATED}/profile` |
| `ContestantAppQuestion` | `${CONTESTANT_NOMINATED}/questions/[questionId]` |
| `ContestantAppQuestions` | `${CONTESTANT_NOMINATED}/questions` |

`ContestantAppEntityHome` and `ContestantAppSettings` are unchanged. With `ENTITY` = `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]`:

| Old path | New path |
|---|---|
| `ENTITY/profile/` (`+page.svelte`, `page.svelte.test.ts`) | `ENTITY/(nominated)/profile/` |
| `ENTITY/questions/` (`+layout.svelte`, `+page.svelte`, `[questionId]/+page.svelte`, `layout.svelte.test.ts`) | `ENTITY/(nominated)/questions/` |
| `ENTITY/preview/` (`+page.svelte`, `page.svelte.test.ts`) | `ENTITY/(nominated)/preview/` |

Eight files, each a pure rename (`git mv`); no moved file needed an edit — none holds a relative import that leaves its directory. `settings/` and the home are where they were.

**Every other path the move changed** (found by `git grep -F` for the three `[entityId=uuid]/<page>` forms over `apps/frontend/src`, `tests`, `scripts`, `packages`, `apps/docs/src` and `.claude`):

- `lib/routes/route.test.ts` — the literal profile route id in the `isApiRoute` negative list.
- `lib/routes/routeConsistency.test.ts` — two doc examples of a route id.
- `tests/tests/utils/contestantEntityUrl.test.ts` — one hand-written route id **and its expected value**: `dropEntitySegments` keeps group segments, so the expectation is now `/contestant/(protected)/(nominated)/profile`. (The plan speaks of two hand-written ids; the second is the short form `/contestant/[entityType]/[entityId]/questions/[questionId]`, which names no group and is unchanged.)
- Five fixture docstrings that name a page file by path (the plan says four): `contestantNoQuestionsPage`, `contestantPreviewPage`, `contestantProfilePage`, `contestantQuestionPage`, `contestantQuestionsOverviewPage`.
- One spec comment: `specs/perm/perm-disable-allow-open.spec.ts`.
- Three dev-seed template header comments that name a page file by path: `perm-disable-allow-open.ts`, `perm-hide-hero.ts`, `perm-localisation-positive.ts` (not in the plan's list).
- No hit under `apps/docs/src` or `.claude` for those forms.

**On the moved tree, before the commit** (`176-08-move-gates.log`): svelte-check exit 0 (it syncs the generated route types first); `vitest run src/lib/routes` 9 files, 178 passed, the route-consistency test among them; the frontend's whole unit suite 3385 passed, 20 skipped; the harness's own 102; `typecheck:tests` 0; dev-seed `typecheck` 0. **A route group whose only file is a server load** was then checked on its own before the red commit: svelte-check 0 and the route tests 178 passed with `+layout.server.ts` in place and no `+layout.svelte` beside it; the build row of the closing gate set is 0 too.

## The load

`ENTITY/(nominated)/+layout.server.ts`. Its stages, as its docblock numbers them:

1. **The parent.** `await parent()` first. While a user-level gate is pending (`parentData.gate !== null`) it returns `{}` and redirects nowhere.
2. **No entity data.** When `parentData.contestantUserData?.nominations` is missing it returns `{}`; the entity layout shows its own error view.
3. **No nomination.** `!hasNomination(nominations)` → `redirect(307, buildRoute({ route: 'ContestantAppEntityHome', locale: getLocale(), entityType: params.entityType, entityId: params.entityId }))`.
4. **A nomination.** It returns `{}`.

**What it reads:** `params` and `parent` from the event and nothing else; of the params, `entityType` and `entityId`, and only on the path that builds the target; no `url` property, no `route`, no `locals`, no `fetch`; it adds no dependency key and invalidates nothing. It imports `hasNomination` from `$lib/contestant/tasks` — the predicate the entity-level load and the context ask. It signs nobody out. The docblock also says why a rule asked on every arrival at one page (the preview's) does not belong here.

**The server test** (`layout.server.test.ts`, 11 cases): a gated parent resolves `{}` (candidate, organization); a parent with no entity data resolves `{}` (both); an empty list is a 307 to `/contestant/<type>/<id>` (both); the target is built in the request's locale (`fi`, `sv`); one nomination resolves `{}` (both); an unconfirmed nomination and several resolve `{}`. Every case asserts the sign-out spy of the fake locals was never called.

**The tracking test** (`layout.tracking.test.ts`, 19 cases, on `loadTracking.testUtils.ts` three levels up): for each of eight URLs of the group (profile, questions, a question page, preview, each with and without a query string) — an entity with a nomination is served with no tracked URL read, no route read, no param but the two entity params and no event member but `params` and `parent`; an entity with none is redirected having read exactly `entityId` and `entityType` and exactly `params` and `parent`. Three control cases at the foot, one per instrument, none importing the real load.

## Red and green (unit)

| Report | Head | Total · passed · failed |
|---|---|---|
| `176-08-gate-red` | `b2fc5b1b4` (a load that awaits its parent and returns `{}`) | 30 · 18 · **12** — the four redirect cases of the server test (`expected undefined to match object { status: 307, … }`) and the eight redirect cases of the tracking test (`promise resolved "{}" instead of rejecting`); every other case passed |
| `176-08-gate-green` | `46273d08d` with the load uncommitted | 30 · 30 · **0** |

Frontend unit suite with the load in the working tree: 187 files; **3415 passed**, 20 skipped (3385 + 30). svelte-check 0; ESLint, Prettier, `assert:comment-hygiene` and `assert:no-session-in-loads` (the script exists) each 0.

## The fixture — `tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts`

`createContestantEntityPages(page, admin)`, registered on the no-nomination root as `contestantEntityPages`; exports the type `ContestantEntityPage = 'profile' | 'questions' | 'preview'`.

| Step | What it does |
|---|---|
| `open(entity, entityPage)` | a full load of that page's URL under the entity (type, and the id of the row with its external id) |
| `openWithoutEntity(entityPage)` | a full load of the entity-less form (`buildEntityLessRoute`) |
| `openHome(entity)` | a full load of the entity's home |
| `expectOnHome(entity)` | the URL matches `contestantHomeUrlRe()` and carries the entity's type and id; `contestant-home-status` is visible |
| `expectOnProfile(entity)` | the URL matches `contestantUrlRe('/profile')` and carries the type and id; `contestant-profile-identity` is visible |
| `clickHomeProfileEntry()` | a click on `contestant-home-profile`, a navigation inside the application |
| `expectHomeHeadingFocused()` | the first-level heading `toBeFocused` |

Every wait is an `expect` with a timeout from `TIMEOUTS`, so a missing surface fails as an expectation.

## The spec's tests and the control

A second top-level describe, `perm-no-nomination: the pages an entity needs a nomination for`, with one describe per session:

| Session | Title |
|---|---|
| unnominated candidate | `gate: a candidate with no nomination is led to its home from its profile, its questions and its preview` |
| unnominated candidate | `gate: an entry the browser still shows open is redirected to home, with focus on its heading` |
| unnominated candidate | `gate: a nomination the administrator adds opens the profile at the next full load, for a candidate` |
| unnominated organization | `gate: a party with no nomination is led to its home from its profile, its questions and its preview` |
| unnominated organization | `gate: a nomination the administrator adds opens the profile at the next full load, for a party` |
| nominated candidate | `holds: a candidate with a nomination opens its profile` |

Each begins with its state step. The two "led to its home" tests open the three URLs under the entity and then the three entity-less forms: twelve closed URLs in all.

**The control** — `tests/e2e-runs/176-e2e/176-08-control`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `20d796752` with the spec alone uncommitted (the copy as run: `176-08-control.perm-no-nomination.spec.ts`). Launched 02:54Z. **205 total, 200 passed, 5 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1 (the five), no void marker. Docker VM free before: 19.19 GiB; AC power, 100 %. Verdict `--red "gate:"`: **PASS** — "5 test(s) named by 'gate:'; 200 other test(s)". The first error line of each of the five is the same:

```
Error: expect(page).toHaveURL(expected) failed
```

— the home-URL assertion of `expectOnHome`, in each test at the first step that expects a closed URL to have led home. The `holds:` test and the three `dataset:` tests passed.

## Assumption A1

**Held.** In the pre-commit run and again in the full run:

- a typed URL of the profile, the questions and the preview, under the entity and in the entity-less form, ends on the entity's home for a candidate and for a party (research steps G and the two-redirect form);
- a nomination the administrator adds behind the user opens the profile at the next full load, for both types;
- a client-side navigation from home into the group after the nomination was removed behind the user ends on home (step F2): the group's `await parent()` reran the parent loads on the server, which saw no nomination.

No client-side redirect was added and none was needed.

## Where focus lands after a redirect

In the stale-entry test the browser is on home with a pending nomination, the nomination is removed, and the home's profile entry is clicked. The server answers the data request with the redirect; the browser stays on home and **the first-level heading has focus** (`toBeFocused`, green in `176-08-precommit` and `176-08-close`). The protected layout's own handling requests nothing in that path (read in the research, not instrumented here); the root layout's post-navigation reset is what the assertion observes.

## The pre-commit run

`tests/e2e-runs/176-e2e/176-08-precommit`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `51135044a` with the load and the spec uncommitted (`176-08-precommit.diff`, the spec as run and `176-08-precommit.+layout.server.ts.kept` beside it). Launched 03:06:38Z. Wrapper exit 0, no void marker. **205 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; `perm-no-nomination: 9 test(s), 9 passed`. Verdict `--green --were-red-in 176-08-control`: **PASS**, the five "was red, now passed". No test of another spec met the gate. Before the commit `git diff HEAD` was byte-equal to the kept diff (`cmp` exit 0). Docker VM free before: 19.15 GiB.

## The gate rows and the full run

**Gate rows `176-08-close`** — `tests/e2e-runs/176-gates/176-08-close`, head `b677af431`, driver exit 0, verdict **PASS**: typecheck 0, lint 0, unit 0, check-frontend 0, build 0, format 0; not stale; no Sleep entry in the window.

**Full run `176-08-close`** — `tests/e2e-runs/176-e2e/176-08-close`, through `176-e2e.sh 176-08-close --require-project perm-no-nomination`, head `b677af431`, 03:16:12Z → 03:23:51Z. Driver exit 0, no void marker. Docker VM free before: **19.07 GiB** (the driver's reading); after: 19.01 GiB. AC power.

```
counts: total 279, passed 279, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head b677af431 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 9/9 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project contestant-entity-selection: 8/8 passed
compared with: tests/e2e-runs/176-e2e/176-07-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-08-close: PASS
```

**Per project against `176-07-close` (273 in 113):** 112 projects at their totals; `perm-no-nomination` 3 → 9. 273 + 6 = 279. The whole table is `176-08-close.verdict.txt`. **`176-08-close` is the per-project baseline for plan 176-09.**

No axe finding and no width overflow: both a11y projects are at their totals, and this plan adds no markup.

## The code review checklist

Over the route ids, the load, its two tests, the fixture and the spec's tests.

| Item | Outcome |
|---|---|
| Solves the issue | yes for this plan's half of NOM-07: the three pages cannot be reached by URL without a nomination |
| OWASP top 10 | the gate decides on rows the server read in the request and on two params the route's matchers admitted; the target comes from the route builder and a route key, so no open redirect (T-176-30, T-176-32); it returns at once while a user-level gate is pending (T-176-33). It is a rule about which pages open, not a data control: an entity with no nomination can still write its answers through the API, as the research states |
| Code style guide | ESLint and Prettier 0 (lint and format rows) |
| No `any` | none |
| No repetition | the test scaffolding of the two new test files follows their in-tree analogs, as the plan orders. `expectOnHome` overlaps `contestantEntityHomePage.expectLanded` and `contestantNoQuestionsPage.expectOnHome` in what it asserts; the plan prescribes the step on this fixture. Not changed |
| New entities documented | TSDoc on the constant, the fixture's exports and every step; the load's docblock |
| Repo markdown updated | `tests/README.md` names the new fixture (`51135044a`) |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | missing entity data is left to the entity layout's error view; nothing is swallowed |
| Failing checks | none at the closing head. At `b2fc5b1b4` and `46273d08d` twelve unit cases are red by design (the red commit) |
| Parts sharing the dependency | the full run holds every other project at its total |
| WCAG, keyboard and screen reader | no markup changed; where focus lands after a redirect is asserted by the spec |
| Docs guides | the docs page that names the page files by path is plan 176-19's (the plan's ruling 5); the search above found no hit for the literal route-id forms under `apps/docs/src` |
| Comment hygiene | `assert:comment-hygiene` 0 before each commit; every added comment and title read: no history, no plan, decision or assumption id |
| Commit history | linear; fixture, move, red tests, test correction, README, gate |
| No fixes of itself | **one**: `46273d08d` corrects the test committed in `b2fc5b1b4` (deviation 4). To be squashed when the branch is shipped |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter, Edge Function sections | name nothing this plan touches |

No finding needed a change before the pre-commit run.

## Deviations from Plan

**1. Five `gate:` tests, not four.** The plan's fourth test covers "each of `ca-none` and `or-none`" in one test; a test runs under one stored session, so it is two tests, one per session, whose titles end `, for a candidate` and `, for a party`. The control and the green proof name five.

**2. The fixture's waits use `TIMEOUTS.slowPage` (10 s)** for the URL and the settle marker after a load, as `contestantEntityHomePage.expectLanded` does, and `TIMEOUTS.page` for the focus assertion. The plan says "the suite's page timeout"; each is an `expect` timeout, so a missing surface still fails as an expectation.

**3. Files outside the plan's list**, each a comment or a doc that the move or the fixture made false: `lib/routes/routeConsistency.test.ts`; five fixture docstrings and one spec comment under `tests/tests`; three dev-seed template headers; `tests/README.md`.

**4. [Rule 1 — a wrong test] The server test's two locale cases expected a locale prefix the test runtime does not produce.** I assumed the shared runtime stub's `localizeHref` prefixes a path; it returns the path unchanged, so with the real load the two cases failed (`176-08-green-gates.log`: 2 failed). The test now replaces `localizeHref` with one that prefixes any locale but the base one, which also makes the cases able to tell the locales apart. Fixed in `46273d08d`, a commit of its own, before the pre-commit run. The red report is of the file as first committed.

**5. A docs commit** (`51135044a`) for the README line, before the pre-commit run, because `tests/README.md` is outside the verdict's `--dirty-only` directories.

**6. The tracking test's "served" cases assert containment, not equality**, of the param and event reads (no param but the two; no member but `params` and `parent`; `parent` taken), because the load reads the params only when it builds a target. The "redirected" cases assert both exactly. This is also what lets the undeciding load of the red commit pass the served cases.

**7. Two gates ran in the foreground**: svelte-check and the route tests inside the red commit's script (about 15 s), and Task 2's verify. Every E2E run, the gate set and the whole unit suite ran in the background and were polled.

**8. One `rm -f` named a marker under `tests/e2e-runs/176-unit/`** (`176-08-move-gates.exit`) before its first run. The file did not exist; nothing was deleted. It should not have been written.

**9. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not a per-agent branch.

Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## For plans 176-09 to 176-18

- **176-10 (the preview's own rule):** the load goes into `ENTITY/(nominated)/preview/+page.server.ts`. Its `await parent()` yields the merged data of the user-level load, the entity-level load and this group's load (which adds nothing): `gate`, `user`, `entities`, `questionData`, `contestantUserData` (`entity`, `nominations`). Check `gate !== null` first and a missing `contestantUserData` second, as the group does. From that directory the tracking utilities are `'../../../../loadTracking.testUtils'`. A case that asserts the target's locale needs the `localizeHref` replacement of this plan's server test. An entity with no nomination never reaches that load on a full load — the group redirects first.
- **176-09 (the questions redirect):** this plan asserts nothing about the questions URL of an entity that has a nomination. For one that has none, the questions URL and the entity-less form end on home (asserted for both types).
- **Any plan that adds a page under the entity:** inside `(nominated)` it is closed without a nomination and its route id is built from `CONTESTANT_NOMINATED`; outside (as `settings/`, and the nominations view) it is not. `routeConsistency.test.ts` holds both directions.
- **Any plan that adds tests to the spec:** the fixture `contestantEntityPages` is on the root. A one-project run of `perm-no-nomination` is now 205 tests; the full run is 279 in 113 projects.
- **The state steps:** `setNominationState` has now run `'none'` (delete and no-op), `'pending'` as an insert for a candidate and for an organization, and `'confirmed'` on the seeded row. **Still called by no test:** `'confirmed'` or `'pending'` as an update of an existing row's `confirmed`, `setAnswers`, `setNominationsLocked`.
- **Backstops not exercised here:** accepting the terms of use at a closed URL (research A5); an entry closed because the administrator added a required question (the preview's rule, 176-10).
- **Not fixed, for the closing plan:** `inFreshContext` duplicated in the two session-storing setups (plan 176-07's finding; this plan touched neither file); commit `46273d08d` is a fix of `b2fc5b1b4`.

## For Phase 177

The gate sees a nomination only through the entity-level load: it reads `parentData.contestantUserData.nominations`. On a navigation from outside the group into it, the group's `await parent()` reruns the parent loads on the server, so the gate itself decides on fresh rows — but the browser's copy of the entity's data, and with it `contestantCtx.nominations` and the task state, stays that of the last load. **A nomination written by the user must rerun the entity-level load** (it has no dependency key and depends on the two entity params alone) for home, the menu and the task state to follow; inside the group nothing reruns the group's load at all.

## The state the local database is left in

Read with `psql` after the full run: schema the tree's, no reset made by this plan; 3 projects; 377 nominations, all in the default project (the `default` dataset, untouched); 2 auth users; no row under `e2e-perm-no-nomination-` left; **`private.invitation_link_witness`: 30 rows** (the known pgTAP finding without a reset); pgTAP helpers still in `public`. The stack is up and was not restarted; nothing pruned but the build cache, by the driver. Nothing listens on the wrapper's port. Docker VM free: 19.01 GiB.

## Not done, or not verified

- The two backstop truths (terms of use accepted at a closed URL; a required question added behind the user).
- No assertion at the HTTP level that the response to a closed URL is a 307 and that no frame of the closed page was painted: the unit test shows the load throws the redirect on the server, and the spec shows where the browser ends.
- The dev-server logs of the runs were not read for warnings.
- `pmset -g log` was not read by hand: every run is green and each verdict's power line reports no Sleep entry.
- pgTAP, the SQL lint and the database rows of the gate set were not run (the plan names six rows).
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not edited; none was searched for a sentence this plan made false. `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Files touched that the plan did not list

`apps/frontend/src/lib/routes/routeConsistency.test.ts`; `tests/tests/fixtures/contestant/contestant{NoQuestions,Preview,Profile,Question,QuestionsOverview}Page.fixture.ts`; `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`; `packages/dev-seed/src/templates/e2e/perm/{perm-disable-allow-open,perm-hide-hero,perm-localisation-positive}.ts`; `tests/README.md`.

Gitignored evidence: in `tests/e2e-runs/176-e2e/`: `176-08-control/` with `.perm-no-nomination.spec.ts`, `.verdict.txt`, `.refusal.txt`, `.dockerfree.txt`; `176-08-precommit/` with `.diff`, `.perm-no-nomination.spec.ts`, `.+layout.server.ts.kept`, `.verdict.txt`, `.refusal.txt`, `.dockerfree.txt`; `176-08-close/` with `.verdict.txt`. `tests/e2e-runs/176-gates/176-08-close/`. In `tests/e2e-runs/176-unit/`: `176-08-t1-verify.*` to `-t3-verify.*`, `176-08-gate-red.*`, `176-08-gate-green.*`, `176-08-move-gates.*`, `176-08-green-gates*`, `176-08-commit-move.*`, `176-08-commit-red.*`, `176-08-control-run.*`, `176-08-precommit-run.*`, `176-08-gates-close.*`, `176-08-gates-verdict.log`, `176-08-e2e-close.*`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-30: the load's inputs and the tracking test. T-176-31: a server redirect, no client redirect added. T-176-32: the route builder and a route key. T-176-33: the gated-parent cases. T-176-34 and T-176-83: the load and the spec held uncommitted through `control … --green --were-red-in`, then one commit.

## Self-Check: PASSED

- The four created files are tracked; `20d796752`, `cc95abf5a`, `b2fc5b1b4`, `46273d08d`, `51135044a` and `b677af431` are ancestors of HEAD; `git rev-list --count 5411de104..b677af431` is 6.
- `176-08-t1-verify.exit`, `-t2-` and `-t3-` each hold 0; the two control verdicts, the gate verdict and the E2E verdict exit 0 and the two refusals exit 1; no run directory holds a void marker.
- `git diff --quiet 5411de104 HEAD -- .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md CLAUDE.md` exits 0.
- `git status --short` before this file was written showed the untracked `CAND-APP-PLAN.md` alone.

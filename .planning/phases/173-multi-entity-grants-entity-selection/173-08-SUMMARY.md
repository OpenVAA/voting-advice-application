---
phase: 173-multi-entity-grants-entity-selection
plan: 08
subsystem: frontend
tags: [sveltekit, routing, load, route-params, contestant-app, svelte5, playwright, docs]

requires:
  - phase: 173-07
    provides: the user-level and entity-level loads in the `(entity)` route group, `signOutToLogin`, the read-recording guards, `contestantHomeRoute` and the context's `homeRoute`
  - phase: 173-05
    provides: the param matchers `servedEntityType`, `uuid` and `contestantEntityPage`; the context's `entities` and `selectedEntity`
  - phase: 173-06
    provides: the tests' route builder and `contestantEntityUrl.ts`
  - phase: 173-02
    provides: `get_user_entities` and `get_entity_user_data`, which agree on what a user edits
provides:
  - the entity pages served at `/contestant/<entityType>/<entityId>/…`, under route params named `entityType` and `entityId`
  - the app root's server decision (one entity redirects to its home; otherwise the interim `loginFailed` sign-out)
  - the resolver for a protected path that names no entity (`ROUTE.ContestantAppEntityResolver`)
  - the entity-level refusal: one indistinguishable 307 to the app root for any entity the user may not edit
  - read-recording guards on all four loads, each with negative controls
  - the menu's entity items gated on `selectedEntity`
  - a tests-side URL helper that requires the entity segment, with builders for the app root
  - the stage-3 close: gate set and full E2E suite green on one tree, per-project totals equal to the baseline
affects: [173-09, 173-10, 173-11, 173-12, 173-13, 174, 176]

actuals:
  tokens: 42900 # chars/4 over the realized diff outside .planning/ (171696 chars, 53 files)
  tasks: 5
  commits: 11
plan_head_before: 615716810bffc017924b56213e38d4f2bdbedb85
plan_head_after: 034e6ef97465589f1c623a9c44b849a5fbf5e1bd

tech-stack:
  added: []
  patterns:
    - "the selected entity is the URL: two matcher-guarded route params above every entity page, filled by the route builder from the current page"
    - "a server decision per level: the root and the resolver redirect on the user-level list, the entity-level load refuses on the same list before it reads"
    - "one refusal for every reason: the same status and target, no sign-out, nothing that differs by whether an id exists"
    - "a matcher-guarded rest route as the resolver of paths that name no entity, with the decoded segment re-validated in the load"

key-files:
  created:
    - apps/frontend/src/routes/contestant/(protected)/+page.server.ts
    - apps/frontend/src/routes/contestant/(protected)/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/page.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/page.tracking.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts
    - apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.tracking.test.ts
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/lib/i18n/tests/__mocks__/app-paths.ts
    - tests/tests/utils/contestantEntityUrl.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md

key-decisions:
  - "The plan was executed by three executors: Task 1; Tasks 2 to 4; Task 5."
  - "The user-level load reads `params.entityType` and `params.entityId` as its dependency, as the plan and the research say, over an orchestrator clause that said otherwise."
  - "The resolver re-validates the decoded question segment against a plain-id pattern: the matcher sees the segment undecoded and admitted an encoded path traversal. Flagged for security review."
  - "The entity read is keyed by the entry found in the user's list, not by the raw params."
  - "The first instrument pair was green; the journey spec then gained menu-link assertions, so both instruments were made again on the final tree as `173-08-move-r2`."
  - "`userNoCandidate` was dropped from the docs paragraph on the protected loads, because no load emits it; 173-07 had left that mention for 173-10."

patterns-established:
  - "A URL assertion on a contestant entity page goes through `contestantUrlRe`/`contestantHomeUrlRe`, which reject a path without an entity; the app root has `contestantAppRootUrlRe` and `isContestantAppRootPath`."
  - "How often a load ran over a suite run is counted at the API gateway (`docker logs supabase_kong_openvaa-local`, by run window), since no trace of a passing test is kept."

requirements-completed: []

duration: not measured for the whole plan (three executors); Task 5 about 40 min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 08: The selected entity is the URL Summary

**Every entity page of the Contestant App is served at `/contestant/<entityType>/<entityId>/…`; the root and a path that names no entity resolve on the server to the user's single entity, an entity the user may not edit is answered with one quiet redirect, and the full suite is green at 180 of 180 with every project at its baseline total on the first browser run of the move.**

`requirements-completed` is empty on purpose: the plan's requirements are ENT-01 and ENT-02, and the orchestrator owns `REQUIREMENTS.md`. This plan closes stage 3 (the route tree); the root's two remaining outcomes for ENT-02 are 173-10's.

## Performance

- **Started:** first commit 2026-10-06T14:11:56Z; Task 5 from about 14:35Z
- **Completed:** 2026-10-06T15:10Z
- **Tasks:** 5 of 5
- **Files changed outside `.planning/`:** 53 (11 added, 11 moved, 29 modified, 2 deleted and re-created under the new directory); 1797 insertions, 473 deletions
- **Commits:** 11 on `615716810..034e6ef97`, measured with `git rev-list --count`; the commit of this summary is the twelfth

## Accomplishments

- The thirteen files of the entity group live under `contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`; the six entity route keys are built on one prefix, and no page passes either param when it builds a link.
- The app root decides on the server: a pending gate renders at the root, a user with exactly one entity is redirected to its home, any other user is signed out with `loginFailed` (interim).
- A protected path that names no entity (`/contestant/profile`, `/contestant/questions/<id>`, …) is redirected to the same page under the user's entity, or to the root.
- A URL that names an entity the user may not edit is a 307 to the app root, the same for every reason, before any entity read; a malformed segment is a 404 by the matchers.
- Each of the four loads is held by a read-recording guard with negative controls; the menu builds entity links only where the URL names an entity.
- The tests' URL helper requires the entity segment, the journey asserts where the signed-in menu's links lead, and the docs and source comments cite the pages where they are.

## Task Commits

1. **Task 1: the rename** - `8d24512a5` (refactor: thirteen files moved, every row `R100`; red alone by design) and `b59022d65` (refactor: `CONTESTANT_ENTITY` = `${CONTESTANT_PROT}/[entityType=servedEntityType]/[entityId=uuid]`, one import)
2. **Task 2: the root** - `baae66d8b` (test: the `$app/paths` stub resolves route ids by SvelteKit's rules and throws `Missing parameter`) and `b1ac91dc3` (feat: the root's load and empty page, its tests and guard; the user-level load reads the two entity params)
3. **Task 3: the resolver** - `a67097553` (feat: `ROUTE.ContestantAppEntityResolver`, its load, tests and guard)
4. **Task 4: the refusal and the menu** - `da3f163f1` (feat: the entity-level load's membership check and refusals; the menu's gate; `ContestantNav.svelte.test.ts`)
5. **Task 5: the close** - `6ea6d26af` (test: the helper requires the entity segment), `29fe409e9` (docs: citations of the moved paths, 18 files), `24f23def5` (docs: the regenerated route map and menu page), `1afcbe1b6` (test: the journey's menu-link assertions), `034e6ef97` (docs: the name map)

## The final route ids

| Route key | Route id |
|---|---|
| `ContestantAppEntityHome` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]` |
| `ContestantAppProfile` | `…/[entityId=uuid]/profile` |
| `ContestantAppQuestions` | `…/[entityId=uuid]/questions` |
| `ContestantAppQuestion` | `…/[entityId=uuid]/questions/[questionId]` |
| `ContestantAppPreview` | `…/[entityId=uuid]/preview` |
| `ContestantAppSettings` | `…/[entityId=uuid]/settings` |
| `ContestantAppEntityResolver` | `/contestant/(protected)/[...page=contestantEntityPage]` |
| `ContestantAppHome` (unchanged) | `/contestant` |

## What each load reads and when it reruns

| Load | Takes | Reads of the URL | Reruns |
|---|---|---|---|
| User-level, `(protected)/+layout.server.ts` | `fetch`, `locals`, `params` | `params.entityType` and `params.entityId`; no `url` property, no `route` | when the selected entity changes, and on `invalidateAll`; not on a navigation between pages of one entity |
| Root, `(protected)/+page.server.ts` | `locals`, `parent` | none: no param, no `url` property | with its parent |
| Resolver, `(protected)/[...page=contestantEntityPage]/+page.server.ts` | `params`, `parent` | `params.page` alone | per request for an entity-less path |
| Entity-level, `…/[entityId=uuid]/+layout.server.ts` | `fetch`, `locals`, `params`, `parent` | `params.entityType` and `params.entityId`; no `url` property, not `questionId` | when the selected entity changes; not between pages of one entity |

**The resolver reads no query string**, so it carries none to its target (the plan's ruling 3). No spec and no link was found to rely on one.

## Interim outcomes until 173-10

- **Root, zero or several entities:** the `loginFailed` sign-out. No test pins it (ruling 5), and no test identity has zero or several served entities.
- **Resolver, zero or several entities:** a 307 to the root, hence the same sign-out.
- **A user with several entities who types an entity URL they edit** is served that entity, while the root still signs that user out (ruling 4). No such user exists before 173-12.
- **Any user, an entity URL they do not edit:** a 307 to the root; for a single-entity user that ends on their own entity's home.

## The closing instruments

Two pairs, both green, all four on battery power under `caffeinate -dimsu`. No run was red and none was void: every `power.txt` records `sleep_entries_in_window: 0`, and `pmset -g log` read at 18:03:14 local holds no Sleep, Wake or DarkWake entry after 15:58:38. The second pair exists because the journey spec gained assertions after the first (deviation 1); it is the judged pair, on the final tree.

| Instrument | Directory | Head | Window (local) | Result |
|---|---|---|---|---|
| Gate set, twelve rows | `tests/e2e-runs/173-gates/173-08-move` | `24f23def5` | 17:41:25 to 17:44:39 | exit 0, every row 0 |
| E2E, full default suite | `tests/e2e-runs/173-e2e/173-08-move` | `24f23def5` | 17:44:51 to 17:50:18 | wrapper status 0; 180 passed of 180; 4.9 min |
| Gate set, twelve rows (judged) | `tests/e2e-runs/173-gates/173-08-move-r2` | `1afcbe1b6` | 17:54:07 to 17:57:22 | exit 0, every row 0 |
| E2E, full default suite (judged) | `tests/e2e-runs/173-e2e/173-08-move-r2` | `1afcbe1b6` | 17:57:28 to 18:03:02 | wrapper status 0; total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0; 100 projects; no retry; 5.0 min |

Verdicts, each exit 0 on the final tree (the plain label resolves to `-r2`): `173-verdict.mjs gates 173-08-move`; `173-verdict.mjs e2e 173-08-move --min-total-of 173-01-baseline`; `173-verdict.mjs e2e 173-08-move --same-projects-as 173-01-baseline` (100 projects compared, 0 not as expected). The same three exited 0 for the first pair while its tree was HEAD.

Row counts inside the judged gate set: pgTAP 38 files and 1447 tests; frontend unit tests 2445 passed and 7 skipped in 152 files and 1 skipped file; svelte-check 2686 files, 0 errors, 0 warnings. Run alone: the tests' utility suite 5 files and 73 tests; `yarn typecheck:tests`, `node scripts/assert-no-candidate-app-names.mjs`, `yarn workspace @openvaa/docs validate:links --check` each exit 0.

**Per-project totals, this run / baseline (`173-01-baseline-r2`).** All 29 `data-setup-*` and all 29 `data-teardown-*` projects 1/1. The other 42: a11y-smoke 16/16; admin-access 1/1; auth-setup 2/2; cold-entry-dataroot 3/3; cold-entry-dataroot-contestant 1/1; contestant-a11y-scan 16/16; contestant-journey 1/1; eperm07-term-trigger 1/1; performance 1/1; perm-1e1cg1co 1/1; perm-2e-asymmetric 1/1; perm-2e-shared 2/2; perm-access-disable 3/3; perm-answers-locked 3/3; perm-closed-project 11/11; perm-disable-allow-open 3/3; perm-disable-election-1co 1/1; perm-disable-election-2co 1/1; perm-disjoint-1co 2/2; perm-header-show-help 1/1; perm-hide-all-nominations 1/1; perm-hide-category-tags 1/1; perm-hide-election-tags 1/1; perm-hide-hero 1/1; perm-hide-if-missing-answers 1/1; perm-interactive-info 4/4; perm-localisation-positive 2/2; perm-missing-nominations 1/1; perm-not-located-2e2cg 5/5; perm-org-matching 3/3; perm-per-app-notifications 2/2; perm-question-video 4/4; perm-show-feedback-survey 6/6; perm-startfromcg 2/2; storage-cleanup 3/3; voter-alliance 1/1; voter-dark-mode 1/1; voter-journey 2/2; voter-journey-mobile 1/1; voter-nominations 1/1; voter-prefs-tracking 3/3; voter-results-redraw 5/5. The full table is in the name map's `## After 173-08`.

After the runs: `yarn db:seed:default` exits 0 (752 rows), `yarn db:status` exits 0, the auth allowlist probe reports every row OK, nothing listens on 5173 or 5273.

### What the browser run showed

Before this task no browser and no signed-in request had exercised anything of the plan.

- **Sign-in → `/contestant` → 307 → entity home → store init: observed.** `auth-setup` and every project that signs a contestant in are green. The helper's patterns reject a path without an entity segment, so each passing URL assertion is the app standing on an entity URL, and the home page's tasks and status message render from the store there.
- **The resolver for a signed-in user: observed.** `goto('/en/contestant/questions')` then `toHaveURL(contestantUrlRe('/questions'))` passes in the journey and in `perm-localisation-positive`; the a11y scans, the visual preview and `cold-entry-dataroot-contestant` enter through `buildEntityLessRoute`.
- **The route builder carries `entityType` and `entityId` from `page.params`: observed and now asserted.** On the entity home the menu's home item leads to the entity home and the profile, questions, preview and settings items lead to those pages under the entity. The 173-07 claim that `homeRoute` would answer the entity home once the routes declare the params holds.
- **Help and Privacy signed in: observed and now asserted.** On Privacy the menu's home item leads to the app root and none of the four entity items is rendered; pressing it ends on the entity home, as Help's home button does. No `Missing parameter` anywhere in the dev-server log.
- **The terms-of-use gate at the root gives way after acceptance: observed** (the journey accepts at `/contestant` and reaches the page behind the gate; the gate view's a11y scan is green).
- **Neither layout load reran on a navigation inside an entity: counted, at the API gateway, not per navigation.** `get_entity_user_data` from the server and from the browser, by run window: 47 and 6 in `173-07-split`, 47 and 6 in `173-08-move`, 48 and 6 in `173-08-move-r2` (the one added read is the new return from Privacy). `get_user_entities`: 47, 94 and 96, exactly two per entity read, because an entry through an entity-less URL is two requests and the user-level load runs for each. No list read beyond that pair.
- **The dev-server log** holds none of `effect_update_depth_exceeded`, `Cannot set an answer before user data is loaded`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS` or `is not filled`. Its 404s are 27 placeholder-media requests (26 in `173-07-split`). Client rejections in the judged run: 9 media `play()` aborts, 2 `Viewport size changed`, 4 `Transition was skipped`, inside the range of the earlier runs.

### What the run does not prove

No spec presses the header's return button and asserts where it lands. The root's `loginFailed` outcome, the resolver's redirect to the root and the entity-level refusal have unit tests only: no test identity has zero or several entities, and no spec types an entity URL the user may not edit. No trace of a passing test is kept, so reads were not counted per navigation. No unit test mounts the entity layout.

## Docs sentences and comments corrected

- **Docs, hand-written:** the settings page link of `contestant-app/password-validation`; the paragraph of `contestant-app/login-and-password-reset` on the protected loads (the two route params, the root's redirect, the redirect of a path that names no entity, the refusal of an entity the user does not edit, and the two codes a load signs out with); the sentence of `contestant-app/registration` on which load reads the entity.
- **Docs, generated:** the route map (the resolver's rest route and the two param segments); the `ContestantNav` component page (what the menu shows).
- **Source comments:** `supabaseDataProvider.ts` and its test (the load that derives the election ids); the docblock of `contestantHome.helpers.ts`; the route id literal of `route.test.ts`; two TSDoc examples in `routeConsistency.test.ts`; `apps/frontend/src/routes/README.md` (the contestant directory and where the entity pages are).
- **Tests and seeds:** five fixtures under `tests/tests/fixtures/contestant/` (`contestantHomePage` twice, `contestantPreviewPage`, `contestantProfilePage` twice, `contestantQuestionPage`, `contestantQuestionsOverviewPage`); `perm-disable-allow-open.spec.ts`; the dev-seed templates `perm-disable-allow-open.ts`, `perm-hide-hero.ts` and `perm-localisation-positive.ts`; two comments of the journey spec.
- `git grep -F "(entity)"` outside `.planning/` finds no citation of the old group.

## Deviations from Plan

### Tasks 1 to 4 (earlier executors; carried here as reported, commits verified with `git log`)

**a. Three executors.** Task 1; Tasks 2 to 4; Task 5.

**b. [Rule 3 - Blocking] A commit outside `files_modified`:** `baae66d8b` makes the `$app/paths` test stub (`lib/i18n/tests/__mocks__/app-paths.ts`) resolve route ids by SvelteKit's rules and throw `Missing parameter`. The whole frontend suite passed unchanged on it.

**c. [Rule 2 - Security] The resolver validates the question segment.** The `contestantEntityPage` matcher sees the segment undecoded and admitted `/contestant/questions/..%2F..%2F..%2Fadmin`; the load checks the decoded segment against `/^[A-Za-z0-9_-]+$/` and otherwise redirects to the app root. An open-redirect-class hardening not in the plan, with tests (`a67097553`). Flagged for the phase's security review.

**d. The entity read is keyed by the listed entry,** not by the raw params.

**e. The loop case does not pin the root's outcome for zero or several entities;** left for 173-10.

**f. Negative controls recorded for every guard,** each restored byte-identical: root (tracked `url.pathname` → 6 failed; a param read → 6 failed); user-level (`url` → 12; a third param → 12; `entityId` missing → 12); resolver (`url.search` → 13; an `entityType` read → 13); entity load (`url` → 8; `questionId` → 8; the membership redirect replaced by a throw → 8); the menu gate replaced by `isAuthenticated` → 4 failed with `Missing parameter 'entityType'`.

**g. Assumption A8 measured three ways:** SvelteKit's generated sort puts the rest route last; the matchers are disjoint by unit test; signed-out HTTP probes on a one-off dev server (303 to login with `redirectTo` for the root, entity-less and entity paths; 404 for an unserved type, a malformed id and unknown pages; 200 for Help).

**h. Residual risk:** if the list and the one-entity read disagreed for a single-entity user, the root and the entity load would redirect to each other. It rests on the two database functions agreeing, pinned in pgTAP file 36.

**i. No header logout button exists in the app.**

**j. The user-level load reads `params.entityType` and `params.entityId`** for its dependency, as the plan and the research say, over an orchestrator clause; its guard expects exactly those two over 12 URL shapes.

### Task 5

**1. Both instruments were made twice, on two trees.** The first pair (`173-08-move`, tree `24f23def5`) was green and was the first browser run of the move. The dispatch asked for the home link's target on an entity page to be checked explicitly; no trace of a passing test exists, so I added the check to the journey spec as assertions (`1afcbe1b6`), which changed the tree, and made both instruments again. They are labelled `173-08-move-r2` so that the plan's verify commands, which name `173-08-move`, resolve to the pair on the final tree. Here the suffix marks a re-make on a changed tree, not a re-run after a host sleep.

**2. The journey spec gained assertions beyond the task's step 2** (`1afcbe1b6`): on the entity home, the `href` of the menu's home item and of the four entity items; step 10 now ends Help's return on the entity home by URL and adds Privacy while signed in, with the menu's entity-less shape asserted and the menu's home item pressed. The project's total is unchanged (one test).

**3. [Rule 1 - Bug] The journey's post-registration dispatcher compared a path the move changed.** It accepted the app root through `isContestantHomePath`, which no longer matches `/contestant`; with a session still valid after the password is set, the gate view renders at the root and the wait would have timed out. It now waits on `isContestantAppRootPath`. Found by reading, before any run.

**4. Two builders for the app root, not one:** `isContestantAppRootPath(pathname)` and `contestantAppRootUrlRe()`, the pair the entity home has. `isContestantHomePath` is kept and tested, and has no caller.

**5. `contestantUrlOutsideRe` keeps the entity segment optional inside its own lookahead,** so "has left the profile page" rejects `/contestant/profile` as well as the page under an entity; `/contestant/login` still counts as having left. The constant itself holds a required segment. Negative control: with the constant's `?` restored, 7 of 32 helper cases failed; restored byte-identical.

**6. Files outside the task's list.** The citation commit `29fe409e9` touches 18 files the plan names only by command (E-10, E-11): three docs pages, six frontend files, three dev-seed templates, five fixtures and one perm spec. `24f23def5` also holds the generated `ContestantNav` page, which Task 4's `@component` block produced.

**7. `userNoCandidate` is no longer in the docs paragraph on the protected loads.** The paragraph had to be rewritten, and no load emits that code (it is in `loginError.ts`, the seven message catalogues and the generated key type only). 173-07's deviation 13 left the mention for 173-10; a step of 173-10 that edits that sentence finds it already gone.

**8. Line numbers dropped from three citations** (`perm-disable-allow-open.ts`, `perm-hide-hero.ts`, `contestantHomePage.fixture.ts`): each named a line the file no longer holds there. A fourth, in `contestantProfilePage.fixture.ts`, was replaced by the name of the derived value it cited.

**9. `apps/frontend/src/routes/README.md` said the contestant routes are in `candidate/`,** an error older than this phase (name-map item 34). Corrected with the entity pages' place.

**10. The widened annotation on the context's `page.params` read is still there** (name-map item 22). `contestantContext.svelte.ts` is not in this task's list; the generated type now declares both params, so the annotation and its comment can go in the next plan that edits the context.

**11. No formatter reflow commit:** `generate:docs` changed only the two generated pages, because the hand-written link was corrected first.

**12. The broken-windows ledger was not appended.** Nothing here is a stub, a skipped test or an unrun verify.

---

**Total deviations:** 12 in Task 5 (1 bug fixed before any run, 11 scope or process notes), 10 carried from Tasks 1 to 4.
**Impact on plan:** none on the plan's outcome. The second instrument pair is the cost of asserting the home link in a spec rather than probing it once.

## Issues Encountered

- The commit protocol's worktree check expects an `agent-*` branch. This tree is the operator's standing worktree on `feat/entity-signup-multi-grant`, where the earlier executors committed; I committed there as the standing notes say.
- `.planning/STATE.md` was not modified during this task.

## Known Stubs

None. The root's `+page.svelte` and the resolver's `+page.svelte` render nothing by design: their loads redirect or sign out every user who is past the gates, and the protected layout shows a pending gate's view in their place. 173-10 puts screen H and the "nothing to edit" view at the root. A scan of every added line of `615716810..HEAD` outside `.planning/` for TODO, FIXME and placeholder text finds nothing.

## What 173-09 and 173-10 must know

173-09 builds parts (three additive `EntityCard` props, the `ContactSupport` and `NothingToEdit` components, eight strings in seven locales, test ids) and closes on a row subset. 173-10 gives the root its three outcomes (screen H, the "nothing to edit" view, the redirect), retires `userNoCandidate`, and adds the menu's entity title and switch item.

1. **The root's outcome for zero or several entities is the `loginFailed` sign-out, in `(protected)/+page.server.ts`, and no test pins it.** The resolver sends the same users to the root. 173-10 replaces the sign-out and pins all three outcomes; `page.server.test.ts` and `page.tracking.test.ts` beside the load are where they go. The root reads no param and no `url` property, and its guard fails on either.
2. **A user with several entities who types an entity URL they edit is served it today,** while the root signs that user out. No such test identity exists before 173-12.
3. **173-09 and 173-10 are the first plans in which the entity layout is torn down and mounted for another entity.** `leaveEntity` on teardown and `init` on mount have no unit test, and no test mounts the entity layout; name-map items 16, 17 and 19 apply to any effect that starts a read.
4. **An entry through a URL that names no entity runs the user-level load twice** (two list reads per entity read, measured). Once the root renders H instead of redirecting, the root request is the only one.
5. **The menu:** the home item reads `contestantCtx.homeRoute`; the profile, questions, preview and settings items exist only inside `{#if contestantCtx.selectedEntity}` and are built without params. `ContestantNav.svelte.test.ts` holds the gate, and the journey asserts the links on the entity home and on Privacy (`assertContestantAuthNavPresent`, `assertContestantEntityLessNav`). An entity title or a switch item added to the menu must not build an entity route on a page whose URL names none: the stub throws `Missing parameter` in unit tests, and SvelteKit does in the browser.
6. **Help, Privacy, password reset, preregister and register name `'ContestantAppHome'`, the app root, on purpose.** For a multi-entity user that is where H will be.
7. **Tests-side:** `contestantHomeUrlRe()` and `isContestantHomePath()` are the entity home and reject `/contestant`; assert the root with `contestantAppRootUrlRe()` or `isContestantAppRootPath()`. A plain tests-side `buildRoute` on an entity key throws `is not filled`; navigate without an entity through `buildEntityLessRoute`, which the resolver finishes for a single-entity user only.
8. **`userNoCandidate` is still in `loginError.ts`, the seven message catalogues and the generated key type,** and no longer in the docs. No load emits it.
9. **The resolver's plain-id check on the question segment** (deviation c) is a security-surface addition for the phase's review, and the docs page on the entity routes (173-13) should describe it.
10. **If either database function behind the list or the one-entity read changes, the root and the entity-level load can disagree** (deviation h); pgTAP file 36 is the pin.
11. **The annotation on the context's `page.params` read** can go when the context is next edited (deviation 10).
12. **A grant written after the token was issued** redirects its entity URL to the root until the token refreshes, unless the entity is publicly visible (the plan's ruling 7, name-map item 13); an obligation to Phase 174.

The name map's `## After 173-08` holds the instruments, the per-project comparison, the route ids, the protected tree and the names; its items 41 to 51 hold the above for the later plans.

## Self-Check: PASSED

- Created files exist: the nine of `key-files.created`, checked on disk; `git diff --name-status -M 615716810..HEAD` shows 11 rows `A` (the nine, and the entity-level load and its test, re-created under the new directory).
- Commits are ancestors of HEAD: `8d24512a5`, `b59022d65`, `baae66d8b`, `b1ac91dc3`, `a67097553`, `da3f163f1`, `6ea6d26af`, `29fe409e9`, `24f23def5`, `1afcbe1b6`, `034e6ef97`.
- `git rev-list --count 615716810..HEAD` is 11 before this summary's commit.
- The four run directories exist, each with its `done` file at 0: `tests/e2e-runs/173-gates/173-08-move`, `…/173-08-move-r2`, `tests/e2e-runs/173-e2e/173-08-move`, `…/173-08-move-r2`.

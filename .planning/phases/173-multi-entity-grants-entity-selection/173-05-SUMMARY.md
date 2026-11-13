---
phase: 173-multi-entity-grants-entity-selection
plan: 05
subsystem: frontend-contestant-routes
tags: [sveltekit, param-matchers, auth, entry-gate, svelte5, runes, context, page-data, multi-entity]

requires:
  - phase: 173-multi-entity-grants-entity-selection
    provides: "173-03: the protected load returning `user` and the served-filtered `entities`; 173-04: drafts keyed by entity, closed on four gate rows with no browser"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "SERVED_ENTITY_TYPES and ServedEntityType in @openvaa/app-shared"
provides:
  - "Three param matchers with unit tests, used by no route yet: servedEntityType, uuid, contestantEntityPage"
  - "CONTESTANT_GRANTS: the entry gate admitting the editor of a candidate or of an organization"
  - "UserRole = 'contestant' | 'admin', with the admin grant shapes tested first"
  - "The protected load without its role check: the served list alone decides"
  - "Context accessors user, entities and selectedEntity, derived from page data and the route params"
  - "ContestantUserData without `user`; the one-entity read makes no user lookup"
  - "isAuthenticated on the contestant context read live from the auth context"
  - "Help and Privacy home buttons decided by isAuthenticated"
  - "The E2E boundary proof of 173-04: gates 173-05-prep (twelve rows at 0) and E2E 173-05-prep (180 of 180) on tree bf2fa8d8a"
affects: [173-07, 173-08, 173-09, 173-10, 173-11, 173-12, 173-13, 174, 175]

estimate:
  tokens: 70000
actuals:
  tokens: 25308
  tasks: 4
  commits: 4
plan_head_before: cce96a15e50e3caf624f895983787270a5c7e473
plan_head_after: a1fe0411b3dc518b5853a4ba058b50be97571418

tech-stack:
  added: []
  patterns:
    - "A context member inherited from another context through an object rest or Object.assign is a value copied once; a live one is a prototype getter that re-reads the source"
    - "User-level data on a context is derived from page.data, so it is right on the server and on first paint and needs no push from a layout"
    - "A route param no route declares yet is read through a destructuring annotated with a widened type, not through a cast"
    - "A reactivity test reads the context inside an effect and records each reading; a read outside a reaction did not discriminate"

key-files:
  created:
    - apps/frontend/src/params/servedEntityType.ts
    - apps/frontend/src/params/servedEntityType.test.ts
    - apps/frontend/src/params/uuid.ts
    - apps/frontend/src/params/uuid.test.ts
    - apps/frontend/src/params/contestantEntityPage.ts
    - apps/frontend/src/params/contestantEntityPage.test.ts
    - apps/frontend/src/routes/contestant/homeButton.svelte.test.ts
  modified:
    - apps/frontend/src/lib/auth/roles.ts
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/routes/contestant/login/+page.server.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/app.d.ts
    - apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte
    - apps/frontend/src/routes/contestant/help/+page.svelte
    - apps/frontend/src/routes/contestant/privacy/+page.svelte
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md
    - .claude/skills/components/context-reactivity.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "servedEntityType imports SERVED_ENTITY_TYPES from @openvaa/app-shared rather than spelling the vocabulary"
  - "isAuthenticated on the contestant context is forwarded live from the auth context; it was a value copied once at construction, and the Help and Privacy buttons now depend on it"
  - "entities is typed ReadonlyArray<UserEntity> and answers with one frozen empty array when the page data holds no list"
  - "user and entities are typed in App.PageData, so the context reads them without a cast"
  - "homeRoute is not added here: the plan lists three accessors, and 173-07 adds the fourth"
  - "The docs page drops its mention of userNotAuthorized, which the load no longer produces, and keeps userNoCandidate for 173-10"

patterns-established:
  - "Negative controls: the role order, the id-only match, the copied isAuthenticated and a destructured isAuthenticated were each put back in turn and the cases written for them observed to fail"

requirements-completed: [ENT-03]

coverage:
  - id: D1
    description: "Three param matchers exist with unit tests: servedEntityType accepts exactly SERVED_ENTITY_TYPES, uuid a canonical uuid, contestantEntityPage exactly the entity sub-paths and never the empty string; no route uses them"
    requirement: ENT-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/params/servedEntityType.test.ts, uuid.test.ts, contestantEntityPage.test.ts"
        status: pass
      - kind: other
        ref: "git grep -n -e '=servedEntityType' -e '=uuid' -e '=contestantEntityPage' -- apps/frontend/src/routes apps/frontend/src/lib/routes: exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The entry gate is CONTESTANT_GRANTS and admits an (entity, editor) grant on a candidate or an organization; a faction or alliance editor and a token with no such grant are refused at the login form"
    requirement: ENT-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/passwordLogin.test.ts — the content pin of both shapes, the target-type loop, and 'admits an organization editor against the contestant shape set, and refuses a faction or an alliance editor'"
        status: pass
      - kind: other
        ref: "git grep -q -F 'CANDIDATE_GRANTS' -- apps tests packages: exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The coarse role is 'contestant' | 'admin' and tests the admin shapes first: a token with an admin grant and an entity-editor grant yields 'admin' and passes the admin identity check"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts — describe 'getBasicUserData': the two 'returns the admin role for an admin grant held beside an editor grant on a %s' rows, the organization-alone case and the two null-role rows"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts — 'yields the allowed verdict for a verified admin who also holds an editor grant on a %s', two rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "The protected load no longer signs a user out by coarse role: a user whose role is 'admin' or null and who edits exactly one served entity is served it"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts — describe 'the coarse role decides nothing', two rows"
        status: pass
      - kind: other
        ref: "git grep -n -F 'userNotAuthorized' -- 'apps/frontend/src/routes/contestant/(protected)': exit 1; the Admin App's three lines are unchanged"
        status: pass
    human_judgment: false
  - id: D5
    description: "The contestant context exposes user, entities and selectedEntity as reactive accessors derived from page data; they are empty outside the protected tree; selectedEntity matches type and id together"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts — describe 'the user-level accessors derived from page data', twelve cases"
        status: pass
    human_judgment: false
  - id: D6
    description: "The entity data carries no user; reading an entity makes no user lookup; the settings page reads the email from the user-level accessor"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts — 'reads the candidate and returns structured data' (no getUser, no getSession, no table reached) and 'filters the nominations read by project as well as by candidate' (nominations is the one table reached)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-05-prep — contestant-a11y-scan scans the settings page in both themes, 16 of 16"
        status: pass
      - kind: other
        ref: "git grep -n -P '(current|savedData|userData|ud)\\??\\.user\\b' -- apps/frontend/src ':!*.test.ts': exit 1"
        status: pass
    human_judgment: true
    rationale: "No test asserts the value of the settings page's email field. The read is one template expression, contestantCtx.user?.email, and svelte-check is green; the E2E scan loads the page and does not read the field."
  - id: D7
    description: "On Help and Privacy a signed-in user's home button leads to the app root and a signed-out visitor's to login, decided by isAuthenticated and not by whether an entity is loaded"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/homeButton.svelte.test.ts — three cases for each page, mounted with a context that has no userData member"
        status: pass
      - kind: unit
        ref: "contestantContext.svelte.test.ts — 'reads isAuthenticated live, so a sign-in and a sign-out reach a consumer while the context stays mounted'"
        status: pass
    human_judgment: false
  - id: D8
    description: "No URL of the app changed, and the gate set and the full E2E suite are green on one tree; the run is also the E2E boundary proof of 173-04"
    verification:
      - kind: other
        ref: "173-verdict.mjs gates 173-05-prep, exit 0, twelve rows at 0, head bf2fa8d8a, no Sleep entry in the window"
        status: pass
      - kind: e2e
        ref: "173-verdict.mjs e2e 173-05-prep --min-total-of 173-01-baseline, exit 0: 180 of 180 over 100 projects; --same-projects-as 173-01-baseline, exit 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "PROH-173-10: no reactive context accessor is destructured and dataRoot is never bound to a read alias"
    verification:
      - kind: other
        ref: "git grep -n -P '(const|let) \\{[^}]*\\b(entities|selectedEntity)\\b[^}]*\\} = (ctx|contestantCtx|getContestantContext\\(\\))' -- apps/frontend/src: exit 1; the same search for user and isAuthenticated: exit 1"
        status: pass
    human_judgment: true
    rationale: "Marked verification: judgment in the plan. The three pages this plan touched read contestantCtx.user, contestantCtx.isAuthenticated and ctx.isAuthenticated in the template; no new accessor has another consumer yet."
  - id: D10
    description: "PROH-173-13: the entry gate is never treated as authorisation"
    verification: []
    human_judgment: true
    rationale: "Marked verification: judgment in the plan. git grep -n -P '\\.role\\b' -- apps/frontend/src ':!*.test.ts' prints four lines: two in roles.ts that compare a grant claim's role, and the coarse role read in two places, both the Admin App's entry (requireAdminIdentity.ts and admin/(protected)/+layout.ts). Nothing in the Contestant App reads the coarse role, and the gate constant is read by the login action and the role derivation only."

duration: 35min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 05: Route Prep With No URL Change Summary

**The three param matchers the entity route tree needs exist with tests and no route uses them; the entry gate is `CONTESTANT_GRANTS` and admits organization editors; the coarse role is `'contestant' | 'admin'` and reads an admin grant first; the protected load decides from the served list alone; the context carries `user`, `entities` and `selectedEntity` beside the entity store; and tree `bf2fa8d8a` is green on twelve gate rows and on the full E2E suite (180 of 180), first attempt each. That run is the boundary proof of 173-04, and it found nothing against either plan.**

## Read First

1. **Both closing runs are green and neither is void.** The host slept from 15:27:30 local, after both had ended (gates 15:15:43 to 15:18:44, E2E 15:19:00 to 15:24:37). The power-log lines are under "Host Sleep". The sleep stopped this agent, not a run; the summary was written after the resume, with the stack and both verdicts re-checked.
2. **One fix beyond the plan's letter: `contestantCtx.isAuthenticated` was a value copied once, when the context was constructed.** Measured, with the real auth context: its own accessor went from false to true on a session change, and the contestant context's stayed false. The plan makes the Help and Privacy home buttons depend on that flag, so it is now forwarded live. See "Deviations from Plan", item 1. **Not measured:** whether the app remounted the contestant layout on every sign-in and sign-out and so hid the stale value from users. No E2E test showed the defect before or shows the fix now; the evidence is unit tests.
3. **Where the handover and the plan disagreed, the plan was followed.** The handover lists a fourth accessor, `homeRoute`, among the names; this plan's Task 3 lists three, and 173-07 adds `homeRoute`. The handover says an organization editor past the login form meets "exactly one outcome", the `loginFailed` sign-out; the plan's ruling 3 and the code give three outcomes, stated under "What an Organization Editor Meets Now".
4. **`ENT-03` is copied into `requirements-completed` because the template requires the plan's list.** This plan delivers its frontend entry-gate half. The orchestrator owns `REQUIREMENTS.md`.

## Performance

- **Duration:** about 35 min of work. Start 12:00:28Z; the name-map commit at about 12:25Z; the host slept 12:27:30Z to 12:58:38Z; this file after the resume.
- **Tasks:** 4 of 4
- **Files changed:** 31 (30 outside `.planning/`; seven created)
- **Start revision:** `cce96a15e`. **The tree both closing instruments describe:** `bf2fa8d8a`.

## Task Commits

1. **Task 1: three param matchers** — `7b7d680ef` `feat(173-05): add the three param matchers the entity route tree is built on, each with a unit test`
2. **Task 2: the entry gate, the role and the load** — `f8c369121` `feat(173-05): admit organization editors at the Contestant App's entry gate, read an admin grant first, and drop the load's role check`
3. **Task 3: the user-level accessors** — `bf2fa8d8a` `feat(173-05): expose the signed-in user, their entities and the selected entity on the contestant context, beside the entity store`
4. **Task 4: the close** — `a1fe0411b` `docs(173-05): record the green close of the route-prep stage of multi-entity grants, and the boundary proof of 173-04, in the name map`

`git rev-list --count cce96a15e..a1fe0411b` is 4. The commit that carries this file follows them. `yarn workspace @openvaa/frontend typecheck` exited 0 on the tree of each of the three source commits before it was made. The role check left the load in the same commit that reordered the role, as the plan requires.

## Gate and E2E Results

Every exit status was read from the command itself or from a marker file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 | `yarn workspace @openvaa/frontend vitest run src/params`; `… typecheck`; the three `test -f` | 0; 0; 0 | 60 tests in 5 files (the two existing matchers' with them) |
| Task 1 grep | `git grep -n -e "=servedEntityType" -e "=uuid" -e "=contestantEntityPage" -- apps/frontend/src/routes apps/frontend/src/lib/routes` | 1 | no line |
| Task 2 | `… vitest run passwordLogin requireAdminIdentity supabaseDataWriter layout.server.test`; `… typecheck`; `node scripts/assert-no-candidate-app-names.mjs` | 0; 0; 0 | 205 passed and 7 skipped in 8 files |
| Task 2 greps | the organization shape in `roles.ts`; `CANDIDATE_GRANTS` over `apps tests packages`; `'candidate' \| 'admin'` over `apps/frontend/src`; `userNotAuthorized` over the protected tree | 0; 1; 1; 1 | as required |
| Task 2, the Admin App | `git grep -n -F "userNotAuthorized" -- apps/frontend/src/routes/admin apps/frontend/src/lib/admin` | 0 | the same three lines as the name map's P-4 |
| Task 2, messages | `git diff --stat cce96a15e..HEAD -- apps/frontend/messages` | 0 | prints nothing |
| Task 3 | `… vitest run contestantContext supabaseDataWriter contestantUserDataState`; `… check`; the two `selectedEntity` greps; `bash .claude/scripts/audit-skill-links.sh components` | 0; 0; 0, 0; 0 | 126 passed and 7 skipped in 4 files; 0 errors, 0 warnings; 28 citations, 0 dangling |
| Task 3 greps | the destructure search; the G-9 search; `userData.current` on Help and Privacy | 1; 1; 1 | no line |
| Task 3, beside the plan | `… test:unit`; `… vitest run homeButton`; eslint and prettier on the touched files; `yarn assert:comment-hygiene` | 0; 0; 0, 0; 0 | 2290 passed and 7 skipped in 143 files |
| **Gate set** | `caffeinate -dimsu 173-gates.sh 173-05-prep` | **0** | **twelve rows, every status 0** |
| Gate verdict | `173-verdict.mjs gates 173-05-prep` | 0 | not stale; no Sleep entry |
| **E2E** | `caffeinate -dimsu 173-e2e.sh 173-05-prep` | **0** | **180 / 180 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 5.0 min |
| E2E verdict | `173-verdict.mjs e2e 173-05-prep --min-total-of 173-01-baseline` | 0 | full suite; total 180 not below 180 |
| Per-project comparison | `… --same-projects-as 173-01-baseline` | 0 | 100 compared, every total equal to the baseline's |
| Plan verification | `… vitest run src/params passwordLogin requireAdminIdentity contestantContext`; the name gate | 0; 0 | 125 tests in 8 files |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |
| Closing searches | `173-verdict.mjs greps` | 1 | three literals without a hit; `userNoCandidate` (12 hits in 11 files) is 173-10's |

The three verdicts and the plan verification were taken again at HEAD `a1fe0411b` after the host woke, and exit 0.

The twelve rows of `173-05-prep`: typecheck 19 s, lint 44 s, types-regen 36 s, types-clean 0 s, sql-lint 3 s (104 policies, 20 tables, `0 error(s), 3 warning(s)`), pgtap 5 s (38 files, 1447 tests), unit 32 s (frontend 2290 passed and 7 skipped in 143 files; the other workspaces' file counts as at the close of 173-03), check-frontend 8 s (2665 files, 0 errors, 0 warnings), build 15 s, format 17 s, docs-links 2 s (0 findings), name-gate-self-test 0 s (82 of 82). It is the first full gate set over 173-04's five files: `build` and `format` are at 0 on them.

### Every run directory of this plan

| Directory | Tree | Counts | Verdict |
|---|---|---|---|
| **`tests/e2e-runs/173-gates/173-05-prep`** | `bf2fa8d8a` | twelve rows 0 | **green, judged** |
| **`tests/e2e-runs/173-e2e/173-05-prep`** | `bf2fa8d8a` | 180 of 180 over 100 projects | **green, judged, the full default suite** |

Both first attempts, both on AC power at the start and the end, both `sleep_entries_in_window: 0`. Beside each: `173-05-prep.log` and `173-05-prep.exit`. No red run, no probe, no rerun. Nothing under `tests/e2e-runs/` was deleted.

## What the Run Showed for 173-04

**No test failed, so no failure belongs to either plan.**

- **Save, logout and the answers lock are green at their baseline counts:** `contestant-journey` 1 of 1 (it saves answers and an image and logs out twice), `perm-localisation-positive` 2 of 2 (a save and a logout), `perm-answers-locked` 3 of 3, `contestant-a11y-scan` 16 of 16, `cold-entry-dataroot-contestant` 1 of 1, `auth-setup` 2 of 2. One preflight success, no preflight failure, no retry.
- **None of the symptoms that would point back to 173-04 is in the run.** The dev-server log holds 0 lines of `Cannot set an answer before user data is loaded`, 0 of `effect_update_depth_exceeded` and 0 of `Cannot reload entity data`. Its server errors are 26 placeholder-media 404s and 2 view-transition rejections, the same numbers as in `173-03-writer-r4`.
- **Limits of this evidence.** The dev-server log shows server-side and Vite-forwarded errors, not every browser console line, and a passing test keeps no trace, so a storm of `get_entity_user_data` requests that did not break a step would not show here. The three projects' durations are within a few per cent of `173-03-writer-r4`'s: `contestant-journey` 27.1 s (29.5 s), `perm-answers-locked` 2.1 s (2.1 s), `perm-localisation-positive` 14.6 s (14.3 s).
- **What the run cannot show:** a draft surviving a reload, a draft absent for another entity, two tabs. No spec on the tree reloads in the middle of an edit. Those wait for 173-12's spec.
- **This plan's own surfaces** (the login form, the role, the served-types filter, Help, Privacy, the settings email) are green in the same run: every contestant project signs in through the login action with `CONTESTANT_GRANTS`, and `admin-access` 1 of 1 signs an administrator in.

## The Final Names

| Role | Name |
|---|---|
| The entity-type matcher | `servedEntityType` (`apps/frontend/src/params/servedEntityType.ts`), `match(param): param is ServedEntityType`. **It imports `SERVED_ENTITY_TYPES`; it does not spell the vocabulary** |
| The entity-id matcher | `uuid`: the canonical 8-4-4-4-12 hexadecimal form, either letter case, nothing before or after |
| The entity sub-path matcher | `contestantEntityPage`: `profile`, `questions`, `questions/<one non-empty segment without a slash>`, `preview`, `settings`; false for the empty string |
| The entry gate | `CONTESTANT_GRANTS` in `apps/frontend/src/lib/auth/roles.ts` |
| The coarse role | `UserRole = 'contestant' \| 'admin'`, with TSDoc, in `dataWriter.type.ts` |
| The accessors | `user: BasicUserData \| undefined`, `entities: ReadonlyArray<UserEntity>`, `selectedEntity: UserEntity \| undefined` |
| Their page-data keys | `user?` and `entities?` in `App.PageData` |

## What an Organization Editor Meets Now

They pass the login form. In the protected load, after the terms-of-use gate:

| The served list of their entities | Outcome |
|---|---|
| exactly one entity, with a nomination | served that entity, on the pages as 173-03 left them for an organization |
| exactly one entity, without a nomination | signed out with `candidateNoNomination` |
| none (the project serves candidates only, as every seeded project does) or several | signed out with `loginFailed`, until 173-10 replaces it with the screen and the selection |

No test identity holds an organization grant, so no browser has shown any of the three. The role is not consulted.

**`userNotAuthorized` has no producer in the Contestant App from this plan on.** Its union member and map entry in `apps/frontend/src/lib/contestant/utils/loginError.ts` stay; 173-10 retires them. The Admin App's own three lines are untouched. No message file changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `isAuthenticated` on the contestant context was copied once at construction**
- **Found during:** Task 3, before re-pointing the Help and Privacy buttons at it
- **Issue:** the context took the auth members through an object rest and `Object.assign`, which read the auth context's accessor once. The value never changed while the context stayed mounted. With the buttons keyed on it, a user who signed in without a full page load and then opened Help would have been sent to the login form by its home button, where no server request runs to redirect them. Before this plan the buttons read the entity store and did not depend on the flag.
- **Measured:** a throwaway test with the real `AuthContextProvider` and a reactive page: read inside effects, the auth context's accessor recorded `[false, true]` and the contestant context's `[false]`. The throwaway file was deleted; the case that replaces it is in the context's test file.
- **Fix:** `isAuthenticated` is left out of the copied members and exposed as a prototype getter that re-reads the auth context, as `adminContext` does.
- **Files modified:** `contestantContext.svelte.ts`, `contestantContext.svelte.test.ts`
- **Commit:** `bf2fa8d8a`
- **Not verified in a browser.** `ContestantNav` and two password pages read the same flag. With a live flag the menu follows a sign-in or sign-out at once; the E2E suite is green with it.

**2. [Rule 3 - Blocking] The generated type of `page.params` holds no `entityType` or `entityId`**
- **Found during:** Task 3, typecheck
- **Issue:** no route declares the two params until 173-08, so reading them off `page.params` is a type error.
- **Fix:** the destructuring is annotated `Record<string, string | undefined>`, a widening, with a comment. 173-08 can drop the annotation.
- **Commit:** `bf2fa8d8a`

### Departures from the plan's letter

- **Files changed that the plan does not list,** each for a reason the plan's own criteria give:
  - `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts`: one phrase of a comment. It spelled `'candidate' | 'admin'`, and the acceptance criterion requires that search to be empty over `apps/frontend/src`. No code changed.
  - `apps/frontend/src/lib/contestant/gates/gates.test.ts` and `(protected)/termsOfUseLayout.svelte.test.ts`: the role literal in a fixture; the second also loses `user` from its entity data.
  - `apps/frontend/src/app.d.ts`: `user` and `entities` typed in `App.PageData`.
  - `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts` and its test: the store's composite and its fixture no longer carry `user`.
  - `(protected)/layout.server.test.ts` in Task 3 as well as Task 2: its entity-data fixture loses `user`.
  - `apps/frontend/src/routes/contestant/homeButton.svelte.test.ts`: new; see below.
- **A render test for the Help and Privacy home buttons was added.** The plan asks for the behaviour and no test. Six cases mount the two pages with a context that has no `userData` member.
- **The docs page changed in two sentences, not one.** The step-3 sentence names the new gate and who it admits. The sentence about the protected loader lost "the user is not a candidate" and `userNotAuthorized`, which the load no longer produces. `userNoCandidate` stays in it for 173-10, whose closing search counts that line.
- **The skill file's two line citations were replaced by content anchors.** `context-reactivity.md` cited two line ranges of the context file, `44-45` and `131-134`. They held the cited text before this plan; after it the text is at lines 53 and 157. The link audit cannot see a drifted range, so they now name the docblock section and the comment's first words.
- **Task 2 added more cases than the four listed:** both admin-with-editor rows (candidate and organization), the organization-alone case, two null-role rows (faction and alliance), a login-level case for an organization, a faction and an alliance editor, and a load row for a `null` role beside the `'admin'` one. `accessTokenFor` in the admin identity test now honours a shape's `target_type`.
- **`entities` is `ReadonlyArray<UserEntity>`,** and an absent list is one frozen empty array, so two pages without a list answer with the same value. The plan says "an empty array".
- **`## After 173-05` was inserted before the name map's last list, not appended,** as the earlier sections were. Items 21 to 26 were added to the list.
- **Negative controls.** Put back in turn, each with the file restored byte for byte afterwards: the contestant-first role order (four cases failed: two writer, two admin identity); the id-only match and the copied `isAuthenticated` (four context cases failed); a destructured `isAuthenticated` on the Privacy page (the follow case failed).

### Departures in procedure

- **Logs of intermediate commands went to the system temp directory until Task 4,** not to the scratchpad; from the re-seed on they are in the scratchpad. Nothing was written into the repository by either.
- **The commit-time worktree check of the executor's protocol was not applied,** as in 173-01 to 173-04: this checkout is a permanent linked worktree on `feat/entity-signup-multi-grant`.
- **The broken-windows ledger was not appended to.** This plan leaves no stub, skipped test or unrun check.
- **Reading.** Read: the standing notes, the plan, `173-04-SUMMARY.md` and `173-03-SUMMARY.md` in full, of the name map the names, facts, G-7 to G-9, P-3, P-4, the baseline, every "After" section and the last section, the drivers' headers, of the context D-06 to D-12 and D-17, of the research R-2.5, R-2.6, R-3, R-4.4, R-5.4, P-6, P-14 and O-Q2, of the UI contract "Shared premises" and S5, `context-reactivity.md`, and the head of the summary template. Not opened: `PROJECT.md`, `STATE.md`, `config.json`, the components skill's `SKILL.md`, the workflow references, `appGates.ts`, `hooks.server.ts`.

## Host Sleep

`pmset -g log`, 2026-10-06, local time:

```text
15:27:30 Sleep     Entering DarkWake state due to 'Clamshell Sleep'
15:27:46 Sleep     Entering Sleep state due to 'Clamshell Sleep'   (409 s)
15:34:35 DarkWake  DarkWake from Deep Idle
15:35:20 Sleep     Entering Sleep state due to 'Maintenance Sleep' (1398 s)
15:58:38 Wake      Wake from Deep Idle
```

The gate set ended at 15:18:44 and the E2E run at 15:24:37; the re-seed and the plan verification finished at about 15:26:30. No run of this plan overlaps a Sleep entry, so none is void and none was made again. After the wake: `yarn db:status` exit 0; `identity-callback`, `invite-candidate` and `send-email` each answer (401 to a request without credentials); `170-allowlist-probe.sh after` exit 0, every row OK; the `default` dataset is in place (26 questions, 328 candidates). The stack was not restarted.

## Deferred Issues

- **The auth context's docblock still explains its own-enumerable accessor by "the contestantContext spread".** The contestant context no longer copies that member; the accessor's shape is still what its getter reads. The file is outside this plan and was not edited.
- **The protected load holds the comment "`handleError` always redirects…" twice,** once above the provider's construction where it does not belong (pre-existing).
- **`contestantContext.svelte.test.ts` has an unused variable** reported as a lint warning (pre-existing, carried from 173-03).
- **The login docs page still says "Candidates sign in" and "need a candidate"** in its running prose, and still names `userNoCandidate` (173-10's).
- **Test titles and docblocks in `passwordLogin.test.ts` and the load's log label `Candidate login`** still say "candidate" in places this plan did not need to touch.
- Carried and unchanged: the items listed in `173-04-SUMMARY.md` and `173-03-SUMMARY.md`.

## Known Stubs

None. The three matchers and `selectedEntity` have no consumer yet, by the plan's design: 173-08 routes the first two, 173-07 to 173-09 read the third. On today's tree `selectedEntity` is always `undefined`, because no route carries the two params.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-173-18 the entry gate widened to organization editors | mitigate | exactly two shapes pinned by content; `faction` and `alliance` refused at the shape test and through the login helper, with the session signed out; an entity-scope admin of an organization refused; the database's policies unchanged (pgTAP 1447 of 1447) |
| T-173-19 removing the role check lets a non-contestant session into the protected tree | mitigate | the served list, read through the caller's own rights, decides; a list that is not exactly one entity ends in the sign-out; no entity is read that the list does not hold; two load rows for `'admin'` and `null` roles |
| T-173-20 an administrator who also edits an entity locked out of the Admin App | mitigate | the admin shapes are tested first; two writer rows and two admin-identity rows, each with the entity grant first in the token; the old order fails all four |
| T-173-21 a crafted route segment reaching a load or a query | mitigate | three allowlist matchers with unit tests, including a trailing line break and a trailing slash for the uuid, and the empty string and an extra segment for the sub-path |
| T-173-SC package installs | accept | no package was installed |

**One change worth a reviewer's eye, inside the plan's own step:** the one-entity read no longer calls `getUser()` first. It sends the caller's token with the RPC, and the database verifies it and applies the caller's rights; the server load still reads the verified user before it reads any entity. No new endpoint, auth path or schema surface.

## What the Next Plan and Later Phases Must Know

- **Read `173-NAME-MAP.md` first:** `## After 173-05` and the last section, which now has twenty-six items; 21 to 25 are this plan's.
- **Compare against** gates `173-05-prep` and E2E `173-05-prep`: 180 tests, 100 projects, every project at its baseline total; pgTAP 38 files, 1447 tests; frontend unit 2290 passed and 7 skipped in 143 files; svelte-check 2665 files.
- **173-07:** add `homeRoute`; this plan did not. Keep `user` and `entities` in the page data of every protected page, at whatever level the load split puts them: the context reads `page.data.user` and `page.data.entities`. `leaveEntity()` still has no caller. Help and Privacy no longer read the store.
- **173-08:** the matcher names for the brackets are `servedEntityType`, `uuid` and `contestantEntityPage`. Once a route declares `entityType` and `entityId`, the annotation on the context's read of `page.params` can go, and `selectedEntity` becomes non-empty for the first time. A static or matcher-constrained route winning over the rest route (assumption A8) is still unmeasured.
- **173-08 to 173-10:** `contestantCtx.isAuthenticated` is live now. A menu rule keyed on it and on `selectedEntity` follows a sign-out at once, before `#reset` runs.
- **173-10:** retire the contestant `userNotAuthorized` member and its map entry with `userNoCandidate`; nothing produces either. The signed-in email for the "nothing to edit" view is `contestantCtx.user?.email`, set on the server and on first paint.
- **173-11 and 173-12:** an organization editor can sign in. A project that serves organizations and a user with exactly one organization is served today; a test that expects the sign-out for that user will fail.
- **Phase 174:** unchanged from 173-02: a write can be refused for a listed entity while the token predates its grant.

**Host state:** the stack is up and was not restarted; no Edge Function was served with an env file; the auth allowlist is as expected. The database holds the schema of the tree as the gate set applied it, what the closing E2E run left in its own project, and the `default` dataset (752 rows seeded after the run). Nothing listens on 5173 or 5273 and no dev server of this plan runs; the Vite server on 5199 is another's and was not touched. The host is on AC power. `CAND-APP-PLAN.md` is untracked and untouched. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged.

## Self-Check: PASSED

- The seven created files, this summary, the gate run's `summary.tsv` and the E2E run's `summary.json` exist; both runs' `head` files name `bf2fa8d8a`.
- Commits `7b7d680ef`, `f8c369121`, `bf2fa8d8a` and `a1fe0411b` are ancestors of HEAD; `git rev-list --count cce96a15e..a1fe0411b` is 4.
- The plan's verification items hold at HEAD `a1fe0411b`, re-taken after the host woke: `vitest run src/params passwordLogin requireAdminIdentity contestantContext` exit 0 (125 tests in 8 files); the name gate exit 0; `gates 173-05-prep` and `e2e 173-05-prep --min-total-of 173-01-baseline` exit 0.
- `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged since the start revision (`git diff --quiet` exit 0). Nothing listens on 5173 or 5273.

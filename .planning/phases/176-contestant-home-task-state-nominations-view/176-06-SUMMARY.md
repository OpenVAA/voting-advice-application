---
phase: 176-contestant-home-task-state-nominations-view
plan: 06
subsystem: frontend
tags: [contestant-context, task-state, entity-load, no-nomination, locale, sign-out, i18n-catalogue, tdd, e2e]

requires:
  - phase: 176-contestant-home-task-state-nominations-view
    provides: "plan 176-03 — taskStateOf, hasNomination and the two shared filters; plan 176-05 — the flat EntityNomination list in page data and the full run 176-05-close"
provides:
  - "the entity-level load in four stages: no sign-out for a missing nomination, no question read for an entity with none, the entity read in the request's locale"
  - "ContestantContext.taskState, .tasks, .nextStep, .previewOpen and .nominations; profileComplete as the state's allComplete"
  - "empty question lists and blocks, and questionsReady false, for a loaded entity with no selected election"
  - "CONTESTANT_LOGIN_ERROR and ContestantLoginError with loginFailed alone; two message keys out of seven catalogues (654 keys)"
  - "the full run 176-06-close, the second link of the phase's chain"
affects: [176-07, 176-08, 176-10, 176-12, 176-13, 176-14, 176-15, 176-17, 176-19, 177, 179]

actuals:
  tokens: 13498 # chars/4 over git diff c0bc452bb..186fbc34e (53990 chars)
  tasks: 3 # and the locale step added by the orchestrator's ruling
  commits: 8 # MEASURED: git rev-list --count c0bc452bb..HEAD when this file was written; the commit of this file follows
plan_head_before: c0bc452bbe22bd17ec303bd24e970d2b9c90c223
plan_head_after: 186fbc34e # this plan's last commit outside .planning/

tech-stack:
  added: []
  patterns:
    - "A fact the server already read is taken from page data, so the context's derived state is right on the first frame; the store's counts join it only while the store holds the entity the route names, by type and id"
    - "Two changes of one file held through one pre-commit run are committed apart by committing the file without the later change, then with it; the final tree is compared byte for byte with the tree the run ran"

key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts"
    - apps/frontend/src/lib/contestant/utils/loginError.ts
    - apps/frontend/src/lib/server/contestant/signOutToLogin.test.ts
    - "apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.error.json"
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - .claude/skills/components/context-reactivity.md

key-decisions:
  - "The entity is known only when the page data's entity is the one the route names, by type and id — not merely when page data holds a list"
  - "The whole change — load, codes, locale, context — was held uncommitted through one full E2E run and then committed in five commits whose final tree is byte-equal to the tree that run ran"
  - "One existing context case was inverted, not kept: complete with no entity loaded was true and is now false, which is the plan's own invariant"
  - "The locale of the entity read is the load's existing getLocale() value; no second locale source was introduced"

requirements-completed: [] # NOM-01 and TASK-01 are met when the home and the buttons read the state

duration: about 30 min
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 06: An Entity with No Nomination Loads, and the Context Holds the Task State — Summary

**The entity-level load no longer signs anybody out over a missing nomination and reads no question for such an entity; it reads the entity in the request's locale; the contestant context exposes one derived task state (`taskState`, `tasks`, `nextStep`, `previewOpen`) and the page data's `nominations`, with `profileComplete` as "every task complete"; the full suite is 268 of 268 in 110 projects on the uncommitted tree and again on the committed one.**

Everything below was measured in this session unless it says "read" or "not established".

## Read this first

1. All three tasks and the added locale step are done. The three `<automated>` blocks, run byte for byte from the plan, each exit **0**.
2. **`176-06-close` passes the plan's verdict**: 268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 110 projects, every project at its `176-05-close` total. No void run, no red run, nothing retried.
3. **The locale needed one argument, not a new mechanism.** The load already held `const lang = getLocale()` (Paraglide's runtime, the means every other server load of the tree uses) and passed it to the question read; the entity read now gets `locale: lang` too.
4. **One existing context case was inverted** (deviation 1), and the harness's `loadEntity` now gives the page data the entity's user data (deviation 2). Every other pre-existing case of the context passes unchanged, before and after: the lifted filters compute what the context computed.
5. **A file outside the plan's list was edited** on the orchestrator's instruction: `.claude/skills/components/context-reactivity.md` (the accessor list), in a commit of its own.

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `cf4db3896` | `test(176-06): an entity with no nomination loads, and nobody is signed out for it` | 1, red |
| 2 | `670570840` | `test(176-06): the entity is read in the locale of the request` | locale, red |
| 3 | `0d8acaec5` | `test(176-06): the context's task state, its empty lists with no election, and what complete means` | 2, red |
| 4 | `76235e8bf` | `feat(176-06): an entity with no nomination loads with no questions and is not signed out` | 1 |
| 5 | `6cb84920e` | `chore(176-06): the two sign-out codes nothing raises any more` | 1 |
| 6 | `afe6a22d8` | `feat(176-06): the entity and its nominations are read in the locale of the request` | locale |
| 7 | `9db505cbf` | `feat(176-06): the contestant context holds the entity's tasks, the next step and whether the preview is open` | 2 |
| 8 | `186fbc34e` | `docs(176-06): the context-reactivity reference names the task-state accessors` | 2 |

All by pathspec on `feat/entity-signup-multi-grant`. Task 3 changed no file: the checklist had no finding.

## Each verify, with its real exit status

Scripts extracted from the plan file by a script; evidence in `tests/e2e-runs/176-unit/176-06-t<N>-verify.{sh,log,exit,head}`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `186fbc34e` | **0** |
| Task 2, as written | `186fbc34e` | **0** |
| Task 3, as written (after the closing run) | `186fbc34e` | **0** |
| `176-verdict.mjs gates 176-06-close --rows typecheck,lint,unit,check-frontend,build,format` | `186fbc34e` | **0** — PASS |
| `176-verdict.mjs e2e 176-06-close --same-projects-as 176-05-close` + the plan's five projects | `186fbc34e` | **0** — PASS |
| the same with `--expect-project perm-localisation-positive --expect-project contestant-journey` | `186fbc34e` | **0** — PASS |

## Red and green

| Report | Head | Total · passed · failed |
|---|---|---|
| `176-06-load-red` | `cf4db3896` | 23 · 21 · **2** — the two "serves … with no questions" cases, each `promise rejected "Redirect{ status: 307 }" instead of resolving` |
| `176-06-locale-red` | `670570840` | 22 · 14 · **8** — the two above, the two locale cases and the four "reads … by type and id" cases whose expected call now carries `locale` |
| `176-06-load-green` | `186fbc34e` | 25 · 25 · **0** |
| `176-06-context-red` | `0d8acaec5` | 61 · 48 · **13** — the twelve new cases and the inverted one, on an expectation or a missing member |
| `176-06-context-green` | `186fbc34e` | 61 · 61 · **0** |

Frontend unit suite at the closing head: 185 files passed, 1 skipped; **3385 passed**, 20 skipped (was 3370). svelte-check: 0 errors, 0 warnings.

## The load's four stages, as written

1. **The parent.** `gate` and `entities`, awaited first; a pending gate returns `{}` and reads nothing.
2. **Membership.** The entity the two params name must be in the user's list, else a 307 to the app root.
3. **The entity.** `getEntityUserData({ type, id, loadNominations: true, locale: lang })`. No entity, or a refused nominations read, is a 307 to the app root; a failed read is `signOutToLogin(…, 'loginFailed')` — the one sign-out left in the load.
4. **The questions.** `if (!hasNomination(nominations)) return { questionData: { categories: [], questions: [] }, contestantUserData: userData }` — no provider is built and no question is read. Otherwise the questions of the listed elections, deduplicated, in `lang`.

The load imports `hasNomination` from `$lib/contestant/tasks` and nothing else new; `Id` and the constituency ids are gone. It still takes `fetch`, `locals`, `params` and `parent` and reads the two entity params alone: `layout.tracking.test.ts` passes **unchanged** (PROH-176-18, PROH-176-19).

## The locale (added by the orchestrator's ruling, not part of the plan as written)

- **How it is obtained:** `getLocale()` from `$lib/paraglide/runtime`, read once at the top of the load as `lang`. It is what the user-level load (`contestant/(protected)/+layout.server.ts`), the root load and the voter loads pass to their reads, and what `hooks.server.ts` sets up through `paraglideMiddleware` (url, cookie, base-locale strategy). No URL property is read, no new source was added, and the tracking test needed no new case because the locale is not obtained in a new way.
- **Test first:** `layout.server.test.ts` replaces the runtime's `getLocale` with a function a case sets; two cases in `fi` and `sv` assert the entity read and the question read both carry that locale, and the four listed-entity cases now expect `locale: 'en'` in the call. Red at `670570840`, green from `afe6a22d8`.
- **A language switch:** the language links in `LanguageSelection.svelte` carry `data-sveltekit-reload`, so a switch is a full document load and the load reruns in the new locale (read from the component, not exercised by a test of this plan).
- **What changed in page data:** `contestantUserData.entity` is mapped by `toDataObject(row, locale, default)` — for an organization its `name` and `shortName` are now the request locale's entries, falling back to the default — and each element of `contestantUserData.nominations` has `electionName`, `constituencyName`, `parent.name` and `parent.shortName` in that locale. A candidate's first and last name, the answers, the image and `localizedNames` do not depend on the locale.
- **Readers of those values, as derived by search:** the home's greeting (`+page.svelte` → `descriptor.greetingName(userData.current.entity)`, an organization's `name`); the preview (`savedEntityData`); the logout button (`savedEntityData`, for unsaved state only). The profile's name fields read `localizedNames`, by locale. Nothing reads the four names of the nominations list yet. The store's own `reloadEntityData` already passed `locale: this.#locale()`, so before this change an organization's name could switch language after the first save; now the first load and every reload agree.
- **E2E assertions that could have passed on an English fallback:** searched `tests/tests` for non-English contestant sessions and for a greeting assertion. `perm-localisation-positive` edits a **candidate** (names not localized) and `invitation-contract` reads a Finnish mail; no spec asserts an organization's greeting or a nomination's name in a non-English session. Both runs are the proof: `perm-localisation-positive` 2/2, `contestant-journey` 1/1.

## The context's new accessors

All are prototype getters over private `$derived` fields; all are reactive accessors — read `contestantCtx.X` in the tracking scope, never destructure.

| Accessor | Type | Definition |
|---|---|---|
| `nominations` | `ReadonlyArray<EntityNomination> \| undefined` | `page.data.contestantUserData?.nominations`: the list the entity-level load read; `[]` for an entity with none; `undefined` on a page whose data holds no entity. Follows the load, not the store |
| `taskState` | `TaskState` | one `$derived.by` that reads its inputs in its own scope and returns `taskStateOf({...})`; a fresh object on every change |
| `tasks` | `ReadonlyArray<Task>` | `taskState.tasks` — the same array object |
| `nextStep` | `NextStep \| undefined` | `taskState.nextStep` — the same object |
| `previewOpen` | `boolean` | `taskState.previewOpen` |
| `profileComplete` (changed) | `boolean` | `taskState.allComplete` |

### Each input of the state, with its source

| Input | Value | Source |
|---|---|---|
| `entityKnown` | `!!selectedEntity && !!nominations && pageEntity.type === selected.type && pageEntity.id === selected.id` | page data and route params: `selectedEntity` (the user's list × the two params) and `page.data.contestantUserData.entity` |
| `hasNomination` | `hasNomination(nominations)` | page data |
| `questionsReady` | `this.#questionsReady && storeHoldsSelected`, where `storeHoldsSelected` compares `userData.savedEntityData`'s type and id with `selectedEntity`'s | the rollup effect's `$state`, and the store's `savedEntityData` (not `current`, which is a clone replaced on every draft change) |
| `unansweredRequiredInfoCount` | `unansweredRequiredInfoQuestions.length` | `unansweredQuestionsOf(requiredInfoQuestionsOf(infoQuestions), savedEntityData?.answers)` |
| `requiredNameMissing` | the existing name clause | store and `selectedEntity`, unchanged |
| `opinionCount` | `opinionQuestions.length` | the rollup |
| `unansweredOpinionCount`, `firstUnansweredOpinionId` | length and `[0]?.id` of `unansweredOpinionQuestions` | `unansweredQuestionsOf(opinionQuestions, savedEntityData?.answers)` |

So for an entity with no nomination the state is known — nomination `incomplete`, profile and questions `blocked`, next step the nomination, preview closed, not complete — from page data alone, on the server and on the first frame, whatever the store and the data root hold. With a nomination and the store empty, or holding another entity, the profile and the questions have no status and `known` is false.

### Other changes in the context

- **The rollup effect** has a second early return: a loaded entity's type with `selectedElections` empty writes the four empty lists, empty blocks and `questionsReady = false` through the private `#writeNoQuestions()` (which the first early return calls too) and makes no rollup call. On the rollup path `questionsReady` is `true`.
- **The filters**: `#requiredInfoQuestions`, `#unansweredRequiredInfoQuestions` and `#unansweredOpinionQuestions` are the shared functions' results. The context imports neither `getCustomData` nor `isEmptyValue` and nothing from `routes/`. One difference a caller cannot see in content: with no entity in the store the unanswered lists are a copy of the full list, where they were the list itself.
- **`profileComplete`** is false for an entity with no nomination, with no entity loaded, with a store holding another entity, and before the lists are loaded. Its readers, by search: the home (`+page.svelte`, its hero emoji and the `profileComplete` handed to `contestantHome.helpers.ts`), the profile page (`profile/+page.svelte`) and the questions overview (`questions/+page.svelte`). None was edited (PROH-176-21).

## What removing the sign-out changed, and what an entity with no nomination now meets

Not exercised in a browser: no dataset holds such an entity with a contestant session before plan 176-07. Read from the code:

| Page | What it meets |
|---|---|
| the entity-level load | served: its user data, an empty nominations list, question data with no category and no question; stays signed in |
| the entity layout | `validity` resolves (empty question data is allowed, the list is an array); `provideQuestionData` returns early on the empty input, so the data root keeps whatever it held; the store is initialised |
| the context | no selected election, so empty lists and blocks and `questionsReady` false; the task state as above |
| home | renders as it does today for an entity that is not complete; its own rules are plan 176-14's |
| profile | opens, with no info question |
| questions | the loading view for good (`questionsReady` never true) — the transitional state the plan names, closed by plan 176-08's gate |
| preview | reachable by URL until plans 176-08 and 176-10 |
| login page | has no message for a missing nomination; an old link with `errorMessage=candidateNoNomination` shows no message (`getErrorTranslationKey` answers `undefined` for a code not in the map) |

## The two retired codes: every reader, as derived

`git grep -n -e "candidateNoNomination" -e "nominationNoElection" -- apps packages tests scripts` at the plan's base:

| Reader | What became of it |
|---|---|
| `+layout.server.ts` (docblock and stage 4) | removed |
| `layout.server.test.ts` (header, `NO_NOMINATION_ROUTE`, one case) | removed; the case rewritten |
| `signOutToLogin.test.ts` (the case table) | holds `loginFailed` alone |
| `loginError.ts` (map and union) | `loginFailed` alone |
| `messages/<7 locales>/contestantApp.error.json` | two keys removed from each: 656 → **654** keys per catalogue; `contestantApp.*` 202 |
| `lib/types/generated/translationKey.ts` | regenerated in the same commit; regenerating again leaves no diff |
| `scripts/fixtures/assert-no-candidate-app-names.input.ts` | left as it is: a fixture of names; `--self-test` exits 0 |
| three pages of `apps/docs` | not edited — for plan 176-19 (below) |
| `tests/tests` | no occurrence, before and after (searched again before the commit) |

## Gates and runs

### The pre-commit run (the execution rules' order; the plan orders none)

`tests/e2e-runs/176-e2e/176-06-precommit`, through the wrapper, of head `0d8acaec5` with the load, the codes, the locale, the context and the skill reference uncommitted (`176-06-precommit.diff` beside it). Wrapper exit 0, no void marker. **268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 110 projects, 0 differing from `176-05-close`** (compared by a script over the two `summary.json`). Docker VM free before it: 19.32 GiB. After the five commits, `git diff 0d8acaec5 HEAD` is byte-equal to that kept diff (`cmp` exit 0).

### The gate rows

`tests/e2e-runs/176-gates/176-06-close`, head `186fbc34e`. typecheck 0 (19 s), lint 0 (44 s), unit 0 (66 s), check-frontend 0 (8 s), build 0 (16 s), format 0 (18 s). Verdict PASS, not stale, no Sleep entry in the window.

### The closing run

`tests/e2e-runs/176-e2e/176-06-close`, through `176-e2e.sh`, head `186fbc34e`, 02:11:55Z → 02:19:11Z. Driver exit 0, no void marker, no Sleep entry in its window. Docker VM free before: **19.24 GiB**; after: 19.18 GiB. AC power, 100 %.

```
counts: total 268, passed 268, failed 0, flaky 0, skipped 0, didNotRun 0; 110 project(s)
not stale: head 186fbc34e is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project contestant-entity-selection: 8/8 passed
project perm-organization-editing: 46/46 passed
project perm-answers-locked: 3/3 passed
compared with: tests/e2e-runs/176-e2e/176-05-close
per project: 110 compared, 0 not as expected
176-verdict e2e 176-06-close: PASS
```

and, from the second verdict, `project perm-localisation-positive: 2/2 passed`.

**The dev-server log of the closing run:** no Svelte warning line (searched `[svelte]`, `svelte … warning`, `state_referenced_locally`, `ownership_invalid`: 0); no line of the context's two "Error fetching election / constituency" logs (0); `Error formatting nomination` 47 times, the baseline's number (48 in the pre-commit run; that line is the profile block's, which this plan did not touch, and the one more was not looked into).

## Deviations from Plan

**1. One existing context case was inverted.** `'is true with no entity loaded, as the two question terms alone decide then'` is now `'is false with no entity loaded, although no question is unanswered then'`. It pinned the former formula's answer for empty lists, which is exactly what the plan's delta block makes false. It is counted among the 13 red cases, so "every existing case passes" in the red report holds for every case but this one.

**2. The harness's `loadEntity` gives the page data `contestantUserData`** (the same object the store's fake holds), in the red commit. Without it the `profileComplete` cases that load an entity would read "entity not known" after the change. It adds what the entity-level load always provides and changes no expectation; those cases pass at the red head and at the green one.

**3. `entityKnown` also compares the page data's entity with the route's entity, by type and id.** The plan says "the URL names an entity the user edits and page data holds its list"; "its" is enforced, so a page data and a route that named different entities could not lend one's nominations to the other. Held by the two "has no task and no next step" cases and the store-mismatch cases.

**4. The two early returns of the rollup share a private method**, `#writeNoQuestions()`, in place of two copies of six assignments.

**5. [Orchestrator's ruling] The locale step**, with two commits of its own (above).

**6. [Orchestrator's instruction] `.claude/skills/components/context-reactivity.md`** gained one paragraph naming the five accessors and the empty lists with no election. Not in the plan's file list.

**7. [Execution rules] One full E2E run more than the plan orders**, of the uncommitted tree, before any application commit. The plan calls its commits additive; the rules hold a change to a load and to what pages read until such a run has passed.

**8. The load's two changes were committed apart after the run** by committing the file without the locale argument and its two docblock phrases (`76235e8bf`), then with them (`afe6a22d8`). The tree at `76235e8bf` and `6cb84920e` was not itself run through the E2E suite; it differs from the run tree only by reading the entity in the default locale, as the baseline does. At those two heads the two locale cases and the four listed-entity cases are red, by design of the red commit before them.

**9. Cases beyond the plan's `<behavior>`:** an organization beside the candidate in the no-nomination load case; the store holding the same id under the other type; a route naming an entity the list does not hold; no lookup made on the empty rollup path; no count on a blocked task.

**10. The green reports were taken twice**: on the working tree before the pre-commit run and again at `186fbc34e`; the files and `.head` beside them are the second.

**11. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not a per-agent branch.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | pass for this plan's part: nobody is signed out over a missing nomination; the context holds one task state. The pages that read it are later plans' |
| OWASP | pass — no question read without an election scope and none unfiltered (T-176-20, T-176-21); one entity's nominations or counts are never taken for another's (T-176-22); nothing loaded is never "complete" (T-176-23). No new input, query or secret |
| Code style guide | pass by the linters: ESLint and Prettier exit 0 (lint and format rows) |
| `any` | none added |
| No repeated code | improved: the context's three inline filters are the shared ones; the rollup's empty write is one method |
| New entities documented | pass — a doc on each of the five type members saying it is a reactive accessor; `profileComplete`'s doc restated; the class doc names the page-derived list and the task state |
| Repo markdown | the skill reference updated; the docs site deferred to plan 176-19 |
| Tracking events | n/a — nothing a user can perform is added |
| Svelte component guidelines | n/a — no component edited; the context obeys the destructuring rule and binds `dataRoot` to no alias (`noDataRootDerivedAlias.test.ts` passes) |
| Errors handled and logged | pass — the failed entity read still logs and signs out; an entity with no nomination is a value, not an error |
| Failing checks | none at the closing head; six unit cases of the load are red at `76235e8bf` and `6cb84920e` (deviation 8) |
| Parts sharing dependencies | pass — full suite at its baseline in both runs |
| WCAG, keyboard | n/a — no markup changed; both a11y projects at their totals |
| Documentation | deferred to plan 176-19 |
| Comment hygiene | pass — the guard exits 0 before each commit; every added or changed comment and case title read: no history, no plan, decision or proposal id |
| Commit history | linear; three red commits, then four application commits and one docs commit, each on its own files |
| Formatting in its own commit | n/a |
| `[db]` tag | n/a — no schema change |

No finding needed a commit before the gate rows.

## For plan 176-19: the docs that still describe the sign-out

Not edited. Each names `candidateNoNomination` or the sign-out of an entity with no nomination:

- `apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md` (line 38 at the base)
- `apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md` (line 20)
- `apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md` (line 173)

Also for it: the catalogue counts in any document that states them (654 per locale).

## For plans 176-07 to 176-17

- **176-07 (the dataset):** an entity with no nomination now reaches its home, profile and (loading for good) questions page, signed in. Nothing gates the three pages before plan 176-08.
- **176-08 (the gate):** `hasNomination(page data's list)` is what the load already asks; the server knows the answer in stage 4. `contestantCtx.nominations` is the same list on the client.
- **176-10 (the preview's gate):** `contestantCtx.previewOpen` for the client; it is false while the state is not known, so a client-side redirect on `!previewOpen` must wait for `taskState.known`.
- **176-12 (the nominations view):** read `contestantCtx.nominations` (page data), not `userData.current.nominations`; its names are now in the request's locale, with the default locale as fallback and an empty string when no locale holds one. `nominationsViewTarget(contestantCtx.taskState)`.
- **176-14, 176-15 (home):** `homeAction(contestantCtx.taskState)`, `contestantCtx.tasks`; a row is pending while `task.status === undefined`. `profileComplete` is now false before the lists are loaded, where it was true: a hero that showed "done" on the first frame no longer does.
- **176-17 (the saves):** `taskState` follows the store's saved answers without a load (asserted); read it after `await userData.save()` for the target.
- **Any plan:** a `$derived(contestantCtx.taskState)` alias is safe (the state is replaced wholesale); destructuring it is not.

## For Phases 177 and 179

- `nominations` and "has a nomination" follow the entity-level load. **A write of a nomination must rerun that load** (it depends on the two entity params alone and has no dependency key) for `nominations`, `taskState` and the question read to follow; the store's `reloadEntityData` reads with `loadNominations: false` and does not update them.
- The two election effects still read `userData.current.nominations`, the list `init` was given.

## Not done, or not verified

- **No browser exercise of an entity with no nomination** — no dataset holds one with a session (plan 176-07). The table above is a reading of the code and the unit cases.
- **The language switch's reload** is read from the component's attribute, not exercised.
- **No E2E assertion of a localized organization name or nomination name** exists; the locale change is held by unit cases at the load and, for the writer, by plan 176-05's cases.
- **The intermediate heads `76235e8bf` and `6cb84920e`** were not run through the E2E suite (deviation 8).
- **The one extra `Error formatting nomination` line** of the pre-commit run was not looked into.
- **Sentences this plan made false elsewhere, not edited:** the three docs pages above. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not edited; none was searched for such a sentence.
- pgTAP and the SQL lint were not run; nothing was appended to `.planning/WINDOWS.md` (no stub, no skipped test, no verify left unrun).

## The state the local database is left in

Read with `psql` after the closing run: schema the tree's, no reset made by this plan; 3 projects; 377 nominations in the default project (the `default` dataset); 2 auth users; **`private.invitation_link_witness`: 52 rows** (26 before, two full runs added 26), so pgTAP file 39 test 238 stays red without a reset — the known finding. pgTAP helpers are still in `public`. The stack is up and was not restarted; nothing pruned but the build cache by the driver; nothing listens on the wrapper's port. Docker VM free: 19.18 GiB.

## Files touched that the plan did not list

- `.claude/skills/components/context-reactivity.md` (deviation 6).

Gitignored evidence: `tests/e2e-runs/176-e2e/176-06-precommit/` with `.diff`, `.head`, `.started`, `.dockerfree.txt` beside it; `tests/e2e-runs/176-e2e/176-06-close/`; `tests/e2e-runs/176-gates/176-06-close/`; in `tests/e2e-runs/176-unit/`: `176-06-load-red.*`, `176-06-locale-red.*`, `176-06-load-green.*`, `176-06-context-red.*`, `176-06-context-green.*`, `176-06-t1-verify.*` to `176-06-t3-verify.*`, `176-06-work*`, `176-06-precommit-run.*`, `176-06-verify-all.*`, `176-06-gates-close.*`, `176-06-gates-verdict.log`, `176-06-e2e-close.*`, `176-06-e2e-verdict-locale.log`. Nothing under `tests/e2e-runs/` was deleted. `CAND-APP-PLAN.md` stays untracked.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-20 and T-176-21: the load's no-nomination cases (provider not built, not called) and the context's empty-rollup case. T-176-22: the two store-mismatch cases and the page-entity comparison. T-176-23: the cases for no entity, no nomination and unloaded lists. T-176-24: accepted, unchanged.

## Self-Check: PASSED

- The eight commits are ancestors of HEAD; `git rev-list --count c0bc452bb..HEAD` was 8 before this file's commit.
- `176-06-t1-verify.exit`, `-t2-`, `-t3-` each hold 0 at head `186fbc34e`; the gate verdict and both E2E verdicts exit 0; the closing run's directory holds no void marker.
- `git diff --quiet c0bc452bb HEAD -- .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md CLAUDE.md` exits 0.
- `git status --short` before this file was written showed the untracked `CAND-APP-PLAN.md` alone.

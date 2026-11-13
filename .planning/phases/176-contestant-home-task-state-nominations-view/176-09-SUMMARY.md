---
phase: 176-contestant-home-task-state-nominations-view
plan: 09
subsystem: frontend
tags: [questions-layout, required-info, redirect-removed, no-nomination, e2e, tdd]
requires:
  - phase: 176-06
    provides: questionsReady and the rollup's empty lists
  - phase: 176-07
    provides: the perm-no-nomination dataset and its state steps
  - phase: 176-08
    provides: the route group (nominated) and the fixture contestantEntityPages
provides:
  - the questions layout with three views and no navigation request
  - the fixture step `contestantEntityPages.expectOnQuestions`, and `contestantQuestionsOverviewPage` on the no-nomination root
  - two `questions:` tests in the no-nomination spec
  - the per-project baseline `176-09-close` (281 tests, 113 projects)
affects: [176-10, 176-14, 176-15, 176-16, 176-17, 176-18, 176-19]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+layout.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/layout.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
decisions:
  - "The questions layout decides its view on what is known of the opinion questions alone; it reads nothing about required info and requests no navigation"
  - "expectOnQuestions asserts the URL of the entity's questions list and the list's intro; on a full load the URL holds at once, so the intro is the assertion that tells the page from its loading view"
metrics:
  duration: ~30 min (03:27Z → 03:56Z)
  completed: 2026-10-09
status: complete
requirements-completed: []
actuals:
  tokens: 3915
  tasks: 2
  commits: 3
commits: 3
plan_head_before: 06f6a25c4dce8dbd979c8be803be8396e4281d11
plan_head_after: 10b2a4ddce8fddc463278e5c70796bd5d49aa083
---

# Phase 176 Plan 09: The Questions Open Without the Profile — Summary

**The questions layout no longer sends a user with unanswered required info to the profile and no longer holds its loading view for them: it has three views decided by the opinion questions alone; a browser shows a candidate with a confirmed nomination and a party with a pending one opening their questions with required info unanswered; the layout and those tests reached the repository in one commit after a green run of the uncommitted tree; the full suite is 281 of 281 in 113 projects.**

Everything below was measured in this session unless it says "read" or "not done".

## Read this first

1. Both tasks are done. The two `<automated>` blocks, run byte for byte from the plan with `bash`, each exit **0**.
2. One control, one pre-commit run, one full run: no `-rN`, no void run, no red run but the control, nothing retried.
3. **No committed spec relied on the withdrawn redirect** (the search is below), so `<uncommitted_changes>` held exactly the two paths the plan names.
4. **No state-step defect.** `setAnswers` ran for the first time here, for a candidate and for an organization, and worked; so did `setNominationState('pending')` followed by `setAnswers` on the organization.
5. **The control's red tests failed on the intro's visibility, not on the URL** as the plan predicted (deviation 1). The verdict passes: each is an expectation failure.
6. `requirements-completed` is empty on purpose: NOM-07's entries on home and in the menu are plans 176-14 to 176-16, and the preview's rule is 176-10.

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `faf795e5f` | `test(176-09): a fixture step for the questions of an entity by URL` | 1, step 1 |
| 2 | `410c4177d` | `test(176-09): the questions layout renders the questions whether or not required info is filled` | 2, step 1 (red) |
| 3 | `10b2a4ddc` | `feat(176-09): the questions open as soon as the entity has a nomination, whatever its profile holds` | 2, step 5, after `control … --green --were-red-in` passed |

All by pathspec on `feat/entity-signup-multi-grant`. Commit 3 holds exactly the layout and the spec.

## Each verify, with its real exit status

Scripts extracted from the plan by a script; evidence in `tests/e2e-runs/176-unit/176-09-t<N>-verify.{sh,log,exit,head}`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `faf795e5f` (spec uncommitted) | **0** |
| Task 2, as written (after the full run) | `10b2a4ddc` | **0** |
| `176-verdict.mjs control 176-09-control … --dirty-only <spec> --red "questions:"` | run head `faf795e5f` | **0** — PASS |
| the same run offered with `--green` | | **1** — refuses |
| `176-verdict.mjs control 176-09-precommit … --green --were-red-in 176-09-control` | run head `410c4177d` | **0** — PASS |
| the same run offered with `--red "questions:"` | | **1** — refuses |
| `176-verdict.mjs gates 176-09-close --rows typecheck,lint,unit,check-frontend,build,format` | `10b2a4ddc` | **0** — PASS |
| `176-verdict.mjs e2e 176-09-close …` as in Task 2 step 6 | `10b2a4ddc` | **0** — PASS |

## The layout's three views, as written

`ENTITY/(nominated)/questions/+layout.svelte`:

```ts
const questionsState = $derived(
  opinionQuestionsStateOf({ questionsReady: ctx.questionsReady, questionCount: ctx.opinionQuestions.length })
);
const view = $derived.by<'loading' | 'none' | 'questions'>(() => {
  if (questionsState === 'none') return 'none';
  return questionsState === 'loading' ? 'loading' : 'questions';
});
```

| View | Condition | Markup |
|---|---|---|
| `loading` | the entity's question data is not loaded (`questionsReady` false), whatever the lists hold | `<Loading />` |
| `none` | loaded, and no opinion question — with or without unanswered required info | the neutral page `contestant-questions-none` with its one Return, unchanged |
| `questions` | loaded, and at least one opinion question — **whether or not required info is answered** | `{@render children?.()}` |

**Removed:** the `$effect` that called `goto(getRoute.current('ContestantAppProfile'))`; the derived flag `requiredInfoMissing`; the `|| requiredInfoMissing` term of `view`; the import of `goto` from `$app/navigation`; the section comment above the effect. The layout no longer reads `ctx.unansweredRequiredInfoQuestions` and imports nothing from `$app/navigation`. **Untouched:** the three progress effects (the bar is pushed only while the state is `'some'`, so it is now shown for a user with unanswered required info too) and the neutral page. The `@component` docstring states the three views and that the layout asks for no navigation in any of them. No banner about missing basic info was added (PROH-176-29).

**No other gate of the questions on required info exists** in the group, by search (`goto(`, `unansweredRequiredInfoQuestions`, `ContestantAppProfile` under `(nominated)/questions`, tests excluded): the list page reads the unanswered required info for a warning text under the answers lock, and the question page's two `goto` calls are its save and its cancel.

## The layout's test

`layout.svelte.test.ts`, 14 cases (was 13):

- **Rewritten:** `shows the loading view and asks for the profile while required info is unanswered` → `shows the questions page, with the progress bar, while required info is unanswered, and asks for no navigation` — the children, no `goto`, progress `show`, maximum 3, current 2. The assertion of the request for the profile is gone.
- **Made a two-row table:** `never renders the page for an entity with none on the way from the first render to the questions page, %s` — with required info answered and unanswered.
- The header's item 2 says the layout asks for no navigation in any state.
- **The comment the orchestrator named** — `/** The title the layout no longer shows: that of an error. */` — now reads `/** The title of an error, which no view of the layout shows. */`, in commit `410c4177d`. The cases that use it stay.
- The fake context still exposes `unansweredRequiredInfoQuestions`, so a layout that read it again would be seen by the cases.

| Report | Head | Total · passed · failed |
|---|---|---|
| `176-09-layout-red` | `410c4177d` (the layout unchanged) | 14 · 12 · **2** — the rewritten case and the "unanswered" row, each `expected { loading: true, none: false, … } to deeply equal { loading: false, none: false, … }` |
| `176-09-layout-green` | `410c4177d` with the layout uncommitted | 14 · 14 · **0** |

On the working tree before the pre-commit run (`176-09-green-gates.log`): svelte-check 0; the frontend's whole unit suite 187 files, **3416 passed**, 20 skipped (3415 + 1); `assert:comment-hygiene` 0. ESLint and Prettier 0 on the layout.

## The fixture

- `contestantEntityPages.expectOnQuestions(entity)` — the URL matches `contestantUrlRe('/questions')` and carries the entity's type and id; `contestant-questions-intro` is visible. Both waits are `expect`s on `TIMEOUTS.slowPage`. The intro is rendered by the list page in both of its branches (read at `+page.svelte`), so the step holds for an entity with and without answers.
- The no-nomination root registers `contestantQuestionsOverviewPage` (the existing fixture; no test calls it yet).

## The search for committed expectations of the redirect (Task 1, step 2)

Commands: `git grep -n -i -e "required" -- tests/tests/specs tests/tests/fixtures`; `git grep -n -e "ContestantAppQuestions" -e "contestant/questions" -- tests/tests`; and a search for every assertion of a profile URL. **Found none that expects the redirect.** What was read, by file:

| File | What it does | Outcome |
|---|---|---|
| `specs/contestant/contestant-journey.spec.ts` | steps 12 to 14 reach the profile by `clickTask('profile')` and assert its URL; step 13's save with the required field empty asserts **home**; every `page.goto('/en/contestant/questions')` (six) is after step 14 has filled the required field | unchanged; 1/1 in the pre-commit and full runs. Its "opinions still disabled" expectation is the home's entry, plans 176-15 and 176-16 |
| `specs/perm/perm-answers-locked.spec.ts` and its setup | reaches a question page as a signed-in candidate (read from the search's hits in its header and one comment, not the file whole); asserts no profile URL | unchanged; 3/3 in both runs |
| `specs/perm/perm-organization-editing.spec.ts` | one entry with `routeId: 'ContestantAppQuestions'`; its `required` hits are the organization's name badge on the profile. No assertion of a profile URL after a questions URL (by the search; the file was not read whole) | unchanged; 46/46 in both runs |
| `specs/a11y/contestant-a11y.spec.ts` | two entries with `routeId: 'ContestantAppQuestions'`, reached as a candidate with answers | unchanged; 22/22 |
| `specs/voter/cold-entry-dataroot.spec.ts` | a cold load of the entity-less questions URL expects the list | unchanged; green in the full run |
| `fixtures/contestant/contestant-entity-selection.ts` | `expectOnQuestionsOverview` asserts the list | unchanged; 8/8 |
| `fixtures/contestant/contestantNoQuestionsPage.fixture.ts` | opens the neutral page | unchanged |

So no second control was made and no other spec's expectation changed.

## The spec's tests and the control

A third top-level describe, `perm-no-nomination: the questions of an entity that has a nomination`; the header's title-prefix sentence names `questions:`.

| Session | Title | State steps | Body |
|---|---|---|---|
| nominated candidate | `questions: a candidate with a nomination and required info missing opens its questions` | `setNominationState(ca-nominated, 'confirmed')` (the seeded row `nom-ca-nominated`); `setAnswers({ requiredInfo: false, opinions: 'none' })` | `open(grant, 'questions')`, a full load; `expectOnQuestions(grant)` |
| unnominated organization | `questions: a party that has just been given a nomination opens its questions without filling in its profile` | `setNominationState(or-none, 'pending')` (writes `nom-or-none`); the same answers | the same |

Dataset fields read: `qu-info-req` (required, left unanswered), `qu-opin-1` and `qu-opin-2` (asked of both types, so the entity has opinion questions).

**The control** — `tests/e2e-runs/176-e2e/176-09-control`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `faf795e5f` with the spec alone uncommitted (the copy as run: `176-09-control.perm-no-nomination.spec.ts`). **207 total, 205 passed, 2 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1 (the two), no void marker. Docker VM free before: 18.99 GiB; AC power, 100 %. Verdict `--red "questions:"`: **PASS** — "2 test(s) named by 'questions:'; 205 other test(s)". The first error line of each of the two:

```
Error: expect(locator).toBeVisible() failed
```

with `Locator: getByTestId('contestant-questions-intro')`, `Expected: visible`, `Timeout: 10000ms`, `element(s) not found`, at `expectOnQuestions`' second assertion.

## The pre-commit run and the one commit

`tests/e2e-runs/176-e2e/176-09-precommit`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `410c4177d` with the layout and the spec uncommitted (`176-09-precommit.diff`, the spec as run and `176-09-precommit.+layout.svelte.kept` beside it). Launched 03:37:54Z. Wrapper exit 0, no void marker. **207 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; `perm-no-nomination: 11 test(s), 11 passed`. Verdict `--green --were-red-in 176-09-control`: **PASS**, the two "was red, now passed". No test of another spec turned red. Before the commit `git diff HEAD` was byte-equal to the kept diff (`cmp` exit 0, inside the commit script, after the verdict and joined to the commit by `set -e`). Docker VM free before: 18.96 GiB (19878528 KiB). AC power.

**The one commit's paths** (`10b2a4ddc`): `…/(nominated)/questions/+layout.svelte` and `tests/tests/specs/perm/perm-no-nomination.spec.ts`.

## The gate rows and the full run

**Gate rows `176-09-close`** — `tests/e2e-runs/176-gates/176-09-close`, head `10b2a4ddc`, driver exit 0, verdict **PASS**: typecheck 0 (18 s), lint 0 (44 s), unit 0 (65 s), check-frontend 0 (9 s), build 0 (15 s), format 0 (18 s); no Sleep entry in the window.

**Full run `176-09-close`** — `tests/e2e-runs/176-e2e/176-09-close`, through `176-e2e.sh 176-09-close --require-project perm-no-nomination`, head `10b2a4ddc`, 03:47:26Z → 03:54:59Z. Driver exit 0, no void marker. Docker VM free before: **18.87 GiB** (the driver's reading); after: 18.81 GiB. AC power.

```
counts: total 281, passed 281, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 10b2a4ddc is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 11/11 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project perm-answers-locked: 3/3 passed
compared with: tests/e2e-runs/176-e2e/176-08-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-09-close: PASS
```

**Per project against `176-08-close` (279 in 113):** 112 projects at their totals; `perm-no-nomination` 9 → 11. 279 + 2 = 281. The whole table is `176-09-close.verdict.txt`. **`176-09-close` is the per-project baseline for plan 176-10.**

The run's dev-server log: no `[svelte]` warning line (0); `Error formatting nomination` 47 times (the baseline's number, as plan 176-06 read it). No axe finding and no width overflow: both a11y projects are at their totals and this plan adds no markup.

## The code review checklist

Over the layout, its test, the fixture step and the spec's tests.

| Item | Outcome |
|---|---|
| Solves the issue | yes for this plan's part: the questions depend on a nomination and on nothing else at their URL |
| OWASP top 10 | a browser-side redirect is deleted; it guarded no data — an entity could always write its answers through the API. No input, query or secret is added |
| Code style guide | ESLint and Prettier 0 (lint and format rows) |
| No `any` | none |
| No repetition | `expectOnQuestions` asserts what `contestant-entity-selection`'s `expectOnQuestionsOverview` asserts for its own entity type (URL and a list marker); the plan prescribes the step on this fixture. Not changed |
| New entities documented | TSDoc on the step and on the root's new fixture member; the layout's docstring restated |
| Repo markdown updated | `tests/README.md` names fixtures, not steps: nothing to change |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none; the layout reads `ctx.questionsReady` and `ctx.opinionQuestions` inside `$derived`, destructures only `getRoute` and `t`, and binds no alias of `dataRoot` |
| Errors handled | no error path changed |
| Failing checks | none at the closing head. At `410c4177d` two unit cases are red by design (the red commit) |
| Parts sharing the dependency | the full run holds every other project at its total |
| WCAG, keyboard and screen reader | no markup changed; the loading view no longer stands in before a client redirect, so a user with unanswered required info meets the page's own heading |
| Docs guides | no page under `apps/docs/…/contestant-app` describes the redirect (searched `redirect`, `basic info` with `question`: no hit). The layout's generated docstring page is stale until `generate:docs` — plan 176-19's |
| Comment hygiene | `assert:comment-hygiene` 0 before each commit; every added or changed comment and title read: no history, no plan, decision or assumption id; the one historical comment of the test file reworded |
| Commit history | linear; fixture step, red test, feature |
| No fixes of itself | none |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter, Edge Function sections | name nothing this plan touches |

No finding needed a change before the pre-commit run.

## Deviations from Plan

**1. The control's red tests failed on the intro, not on the URL.** The plan expects "a URL that is the profile's where the questions' was expected". On a full load the questions URL holds from the first frame, so the step's URL assertion passed at once and the test failed ten seconds later on the intro that the old layout never rendered. Each is an expectation failure and the verdict passes. Where the browser stood when the wait ended (the profile, by the old redirect) was not read from a snapshot.

**2. One case more than "rewritten, not extended".** The transition case became a two-row table (answered, unanswered); the plan's fifth behaviour is asserted in both. The red report therefore holds two failed cases.

**3. The root's new fixture is registered and uncalled**, as the plan's step 1 orders.

**4. One poll held two 45-second waits in one command** (the gate rows' second poll), against the execution rules' one bounded loop per poll.

**5. Three checks ran in the foreground**: `typecheck:tests`, ESLint and Prettier on the fixture and the spec (seconds each), and the single-file vitest run of the red report. Every E2E run, the gate set, svelte-check and the whole unit suite ran in the background and were polled.

**6. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not a per-agent branch.

Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## For plans 176-10 to 176-18

- **A user with a nomination and unanswered required info now reaches the questions list and every question page by URL**, and by any link that leads there. The home's and the menu's questions entries are still disabled for that user (Phase 175's rule in those surfaces): plans 176-15 and 176-16 own them. The journey's step-13 expectation "opinions still disabled" rests on those entries, not on this layout.
- **176-17 (the saves):** a user can now save an opinion answer while the profile is incomplete; the question page's routing after the last answer meets a state it could not meet before in a browser (the UI contract's case 4 (b), the profile as the target).
- **176-10 (the preview's rule):** nothing here touches the preview. For the nominated candidate with nothing answered, the questions open and the preview must not.
- **Any plan that adds tests to the spec:** `expectOnQuestions(grant)` is on `contestantEntityPages`; `contestantQuestionsOverviewPage` is on the root for steps inside the list (its `goToPage()` opens the entity-less URL). A one-project run of `perm-no-nomination` is 207 tests; the full run is 281 in 113 projects.
- **The dataset after this spec's last tests** (until the teardown): `ca-nominated` and `or-none` hold an empty answers object; `or-none` holds the pending row `nom-or-none`. Every test begins with its own state steps, so none reads this.
- **The state steps:** `setAnswers` has run with `{ requiredInfo: false, opinions: 'none' }` for both types. **Still called by no test:** `setAnswers` with an answer written (`requiredInfo: true`, `allButLast`, `all`), `setNominationsLocked`, and an update of an existing nomination row's `confirmed` to a different value.
- **Not fixed, for the closing plan:** `inFreshContext` duplicated in two setups; commit `46273d08d` as a fix of `b2fc5b1b4` (both plan 176-08's notes).

## The state the local database is left in

Read with `psql` after the full run: schema the tree's, no reset made by this plan; 3 projects; 377 nominations (the default project's `default` dataset, untouched); 2 auth users; no candidate under `e2e-perm-no-nomination-` left; **`private.invitation_link_witness`: 47 rows** (the known pgTAP finding without a reset); pgTAP helpers not looked at again. The stack is up and was not restarted; nothing pruned but the build cache, by the driver. Nothing listens on the wrapper's port. Docker VM free: 18.81 GiB.

## Not done, or not verified

- The page the browser stood on when the control's wait ended was not read (deviation 1).
- No browser assertion that the progress bar is shown for a user with unanswered required info: the component case asserts the setting; the spec asserts the list's intro.
- No assertion on a question page (as opposed to the list) for such a user: it renders under the same layout.
- `pmset -g log` was not read by hand: every run but the control is green, the control is red in exactly its two named tests, and each verdict's power line reports no Sleep entry.
- pgTAP, the SQL lint and the database rows of the gate set were not run (the plan names six rows).
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not edited; none was searched for a sentence this plan made false. `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## Files touched that the plan did not list

None.

Gitignored evidence: in `tests/e2e-runs/176-e2e/`: `176-09-control/` with `.perm-no-nomination.spec.ts`, `.verdict.txt`, `.refusal.txt`, `.dockerfree.txt`; `176-09-precommit/` with `.diff`, `.diff.atcommit`, `.perm-no-nomination.spec.ts`, `.+layout.svelte.kept`, `.verdict.txt`, `.refusal.txt`, `.dockerfree.txt`; `176-09-close/` with `.verdict.txt`. `tests/e2e-runs/176-gates/176-09-close/`. In `tests/e2e-runs/176-unit/`: `176-09-t1-verify.*`, `176-09-t2-verify.*`, `176-09-layout-red.*`, `176-09-layout-green.*`, `176-09-edit-*.py`, `176-09-commit-*.{sh,log}`, `176-09-spec-checks.log`, `176-09-green-gates.*`, `176-09-control-run.*`, `176-09-precommit-run.*`, `176-09-gates-close.*`, `176-09-gates-verdict.log`, `176-09-e2e-close.*`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-39: the redirect and the render condition left in one edit; the component case asserts the children and the two `questions:` tests assert the page in a browser. T-176-77: the layout was held uncommitted through `control … --green --were-red-in` and committed with the spec; Task 2's verify requires one commit for both.

## Self-Check: PASSED

- `faf795e5f`, `410c4177d` and `10b2a4ddc` are ancestors of HEAD; `git rev-list --count 06f6a25c4..10b2a4ddc` is 3.
- `176-09-t1-verify.exit` and `-t2-` each hold 0; the two control verdicts, the gate verdict and the E2E verdict exit 0 and the two refusals exit 1; no run directory holds a void marker.
- `git diff --quiet 06f6a25c4 HEAD -- .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md CLAUDE.md` exits 0.
- `git status --short` before this file was written showed the untracked `CAND-APP-PLAN.md` alone.

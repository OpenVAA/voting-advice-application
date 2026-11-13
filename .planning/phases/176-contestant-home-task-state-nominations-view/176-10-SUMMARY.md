---
phase: 176-contestant-home-task-state-nominations-view
plan: 10
subsystem: frontend
tags: [preview-gate, server-load, data-root-on-server, no-module-state, e2e, tdd, NOM-07]
requires:
  - phase: 176-03
    provides: hasNomination, previewOpenOf, requiredInfoQuestionsOf, unansweredQuestionsOf
  - phase: 176-07
    provides: the perm-no-nomination dataset, its composition root and its state steps
  - phase: 176-08
    provides: the route group (nominated), the place of the preview's load and the tracking utilities
  - phase: 176-09
    provides: the per-project baseline 176-09-close
provides:
  - the server-only module `previewGate.ts` with `isPreviewOpen`, answering true, false or undefined from rows read in the request
  - the preview's own load `(nominated)/preview/+page.server.ts`, which redirects a closed preview to the entity's home with 307
  - fixture steps `contestantEntityPages.expectOnPreview`, `.clickHomePreviewEntry`, `navMenu.goHome`
  - the state step `completeAnswers(target)` on the organization-editing composition root
  - two `preview:` and two `holds:` tests in the no-nomination spec
  - the per-project baseline `176-10-close` (285 tests, 113 projects)
affects: [176-11, 176-12, 176-14, 176-15, 176-16, 176-17, 176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "a server-only helper that builds a DataRoot inside the call and binds nothing at module scope"
    - "after an in-app click whose navigation needs a data request, wait for the heading's focus before reading the URL"
key-files:
  created:
    - apps/frontend/src/lib/server/contestant/previewGate.ts
    - apps/frontend/src/lib/server/contestant/previewGate.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.server.test.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/page.tracking.test.ts"
  modified:
    - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/fixtures/contestant/perm-organization-editing.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
decisions:
  - "S1 as ruled: the preview's load builds a DataRoot on the server from two extra reads and calls the rollup, the two filters and the predicate the context calls; S2 was not needed"
  - "The helper gives no answer (undefined) and the load redirects nowhere when the question data is unusable, a read fails, or a nomination names an election or constituency the data does not hold"
  - "The stale-entry test waits for the first-level heading's focus before it reads the URL: without that wait it passed on a tree that had no rule"
  - "Organization-editing tests that open a preview of an organization call completeAnswers after their first state step; the candidate's preview test is left alone because the candidate is asked nothing it must answer"
metrics:
  duration: ~45 min for this executor (about 04:00Z → 04:45Z), after an earlier executor's Task 1 step 1
  completed: 2026-10-09
status: complete
requirements-completed: []
actuals:
  tokens: 16768
  tasks: 3
  commits: 4
commits: 4
plan_head_before: ef5d1ff263d3c51244bfe2b4da3771692e219718
plan_head_after: d91ff1de47c58bda3e9d894e7cf2a2aa9915c733
---

# Phase 176 Plan 10: The Preview's Own Server Gate — Summary

**An entity's preview is now closed on the server until the entity has a nomination, no unanswered required info question and no unanswered opinion question: the preview's own load builds a data root from that request's rows, asks the rollup, the filters and the predicate the browser asks, and answers a closed preview with a 307 to the entity's home; a browser shows it closed by URL, opening on the click after the last save, and refusing an entry a stale page still shows open; the rule and every spec it touches reached the repository in one commit after a green run of the uncommitted tree; the full suite is 285 of 285 in 113 projects.**

Everything below was measured in this session unless it says "read" or "not done". Two executors worked on this plan: the first made commit `9b44d3759` (Task 1, step 1) and handed back; this one did the rest.

## Read this first

1. All three tasks are done. The three `<automated>` blocks, run byte for byte from the plan with `bash`, each exit **0**.
2. **S1 was built, as ruled; assumption A-S1 held.** A `DataRoot` is built in a server load from the provider's election, constituency and question data and resolves the nominations' elections. S2 was not used and nothing of it is in the tree.
3. **The control was made twice.** In the first attempt the stale-entry test **passed on a tree with no rule**: it read the URL before the click's navigation had ended. The test was corrected (one step added) and the control made again as `176-10-control-r2`, which passes (deviation 1). The first attempt is kept, with its failing verdict.
4. **The two-entity unit case fails on a helper that caches its data root at module scope**, in both orders, and passes on the helper as committed. The mutation was made once, recorded and reverted byte-equal.
5. **No assertion of a Phase 175 test was changed.** Five of that spec's six preview openers gained one state step; the sixth already satisfied the rule.
6. **One finding outside this plan, not fixed and not measured:** plan 176-08's committed stale-entry test reads the URL first and the focus second, the order this plan's measurement shows to be vacuous once the navigation costs a data request. See "For plans 176-11 to 176-18".
7. `requirements-completed` is empty on purpose: NOM-07's entries on home and in the menu are plans 176-14 to 176-16. Until then the home's and the menu's preview entries follow the older rule in the browser (open once the required info is filled, whatever the opinions), so a user with an opinion question unanswered can click an entry that leads back to home.
8. `commits: 4` is the measured count over the ledger's base; one of the four is the orchestrator's `27349ae37` (docs), three are this plan's.

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `9b44d3759` | `test(176-10): fixture steps for the preview of an entity, and a state step that completes an entity's answers` | 1, step 1 (the earlier executor) |
| 2 | `684b7ab13` | `test(176-10): the server's rule for an open preview, and the preview's own gate` | 2, step 1 (red; the two modules decide nothing) |
| 3 | `d91ff1de4` | `feat(176-10): the preview opens once the required info and every opinion question are answered, decided on the server` | 3, step 2, after `control … --green --were-red-in` passed |

All by pathspec on `feat/entity-signup-multi-grant`. Commit 3 holds five paths: the helper, the load, the two specs, and `previewGate.test.ts` (deviation 2).

## Each verify, with its real exit status

Scripts extracted from the plan by a script; evidence in `tests/e2e-runs/176-unit/176-10-t<N>-verify.sh` with `.log`, `.exit`, `.head`.

| Verify | Head | Exit |
|---|---|---|
| `176-verdict.mjs control 176-10-control … --red "preview:"`, first attempt | run head `27349ae37`, specs uncommitted | **1** — one named test ended passed |
| the same, reading the second attempt `176-10-control-r2` | run head `27349ae37`, specs uncommitted | **0** — PASS |
| Task 1, as written | `27349ae37`, specs uncommitted | **0** |
| Task 2, as written | `684b7ab13`, helper, load and one test file uncommitted | **0** |
| `176-verdict.mjs control 176-10-precommit … --green --were-red-in 176-10-control` | run head `684b7ab13` | **0** — PASS |
| `176-verdict.mjs gates 176-10-close --rows typecheck,lint,unit,check-frontend,build,format` | `d91ff1de4` | **0** — PASS |
| `176-verdict.mjs e2e 176-10-close --same-projects-as 176-09-close --except perm-no-nomination=+ …` | `d91ff1de4` | **0** — PASS |
| Task 3, as written (after the full run) | `d91ff1de4` | **0** |

## The helper — `apps/frontend/src/lib/server/contestant/previewGate.ts`

```ts
export async function isPreviewOpen({ dataProvider, locale, userData, questionData }: PreviewGateInput): Promise<boolean | undefined>
```

- `dataProvider: PreviewGateReader` — `getElectionData({ locale })` and `getConstituencyData({ locale })`; the request's own provider satisfies it.
- `userData: PreviewGateEntity` — `entity.type`, `entity.answers`, `nominations` (each with `electionId`, `constituencyId`). The parent's `contestantUserData` satisfies it.
- `questionData: unknown` — the parent's `questionData`, which is the error itself when that read failed.

**The exact rule.** In order:

1. No nomination (`hasNomination` false, or no list): **`false`**, and nothing is read.
2. Question data that is not `{ categories: [], questions: [] }`-shaped, or is an `Error`: **`undefined`**, logged once.
3. Otherwise: the election data and the constituency data are read through the provider, in parallel, in the request's locale; `new DataRoot()` inside the call; `provideElectionData`, `provideConstituencyData`, `provideQuestionData`; `getElection` and `getConstituency` for each nomination, deduplicated; `rollUpQuestionCategories({ dataRoot, elections, constituencies, entityType: entity.type })`; then `previewOpenOf({ hasNomination: true, unansweredRequiredInfoCount: unansweredQuestionsOf(requiredInfoQuestionsOf(infoQuestions), entity.answers).length, unansweredOpinionCount: unansweredQuestionsOf(opinionQuestions, entity.answers).length })` — **`true`** or **`false`**.
4. Anything thrown inside step 3 — a failed read, an election or constituency the data does not hold, the rollup's refusal of an unmatchable opinion question: **`undefined`**, logged once, never thrown.

**What it reads.** What the caller hands it (rows the parent loads read in that request), and two reads of its own. Nothing of the request's URL or body reaches it.

**Its top-level statements, listed:** nine `import` lines (five of values, four of types); three exported types (`PreviewGateReader`, `PreviewGateEntity`, `PreviewGateInput`); the exported `async function isPreviewOpen`; the function `isQuestionData`. No `let`, `var` or `const` at the top level. It holds no applicability rule of its own.

**The cases** (`previewGate.test.ts`, 17, over plain rows and the real data root, rollup, filters and predicate; only the reader and the log are replaced): closed on unanswered required info; closed on an unanswered opinion; closed on missing or empty saved answers; open with both filled; `false` and `0` are answers; open on required info alone when no opinion question is asked of the type; open when nothing must be answered; another entity type's question, another election's question and a locked required question are not counted — and each is counted for the entity it is addressed to; no nomination is closed with no read; an error as question data, another shape, an unknown election and a failed read each give `undefined`; the two reads carry the locale; the two-entity case in both orders.

### The two-entity case and the mutation

`answers a second entity from its own rows and nothing of the first (a, then b)` and `(b, then a)`: two elections that share no question; each call is given the question data of its own election, as that election's own read returns it. The first entity has answered everything of its own election: open. The second has answered everything of its own and nothing of the first's: open. A third holds the first's answers and none of its own election's: closed.

**The mutation, made once:** a module-level `let cachedRoot: DataRoot | undefined`, filled on the first call and reused (`tests/e2e-runs/176-unit/176-10-previewGate.ts.mutation`).

| Run | Result |
|---|---|
| the case alone, `a, then b`, under the mutation | **failed** — `expected false to be true` at `expect(secondOpen).toBe(true)` |
| the case alone, `b, then a`, under the mutation | **failed** — the same assertion |
| the whole file under the mutation | 17 total, **6 failed**, the two-entity cases among them |
| the case alone, each order, after the revert | passed |

The helper after the revert is byte-equal to the helper before it (`cmp` exit 0 against `176-10-previewGate.ts.before-mutation`).

## The load — `(nominated)/preview/+page.server.ts`

Stages, as written: (1) `await parent()`; a non-null `gate` returns `{}` with nothing read; (2) no `contestantUserData` returns `{}`; (3) `createDataProvider({ fetch, locals })` over this request's client, as the entity-level load builds its own, then `isPreviewOpen`; (4) `false` → `redirect(307, buildRoute({ route: 'ContestantAppEntityHome', locale, entityType, entityId }))`; (5) `true` or `undefined` → `{}`.

It takes `fetch`, `locals`, `params` and `parent` and reads no `url` property and no `route`; it never signs anyone out. `page.server.test.ts` holds 13 cases, `page.tracking.test.ts` 9 with one control per instrument (`recordingUrl`, `recordingParams`, `forbiddenRoute` with the event Proxy).

**The reads a navigation to the preview makes:** the parent chain on the server (read, not measured: the user-level load's three reads, the entity-level load's entity read with nominations and its question read) and, for an entity with a nomination, two more — election data and constituency data. Before this plan a navigation to the preview from another page of the group made no data request; it now makes one on every arrival. No other page gained a read.

## Red and green (unit)

| Report | Head | Total | Failed | Passed |
|---|---|---|---|---|
| `176-10-preview-red.json` | `684b7ab13` | 39 | 31 | 8 |
| `176-10-preview-green.json` | `684b7ab13` with the implementation uncommitted | 39 | 0 | 39 |

Every one of the 31 is an expectation failure (`expected undefined to be false`, `expected "vi.fn()" to be called 1 times`, `promise resolved "{}" instead of rejecting`); no file-level error. With the implementation in the working tree: `yarn workspace @openvaa/frontend check` **0** (2158 files, 0 errors, 0 warnings); the frontend's unit suite **0** (190 files passed, 1 skipped; 3455 tests passed, 20 skipped); ESLint **0**; Prettier **0**; `yarn assert:comment-hygiene` **0**.

## Every opener of the contestant preview across the suite

Derived by search over `tests/tests` for `contestantPreviewPage.open(`, `ContestantAppPreview`, `contestant/preview`, `clickTask('preview')`, `contestant-nav-preview`, `contestant-home-preview`, `clickHomePreviewEntry`, `Preview'` and `/preview`.

| Test or scan entry | Spec | Entity | State it opens the preview in | Rule holds | Done |
|---|---|---|---|---|---|
| step 21 of the journey (`page.goto('/en/contestant/preview')`) | `contestant-journey.spec.ts` | the journey's own candidate | after step 18 answered every opinion question in the browser and step 19 asserted all three home tasks enabled | yes | left alone |
| scan entry `cand-preview` | `a11y/contestant-a11y.spec.ts` | the base dataset's CA-AA-1 | seeded with `withInfoAnswers(GENERIC)`: an answer to each of the 14 opinion questions (read) and the default info answers | yes (the scan reaches the preview: 22 of 22) | left alone |
| `preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone` | `perm-organization-editing.spec.ts` | `or-confirmed` | seeded with `qu-opin-1` and `qu-opin-2`; `qu-opin-3` unanswered unless an earlier test saved it | **no** | `completeAnswers(CONFIRMED_ORGANIZATION_GRANT)` after the state step |
| `holds: the candidate's preview shows its card and no tag line` | the same | `ca-unconfirmed` | no answer; no opinion question is addressed to candidates and `qu-info-cand` is `required: false` | yes — open on required info alone | left alone |
| `voter: the saved name and short name of organization B are shown after a reload, in its preview and, once it is confirmed, to a voter` | the same | `or-unconfirmed` | seeded with no answer: three opinion questions unanswered | **no** | `completeAnswers(UNCONFIRMED_ORGANIZATION_GRANT)` after the two state steps |
| `voter: the saved logo of organization B is the image a voter sees` | the same | `or-unconfirmed` | the same | **no** | the same call after the state step |
| scan entry `org-preview` (light and dark) | the same | `or-confirmed` | as the first row | **no** | the call in its `reach`, after the state step |
| `phone: the preview of an organization with a long name fits the viewport and shows the name in full` (once per viewport) | the same | `or-confirmed` | as the first row | **no** | the call after the state step |
| two `screenshot matches baseline` tests | `visual/visual-regression.spec.ts` | the session of `auth-setup`, CA-AA-1 (read) | as the `cand-preview` row | yes, by that row | project `visual-regression`, opt-in through `PLAYWRIGHT_VISUAL` and outside the default run: **not run**, no baseline regenerated |

**Not openers:** the journey's `contestant-nav-preview` assertions read the menu item's visibility and `href` and click nothing. `perm-answers-locked.spec.ts` holds none of the searched forms and opens no preview. The `gate:` tests of this phase's spec open the preview URL of entities with no nomination, which the group's load answers first.

The dataset fields behind the table were read in `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts`: `qu-opin-1..3` are `entity_type: ['organization']`, `required: true`; `qu-info-org`, `qu-info-org-locked` (locked) and `qu-info-cand` are `required: false`.

### What runs after a call of `completeAnswers`, and what it reads of that entity's answers

For an organization of this dataset the step writes opinion answers only (no info question is required), so only a test that reads an opinion answer or its absence is affected.

| After the first call for | Test or scan entry, in file order | Reads of that entity's answers | Writes what it reads |
|---|---|---|---|
| `or-confirmed` | `voter: the saved colour and answers of organization A are what a voter sees` | the continue prompt, the unanswered question's text, where the save leads | yes — `clearAnswers` of `qu-opin-3` and `qu-info-org` in its first step |
| `or-confirmed` | `voter: the saved name and short name of organization B …` (it sets A's `confirmed`) | nothing | — |
| `or-confirmed` | scans `org-profile-locked`, `org-profile-colour-invalid` | nothing (the profile's identity, names and colour) | — |
| `or-confirmed` | scan `org-preview`; `phone: the preview of an organization with a long name …` | that the preview opens | yes — each calls `completeAnswers` |
| `or-confirmed` | `phone: a locked profile with a long name and a colour …` | nothing | — |
| `or-unconfirmed` | `voter: the saved logo of organization B …` | that the preview opens | yes — calls `completeAnswers` |
| `or-unconfirmed` | `profile: a name edited before a confirmation is refused by name` | nothing | — |
| `or-unconfirmed` | scans `org-profile-editable`, `-editable-translations`, `-answers-locked`, `-name-refused` | nothing | — |
| `or-unconfirmed` | `phone: an editable profile with every translation shown …` | nothing | — |

No test reads an absence it does not write: no `clearAnswers` and no `afterEach` was added. `holds: a confirmed organization answers the opinion question it has left …` runs before the first call and removes its own answers.

### `completeAnswers(target: EntityGrantTarget)`

On `tests/tests/fixtures/contestant/perm-organization-editing.ts` (commit `9b44d3759`). Over the dataset's six questions by external id, it counts a question whose `entity_type` is null or holds the target's type and that is an opinion question, or an info question with `required === true` and `custom_data.locked !== true`; it writes `{ value: <first choice id> }` for `singleChoiceOrdinal` and `{ value: { en: 'An answer the test wrote.' } }` for `text`, only where the stored value is undefined, null or `''`; one `update` of `answers`, only when something was added; it throws on a missing entity or question, another question type or a failed write. **First run in a browser here: no defect.** Its emptiness test is narrower than the application's `isEmptyValue` (an empty object or a whitespace string counts as an answer to it); nothing in this dataset stores either.

## The spec's tests and the control

A fourth top-level describe, `perm-no-nomination: the preview of an entity that has a nomination`, under the nominated candidate's session. Each begins with `setNominationState(ca-nominated, 'confirmed')` and `setAnswers`; the fields read are the seeded row `nom-ca-nominated` and the questions `qu-info-req`, `qu-opin-1`, `qu-opin-2`.

| Title | Body |
|---|---|
| `preview: stays closed while required info or an opinion question is unanswered` | required info and all opinions but the last: `open(grant, 'preview')`, `expectOnHome`; then required info missing and every opinion: the same |
| `preview: a browser that still shows the entry open is sent home by the server` | every answer set; `openHome`, `expectOnHome`; `setAnswers` to all but the last behind the page; `clickHomePreviewEntry`; `expectHomeHeadingFocused`; `expectOnHome` |
| `holds: the preview opens on the click that follows the last answer saved in the browser` | all but the last; the list by URL, its continue prompt, a choice, `saveAndLeave`; then with no page load `navMenu.goHome()`, `clickHomePreviewEntry`, `expectOnPreview` |
| `holds: a candidate with everything answered opens its preview by URL` | every answer set; `open(grant, 'preview')`; `expectOnPreview` |

**The control, first attempt** — `tests/e2e-runs/176-e2e/176-10-control`, head `27349ae37` with the two specs uncommitted. 211 total, 210 passed, **1 failed**. Verdict `--red "preview:"`: **FAIL (1)** — "preview: a browser that still shows the entry open is sent home by the server: ended passed, not failed". Cause, read in the run: the test took 795 ms; its `expectOnHome` ran while the click's navigation was still waiting for its data request, so the URL was still home's. Docker VM free before: 18.80 GiB; AC power.

**The control, second attempt** — `tests/e2e-runs/176-e2e/176-10-control-r2`, the same head, the corrected spec (copies as run: `176-10-control-r2.perm-no-nomination.spec.ts`, `176-10-control-r2.perm-organization-editing.spec.ts`). **211 total, 209 passed, 2 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1 (the two), no void marker. Verdict: **PASS** — "2 test(s) named by 'preview:'; 209 other test(s)". Docker VM free before: 18.75 GiB; AC power. The first error line of each:

```
preview: stays closed while required info or an opinion question is unanswered
  Error: expect(page).toHaveURL(expected) failed        (received …/preview where home's URL was expected)
preview: a browser that still shows the entry open is sent home by the server
  Error: expect(locator).toBeFocused() failed           (getByRole('heading', { level: 1 }): element(s) not found, on the preview)
```

In both attempts the two `holds:` tests and every test of the organization-editing spec passed on a tree with no rule, the five with their new state step among them (46 of 46).

**The stale-entry test's result:** red without the rule (second control), green with it (the pre-commit run, 953 ms, and the full run). It asserts nothing about how home or the menu renders a closed entry.

## The pre-commit run and the one commit

`tests/e2e-runs/176-e2e/176-10-precommit`, through the wrapper with `--no-db-reset --project perm-no-nomination`, head `684b7ab13` with the helper, the load, `previewGate.test.ts` and the two specs uncommitted (`176-10-precommit.diff`; the specs as run and `176-10-precommit.previewGate.ts.kept`, `.previewGate.test.ts.kept`, `.+page.server.ts.kept` beside it). Launched 04:24:57Z. Wrapper exit 0, no void marker. **211 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; `perm-no-nomination: 15 test(s), 15 passed`. Verdict `--green --were-red-in 176-10-control`: **PASS**, the two "was red, now passed" (it read `176-10-control-r2`). No test of another spec turned red: the journey, the contestant scans and the organization-editing spec ran in this chain. Before the commit `git diff HEAD` was byte-equal to the kept diff (`cmp` exit 0, in the commit script, after the verdict and joined to the commit by `set -e`). Docker VM free before: 18.70 GiB; AC power.

**The one commit's paths** (`d91ff1de4`): `previewGate.ts`, `previewGate.test.ts`, `…/(nominated)/preview/+page.server.ts`, `tests/tests/specs/perm/perm-no-nomination.spec.ts`, `tests/tests/specs/perm/perm-organization-editing.spec.ts`.

**Assumption A1 held** for the save-then-Preview click: the answer saved in the browser a moment before was seen by the preview's load, with no page load in between, in three runs (two of them without the rule, where the test asserts only that the preview opens).

**Timing (recorded, not gated).** The preview's data request could not be timed on its own: the dev-server log holds no request line and the JSON report no step timing. Whole-test durations instead: the click test 2574 ms with the rule against 2479 and 2594 ms without it; the by-URL test 345 ms against 382 and 359 ms. The two extra reads are inside the spread between runs.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-10-close`, head `d91ff1de4`: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry in the window. Verdict: **PASS**.

**The full run** — `tests/e2e-runs/176-e2e/176-10-close`, head `d91ff1de4`, started 04:34:45Z, through the driver with `--require-project perm-no-nomination`. Driver exit 0. Docker VM free before: **18.62 GiB**; after: 18.54 GiB. AC power; `sleep_entries_in_window: 0`.

```
counts: total 285, passed 285, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
project perm-no-nomination: 15/15 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project perm-answers-locked: 3/3 passed
per project: 113 compared, 0 not as expected
176-verdict e2e 176-10-close: PASS
```

Against `176-09-close` (281 tests): `perm-no-nomination` 15 against 11; each of the other 112 projects at its total. No void run, no red run but the two controls, nothing retried, no axe finding, no overflow.

## The code review checklist

Walked over the helper, the load, their three test files, the fixtures, the state step and the two specs.

| Item | Outcome |
|---|---|
| Solves the issue | yes — the preview's half of NOM-07; the home's and the menu's entries are later plans |
| OWASP top 10 | access control: the answer rests on rows read on the user's own session in that request, and nothing of the URL but two params the route's matchers admitted; the redirect target is built from a route key, so no open redirect; no state outlives a call (the mutation above). Logging: the two log lines carry an error or unusable question data, no user data |
| Code style guide | followed; exported symbols carry TSDoc |
| No `any` | none; test fixtures use `as` casts to the provider's row types, as the group's tests do |
| No repeated code | the helper holds no rule of its own. The three test files share their fake-event form with the group's two tests, by that directory's convention. `completeAnswers` restates, for one dataset, which questions the rule counts: an E2E state step cannot import application code |
| New entities documented | yes |
| Repo docs updated | not here: the developer docs for this phase are plan 176-19 |
| Tracking events | no new user-facing function |
| Svelte component guidelines | no component added or changed |
| Errors handled and logged | yes — both no-answer paths log once and redirect nowhere |
| Failing checks | none |
| Shared dependencies | `questionRollup.ts` and `$lib/contestant/tasks` are now imported by a server module as well; neither was changed, and the frontend's unit suite is green |
| WCAG A and AA; keyboard and screen reader | no surface added; after a refusal the focus is on home's heading (asserted by the stale-entry test) |
| Guides | plan 176-19 |
| Comment hygiene | `yarn assert:comment-hygiene` 0; every added comment read |
| Commit history | three commits of this plan, none a fix of another: the one correction to a committed unit test rides in the commit of the implementation it tests |
| Formatting-only changes | none |
| `[db]` tag | no database change |
| Supabase backend, adapter, Edge Functions | not touched |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The stale-entry test passed on a tree with no rule**
- **Found during:** Task 1, step 4 (the first control)
- **Issue:** as the plan wrote it — click, then `expectOnHome` — the URL was read while the click's navigation still waited for its data request, so home's URL matched and the test passed whether or not the server refused. Plan 176-08's analogous test did fail in its own control because entering the group cost no data request then.
- **Fix:** `expectHomeHeadingFocused()` between the click and `expectOnHome`. The click moves focus to the entry; a heading has focus again only once the navigation has ended, so the URL is read after that. The control was made again as `176-10-control-r2`.
- **Files modified:** `tests/tests/specs/perm/perm-no-nomination.spec.ts`
- **Commit:** `d91ff1de4`

**2. [Rule 1 - Bug] A unit case handed the helper a nomination it meant to withhold**
- **Found during:** Task 2, step 2 (the first green run: 38 of 39)
- **Issue:** `answers closed and reads nothing` passed `undefined` nominations through a fixture function whose default parameter replaced them with one nomination.
- **Fix:** the case builds its entity data directly. The file was already committed (`684b7ab13`), so the correction is in the commit of the implementation rather than in a commit of its own; `<uncommitted_changes>` therefore held one path the plan does not name, `apps/frontend/src/lib/server/contestant/previewGate.test.ts`, and the one commit holds five paths.
- **Commit:** `d91ff1de4`

### Other departures

3. **The control's second red test fails on the heading's focus, not on the URL** as the plan predicted. Without the rule the browser lands on the preview, where no first-level heading is found. An expectation failure; the verdict passes.
4. **The exported function is `isPreviewOpen`**, in the module the plan names. The plan names no function.
5. **Task 2's files were written after the control had ended**, not beside it: a file added under `routes/` while the wrapper's server runs would have changed the tree that run served.
6. **Two report files were overwritten by a rerun under the same name** (`176-10-preview-mutation-two-*.json`): the first attempt's test-name filter matched no case and ran nothing; the files now hold the runs described above. No run directory and no marker was touched.
7. **Step 4's timing** is given as whole-test durations (above), for want of a per-request reading.

## For plans 176-11 to 176-18

- **The preview is closed on the server now; home and the menu are not yet.** `contestantCtx.previewOpen` (plan 176-06) follows the same predicate, so an entry rendered from it agrees with the server. Until 176-15 and 176-16 land, the home's entry is enabled once the required info is filled.
- **Server-side use:** `isPreviewOpen({ dataProvider, locale, userData, questionData })` from `$lib/server/contestant/previewGate`. `undefined` means "cannot decide": redirect nowhere.
- **A test that clicks an entry inside the application and then asserts where it led must wait for the navigation to end first.** `expectOnHome` straight after the click is vacuous when the starting page is home and the navigation needs a data request — which every navigation to the preview now does. Use `expectHomeHeadingFocused()` first, or assert a page other than the one the click started on.
- **UNCONFIRMED, not measured, not fixed:** plan 176-08's committed `gate: an entry the browser still shows open is redirected to home, with focus on its heading` reads the URL first and the focus second. By the mechanism measured here, its `expectOnHome` no longer proves a refusal now that the group has a load; whether its focus step alone would catch a missing gate depends on whether the profile focuses a first-level heading, which was not read. A control of that test with the group's redirect removed would settle it.
- **Observed once, not investigated:** on the preview, `getByRole('heading', { level: 1 })` found no element within 5 s after an in-app navigation (the second control). The preview is Phase 175's surface and its scans are green.
- **The stale-entry test stays valid** when a closed entry becomes a disabled button: its entry is open in the browser's own copy and stale only against the database.
- **Any plan that adds a test opening an organization's preview on Phase 175's dataset** calls `completeAnswers` first. Nothing restores what it writes; a test that needs an answer missing removes it in its own first step.
- **State steps now exercised:** `setAnswers` with `requiredInfo: true`, `allButLast` and `all`. Still called by no test: `setNominationsLocked`, and an update of an existing nomination row's `confirmed` to a different value.
- **Counts:** a one-project run of `perm-no-nomination` is 211 tests; the full run is 285 in 113 projects.

## For Phase 177

The preview's rule follows the entity's nominations through the rollup: the elections and constituencies handed to `rollUpQuestionCategories` are resolved from `contestantUserData.nominations`, which the entity-level load reads again on every arrival at the preview. When the questions follow a changed nomination there is nothing to change in the helper or the load. The browser's own copy of the entity still needs the entity-level load rerun after the user's own nomination write, as plan 176-08 recorded.

## For the operator

Phase 175's tests that open an organization's preview — three tests, one phone test and the `org-preview` scan — now give the organization an answer to every opinion question before they open it, through the new state step `completeAnswers`. They did not before: the confirmed organization is seeded with two of three opinion answers and the unconfirmed one with none, and nothing refused their previews. The rule of this plan would have turned each of them red. No assertion of those tests changed, and nothing they assert reads the added answers. Research assumption A8 — a hosted database reading its own write at once — cannot be tested locally and stays recorded for the deployment milestone.

## The state the local database is left in

Read with `psql` after the full run: no reset made by this plan; 3 projects; 377 nominations; 2 auth users; no row under `e2e-perm-no-nomination-` or `e2e-perm-organization-editing-` left; `private.invitation_link_witness`: 66 rows (the known pgTAP finding without a reset). The stack is up and was not restarted; nothing pruned but the build cache, by the driver. Nothing listens on the wrapper's port.

## Not done, or not verified

- `visual-regression` was not run (opt-in); that its candidate's preview stays open rests on the scan entry that uses the same session.
- The preview's data request was not timed on its own.
- The verdict's refusals in the other direction (`--green` on the control, `--red` on the pre-commit run) were not run.
- The cross-phase ledger `.planning/WINDOWS.md` was not appended to; the orchestrator owns the shared planning files.
- The two findings marked unconfirmed above.

## Files touched that the plan did not list

None in the repository. Under the gitignored `tests/e2e-runs/`: the runs and reports named above, with their launch, free-space, diff and verdict files.

## Known Stubs

None.

## Threat Flags

None: the new load and its two reads are the surface the plan's threat model covers (T-176-35, T-176-36, T-176-37, T-176-38, T-176-76).

## Self-Check: PASSED

The five created files and the kept runs and reports named above exist on disk; commits `9b44d3759`, `684b7ab13` and `d91ff1de4` are ancestors of HEAD; `git rev-list --count ef5d1ff26..d91ff1de4` is 4.

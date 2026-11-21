---
phase: 176-contestant-home-task-state-nominations-view
plan: 12
subsystem: frontend
tags: [nominations-view, contestant-app, route-key, entity-less-url, not-editable-note, task-state, e2e, tdd, NOM-02, TASK-01]
requires:
  - phase: 176-04
    provides: the descriptor members nominationsDescription, nominationsEmpty, nominationParentLabel, electionSymbolLabel and the contestantApp.nominations messages
  - phase: 176-05
    provides: EntityNomination with the names it is shown with, its confirmed flag and its optional parent
  - phase: 176-06
    provides: the context accessors nominations, nominationsLocked and taskState, and nominationsViewTarget
  - phase: 176-07
    provides: the no-nomination dataset, its state steps and the contestant.nominations test ids
  - phase: 176-11
    provides: NotEditableNote, the notEditableNote fixture and the per-project baseline 176-11-close
provides:
  - the nominations view at `…/<entityType>/<entityId>/nominations`, outside the `(nominated)` group
  - the route key `ContestantAppNominations`
  - the entity-less address `/contestant/nominations` (matcher list and resolver map)
  - the fixture `contestantNominationsPage.fixture.ts` (twelve steps), registered on the no-nomination composition root beside `notEditableNote`
  - seven `nominations:` tests in `perm-no-nomination.spec.ts`
  - the first callers of `setNominationsLocked` and of the update of an existing nomination row's `confirmed`
  - the per-project baseline `176-12-close` (293 tests, 113 projects)
affects: [176-13, 176-14, 176-15, 176-16, 176-17, 176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "a page that renders a list straight from page data: three states from one accessor (listed, empty, not known), with the empty state reserved for a list known to be empty"
    - "a departure from a locked decision isolated as one derived value of its own, so that its fallback is a one-line change"
    - "a card row written once as a page-local snippet and rendered per fact"
key-files:
  created:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/params/contestantEntityPage.ts
    - apps/frontend/src/params/contestantEntityPage.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts"
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/utils/testIds.ts
decisions:
  - "U-08 at its recommended option (operator's item C3 read as recommended-unticked (a)): the empty sentence is shown for every empty list, locked or not; the block is one derived value, emptySentenceShown"
  - "U-07 (a): the card is page-local markup — an article, an h2 and a dl — and not an InputGroup of locked inputs"
  - "U-10 (a): with every task complete the button returns to the entity's home"
  - "U-12 (a): the parent row is labelled by the nominee's type from the descriptor; the requested-party text and the round are not rendered"
  - "The fixture builds the view's URL from the entity home's route plus the literal /nominations, because the fixture is committed before the route key exists"
  - "A card's heading id is derived from the nomination's id, so the server-rendered and the hydrated markup agree"
metrics:
  duration: about 35 min (06:05Z to 06:40Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-02, TASK-01]
actuals:
  tokens: 14256
  tasks: 3
  commits: 6
commits: 6
plan_head_before: 30df61ecfd847747d4b641172892e99782835bec
plan_head_after: 3725317c997ed2887581d42142a3c09261a94d84
---

# Phase 176 Plan 12: The Nominations View — Summary

**An entity's user now has one page, `…/nominations`, that lists what the entity is nominated for with each nomination's real state, or says in the entity type's words that none is defined and whom to ask; it is outside the nomination gate, reachable without an entity in the URL, rendered from page data alone, and offers nothing to edit.**

## Read this first

- **Everything in the plan is done; nothing was red outside the control, and no run was void.** Full run `176-12-close`: 293 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 113 projects; `perm-no-nomination` 22 against 15, every other project at its `176-11-close` total.
- **U-08 was built as the block, not the fallback.** `176-BASELINE-FACTS.md` § *Operator rulings as read* has C3 as `recommended-unticked (a)`. It still departs from D-17's table as written and is still listed for an explicit ruling.
- **`commits: 6` is the measured count of the range and includes one commit that is not this plan's:** the orchestrator's `3725317c9 docs(state): paused for a context clearance`, which touches `.planning/` only and landed between this plan's last code commit and its full run. This plan's own commits before the summary are five.
- **Both state steps that had never been called work as written.** `setNominationsLocked` and the update of an existing nomination row's `confirmed` were first called here; neither needed a fix.
- The hook line "CONTEXT WARNING: Usage at 7x%" appeared after tool calls throughout. It was taken as the orchestrator's, as the dispatch says, and the plan was carried through.

## Task Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `d1aeeda98` | test(176-12): fixture steps for the nominations view |
| 2 | `7e8ec252d` | test(176-12): the nominations view's four states, its card and its button |
| 2 | `68bbae4ca` | feat(176-12): the nominations view shows an entity's nominations with their state, or says that none is defined |
| 3 | `e86015b21` | refactor(176-12): one snippet renders each row of a nomination card |
| 3 | `82a218cc7` | test(176-12): the nominations view for an entity with and without a nomination, locked and not |

Each was committed by pathspec from a script kept as `tests/e2e-runs/176-unit/176-12-commit-*.sh`.

## Each verify, with its real exit status

Each `<automated>` block was extracted byte for byte from the plan to `tests/e2e-runs/176-unit/176-12-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `d1aeeda98` | With the spec alone uncommitted, as the block requires. |
| 2 | **0** | `68bbae4ca` | In the background form; with the spec uncommitted. The red head `7e8ec252d` is an ancestor of the page's last commit and differs from it; it still does after the refactor (`e86015b21`). |
| 3 | **0** | `3725317c9` | After the full run and before any commit outside `.planning/`. HEAD was the orchestrator's docs commit, tree-equal to `82a218cc7` outside `.planning/`. |

Plan-level verification: `control 176-12-control … --red "nominations:"` exit 0; `control 176-12-precommit … --green --were-red-in 176-12-control` exit 0; `vitest run src/lib/routes src/params` exit 0; `yarn workspace @openvaa/frontend check` exit 0 (2165 files, 0 errors, 0 warnings); `e2e 176-12-close …` exit 0.

## Added by the orchestrator, item 1: plan 176-08's stale-entry `gate:` test no longer depends on timing

`gate: an entry the browser still shows open is redirected to home, with focus on its heading` in `tests/tests/specs/perm/perm-no-nomination.spec.ts` now asserts `expectHomeHeadingFocused()` between the click and `expectOnHome(…)`, with the comment plan 176-10's own test carries: the click moves focus to the entry, and a heading has focus again only once the click's navigation has ended, so the URL is read after that. Both assertions are kept; nothing was weakened or added. It is in commit `82a218cc7`, and it was in the working tree for both runs of the uncommitted tree: it passed in `176-12-control` (among the 212 others) and in `176-12-precommit`, and in the full run. No extra control was made for the reorder, as instructed.

## Added by the orchestrator, item 2: the comment on `contestant-answers-locked-warning`

`tests/tests/utils/testIds.ts`: the comment said three routes and named the `<Warning>` element. It now sits on the id itself and reads: the note a page shows while answers are locked, on the four pages that show it — an entity's home, its profile, its questions list and the page of one question — carrying `data-reason="answersLocked"`. Checked against the tree (`git grep "contestant-answers-locked-warning" -- apps/frontend/src`: the four pages and the component's own usage example). This plan has no other commit that touches the file, so it went into the fixture commit `d1aeeda98`, which had to precede the control: a control admits no uncommitted path but the spec. Proven by `yarn typecheck:tests` exit 0 before the commit and by every run after it.

## The view

**Route.** `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte`, directly under the entity and **outside** `(nominated)`, so an entity with no nomination reaches it. Route key `ContestantAppNominations: ${CONTESTANT_ENTITY}/nominations` in `route.ts`, with a doc line; the doc of `CONTESTANT_NOMINATED` now names the nominations beside the home and the settings as outside the group. The page has no load of its own. `/contestant/nominations` resolves to it: `nominations` is in `SINGLE_SEGMENT_PAGES` of the `contestantEntityPage` matcher (and in its doc's list) and in `SINGLE_SEGMENT_ROUTES` of the resolver. The task-state modules' `TaskRoute` literal `ContestantAppNominations` and the route key now agree: `getRoute.current(target.route)` type-checks against `RouteOptions`, and `routeConsistency.test.ts` passes.

**Markup, in document order.**

1. `MainContent` with `title={t('contestantApp.nominations.title')}`, whose root `<div>` carries `data-testid="contestant-nominations"`, `data-nominations-state` and `data-nominations-locked`.
2. The `note` snippet: `<NotEditableNote reason="nominationsLocked" data-testid="contestant-nominations-locked-note" />` inside `{#if locked}`. It precedes the title in reading order.
3. `<h1 tabindex="-1">` — `MainContent`'s default heading.
4. Listed body: `<p class="text-center">` with the descriptor's `nominationsDescription`; `<ul … data-testid="contestant-nominations-list">`; per nomination `<li>` → `<article class="bg-base-100 p-lg rounded-lg" aria-labelledby={headingId} data-testid="contestant-nomination" data-confirmed>` → `<h2 class="text-lg" id={headingId} data-testid="nomination-election">` → `<dl class="mt-12 flex flex-col gap-12">` of rows → the pending line `<p class="small-info mt-12" data-testid="nomination-pending-note">` only while unconfirmed. A row is the page-local snippet `row(label, value, testId)`: `<div><dt class="small-info uc-first">` over `<dd class="mt-xs [overflow-wrap:anywhere]" data-testid>`. `headingId` is `nomination-<nomination id>-heading`, so it is the same on the server and in the browser.
5. Empty body: `<p class="text-center" data-testid="contestant-nominations-empty">` with the descriptor's `nominationsEmpty`; `<ContactSupport class="mt-lg" />` only while not locked.
6. The `primaryActions` snippet: one `Button variant="main"` with `data-testid="contestant-nominations-continue"`.

**Test ids and state attributes.**

| Element | `data-testid` | State attribute |
|---|---|---|
| the view's root | `contestant-nominations` | `data-nominations-state="listed" \| "empty"`, **absent** while the list is not known; `data-nominations-locked="true" \| "false"` |
| the list | `contestant-nominations-list` | — |
| a card | `contestant-nomination` | `data-confirmed="true" \| "false"` |
| the card's heading | `nomination-election` | — |
| the `<dd>`s | `nomination-constituency`, `nomination-parent`, `nomination-election-symbol`, `nomination-state` | — |
| the line under an unconfirmed card | `nomination-pending-note` | — |
| the empty sentence | `contestant-nominations-empty` | — |
| the note | `contestant-nominations-locked-note` | `data-reason="nominationsLocked"` (the note's own) |
| the button | `contestant-nominations-continue` | `data-action="continue" \| "return"`, **absent** in the loading form |
| the support button | `contestant-contact-support` (the block's own) | — |

**The four states, and the one that is neither.**

| | List | Lock | Shows | Support button | Page background |
|---|---|---|---|---|---|
| J1 | some | off | description, cards | none | `bg-base-200` |
| J2 | some | on | the note, description, cards | the note's | `bg-base-200` |
| J3 | none | off | the empty sentence, `ContactSupport` in the body | the body's | default |
| J4 | none | on | the note, the same empty sentence | the note's — the body has none | default |
| — | `undefined` | either | the title and the button only: no card, no empty sentence, no support block | none | default |

No state holds two Contact support buttons. The answers lock alone brings up nothing. There is no loading state and no error state: the list is page data, and an entity whose data is unusable never reaches the page.

**Where each name and label comes from.**

| Shown | Source |
|---|---|
| the cards | `contestantCtx.nominations` — page data, the list the entity-level load read, in the read's order |
| a card's heading | `nomination.electionName` |
| constituency | label `common.constituency`; value `nomination.constituencyName` |
| parent (only when the read returns one) | label `descriptor.nominationParentLabel` (`common.electionList` for a candidate, `common.alliance.singular` for a party); value `nomination.parent.name`, or `parent.shortName` when the name is empty |
| symbol (only when not empty) | label `descriptor.electionSymbolLabel`; value `nomination.electionSymbol` |
| state | label `contestantApp.nominations.state.label`; value `common.confirmed` or `contestantApp.nominations.state.pending`, from `nomination.confirmed` |
| the pending line | `contestantApp.nominations.state.pendingInfo` |
| description, empty sentence | `descriptor.nominationsDescription`, `descriptor.nominationsEmpty` |
| the note | `contestantCtx.nominationsLocked`, and nothing else |

The page reads `selectedEntity`, `nominations`, `nominationsLocked` and `taskState` on the context inside derived values, and `getRoute` and `t` as stable references. It reads nothing from the data root, builds no `Nomination` object, has no `try`, logs nothing, compares no type with a literal, and holds no form control, no Edit action and no `view-transition-name`. `custom_data` and the election round are not rendered.

**The button's rule.** `nominationsViewTarget(contestantCtx.taskState)`:

- `undefined` (the state is not known: an entity with a nomination before the store and the question lists are loaded) → the loading form: `<Button variant="main" loading …>`, a disabled `<button>` reading `common.loading`, with no `href` and no `data-action`.
- otherwise `text` is `common.continue` when `continues`, `common.return` when not; `href` is `getRoute.current(target.route)`; `data-action` is `continue` or `return`.
- so: no nomination → Return to `ContestantAppEntityHome`, known on the server; profile next → Continue to `ContestantAppProfile`; questions next → Continue to `ContestantAppQuestions`; nothing left → Return to home.

**The U-08 block, as written.** In the script:

```ts
/** Whether the view says that the entity has no nomination. It says so whether or not nominations are locked. */
const emptySentenceShown = $derived(viewState === 'empty');
```

and in the markup:

```svelte
{:else if viewState === 'empty'}
  {#if emptySentenceShown}
    <p class="text-center" data-testid="contestant-nominations-empty">{t(descriptor.nominationsEmpty)}</p>
  {/if}
  {#if !locked}
    <ContactSupport class="mt-lg" />
  {/if}
{/if}
```

**What the fallback (D-17 as written, the note alone) changes:** that derived becomes `viewState === 'empty' && !locked`; in `page.svelte.test.ts` the case "shows the note above the empty sentence while nominations are locked…" then asserts no empty sentence; in the spec, `nominations: with nominations locked, the empty view shows the note above the same sentence and one support button` then asserts the sentence absent (the fixture needs a step for an absent sentence, or `expectEmptySentence` a `null`); in plan 176-18, the content of scan entry `no-nomination-nominations-locked` and of the phone-width check of the locked empty view. No other plan.

## Red and green (unit)

- **Red** — `tests/e2e-runs/176-unit/176-12-view-red.json`, head `7e8ec252d`: 27 cases, **27 failed**, each on an expectation against a page that rendered its title alone (`elements matching [data-testid="contestant-nominations"]: expected … to have a length of 1 but got 0`, and the like). The matcher's, the resolver's and the route tests passed at that commit (16 files, 319 cases), and the frontend's whole suite showed those 27 and nothing else failing.
- **Green** — `176-12-view-green.json`, head `e86015b21`: 27 cases, **27 passed**.
- The 27 cases: the listed view (order, article named by its heading, the type's description, no note, no support block); no read of the data root and nothing logged, on a context whose `dataRoot` getter throws; the page shaded while it lists; four rows for a confirmed card with a parent and a symbol; the parent's short name for an empty name; two rows with no parent and no symbol; the pending value, line and attribute; **a name rendered as text whatever it holds** (T-176-43); the party's sentence and labels; the empty view of each type, unshaded; a list that is not known; the note with cards and with the empty sentence, each with one support button; no note for the answers lock alone (with and without nominations); **the lock followed when it changes under a mounted page**; the button's five forms, with the loading form turning into a Continue once the state is known; and no form control, no other control and no view-transition name in each of the four states.

## The fixture

`tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts`, `createContestantNominationsPage(page, admin)`, registered as `contestantNominationsPage` on the composition root `perm-no-nomination.ts`, which now also registers `notEditableNote`.

`open(entity)` · `openWithoutEntity()` · `expectShown(entity)` · `expectState({ state, locked })` · `expectCardCount(count)` · `expectCard(index, { election, constituency, symbol, parent, confirmed })` · `expectPendingNote(index, present)` · `expectEmptySentence(text)` · `expectLockedNote(present)` · `expectNoEditAction()` · `expectButton(action)` · `pressButton()`.

Every id is from the registry; state is read from attributes; waits are on `TIMEOUTS.slowPage`. `expectLockedNote` has its own locator for `contestant.nominations.lockedNote`; one support button on the page is `notEditableNote.expectSupportButtons(1)`.

## The control and the green proof (E2E)

**The control** — `tests/e2e-runs/176-e2e/176-12-control`, `--project perm-no-nomination`, head `d1aeeda98` with the spec alone uncommitted (the copy as run: `176-12-control.perm-no-nomination.spec.ts`). 06:07:01Z to 06:14:46Z; AC power, 100 %; Docker VM free before: **18.85 GiB**. **219 total, 212 passed, 7 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker. Verdict `--red "nominations:"`: **PASS**, exit 0 — "7 test(s) named by 'nominations:'; 212 other test(s)". Each red test and the first line of its error:

| Test | First error line |
|---|---|
| nominations: a candidate with no nomination sees the empty view, one way to support and a Return that leads home | `Error: expect(locator).toBeVisible() failed` |
| nominations: with nominations locked, the empty view shows the note above the same sentence and one support button | `Error: expect(locator).toBeVisible() failed` |
| nominations: a nomination the administrator adds is listed as pending, and as confirmed once it is confirmed | `Error: expect(locator).toBeVisible() failed` |
| nominations: the address without an entity leads to the entity's own view | `Error: expect(page).toHaveURL(expected) failed` |
| nominations: a party with no nomination sees the same view in its own words | `Error: expect(locator).toBeVisible() failed` |
| nominations: with nominations locked, a listed nomination is shown under the note, with nothing to edit | `Error: expect(locator).toBeVisible() failed` |
| nominations: the view's button continues to what is next, and returns home when nothing is | `Error: expect(locator).toBeVisible() failed` |

Six fail on the view's container, which was not there; the entity-less one fails earlier, on the URL, because the matcher did not admit the address.

**The pre-commit run** — `tests/e2e-runs/176-e2e/176-12-precommit`, `--project perm-no-nomination`, head `e86015b21` with the spec alone uncommitted (byte-identical to the control's copy; kept as `176-12-precommit.perm-no-nomination.spec.ts`). 06:19:41Z to 06:26:30Z; AC power; Docker VM free before: **18.78 GiB**. **219 total, 219 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. Verdict `--green --were-red-in 176-12-control`: **PASS**, exit 0 — each of the seven "was red, now passed". In it: `perm-no-nomination` 22 of 22, `contestant-a11y-scan` 22 of 22, `contestant-journey` 1 of 1, `perm-organization-editing` 46 of 46, `perm-answers-locked` 4 of 4, `contestant-entity-selection` 8 of 8. Nothing had to be settled in another spec.

**Its dev-server log.** `devserver.log` holds no line stamped inside the window of the seven `nominations:` tests (06:26:09Z to 06:26:16Z), and none inside the window of the whole `perm-no-nomination` project. It does hold 50 `Error formatting nomination: Error: Child in collection elections with id … not found` lines — the profile's block, which plan 176-13 removes — every one before that window, in earlier projects of the chain; plan 11's pre-commit run holds the same 50. Read by matching each line's `time` against each test's start and duration in `results.json`.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-12-close`, head `82a218cc7`: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict: **PASS**, exit 0. Frontend unit: 192 files, **3518 cases passed** (3476 before: 27 of the page, 15 in the matcher's and the resolver's tables).

**The full run** — `tests/e2e-runs/176-e2e/176-12-close`, through the driver with `--require-project perm-no-nomination`. Recorded head `3725317c9` (the orchestrator's docs commit; tree-equal to `82a218cc7` outside `.planning/`). 06:30:48Z to 06:39:15Z. Driver exit **0**. Docker VM free before: **18.69 GiB**; after: 18.60 GiB. AC power; `sleep_entries_in_window: 0`. Judged at once with the plan's command: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-12-close
counts: total 293, passed 293, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 3725317c9 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 22/22 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project contestant-entity-selection: 8/8 passed
compared with: tests/e2e-runs/176-e2e/176-11-close-r2
per project: 113 compared, 0 not as expected
176-verdict e2e 176-12-close: PASS
```

Against `176-11-close` (286 tests): `perm-no-nomination` 22 against 15; each of the other 112 projects at its total. No red run but the control; no void run; nothing retried; no axe finding; no overflow.

## The state steps called for the first time

- **`setNominationsLocked(on)`** — called by all seven tests (five write `false` as the state they read, two write `true` and restore `false` in a `finally`), each followed by a full page load. The server showed the lock at the next load each time: `data-nominations-locked` and the note followed it. No defect.
- **The update of an existing row's `confirmed`** — `setNominationState(ca-none, 'pending')` then `'confirmed'` in one test: the second call finds the row and changes `confirmed` alone. The card showed `data-confirmed="false"` with the pending line, then `"true"` without it. No defect.

## The code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | Yes: NOM-02's view, and TASK-01's button on it. |
| OWASP top 10 | Every stored name is rendered through the template's own escaping; no raw-HTML block; a component case feeds markup as a name and finds it as text. The resolver's target is still built from a route key out of a closed map. No new input, no new read. |
| Code style guide; no `any` | Followed; none. |
| No repeated code | **One finding, fixed before the pre-commit run:** the four label–value rows repeated their markup; they are now one snippet (`e86015b21`). The `matchMedia` stub in the page test repeats the one every page test carries. |
| New entities documented | The page's `@component` docstring; the route key's doc; TSDoc on the fixture's factory, types and steps. |
| Repo documentation | **Not done here, for plan 176-19:** `apps/docs/…/developers-guide/contestant-app/entity-selection/+page.md` lists the entity URLs and the entity-less forms without `/nominations`, and the generated route map predates the key. |
| Tracking events | None new: the view lets a user do nothing but navigate, and page views are tracked by the root layout. |
| Svelte component guidelines | Runes only; context accessors read on the context; no new component (the row is a page-local snippet). |
| Errors handled and logged | The page has no failing path of its own and logs nothing, by design. |
| Failing checks; shared dependents | None failing. The matcher and the resolver gained one admitted segment; their tests and the claim-nothing-in-common cases cover it. |
| WCAG A/AA; keyboard and screen reader | One `<h1>`, one `<h2>` per card; each card an `<article>` named by its heading inside a `<ul>`; label and value a `<dt>`/`<dd>` pair, label above value; the note before the title; the button a link reachable by keyboard, and a disabled `<button>` only in its loading form. Not scanned with axe and not measured at 320 px here: both are plan 176-18's. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment and title read: none tells history or names a decision or plan. |
| Commit history | Test before feature; one refactor commit of the checklist's finding. No `[db]` change. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The fixture cannot name the route key at the commit the plan gives it**
- **Found during:** Task 1
- **Issue:** Task 1 commits the fixture with `yarn typecheck:tests` green; the route key arrives in Task 2, bound to the page's directory by `routeConsistency.test.ts`. `buildRoute({ route: 'ContestantAppNominations' })` would not compile.
- **Fix:** `open` builds the URL as the entity home's route plus the literal sub-path `/nominations`, and `openWithoutEntity` as the app root plus it; `expectShown` uses `contestantUrlRe('/nominations')`, as the other fixtures do with their sub-paths. The address is thereby asserted independently of the key.
- **Files modified:** `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts`
- **Commit:** `d1aeeda98`

**2. [Rule 3 - Blocking] `expectNoEditAction` needs a raw locator**
- **Found during:** Task 1 (ESLint `playwright/no-restricted-locators`)
- **Issue:** "No control but these two ids" is a negation that neither `getByTestId` nor `getByRole` expresses.
- **Fix:** one `container.locator(':is(…controls…):not(…):not(…)')` under a `// reason:` comment and the rule's disable line, in the form the other fixtures use.
- **Commit:** `d1aeeda98`

### Other departures

- **One commit the plan does not list:** `e86015b21`, the checklist's finding, as Task 3's step 1 allows.
- **Each `nominations:` test also writes the lock it reads** (`setNominationsLocked(false)` where the plan's sketch named a lock step only in the two locked tests), as the execution rules require of every test of the spec.
- **Three component cases beyond the plan's list:** a name rendered as text (the threat model's T-176-43), the lock followed under a mounted page, and the shaded background.
- **Task 2's long checks before the page's commit were run from a script of this plan's own** (`176-12-t2-green-gates.sh`: check, the green report, route tests, the unit suite, ESLint, Prettier, hygiene — all 0), and the plan's verify block after it.

## Not done, or not verified

- **A localized name is not asserted on this view.** The dataset's election and constituency names are `en` only and no nomination has a parent, as `176-12-FACTS.md` says; the dataset was not changed.
- **A parent row is proven in the component test only.** No seeded or step-written nomination has a parent, so no browser test shows one.
- **Focus on the view's `<h1>` after an in-app navigation was not observed.** No test navigates *into* the view inside the application: every `open` is a full load, and the menu item that leads here is plan 176-16's. The heading is `MainContent`'s default `<h1 tabindex="-1">`, the root layout's focus target. Plan 10's observation (no first-level heading on the preview within 5 s) was therefore neither met nor ruled out here.
- **No axe scan and no width measurement of the view** — plan 176-18's (`cand-nominations`, the four states, 320 px).
- **An election with no name in any locale** gives a card an empty `<h2>` and an unnamed `<article>`. The read returns an empty string then; the view shows no placeholder, as the contract says. Not reachable with any dataset of the suite.
- **The docs pages** named in the checklist — plan 176-19's.

## For plans 176-13 to 176-18

- **Linking to the view:** `getRoute.current('ContestantAppNominations')` under an entity; the task state's nomination task and its `nextStep` already carry `{ route: 'ContestantAppNominations' }`. The entity-less `/contestant/nominations` redirects (307) to it for a user with one entity.
- **176-13 (the profile's block):** the view replaces it; nothing in the view depends on it. `testIds.contestant.profile.nominations` is still the `cand-profile` scan's post-login marker (`contestant-a11y.spec.ts`).
- **176-16 (the menu item):** the view's first in-app entry. An in-app navigation to it re-reads no load, so the list shown is the entity's last load; assert focus on its `<h1>` there.
- **176-18 (scans and widths):** the container and state attributes above select each state. While nominations are not locked the page still renders `MainContent`'s empty `role="note"` wrapper, because the `note` snippet is always passed — as the home, the profile and the two questions pages do. `uc-first` makes each `<dt>` an inline-block; the `<dd>` below is a block, so label stays above value. The `<ul>` is `list-none`. The shaded background is pushed in an effect, so it arrives with hydration, as the profile's does.
- **Tests of the view:** import `test` from `fixtures/contestant/perm-no-nomination`; `contestantNominationsPage` and `notEditableNote` are registered. Write the lock you read, restore a `true` in a `finally`, and load a full page after either step.
- **Counts:** a one-project run of `perm-no-nomination` is 219 tests, 22 its own; the full run is 293 in 113 projects.

## For Phase 177

- **Where the Edit action and the unlocked branch go.** The view has two bodies behind `viewState` and one `note` snippet behind `locked`. An editor's entry belongs in the listed body's card (per nomination) or in `primaryActions`, and an "add" in the empty body, each inside `{#if !locked}`; today the only `!locked` branch is the body's `ContactSupport`. `expectNoEditAction()` and the component case "holds no form control, no edit action…" assert today's absence and must change with it.
- **The condition the note follows.** `contestantCtx.nominationsLocked` alone — the setting `access.nominationsLocked`. What widens it is a second reason: one more member of the note's `reason` union and one more entry of its `REASON_MESSAGE`, and the condition in the `note` snippet.
- **How the button's label is decided.** By `nominationsViewTarget(taskState).continues`: `false` for an entity with no nomination, because the next step is the nomination itself and the user cannot act on it here. What makes the no-nomination button a Continue is the user being able to add a nomination on this page: then `nominationsViewTarget` stops returning home for `next.task === 'nomination'`, or the page offers the add action in place of the button.
- **The view reads the list of the entity's last load.** `contestantCtx.nominations` is page data, not the store: after a write the load must rerun (`invalidateAll`, or a navigation that reruns the entity layout's load) for the cards, the state attribute and the task state's has-a-nomination to follow.
- `custom_data` (the requested-party text) and `electionRound` reach the page in each `EntityNomination` and are not rendered.

## The state the local database is left in

Not reset by this plan. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset and no nomination of the no-nomination dataset left; the suite's project has `answersLocked` false and no `nominationsLocked` key; `private.invitation_link_witness` holds 102 rows, so `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding. Nothing listens on the wrapper's port. Docker VM free: 18.60 GiB.

## Files touched that the plan did not list

- `tests/tests/utils/testIds.ts` — the orchestrator's item 2, a comment.

## Known Stubs

None. The view renders real data in every state; nothing in it is a placeholder.

## Threat Flags

None. The one new route is the page the plan's threat model covers; it sits under the protected group and the entity layout, and adds no load, endpoint or write.

## Self-Check: PASSED

Every file named under key-files and every evidence file named above exists; each of the five task commits is an ancestor of HEAD; the red report is at `7e8ec252d` and the green at `e86015b21`; `git rev-list --count 30df61ecf..HEAD` is 6 at the time of writing, one of them the orchestrator's.

---
phase: 176-contestant-home-task-state-nominations-view
plan: 13
subsystem: frontend
tags: [profile, nominations-view, contestant-app, hydration-marker, e2e, tdd, i18n, NOM-02]
requires:
  - phase: 176-01
    provides: 176-D9-FINDING.md, the cause of the nomination-formatting log line with one verdict line for each of its four points
  - phase: 176-12
    provides: the nominations view, its fixture and the per-project baseline 176-12-close
provides:
  - the profile page without a nominations section, a formatter or a lookup on the data root
  - the state attribute `data-entity-loaded="true" | "false"` on the profile's identity section
  - the profile fixture's `open()` and `reload()` waiting on that attribute, and the step `expectNoNominationsSection()`
  - the journey reading the candidate's nomination on the nominations view
  - one `profile:` test in `perm-no-nomination.spec.ts`
  - five message keys out of seven locales (649 keys in each catalogue)
  - the per-project baseline `176-13-close` (294 tests, 113 projects)
affects: [176-14, 176-15, 176-16, 176-17, 176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "a state attribute that says when a page's client-side store holds its data, as the hydration signal a fixture waits on"
    - "an absence asserted only after a positive signal that the thing would have been rendered by now"
key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/fixtures/contestant/contestant-journey.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/utils/testIds.ts
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/common.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.basicInfo.json
    - apps/frontend/src/lib/types/generated/translationKey.ts
decisions:
  - "U-13 at its recommended option: common.state and common.pending are removed, because a run-time search found no reader; common.confirmed stays"
  - "The loaded-entity marker reads the store alone (userData.current is defined); it is false on the server and before the entity layout's effect has run"
  - "The journey reads the nomination on the view first, opened by the address that names no entity, then loads the home and enters the profile through its task as before"
  - "The entity layout's comment was left as it is: it already says what is true"
metrics:
  duration: about 45 min (07:20Z to 08:05Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-02]
actuals:
  tokens: 13876
  tasks: 3
  commits: 5
commits: 5
plan_head_before: 35a1bd6aaf815bee4bed2a883806e062923028f5
plan_head_after: 333fa642571b925de1e5e90c6d588acc371bd182
---

# Phase 176 Plan 13: The Nominations Block Leaves the Profile — Summary

**The profile page no longer has a nominations section, a formatter or a lookup on the data root; its identity section says when the entity's data is loaded, which is what the profile fixture now waits on; the journey reads the candidate's nomination on the nominations view; five message keys are out of seven locales; and the full run's dev-server log holds the formatting-error line 0 times, against 51 in plan 12's closing run.**

## Read this first

- **Everything in the plan is done.** Full run `176-13-close`: 294 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 113 projects; `perm-no-nomination` 23 against 22, every other project at its `176-12-close` total. No run was void; nothing was red outside the two controls; nothing was retried.
- **The deletion was made on the finding.** `176-D9-FINDING.md` holds `POINT 1: held` to `POINT 4: held`, read before anything was built and again by Task 2's verify chain.
- **One file the plan lists was not changed, and one it does not list was.** `$ENTITY/+layout.svelte` already says what the plan asks its comment to say. `tests/tests/fixtures/contestant/perm-no-nomination.ts` registers the profile fixture, without which control A's test could not be written with the spec alone uncommitted.
- **The red unit commit carried a type error that svelte-check finds and vitest does not.** It was corrected in the removal's commit (one property of a test constant). The red report stands: its six failures are expectations.
- **One observation without an established cause:** control A's dev-server log holds the line 63 times where plan 12's runs hold 50 and 51. Details under *Not established*. The line's logger no longer exists.
- The hook line "CONTEXT WARNING: Usage at NN%" appeared after tool calls. It was taken as the orchestrator's, as the dispatch says.
- `git status --short` showed `M .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` from the start, beside the untracked `CAND-APP-PLAN.md`. Neither is this plan's; neither was staged or edited.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `877b6f04c` | feat(176-13): the profile says when its entity's data is loaded |
| 1 | `669f345de` | test(176-13): fixture steps for a profile without a nominations section |
| 2 | `d14fb74c5` | test(176-13): the profile page has no nominations section |
| 2 | `3117d9896` | feat(176-13): the nominations leave the profile for their own view |
| 3 | `333fa6425` | chore(176-13): the message keys the profile's nominations block alone read |

Each was committed by pathspec from a script kept as `tests/e2e-runs/176-unit/176-13-commit-*.sh`.

## Each verify, with its real exit status

Each `<automated>` block was extracted byte for byte from the plan to `tests/e2e-runs/176-unit/176-13-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `669f345de` | With the two specs alone uncommitted, after both controls. |
| 2 | **0** | `3117d9896` | After the removal's commit and before any other commit outside `.planning/`. |
| 3 | **0** | `333fa6425` | After the full run and before any commit outside `.planning/`. |

## The finding's four verdict lines, as read

```
POINT 1: held
POINT 2: held
POINT 3: held
POINT 4: held
```

Read with the command Task 1's verify chain begins with, exit 0, at head `35a1bd6aa`, before any file was edited. The file is committed (`fcf71415c`). The fourth line is the one the orchestrator restated.

## The populations, derived when the plan ran

**Every reader of the block under `tests/tests`** (`git grep -n -e "profile.nominations" -e "nominationConstituency" -e "nominationElectionSymbol" -e "nomination-constituency" -e "nomination-election-symbol" -e "expectStaticInfo" -- tests/tests`, at `35a1bd6aa`):

| Reader | What became of it |
|---|---|
| `contestantProfilePage.fixture.ts`: the wait in `expectEntityLoaded`, on `profile.nominations` | waits on the identity section's marker |
| the same file: `expectStaticInfo`'s `nomination` half — the section, and the two literal ids read with `toHaveValue` | removed, with `ProfileNominationExpectations` |
| `contestant-a11y.spec.ts`: `cand-profile`'s `postLoginTestId: testIds.contestant.profile.nominations` | `testIds.contestant.profile.identity` |
| `contestant-journey.spec.ts`: step 12's `expectStaticInfo({ nomination: { electionSymbol: '999' } })` | read on the nominations view |
| `testIds.ts`: `profile.nominations` | removed with its comment line |
| `testIds.ts`: `nominations.constituency`, `nominations.electionSymbol` | the view's own; unchanged |

**Every caller of the fixture's `open(` and `reload(`** (`git grep -n -e "contestantProfilePage.open(" -e "contestantProfilePage.reload(" -- tests/tests`): 32 call sites, all in `perm-organization-editing.spec.ts` — 30 of `open` and 2 of `reload`. No other spec calls either. The plan's text says five projects open the profile through the fixture's `open()`; by search it is one. The other four reach the profile their own way and are affected by the block's removal in other ways: the journey by a click on the home's task, then through the fixture's other steps; the profile scan by URL, behind its reach marker; the answers-locked and the localisation specs by their own navigation.

## The loaded-entity marker and the fixture's wait

**The marker.** The identity section (`data-testid="contestant-profile-identity"`) carries `data-entity-loaded`, from one derived value of the page:

```ts
/** Whether the store holds the entity's data. It does not on the server, nor in the browser before the entity's layout has filled it. */
const entityLoaded = $derived(userData.current !== undefined);
```

`"false"` in the server-rendered markup and on first paint; `"true"` once the entity layout's effect has filled the user-data store; `"false"` again if the store is emptied. It is one state attribute beyond the UI contract's Locator Contract (orchestrator ruling 6), and the registry's comment on `identity` names it.

**The fixture's wait, before:** `expectEntityLoaded()` waited until `testIds.contestant.profile.nominations` held a visible `group` — a nomination's card.

**After:** `expectEntityLoaded()` waits until the identity section has `data-entity-loaded="true"`, on `TIMEOUTS.slowPage`. `open()`, `reload()` and `expectNoNominationsSection()` call it.

**`expectNoNominationsSection()`** waits on the marker and only then asserts that the page holds no element with `testIds.contestant.nominations.constituency` and none with `…electionSymbol`. The absence is not a race: the entity layout's effect, which fills the store, and the root layout's, which gives the data root its elections, are both synchronous and run in one flush at hydration (read in both layouts: no promise and no `await` between them), so there is no moment a browser can observe in which the marker reads true and a block fed by that store has not rendered its rows.

## Red and green (unit)

- **Marker (Task 1)** — two cases, a candidate and an organization: `false` while the store is empty, `true` once it holds the entity, on the same element, and `false` again when it is emptied. Green at `877b6f04c`.
- **Red** — `tests/e2e-runs/176-unit/176-13-profile-red.json`, head `d14fb74c5`: 44 cases, **6 failed**, 38 passed. Four fail on `expected <section …> to be null` (no section, heading or field for a candidate and an organization, each with a nomination and with none); two on `expected "vi.fn()" to not be called at all, but actually been called 1 times` (nothing looked up on a data root whose lookups throw, and nothing logged, for each type with a nomination).
- **Green** — `176-13-profile-green.json`: 44 cases, **44 passed**. Its `.head` file holds `d14fb74c5`: it was taken on the uncommitted tree that became `3117d9896`.
- The four no-section cases also pin the page's outline: its `<h2>`s are exactly the identity title of the entity's type and `contestantApp.basicInfo.editableInfos.title`.
- Frontend unit suite: 192 files, **3526 cases passed** (3518 before: 2 of the marker, 6 of the removal).

## The two controls (E2E)

Both through the wrapper directly, by `tests/e2e-runs/176-unit/176-13-control-launch.sh`, which records the head, the status, the diff, the power source and the Docker VM's free space beside the run and refuses when a run is in flight, the port is held or the space is under the floor.

**Control A** — `tests/e2e-runs/176-e2e/176-13-control`, `--project perm-no-nomination`, head `669f345de` with `perm-no-nomination.spec.ts` alone uncommitted (kept as `176-13-control.perm-no-nomination.spec.ts`). 07:25:11Z to 07:33:14Z; AC power, 100 %; Docker VM free before: **18.59 GiB**. **220 total, 219 passed, 1 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker. Verdict `--red "profile:"`: **PASS**, exit 0.

| Red test | First error line |
|---|---|
| profile: the profile of an entity with a nomination has no nominations section | `Error: expect(locator).toHaveCount(expected) failed` — `getByTestId('nomination-constituency')`, expected 0, received 1, on all 14 polls of 5 s |

It failed after `expectOnProfile` and after the marker read true: the failing assertion is the step's second statement.

**Control B** — `tests/e2e-runs/176-e2e/176-13-control-journey`, `--project contestant-journey`, head `669f345de` with both specs uncommitted (both kept beside the run). 07:33:44Z to 07:34:38Z; AC power; Docker VM free before: **18.53 GiB**. **5 total, 4 passed, 1 failed.** Wrapper exit 1; no void marker. Judged with:

```
node $P/176-verdict.mjs control 176-13-control-journey --project contestant-journey --setup data-setup-contestant-journey --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --dirty-only tests/tests/specs/contestant/contestant-journey.spec.ts --red "full candidate journey end-to-end"
```

**PASS**, exit 0.

| Red test | First error line | Failed step |
|---|---|---|
| candidate journey › full candidate journey end-to-end | `Error: expect(locator).toHaveCount(expected) failed` — `getByTestId('nomination-constituency')`, expected 0, received 1 | step 12 |

The step's reads on the nominations view passed before it failed on the profile, so the red is the one the plan names.

## The journey's step

Step 12 is now titled `12. nominations view: the nomination; profile: no nominations section + static info + filtered questions partition + required badge`. In order: the nominations view opened by `/contestant/nominations` (`contestantNominationsPage.openWithoutEntity()`); one card; the card's five facts; the home loaded again by `/en/contestant`; the profile entered through the home's task, as before; `expectStaticInfo({ name: 'Unregistered' })`; `expectNoNominationsSection()`; then the unchanged question assertions.

The card, from the base dataset's row `test-e2e-base-nom-reg-n-ca-aa-unregistered` (`packages/dev-seed/src/templates/e2e/base.ts`): election `[el-reg] Regional Election` (`name.en` of `test-e2e-base-el-reg`), constituency `[co-reg-n] Region North` (`name.en` of `test-e2e-base-co-reg-n`), symbol `999` (`election_symbol`), parent `[or-aa] Party AA` (`name.en` of the organization of `parent_nomination`), confirmed `true` (the row states no `confirmed`, and the seed writes `true` then; read in the database during control A: `confirmed = t`).

**This is the first browser proof of a parent row on the view.** Plan 12 had it in a component test only.

## The pre-commit run and both verdicts

`tests/e2e-runs/176-e2e/176-13-precommit`, `--project perm-no-nomination`, head `d14fb74c5` with seven paths uncommitted: the page, its test, the fixture, the registry, the scan spec, the journey and the spec (copies kept beside the run, application and fixture files as `.kept`). 07:37:40Z to 07:47:04Z; AC power; Docker VM free before: **18.51 GiB**. **220 total, 220 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. At its head the page still held the section.

- `control 176-13-precommit … --green --were-red-in 176-13-control`: **PASS**, exit 0 — "was red, now passed: … profile: the profile of an entity with a nomination has no nominations section".
- `control 176-13-precommit … --green --were-red-in 176-13-control-journey`: **PASS**, exit 0 — "was red, now passed: candidate journey › full candidate journey end-to-end".

The specs of its chain that reach the profile:

| Project | How it reaches the profile | Result |
|---|---|---|
| `contestant-journey` | a click on the home's task; the fixture's other steps | 1 of 1 |
| `contestant-a11y-scan` | by URL; `cand-profile` and its dark twin behind the identity section | 22 of 22 |
| `perm-answers-locked` | its own navigation | 4 of 4 |
| `perm-localisation-positive` | its own navigation; the fixture's question steps | 2 of 2 |
| `perm-organization-editing` | the fixture's `open()` 30 times and `reload()` twice | 46 of 46 |
| `perm-no-nomination` | by URL (`contestantEntityPages.open`), then the fixture's absence step | 23 of 23 |

Nothing had to be settled in another spec. Its dev-server log holds the formatting-error line **0** times.

## The keys removed

From all seven locales (`da`, `en`, `et`, `fi`, `fr`, `lb`, `sv`):

- `contestantApp.basicInfo.nominations.title`
- `contestantApp.basicInfo.nominations.description.candidate`
- `contestantApp.basicInfo.nominations.description.organization`
- `common.state`
- `common.pending`

`common.confirmed` stays; the nominations view reads it. Each catalogue goes from 654 keys to **649** (`yarn assert:i18n-catalog-namespaces`: "total keys: 649 … 0 violation(s)"). The files were rewritten by a script that first showed each file round-trips byte for byte, so the diff is the removed lines alone (68 deletions in 15 files, the key type's five among them).

**The search for the two shared words** (`tests/e2e-runs/176-unit/176-13-t3-readers.txt`, at `3117d9896`):

- `git grep -n -F -e "basicInfo.nominations" -e "common.state" -e "common.pending" -- apps packages tests ':!apps/frontend/messages' ':!apps/frontend/src/lib/types/generated'` — two lines, both in `entityDescriptor.test.ts`, which asserts that no descriptor names a key under `contestantApp.basicInfo.nominations`. That is no reader.
- `git grep -n -E -e "common\.state([^A-Za-z.]|$)" -e "common\.pending([^A-Za-z.]|$)" -- apps packages tests docs …` — nothing, exit 1. The whole keys have no reader in the application, the packages, the tests or the docs.
- Keys built at run time under `common.`: four sites, each `common.${type}.singular` or `.plural` over an entity type. None can produce `common.state` or `common.pending`.

Before the removal the same first search, at `35a1bd6aa`, found one reader of each: the profile page's state row.

After it: `generate:translation-key-type` exit 0 and no diff on a second run; `assert:i18n-catalog-namespaces` exit 0; `yarn workspace @openvaa/frontend check` exit 0 (2165 files, 0 errors, 0 warnings); Prettier clean on the catalogues.

## The code review checklist

Over the profile page, its test, the fixture, the scan spec, the journey's step and the new test.

| Item | Outcome |
|---|---|
| Solves the issue | Yes: NOM-02's "no longer on the profile page". |
| OWASP top 10 | A removal. The one addition is a boolean state attribute. No input, no read, no route. |
| Code style guide; no `any` | Followed; none added. |
| No repeated code | The journey's return to the home is three statements that step 10 also ends with. Left: it is the spec's own idiom, and factoring it would touch steps this plan does not own. No other repetition. |
| New entities documented | TSDoc on `entityLoaded`, on the fixture's step and on its wait; the registry's comment names the attribute; the page's `@component` docstring no longer names a nominations section. |
| Repo documentation | No docs page names the block, its id or the removed keys (searched; see *For plan 176-19*). |
| Tracking events | None: nothing a user can do was added. |
| Svelte component guidelines | No new component. The page reads `userData.current` on the stable `userData` reference; it no longer reads `dataRoot` at all, and the comment that warned about aliasing it went with the read. |
| Errors handled and logged | The `try` and its `log.error` existed only for the lookup that is gone. Nothing that can throw was left without a handler. |
| Failing checks | One, found by this plan's own check and fixed before the commit: the red test's constant lacked `customData` (svelte-check; vitest does not type-check). |
| Shared dependents | Every project that reaches the profile is green in the pre-commit run and the full run. `userData.current.nominations` is still read by the context's own derivations of the entity's elections and constituencies. |
| WCAG A/AA; keyboard and screen reader | The outline is `<h1>` → identity `<h2>` → "Your Profile" `<h2>`, pinned by a component case. A section of locked inputs left; nothing operable was removed. `cand-profile` and its dark twin pass axe on the page as it is now. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment and title read: none tells history or names a decision or plan. |
| Commit history | Test before feature; the removal with everything that depends on it in one commit. The type correction of the red test is inside the feature commit and not a commit of its own. No `[db]` change. |

No finding changed a file after the pre-commit run, so no second pre-commit run was made.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-13-close`, head `333fa6425`: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict: **PASS**, exit 0. Docker VM free before: 18.44 GiB.

**The full run** — `tests/e2e-runs/176-e2e/176-13-close`, through the driver with `--require-project perm-no-nomination`. Head `333fa6425`. 07:54:19Z to 08:03:08Z. Driver exit **0**. Docker VM free before: **18.40 GiB**; after: 18.31 GiB. AC power; `sleep_entries_in_window: 0`. Judged at once with the plan's command: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-13-close
counts: total 294, passed 294, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 333fa6425 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 23/23 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project perm-localisation-positive: 2/2 passed
compared with: tests/e2e-runs/176-e2e/176-12-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-13-close: PASS
```

Against `176-12-close` (293 tests): `perm-no-nomination` 23 against 22 ("above 22: holds"); each of the other 112 projects at its total. No axe finding; no overflow.

## The log line

`grep -c -F "Error formatting nomination" <run>/devserver.log`:

| Run | Lines |
|---|---|
| `175-13-final` (the phase's baseline) | 47 |
| `176-12-close` | 51 |
| `176-13-control` (the block still on the page) | 63 |
| `176-13-control-journey` | 0 — the journey reaches the profile by a click |
| `176-13-precommit` | **0** |
| `176-13-close` | **0** |

The plan's step 4 speaks of "the three of the baseline's log"; the baseline's log holds 47, as the finding says. `git grep -n -F -e "parseNomination" -e "contestant-profile-nominations" -e "Error formatting nomination" -- apps/frontend/src ':!*.test.ts'` prints nothing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The no-nomination composition root did not hold the profile fixture**
- **Found during:** Task 1, step 3
- **Issue:** Control A's test calls `contestantProfilePage.expectNoNominationsSection()`, and the control admits no uncommitted path but the spec. The spec's composition root registered no profile fixture.
- **Fix:** `tests/tests/fixtures/contestant/perm-no-nomination.ts` registers `contestantProfilePage`, in the additive fixture commit.
- **Files modified:** `tests/tests/fixtures/contestant/perm-no-nomination.ts` (not in the plan's list)
- **Commit:** `669f345de`

**2. [Rule 1 - Bug] The red unit commit's test constant did not satisfy its type**
- **Found during:** Task 2, step 3 (svelte-check, exit 1: `Property 'customData' is missing in type … but required in type 'EntityNomination'`)
- **Issue:** The `NOMINATION` constant committed in `d14fb74c5` lacked `customData`. Vitest does not type-check, so the red run was a real run of the six cases and each failure is an expectation.
- **Fix:** `customData: null`, in the removal's commit. svelte-check then exit 0, and the green report was taken again.
- **Files modified:** the page's test
- **Commit:** `3117d9896`
- **Consequence:** the commit `d14fb74c5` fails `yarn workspace @openvaa/frontend check` on its own, beside the six red cases it is there to hold.

### Other departures

- **`$ENTITY/+layout.svelte` was not changed.** The plan's tree fact — a comment saying that the pages resolve the election's and the constituency's names on the data root — is no longer true of the tree. The comment beside the data-root update reads: "The data root is given the questions alone. The entity's nominations stay on `userData` as a flat list that carries its own names: it holds no entity graph for the data root to match a nomination to." That is true with the block gone, so nothing was written. The removal's commit therefore holds seven paths, the page's test in the layout's place.
- **The control test opens the profile by the entity's URL** (`contestantEntityPages.open(…, 'profile')` and `expectOnProfile`), as every other test of that spec does, and not through the profile fixture's `open()`. The absence step waits on the marker itself.
- **The journey returns to the home by a full load between the view and the profile.** The plan asks that the view be opened by its entity-less URL and the profile asserted; the load of the home in between keeps the profile entered by a click on the home's task, which is what the step did before.
- **The journey's composition root now says twelve candidate fixtures** in its header; the nominations view's is the twelfth.
- **Step 3's checks of Task 2 were run from a script of this plan's own** (`176-13-t2-green-gates.sh`, then `-r2` after the type correction), and the plan's verify block after the commit.
- **The fixture's header says three soft-assertion call sites** where it said six: the nomination readers held the others.

## Not established

**Control A's log holds 63 lines where plan 12's runs hold 50 and 51.** One of the 63 is the new test's own full load of a profile. The other twelve are in `perm-organization-editing`, whose election id appears 57 times against 45 and 46. What was read: matched to tests by time (`tests/e2e-runs/176-unit/176-13-lines-*.txt`), the increase falls inside that project's accessibility scans; and it is not a doubling inside one flush — pairs of consecutive lines less than 50 ms apart number 6, against 4 in each of plan 12's two runs. Between those runs and control A the application differs by the marker's commit alone. **Why that project logged twelve more lines was not found, and it was not investigated further**: the code that logs the line is deleted, and both runs after the removal hold the line 0 times. It is recorded because the cause is not known, not because anything depends on it. If it matters, the question is whether an attribute that reads `userData.current` on the identity section changes how often the page's blocks are updated at hydration; nothing in the suite's results suggests it does.

## Not done, or not verified

- **Focus and announcement on the profile were not looked at.** The removal takes a section out of the middle of the page; no test moves focus through it, and none was added.
- **No width measurement of the profile without the block.** The profile's width checks are `perm-organization-editing`'s and pass.
- **The parent row is proven in a browser for a candidate under a party only.** No dataset nominates a party under an alliance for a user of the suite.
- **The todos were not edited.** See *For plan 176-19*.
- **`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not read for sentences this plan made false.**

## For plans 176-14 to 176-18

- **Waiting on the profile:** `contestantProfilePage.open()` and `reload()` wait on `data-entity-loaded="true"` of `contestant-profile-identity`. A spec that reaches the profile another way and then edits it should wait on the same attribute: an edit made before the store is filled reaches no handler.
- **Asserting that the profile shows no nominations:** `contestantProfilePage.expectNoNominationsSection()`. It is registered on the journey's root, the organization-editing root, the localisation root and the no-nomination root.
- **`expectStaticInfo` takes `{ name? }` and nothing else.** `ProfileNominationExpectations` is gone.
- **`testIds.contestant.profile.nominations` is gone.** `nomination-constituency` and `nomination-election-symbol` are the view's `<dd>`s, read as text.
- **The journey's composition root registers `contestantNominationsPage`** (with a service-role client). Step 12 opens the view by URL; plan 176-15's home row and plan 176-16's menu item can replace that load with a navigation inside the application, and the load of the home that follows it then goes. The view's main button reads Continue at that point of the journey and leads to the profile.
- **`cand-profile`'s reach marker is `contestant-profile-identity`.** `cand-nominations` (plan 176-18) needs its own.
- **Counts:** a one-project run of `perm-no-nomination` is 220 tests, 23 its own; the full run is 294 in 113 projects; the frontend unit suite is 3526 cases in 192 files; each message catalogue holds 649 keys.
- **A `profile:` title prefix now exists in `perm-no-nomination.spec.ts`**, and the spec's header names it. `perm-organization-editing` and `perm-answers-locked` use the same prefix in their own projects; a verdict's `--red "profile:"` is scoped by its `--project`.

## For plan 176-19

- **Docs mentions of what this plan removed: none found.** `git grep -n -e "common\.state" -e "common\.pending" -e "basicInfo\.nominations" -e "Error formatting nomination" -- apps/docs docs README.md tests/README.md` prints nothing, and no page under `apps/docs/src` describes a nominations section on the profile or names `contestant-profile-nominations`.
- **`.planning/todos/pending/2026-10-06-173-nomination-format-error-logged-in-every-run.md`** can be closed on this plan: the logger is deleted, and `176-13-close` holds the line 0 times against 47 in the phase's baseline. Its resolution text is in `176-01-SUMMARY.md` § *For plan 176-19*, to be read with the finding's restated fourth point.
- **`.planning/todos/pending/2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`** names the block this plan removed. The nominations view shows the party a candidate is nominated under, and the journey now asserts it in a browser.
- **The store's defect the finding filed** (an equal copy of `userData.current` written on every run of the answers-lock effect) is untouched and has one visible symptom fewer.

## For Phase 177

- The profile holds nothing of the entity's nominations and links to nothing about them. An editor for nominations belongs on the nominations view (see `176-12-SUMMARY.md` § *For Phase 177*).
- `userData.current.nominations` is still filled by the entity layout and no page reads it: its readers are the contestant context's derivations of the entity's elections and constituencies. A write to a nomination has to reach both that list and the page data the view renders.

## The state the local database is left in

Not reset by this plan. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the E2E driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset left; the suite's project has `answersLocked` false and no `nominationsLocked` key; `private.invitation_link_witness` holds 120 rows, so `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding. Nothing listens on the wrapper's port. Docker VM free: 18.31 GiB.

## Files touched that the plan did not list

- `tests/tests/fixtures/contestant/perm-no-nomination.ts` — deviation 1.

Listed and not touched: `$ENTITY/+layout.svelte`.

## Known Stubs

None. Nothing was added that renders a placeholder; the one addition to the page is a state attribute.

## Threat Flags

None. The plan removes a section and five message keys and adds one attribute; it adds no route, load, endpoint, read or write.

## Self-Check: PASSED

Every file named under key-files exists and every evidence file named above exists; each of the five task commits is an ancestor of HEAD; the red report is at `d14fb74c5` with 6 failed of 44 and the green holds 44 passed; the three verify scripts' exit files hold 0; `git rev-list --count 35a1bd6aa..HEAD` is 5 at the time of writing.

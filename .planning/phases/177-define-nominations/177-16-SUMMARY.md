---
phase: 177-define-nominations
plan: 16
subsystem: frontend-routes
tags: [nomination-editor, selection-order, skip-rule, start-from-constituency, admissible-elections, constituency-step, status-message, e2e, perm-startfromcg]
status: complete
requires:
  - "177-15: the three editor routes, stepSelection.ts, the constituency page with Continue disabled where afterConstituencies answers nothing; the full run 177-15-close (347 of 347, 116 projects); the gate run 177-15-close"
  - "177-13: selectionOrder.ts — electionsHeldIn, usesSingleConstituencyGroup, mostSpecificConstituency"
  - "177-12: the message key contestantApp.nominations.constituencies.noElection.{candidate,organization} and the descriptor's nominationConstituenciesNoElection"
  - "177-11: the editor's fixture and its test ids (contestant-nomination-constituencies-no-election among them)"
  - "177-10: the dataset perm-contestant-nominations, its four sessions and its state steps"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, 177-BASE"
provides:
  - "the constituency step's sentence for a constituency with no admissible election: data-testid contestant-nomination-constituencies-no-election, role=status, the id Continue's aria-describedby names"
  - "stepSelection.ts: constituenciesStoodFor({ elections, constituencies }); afterConstituencies takes each chosen constituency with those it stands for while a constituency group is chosen first, and passes them on"
  - "(edit)/constituencies/page.svelte.test.ts: the constituency page mounted with the real ConstituencySelector and Select, six cases"
  - "tests/tests/utils/permStartFromCgData.ts: the start-from-constituency dataset's prefix, group, elections, three constituencies and the one candidate's grant, address and storage-state path"
  - "tests/tests/fixtures/contestant/perm-startfromcg.ts: test + expect; chooseConstituencyGroupFirst, restoreConstituencyGroupFirst, removeCandidateNominations, clearWrittenNominations, setElectionType"
  - "contestantNominationEditor.expectGroupPicker(groupName), contestantNominationEditor.expectNoTextOnPage(text); setElectionSelectionDisallowed(on) in fixtures/contestant/perm-contestant-nominations.ts"
  - "data-setup-perm-startfromcg registers one editor (of candidate ca-1-1b) and stores its session; data-teardown-perm-startfromcg removes it and clears written nominations"
  - "six `steps:` tests in contestant-nominations.spec.ts and four `contestant:` tests in perm-startfromcg.spec.ts, all @nomination-definition"
  - "runs: 177-e2e/177-16-control (red in the one test; 194 did not run behind it), 177-e2e/177-16-control-b (282 of 282 without that test), 177-e2e/177-16-precommit (283 of 283), 177-gates/177-16-close (six rows), 177-e2e/177-16-close (357 of 357, 116 projects)"
affects: [177-17, 177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a spec file that holds tests of two applications takes the second application's `test` from a composition root of its own, under another name, beside the file's bare Playwright `test`"
    - "a control whose expected-red test sits in a link of the permutation chain is judged in two runs: the red run by the cascade behind it, and a complement without that test in which everything passes"
    - "a sentence that appears in answer to a selection while the button it describes is disabled is a status message"
key-files:
  created:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/page.svelte.test.ts"
    - tests/tests/utils/permStartFromCgData.ts
    - tests/tests/fixtures/contestant/perm-startfromcg.ts
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepLoads.test.ts"
    - tests/tests/specs/perm/contestant-nominations.spec.ts
    - tests/tests/specs/perm/perm-startfromcg.spec.ts
    - tests/tests/setup/perm/perm-startfromcg.setup.ts
    - tests/tests/setup/perm/perm-startfromcg.teardown.ts
    - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
    - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
decisions:
  - "the contestant describe of perm-startfromcg.spec.ts signs in as the editor of the seeded candidate ca-1-1b and deletes that candidate's nominations in its beforeAll; nothing writes the seeded one again"
  - "while a constituency group is chosen first, a chosen constituency stands for the constituency it lies in, for an election that has none of those chosen in its own groups: with one admissible election the selector passes the picked constituency on as it is, and the election held by region was found in no municipality"
  - "the sentence carries role=status beyond the UI contract's markup: Continue, which it describes, is disabled and takes no focus"
  - "the plan's control cannot be judged in one run: its one red test is in a chain link 46 projects depend on, so a second run without that test shows the other nine green on the tracer's tree"
  - "the state the contestant describe writes goes through state steps of its composition root, not through an admin client in the spec, so that the teardown can call the same clearing step"
requirements-completed: []
metrics:
  started: "2026-10-11T07:05Z (not recorded at the start; the first commit is 07:16:34Z)"
  completed: "2026-10-11T07:58Z"
  duration: "about 55 minutes, of which about 30 are the four E2E runs and the gate rows"
  tasks: 3
  files: 12
actuals:
  tokens: 19283 # chars/4 over git diff 4593324f1..d4defac62 outside .planning (77,131 characters)
  tasks: 3
  commits: 3 # git rev-list --count 4593324f1..d4defac62
plan_head_before: 4593324f1509d103138adff9e07770240e0715c3
plan_head_after: d4defac620b2b87aa070abfcd9d269b9274b1e2e
---

# Phase 177 Plan 16: The Skip Rows, Start-from-Constituency on the Contestant Side, and a Constituency with No Admissible Election — Summary

Every row of the selection's order is now a browser test for an entity with no nomination, on two datasets: which elections a party is offered, the three rows of the skip rule, an address that names nothing, a voter's setting that must not choose an entity's elections, and the four rows of the start-from-constituency mode. The constituency step says when no election the entity can stand in is held where it chose. `perm-startfromcg.spec.ts` guards both applications, with its voter describe byte for byte what it was.

`requirements-completed` is empty on purpose: NOM-03 is proven here for an entity with no nomination, and is not complete until existing nominations prefill the selection (177-17). `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched.

## Read this first

- **Green end to end.** Pre-commit run 283 of 283, first attempt; full run 357 of 357, 116 projects, per-project equal to `177-15-close` but for the ten new tests. No test was retried, no axe finding, no overflow.
- **The plan's control could not be judged as the plan writes it, and was judged in two runs instead.** Its one red test is in `perm-startfromcg`, which 46 later projects depend on, so 194 tests behind it did not run — the six `steps:` tests among them. `177-16-control`: exactly that test failed, on its expectation, with everything before it green. `177-16-control-b`, the same tree without that one test: 282 of 282. *Deviations*, 3.
- **The tracer needed no correction for the nine tests the plan called green.** All nine passed on the tracer's tree, first time.
- **One defect of the tracer was found by reading and corrected, with unit cases and a browser assertion.** While a constituency group is chosen first and exactly one election admits the entity's type, the selector passes the picked constituency on as it is; an election held by region was then "held nowhere" for every municipality, Continue stayed disabled for good, and this plan's sentence would have said something false. *Deviations*, 1.
- **The sentence carries `role="status"`**, which the UI contract's markup does not have. *Deviations*, 2.
- **Three files beyond the plan's list**: `stepSelection.ts` and `stepLoads.test.ts` (the correction and its cases), and one commit of two fixture steps and a state step no spec called yet. *Deviations*, 1 and 4.
- **Task 1's and Task 2's verify exit non-zero as written and 0 in their corrected forms.** One stage is a new defect: the count of `contestant:` tests looks for `test(`, and the plan's own ruling 1 has those tests declared under another name. *Verify commands*.
- **The host's lid was closed again during every run.** `pmset -g log` holds `Entering DarkWake state due to 'Clamshell Sleep'` inside the window of each. No run carries the void marker; the heartbeat's largest lateness was 47, 43, 71 and 94 ms; no run's output holds `server connection lost`. The one red run is the control, red in the named test on its expectation. Reported as found; nothing was rerun for it.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `b72d07749` | `test(177-16)`: `permStartFromCgData.ts` and the composition root `fixtures/contestant/perm-startfromcg.ts`, alone |
| 1 | `cb3cd070b` | `test(177-16)`: `expectGroupPicker` and `expectNoTextOnPage` on the editor's fixture; `setElectionSelectionDisallowed` — no committed spec called them |
| 1, 2 | `d4defac62` | `feat(177-16)`: the two specs, the setup and teardown of `perm-startfromcg`, the constituency page and its component test, `stepSelection.ts` and `stepLoads.test.ts` — one commit, after the controls and the green pre-commit run |
| 3 | — | runs only |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-16-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | As written | Corrected | Head |
|---|---|---|---|
| 1 | **1** — the count stage prints `steps: 6 contestant: 0` | **0** (`177-16-t1-verify-corrected.sh`) | `cb3cd070b`, the four files uncommitted |
| 2 | **2** — every stage before the verdict passed; the verdict refuses several paths after one `--dirty-only` | **0** (`177-16-t2-verify-corrected.sh`) | `d4defac62` |
| 3 | **0** | — | `d4defac62` |

**Task 1, corrected, differs in three stages.**

1. *A sixth defect of the plans' verify commands.* The count is `/^\s*test\(\s*.contestant: /`. Ruling 1 of this plan has the contestant describe take its `test` "under another name beside the file's `@playwright/test` import", so the four tests are declared as `contestantTest(…)` and the stage counts none. Restated as `/^\s*contestantTest\(\s*.contestant: /`: 4. The lint rules do bind the aliased form (probed: `expect-expect`, `no-conditional-in-test` and `no-restricted-locators` all fire inside `contestantTest(…)`), so nothing was gained by shadowing `test` inside the describe, and the code was not bent to the search. `--expect-title-count "perm-startfromcg::contestant:=4"` of Task 3 reads titles from the run and passes as written.
2. `--dirty-only` once per path (the known defect).
3. *The control.* `177-verdict control 177-16-control … --red "contestant: a constituency with no election"` is **FAIL (197)**, status 1, in its one-path-per-flag form too (`177-16-control.verdict.log`): every test that did not run is counted against "every test outside the named ones must pass". Restated as two stages: `node tests/e2e-runs/177-unit/177-16-control-cascade-check.mjs tests/e2e-runs/177-e2e/177-16-control "contestant: a constituency with no election"` (exit 0), and `177-verdict control 177-16-control-b … --green` (PASS, exit 0).

**Task 2, corrected**, differs in the verdict's arguments alone: one path per `--dirty-only`, and the two files the correction added, `stepSelection.ts` and `stepLoads.test.ts`, as the plan's `<fails_when>` asks.

## Task 1 — the ten tests, and the control

### Who the contestant describe signs in as

**`e2e-perm-startfromcg-ca-1-1b`**, "[CA1B] Candidate One B", seeded with one nomination in the regions' election (`el-1`, `co-1b`) under party one's nomination there. The voter tests of the file choose `[CO1A1]` and `[CO1C]` and never reach region B. The setup registers `…ca-1-1b@test.openvaa.local` with one editor grant on it, terms accepted, and stores the session once the home's status message has rendered (`playwright/.auth/perm-startfromcg-candidate.json`).

**What its first state step deletes:** `removeCandidateNominations()`, in the describe's `beforeAll`, deletes every nomination row of that candidate — the one seeded row, `nom-el-1-co-1b-ca-1-1b`. Nothing stands under a candidate's nomination, so nothing else goes. Nothing writes it again: after the describe the candidate has no nomination until the next setup seeds the dataset. The first `contestant:` test asserts the state in the application before anything else (the nominations view is `empty`, no card).

### The file's two frames

The voter describe is byte for byte what it was (`cut(base) === cut(now)`, 3,210 characters, compared against `177-BASE`), and it still imports the bare `test`. After it, `contestantTest.describe('perm-startfromcg: the nomination editor of a candidate with no nomination', …)`, serial, under the candidate's stored session. Its `beforeAll` names the group in the setting through `chooseConstituencyGroupFirst()` and keeps what the setting held; its `afterAll` puts that back and calls `clearWrittenNominations()`. No test of the describe saves, so the clearing step finds nothing today; it is there for the order of the chain's clears, as the dispatch asks. No test body holds a locator or an admin client.

### What each test asserts

`contestant-nominations.spec.ts`, describe `the steps an entity with no nomination meets`; each begins with `setNominationsLocked(false)`, `setAnswersLocked(false)` and `setNominations(…, 'none')`:

1. `steps: a party meets …` — `or-new`: the election step lists the closed-list and the open election and not the candidates-only one; nothing checked; the hint; Continue disabled.
2. `steps: one admissible election with one constituency …` — `el-list` set to `candidate_only`: a full load of the entry is the details step with one new card, open election, whole country. Restored in a `finally`.
3. `steps: one admissible election with several constituencies …` — `el-open` set to `candidate_only`: the entry is the constituency step with one picker and no heading, no sentence, Continue disabled; the northern region chosen leads to the details step with that one card. Restored in a `finally`.
4. `steps: with no admissible election …` — both set to `candidate_only`: each of the three addresses, as a new document, is the party's nominations view and no step. Both restored in a `finally`.
5. `steps: an address that names an unknown election or constituency …` — `ca-new`: the details address with two ids in the form of a row's id that name nothing is the election step, all three elections listed, none checked, and the page's text holds neither id.
6. `steps: disallowing election selection …` — `ca-new`, `elections.disallowSelection` on: the entry is the election step, three elections, none checked, the hint, Continue disabled. Turned off in a `finally`.

`perm-startfromcg.spec.ts`:

1. `contestant: the entry leads to the constituency step as one picker over the group` — the nominations view is empty; the entry is the constituency step with one picker, under no heading, whose accessible name holds `[CG2] Leaf municipalities`; no sentence; Continue disabled.
2. `contestant: a constituency with two admissible elections …` — `[CO1A1] Municipality A1` chosen, no sentence, Continue leads to the election step, which lists `[EL1] CG-1 parents` and `[EL2] CG-2 leaves`, none checked.
3. `contestant: a constituency with one admissible election …` — `[CO1C] Orphan municipality` chosen leads to the details step with one new card, `[EL2] CG-2 leaves` in that municipality.
4. `contestant: a constituency with no election the candidate can stand in …` — `el-2` set to `organization_only`: the orphan municipality chosen shows the sentence, which describes the disabled Continue, and the step stays. Then `[CO1A1]` chosen instead: no sentence, and Continue leads to the details step with one new card, `[EL1] CG-1 parents` in `[CO1A] Region A`. Restored in a `finally`.

Every step after a change of a type or a setting is a full page load (`open`, `openStep`).

### The control, in two runs

Both on head `cb3cd070b` with exactly the four files of Task 1 uncommitted, through the wrapper, six workers, no retries, one preflight success, no void marker.

- **`177-16-control`** — the tree with all ten tests. 283 tests: **88 passed, 1 failed, 194 did not run**; wrapper status 1; 07:19:36Z to 07:22:06Z. The one failure is the fourth `contestant:` test: `expect(locator).toBeVisible() failed` on `getByTestId('contestant-nomination-constituencies').getByTestId('contestant-nomination-constituencies-no-election')`, *element(s) not found* — the step that expects the sentence, and not a timeout. In its own project the two voter tests and the three other `contestant:` tests passed, and so did the dataset's setup and teardown. The 194 that did not run are in 46 projects, each of which depends on `perm-startfromcg` directly or through others (read from the configuration's text by `177-16-control-cascade-check.mjs`, exit 0). The test's `finally` and the describe's `afterAll` ran.
- **`177-16-control-b`** — the same tree with the fourth `contestant:` test held out of the working file (the copy the run used is `177-16-control-b.perm-startfromcg.spec.ts.kept`; the file was put back from `177-16-control.perm-startfromcg.spec.ts.kept` afterwards, `cmp` equal). 282 tests: **282 passed**; wrapper status 0; 07:23:28Z to 07:31:18Z; `perm-contestant-nominations` 10 of 10. `177-verdict control … --green`: **PASS**.

Together: on the tracer's tree nine of the ten new tests pass and the tenth fails on the sentence alone. The kept copies of the four files as the control ran them are `177-16-control.*.kept`.

## Task 2 — the sentence, and the correction

### The page

`(edit)/constituencies/+page.svelte` gained one derived value, one paragraph and one attribute:

```ts
const noElectionHeld = $derived(
  ready && selectionComplete &&
    !!contestantCtx.appSettings.elections?.startFromConstituencyGroup &&
    !electionsHeldIn({
      elections: admissible,
      constituencies: constituenciesStoodFor({
        elections: admissible,
        constituencies: constituenciesOf(contestantCtx.dataRoot, chosenConstituencyIds)
      })
    }).length
);
```

The paragraph is rendered under the selector while it holds — `class="small-info mt-sm text-center"`, `id` and `data-testid` both `contestant-nomination-constituencies-no-election`, `role="status"`, the text of `descriptor.nominationConstituenciesNoElection` — and Continue's `aria-describedby` names it then and is absent otherwise. `dataRoot` is read as `contestantCtx.dataRoot` inside the deriving scope and handed on as a value. Nothing else of the page changed; `canSubmit` already was false there, through `afterConstituencies`.

### The correction of the tracer: `constituenciesStoodFor`

```ts
export function constituenciesStoodFor({ elections, constituencies }: {
  elections: Array<Election>; constituencies: Array<Constituency>;
}): Array<Constituency>
```

Those given, in their order, then — for each election that has none of them in its own groups — the constituency of its groups that one of them is or lies in (`ConstituencyGroup.getImpliedConstituency`; a throw for several of one line is read as "none"). `afterConstituencies` applies it while a constituency group is chosen first, asks `electionsHeldIn` over the result, and passes the chosen ids on followed by the added ones. With several elections the selector has already added them and the function adds nothing; an election that has a chosen constituency in one of its own groups is left as it is, so no election's constituency changes that had one.

### Unit and component tests, red first

- `stepLoads.test.ts`, two cases, red on the tracer (`177-16-steploads-red.log`: `expected undefined to deeply equal {…}`, and the new function's absence), green after: 38 of 38.
- `constituencies/page.svelte.test.ts`, six cases, with the real `ConstituencySelector` and `Select`: a constituency is selected by focusing the field and pressing an option. On the tracer's page three were red, each on an expectation (`177-16-component-red.log`): the sentence absent, twice, and **Continue disabled for a municipality of a region with the regional election the one admissible** — the tracer's defect, observed in isolation. Green after: 6 of 6. The cases: the sentence with its text, id, role, the disabled Continue described by it and a press that navigates nowhere; a municipality of a region leads on with both constituencies; the sentence goes when another constituency is selected; several admissible elections and the orphan municipality; no mode; an empty data root shows `Loading` and no sentence.
- `yarn workspace @openvaa/frontend vitest run "src/routes/contestant"`: 29 files, 535 tests. `yarn workspace @openvaa/frontend check`: 0 errors, 0 warnings. Lint, the tests' type check and comment hygiene: 0, each read from its exit file.

### The pre-commit run

`tests/e2e-runs/177-e2e/177-16-precommit`, head `cb3cd070b`, the eight files uncommitted: **283 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; wrapper status 0; 07:35:08Z to 07:42:54Z; first attempt. `perm-contestant-nominations` 10 of 10. `177-verdict control 177-16-precommit … --green --were-red-in 177-16-control`: **PASS** — *was red, now passed* for the fourth `contestant:` test. A copy of each of the eight files is kept as `177-16-precommit.<file>.kept`, each `cmp`-equal to the tree at the commit.

## Task 3 — the gate rows and the full run

**Gate rows** — `tests/e2e-runs/177-gates/177-16-close`, head `d4defac62`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 48 |
| unit | 0 | 72 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 19 |

`177-verdict gates 177-16-close --rows …`: **PASS**, not stale. Unit totals: frontend **4078 passed and 30 skipped** (4070 in `177-15-close`: the six component cases and the two unit cases), dev-seed 1050, data 318, supabase 462, app-shared 148. One Sleep entry in the window, read by the verdict as informative.

**The full run** — `tests/e2e-runs/177-e2e/177-16-close`, head `d4defac62`, `bash 177-e2e.sh 177-16-close --require-project perm-contestant-nominations --require-project perm-startfromcg`, status 0:

- Docker VM 16.73 GiB free before it (the driver's record), 16.64 after. AC power, 100 %. 07:47:17Z to 07:56:49Z. No void marker.
- **357 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.**
- Verdict as the plan writes it — `--same-projects-as 177-15-close --except perm-contestant-nominations=6 --except perm-startfromcg=4 --expect-title-count "perm-contestant-nominations::steps:=6" --expect-title-count "perm-startfromcg::contestant:=4"` — **PASS**: `per project: 116 compared, 0 not as expected`.
- **Per project against `177-15-close`:** 114 equal; `perm-contestant-nominations` 10 against 4; `perm-startfromcg` 6 against 2. 347 + 10 = 357.

## For plans 177-17 to 177-20

### What exists

- **The sentence**, as above. `contestantNominationEditor.expectNoElectionSentence(true)` passes on it, description included.
- **`constituenciesStoodFor`** in `stepSelection.ts`. While a constituency group is chosen first, the selection the constituency step passes on holds the picked constituency and every constituency it stands for, for one admissible election as for several.
- **Fixture steps:** `expectGroupPicker(groupName)` (one picker, no heading, named for the group) and `expectNoTextOnPage(text)` (the page's `innerText`, read once, for a page already shown). **State step:** `setElectionSelectionDisallowed(on)` in the nominations dataset's root.
- **The start-from-constituency dataset has a contestant side:** `permStartFromCgData.ts` and `fixtures/contestant/perm-startfromcg.ts`. Its `setElectionType` accepts the dataset's two elections; `SEEDED_ELECTION_TYPES` is what a `finally` restores.

### What the `steps:` tests showed about the loads

Nothing to correct. Each row the plan lists was green on the tracer's tree, first time:

- **A skip is one server redirect.** A full load of the entry lands on the details step, or on the constituency step, with nothing shown between; the constituency step reached that way lists its one selector for the election the load implied, without an id in the address.
- **The admissible filter is the facts'.** A party's election step lists two of the three elections, in the data root's order.
- **The guard turns all three addresses away** when no election admits the entity's type, to the entity's own nominations view.
- **An id that names nothing is dropped before anything is decided**: the details address with two such ids is the entry, and neither id is in the page's text.
- **`elections.disallowSelection` is not read for a contestant.**
- **Under the mode the constituency address is served whatever is chosen, and the page decides Continue.** The loads were not changed by this plan.

### What each later plan must not assume

- **A control with a red test in a chain link upstream of other projects cannot be judged in one run.** `perm-startfromcg` is early in the chain; `perm-no-nomination` is directly upstream of `perm-contestant-nominations`. A plan whose control names red tests in one of those and expects other new tests green in a later link (177-19 writes in both `perm-no-nomination.spec.ts` and `contestant-nominations.spec.ts`) gets "did not run" for the later link. The two-run form used here: the red run judged by `177-16-control-cascade-check.mjs <run dir> "<title substring>"` (one red test; the script takes one title), and a complement without the red tests judged `--green`. A control whose red tests are all in `perm-contestant-nominations` loses nothing in a run restricted to that project, since nothing the run holds depends on it: 177-15's control was judged in one run for that reason.
- **A test declared through an aliased `test` is not found by a search for `test(`.** Any later verify that counts `contestant:` titles in `perm-startfromcg.spec.ts` by source text needs `contestantTest(`.
- **The candidate of the contestant describe has no nomination when the describe ends.** A test of 177-17 that needs a candidate of this dataset *with* a nomination under the mode (the prefill) either signs in as another seeded candidate — every one of the fourteen has one — or writes the row with a state step; `removeCandidateNominations` has no counterpart that restores.
- **Under the mode the picker preselects only a constituency of the first group.** The selector looks for one of the selected ids among the group's own. A prefill from an existing nomination in the regions' election (a region) therefore preselects nothing in a picker over municipalities; that is 177-17's to settle, and the UI contract's "the most specific applicable constituency of the existing choices" does not cover it.
- **The row the ordering module leaves open is still open.** A full load of the *elections* address that carries, under the mode, a constituency in which no admissible election is held is served with an empty list and the hint (`ElectionSelector` renders nothing for an empty list and does not throw). The UI cannot produce that address: Continue is disabled there. *Read, not observed.*
- **The details step has now been rendered for a party**, twice, and only its cards' election, constituency and state were asserted. The party's parent group — the option that starts at "None", the alliances — is still unobserved in a browser.
- **The party's explanation on the constituency step is rendered and not asserted.** `steps:` test 3 shows the party's constituency step; no fixture step reads the ingress, and none was added. The descriptor's key is pinned by `entityDescriptor.test.ts`.
- **No axe scan and no width measurement of the constituency step with its sentence** was made (177-20).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] With one admissible election under the mode, an election held by region was found in no municipality**
- **Found during:** Task 1, reading `ConstituencySelector.processSectionSelected` before writing the fourth `contestant:` test, which leaves the candidate with one admissible election.
- **Issue:** the selector adds the implied constituency per election only when it is handed several elections. Handed one, it sets that election's entry to the constituency picked in the first group. `afterConstituencies` then asked `electionsHeldIn` with a municipality for an election held by region and got nothing: Continue was disabled for every municipality, with no way on, and the sentence of this plan would have told the user that no election is held where one is.
- **Fix:** `constituenciesStoodFor` in `stepSelection.ts`, applied by `afterConstituencies` and by the page's sentence. The shared selector was not changed: its behaviour for a voter is the same code, and outside this plan.
- **Observed:** red in isolation at the module (`afterConstituencies` answered `undefined`) and at the page with the real selector (Continue disabled); green after; in a browser, the second half of the fourth `contestant:` test, green in the pre-commit run and the full run. *Not observed in a browser as a failure*: on the tracer's tree that test fails earlier, at the sentence.
- **Files:** `(edit)/stepSelection.ts`, `(edit)/stepLoads.test.ts`, `(edit)/constituencies/+page.svelte`, `(edit)/constituencies/page.svelte.test.ts`, `perm-startfromcg.spec.ts` · **Commit:** `d4defac62`

**2. [Rule 2 — Accessibility] The sentence is a status message**
- **Found during:** Task 2, writing the markup of S5.
- **Issue:** the contract's paragraph has no role, and its only tie to assistive technology is Continue's `aria-describedby`. Continue is disabled at exactly that moment: it takes no focus, so the description is never reached by a user who tabs on from the picker. The sentence appears in answer to the user's own selection (WCAG 2.1 AA, 4.1.3).
- **Fix:** `role="status"` on the paragraph; one assertion in the component test; the page's docstring says so.
- **Not observed:** what a screen reader announces. The attribute is asserted; its effect is not.
- **Same shape, not changed:** the election step's hint (`contestant-nomination-elections-hint`) returns when the last election is unchecked, and describes a Continue that is then disabled. It is 177-15's page and outside this plan; a ruling for both steps is the operator's.
- **Files:** `(edit)/constituencies/+page.svelte` · **Commit:** `d4defac62`

### Other deviations

3. **The control was judged in two runs** (above). The plan's ruling 3 expects "exactly that one red and the other nine green" in one run; the chain makes that impossible for a red test in `perm-startfromcg`. The second run is a complement on the same tree, not a retry: the first run's result was understood before it was started.
4. **One commit beyond the plan's two**, `cb3cd070b`: two steps on the editor's fixture and one state step, which no committed spec called. The plan's tests need them — "as one picker over the group", "no text of the id is on the page", "with `elections.disallowSelection` on" — and no existing step says any of the three. Both fixture files are outside the plan's list.
5. **`stepSelection.ts` and `stepLoads.test.ts` joined the uncommitted set**, for deviation 1, as the plan's step 3 of Task 2 provides.
6. **The contestant describe writes the setting through state steps** of its composition root, where the plan says "as the voter describe does", which is an admin client in the spec. The same value is written and restored; the teardown calls the same root's clearing step.
7. **The first `contestant:` test also asserts the empty nominations view**, so that "the describe begins by giving its candidate no nomination" is seen in the application and not only in the database.
8. **The fourth `contestant:` test goes on past the plan's row**: after the sentence, a municipality of a region leads to the details step. That is the browser's side of deviation 1.
9. **`setElectionType` of the new root repeats eight lines of the nominations root's**, and the root repeats that root's two private helpers `attempt` and `readRows`. Each root accepts its own dataset's rows and no other; a shared module for the three would be a change to a committed root that four specs read.
10. **The setup's header** names the prefix the dataset uses, `e2e-perm-startfromcg-`, as ruling 5 asks, and what it leaves behind.
11. **The commit ledger file was not written before the first commit.** `plan_head_before` is the head read at the start of the run, `4593324f1`; the count is `git rev-list --count 4593324f1..d4defac62`.

## How the plan's truths stand

Built and observed in a browser: the order of the steps over the admissible elections only; `disallowSelection` not read; the three rows of the skip rule and the row with no admissible election; the party's election step without the candidates-only election; the four rows of the mode on the contestant side, under a session made through the admin client, each test tagged; the sentence, the disabled Continue and its description; the voter tests of `perm-startfromcg.spec.ts` unchanged and green; every other voter spec green with no change.

Built and held by a unit or component test alone: the sentence's role; that it goes when another constituency is selected; the page with no mode and with an empty data root.

Built by an earlier plan and not asserted here: the party's explanation on the constituency step (D-17, U-25).

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: ten browser tests, one of them red without the page's change; the gaps are named above. |
| OWASP top 10 | No new input: the sentence is a catalogue message, and the ids the page passes on are ids of the data root's own constituencies. T-177-66 (a voter's setting choosing an entity's elections): the sixth `steps:` test. T-177-67 (an inadmissible election offered): the first. T-177-68: the voter describe byte-equal to the base commit's. T-177-69: every type and setting change is restored in a `finally`, and the full run's per-project comparison holds. |
| Code style guide; no `any` | Followed; none. Every helper is a function declaration. One `as never` in the component test, for the page's `data` prop, whose generated type holds the parents' data too. |
| No repeated code | The page's derived value asks what `afterConstituencies` asks, through the same two functions; it is the plan's own design for the sentence. Deviation 9 for the harness. |
| New entities documented | TSDoc on every exported symbol and every state step; the page's `@component` block names the sentence and its role. |
| Repo documentation updated | Not by this plan: see *Sentences the work made false*. |
| Tracking events | None added; the step sends none today. |
| Svelte component guidelines | No component was created. Runes only; `appSettings`, `dataRoot` and `selectedEntity` read as `contestantCtx.X` in the deriving scope, never destructured, `dataRoot` never through an alias. No `view-transition-name`, no `<dialog>`, T-shirt spacing classes only, no branch on the entity's type: the sentence is the descriptor's. |
| Errors handled | `getImpliedConstituency` throws for a group that holds several constituencies of one line; `impliedIn` reads that as "none", which leaves the election to `electionsHeldIn`'s own rule. Nothing is logged: nothing failed. |
| Failing checks | None after the red-first runs. |
| Parts sharing dependencies not unduly affected | `ConstituencySelector`, `Select` and `selectionOrder.ts` are unchanged. `afterConstituencies` answers as before for every existing unit case (36 of 36 unchanged cases green). The voter specs of the election and constituency pages ran green in three runs. |
| WCAG A and AA; keyboard and screen reader | The sentence is a status message and describes Continue; see deviation 2 for what was not observed. **No axe scan of the step with its sentence** (177-20). |
| Developers' and Publishers' Guides | Not updated; 177-21. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each commit, read from its exit file; no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | Three commits, none a fix of another. |
| Formatting changes apart | None. |
| `[db]` | No database change. |

## Prohibitions

- **PROH-177-42** (no voter assertion edited; no template row changed): the voter describe is byte-equal to the base commit's (above, and the plan's own line check in Task 2's verify, exit 0 in the corrected run); `git diff --quiet 4593324f1 HEAD -- packages/dev-seed` exits 0. Explicit.
- **PROH-177-43** (restored in a `finally`; a full page load after a change): four tests change a type and one a setting, each in a `try` with the seeded value written back in the `finally`; each next step is `open` or `openStep`. The describe's group setting is restored in `afterAll`, as the voter describe's is. After the red control, `el-2` was back at its seeded type: the complement run's voter and contestant tests read it. Judgment: holds.

## Threat Flags

None beyond the plan's register. The setup of `perm-startfromcg` now registers an auth user with an editor grant under the suite's shared password; its teardown unregisters it by address.

## Sentences the work made false, reported and not edited

- `tests/playwright.config.ts`, the comment `// Variant 4: perm-startfromcg (2 tests)`: the project holds six tests, and its setup stores a session.
- `177-16-PLAN.md`, ruling 3 and Task 1's acceptance criterion: a control red in one test "and the other nine green" in one run.
- `177-UI-SPEC.md`, S5's markup of the sentence (no role) and *Focus and Announcements* (no row for it).
- `177-UI-SPEC.md`, S5, "Under `useSingleGroup`, the voter's rule: the most specific applicable constituency of the existing choices": it preselects nothing in a picker over a group that does not hold that constituency.
- `ConstituencySelector.svelte`'s docstring, "`useSingleGroup`: … the `Constituency`s for the `Election`s are implied from this one": handed one election, the selector implies nothing and passes the picked constituency on. *Older than this phase; the same code serves a voter in a project with one election and the setting.*
- `177-15-SUMMARY.md`, *Known Stubs*, the row for this plan: resolved.

## Not done, or not verified

- No axe scan, no width measurement and no keyboard walk of the constituency step with its sentence (177-20).
- What a screen reader announces for the sentence.
- The party's explanation on the constituency step, in a browser.
- The elections address under the mode with a constituency that holds no admissible election: read, not opened.
- The single-election behaviour of the shared selector for a voter: read, not tested, not changed.
- `gsd_run windows append` was not run: the ledger is the orchestrator's file among others being written now. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, as the dispatch rules.
- No planted defect was run against the new tests beyond the red-first runs.

## The state the local stack is left in

The database is as the full run's teardowns left it: every `e2e-perm-` and `test-` dataset removed, the auth user of `perm-startfromcg` unregistered, no reset made by this plan. No dev server is running; ports 5173 and 5273 have no listener of this plan's. Docker VM 16.64 GiB free. `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None added. The tracer's stubs that remain are 177-17's and 177-18's, as `177-15-SUMMARY.md` lists them; its fourth row is resolved here.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-16-control`, `177-16-control-b`, `177-16-precommit`, `177-16-close`, with the kept copies, the launch logs and the verdict logs beside the first three.
- `tests/e2e-runs/177-gates/177-16-close`.
- `tests/e2e-runs/177-unit/177-16-*`: the three verify scripts with log, exit and head; the corrected forms of Task 1's and Task 2's; `177-16-control-cascade-check.mjs` with its log and exit; the red and green logs of the component test and of `stepLoads.test.ts`; the check, lint, type-check, unit and hygiene logs with their exit files.

## Self-Check: PASSED

The three commits are ancestors of `HEAD`; the three created files and the nine modified ones exist; the four run directories and the gate directory exist with their `ended` or `done` markers.

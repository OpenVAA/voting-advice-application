---
phase: 177-define-nominations
plan: 13
subsystem: frontend-routes
tags: [selection-order, voter-routes, elections, constituencies, startFromConstituencyGroup, disallowSelection, pure-module, refactor]
status: complete
requires:
  - "177-12: the gate run 177-12-close-r2 (frontend unit 3723 passed and 30 skipped, dev-seed 1050, data 318)"
  - "177-10: the full run 177-10-close, the predecessor of 177-13-close (346 of 346, 116 projects)"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, 177-BASE"
provides:
  - "apps/frontend/src/lib/routes/selectionOrder.ts, exported from $lib/routes: SelectionStep, SelectionOutcome, SelectionInput, electionsStepOutcome, constituenciesStepOutcome, electionsHeldIn, usesSingleConstituencyGroup, mostSpecificConstituency"
  - "getImpliedElectionIds({ …, elections?, honourDisallowSelection? }): the elections to consider and whether disallowSelection implies them all; left out, it answers as before"
  - "the voter's elections/+page.ts, elections/+page.svelte, constituencies/+page.ts and constituencies/+page.svelte call the module"
  - "selectionOrder.test.ts (54 cases) and impliedParams.test.ts (10 cases)"
  - "the full runs tests/e2e-runs/177-e2e/177-13-precommit (uncommitted tree at 544929fe8) and 177-13-close (f8a0e5e5c), 346 of 346 each, 116 projects; the gate run tests/e2e-runs/177-gates/177-13-close"
affects: [177-14, 177-15, 177-16, 177-17, 177-21]
tech-stack:
  added: []
  patterns:
    - "a decision both applications share is one pure function handed a data root and values; each application says how it asks through three flags and an optional list of what is on offer"
    - "an id read from an address counts only when it names something on offer; a list that is then empty is no choice"
key-files:
  created:
    - apps/frontend/src/lib/routes/selectionOrder.ts
    - apps/frontend/src/lib/routes/selectionOrder.test.ts
    - apps/frontend/src/lib/routes/impliedParams.test.ts
  modified:
    - apps/frontend/src/lib/routes/impliedParams.ts
    - apps/frontend/src/lib/routes/index.ts
    - "apps/frontend/src/routes/(voters)/elections/+page.ts"
    - "apps/frontend/src/routes/(voters)/elections/+page.svelte"
    - "apps/frontend/src/routes/(voters)/constituencies/+page.ts"
    - "apps/frontend/src/routes/(voters)/constituencies/+page.svelte"
decisions:
  - "an id of the address that names no election on offer, or no constituency of the data root, is left out, and an empty list is no choice — the threat register's 'an outcome's ids are drawn from the elections given' applied to chosen ids as well as implied ones; three hand-typed voter addresses answer differently for it (Deviations, 1)"
  - "the module narrows by the chosen constituencies through its own electionsHeldIn and hands the result to getImpliedElectionIds as the elections to consider; it does not pass selectedConstituencyIds, and impliedParams.ts does not import the module, so the two files form no import cycle"
  - "a done outcome names each constituency once, although getImpliedConstituencyIds answers one per election"
  - "under startFromConstituencyGroup, with a constituency chosen in which no election on offer is held, the elections address answers show; the step that leads there asks electionsHeldIn first"
  - "getImpliedConstituencyIds is unchanged: the module always hands it the ids it has already drawn from the elections on offer"
requirements-completed: []
metrics:
  started: "2026-10-11T05:07:47Z"
  completed: "2026-10-11T05:39:12Z"
  duration: "31 minutes"
  tasks: 3
  files: 9
actuals:
  tokens: 15724 # chars/4 over git diff dfeae5463..f8a0e5e5c outside .planning (62,897 characters)
  tasks: 3
  commits: 4 # git rev-list --count dfeae5463..f8a0e5e5c
plan_head_before: dfeae54633f0a6a7db3abefa69b35b005344fff2
plan_head_after: f8a0e5e5ce5d52a5138e0ad14a6932aa877eed5f
---

# Phase 177 Plan 13: The Shared Ordering Module, and the Voter's Four Route Files Repointed to It — Summary

The order of the election and constituency selection is decided in one pure module, `$lib/routes/selectionOrder`; the voter's two loads and two pages call it and keep only what is the voter's own (the redirect to the questions, the deferred `next` target, the parameter names); and the whole E2E suite passed twice with no spec changed — once on the uncommitted tree, once on the commit.

`requirements-completed` is empty on purpose: the plan's frontmatter names NOM-03, and this plan builds the module a contestant's selection will ask; nothing a contestant meets is delivered by it. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched.

## Read this first

- **All three verify blocks pass as written**, exit 0 each. None met one of the four known defects: Task 2's verify does not call the `control` sub-command, so the `--dirty-only` form was never needed.
- **No voter test was red in the pre-commit run.** `177-13-precommit` passed 346 of 346 on the first attempt; there is no `-r2`. Nothing was corrected in the module after the run and no row was added for a red test.
- **Three hand-typed voter addresses answer differently than before** — an empty `constituencyId=` or `electionId=`, and an id that names nothing. It follows from the plan's own mitigation for ids from the URL and is a deviation from "the voter's behaviour does not change" at those addresses only. *Deviations*, 1. **The orchestrator may want to rule on it.**
- **Each of the two voter loads now parses the selection parameters on both of its paths.** Before, the elections load read `url.search` only while `startFromConstituencyGroup` was set, and the constituencies load only while it was not. Both are page loads; no layout load changed and `(located)/+layout.ts` is byte-identical to the base commit. *Deviations*, 2.
- **`mostSpecificConstituency` keeps what the voter's page did, which is not what the page's comment said.** *Findings*, 1.
- **The four non-test commits are clean**: the linter, the type check and `check` were run on every file before its commit, and the six gate rows are green on the first run.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1, green before | `e1afb05e1` | `test(177-13): the implication of election and constituency ids, as it is` |
| 1, red | `0b877f9ee` | `test(177-13): the order of the election and constituency selection for a voter and for a contestant` |
| 1 | `544929fe8` | `feat(177-13): one shared module decides the order of the election and constituency selection` |
| 2 | `f8a0e5e5c` | `refactor(177-13): the voter's election and constituency routes call the shared ordering module` |
| 3 | — | runs only |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-13-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | Exit | Head |
|---|---|---|
| 1 | 0 | `544929fe8` |
| 2 | 0 | `f8a0e5e5c` |
| 3 | 0 | `f8a0e5e5c` |

## Task 1 — the module

### The five functions, as written

```ts
export type SelectionStep = 'elections' | 'constituencies';

export type SelectionOutcome =
  | { action: 'show' }
  | { action: 'goto'; step: SelectionStep; electionIds?: Array<Id> }
  | { action: 'done'; electionIds?: Array<Id>; constituencyIds?: Array<Id> };

export type SelectionInput = {
  dataRoot: DataRoot;
  elections?: Array<Election>;              // on offer; every election of dataRoot when absent
  appSettings: AppSettings;                 // elections.startFromConstituencyGroup and .disallowSelection are read
  honourDisallowSelection: boolean;
  implyWithinChosenConstituencies: boolean;
  skipWhenFullyImplied: boolean;
  electionIds?: Array<Id>;                  // what the caller's address holds
  constituencyIds?: Array<Id>;
};

export function electionsStepOutcome(input: SelectionInput): SelectionOutcome;
export function constituenciesStepOutcome(input: SelectionInput): SelectionOutcome;

export function electionsHeldIn(args: {
  elections: Array<Election>;
  constituencies: Array<Constituency>;
}): Array<Election>;

export function usesSingleConstituencyGroup(args: {
  appSettings: AppSettings;
  constituencyGroups: Array<ConstituencyGroup>;
}): ConstituencyGroup | undefined;

export function mostSpecificConstituency(args: {
  election: Election;
  constituencies: Array<Constituency>;
}): Constituency | undefined;
```

The two derivations take exactly what the voter's constituency page read: `usesSingleConstituencyGroup` the settings and the data root's `constituencyGroups` (searched, never fetched by id, so an empty data root answers `undefined` instead of throwing); `mostSpecificConstituency` one election and the selected constituencies.

`getImpliedElectionIds` gained `elections?: Array<Election>` (default `dataRoot.elections`) and `honourDisallowSelection?: boolean` (default `true`). `getImpliedConstituencyIds` is unchanged.

### What each outcome function decides

With `skipWhenFullyImplied`, both answer `done` with the pair when the one election on offer has one constituency, before the setting is read. Otherwise:

| Address | `startFromConstituencyGroup` | Election | Constituency | Outcome |
|---|---|---|---|---|
| elections | set | implied | chosen | `done` — `electionIds` the implied, `constituencyIds` the chosen |
| elections | set | not implied | chosen | `show` |
| elections | set | any | not chosen | `goto constituencies`, no ids |
| elections | not set | implied | any | `goto constituencies` with `electionIds` |
| elections | not set | not implied | any | `show` |
| constituencies | set | any | any | `show` |
| constituencies | not set | not chosen nor implied | any | `goto elections` |
| constituencies | not set | chosen or implied | implied | `done` with both lists |
| constituencies | not set | chosen or implied | not implied | `show` |

"Implied" is one election considered, or every election considered when `honourDisallowSelection` is set and the setting is on. The elections considered are those on offer, narrowed to those held in the chosen constituencies only at the elections address, under the setting, with `implyWithinChosenConstituencies`. The elections address does not read the election ids and the constituencies address does not read the constituency ids — as the voter's loads did not.

### The tests

- `impliedParams.test.ts`, 10 cases, written against the file as it stood and green before and after the two arguments were added, unchanged.
- `selectionOrder.test.ts`, 54 cases: the voter's elections table in 10 cases and its constituencies table in 10 (each row at least once, `disallowSelection` and both readings of "any" among them); the contestant's rows in 13; the ids of an outcome in 7 (a chosen and an implied election not on offer, an empty list, an unknown id, a known id beside an unknown one); `electionsHeldIn` 4, `usesSingleConstituencyGroup` 3, `mostSpecificConstituency` 7.

### Red, then green

| Run | Tree | Exit | Result |
|---|---|---|---|
| `177-13-order-red` | the test, no module (head `e1afb05e1`) | 1 | the file fails on its import: `Failed to resolve import "./selectionOrder"`; no test ran |
| `177-13-order-red-skeleton` | the test and an uncommitted module whose outcome functions answer `show` and whose derivations answer nothing (kept as `177-13-order-red-skeleton.selectionOrder.ts.kept`) | 1 | 38 failed, 16 passed; every failure an `AssertionError`; the 16 are the cases whose right answer is `show`, an empty list or `undefined`, which a skeleton that answers nothing necessarily gets right |
| `177-13-order-green` | the module (the whole routes library) | 0 | 11 files, 245 passed |

Observed, read from the kept logs and the skeleton run's JSON report. The skeleton run is the control for the dispatch's rule that a red report counts only on expectations, as plan 177-08 made one.

## Task 2 — the four voter files

- **`elections/+page.ts`** and **`constituencies/+page.ts`**: each builds its temporary data root as before, calls its outcome function with `honourDisallowSelection: true`, `implyWithinChosenConstituencies: false`, `skipWhenFullyImplied: false` and the ids `parseParams` gives, and maps `done` to the questions, `goto` to the other step's voter route (the elections load passing `electionId` on only where the outcome carries it, as before) and `show` to a return. The `next` reading and forwarding are unchanged.
- **`elections/+page.svelte`**: the listed elections are `electionsHeldIn({ elections: voterCtx.dataRoot.elections, constituencies: voterCtx.selectedConstituencies })` while the setting names a group, and `voterCtx.dataRoot.elections` otherwise.
- **`constituencies/+page.svelte`**: `useSingleGroup` is `usesSingleConstituencyGroup({ appSettings, constituencyGroups: voterCtx.dataRoot.constituencyGroups })`; the prefill asks `mostSpecificConstituency` per election.
- Reactive accessors are still read as `voterCtx.X` inside the consuming `$derived` or `$effect`; the data root is bound to no alias. The markup, the submit handlers and the selected-on-arrival rule are untouched.

Two reads changed place inside their tracking scopes, with no effect I can construct: `voterCtx.selectedConstituencies` is now read by the elections derivation even when the data root holds no election, and `voterCtx.dataRoot.constituencyGroups` by `useSingleGroup` even when the setting names no group. Both getters return state and cannot throw.

### Every comment brought in line, by file

| File | Comment | What was wrong | Now |
|---|---|---|---|
| `elections/+page.ts` | on the implication call | "NB. We don't pass the selected constituencyIds here…" described a call that is gone | states how the module is asked and why a single election held in the selected constituencies is still shown |
| `elections/+page.ts` | on the redirect with the implied id | `(Symmetry with (located)/+layout.ts:60-67 …)`, a line reference | one sentence on why the implied id is passed on |
| `elections/+page.ts`, `constituencies/+page.ts` | docstring | — | the table kept; one sentence added naming the function that decides the rows |
| `constituencies/+page.ts` | on the early return and on the last line | described the removed branch; the last line said "Show election selector" in the constituency load | one comment on how the module is asked; "Show constituency selector" |
| `elections/+page.svelte` | inside the derivation | `variant-startfromcg.spec.ts:145`, a spec line | gone with the code; the rule is in `electionsHeldIn`'s TSDoc |
| `constituencies/+page.svelte` | on `useSingleGroup` | "The original `const` shape captured…", `variant-startfromcg.spec.ts:115` | why it is `$derived` and why its lookup must not throw |
| `constituencies/+page.svelte` | on the prefill | "The previous implementation delegated to…" | which selections have several applicable constituencies, and that the function does not throw for them |
| `impliedParams.ts` | on the narrowing | `variant-startfromcg.spec.ts:145` | the rule without the reference (the function's signature was edited beside it) |

Comments the edit did not touch and that still break the hygiene rule, left as the plan says: `elections/+page.svelte`, the comment on `handleSubmit` ("Prior implementation …", `multi-election.spec.ts:173`); `constituencies/+page.svelte`, the comment on the deferred target ("looping test 1", "in test 2").

### The pre-commit run

`tests/e2e-runs/177-e2e/177-13-precommit`, through the wrapper directly, head `544929fe8` with exactly the four files modified (the run's own `worktree-status.txt`); AC power, 16.89 GiB free in the Docker VM before it, nothing on ports 5273 and 5173. Exit 0, no void marker, provenance `<full default suite>`, 346 passed of 346, 0 failed, 0 flaky, 0 did not run, 116 projects, 8.3 minutes. Compared with `177-10-close` on the six counts of every project: 0 of 116 differ. No Sleep, Wake or DarkWake entry in `pmset -g log` inside the window. The four files as the run ran them are kept as `177-13-precommit.{elections,constituencies}.+page.{ts,svelte}.kept` and were byte-identical to the tree that was committed.

The wrapper's Playwright argument line was copied from the launch log into the run directory's `command` file before `e2e-evidence.mjs` ran, as the driver does for its own runs.

## Task 3 — the gate rows and the run of the commit

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 49 |
| unit | 0 | 72 |
| check-frontend | 0 | 10 |
| build | 0 | 16 |
| format | 0 | 20 |

`tests/e2e-runs/177-gates/177-13-close`, head `f8a0e5e5c`; `177-verdict.mjs gates … --rows …`: PASS, not stale, no Sleep entry. Unit totals from the row's log: frontend 3787 passed and 30 skipped (3723 before; 64 more, the two new files), dev-seed 1050, data 318.

`tests/e2e-runs/177-e2e/177-13-close`, through the driver, head `f8a0e5e5c`; 16.79 GiB free in the Docker VM before it; AC power. 346 passed of 346, 0 failed, 0 flaky, 0 skipped, 0 did not run, 116 projects, 8.3 minutes. `177-verdict.mjs e2e 177-13-close --same-projects-as 177-10-close`: PASS — 116 projects compared, 0 not as expected, the full default suite, not stale, no Sleep entry inside the window.

No axe finding and no overflow in either run; no run was void or red.

## For plan 177-15 — how the contestant's loads call the two outcome functions

```ts
import { constituenciesStepOutcome, electionsStepOutcome } from '$lib/routes';

const outcome = electionsStepOutcome({          // or constituenciesStepOutcome, same input
  dataRoot,                                     // the root that holds the elections and the constituencies
  elections: admissible,                        // the admissible elections, as Election objects OF THAT dataRoot
  appSettings,
  honourDisallowSelection: false,
  implyWithinChosenConstituencies: true,
  skipWhenFullyImplied: true,
  electionIds,                                  // the nominationElectionId values of the address, or undefined
  constituencyIds                               // the nominationConstituencyId values, or undefined
});
```

- **`show`**: serve the step. **`goto`**: redirect to `outcome.step`'s contestant route, passing `outcome.electionIds` on as `nominationElectionId` when the outcome carries them (it does when one admissible election was implied on the way to the constituency step; it carries none under `startFromConstituencyGroup`). **`done`**: redirect to the details step with `outcome.electionIds` and `outcome.constituencyIds` — unlike the voter, the contestant's caller must read them, because an implied election or constituency is not in the address.
- **What `done` holds.** Each id once. When the pair was skipped: the one election and its one constituency. At the constituencies address: the chosen (or the one implied) elections in the address's order and the one constituency of each, a shared constituency named once. At the elections address under the setting: the one election held in the chosen constituencies, and the chosen constituency ids as the address gave them — which may be a constituency and its parent; which of them an election takes is `mostSpecificConstituency`'s or `Election.getApplicableConstituency`'s question, not the outcome's.
- **The load need not validate ids.** An election id not among `elections`, a constituency id the data root does not hold, and an empty list are all "not chosen". The elections address never reads `electionIds`, and the constituencies address never reads `constituencyIds`.
- **`elections` must be objects of the `dataRoot` handed in**: the implied constituencies are looked up by id in that root.
- **The one row the outcome does not close.** Under the setting, with a constituency chosen in which no admissible election is held, the elections address answers `show` and `electionsHeldIn` answers an empty list (pinned by a case). The UI contract keeps the user on the constituency step with one sentence, so the constituency step asks `electionsHeldIn({ elections: admissible, constituencies })` before it navigates on. If plan 177-15 or 177-16 would rather have the elections address send such a visit back, that is one branch in `electionsStepOutcome` and one row in its test.
- **Two small rules stay on the voter's pages and will be written again on the contestant's**: the election step lists `electionsHeldIn(…)` while the setting names a group and every election on offer otherwise; the constituency step lists every election on offer while `usesSingleConstituencyGroup` answers a group and the chosen elections otherwise. The plan named five functions and these are not among them; a sixth and seventh would hold them once.
- The frontend sees `selectionOrder.ts` without a build: it is frontend source.

## Findings

1. **`mostSpecificConstituency` picks the constituency whose group has the fewest members, and the page's old comment called that "the leaf in the hierarchy … the municipality the voter chose".** A group of regions is usually smaller than a group of municipalities, so for an election with both groups the function — like the code it replaces — answers the region, not the municipality. The behaviour was kept exactly (a case pins it both ways round) and the TSDoc states what the code does; the old comment's claim was not carried over. Whether the voter's prefill should prefer the child is a question about the voter's page, outside this plan. Observed in the unit test; not observed in a browser.
2. **The rule "an election two constituencies match counts as held" is written twice**: in `electionsHeldIn`, and in `getImpliedElectionIds`' own narrowing by `selectedConstituencyIds`, which only `(voters)/(located)/+layout.ts` reaches. Calling one from the other would make `impliedParams.ts` and `selectionOrder.ts` import each other; the `(located)` load may not be edited by this plan. Each copy has its own unit case.
3. **The two test files build the same data root and settings** with a builder each; a shared test helper would hold it once.

## Sentences the work made false, reported and not edited

- **`.claude/skills/components/context-reactivity.md`, § 5, "Canonical analog, `apps/frontend/src/routes/(voters)/elections/+page.svelte:40-41`"** with its two-line excerpt `let elections = $derived.by(() => { let result = voterCtx.dataRoot.elections;`. Those lines no longer exist: the derivation is now a `$derived(…)` at lines 42 to 46 that reads `voterCtx.dataRoot.elections` as an argument of `electionsHeldIn`. It is still a correct example of the rule; the citation and the excerpt are stale. For plan 177-21.
- **`apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md`**, the list under "`$lib/routes` holds everything the app knows about its routes": not false, but it names `impliedParams.ts` and not `selectionOrder.ts`. A candidate for one line. For plan 177-21.

## The code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: one module decides, the voter's four files call it, the suite is green unchanged |
| OWASP top 10 | An id from the URL is never trusted: ids not on offer are dropped before any outcome (unit cases). No new input surface, no new redirect target: the two loads redirect only to named routes, and the `next` handling is unchanged |
| Code style guide | Followed; function declarations throughout, the test helpers included |
| No `any` | None |
| No repeated code | Two repetitions remain and are reported: *Findings* 2 and 3. The four inline copies of the ordering rules in the voter's files are gone |
| New entities documented | Every exported type, member and function has TSDoc; the module has a header with its caller contract |
| Repo documentation updated | Not edited by this plan; two sentences reported above |
| Tracking events | No new user function |
| Svelte component guidelines | No component created; the two pages keep their structure |
| Errors handled and logged | The module throws nothing of its own; the one lookup that can throw (`getApplicableConstituency`) is caught where its throw has a meaning |
| Failing checks | None: six gate rows and two full runs green |
| Parts sharing dependencies not unduly affected | `getImpliedElectionIds` answers as before without the new arguments (its test, unchanged, before and after); `(located)/+layout.ts` unchanged; `layout.tracking.test.ts` and `layout.load.test.ts` pass |
| WCAG A and AA | No markup changed; `a11y-smoke` 16 of 16 in both runs |
| Keyboard and screen reader | No markup or handler changed |
| Documentation added where necessary | TSDoc and the two loads' docstrings; the guides are 177-21's |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each of the four commits; every touched comment read (table above) |
| Commit history | Four commits, each of one kind: two tests, one feature, one refactor |
| No fixes of itself | None |
| Formatting-only changes | None |
| `[db]` tag | No database change |

## Deviations from Plan

### Auto-fixed Issues

None.

### Other deviations

**1. Three hand-typed voter addresses answer differently than before.** The plan asks both that the voter's behaviour does not change and that "an election outside the `elections` given is never among an outcome's ids" (T-177-55). A chosen id that names nothing therefore has to be dropped, and a list emptied that way cannot count as a choice — otherwise the implication would run over every election. The module applies that one rule to both id lists and for both callers. For the voter it changes:

| Address | Before (read from the code that was replaced; not run) | Now (unit cases) |
|---|---|---|
| `/elections?constituencyId=` (empty), or an id of no constituency, while `startFromConstituencyGroup` is set | the empty list was truthy, so "set": the questions when the election was implied, otherwise the election selector with nothing in it | no constituency chosen: redirect to the constituencies |
| `/constituencies?electionId=` (empty), setting not set | "set", and the constituencies implied over every election | no election chosen: the implied election, or redirect to the elections |
| `/constituencies?electionId=<an id of no election>`, setting not set | `dataRoot.getElection` throws in the load | the id is left out; the same as an empty parameter |

None of the three is an address the application produces: its own navigation builds these parameters from a completed selection, and `qs` writes nothing for an empty list. `(located)/+layout.ts` already treats an empty list as no selection (`hasSelection`). The "before" column is inferred from the removed code, not observed in a browser. A search of `tests/tests` for `electionId=` and `constituencyId=` finds such an address only for `/results`, never for these two pages with an empty or unknown id, so the suite could not have shown the difference.

**2. Each load parses the address on both of its paths.** The plan's action is "calls its outcome function the voter's way with the ids `parseParams` gives it"; a pure function needs the ids before it decides, so `parseParams` — which reads `url.search` — now runs unconditionally. Before, the elections load reached it only while the setting was set and the constituencies load only while it was not. SvelteKit therefore reruns each of these two page loads on any change of the address while its own page is shown, where before one path of each reran only on a change of `next`. A rerun recomputes the same outcome and returns no data; neither page navigates to itself. PROH-177-33's second clause reads "no load gains a tracked read of a `url` property": no load gained a read it did not already make on its other path, no layout load changed, and `(located)/+layout.ts` is unchanged against the base commit — but on one path each, the read is new. Stated here so that it is ruled on rather than found.

**3. A skeleton red run was made beside the plan's red run**, because the plan's red run fails on the import and the dispatch counts a red report only on expectations. *Red, then green* above.

**4. The elections address does not send a visit back when no election on offer is held in the chosen constituency.** The plan's behaviour list fixes the constituencies address for that row (`show`) and `electionsHeldIn` (empty), and says nothing of the elections address; it answers `show`, as the voter's does today. *For plan 177-15* above.

## Prohibitions

- **PROH-177-32** — held: `git log 544929fe8..HEAD -- tests/tests/specs` is empty, and the plan's diff holds no file under `tests/`.
- **PROH-177-33** — the first clause held: `git diff --quiet $(cat 177-BASE) HEAD -- "apps/frontend/src/routes/(voters)/(located)"` exits 0, and `layout.tracking.test.ts` passes in the unit row. The second clause: see *Deviations*, 2.
- **PROH-177-34** — held in the module: with `honourDisallowSelection: false` and the setting on, several elections are not implied (a case at each address); nothing on the contestant's side calls the module yet.

## Threat Flags

None: no endpoint, auth path, file access or schema change. The trust boundary the plan names — ids in the URL — is narrower than before (*Deviations*, 1).

## Not done, or not verified

- The three "before" behaviours of *Deviations* 1 and the remark in *Findings* 1 about a browser were read from code, not observed.
- No docs or skill file was edited; two sentences are reported for plan 177-21.
- `.planning/WINDOWS.md` was not appended to: the plan leaves no stub, no skipped test and no verify that was not run.
- `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, as the dispatch rules.

## The state the local stack is left in

The Supabase stack is running, untouched by a reset in this plan: the database is as two full E2E runs left it (each dataset's teardown ran; `39-invitations.test.sql` test 238 would be red on it, the known finding). No dev server is running; nothing listens on ports 5273 or 5173. The Docker VM has 16.71 GiB free.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-unit/`: `177-13-order-red.{log,exit,head}`, `177-13-order-red-skeleton.{log,exit,head,json}` with `177-13-order-red-skeleton.selectionOrder.ts.kept`, `177-13-order-green.{log,exit,json}`, `177-13-t{1,2,3}-verify.{sh,log,exit,head}`, `177-13-precommit.launch.{log,exit,started}`, `177-13-gates.{log,exit}`, `177-13-e2e-close.{log,exit}`, the `177-13-typecheck-*`, `177-13-check-*`, `177-13-voters-unit-*` and `177-13-hygiene-*` logs.
- `tests/e2e-runs/177-e2e/`: `177-13-precommit/`, the four `177-13-precommit.*.kept` files, `177-13-close/`.
- `tests/e2e-runs/177-gates/177-13-close/`.

## Self-Check: PASSED

- Found on disk: `selectionOrder.ts`, `selectionOrder.test.ts`, `impliedParams.test.ts`, this file, `177-e2e/177-13-precommit/summary.json`, `177-e2e/177-13-close/summary.json`, `177-gates/177-13-close/summary.tsv`.
- Ancestors of HEAD: `e1afb05e1`, `0b877f9ee`, `544929fe8`, `f8a0e5e5c`.
- `git rev-list --count dfeae5463..f8a0e5e5c` is 4.

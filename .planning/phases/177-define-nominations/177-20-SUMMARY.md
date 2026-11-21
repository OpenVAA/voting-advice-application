---
phase: 177-define-nominations
plan: 20
subsystem: frontend-accessibility
tags: [axe-scan, phone-width, keyboard, focus, election-selector, nomination-editor, nominations-view, e2e]
status: complete
requires:
  - "177-19: the nominations view's six states and the steps that reach them, the full run 177-19-close (394 of 394, 116 projects)"
  - "177-18: the message region and the main button's four labels"
  - "177-17: existing, removed and kept cards; parentByKeyboard in a browser"
  - "177-11: the editor's fixture (boxesOf, expectFocusOn) and the view's (expectFitsViewport, expectCardValuesInsideCard)"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs"
provides:
  - "ElectionSelector: the option label carries whitespace-normal — a long election name wraps on the voter's election page, the pre-registration page and the editor's election step"
  - "contestant-nominations.spec.ts: thirteen scan entries (twenty-six scans), eleven phone tests at each of 320 and 390 px, one keys: and one focus: test — fifty tests"
  - "the editor's fixture: boxesOf hands over Keep; parentNameBoxOf; electionLabelBoxOf; keySymbol; keyOtherName; parentTabStops"
  - "measured: N-1 (the election name overflows at 320 and at 390 px, and takes the checkboxes out of reach), N-5 (a long party name is shown whole inside its card at both widths), N-6 (axe evaluates contrast inside the hidden card)"
  - "runs: 177-e2e/177-20-control (8 red, one cause), 177-20-control-r2 (the 2 named red), 177-20-planted-p1, 177-20-planted-p2, 177-20-precommit (444 of 444), 177-gates/177-20-close, 177-e2e/177-20-close (444 of 444)"
affects: [177-21]
tech-stack:
  added: []
  patterns:
    - "a phone-width test of a later step of a walk loads that step's own address, so that a step that cannot be operated at that width reddens one test and not every test behind it"
    - "a planted-defect run keys a plant on the dataset where another dataset's spec scans or measures the same page upstream in the chain"
    - "two phone widths are two slots: a plant behind a media query lets one run show one test red on two different expectations"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte
    - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
    - tests/tests/specs/perm/contestant-nominations.spec.ts
    - "apps/docs/…/frontend/components/generated/components/electionSelector/ElectionSelector/+page.md"
    - "apps/docs/…/frontend/routing/generated/+page.md"
decisions:
  - "the states the dispatch notes list as in no scan and no width measurement are covered where a fixture step reaches them: thirteen scan entries and eleven phone tests per width, where the plan writes eight and seven"
  - "each phone test of the constituency step and of the details step loads its own step's address; the election step's phone test also checks an election and reads that Continue can be pressed"
  - "the selector's docstring gains two sentences on how an option is laid out, and the generated component page with it"
requirements-completed: [NOM-03, NOM-04, NOM-06]
metrics:
  started: "2026-10-11T11:28:49Z"
  completed: "2026-10-11T13:16Z"
  duration: "about 1 hour 47 minutes, of which about 79 are six E2E runs and about 4 the gate rows"
  tasks: 3
  files: 5
actuals:
  tokens: 20577 # chars/4 over git diff 852bd23af..2f32e988c outside .planning (82,309 characters)
  tasks: 3
  commits: 2 # git rev-list --count 852bd23af..2f32e988c, measured before this file was committed
plan_head_before: 852bd23af16682051a5ff5c3d347716aed5de7cf
plan_head_after: 2f32e988c8cde73916043bf316fc98a6e092d2fc
---

# Phase 177 Plan 20: The Accessibility Gate and the Phone-Width Gate for the Nomination Editor and the Nominations View; a Long Election Name Wraps — Summary

Thirteen states of the editor's three steps and of the nominations view are scanned by axe in the light and the dark theme, eleven tests at each of 320 and 390 px measure every page of the editor and the view against its viewport and the parts of a card against the card, and two tests hold the parent group's keyboard behaviour and focus after each navigation. The one defect found is the one the research read: an election name longer than a phone is wide could not wrap. Measured, it does more than widen the page — it puts every checkbox of the election step beyond the left edge of the viewport, where it cannot be pressed. One class on the shared selector's label fixes it for the voter's election page, the pre-registration page and the editor.

**No schema change. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `177-DISPATCH.md` and `177-21-INPUTS.md` were not touched.**

## Read this first

- **Green at the end.** Closing run `177-20-close`: 444 of 444, 116 projects, per project equal to `177-19-close` but for fifty more in `perm-contestant-nominations` (97), on its first attempt. Seven gate rows green. No committed test was red at any commit, no test was retried, and no run is void.
- **Fifty new tests, where the plan writes thirty-two.** The dispatch asks for the states its notes list as unscanned and unmeasured, where a fixture step reaches them. That is five scan entries and four phone tests per width beyond the plan's. So the verify commands of Tasks 2 and 3 **exit 1 as written**, each at its count, and 0 in a corrected copy that differs in the counts alone. Nothing was bent to a count.
- **The first control was refused, and the reason is a finding.** `177-20-control`: the election step's test red on the page-width expectation at 320 **and** at 390 px, as the plan allows — and six more tests red on a timeout, three at each width: every phone test that walked through the election step could not check an election, because the checkbox was outside the viewport. One cause, the unwrappable label. *Deviations*, 2.
- **The phone tests of the later steps now load their own step's address**, and the election step's test checks an election itself. With that, `177-20-control-r2` is exactly what the plan asks: the two election-step tests red on the page-width expectation, 368 others green. Task 1's verify exits 0 as written, on its second form.
- **No axe finding and no overflow besides that one.** All twenty-six scans passed on the tree before the fix and after it; every other phone test passed at both widths as soon as it no longer walked through the election step.
- **Every new scan and every kind of new width assertion was seen red once**, in two runs with planted defects (`177-20-planted-p1`, `-p2`), each restored byte for byte from kept copies. What was not seen red is listed under *Not done, or not observed*.
- **N-6 is measured, and it matters for the dataset:** axe evaluates colour contrast inside the option row's card although the card is hidden from assistive technology. A party's or an alliance's name or initials in a colour that fails contrast would fail these scans.
- **The host's lid was closed during every run** (`Entering DarkWake state due to 'Clamshell Sleep'` ten seconds into each window). No run carries the void marker, no output holds `server connection lost`, and the worst heartbeat gap of any run was 111 ms.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `4297159c6` | `test(177-20)`: additive steps on the editor's fixture; no committed spec calls one |
| 2 | `2f32e988c` | `feat(177-20)`: **the one** — the selector's class and docstring, the spec's fifty tests, the regenerated component page and route map — after the controls, the two planted runs and the green pre-commit run |
| 3 | — | runs only |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-20-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it. A corrected copy is `…-verify.corrected.sh`, made from the written one by `sed` on the counts alone.

| Task | As written | Corrected | Head | What the corrected copy changes |
|---|---|---|---|---|
| 1 | **1** on `177-20-control`; **0** on `177-20-control-r2` | — | `4297159c6`, the spec uncommitted | nothing: the written verify accepts the second control, on its second form (`--red "phone 320: the election step" --red "phone 390: the election step"`) |
| 2 | **1** — `projects off their expected count: perm-contestant-nominations` | **0** | `2f32e988c` | `perm-contestant-nominations=32` → `=50` |
| 3 | **1** — four counts: 26 scans not 16, 11 `phone 320:` not 7, 11 `phone 390:` not 7, total 97 not 47+32 | **0** | `2f32e988c` | `=32` → `=50`; `axe accessibility scan=16` → `=26`; `phone 320:=7` → `=11`; `phone 390:=7` → `=11` |

None of the six known defects of the plans' verify commands was met: one path is uncommitted in the control, no title is counted by its quote, and no test is declared through an alias.

## Task 1 — the fixture steps, fifty tests and the two controls

### The fixture steps (`contestantNominationEditor.fixture.ts`, commit 1)

| Step | What it does |
|---|---|
| `boxesOf(card)` | also hands over `keep`, the Keep button of a removed card |
| `parentNameBoxOf(card, name)` | the element in which a card shows a listed entity's name, after asserting that it reads exactly that name |
| `electionLabelBoxOf(name)` | the label of an election of the election step: the checkbox with the name beside it |
| `keySymbol(card, text)`, `keyOtherName(card, text)` | empty the field and type key by key, so that the field's own limit applies, then leave it |
| `parentTabStops(card)` | how many radios of the group the Tab key stops on, walking through the group forwards and backwards; `{ forward, backward }` |

Nothing was missing for the page width (`pageGeometry` is a fixture of the spec's `test`) or for reading what a field holds (`expectSymbol`, `expectOtherName`).

### The tests

| Kind | Count | Titles |
|---|---|---|
| scans | 26 | `axe accessibility scan — <name>` and `… (dark)` for the thirteen entries below |
| `phone 320:` | 11 | the election step with a long election name; the constituency step; new cards; the view with "Define your nomination"; a symbol and a typed name at their limits; an existing card, a removed card and the message of a refused removal; the view with Edit; nominations listed while no election admits a party; the view under the answers lock; the message that the nominations were changed elsewhere; the view with no election to stand in |
| `phone 390:` | 11 | the same |
| `keys:` | 1 | the parent group is one tab stop, the arrow keys move and choose, and Other chosen by arrow leaves focus on its radio |
| `focus:` | 1 | the heading of each step takes focus after the navigation that opens it, a skip included, and the nominations view's after Cancel |

The spec holds no locator call, no soft assertion, no fixed wait and no axe gate of its own (Task 1's verify stage; the scan-wiring gate). `perm-contestant-nominations` holds 97 tests.

**The thirteen scan entries**, each declared through `declareScans` in a describe that sets its session and whose `afterEach` puts back both locks, the type of each election an entry changes, and the entity's answers and nominations:

| Entry | Session | State | Anchor / marker | The plan's? |
|---|---|---|---|---|
| `nomination-elections` | candidate, none | election step, nothing checked, Continue disabled | the list / the hint | 1 |
| `nomination-constituencies` | same | constituency step, the northern region chosen, Continue enabled | the picker | 2 |
| `nomination-details-new` | same | two new cards: required group untouched with two not-nominated hints; "Independent / no party" chosen; **Save and Continue** | a card / an option hint | 3 |
| `nomination-details-invalid` | same | "Other" with a blank name after Continue: field in error, message `invalid`, focus on the field | the field's error / the message region | 4 |
| `nomination-details-existing` | party, seeded | two kept confirmed cards, a filled symbol, "None" chosen, Remove, "Change the selection"; **Continue** | a card / the confirmed note | 5 |
| `nomination-details-removed` | same | both cards removed: the warning line and Keep; **Save and Return** | Keep / the removed note | 6 |
| `nomination-details-has-candidates` | same | message `hasCandidates`, one card removed and one kept, focus on the main button | the removed note / the message region | added |
| `nominations-listed-no-election` | same | J6: listed, no entry offered, no lock | a card / the list, with the container's state and the not-editable sentence read | added |
| `nominations-answers-locked` | candidate under a party | J2 under the answers lock alone | a card / the note with its reason | 7 |
| `nominations-requested-parent` | same | a typed party on its row with the requested line; Edit | a card / the requested line | added |
| `nomination-details-chosen-party` | same | a candidate's kept card with its party's row chosen, nothing left to do; **Return** | a card / the confirmed note | added |
| `nomination-details-changed` | same | message `changed`, the card rebuilt as new, focus on the main button | a card / the message region | added |
| `nominations-no-election` | party, none | J5: the sentence, one support button, Return | the empty sentence with its kind | 8 |

Every reach ends on a step that reads the state its row names, after a full page load following each state step (PROH-177-57, PROH-177-60). The main button's four labels are each asserted in a reach.

### The first control — `177-20-control`

Head `4297159c6`, only the spec uncommitted, one project, wrapper status 1, 11:44:52Z to 12:04:15Z (19.2 minutes, 9 of them six timeouts of 90 s), Docker VM 16.24 GiB free before it, AC power, no void marker: 370 tests, **362 passed, 8 failed, 0 did not run**.

| Red test | Ended | On |
|---|---|---|
| `phone 320: the election step fits the viewport with a long election name` | failed | `the document must not be wider than its viewport`: overflow **177 px** |
| `phone 390: the election step …` | failed | the same expectation: overflow **142 px** |
| `phone 320:` and `phone 390:` `the constituency step fits the viewport` | timed out | `locator.setChecked` on the closed-list election's checkbox: *element is outside of the viewport* |
| `phone 320:` and `phone 390:` `new cards fit the viewport …` | timed out | the same |
| `phone 320:` and `phone 390:` `a symbol and a typed name at their limits …` | timed out | the same, on the open election's checkbox |

**What overflowed** (*measured*, from the failure's own list): the selector's grid and each of its three labels are **674 px** wide — the width of the longest name (89 characters) on one line, since the grid gives every label the widest one's width — and the name's own `<span>` 642 px. The selector is a centred item of a column, so the overflow is on both sides: the labels end at x = 497 at 320 px and at x = 532 at 390 px, and begin at x = −177 and x = −142. A document cannot be scrolled to the left of its origin, so the checkboxes, which stand at the labels' left end, cannot be brought into view. That is the mechanism the todo on labels that cannot wrap describes for the terms-of-use checkbox.

Both of the plan's forms of the verdict refuse this run: six tests outside the named ones did not pass, and each ended on a timeout. The run is kept, with the spec as it ran (`177-20-control.tests.tests.specs.perm.contestant-nominations.spec.ts.kept`).

### The second control — `177-20-control-r2`

The spec changed between the two (below, *Deviations*, 2): the three phone tests behind the election step load their own step's address, and the election step's test gained its last four lines. Head `4297159c6`, only the spec uncommitted, wrapper status 1, 12:05:32Z to 12:16:10Z, Docker VM 16.14 GiB, no void marker: 370 tests, **368 passed, 2 failed, 0 did not run**. `177-verdict control 177-20-control --project perm-contestant-nominations --setup data-setup-perm-contestant-nominations --dirty-only <the spec> --red "phone 320: the election step"`: FAIL (the 390 px twin is red too); with `--red "phone 390: the election step"` added: **PASS** — *2 test(s) named; 368 other test(s)*.

**The measurement the plan asks for (ruling 1): the election name overflows at both widths.** Ruling 2 does not apply.

## Task 2 — the selector, the planted runs, the pre-commit run, the commit

### The change

`ElectionSelector.svelte`: the option label's classes gain `whitespace-normal`, with a comment above it in the words of the terms-of-use label's. No alignment class was added: the checkbox is centred against the name's lines. The `@component` docstring gains two sentences — each election is a checkbox with its name beside it, and a name longer than the space beside the checkbox wraps instead of widening the selector. **The docstring did change**; before, it said nothing of how an option is laid out, so the plan's condition for a sentence was not literally met (*Deviations*, 4).

`yarn workspace @openvaa/docs generate:docs` (exit 0) regenerated two files, both in the commit:

- the selector's component page — the two sentences;
- **the route map — four lines for the editor's `(edit)/` directory and its three steps.** They exist since 177-15; the generated map had not been regenerated since.

`EntityCard`, `EntityList`, `Input` and `ConstituencySelector` are unchanged since the base commit, and the commit changes no spec but the nominations spec (Task 2's verify stages; PROH-177-59).

No correction under ruling 4 was needed: nothing that plans 177-14 to 177-19 built was red.

### The planted-defect runs

Both on head `4297159c6` with the spec, the fix and the plants uncommitted; each plant made by `177-unit/177-20-plant.py`, each file copied to `177-unit/177-20-planted-p<N>.kept/` first and restored from there by `177-20-restore.sh`, which compares every file with its copy. After the second restore the selector and the spec had the digests the first planted run recorded for them.

**`177-20-planted-p1`** — 12:18:35Z to 12:34:06Z, Docker VM 16.55 GiB, wrapper status 1: 370 tests, 319 passed, 51 not. Planted: a low-contrast paragraph and an element 200vw wide on each step of the editor and — for this dataset alone, keyed on an election's name, because other datasets' specs scan and measure the view upstream — on the nominations view; an empty focus target on the details step; each radio of a parent group in a group of its own where the group lists this dataset's green party; the name field's limit at 200.

| Tests | Red on |
|---|---|
| all 26 scans | the gate's zero-violations expectation: one violation each, `color-contrast` at the planted paragraph |
| `keys:` | its first expectation: `{ forward: 6, backward: 6 }` where `{ forward: 1, backward: 1 }` is expected |
| `focus:` | `expectFocusOn({ on: 'heading' })` on the details step, after the election step's and the constituency step's headings had passed: *Expected: focused, Received: inactive* |
| 20 phone tests | `the document must not be wider than its viewport`, at the test's first page-width step |
| 2 phone tests (`a symbol and a typed name …`, both widths) | **a timeout**, on the click of the "Other" row — not the expectation the plant was for. An artefact of the planted tree, not diagnosed; the same press passes on the unplanted tree in every other run |
| `edit: a candidate replaces its party with a typed name …` (an existing test) | its arrow-key expectation, by the same plant as `keys:` |

**`177-20-planted-p2`** — 12:34:59Z to 12:45:41Z, Docker VM 16.48 GiB, wrapper status 1: 370 tests, 348 passed, 22 not. Planted: the selector's fix taken out inside a container that clips; parts of a card moved out of it, each at one phone width; each field's limit raised at one phone width; a low-contrast colour on a party's name inside the option row's hidden card.

| Test | At 320 px, red on | At 390 px, red on |
|---|---|---|
| the election step | the label's right edge, 693.6 where ≤ 320.5 is expected — the page itself was no wider | the same, ≤ 390.5 |
| new cards | the name field of "Other" inside its card | the long party name shown whole: its content 619 px beyond its box |
| a symbol and a typed name at their limits | the name field holds 120 characters where 100 are expected | the symbol field holds 60 where 50 are expected |
| an existing and a removed card | Remove inside its card | Keep inside its card |
| the message that the nominations were changed | the symbol field inside the candidate's kept card | option 1 inside the candidate's kept card |

And twelve scans — every details-step entry whose cards list an entity — red on `color-contrast` at the planted name, two to eight nodes each, inside the card the option row hides from assistive technology. `nomination-details-removed`, whose cards show no group, stayed green.

### What N-1, N-5 and N-6 showed

- **N-1** — *measured*: the label cannot wrap; the page is 177 px too wide at 320 and 142 px at 390, and the checkboxes are out of reach at both. After the fix the page fits at both widths, the label lies inside the viewport and shows its whole text, and the checkbox can be checked (`177-20-precommit`, `177-20-close`).
- **N-5** — *measured*: the dataset's long party name (92 characters, with spaces) wraps inside the entity card's header at 320 and at 390 px: the element that shows it holds its whole text and lies inside the card (`phone 320:` / `phone 390: new cards …`, green on the unplanted tree, red at 390 under the plant that clips it). A name with no place to break at was not tried in an option row; on the nominations view it was (100 characters, wrapped at any character, inside its card).
- **N-6** — *measured*: axe evaluates contrast inside the hidden card. The dataset's parties and alliances pass in both themes on the unplanted tree.

### The pre-commit run

`tests/e2e-runs/177-e2e/177-20-precommit`, head `4297159c6`, four files uncommitted (each kept beside the run; the commit script refuses unless each is `cmp`-equal to its copy; digests in `177-unit/177-20-held-files.tsv`), full default suite, wrapper status 0, 12:46:50Z to 12:57:58Z, Docker VM 16.38 GiB free before it, first attempt: **444 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects**. Against `177-19-close`: equal in every project but `perm-contestant-nominations`, 97 against 47. Every voter spec at its count, with no voter assertion edited.

Before it, on the same four files, each read from its exit file (`177-unit/177-20-t2-r2-*.exit`): `yarn workspace @openvaa/frontend check` 0 (0 errors, 0 warnings); the unit tests of the three directories the plan names 0 (936 of 936); `yarn lint:check` 0 (it holds both type checks, the scan-wiring gate and comment hygiene); Prettier 0.

## Task 3 — the gate rows and the full run

**Gate rows** — `tests/e2e-runs/177-gates/177-20-close`, head `2f32e988c`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 25 |
| lint | 0 | 49 |
| unit | 0 | 72 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 19 |
| docs-links | 0 | 2 |

`177-verdict gates 177-20-close --rows …`: **PASS**, not stale. Unit totals, unchanged from `177-19-close`: frontend 4228 passed and 30 skipped, dev-seed 1050, data 318, supabase 462, app-shared 148. `power.txt` holds one Sleep entry in the window, which the verdict reads as informative.

**The full run** — `tests/e2e-runs/177-e2e/177-20-close`, head `2f32e988c`, `bash 177-e2e.sh 177-20-close --require-project perm-contestant-nominations --require-project contestant-a11y-scan --require-project perm-startfromcg`:

- Status 0, first attempt. Docker VM 16.22 GiB free before it (the driver's record, after its own builder prune), 16.10 after. AC power, 100 %. 13:01:51Z to 13:13:41Z. No void marker; no `server connection lost` in its output; 351 heartbeats, 65 ms the latest.
- **444 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.** The three required projects: `perm-contestant-nominations` 97 of 97, `contestant-a11y-scan` 24 of 24, `perm-startfromcg` 6 of 6. `perm-no-nomination` 68 of 68.
- Verdict as the plan writes it — `--same-projects-as 177-19-close --except perm-contestant-nominations=32` with the five title counts — **FAIL (4)**, each a count this plan moved. Corrected — `=50`, scans 26, `phone 320:` 11, `phone 390:` 11, `keys:` 1, `focus:` 1 — **PASS**: `per project: 116 compared, 0 not as expected`, every counted test passed.
- **Per project against `177-19-close`:** 115 equal; `perm-contestant-nominations` 97 against 47. 394 + 50 = 444.
- The project's 97 tests took 161 s of test time (85 s for 47 in `177-19-close`); the run 11.1 minutes of wall clock (10.5 before).

## Every state of this phase's screens: scanned, and measured

"L+D" is the light and the dark theme. Widths are 320 and 390 px unless one is named. *Italic* rows are not covered.

| State | Scanned | Measured | If not, why |
|---|---|---|---|
| Election step, nothing checked: hint, Continue disabled | L+D `nomination-elections` | both | |
| Election step with an election checked: no hint, Continue enabled | no | both | the contract's exclusion: the same markup without the hint |
| *Election step under "start from the constituency"* | no | no | another dataset's (`perm-startfromcg`); the contract's exclusion |
| Constituency step, one picker, a constituency chosen | L+D `nomination-constituencies` | both, before and after choosing | |
| *Constituency step: several pickers under headings* | no | no | no election of the dataset but one has several constituencies |
| *Constituency step: the "kept" section; the one picker over a group; the "no election here" sentence* | no | no | the kept section has been in no browser (177-17); the other two are the start-from-constituency dataset's. The contract excludes all three |
| Details: new card, required group untouched, not-nominated hints | L+D `nomination-details-new` | both | |
| Details: new card with a plain option chosen | L+D `nomination-details-new` | both (nothing chosen and "Other" chosen) | |
| Details: "Other" in error, message `invalid` | L+D `nomination-details-invalid` | both, with the other card's group in error too | |
| Details: a required group in error | no | both | entry 4's error line on a group; asserted by `define:` |
| Details: "Other" with its name field filled | no | both, at the field's limit | the contract's exclusion |
| Details: a party's kept confirmed card | L+D `nomination-details-existing` | both | |
| Details: a candidate's kept card, its party's row chosen | L+D `nomination-details-chosen-party` | both | |
| Details: a removed card | L+D `nomination-details-removed`, `-has-candidates` | both | |
| Details: message `hasCandidates` | L+D | both | |
| Details: message `changed` | L+D | both | |
| *Details: messages `tooManyPending` and `failed`* | no | no | no fixture step reaches either: each is a component case with the write as a spy (177-18) |
| *Details: the rebuild after `changed`* | no | no | transient: no step holds the page in it |
| Main button: Save and Continue / Continue / Save and Return / Return | L+D, one entry or more each | the first three at both widths; *Return not measured on the details step* | the shortest of the four, on the same button |
| *Details: a moved card; a card with an unlisted parent; a group with no listed entity* | no | no | the contract's exclusions; each asserted by a test of 177-17 |
| *Details: loading, saving, the options error* | no | no | transient, or the shared inline error |
| *The other entity type's cards beyond the two above* | no | no | the contract's exclusion |
| *Leaving with unsaved changes* | no | no | a browser confirm, outside the page |
| J1 — listed, with Edit | L+D `cand-nominations` (base dataset), `nominations-requested-parent` | both: a party's two cards, a candidate's card | |
| J2 — under the nominations lock | L+D `nominated-nominations-pending-locked` (no-nomination spec) | both, there | |
| J2 — under the answers lock alone | L+D `nominations-answers-locked` | both, with the support button inside the note | |
| J3 — empty, an entry offered | L+D `no-nomination-nominations-empty` | both, there and here | |
| J4 — empty, under a lock | L+D `no-nomination-nominations-locked` | both, there | |
| J5 — empty, no election | L+D `nominations-no-election` | both | |
| J6 — listed, no election | L+D `nominations-listed-no-election` | both | |
| A card with a requested parent | L+D `nominations-requested-parent` | both, with a 100-character name that has no place to break at | |
| The Edit link at phone widths | — | both | |
| *J with no facts in its data* | no | no | not reachable with a dataset of the suite (177-19) |

## For plan 177-21

- **The todo on unscanned states**: the table above is the list. Scanned by this plan: thirteen entries. Excluded by the contract and still unscanned: the election step with a selection and under start-from-constituency; the constituency step's three other forms; "Other" filled; a moved card; an unlisted parent; an empty group; loading, saving and the options error; the other entity type's remaining cards; the leave prompt. Unscanned because no step reaches them: the messages `tooManyPending` and `failed`, the rebuild after `changed`, the view with no facts.
- **A person's reads, not a test's**: the whole editor by keyboard and with a screen reader, in English (the contract's backstop row); the six other locales at 320 px (U-27 (a)); whether a screen reader announces the message region, the removed line and the lists.
- **The selector's docstring changed** (two sentences), and the generated component page with it.
- **`2026-10-07-174.1-daisyui-label-nowrap-is-a-latent-overflow-in-other-label-users.md` has one user fewer**: `ElectionSelector` wraps. Its table row for the selector ("fits at 320 and 390 with the dataset's names … an election or constituency name longer than the column overflows") is now measured and fixed, and the consequence it names for the terms-of-use label — the control put out of reach to the left — is measured for this selector too. The other users in its table are untouched.
- **The visual project** is not part of a default run. Whether a baseline moved is read from the phase's CI evidence (ruling 8); the base dataset's election names fit on one line, so none is expected to.
- **The generated route map was four lines behind since 177-15.** If a gate should hold it, none does today: `docs-links` passed before and after.
- **A candidate for the operator's list**: the voter's election page had the same defect for any deployment with an election name longer than a phone is wide — not a wider page alone, but checkboxes that cannot be reached. It is fixed by the shared class and **not observed on the voter's page**: no voter dataset holds such a name.
- **A candidate for a todo**: on a tree with an element wider than the viewport planted on the details step, the press of the "Other" row of a single card timed out at both phone widths (`177-20-planted-p1`). Not diagnosed. It may be nothing but the plant; it is recorded because a press that hangs on a page that scrolls sideways is how the election step's defect showed.

## Deviations from Plan

### Auto-fixed Issues

None in the application beyond the plan's own fix. In my own tests, before any commit of them:

- **[Rule 1 — Bug] Phone tests that could not pass before the fix they were not about.** Three tests per width walked through the election step to reach theirs. Found by the first control; corrected in the uncommitted spec; the second control is the evidence. No committed test was ever red.

### Other deviations

1. **Thirteen scan entries and eleven phone tests per width, where the plan writes eight and seven** — fifty tests, not thirty-two. The dispatch asks for the states its notes list where a fixture step reaches them. Added entries: `nomination-details-has-candidates`, `nomination-details-changed`, `nomination-details-chosen-party`, `nominations-listed-no-election`, `nominations-requested-parent`. Added phone tests: the view under the answers lock, J5, J6, and the message `changed`; the message `hasCandidates` is measured at the end of the plan's test of an existing and a removed card, whose title says so, and the messages of a failed check at the end of the plan's test of new cards.
2. **The control was made twice, and the spec changed between the two.** The plan's ruling 1 foresees one red test, or its twin as well, "and no other". The first control held six more, all by the cause the plan fixes. I did not accept that run under a looser reading, and did not make it again unchanged: the three tests now load the address of the step they measure (`openStep` with the selection in the address), which is what each is about, and the election step's test carries the check the others had made by accident — it checks the long-named election and reads that Continue can be pressed. The scans, `keys:` and `focus:` still walk through the election step, at a desktop width.
3. **Two planted-defect runs**, which the plan does not have and the dispatch asks for.
4. **The docstring gained its sentences although it said nothing of an option's layout before**, which is the plan's condition for one. A component whose label now carries a class for wrapping should say that a name wraps. The stale first sentence of the same docstring was left as it is (below).
5. **The route map's four lines are in the commit**: `generate:docs` regenerated them, and the plan commits what it regenerates.
6. **`nomination-details-removed` removes both of the party's cards**, where the plan's row says "the same card after Remove". With no nomination left the button reads Save and Return, which is the label the UI contract's row names for this entry; one removed card beside a kept one is `nomination-details-has-candidates`.
7. **`nomination-details-invalid` is reached with the open election alone**, so that the name field is the first and only control in error and has focus, as the contract's row says.
8. **Every phone, `keys:` and `focus:` test carries the tag `@nomination-definition`**, as the spec's other tests do. The scans cannot: `declareScans` takes no tag.
9. **`restoreAfterScan` also puts the entity's answers back** to nothing answered, since two entries set them.

## How the plan's truths stand

**Built and observed in a browser**: the eight entries the plan names and five more, in both themes, zero violations, each with its reach proof attached, the raw-key gate passing on each; the election step, the constituency step, the details step with new, kept and removed cards, and the view with Edit and with "Define your nomination", no wider than the viewport at 320 and 390 px in English; each option row, the name field, the symbol field, Remove and Keep inside their card; a long party name shown whole; a long election name wrapped, inside the viewport, with its checkbox in reach; sixty characters typed into the symbol and a hundred and twenty into the name held as fifty and a hundred, stored whole, and shown whole on the view inside the card; focus on the heading of each step after the navigation that opens it, after the skip past the constituency step, and on the view's heading after Cancel; the parent group as one tab stop in both directions with nothing chosen and with "Other" chosen, the arrow keys moving and choosing, and "Other" chosen by arrow with focus still on its radio and the name field the next stop.

**Held by the tests of earlier plans, as the plan says**: the replacing button after Remove and Keep (177-17), the first control in error after a failed check (177-15), the main button after a refused save (177-18). The scan reaches of this plan read the last two again.

**Not established**: the backstop row — a person with a keyboard and a screen reader.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: the gate reaches every state a step reaches, and the one defect is fixed and held by a test that was red before. |
| OWASP top 10 | T-177-91: every reach ends on a read of its own state; the planted runs show each scan reads the page it names. T-177-92: `afterEach` in each scan describe and `finally` in each test that flips; every project of the closing run at its count. T-177-93: one class; a full run of the uncommitted tree with every voter spec at its count. T-177-94: the thirteen names are in the spec and the twenty-six scans are an expected count of the corrected verdict. |
| Code style guide; no `any` | Followed; none. |
| No repeated code | The spec repeats its state steps per test by the suite's rule; walks and restores shared by four module-level helpers. The comment on the label is the terms-of-use label's sentence for another label — two labels, one sentence each. |
| New entities documented | TSDoc on the fixture's new steps and types and on every new constant and helper of the spec; the fixture's and the spec's headers list what they now hold; the selector's docstring. |
| Repo documentation updated | The generated component page and route map. Hand-written docs: none touched; see *Sentences the work made false*. |
| Tracking events | None added. |
| Svelte component guidelines | No component created. The selector keeps `concatClass` on its root; its label's class string is static. |
| Errors handled | Nothing raises. |
| Failing checks | The first control's six timeouts (*Deviations*, 2). |
| Parts sharing dependencies not unduly affected | The selector is rendered by the voter's election page and the pre-registration page: the pre-commit run was a full default run, 444 of 444. |
| WCAG A and AA; keyboard and screen reader | 1.4.10 (reflow) for the election step is what the fix restores; thirteen states scanned in two themes. No screen reader was run and no person walked the editor by keyboard. |
| Developers' and Publishers' Guides | Generated pages only; 177-21. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before both commits, read from its exit file; no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | Two commits: the fixture's steps, then the one. |
| Formatting changes apart | None. |
| `[db]` | No schema, migration or type change. |

## The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. docstring, type file, barrel | No component added, removed, renamed or moved. The selector has all three; its docstring gained two sentences. |
| 2. `generate:docs` | Run, exit 0; its diff read before it was committed: the selector's two sentences, and the route map's four lines. |
| 3. `validate:links` | 0, as the gate row `docs-links`. |
| 4. the skill itself | Read whole. Nothing is made false. Convention 6's sentence on labels names `Input` alone; the selector and the terms-of-use form are two more users that now wrap — a candidate addition, reported and not made. `context-reactivity.md` was not read: the change reads no context. |
| 5. drift and link audits | `audit-skill-links.sh components` exit 0 (30 checked, 0 dangling). `audit-skill-drift.sh` exit 1, as it does whenever a component changed since the skill was last touched: components — 8 commits, 9 files since 2026-10-09, this plan's one file among them. |

## Prohibitions

- **PROH-177-57** (no scan against a loading frame or another state): each reach ends on a fixture step that reads the state; the anchors are elements the loaded state alone renders. In `177-20-planted-p1` every scan failed on a paragraph planted on its own page. Judgment.
- **PROH-177-58** (no gate of the spec's own; no entry dropped, narrowed or excluded): the scan-wiring gate and Task 1's verify stage; no exclusion exists in the spec. Explicit.
- **PROH-177-59** (the four components untouched; the selector changed by its label's wrapping alone): Task 2's verify stage; the selector's diff is one class, one comment and two docstring sentences. Explicit.
- **PROH-177-60** (a flip restored before the next test reads it; a full page load after a flip): `afterEach` and `finally`; every later project of the closing run at its count. Judgment.

## Threat Flags

None. No endpoint, load, query or schema was touched.

## Sentences the work made false, reported and not edited

- `ElectionSelector.svelte`, `@component` docstring, first sentence: "Display constituency selection inputs for elections." — it displays the elections to select. Stale before this plan; in the generated page too.
- `177-20-PLAN.md`: "eight scan entries", "sixteen scans", "fourteen phone-width tests", "thirty-two"; `files_modified` lacks the two generated pages; ruling 1's "two outcomes, both stated, and no other".
- `177-UI-SPEC.md`: § *Axe Scan Entries* — "Eight new entries, sixteen scans"; § *Every new state, and where it is scanned* — the rows for J6, a card with a requested parent and the message region with `changed` and `hasCandidates` say "—"; § *Component Inventory* — "`ElectionSelector` … Changed only if `[U-30]` finds its label cannot wrap": it did. § *What reading could not establish*: N-1, N-5 and N-6 are measured.
- `177-RESEARCH.md`: N-5 and N-6 "open"; N-1 as read and not run.
- `177-DISPATCH.md`, *After 177-19*: "`perm-contestant-nominations` holds 47 tests" — 97; "the predecessor full run is … `177-19-close`" — `177-20-close`, 444; "In no scan and no width measurement: the answers-lock note, both no-election states, the requested-parent row, the Edit link at phone widths — and … the message region's four messages, the button's four labels and the rebuild after `changed`" — now only two of the four messages and the rebuild.
- `177-19-SUMMARY.md` and `177-18-SUMMARY.md`, their sections for 177-20: the same list.
- `.planning/todos/pending/2026-10-07-174.1-daisyui-label-nowrap-…md`: the selector's row.
- `.claude/skills/components/SKILL.md`, convention 6: not false; it names one label user that wraps where there are now three.
- The nominations project's test count and the suite's total wherever they are stated.

## What should go into the files I did not edit

- **`STATE.md`**: plan 177-20 complete at `2f32e988c`; the decisions of the frontmatter; the predecessor full run is `177-20-close` (444 of 444, 116 projects); frontend unit 4228 passed, 30 skipped (unchanged).
- **`ROADMAP.md`**: Phase 177, 20 of 21 plans done.
- **`REQUIREMENTS.md`**: NOM-03, NOM-04 and NOM-06 are the plan's requirements; this plan adds their accessibility and phone-width evidence and builds none of their behaviour. Whether to tick them now or at 177-21 is the orchestrator's.
- **`177-DISPATCH.md`**, a section *After 177-20*: the corrections above; the phone tests of a later step load that step's address; a planted run must key a plant on the view to this dataset; `parentTabStops`, `keySymbol`, `keyOtherName`, `parentNameBoxOf`, `electionLabelBoxOf` and `boxesOf`'s `keep` exist; axe evaluates contrast inside the hidden card.
- **`177-21-INPUTS.md`**: the items of *For plan 177-21*.
- **The operator's decisions document**: the voter-side reach of the defect; the two ruled items this plan closes by measurement (U-26 with five entries more than its ★, U-27, U-30 (a)).

## Not done, or not observed

- **A person's keyboard walk, a screen reader, WebKit**: none. The suite has no WebKit project.
- **The six other locales at any phone width.**
- **The voter's election page and the pre-registration page with a long election name**: the fix is in the component they render; neither was opened with such a name.
- **The visual project**: not in a default run.
- **States in no scan and no width measurement**: the *italic* rows of the table above.
- **Assertions not seen red**: in `focus:`, the headings of the election step and the constituency step, the view's heading after Cancel, and the whole second walk — the planted run failed at the details step's heading, the first time that step is asked; in `keys:`, everything after the first tab-stop expectation (the arrow expectations are `parentByKeyboard`'s, red under the same plant in the existing test of 177-17); in the test of the limits, what follows the two field reads — the boxes at the limits, the stored nominations and the view; the election step's check that an election can be checked, as an expectation (in the first control the same press timed out in six tests); in each phone test, the page-width steps after its first; `expectInside` for the long party name and `expectShowsWholeText` for the election's label, each second after an assertion that failed first; the option rows and the symbol field of a **new** card and of a **party's** kept card (the rows and the symbol field were seen outside a candidate's kept card). The view's `expectCardValuesInsideCard` is an existing step and was not planted.
- **Each scan's own distinctive part red**: a scan was seen red on a paragraph of its page, and twelve on a name inside their cards — not on the note, the message region or the removed line each is named for.
- **The timeout of the limits test under the first plant set**: not diagnosed.
- **`177-20-control`'s six timeouts were not re-provoked one by one**: their cause is read from each failure's own call log (*element is outside of the viewport*, on a checkbox of the election step) and from the fact that none recurred once the tests stopped walking through that step and, later, once the label wrapped.
- **`gsd_run windows append` was not run, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated**, as the dispatch rules.

## The state the local stack is left in

No database gate was run and the database was not reset by this plan. It is as the closing run's teardowns left it: every `e2e-perm-` and `test-` dataset removed, both locks off, every election type restored (*inferred* from the run's green tests and teardown projects; not queried). No dev server is running: ports 5173 and 5273 have no listener (*measured*). Docker was not restarted; Docker VM 16.10 GiB free (*measured*). `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-20-control`, `177-20-control-r2`, `177-20-planted-p1`, `177-20-planted-p2`, `177-20-precommit`, `177-20-close`, with the kept copy of every uncommitted file beside each of the first five.
- `tests/e2e-runs/177-gates/177-20-close`.
- `tests/e2e-runs/177-unit/177-20-*`: the three verify scripts as written and the two corrected copies, each with log and exit; `177-20-run.sh` (one wrapper run with its records), `177-20-plant.py`, `177-20-restore.sh`, `177-20-reds.mjs`, `177-20-t2-gates.sh`, `177-20-commit-1.sh`, `177-20-commit-2.sh`; for each run its launch log and exit, its start and end, the Docker VM's free space and the power source before it; `177-20-planted-p1.reds.txt` and `-p2.reds.txt`; `177-20-planted-p<N>.kept/` with a manifest; `177-20-held-files.tsv`; the checks of the uncommitted tree, twice (`-t2-` and `-t2-r2-`); the skill audits.

## Self-Check: PASSED

The two commits are ancestors of `HEAD`; the five modified files exist; the six E2E run directories and the gate directory exist with their `ended` or `done` markers; the spec holds thirteen scan entries and the selector the class.

# Phase 177 — the orchestrator's standing dispatch rules

Every executor of plans 177-01 to 177-21 reads this file whole, beside its own `177-NN-PLAN.md` and
`177-EXECUTION-RULES.md`. Where this file and a plan disagree, stop and report.

## The checkout

- Working tree: `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, a linked git
  worktree on branch `feat/entity-signup-multi-grant`. Run every command from it; never `cd` to
  another checkout. Each plan is alone in its wave. Another agent may be writing Phase 178's planning files under `.planning/phases/178-sign-in-email-code-registration/` at the same time: leave them alone, and never stage them.
- Commit by pathspec only, from a bash script or with quoted paths:
  `git add <paths> && git commit -m "…" -- <paths>`. An unquoted pathspec variable does not
  word-split in zsh, the host shell. Never `git add -A`, `git add .`, `git commit -a` or `git stash`.
  A commit follows a gate only on that gate's exit 0 (`&&`, never `;`). On `index.lock` wait a few
  seconds and retry.
- Normal commits: hooks are disabled in this worktree by a local `core.hooksPath` override; do not
  pass `--no-verify`. Each message ends with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `CAND-APP-PLAN.md` is the operator's untracked file and stays untracked.
- Nothing under `tests/e2e-runs/` is ever deleted, your own run markers included: write to a new
  name, never `rm` a marker.
- Executors edit none of `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `CLAUDE.md`.
- Required order at the end: write `177-NN-SUMMARY.md`, commit it by pathspec, and only then send
  the final message.

## Reading — keep it inside a budget

An executor of plan 176-10 used most of its context on the reading before it had edited a file, and
handed the plan back unfinished. Read what the work needs, not everything that exists.

- **Whole:** this file, your `177-NN-PLAN.md`, and `177-EXECUTION-RULES.md`.
- **Summaries before yours: only their sections for later plans**, found by heading
  (`grep -n "^#" 177-NN-SUMMARY.md`, then read that section), plus the whole of any summary your plan
  names as a dependency in `depends_on` or that a dispatch names. Do not read the other summaries
  whole.
- **`177-CONTEXT.md`, `177-UI-SPEC.md`, `177-RESEARCH.md`, `177-PATTERNS.md`, `177-VALIDATION.md`:
  only the decisions, sections and rows your plan cites**, found by their ids or headings with
  `grep -n`. Never read these files whole; each is 900 to 1,300 lines.
- `177-BASELINE-FACTS.md` (written by plan 177-01), section "Operator rulings as read". The operator's
  round for this phase is section G of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, named by
  `177-OPERATOR-ROUND`; G17 and G18 are answered (a), G1 to G16 are untouched and stand at their ★.
- `CLAUDE.md` is already in your instructions. Read `.agents/code-review-checklist.md` when you reach
  the plan's checklist step, and a project skill's file (`components` with `context-reactivity.md`,
  `database`, `data`) only when your files fall under it.
- Source and test files: read the ones you change and the ones your plan's `<read_first>` names. For
  a large spec, read the tests you touch, found by title with `grep -n`, not the whole file.
- Before writing a spec step that depends on seeded data, read the part of the dataset's template
  that seeds it and name the field the step reads.
- **The "CONTEXT WARNING: Usage at NN%" hook line is not about you.** It is printed after tool
  calls from a file keyed by the orchestrator's session and reports the orchestrator's context, not
  yours; it does not move with your reading. Two executors of this phase read it as their own and
  handed a plan back with nothing done. Ignore it. Judge your room by what you have actually read
  and written: the reading above, kept to its budget, leaves ample room for a three-task plan. Hand
  back early only if you are truly running out — the model's own truncation warnings, not that hook
  — and then at a clean boundary, as "Stopping" below says.

## Tests and evidence

- Tests first, red before the change, where the plan lays that out. A red report counts when every
  failure is an expectation, not an import, compile or timeout failure.
- **No commit turns a committed E2E test red.** A browser-observable change is held in the working
  tree through a green run of the uncommitted tree, then committed together with the fixtures and
  specs that match it. A red control runs on an uncommitted tree directly through
  `tests/scripts/e2e-run.sh`, is judged by `177-verdict.mjs control … --red`, and counts only when
  exactly the named tests are red, each for its expectation. If interrupted, apply the plan's resume
  rule (`git checkout --` on the named files only) so that the tree left is clean and the committed
  suite green.
- **The E2E hard rule is cardinal.** A failed, flaky or did-not-run test in a full run is a failure
  to diagnose at its root cause and fix: never retried until green, never skipped, never annotated.
  An intermittent failure is a real defect in the test or the code. Exit status 8 with
  `VOID-host-suspend.txt` is the only void: keep the directory and run again under a new label. A
  red run on a test nothing in the plan can have touched: check `pmset -g log` for Sleep and
  DarkWake entries in the window before concluding anything, and report what was found either way.
- An axe finding or a width overflow on a surface this phase builds is a defect in the surface. Fix
  the surface; never exclude a rule, drop a scan or loosen a tolerance. A finding on a surface the
  phase did not change is reported with its evidence, not fixed.
- Every E2E run goes through the drivers and the wrapper, which start their own fresh server. Do
  not start a dev server, and do not trust a result from a server that was running while files were
  edited.
- The plan's acceptance criteria and verify commands are the contract. Populations are derived at
  run time. Code is never bent to a search, and a check is never edited to pass. Write each
  `<automated>` block to a script file taken byte for byte from the plan and run it with `bash`; a
  script that holds a long gate is launched in the background and polled. When a verify stage has a
  real defect, run its intent by a correct command of your own, record both exit statuses, and
  report it.
- Every exit status is read from the command itself, never through a pipe.
  `~/.nvm/versions/node/v24.21.0/bin` goes first on `PATH`. A secret-read hook blocks commands that
  name `.env`; do not work around it.
- `yarn assert:comment-hygiene` runs on the working tree, with new files staged, before every commit
  that touches a comment. Comments and test titles describe the code as it is: no history, and no
  decision, plan, proposal or assumption ids. Exported symbols and props get TSDoc. No page, layout
  or menu branches on the entity's type; per-type differences live in the descriptor.

## The stack and the host

- `yarn db:reset` runs only through the gate driver or the determinism batch, each after its
  in-flight check. Never restart Docker or the Supabase stack: this host runs a second, unrelated
  Supabase stack.
- **A refused disk guard stops the plan.** The drivers refuse below 13.8 GiB free in the Docker VM.
  Their own `docker builder prune -af` is the only remedy. Do not remove images, volumes or files,
  and do not restart anything: stop at a clean boundary and report the reading. Read and record the
  free space before each long run.
- Before any E2E run or long gate, `pmset -g batt`: no run is started on battery below 30%.
- pgTAP runs only through the gate driver, which resets first. On a database a full E2E run has
  touched, `39-invitations.test.sql` test 238 is red (it counts `private.invitation_link_witness`
  whole, and no teardown removes those rows). Met anywhere else, that is the known finding, not a
  regression.

## Stopping

On a real blocker, or when context is running short before the plan is finished, stop at a clean
commit boundary — clean tree, committed suite green — and report exactly what is done, what is not,
the task and step reached, and the state of the tree and the database. A clean partial hand-back is
better than a truncated one.

## The final message

Tasks done with their commits; each verify's exit status; the control and green-proof verdicts where
the plan has them; the gate rows; each full run's totals, its per-project comparison with its
predecessor and the Docker VM's free space before it; any void or red run and its cause; every axe
finding or overflow and what was done; deviations; anything not done or not verified; the database's
state; and `git status --short`.

## What changed on the tree after the plans were written (2026-10-11)

- **The baseline.** The quick task `261010-f1-b2-operator-replies` closed on
  `tests/e2e-runs/176-e2e/261010-f1-b2-final`. Two commits then changed the tree outside `.planning/`:
  `1f765a6db` (the E2E wrapper holds a sleep assertion for the life of a run) and `ae55fb89b` (a
  sentence of `tests/README.md`). The complete green unloaded full run of the tree as it now stands is
  `tests/e2e-runs/176-e2e/261011-vj-final` (341 passed, 0 failed, 0 flaky, 0 did not run, 113 projects;
  recorded in `.planning/debug/voter-journey-category-intro.md`). Plan 177-01 judges a candidate
  baseline by the directory itself, as it says; when its own conditions hold for `261011-vj-final`,
  that run is the baseline, and otherwise 177-01 makes one with its new driver, as its Task 1 step 3
  lays out.
- **The wrapper's sleep assertion.** `tests/scripts/e2e-run.sh` now starts `caffeinate -dimsu` for
  its own lifetime and records `sleep_assertion=` in `env-posture.txt`. A run no longer needs to be
  launched under `caffeinate`. A closed lid still forces a sleep that the heartbeat may not see: a red
  run whose page console holds `[vite] server connection lost` and whose window holds a Sleep or
  DarkWake entry in `pmset -g log` is that mechanism — report it with both pieces of evidence, keep
  the directory, and make the run again under a new label; do not diagnose the failing test.
- **The sign-in helper's wait** in `tests/tests/setup/shared/registerAndStoreSession.ts` is the
  default five seconds (operator decision F1 (b); not reproduced under load in twelve loaded runs). A
  run red at that wait is to be reported with its trace kept, not fixed by raising it.
- **Two holes the planning left, already closed:** 177-15's ruling 7 now names 177-17 as the owner of
  the prefill from existing rows and of the "kept" section; and the commit trailer above is the one
  to use.

## Defects of the plans' own verify commands, met in plans 01 to 10

A verify is the contract, and it is never edited to pass nor the code bent to it. But four of its
stages have been wrong in the same ways. When you meet one of these, run the stage as written, record
its status, run its intent by the corrected form below, record that status too, and report both.

- **`177-verdict.mjs control … --dirty-only <several paths>`** is refused with `unexpected argument`
  (status 2): the script takes one path per `--dirty-only`. Write `--dirty-only a --dirty-only b …`.
  The same form stands in the steps of several later plans.
- **A count of a test's title in single quotes** misses a title that holds an apostrophe, which
  Prettier writes in double quotes. Accept either quote.
- **A search of SQL for a message with one apostrophe** misses the literal, which doubles it.
- **A search of a vitest log for a passed test's title**: the default reporter prints none. Read the
  row's JSON report.

## The order of the permutation chain's clears (found in 177-10)

A dataset's teardown is not the first prefix delete to meet its rows: the next link's setup clears
`e2e-perm-` before it seeds, and runs before the teardown. A nomination the application wrote (it has
no external id) that still stands under a seeded nomination when a spec ends refuses that setup's
delete. So **every spec that saves nominations through the editor ends with a file-level `afterAll`
calling `clearWrittenNominations()`**, as `contestant-nominations.spec.ts` does since 177-10 — the
teardown's call alone is not enough. This holds for the specs of plans 177-15 to 177-20 and for the
contestant describe of `perm-startfromcg.spec.ts` (177-16).

## What the editor's fixture expects of the screens (found in 177-11; for plans 177-15 to 177-20)

- **Hydration on the election and constituency steps.** The details step's interacting steps wait for
  `data-editor-state="ready"`. The UI contract gives the two selection steps no client-only state
  attribute, so a press of Continue, a picker or Cancel made before hydration would be lost and end in
  a timeout. If the server renders `<Loading />` in the selector's place, the selector's presence is
  the marker; if it renders the selector, the step needs a state attribute set on mount and the
  fixture a wait for it. The plan that builds each step settles this and says which.
- **"Absent" is asserted as a count of zero**, never as hidden: a note, hint or field that is not
  shown is not rendered.
- **A `Button` with an `href` renders `<a role="button">`**, so the fixture asserts Edit, Cancel and
  "Change the selection" as anchors, not by the link role.
- The fixture bundles create the editor's fixture through a getter on first read, because creating
  it registers a dialog listener; keep that form.

## The editor's pure modules as built (177-14; for plans 177-15 to 177-19)

Four signatures differ from the sketches in the later plans. The code is the truth; where a plan names
the sketched form, use the built one and say so in the summary — it is not a disagreement to stop on.

- `buildCards({ entityType, nominations, chosen, elections })` — takes the entity's type.
- `parentChoicesOf({ card, listed, locale })` — no `allowed` argument: the rule is on the card as
  `parentRule`, built from `allowedParentTypes`.
- `validateCards(cards, choices)` — `choices` is a `ReadonlyMap` by card key.
- `desiredSetOf(cards)` — throws for a card with a parent group and nothing chosen, and for a blank
  typed name: call it only after `validateCards` answered nothing.

`177-14-SUMMARY.md` § "For plans 177-15 and 177-17" holds a worked snippet: `card.parentChoice` already
holds the choice on arrival (`bind:selected={card.parentChoice}`); an entity option's and the unlisted
option's `value` is the entity's id; the hint and the unlisted option's name are the page's to word; no
group is rendered where `choices.options` is empty. An unchanged stored parent is sent as `keep`.

**`EntitySelector`'s pointer fix is unobserved on the built component.** The UI contract's S7 markup
let the card's own `article` take the press, so a click on a party's name left the radio unchecked; the
hidden wrapper now carries `pointer-events-none` (observed on the bare structure in Chromium only). The
first test that presses a party's row in a browser is where it is seen: if the press does not choose
the option, that is this defect, in the component, and is fixed there.

**Chain a commit on a gate's value, not on the existence of its exit file** (`test "$(cat f)" = 0 &&`):
177-14 committed with the type check red for that reason.

## After the tracer (177-15; for plans 177-16 to 177-20)

- **A fifth defect of the plans' verify commands.** The wrapper records a new untracked directory as
  one line (`?? …/(edit)/`), so `177-verdict.mjs control … --dirty-only <a file under it>` is refused
  (exit 1). Name the directory, or `git add` the new files before the pre-commit run. And two `grep`
  stages that look for `electionsStepOutcome` / `constituenciesStepOutcome` in a step's load pass on a
  docstring: the loads reach those functions through the helper `(edit)/stepSelection.ts`.
- **Hydration is settled:** the server renders `<Loading />` in the selector's place on the election
  and constituency steps, so the selector's presence is the marker. No state attribute, no fixture
  wait. A step you build that renders its control on the server needs its own marker.
- **`EntitySelector`'s pointer fix is observed** in Chromium: a press on a party's row chooses it.
- **The guard's tracer condition** is the third disjunct of the one `if` in `(edit)/+layout.ts`, item 5
  of its docstring, and `TURNED_AWAY[2]` in `layout.tracking.test.ts`; plan 177-17 removes all three.
  Until then, after a stored save the user passes through the nominations view before the next task
  (`invalidateAll()` reruns the guard, which now finds a nomination in reach) — inferred, not observed —
  so research assumption A4 (the page stays mounted through the rerun) does not hold before 177-17.
- **A3 is observed:** one `tick()` after `invalidateAll()` sufficed; the handler landed on the profile.
- **The details page's options and cards are keyed on the contests**, so a rerun for the same contests
  rebuilds nothing. That keeps the draft after a failed save; plan 177-18 clears `builtFor` itself to
  show stored state after a refusal.
- **The nominations view lists rows the application wrote in the order of their generated ids.** A test
  that saves two new rows names its cards with `expectCardOf` (by election), never by index.
- Modules beyond the plans' file lists now on the tree: `nominations/nominationFacts.ts` and
  `(edit)/stepSelection.ts`. `Input`'s prop type refuses `maxlength`; the two limits are passed through
  a spread and `Input` is unchanged.
- **The lid.** During 177-15 the host's lid was closed: `pmset -g log` shows `Entering DarkWake state
  due to 'Clamshell Sleep'` inside every run's window, the heartbeat saw no gap (106 ms at worst), no
  run has the void marker, and every run was green. A green run with no marker stands. A RED run in
  such a window whose page console holds `[vite] server connection lost` is the host's: report both
  pieces of evidence, keep the directory, and make the run again under a new label. A red run without
  that console line is a failure to diagnose, whatever the power log says.
- Read a gate's status from its exit file's value, never from piped output: 177-15's first commit
  followed a comment-hygiene run read through a pipe.

## After 177-16 (for plans 177-17 to 177-20)

- **A control whose red test sits in an upstream link of the chain cannot be judged in one run.** The
  links are serial: a red test in `perm-startfromcg` (46 projects behind it) or in `perm-no-nomination`
  (directly upstream of `perm-contestant-nominations`) leaves everything downstream "did not run", and
  `177-verdict.mjs control … --red` counts those and fails. Judge such a control in two runs, as 177-16
  did: (1) the control as the plan writes it — exactly the named tests red, each on its expectation,
  and every did-not-run in a project downstream of the red one's project (177-16's script
  `tests/e2e-runs/177-unit/177-16-control-cascade-check.mjs` checks this; reuse it); (2) a complement
  on the same tree with the red tests held out and restored byte-equal afterwards — green, judged with
  `--green`. The complement is not a retry. Plan 177-19 writes in both `perm-no-nomination.spec.ts` and
  `contestant-nominations.spec.ts` and will meet this.
- **A sixth defect of the plans' verify commands:** a count of tests by `^\s*test\(` misses tests
  declared through an alias (`contestantTest(` in `perm-startfromcg.spec.ts`). Count the alias too.
- **`constituenciesStoodFor`** (`(edit)/stepSelection.ts`) resolves the picked constituency to the one
  each admissible election is held in: under "start from the constituency" with one admissible
  election, an election held by region is held in no municipality, and the shared selector passes the
  picked constituency on as it is. `afterConstituencies` and the constituency page's sentence use it;
  the shared `ConstituencySelector` is unchanged. For 177-17's prefill: the UI contract's
  `useSingleGroup` prefill rule preselects nothing in a picker over a group that does not hold the
  existing constituency.
- The constituency step's "no election here" sentence carries `role="status"` (beyond the contract's
  markup; Continue, which it explains, is disabled and takes no focus then). The election step's hint
  has the same shape and no role. Recorded for the operator; do not change either.
- New on the tree: `tests/tests/data/permStartFromCgData.ts`, the composition root
  `fixtures/contestant/perm-startfromcg.ts`, and the steps `expectGroupPicker`, `expectNoTextOnPage`
  (editor's fixture) and `setElectionSelectionDisallowed` (nominations root).

## After 177-17 (for plans 177-18 to 177-20)

- **The schema block was reopened once, by a defect.** `set_entity_nominations` now states `confirmed`
  beside the custom data in its four `UPDATE`s (`confirmed AND NOT (target custom data has the requested
  name)`): it can keep the stored value or turn it off, never on. The trigger
  `enforce_nomination_confirmation` is unchanged. pgTAP: `Files=44, Tests=2312`. A database gate needs a
  clean tree; 177-17 held its files beside the run, byte-compared, and restored them — do the same and
  keep the manifest.
- **The details page as built** (`(edit)/details/+page.svelte`): `handleSubmit` runs validate → the
  nothing-to-write branch → the one `setEntityNominations` call → `invalidateAll()` → on `saved`, one
  `tick()` and `goto(nominationsSaveTarget(…))`. `builtOn` names the nominations the cards were built
  on; `builtFor` is a plain variable, cleared before `invalidateAll()` to rebuild the cards.
- **Orchestrator's ruling for item P-17 in 177-18.** Read from the code by 177-17, not provoked: a
  stored save that removes one of two nominations in an election with several constituencies makes the
  details load's rerun forward to the constituency step before the handler navigates on. So the check
  "is the details page still shown" would strand the user inside the editor. Decide instead by where
  the re-read left the user: navigate on to the save target unless the current address is outside the
  editor's `(edit)` addresses (the guard took the user to the nominations view). Write a test that
  provokes the forward case first and see it red; if the forward does not happen in a browser, say so
  and keep the test as a guard.
- `startingSelectionOf` returns `Array<{ electionId, constituencyId? }>`; `constituencyChoiceOf`
  returns `{ toChoose, kept }`. The election step's Continue carries no stored constituency in the
  address; the constituency step's load selects the stored one per election.
- A verify stage that searches the loads for `startingSelectionOf` / `constituencyChoiceOf` passes on
  docstrings; the calls are in `(edit)/stepSelection.ts`.
- `perm-contestant-nominations` holds 24 tests; the predecessor full run is
  `tests/e2e-runs/177-e2e/177-17-close` (371 of 371, 116 projects).
- An assertion around a helper that swallows exceptions passes vacuously (177-17's first red pgTAP
  commit): see a red-first assertion fail on its own expectation before believing it.

## After 177-18 (for plans 177-19 and 177-20)

- **Corrections to sentences above:** `perm-contestant-nominations` holds 32 tests; Cancel on the details
  step is a `<button>` with a handler (press it by test id, assert no tag); `builtFor` is no longer
  cleared by hand — the build effect and the handler both call `buildCardsAnew()`.
- Predecessor full run: `tests/e2e-runs/177-e2e/177-18-close` (379 of 379, 116 projects). Frontend unit:
  4181 passed, 30 skipped.
- **The details page as built:** the label is `nominationsSaveAction(contestantCtx.taskState,
  draftFactsOf(cards, builtOn.length > 0))`; the page never calls `taskStateOf`. After a stored save it
  navigates on only while `page.route.id` is under `CONTESTANT_NOMINATION_EDITOR` (seen red against the
  plan's literal check: the user was left on the constituency step). After a save that was not stored:
  nothing if unmounted; otherwise `changed`, `hasCandidates`, `tooManyPending`, `failed`, focus on the
  main button. The leave bypass is set before the write.
- The nominations view shows its note under the nominations lock only. When 177-19 adds the reason
  `nominationsAnswersLocked`, the test `closing:` is where to assert it.
- A test that leaves the details step by a full page load with a draft meets the browser's
  `beforeunload` prompt; none does today.
- `refused: a nomination with candidates…` sets its own state first and depends on no earlier test.
- `177-verdict.mjs control … --green --were-red-in` expects a one-project invocation; a full pre-commit
  run is judged through the task's verify instead.
- A plan's count of tests is not bent to: when a ruling adds a test, the verify as written exits 1 at
  the count, and the corrected copy states the new count.
- For 177-20's scans: the message region with each of its four messages, the button's four labels, and
  the details step during the rebuild after `changed` (loading indicator in the cards' place, button
  disabled) are in no scan.

## After 177-19 (for plans 177-20 and 177-21)

- **Corrections to sentences above:** `perm-contestant-nominations` holds 47 tests; the predecessor full
  run is `tests/e2e-runs/177-e2e/177-19-close` (394 of 394, 116 projects); frontend unit 4228 passed,
  30 skipped; the nominations view shows its note under either lock (reasons `nominationsLocked` and
  `nominationsAnswersLocked`). 177-19's control was one run: only the downstream spec was uncommitted.
- `nominationsEditable` is optional in `TaskStateInput` (the profile and question pages build a
  prospective state and may not write the condition out); left out it reads as not editable, so the
  task leads to the view. Accepted by the orchestrator; put to the operator.
- The nominations view takes whether an entry is offered from `data.nominationFacts` and the note's
  reason from the context's two locks. Markers: `data-nominations-editable` on the container;
  `data-empty` on the empty sentence, absent where the data holds no facts.
- **Steps that reach each state** are tabled in `177-19-SUMMARY.md` § "For plan 177-20". Scanned in both
  themes already: listed with Edit (`cand-nominations`), empty with an entry
  (`no-nomination-nominations-empty`, also measured at 320 and 390 px). In no scan and no width
  measurement: the answers-lock note, both no-election states, the requested-parent row, the Edit link
  at phone widths — and, from 177-18, the message region's four messages, the button's four labels and
  the rebuild after `changed`.
- A test that ends on the details step with a new card must not then navigate by a full page load
  (`beforeunload`). Four tests of `perm-no-nomination.spec.ts` end there.
- A helper with a default parameter turns a passed `undefined` into the default: pass `null` for "none".
- A red-first commit against a member that does not exist cannot type-check alone; say so in the
  summary and let the gate rows run on the commit that adds it.

## After 177-20 (for plan 177-21)

- **Corrections to sentences above:** `perm-contestant-nominations` holds 97 tests; the predecessor full
  run is `tests/e2e-runs/177-e2e/177-20-close` (444 of 444, 116 projects); the list of states in no
  scan is replaced by the state table in `177-20-SUMMARY.md`.
- `ElectionSelector.svelte`'s option label carries `whitespace-normal`: with a long election name the
  election step was 177 px too wide at 320 px and its checkboxes lay beyond the left edge. The
  component is shared with the voter's election page and the pre-registration page; neither was opened
  with a long name.
- A phone test of a later step loads that step's own address (`openStep`). A plant on the nominations
  view must be keyed to this dataset, because other specs scan and measure the view upstream. axe
  evaluates contrast inside the option row's hidden card.
- `generate:docs` regenerated the route map (four lines for the editor's `(edit)/` directories, stale
  since 177-15); no gate holds the route map current.
- Gate rows now include `docs-links` (seven rows).

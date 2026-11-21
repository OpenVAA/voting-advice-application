# Phase 176 — Execution Rules

> Read once by every executor of a Phase 176 plan, before its first task. Each plan names this file in its
> `<context>`. A plan's own blocks add to these rules and never relax them. Where a plan and this file
> disagree, stop and report.

## When this phase runs

Phase 176 executes only after Phase 175 is closed and verified. Plan 176-01 checks that and stops with a
report when it is not so. Everything Phase 175's plans 11 to 13 add — the preview as plan 11 leaves it,
`tests/tests/utils/contestantAxeScan.ts`, `tests/tests/fixtures/shared/pageGeometry.fixture.ts`, the closing
run — was not on the tree when these plans were written (planned at head `645a7a81e`, 2026-10-08, with
175-01 to 175-10 committed). An anchor that rests on one of them is marked **expected from 175-NN** where it
is used, and the task that first depends on it reads the tree and stops with a report when the tree differs.
When the plans were revised on 2026-10-09 (`f5f0dc154`), plans 11 and 12 had landed and plan 13's closing
run had not.

Plan 176-01 also reads the operator's decision document,
`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, and records in `176-BASELINE-FACTS.md` the outcome of
every item under its sections C and D — among them the three departures from locked text (U-01, U-02,
U-08) and the order of the plans, which departs from D-21 and does not amend it. None had been ruled on
when the plans were written. **The document is read by one command with a fixed rule, never by an
executor's judgment:** no box ticked and no NOTE text means the recommended option; exactly one box ticked
and no NOTE text means that option, which a plan builds only where it states the fallback itself (C1 and
C2 in 176-03, C3 in 176-12); any NOTE text, more than one tick, stray text, or a tick no plan states a
fallback for halts the phase at 176-01 with the item quoted verbatim and nothing built. No executor of any
plan interprets a NOTE or chooses an option. A plan that owns an item reads the record before it builds.

## Names

| Name | Value |
|---|---|
| `P` | `.planning/phases/176-contestant-home-task-state-nominations-view` |
| `P175` | `.planning/phases/175-organization-editing-profile-questions-preview` |
| `F` | `apps/frontend/src` |
| `ENTITY` | `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]` |
| `GATED` | `$ENTITY/(nominated)` — exists from plan 176-08 on; before it the three pages are directly under `$ENTITY` |
| `T` | `tests/tests` |
| `SPEC` | `tests/tests/specs/perm/perm-no-nomination.spec.ts` — exists from plan 176-07 on |
| `JOURNEY` | `tests/tests/specs/contestant/contestant-journey.spec.ts` |
| `R` | `tests/e2e-runs/176-e2e` (gitignored) |
| `U` | `tests/e2e-runs/176-unit` (gitignored) |
| `BASE` | the one line of `$P/176-BASE`: the last commit that changed a file outside `.planning/` before the phase |
| `BASELINE` | the one line of `$P/176-BASELINE`: the directory of the full E2E run every comparison starts from |

Both files are written and committed by plan 176-01 from the tree as it stands then. No plan states a
count, a head or a run directory of today: each is read from those two files, from a run's own records or
from a command.

## The shell

- Begin every shell call that runs `yarn`, `npx` or `node` with
  `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.
- A status is read from the command itself, never through a pipe. A commit follows a gate with `&&`,
  never `;`.
- No gate-set run, E2E run or batch is made in the foreground: launch it in the shell tool's background
  mode as `( caffeinate -dimsu <command>; echo $? > <marker>.exit ) > <marker>.log 2>&1` and poll with one
  short foreground command per poll (a bounded loop of at most 45 one-second waits that ends when the
  `.exit` marker exists). Ceilings: 20 minutes for one run or one gate set.
- Before a long run: `pmset -g batt`. No run is started on battery below 30 %.

## Commits

- Each commit holds the executor's own files only, named by pathspec: `git commit -m "…" -- <paths>`; a new
  file is added by explicit path first. Never `git add -A`, never `git stash`. `CAND-APP-PLAN.md` is never
  staged. On `index.lock`, wait a few seconds and try again.
- A commit that changes `apps/supabase/supabase/schema/`, the migration or the generated database types
  carries `[db]` in its subject.
- `yarn assert:comment-hygiene` runs on the working tree before every commit that adds or changes a
  comment under `apps/`, `packages/` or `tests/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The executor edits none of `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
  and `CLAUDE.md`. A sentence of one of them that the work made false is reported, not edited.

## Comments and titles

A comment, a docstring and a test title describe the code as it is, to someone reading it cold: no account
of what the code used to do, no decision, plan, ruling, assumption or requirement id, nothing addressed to
a reviewer. The ids in a PLAN.md (`D-06`, `U-01`, `T-6`, `OD08-D2`) stay in the PLAN.md and the SUMMARY.md.

## Searches and checks

- Every path and symbol in a plan is a hint: resolve each by the symbol or the quoted content given,
  never by a line number. Every population of something already on the tree is a command plus the
  relation it must satisfy, and no such count written in a plan is a target. The number of tests a plan
  itself adds — three `dataset:` tests, twelve scans — is stated and pinned.
- A check that searches for a literal form of code searches for a form the plan's action prescribes. Code
  is never bent to a search; a check is never edited to pass; a correct implementation in another form is
  reported with the stage it fails and the result of the same chain with that one stage restated.
- A negative search over a directory excludes test files (`':!*.test.ts'`): a test names an old string in
  order to assert that it is absent.
- A count of lines naming a symbol is also tripped by a comment naming it: a call site is counted by a
  form a comment cannot match, or the plan says so.
- `git grep -E` on this host does not read `\b`: use `([^A-Za-z]|$)`.
- A lookup of a message key does not split the key on every dot. Each `contestantApp.*` catalogue file
  wraps its messages in one top-level key that is the file's own name without `.json` and contains a dot;
  `common.json` wraps its in `common`.
- An `<automated>` block is run from a script file taken byte for byte from the plan
  (`$U/<plan>-t<N>-verify.sh`) and run with `bash` — `bash $U/<plan>-t<N>-verify.sh` — never pasted into
  the login shell: the host's shell is zsh, which does not split an unquoted variable into words, and
  several chains pass more than one flag in one variable. Its log, exit status and head are kept beside
  it.
- An `<automated>` block that holds a long gate — `yarn db:reset`, the database tests, the SQL lint, a
  workspace's whole unit suite, svelte-check or a build — is launched in the background and polled
  exactly as a gate set is (§ *The shell*): `( caffeinate -dimsu bash <script>; echo $? > <script>.exit )
  > <script>.log 2>&1`. A block of searches and verdict readings may run in the foreground. Where a task's
  action runs such a gate itself, it runs it the same way and the block reads the result.
- A check that decides whether something may be done refuses when it cannot look: an in-flight search
  that fails, or whose errors are discarded, is not an answer of "nothing in flight".

## E2E

- **No red E2E test is ever committed.** A new test, a changed expectation of an existing spec and a
  fixture step whose signature changes stay in the working tree until a run of that uncommitted tree has
  shown them green. A new fixture step that no committed spec calls is committed first: it is no test of
  the suite.
- **No commit turns a committed E2E test red.** A change to the application that a browser can observe —
  a page, a layout, a load, a component a page renders — stays in the working tree until a run of that
  uncommitted tree has passed, and is committed together with the spec and fixture changes that depend on
  it: one commit. What may be committed before it: a unit or component test file, red and alone; a
  module that decides nothing yet; a fixture step no spec calls; a state attribute nothing reads; a
  component nothing renders. Each plan says, under *What this plan's commits do to committed specs*,
  either why its commits are additive against the committed specs or which commit is the one. A test of
  another spec that the held change turns red in the pre-commit run is settled in the same uncommitted
  set — its state or its expectation changed, or the change corrected — before anything is committed;
  it is never left for the plan's closing run to find.
- **A run of an uncommitted tree** goes directly through the wrapper, with nothing on the dev-server
  port: `tests/scripts/e2e-run.sh --run-dir $R/<label> --no-db-reset --project <name>`, then
  `node tests/scripts/e2e-evidence.mjs $R/<label>`. It is judged with
  `node $P/176-verdict.mjs control <label> --project <name> --setup <setup project> --dirty-only <path>…`
  and `--red "<title substring>"…` or `--green [--were-red-in <label>]`.
- **A negative control counts** only when exactly the named tests are red, each ended `failed` on an
  expectation — not on a timeout, not on a compile error — and every other test of the run passed. A
  named test that timed out means a fixture step waits too long: correct the step and make the control
  again under the next `-rN` suffix. A named test that is green does not see the missing surface: fix the
  test. A red test outside the named ones is a failure of the tree as it stands: stop and report.
- **Two controls where two specs change.** `contestant-journey` is a dependency of the head of the
  permutation chain, so a red journey leaves every permutation project did-not-run. A plan that adds
  tests to `$SPEC` and also changes expectations of `$JOURNEY` therefore makes the control of `$SPEC`
  first, with `$JOURNEY` unchanged (`--project perm-no-nomination`), and the control of `$JOURNEY` after
  it, with both changed (`--project contestant-journey --setup data-setup-contestant-journey`). One
  pre-commit run of `--project perm-no-nomination` then covers both, judged once with
  `--green --were-red-in <the first control>` and once with `--green --were-red-in <the second>`.
- **What a one-project run covers.** A run restricted to `perm-no-nomination` runs what
  `tests/playwright.config.ts` makes it depend on and no more: the permutation chain before it and the
  projects the chain's head names, with their setups. The chain's tail and the base leaves outside those
  dependencies are covered by a full run alone. No plan claims more for a one-project run.
- **Every plan that changes a contestant surface closes on a full default run of its own committed
  tree**: `bash $P/176-e2e.sh <plan>-close [--require-project <name>]`, judged at once with
  `node $P/176-verdict.mjs e2e <plan>-close --same-projects-as <its predecessor's label, or $(cat $P/176-BASELINE) for the first> …`.
  The chain of full runs is: `BASELINE` → `176-05-close` → `176-06-close` → … → `176-18-close` →
  `176-19-final`. Gate rows end before an E2E run starts.
- **Void** is decided by the wrapper's marker alone: status 8 with `VOID-host-suspend.txt`, or the
  determinism batch's status 6. A void run is kept and made again under the next `-rN` suffix (a verdict
  given the label reads its newest attempt). A red run without the marker is a failure. A did-not-run is a
  failure. Nothing is retried until green on an unchanged tree; no test is skipped or annotated to pass.
  Nothing under `tests/e2e-runs/` is deleted.
- `yarn db:reset` never runs while an E2E run is in flight (a `started` marker without an `ended` beside
  it at any depth under `tests/e2e-runs/`). Docker and the Supabase stack are never restarted: a second,
  unrelated stack runs on this host. A dev server is started by the wrapper and by nothing else.
- Every test of `$SPEC` begins with a state step that writes, with the service role, the state it reads.
  None relies on what a test before it left. A test that turns a project-wide setting on restores it in a
  `finally`, and the step after a flip of a setting is a full page load, said so in the step's own name
  or comment. A spec holds hard assertions only and no locator in a test body: every locator is in a
  fixture and every id comes from `tests/tests/utils/testIds.ts`.

## An interrupted cycle

From the step that writes uncommitted spec or fixture changes until the step that commits them, the
working tree holds exactly the files that plan's `<uncommitted_changes>` block names, and a copy of each
spec as a control ran it is kept beside the run (`$R/<label>.<spec file name>`). The next executor either
goes on from the working tree (or from the kept copy, copied back) or discards the change with
`git checkout -- <the named files>` and starts that task again. Never `git stash`. The gate driver and the
E2E driver refuse a tree with uncommitted changes outside `.planning/`; a plan calls neither while its
changes are uncommitted. Since the revision of 2026-10-09 the files a plan holds uncommitted include the
application files of its surface, not its specs alone: a copy of each as the pre-commit run ran it is kept
beside that run too (`$R/<label>.<file name>.kept`), so that an interrupted cycle loses nothing.

## Code rules that bind every edit

- `CLAUDE.md` § *Context Destructuring Rule*: `taskState`, `tasks`, `nextStep`, `previewOpen`,
  `nominations`, `nominationsLocked`, `questionsReady`, `answersLocked`, `selectedEntity`,
  `profileComplete`, `appSettings`, the question lists and `dataRoot` are reactive accessors — read
  `contestantCtx.X` inside the tracking scope, never destructure; `dataRoot` is never bound to a read
  alias. The first five exist from plan 176-06 on.
- `entityDescriptorOf` is the only place a difference between entity types lives: no `{#if}` and no
  ternary on the entity's type in a page, a layout or the menu.
- `CLAUDE.md` § *Results Navigation Invariants*: no element added by this phase carries a
  `view-transition-name`, and no load reads a `url` or `route` property.
- `.agents/code-review-checklist.md` is walked in every plan that adds application code, and each item's
  outcome is recorded in the summary.
- `Skill("components")` is loaded before a `.svelte` component is edited; `Skill("database")` before the
  schema is.

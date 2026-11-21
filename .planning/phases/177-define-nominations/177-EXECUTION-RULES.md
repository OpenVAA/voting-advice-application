# Phase 177 — Execution Rules

> Read once by every executor of a Phase 177 plan, before its first task. Each plan names this file in its
> `<context>`. A plan's own blocks add to these rules and never relax them. Where a plan and this file
> disagree, stop and report.

**A hook line of the form `CONTEXT WARNING NN%` in a tool's output belongs to the orchestrator. Ignore it and
keep working; it is never a reason to stop, to shorten a task or to hand a plan back unstarted.**

## When this phase runs

Phase 177 executes only after the quick task `261010-f1-b2-operator-replies` has closed with a complete, green,
unloaded full E2E run. Plan 177-01 checks that and stops with a report when it is not so. The plans were written
on 2026-10-10 at head `d228b52bc`, while that quick task was in flight: its commits (the sign-in helper's wait in
`tests/tests/setup/shared/registerAndStoreSession.ts`, the registry statement in seven catalogues) are not on the
tree the plans were read from. Every path and symbol in a plan is therefore a hint, resolved by the symbol or the
quoted content given and never by a line number.

Three orders meet in this phase and are reconciled once, here:

1. **D-26's order is kept**: schema (177-02 to 177-07), data model and adapter (177-08, 177-09), step 1, step 2,
   then the closing plan.
2. **The dataset, the fixtures and the semantic steps are built before the screens they assert** (177-10, 177-11)
   — the operator's standing instruction, accepted afterwards for Phases 175 and 176 as decisions E6 and C4 of
   2026-10-09. **This departs from D-26's letter**, which puts the E2E work in its fifth plan; D-26 is not
   amended.
3. **Tracer first, after the fixtures**: where the fixtures-first order and the tracer-first order pull apart,
   fixtures first wins. The tracer is plan 177-15 — the first plan whose result a browser can reach: one path
   through every layer, from the editor's entry address to a stored nomination and back to the next task. Plans
   177-12 to 177-14 before it add only what nothing renders yet (the copy, the shared ordering module with the
   voter's routes repointed, the selector component and the draft arithmetic).

D-26's "one migration regeneration" is read as one generated migration **file**: every commit that edits
`apps/supabase/supabase/schema/` regenerates it in the same commit, because `yarn assert:schema-migration-parity`
refuses a commit that does not. The schema plans are consecutive and nothing else regenerates between them. It is
item P-01 of the operator's round.

## Names

| Name | Value |
|---|---|
| `P` | `.planning/phases/177-define-nominations` |
| `P176` | `.planning/phases/176-contestant-home-task-state-nominations-view` |
| `S` | `apps/supabase/supabase` |
| `F` | `apps/frontend/src` |
| `ENTITY` | `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]` |
| `EDIT` | `$ENTITY/nominations/(edit)` — exists from plan 177-15 on |
| `T` | `tests/tests` |
| `SPEC` | `tests/tests/specs/perm/contestant-nominations.spec.ts` — exists from plan 177-10 on |
| `NONOM` | `tests/tests/specs/perm/perm-no-nomination.spec.ts` |
| `SFCG` | `tests/tests/specs/perm/perm-startfromcg.spec.ts` |
| `R` | `tests/e2e-runs/177-e2e` (gitignored) |
| `U` | `tests/e2e-runs/177-unit` (gitignored) |
| `BASE` | the one line of `$P/177-BASE`: the last commit that changed a file outside `.planning/` before the phase |
| `BASELINE` | the one line of `$P/177-BASELINE`: the directory of the full E2E run every comparison starts from |

Both files are written and committed by plan 177-01 from the tree as it stands then. **No plan states a count, a
head or a run directory of the planning day**: each is read from those two files, from a run's own records or
from a command.

## Names this phase introduces

Fixed by the context: `organization_list_and_independents`, `set_entity_nominations (p_entity_type, p_entity_id,
p_nominations jsonb)`, `entity_delete_nominations`, `Election.nominationShape`, `allowedParentTypes`,
`EntitySelector`, `contestant-nominations.spec.ts`, the three `(edit)/` directories, the tag
`@nomination-definition`. Chosen by the planner, and binding on every plan once written here:

| Layer | Name | What it is |
|---|---|---|
| SQL | `public.nomination_shape_rule (p_shape public.nomination_shape, p_entity_type public.entity_type) RETURNS text` | the matrix, stated once: `'refused'`, `'parent_required'` or `'admitted'`; `IMMUTABLE`, reads no table |
| SQL | message start `Nomination shape refused: `, SQLSTATE `23514` | the row rule of `public.validate_nomination` |
| SQL | `public.validate_nomination_parent_required ()`; constraint trigger `nominations_parent_required` | the end-of-transaction rule; message start `Nomination parent required: `, SQLSTATE `23514` |
| SQL | `private.nomination_id_in_contest (p_entity_type, p_entity_id, p_election_id, p_constituency_id, p_election_round) RETURNS uuid` | the id of an entity's nomination at a contest; no parent first, then the oldest, then the lowest id |
| SQL | `private.caller_nominated_in_contest (…, p_permission, p_caller_types public.entity_type[])` | guard 5, asked for the caller's type |
| SQL | message start `A caller may originate at most ` (whole: `…at most 10 unconfirmed parent nominations; this caller already holds %.`), SQLSTATE `P0001` | the cap, reworded for both parent types |
| SQL | `public.get_nomination_parent_options (p_project_id uuid, p_entity_type public.entity_type, p_entity_id uuid, p_contests jsonb) RETURNS jsonb` | the parent options, `SECURITY DEFINER` |
| SQL | keys of one object of `p_nominations` | `id` (optional), `election_id`, `constituency_id`, `election_symbol`, `parent` = `{"kind":"none"}` \| `{"kind":"entity","entity_type":…,"entity_id":…}` \| `{"kind":"other","name":…}` \| `{"kind":"keep"}` |
| SQL | answer of `set_entity_nominations` | `{"inserted","updated","deleted","unchanged","parents_created"}`, each an integer |
| pgTAP | `43-set-entity-nominations.test.sql`, `44-nomination-parent-options.test.sql` | the next free ordinals are derived again when plans 177-06 and 177-07 run |
| data | `packages/data/src/objects/election/nominationShape.ts`: `NOMINATION_SHAPE`, `NominationShape`, `DEFAULT_NOMINATION_SHAPE`, `isNominableInShape`, `allowedParentTypes`, `AllowedParentTypes` | the matrix in TypeScript |
| writer | `setEntityNominations`, `getNominationParentOptions`; `DesiredNomination`, `NominationParentChoice`, `SetEntityNominationsResult`, `NominationParentOption` | in `$F/lib/api/base/dataWriter.type.ts` |
| frontend | `$F/lib/routes/selectionOrder.ts` | the shared ordering module |
| frontend | `$F/lib/contestant/nominations/` — `editorFacts.ts`, `nominationDraft.ts`, `index.ts` | the "editable" and "admissible" predicates, the editor's reach, the draft arithmetic |
| frontend | route keys `ContestantAppNominationElections` (the entry), `ContestantAppNominationConstituencies`, `ContestantAppNominationDetails` | the three step addresses |
| frontend | search params `nominationElectionId`, `nominationConstituencyId` | repeatable; not persistent |
| frontend | `nominationsEditable` (input of `taskStateOf`), `nominationsSaveTarget`, `nominationsSaveAction`, `NominationsViewFacts` | in `$F/lib/contestant/tasks/taskState.ts` |
| dev-seed | template `perm-contestant-nominations`, prefix `e2e-perm-contestant-nominations-` | the phase's dataset |
| E2E | projects `data-setup-perm-contestant-nominations`, `data-teardown-perm-contestant-nominations`, `perm-contestant-nominations` | the trio of `$SPEC` |
| E2E | `$T/utils/permContestantNominationsData.ts`, `$T/fixtures/contestant/perm-contestant-nominations.ts`, `$T/fixtures/contestant/contestantNominationEditor.fixture.ts` | constants, composition root with state steps, the editor's steps |

## Items built at the researcher's recommendation, each isolated

Each of these is open until the operator rules. The plans build the option marked **built**; the other option is
the located change named beside it. Plan 177-01 reads the operator's reply by one command (below) and stops the
phase when a reply names another option. No executor chooses.

| Item | Question | Built | The other option, and where it lands |
|---|---|---|---|
| P-01 | D-26's "one migration regeneration" | one generated file, regenerated in every schema commit | one commit for the whole schema block: plans 177-02 to 177-07 become one uncommitted set |
| P-02 | The order of the plans (RESEARCH open question 5) | dataset and fixtures before the screens | D-26's letter: plans 177-10 and 177-11 move behind 177-19 |
| P-03 | The cap of 10 (RQ-8) | (a) as ruled: per user, organization and alliance rows the caller originated, its own included | (b) stop counting rows of an entity the caller edits: one conjunct in `private.caller_unconfirmed_originated_count` and one in the cap branch of `enforce_nomination_confirmation`, plan 177-05 |
| P-04 | A faction's editor and the paired guard (open question 2) | kept: a faction's editor may create its organization's row | dropped: the array `ARRAY['candidate','faction']` in the policy becomes `ARRAY['candidate']`, plan 177-05 |
| P-05 | Which of a party's nominations is linked (open question 3) | no parent first, then the oldest, then the lowest id | another order: the `ORDER BY` of `private.nomination_id_in_contest`, plan 177-05 |
| P-06 | A symbol longer than 50 characters at the function (open question 4) | refused, `22023`, naming the index | cut to 50: one expression in `set_entity_nominations`, plan 177-07 |
| P-07 | What the parent-options read is asked (open question 6) | the pairs are an argument, `p_contests` | every contest of the project: the argument goes, plan 177-06 |
| P-08 | Two simultaneous placeholder inserts (open question 7) | accepted: the second save is refused whole and a retry succeeds | caught in the function: an exception block around the placeholder insert, plan 177-07 |
| P-09 | The editor's loads (open question 8) | universal (`+layout.ts`, `+page.ts`) | server loads: the two layout loads become `+layout.server.ts`, plan 177-15 |
| P-10 | `search_path` on the write function (pattern item 1) | pinned to `''`, every name schema-qualified | unpinned, as `upsert_answers`: the header, plan 177-07 |
| P-11 | How guard 5 is paired (pattern item 2) | a fifth argument, an array of caller types | a second helper beside the first, plan 177-05 |
| P-12 | Rows the application writes have no external id (pattern item 6) | a state step clears them, children first, before each teardown's prefix delete | the cascade alone: the step's call in three teardowns goes, plans 177-10, 177-16 and 177-19 |
| P-13 | `perm-startfromcg.spec.ts`'s frame (pattern item 7) | the contestant describe takes its fixtures from a composition root of its own, in the same file | the file's `test` becomes the fixture-extended one, plan 177-16 |
| P-14 | `ElectionsGenerator`'s synthetic elections (RQ-1) | the new default | `candidate_only` kept: one literal, plan 177-02 |
| P-15 | The context accessor of the "rules written twice" todo, item 2 | not built: the editor asks through one pure label function and adds no third copy; the todo stays open | built: a `taskStateWith` method on the context, the profile and the question page repointed — a plan of its own before 177-18 |
| P-16 | Where D-24's comparison table lives | `packages/data/README.md` | `apps/docs` developers' guide: the section moves, plan 177-08 |
| P-17 | A save that was stored while the answers lock came on (no source describes it) | the user ends on the nominations view, as after a refused save: once the re-read has taken the user there, the editor navigates nowhere further | the user goes on to the next task: the handler's check that the page is still shown is made on the refused path alone, plan 177-18 |
| P-18 | A save built on nominations an administrator changed while the editor was open | as the UI contract has it: nothing is read again before the write; a removed row is caught by the refusal, an added row is deleted and a changed value written over, accepted and filed as a todo | one re-read and one comparison before the write, in the details page's handler, plan 177-18 — which also turns a lock away before the database is asked |

`$P/177-read-rulings.mjs`, built by plan 177-01 from Phase 176's reading command, reads a decision document by a
fixed rule: no box ticked and no NOTE text means the recommended option; exactly one box ticked on the
recommended option means the same; anything else — another box, two boxes, any NOTE or EDIT text, stray text —
is a halt with the item printed verbatim. The orchestrator names the document that holds this phase's round in the
two-line file `$P/177-OPERATOR-ROUND` (line 1: the document's path; line 2: the letters of its sections, for
example `G`). When that file is absent, every item above stands at its built option under the operator's standing
convention that an unticked proposal means its recommended option, and plan 177-01 records that sentence.

## The shell

- Begin every shell call that runs `yarn`, `npx` or `node` with
  `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.
- A status is read from the command itself, never through a pipe. A commit follows a gate with `&&`, never `;`.
- No gate-set run, E2E run or batch is made in the foreground: launch it in the shell tool's background mode as
  `( caffeinate -dimsu <command>; echo $? > <marker>.exit ) > <marker>.log 2>&1` and poll with one short
  foreground command per poll (a bounded loop of at most 45 one-second waits that ends when the `.exit` marker
  exists). Ceilings: 20 minutes for one run or one gate set. A foreground gate trips the executor's 600-second
  watchdog.
- Before a long run: `pmset -g batt`. No run is started on battery below 30 %.

## Commits

- Each commit holds the executor's own files only, named by pathspec: `git commit -m "…" -- <paths>`; a new file
  is added by explicit path first. Never `git add -A`, never `git stash`. `CAND-APP-PLAN.md` is never staged. On
  `index.lock`, wait a few seconds and try again. The branch is `feat/entity-signup-multi-grant`; no branch is
  created or switched.
- A commit that changes `$S/schema/`, the migration or the generated database types carries `[db]` in its
  subject and holds the regenerated migration (`yarn schema:regenerate`) and the regenerated types
  (`yarn db:types`).
- `yarn assert:comment-hygiene` runs on the working tree before every commit that adds or changes a comment
  under `apps/`, `packages/` or `tests/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The executor edits none of `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`,
  `177-CONTEXT.md`, `177-UI-SPEC.md` and `CLAUDE.md`. A sentence of one of them that the work made false is
  reported, not edited.

## Comments and titles

A comment, a docstring, an SQL header and a test title describe the code as it is, to someone reading it cold: no
account of what the code used to do, no decision, plan, ruling, assumption or requirement id, nothing addressed to
a reviewer. The ids in a PLAN.md (`D-06`, `U-01`, `T-6`, `OD08-E4`, `P-03`) stay in the PLAN.md and the
SUMMARY.md. Several analog files carry history and plan ids today; they are analogs for structure, not for
comment style, and a comment this phase touches is brought in line.

## Searches and checks

- Every population of something already on the tree is a command plus the relation it must satisfy, and no such
  count written in a plan is a target. The number of tests a plan itself adds is stated and pinned. Code is never
  bent to a count or to a search; a check is never edited to pass; a correct implementation in another form is
  reported with the stage it fails and the result of the same chain with that one stage restated.
- A negative search over a directory excludes test files (`':!*.test.ts'`). A count of lines naming a symbol is
  also tripped by a comment naming it: a call site is counted by a form a comment cannot match.
- `git grep -E` on this host does not read `\b`: use `([^A-Za-z]|$)`.
- A lookup of a message key does not split the key on every dot: each `contestantApp.*` catalogue file wraps its
  messages in one top-level key that is the file's own name without `.json`; `common.json` wraps its in `common`.
- An `<automated>` block is run from a script file taken byte for byte from the plan (`$U/<plan>-t<N>-verify.sh`)
  and run with `bash`, never pasted into the login shell (zsh does not split an unquoted variable into words). Its
  log, exit status and head are kept beside it. A block that holds a long gate is launched in the background and
  polled; a block of searches and verdict readings may run in the foreground.
- A check that decides whether something may be done refuses when it cannot look: an in-flight search that fails
  is not an answer of "nothing in flight".
- An agent's diagnosis of a cause is unconfirmed until it has been re-tested in isolation. A summary says which
  of its statements were observed and which were inferred.

## The database

- `Skill("database")` is loaded before the schema or a pgTAP file is edited.
- The schema is edited in `$S/schema/*.sql`; `$S/migrations/00001_initial_schema.sql` and
  `packages/supabase-types/src/database.ts` are generated and never hand-edited.
- The order of the database rows is fixed: the reset, then the types on the freshly reset database, then pgTAP,
  then the SQL lint, then the integration test. They are run through the gate driver:
  `bash $P/177-gates.sh <label> --rows db-reset,types-regen,types-clean,pgtap,sql-lint`, judged with
  `node $P/177-verdict.mjs gates <label> --rows …`.
- **`yarn db:reset` never runs while an E2E run is in flight** (a `started` marker without an `ended` beside it
  at any depth under `tests/e2e-runs/`); the driver refuses. Docker and the Supabase stack are never restarted: a
  second, unrelated stack runs on this host. On `ENOSPC`: `docker builder prune -af` first.
- A new pgTAP assertion is committed red and alone before the schema that turns it green, with the red run's log,
  exit status and head kept as `$U/<plan>-pgtap-red.{log,exit,head}`.
- The deferred rule does not fire by itself inside a pgTAP file, which never commits: it is asserted through
  `set_entity_nominations`, or with `SET CONSTRAINTS ALL IMMEDIATE` inside the asserted statement. No statement
  leaves the mode `IMMEDIATE`.
- Row-level security refuses an `UPDATE` and a `DELETE` silently, with zero rows: such a refusal is asserted with
  `lives_ok` and then the unchanged value read as the owner, or through an instrument that returns the row count.
- Nothing is deployed: the schema targets PostgreSQL 17, with no compatibility shim and no migration of stored
  data. There is no remote project to push to; the schema reaches the local database by the reset.

## E2E

- **No red E2E test is ever committed.** A new test, a changed expectation of an existing spec and a fixture step
  whose signature changes stay in the working tree until a run of that uncommitted tree has shown them green. A
  new fixture step that no committed spec calls is committed first: it is no test of the suite.
- **No commit turns a committed E2E test red.** A change to the application that a browser can observe — a page,
  a layout, a load, a component a page renders — stays in the working tree until a run of that uncommitted tree
  has passed, and is committed together with the spec and fixture changes that depend on it: one commit. What may
  be committed before it: a unit or component test file, red and alone; a module that decides nothing yet; a
  fixture step no spec calls; a state attribute nothing reads; a component nothing renders; a route nothing links
  to. Each plan says, under *What this plan's commits do to committed specs*, either why its commits are additive
  or which commit is the one. A test of another spec that the held change turns red in the pre-commit run is
  settled in the same uncommitted set before anything is committed.
- **A run of an uncommitted tree** goes directly through the wrapper, with nothing on the dev-server port:
  `tests/scripts/e2e-run.sh --run-dir $R/<label> --no-db-reset [--project <name>]`, then
  `node tests/scripts/e2e-evidence.mjs $R/<label>`. It is judged with
  `node $P/177-verdict.mjs control <label> --project <name> --setup <setup project> --dirty-only <path>…` and
  `--red "<title substring>"…` or `--green [--were-red-in <label>]`.
- **A negative control counts** only when exactly the named tests are red, each ended `failed` on an expectation
  — not on a timeout, not on a compile error — and every other test of the run passed.
- **What a one-project run covers.** A run restricted to `perm-contestant-nominations` runs what
  `tests/playwright.config.ts` makes it depend on: the permutation chain before it — `perm-startfromcg`,
  `perm-answers-locked`, `perm-organization-editing` and `perm-no-nomination` among them — and the projects the
  chain's head names. The chain's tail and the base leaves outside those dependencies are covered by a full run
  alone.
- **Every plan that changes a surface a browser can observe, a dataset or the rules a dataset is imported under
  closes on a full default run of its own committed tree**: `bash $P/177-e2e.sh <plan>-close`, judged at once with
  `node $P/177-verdict.mjs e2e <plan>-close --same-projects-as <its predecessor's label, or $(cat $P/177-BASELINE) for the first> …`.
  The chain of full runs is: `BASELINE` → `177-02-close` → `177-03-close` → `177-07-close` → `177-10-close` →
  `177-13-close` → `177-15-close` → `177-16-close` → `177-17-close` → `177-18-close` → `177-19-close` →
  `177-20-close` → `177-21-final`. Gate rows end before an E2E run starts.
- **Void** is decided by the wrapper's marker alone: status 8 with `VOID-host-suspend.txt`, or the determinism
  batch's status 6. A void run is kept and made again under the next `-rN` suffix. A red run without the marker
  is a failure; with no other cause, `pmset -g log` is read before the tree is blamed. A did-not-run is a
  failure. Nothing is retried until green on an unchanged tree; no test is skipped or annotated to pass. Nothing
  under `tests/e2e-runs/` is deleted.
- A dev server is started by the wrapper and by nothing else. No spec waits a fixed time: the CI runner is about
  four times slower than this host, and a fixed window that passes here races there.
- Every test of `$SPEC` begins with the state steps that write, with the service role, the state it reads. None
  relies on what a test before it left. A test that turns a project-wide setting on, or changes an election's
  type, restores it in a `finally`, and the step after such a flip is a full page load, said so in the step's own
  name or comment. A spec holds hard assertions only and no locator in a test body: every locator is in a fixture
  and every id comes from `tests/tests/utils/testIds.ts`.
- A state step that writes a nomination is bound by the election-type rule, the service role included: it writes
  only a row its election admits.

## An interrupted cycle

From the step that writes uncommitted changes until the step that commits them, the working tree holds exactly
the files that plan's `<uncommitted_changes>` block names, and a copy of each as the pre-commit run ran it is kept
beside the run (`$R/<label>.<file name>.kept`). The next executor either goes on from the working tree (or from
the kept copies, copied back) or discards the change with `git checkout -- <the named files>` and starts that task
again. The gate driver and the E2E driver refuse a tree with uncommitted changes outside `.planning/`; a plan
calls neither while its changes are uncommitted.

## Code rules that bind every edit

- `CLAUDE.md` § *Context Destructuring Rule*: `taskState`, `tasks`, `nextStep`, `previewOpen`, `nominations`,
  `nominationsLocked`, `answersLocked`, `questionsReady`, `selectedEntity`, `profileComplete`, `appSettings`,
  `locale`, the question lists and `dataRoot` are reactive accessors — read `contestantCtx.X` inside the tracking
  scope, never destructure; `dataRoot` is never bound to a read alias. `t`, `getRoute` and `userData` are stable
  and may be destructured.
- "Editable" and "admissible" are asked through one predicate each (`nominationsEditableOf`,
  `admissibleElectionsOf`); no page, load or component writes either condition out. Whether an entity type may
  stand in an election, and which parent it may name, is asked of `isNominableInShape` and `allowedParentTypes`
  and never re-derived.
- `entityDescriptorOf` is the only place a difference between entity types lives: no `{#if}` and no ternary on
  the entity's type in a page, a layout or a component.
- `CLAUDE.md` § *Results Navigation Invariants*: no element added by this phase carries a
  `view-transition-name`, no `<dialog>` is added, and no layout load reads a `url` or `route` property. The
  entity-level load is not changed and gains no `depends()`; `invalidateAll()` is what reruns it.
- New markup writes no numeric spacing class and no arbitrary value: `xs`, `sm`, `md`, `lg`, `xl`, `xxl` and
  `touch` only.
- A string a user reads has a message key in all seven locales; a name a user typed is rendered as text.
- `.agents/code-review-checklist.md` is walked in every plan that adds application code, and each item's outcome
  is recorded in the summary.
- `Skill("components")` is loaded before a `.svelte` component is edited; `Skill("data")` before
  `packages/data` is.

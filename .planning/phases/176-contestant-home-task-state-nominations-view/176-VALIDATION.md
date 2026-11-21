---
phase: "176"
slug: "contestant-home-task-state-nominations-view"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-08"
---

# Phase 176 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Nineteen plans in eighteen waves,
> 53 tasks, all automated: no task is a checkpoint. Every task has a verify command with a stated failing
> direction. Where the project's precedent is test-first, the check is observed red before the change that
> turns it green and the red is kept as evidence: pgTAP cells against the applied schema, unit and
> component cases in a JSON report with the head it was taken on, and the new and changed E2E expectations
> in control runs of an **uncommitted** tree.
>
> **No red E2E test is ever committed.** A new spec test, a changed expectation of an existing spec, a new
> link of the chain and a fixture step whose signature changes exist in the working tree alone until a run
> of that tree, made directly through `tests/scripts/e2e-run.sh`, has shown them green.
>
> **No commit turns a committed E2E test red.** A change to the application that a browser can observe is
> held in the working tree with the spec and fixture changes that depend on it, through the run that shows
> them green, and is committed with them: one commit (176-08 to 176-11, 176-13 to 176-17). The plans whose
> commits are additive against the committed specs say why, each under *What this plan's commits do to
> committed specs*. So the suite is green at every commit of the phase by the order of the commits, and
> every plan's closing run confirms it rather than discovers it.
>
> **Four items of these plans depart from locked text and no operator ruling on them is on record.** U-01
> (the letter of roadmap criterion 4, and D-06's first sentence), U-02 (D-06) and U-08 (D-17's table) were
> shown to the operator on 2026-10-08 and are built at their recommended option under the operator's
> standing convention that an unticked item means the recommended option. The order of the plans departs
> from D-21's plan-shape clause — the dataset and the fixtures before the screens, a full run at the close
> of every surface plan — on orchestrator rulings 8 to 10 and the operator's standing instruction that E2E
> fixtures are built before the screens they assert; D-21 is not amended. All four are put to the operator
> as items C1 to C4 of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`; 176-01 reads that document when
> the phase starts and records what stands.
>
> **The operator's document is read by a fixed rule, never by an executor's judgment.** One command reads
> every item under its sections C and D — the set is derived from the headings, not listed — and gives each
> one outcome. No box ticked and no NOTE text: the recommended option. Exactly one box ticked and no NOTE
> text: that option — the owning plan's stated fallback for C1, C2 and C3; a halt for any other option that
> is not the recommended one (C4 (b), C5, C6, D1, an item added since). Any NOTE text, more than one tick,
> a box in any other state or stray text: a halt. A halt stops the phase at 176-01 with the item quoted
> verbatim and nothing built; the orchestrator turns the ruling into a change of the plans.
>
> **The phase executes only after Phase 175 is closed and verified.** Its baseline is Phase 175's closing
> run, which did not exist when these plans were written; plan 176-01 reads it from the tree. No number in
> this file is a target taken from the planning day.

`176-EXECUTION-RULES.md` holds the rules every executor reads once: the names, the shell, the commits, the
searches and checks, the E2E rules and the resume rule of an interrupted cycle.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | pgTAP (`supabase test db`); Vitest (the frontend, `packages/dev-seed`, the tests' own utilities); Playwright through `tests/scripts/e2e-run.sh`; the gated writer integration test against the local stack |
| **Config files** | `apps/supabase/supabase/tests/database/*.test.sql`, the per-workspace Vitest configs, `tests/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run commands** | `yarn workspace @openvaa/supabase test:db` (after `yarn db:reset` and `yarn db:types`) · `yarn workspace @openvaa/frontend vitest run <path filter>` · `yarn workspace @openvaa/dev-seed test:unit` · `yarn workspace @openvaa/frontend check` |
| **Full suite commands** | on a committed tree: `bash .planning/phases/176-contestant-home-task-state-nominations-view/176-gates.sh <label> [--rows <names>]` (fourteen rows by default) then `bash …/176-e2e.sh <label> [--project <name>] [--require-project <name>]`; at the close `tests/scripts/determinism-batch.sh --runs 3 --project <name> --ledger-dir tests/e2e-runs/176-determinism/<label>`, once for `perm-no-nomination` and once for `contestant-journey` |
| **Runs of an uncommitted tree** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/176-e2e/<label> --no-db-reset --project <name>` then `node tests/scripts/e2e-evidence.mjs <that directory>` — the drivers refuse a dirty tree, the wrapper does not, and it records the head and the worktree status the verdict reads |
| **Verdict commands** | `node …/176-verdict.mjs gates <label> [--rows <names>]` · `… e2e <label> [--allow-slice] [--same-projects-as <label-or-path> [--except <project>=<delta>]…] [--expect-project <name>]… [--expect-title-count <project>::<substring>=<n>]…` · `… control <label> --project <name> --setup <project> --dirty-only <path>… (--red <substring>… \| --green [--were-red-in <label>])` · `… determinism <ledger-dir> --project <name> --runs <n>` · `… dir <gates\|e2e\|determinism> <label>` · `… scope` · `… hygiene` |
| **Estimated runtime** | a targeted Vitest filter 10–60 s; pgTAP about 60 s after a reset of about 60–90 s; the gate set about 10–15 min; a full E2E run about 6–9 min; a one-project run of the new project about 5–8 min (it runs its dependency chain); a one-project run of `contestant-journey` about 2 min; a three-run batch about 25–40 min. Every long run is launched in the background and polled |

The three drivers are created by 176-01 Task 1, copied from Phase 175's. None exists before it.

**The base commit and the baseline run are two committed one-line files**, `176-BASE` and `176-BASELINE`,
written by 176-01 from the tree: the last commit that changed a file outside `.planning/` before the phase,
and the directory of the full run every comparison starts from — Phase 175's closing run when it is of that
tree, and otherwise a run 176-01 makes. Every plan reads them with `cat`.

**The fourteen gate rows, in their fixed order:** `typecheck`, `lint`, `db-reset`, `types-regen`,
`types-clean`, `pgtap`, `sql-lint`, `integration`, `unit`, `check-frontend`, `build`, `format`, `docs-links`,
`name-gate-self-test`.

**The order of the database steps is fixed:** edit `schema/*.sql`; `yarn schema:regenerate` in the same
commit; the parity gate; `yarn db:reset`; `yarn db:types` on the freshly reset database and before pgTAP;
pgTAP; `yarn db:lint:sql`. Never `supabase db push`; never a hand edit of the migration or the generated
types. Every commit that changes the schema, its migration, the database tests or the generated types
carries `[db]` in its subject.

**When the database is reset, and by what.** 176-02 resets it directly, after confirming no E2E run is in
flight — a `started` marker without an `ended` beside it at any depth under `tests/e2e-runs/`. After it the
database is reset only by the gate driver's `db-reset` row (176-07, 176-19), which refuses while a run is in
flight, and by the determinism batches' own runs (176-19). Docker and the Supabase stack are never
restarted: a second, unrelated stack runs on this host. The `default` dataset is restored with
`yarn db:seed:default` after the last reset of 176-02, of 176-07 and of 176-19.

**How a run is compared with another.** `--same-projects-as` is the per-project comparison: every project
has exactly its total in the other run, except a project named in `--except`.

**What a one-project run covers.** A run restricted to `perm-no-nomination` runs the permutation chain
before it and the projects the chain's head names, with their setups — the candidate journey, the existing
contestant scan project, the entity-selection and terms-gate projects among them — and no more. The chain's
tail and the base leaves outside those dependencies are covered by a full run alone. An uncommitted run is
therefore the proof for the commit of a spec and no wider.

**What makes a run void.** Only the wrapper's marker: status 8 with `VOID-host-suspend.txt`, or the batch's
status 6. A void run is kept and made again under the next `-rN` suffix. A red run without the marker is a
failure. A did-not-run is a failure.

---

## Red first, without a red commit

The order every plan that adds or changes E2E expectations follows (176-07 to 176-18):

1. A new fixture step that no committed spec calls, and a new state step, are committed first. They are no
   test of the suite. A step whose signature changes stays uncommitted with its callers.
2. The new tests are written into the spec and left uncommitted. A copy of the spec as it is run is kept
   beside the run directory.
3. Where a surface is still to be built (176-08 to 176-17, but 176-11's own project is `perm-answers-locked`):
   a control run of that uncommitted tree, judged with `control … --red <prefix>` — the setup green, every
   test of the prefix failed on an expectation, every other test passed, the named files the only
   uncommitted paths.
4. Where an existing spec's expectations change as well (176-13, 176-15, 176-16, 176-17: the candidate
   journey; 176-10: Phase 175's spec, in its state alone): a second control, of that spec's own project,
   or — for a change of state that is green before and after — its tests among "every other test passed"
   of the first. `contestant-journey` is a dependency of the head of the permutation chain, so a red
   journey leaves the whole chain did-not-run; the control of the new spec is therefore made first, with
   the journey unchanged.
5. The surface is built, its unit and component cases red — committed, the test file alone — and then
   green. **What a browser can observe of it is not committed:** it stays in the working tree beside the
   uncommitted specs. A module that decides nothing yet, a component nothing renders and a state attribute
   nothing reads may be committed.
6. One run of the uncommitted tree with `--project perm-no-nomination`, judged with
   `control … --dirty-only <the application directory> --dirty-only tests/tests/ --green --were-red-in <the control>`
   — once for each control. Its chain holds the journey, the entity-selection spec, the contestant scans
   and every permutation project up to the phase's own, Phase 175's among them: a committed test that the
   held surface turns red is seen here and settled in the same uncommitted set.
7. Only then one commit holds the surface and the specs, and the gate rows and the full run follow on the
   committed tree. The task's verify chain requires the one commit: the surface's and the spec's last
   commit are the same, and at the commit the pre-commit run was made on neither was there.

**What an interrupted executor leaves** is the files each plan's `<uncommitted_changes>` block names and the
kept copies. The next executor goes on from the working tree or the copies, or discards the change with
`git checkout -- <the named files>` and starts that task again. Never `git stash`.

**Each accepting branch of the verdict script is seen refusing** before it is relied on, once: on scratch
copies of Phase 175's evidence in 176-01 Task 1 — a void, a stale and a subset run, a run lacking a
project, a false title count, a red control offered as green, a green uncommitted run offered as an `e2e`
run, and a ledger with too few runs. One branch has no evidence to be seen on before the phase has a run
of its own, and is seen in 176-07 Task 3: a project whose total differs from its predecessor's, without
its `--except`. No later plan repeats a refusal.

**Each test of the new spec sets the state it reads** through the service-role state steps built in 176-07
Task 2 — `setNominationState`, `setAnswers`, `setNominationsLocked` — so no test depends on one before it,
and the closing gate can run the spec three times in isolation.

---

## Sampling Rate

- **After every task:** the task's own `<automated>` command, run with `bash` from a script file taken byte
  for byte from the plan; in the background and polled when it holds a long gate.
- **After every plan:** see the run schedule below.
- **Before `/gsd-verify-work`:** the closing gate of 176-19 Task 2 on one tree — the code review checklist
  walked over the whole phase diff first, then the fourteen gate rows, one full default E2E run compared
  with the last full run and with the baseline, the new spec and the journey three times each in isolation,
  `scope` and `hygiene`.
- **Max feedback latency:** about 300 seconds for a task's own checks; about 30 minutes for a plan that
  closes on two controls, a pre-commit run, gate rows and a full run; about 2 hours for the closing plan.
- **Never:** a red E2E test in a commit, a retry until green, a skipped or annotated test, a status read
  through a pipe, a foreground gate-set or E2E run, a run started on battery below 30 %, a deletion under
  `tests/e2e-runs/`, a Docker or Supabase restart, a database reset beside an E2E run, `git add -A`,
  `git stash`.

### Run schedule

Plans in one wave share one working tree. The one parallel pair, 176-02 with 176-03, is in disjoint
workspaces — the schema and the generated types against five new files under
`apps/frontend/src/lib/contestant/tasks/` — runs no workspace-wide gate, commits by pathspec, and names
176-05's gate rows as its boundary proof. Every other plan is alone in its wave.

| Plan | Wave | Tasks | Gate rows at close | E2E runs | E2E comparison | Boundary proof for |
|------|------|-------|--------------------|----------|----------------|--------------------|
| 176-01 | 1 | 3 | none (static checks of the drivers) | the reading, with two uncommitted probes (`176-01-d9-reading`, `--project perm-organization-editing`); the baseline too when Phase 175's closing run is not of this tree | — | — |
| 176-02 | 2 | 2 | none (parity, `db:reset`, `db:types`, pgTAP, `db:lint:sql` run directly) | none | — | — |
| 176-03 | 2 | 2 | none (its own unit files, ESLint, Prettier) | none | — | — |
| 176-04 | 3 | 2 | none (key parity, the key type, the namespace gate, svelte-check) | none; a one-project run only when a spec asserts a text this plan changes | — | — |
| 176-05 | 4 | 3 | `typecheck,lint,integration,unit,check-frontend,build,format` | full (`176-05-close`) | every project at its baseline total | 176-02, 176-03, 176-04 |
| 176-06 | 5 | 3 | `typecheck,lint,unit,check-frontend,build,format` | full (`176-06-close`) | equal to `176-05-close` | — |
| 176-07 | 6 | 3 | all fourteen | uncommitted, green (`176-07-precommit`); full (`176-07-close`) | equal to `176-06-close`; the three new projects new | — |
| 176-08 | 7 | 3 | the six | red (`176-08-control`); green, the gate held (`176-08-precommit`); full (`176-08-close`) | equal to `176-07-close` except the new project | — |
| 176-09 | 8 | 2 | the six | red (`176-09-control`); green, the layout held (`176-09-precommit`); full (`176-09-close`) | equal to `176-08-close` except the new project | — |
| 176-10 | 9 | 3 | the six | red (`176-10-control`); green, the rule held (`176-10-precommit`); full (`176-10-close`) | equal to `176-09-close` except the new project | — |
| 176-11 | 10 | 3 | the six | red, of `perm-answers-locked` (`176-11-control`); green, the pages held (`176-11-precommit`); full (`176-11-close`) | equal to `176-10-close`; `perm-answers-locked` one above | — |
| 176-12 | 11 | 3 | the six | red (`176-12-control`); green (`176-12-precommit`); full (`176-12-close`) | equal to `176-11-close` except the new project | — |
| 176-13 | 12 | 3 | the six | red (`176-13-control`, `176-13-control-journey`); green, the removal held (`176-13-precommit`); full (`176-13-close`) | equal to `176-12-close` except the new project | — |
| 176-14 | 13 | 3 | the six | red (`176-14-control`); green, the page held (`176-14-precommit`); full (`176-14-close`) | equal to `176-13-close` except the new project | — |
| 176-15 | 14 | 3 | the six | red (`176-15-control`, `176-15-control-journey`); green, the page held (`176-15-precommit`); full (`176-15-close`) | equal to `176-14-close` except the new project | — |
| 176-16 | 15 | 3 | the six | red (`176-16-control`, `176-16-control-journey`); green, the menu held (`176-16-precommit`); full (`176-16-close`) | equal to `176-15-close` except the new project | — |
| 176-17 | 16 | 3 | the six | red (`176-17-control`, `176-17-control-journey`); green, the pages held (`176-17-precommit`); full (`176-17-close`) | equal to `176-16-close` except the new project | — |
| 176-18 | 17 | 3 | the six | green (`176-18-a11y-precommit`, `176-18-scan-precommit`); full (`176-18-close`) | equal to `176-17-close`; the existing scan project two above; twelve scans in the new project | — |
| 176-19 | 18 | 3 | all fourteen | full (`176-19-final`), then two three-run batches | equal to `176-18-close`; every pre-phase project at its baseline but two stated ones | — |

"The six" is `typecheck,lint,unit,check-frontend,build,format`. The chain of full runs is `BASELINE` →
`176-05-close` → `176-06-close` → … → `176-18-close` → `176-19-final`: every plan from 176-05 on that commits
application code or a test closes on a full default run of its own committed tree, compared with the full
run before it.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 176-01-01 | 01 | 1 | NOM-01 | T-176-01, T-176-02, T-176-03, T-176-82 | no verdict from a stale, partial or void run; a baseline of this tree; no key printed; nothing built on an operator's item that needs the orchestrator | source assertion | the reading of the operator's document exits 0; syntax checks, usage exits, `176-verdict.mjs hygiene` and `scope`, the baseline's head tree-equal to `176-BASE` | ❌ W0 | ⬜ pending |
| 176-01-02 | 01 | 1 | NOM-01 | T-176-82 | the names expected from Phase 175 are on the tree, or the phase halts; every item of the operator's document recorded with the outcome the reading gave | source assertion | the tracked-file and export checks; `176-BASELINE-FACTS.md` with a line for every item of the decision document's sections C and D, checked against a second reading | ❌ W0 | ⬜ pending |
| 176-01-03 | 01 | 1 | NOM-02 | T-176-81 | a cause is read in the application before anything changes the code that logs it, and written as read | E2E reading through the wrapper + source assertion | the run `176-01-d9-reading`; four verdict lines in `176-D9-FINDING.md`, each `held` — a point not held exits non-zero and stops the phase; no commit touching `tests/tests` | ❌ W0 (`176-D9-FINDING.md`) | ⬜ pending |
| 176-02-01 | 02 | 2 | NOM-02 | T-176-04 to T-176-09 | the function answers its editor alone, with an allow-list, `NULL` for every refusal, and not to `anon` | pgTAP (red) | the red log of `test:db` against the applied schema | ❌ W0 (the function's test file) | ⬜ pending |
| 176-02-02 | 02 | 2 | NOM-02 | T-176-04 to T-176-10 | the same, on the applied schema; no reset under a run | schema workflow + pgTAP (green) + SQL lint | parity, the in-flight check, `db:reset`, `db:types` without drift, `test:db`, `db:lint:sql`, the `[db]` tag on every schema commit | ✅ | ⬜ pending |
| 176-03-01 | 03 | 2 | TASK-01 | T-176-12 | one statement of "required" and of "unanswered" | unit (red → green) | `vitest run src/lib/contestant/tasks/unanswered.test.ts`, the import search | ❌ W0 | ⬜ pending |
| 176-03-02 | 03 | 2 | TASK-01 | T-176-11, T-176-12, T-176-13 | nothing complete from an unknown or nomination-less state; one predicate each; a target that does not depend on a list the save empties | unit (red → green) | `vitest run src/lib/contestant/tasks`, the export and no-import searches | ❌ W0 | ⬜ pending |
| 176-04-01 | 04 | 3 | NOM-01, NOM-02 | T-176-14, T-176-15 | no sentence states a withdrawn rule; no placeholder but a count | catalogue parity + typecheck | the key script over seven locales, the reworded-key comparison, the regenerated key type without diff, `assert:i18n-catalog-namespaces`, svelte-check | ✅ | ⬜ pending |
| 176-04-02 | 04 | 3 | NOM-01, NOM-02 | — | a per-type difference is a descriptor member | unit (red → green) | `vitest run src/lib/contestant/utils`, svelte-check | ✅ (cases new) | ⬜ pending |
| 176-05-01 | 05 | 4 | NOM-02 | T-176-16, T-176-17 | a refusal is not an empty list; no stored value in a message | unit (red → green) | the parse module's test, `assert:adapter-casts` | ❌ W0 | ⬜ pending |
| 176-05-02 | 05 | 4 | NOM-02 | T-176-16, T-176-18, T-176-19 | the call passes its project; the provider's type untouched | unit (red → green) + gates | the writer's tests, `assert:project-scoped-queries`, the whole frontend unit suite, svelte-check | ✅ (cases rewritten) | ⬜ pending |
| 176-05-03 | 05 | 4 | NOM-02 | T-176-16 | the read works against the real database for both types | integration + gates + E2E | `gates 176-05-close --rows <seven>` with the four `nominations:` cases; `e2e 176-05-close --same-projects-as <baseline>` | ✅ (cases new) | ⬜ pending |
| 176-06-01 | 06 | 5 | NOM-01 | T-176-20, T-176-21 | no unfiltered questions and no empty filter for an entity with no nomination | unit (red → green) | the load's test, the unchanged tracking test, the key type, the whole unit suite, svelte-check | ✅ (one describe rewritten) | ⬜ pending |
| 176-06-02 | 06 | 5 | NOM-01, TASK-01 | T-176-22, T-176-23 | one entity's questions never shown on another; nothing complete from an unknown state | unit (red → green) | `vitest run src/lib/contexts`, the whole unit suite, svelte-check | ✅ (cases new) | ⬜ pending |
| 176-06-03 | 06 | 5 | NOM-01, TASK-01 | — | every contestant journey where it was | gates + E2E | `gates 176-06-close --rows <six>`; `e2e 176-06-close --same-projects-as 176-05-close` | ✅ | ⬜ pending |
| 176-07-01 | 07 | 6 | NOM-01 | T-176-25 | a dataset whose entities have no nomination seeds | unit + read-back | `yarn workspace @openvaa/dev-seed test:unit`, `typecheck:tests`, the registry's ids | ❌ W0 (the template) | ⬜ pending |
| 176-07-02 | 07 | 6 | NOM-01 | T-176-25 to T-176-29 | a prefix that overlaps no other; a state step that writes its own rows alone; nothing red committed | config + E2E of the uncommitted tree (green) | `assert:a11y-scan-wiring`; `control 176-07-precommit … --dirty-only tests/ --green` | ❌ W0 (setup, teardown, the spec) | ⬜ pending |
| 176-07-03 | 07 | 6 | NOM-01 | T-176-27 | the verdict refuses what it should | gates + E2E | `gates 176-07-close`; `e2e 176-07-close --same-projects-as 176-06-close …`; the one refusal | ✅ | ⬜ pending |
| 176-08-01 | 08 | 7 | NOM-07 | T-176-34, T-176-83 | nothing red committed | E2E control of the uncommitted tree (red) | `control 176-08-control … --red "gate:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-08-02 | 08 | 7 | NOM-07 | T-176-30 to T-176-33 | the gate decides on server-read rows and two params; no URL read; nothing while a user-level gate is pending | unit (red → green) | the group load's server and tracking tests, `vitest run src/lib/routes`; the implementation uncommitted | ❌ W0 (the load and its two tests) | ⬜ pending |
| 176-08-03 | 08 | 7 | NOM-07 | T-176-31, T-176-34, T-176-83 | the gate committed with its tests | E2E of the uncommitted tree (green) + gates + E2E | `control 176-08-precommit … --green --were-red-in 176-08-control` with the gate uncommitted; the one-commit check; `gates`; `e2e 176-08-close --same-projects-as 176-07-close …` | ✅ | ⬜ pending |
| 176-09-01 | 09 | 8 | NOM-07 | T-176-39, T-176-77 | nothing red committed | E2E control of the uncommitted tree (red) | `control 176-09-control … --red "questions:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-09-02 | 09 | 8 | NOM-07 | T-176-39, T-176-77 | the redirect and the render condition leave together; the layout committed with its tests, not before | component (red → green) + E2E of the uncommitted tree (green) + gates + E2E | the layout's test; `control 176-09-precommit … --green --were-red-in 176-09-control` with the layout uncommitted; the one-commit check; `gates`; `e2e 176-09-close --same-projects-as 176-08-close …` | ✅ (one case rewritten) | ⬜ pending |
| 176-10-01 | 10 | 9 | NOM-07 | T-176-35, T-176-37, T-176-78 | a stale click is refused by the server; every committed preview opened in a state the rule allows; nothing red committed | E2E control of the uncommitted tree (red) | `control 176-10-control … --dirty-only tests/tests/specs/ --red "preview:"`, the changed tests of Phase 175's spec among those that passed | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-10-02 | 10 | 9 | NOM-07 | T-176-35, T-176-36, T-176-38, T-176-76 | the server computes "unanswered" itself, with the browser's rule; no redirect when it cannot decide; nothing of one request reaches another | unit (red → green) | the helper's and the preview load's tests, the tracking test, the two-entities case, the search for a top-level binding; the implementation uncommitted | ❌ W0 (the helper, the load, three tests) | ⬜ pending |
| 176-10-03 | 10 | 9 | NOM-07 | T-176-78 | the rule committed with every spec it touches | E2E of the uncommitted tree (green) + gates + E2E | `control 176-10-precommit … --green --were-red-in 176-10-control` with the rule uncommitted; the one-commit check; `gates`; `e2e 176-10-close --same-projects-as 176-09-close …` | ✅ | ⬜ pending |
| 176-11-01 | 11 | 10 | NOM-02 | T-176-40, T-176-41 | a reason is a closed union; a shared component's other callers unchanged | component (red → green) | `vitest run src/lib/contestant/components`, svelte-check | ❌ W0 (the note and its test) | ⬜ pending |
| 176-11-02 | 11 | 10 | NOM-02 | T-176-40, T-176-42 | the note where its reason is true and nowhere else | E2E control (red) + component (red → green) | `control 176-11-control --project perm-answers-locked … --red "note:"`; the page tests | ✅ (cases new) | ⬜ pending |
| 176-11-03 | 11 | 10 | NOM-02 | T-176-42, T-176-84 | the four pages committed with the test | E2E of the uncommitted tree (green) + gates + E2E | `control 176-11-precommit … --green --were-red-in 176-11-control` with the pages uncommitted; the one-commit check; `gates`; `e2e 176-11-close --same-projects-as 176-10-close --except perm-answers-locked=1 …` | ✅ | ⬜ pending |
| 176-12-01 | 12 | 11 | NOM-02, TASK-01 | T-176-47 | nothing red committed | E2E control of the uncommitted tree (red) | `control 176-12-control … --red "nominations:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-12-02 | 12 | 11 | NOM-02, TASK-01 | T-176-43 to T-176-46 | a stored name is text; "empty" only for a list known to be empty; the state is the read's | component (red → green) | the view's test, `vitest run src/lib/routes src/params`, the no-data-root search, svelte-check | ❌ W0 (the page and its test) | ⬜ pending |
| 176-12-03 | 12 | 11 | NOM-02, TASK-01 | T-176-47 | the tests are committed green | E2E of the uncommitted tree (green) + gates + E2E | `control 176-12-precommit … --green --were-red-in 176-12-control`; `gates`; `e2e 176-12-close --same-projects-as 176-11-close …` | ✅ | ⬜ pending |
| 176-13-01 | 13 | 12 | NOM-02 | T-176-48 | the block is deleted only on a finding whose four points are held | source assertion + E2E controls (red) | the four verdict lines of `176-D9-FINDING.md`; `control 176-13-control … --red "profile:"`; the journey's control | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-13-02 | 13 | 12 | NOM-02 | T-176-48, T-176-49, T-176-50, T-176-52 | the fixture's wait, the scan's marker and the removal in one green commit | component (red → green) + E2E of the uncommitted tree (green) | the four verdict lines again; `control 176-13-precommit … --green` against both controls; the one-commit check | ✅ | ⬜ pending |
| 176-13-03 | 13 | 12 | NOM-02 | T-176-51 | a shared key removed only with no reader | catalogue + gates + E2E | the key script, the key type, `gates`; `e2e 176-13-close --same-projects-as 176-12-close …`; no formatting-error line in the run's log | ✅ | ⬜ pending |
| 176-14-01 | 14 | 13 | NOM-01, NOM-07, TASK-01 | T-176-80 | nothing red committed | E2E control of the uncommitted tree (red) | `control 176-14-control … --red "home:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-14-02 | 14 | 13 | NOM-01, NOM-07, TASK-01 | T-176-55, T-176-56, T-176-79 | a closed entry announced with its reason; the home of an entity that has a nomination untouched | component (red → green) | the home's test with the no-nomination cases and the unchanged existing ones; the former helper identical to HEAD; the page uncommitted | ✅ (cases new) | ⬜ pending |
| 176-14-03 | 14 | 13 | NOM-01, NOM-07, TASK-01 | T-176-80 | the page committed with its tests | E2E of the uncommitted tree (green) + gates + E2E | `control 176-14-precommit … --green --were-red-in 176-14-control` with the page uncommitted; the one-commit check; `gates`; `e2e 176-14-close --same-projects-as 176-13-close …` | ✅ | ⬜ pending |
| 176-15-01 | 15 | 14 | NOM-01, NOM-07, TASK-01 | T-176-57 | nothing red committed | E2E controls of the uncommitted tree (red) | `control 176-15-control … --red "home: with"`; the journey's control | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-15-02 | 15 | 14 | NOM-01, NOM-07, TASK-01 | T-176-53, T-176-54, T-176-87, T-176-88 | nothing of the complete state from an unknown one; no second rule in the page; a closed entry announced with its reason | component (red → green) | the home's test, the negative search for the former flags, the helper absent; the page uncommitted | ✅ (rewritten) | ⬜ pending |
| 176-15-03 | 15 | 14 | NOM-01, NOM-07, TASK-01 | T-176-57 | the page committed with the journey's changed expectations, the fixture and the spec — one commit | E2E of the uncommitted tree (green) + gates + E2E | `control 176-15-precommit … --green` against both controls with the page uncommitted; the one-commit check; `gates`; `e2e 176-15-close --same-projects-as 176-14-close …` | ✅ | ⬜ pending |
| 176-16-01 | 16 | 15 | NOM-07, TASK-01 | T-176-61 | nothing red committed | E2E controls of the uncommitted tree (red) | `control 176-16-control … --red "menu:"`; the journey's control | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-16-02 | 16 | 15 | NOM-07, TASK-01 | T-176-58, T-176-59, T-176-60 | a closed item announced; the shared item component untouched; the logout rule over the tasks | component (red → green) | the menu's and the logout button's tests, the comparison with the base commit, the whole unit suite, svelte-check | ✅ (rewritten) | ⬜ pending |
| 176-16-03 | 16 | 15 | NOM-07, TASK-01 | T-176-61, T-176-85 | the menu and the logout button committed with the specs | E2E of the uncommitted tree (green) + gates + E2E | `control 176-16-precommit … --green` against both controls with the components uncommitted; the one-commit check; `gates`; `e2e 176-16-close --same-projects-as 176-15-close …` | ✅ | ⬜ pending |
| 176-17-01 | 17 | 16 | TASK-01 | T-176-65 | nothing red committed | E2E controls of the uncommitted tree (red) | `control 176-17-control … --red "continue:"`; the journey's control | ✅ (tests new, uncommitted) | ⬜ pending |
| 176-17-02 | 17 | 16 | TASK-01 | T-176-62, T-176-63, T-176-64 | a target read after the save; none after a failed save; no rule of a page's own | component (red → green) | the profile's and the question page's tests, the negative search for the former routing values, the whole unit suite, svelte-check | ❌ W0 (the question page's test) | ⬜ pending |
| 176-17-03 | 17 | 16 | TASK-01 | T-176-65, T-176-86 | the three pages committed with the specs | E2E of the uncommitted tree (green) + gates + E2E | `control 176-17-precommit … --green` against both controls with the pages uncommitted; the one-commit check; `gates`; `e2e 176-17-close --same-projects-as 176-16-close …` | ✅ | ⬜ pending |
| 176-18-01 | 18 | 17 | NOM-01, NOM-02 | T-176-66, T-176-70 | a scan sees the state it is counted for | E2E of the uncommitted tree (green) | `assert:a11y-scan-wiring`; `control 176-18-a11y-precommit --project contestant-a11y-scan --setup data-setup-base … --green` | ✅ | ⬜ pending |
| 176-18-02 | 18 | 17 | NOM-01, NOM-02 | T-176-66 to T-176-70 | no spec with its own axe gate; the lock restored; a violation fixed in the surface | gates + E2E of the uncommitted tree (green) | the wiring gate and its control; `control 176-18-scan-precommit … --green` | ✅ | ⬜ pending |
| 176-18-03 | 18 | 17 | NOM-01, NOM-02 | T-176-66 | the scan counts pinned | gates + E2E | `gates`; `e2e 176-18-close … --except contestant-a11y-scan=2 … --expect-title-count "perm-no-nomination::axe accessibility scan=12"` | ✅ | ⬜ pending |
| 176-19-01 | 19 | 18 | all four | T-176-73 | the docs and skills state the tree as it is | docs gate + source assertion | `validate:links --check`, the content searches, the skill audits before and after, `format:check`, `lint:check` | ✅ | ⬜ pending |
| 176-19-02 | 19 | 18 | all four | T-176-71, T-176-72, T-176-75 | one tree; no reset beside a run; no secret printed | gates + integration + E2E + two batches | `gates 176-19-final`; both `e2e 176-19-final` comparisons; `determinism … --runs 3` twice; `scope`; `hygiene` | ✅ | ⬜ pending |
| 176-19-03 | 19 | 18 | all four | T-176-74 | every accepted residual is a filed todo; a withdrawn decision is recorded as withdrawn | source assertion | the todo checks | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Phase Requirements → Test Map

| Req / criterion | Behaviour | Test type | Where |
|-----------------|-----------|-----------|-------|
| NOM-01 · C1 | an entity with no nomination loads: no sign-out, no question read | unit | `ENTITY/layout.server.test.ts` (176-06) |
| NOM-01 · C1 | a candidate and a party with no nomination stay signed in on their own home | E2E | the `dataset:` tests (176-07) |
| NOM-01 · C1 | "Define nomination" first, incomplete; complete once a nomination exists; the rest follow | E2E + component + unit | the `home:` tests, the scripts-disabled one among them (176-14, 176-15); `ENTITY/page.svelte.test.ts`; `TASK_STATE_CASES` (176-03) |
| NOM-02 · C2 | the nominations in a view of their own, with the parent and the real state | E2E + component + pgTAP + integration | the `nominations:` tests and the view's test (176-12); the function's pgTAP file (176-02); the `nominations:` integration cases (176-05) |
| NOM-02 · C2 | no longer on the profile | E2E + component | the `profile:` test, the journey's step and the profile's test (176-13) |
| NOM-02 · C2 | the reusable note while nominations are locked | E2E + component | the locked `nominations:` tests (176-12); `NotEditableNote.svelte.test.ts` and the `note:` test (176-11) |
| NOM-07 · C3 | closed by URL with no nomination, for both types; open at the next load once one exists | E2E + unit | the `gate:` tests and the group load's tests (176-08) |
| NOM-07 · C3 | closed from home and from the menu | E2E + component | the `home:` and `menu:` tests (176-14, 176-15, 176-16); the page's and the menu's tests |
| NOM-07 · C3 | the questions do not wait for the profile | E2E + component | the `questions:` tests and the layout's rewritten case (176-09); the `home:` and `menu:` tests of an entity with required info missing |
| NOM-07 · C3 | the preview closed until both are filled; a navigation inside the application to a closed preview refused by the server; open on the click after the last save | E2E + unit | the two `preview:` tests — by URL, and by a click a stale browser still offers — and the two `holds:` tests; the helper's and the preview load's tests (176-10) |
| TASK-01 · C4 | one derived state with the tasks and the next step | unit | `TASK_STATE_CASES` (176-03); the context's cases (176-06) |
| TASK-01 · C4 | five Continue buttons read it; the list and the targets cannot disagree | E2E + component + unit | the `continue:` and `holds:` tests (176-17); the home's main action (176-15); the view's button (176-12); the five case tables (176-03); the search that each page calls its one function (176-17 Task 3) |
| TASK-01 · C4 | a target that the save cannot empty | component | the question page's emptied-list case (176-17) |
| D-09 · OD08-D9 | the log line's cause confirmed in the application before any plan changes the block that logs it, and the block deleted only on that finding | reading through the wrapper + source assertion | `176-D9-FINDING.md`, four verdict lines (176-01 Task 3); read again before the deletion and in its verify chain (176-13 Tasks 1, 2) |
| D-13 | neither new load reads a `url` or `route` property | unit | the two tracking tests (176-08, 176-10) |
| D-16 · T-6 | the lists are empty with no selected election; `profileComplete` false for no nomination | unit | `contestantContext.svelte.test.ts` (176-06) |
| D-19 · OD08-D8 | seven states in both themes through the shared gate | E2E | the scan entries (176-18) |
| D-20 | the logout rule over the tasks; the journey's two logout steps unchanged | component + E2E | `LogoutButton.svelte.test.ts` (176-16); the journey, three times in isolation (176-19) |
| D-22 | the closing gate | gates + E2E + batches | 176-19 Task 2 |
| standing rule | every new key in seven locales | lint + script | the key script and `assert:i18n-catalog-namespaces` (176-04) |
| standing rule | the new screens fit 320 and 390 px | E2E | the `phone:` tests (176-18) |
| C5 · E2E-03 | the full suite green | E2E | every full run from `176-05-close` to `176-19-final`, each with every earlier project at its total |

## The threats the phase must cover, and the test that holds each

| Threat | Plan · Threat ID | Named test |
|--------|------------------|-----------|
| any signed-in user reading any entity's unconfirmed nominations through a definer function | 176-02 · T-176-04 | the pgTAP file's three "not yours" cells with equal answers |
| the function returning a parent's unpublished columns, or `created_by` | 176-02 · T-176-05, T-176-08 | the key-set cells of an element and of `parent` |
| a parent's editor learning another party's name through its child | 176-02 · T-176-06 | the cell "a parent's editor asking for its child gets `NULL`" |
| `anon` executing the function | 176-02 · T-176-09 | the `42501` cell; the unchanged `anon` census string |
| a refused read shown as "no nomination" | 176-05 · T-176-16; 176-12 · T-176-44 | the parse's and the writer's three-outcome cases; the view's `undefined`-list case |
| every question of the project asked of an entity with no nomination | 176-06 · T-176-20 | the load's no-nomination case; the context's no-election case |
| one entity's questions or counts shown on another | 176-06 · T-176-22 | the context's case with a data root that holds unscoped questions; the store-holds-another-entity case |
| a page opened for an entity with no nomination by editing a request | 176-08 · T-176-30 | the group load's server and tracking tests; the `gate:` tests |
| an unfinished profile previewed, or the click after the last save refused | 176-10 · T-176-35, T-176-37 | the helper's cases; the `preview:` test of a stale click; the `holds:` test that saves in the browser and clicks at once |
| one request answered from another's rows, through a data root kept at module scope on the server | 176-10 · T-176-76 | the two-entities case in both orders; the search for a top-level binding (PROH-176-53) |
| the server and the browser applying two rules | 176-03 · T-176-12; 176-10 · T-176-36 | the shared predicates; the helper's "no applicability rule of its own" search |
| a stored name rendered as markup | 176-12 · T-176-43; 176-14 · T-176-55; 176-15 · T-176-87 | the view's and the home's text rendering; no raw-HTML block |
| a home that says "ready" from an unknown state | 176-03 · T-176-11; 176-06 · T-176-23; 176-15 · T-176-53 | the case tables; the context's cases; the pending and scripts-disabled cases |
| a closed entry that is only dimmed | 176-14 · T-176-56; 176-15 · T-176-88; 176-16 · T-176-58 | the description assertions of the page's, the menu's and the fixtures' cases |
| a navigation after a failed save | 176-17 · T-176-63 | the failed-save cases of both pages |
| a scan counted for a state it did not see, or a spec with its own axe gate | 176-18 · T-176-66, T-176-67 | the reach markers and the pinned counts; `assert:a11y-scan-wiring` with its control |
| a project-wide lock left on by a failed test | 176-18 · T-176-68 | the `finally` and `afterEach` restores; each test's own state step |
| a test that passes once and fails when run again | 176-07 · T-176-27 | the state step every test begins with; the three isolated runs of 176-19 |
| a red test, setup or changed step committed into the serial chain | 176-07 to 176-18 · PROH-176-22 | `control … --green` on a run of the uncommitted tree before each such commit, with the run's head shown to lack the change |
| a surface committed while a committed test still expects what it replaces, so that test fails on that commit and the chain behind it does not run | 176-08 · T-176-83; 176-09 · T-176-77; 176-10 · T-176-78; 176-11 · T-176-84; 176-13 · T-176-52; 176-14 · T-176-80; 176-15 · T-176-57; 176-16 · T-176-85; 176-17 · T-176-86 | the surface held in the working tree through the pre-commit run; each such task's verify chain requires that the surface's and the spec's last commit are one, and that neither was in the commit the run was made on |
| the log line's cause deleted unseen, or read after the code had changed | 176-01 · T-176-81; 176-13 · T-176-48 | the reading at the start of the phase; four verdict lines, read by a check that exits non-zero on a point not held, in 176-01 and again before and at the deletion |
| a departure from an operator's decision built as if it had been ruled on | 176-01 · T-176-82 | the decision document read by one command with a fixed rule, in 176-01 Task 1's verify chain; a halt on a NOTE, two ticks, stray text or a tick with no stated fallback; a line for every item of sections C and D in the facts file, checked against a second reading (PROH-176-56); the owning plans' stated fallbacks |
| a verdict from a stale, partial or void run; a closing statement from several trees | 176-01 · T-176-01, T-176-02; 176-19 · T-176-71 | `176-verdict.mjs` refusing a stale head and a subset; VOID exits 3; the head comparison of the closing runs |
| a database reset under a run in flight | 176-02 · T-176-10; 176-19 · T-176-72 | the in-flight check before each direct reset; the gate driver's refusal |

## Accepted residuals (each stated by mechanism in its plan and filed as a todo in 176-19)

| Residual | Threat ID | Where recorded |
|----------|-----------|----------------|
| an entity with no nomination can write answers through the API: the gate is a rule about pages | T-176-24 | 176-06; todo for the operator |
| the browser's copy of the entity's data after an administrator's change: an entry shown open, a redirect home with nothing said | — | 176-08 (backstop), 176-10 ruling 4; todo owned by Phase 177 |
| a hosted database not reading its own write at once | — | 176-10 ruling 3 (research A8); todo for the deployment milestone |
| a project admin and a parent's editor get `NULL` from the function | — | 176-02 ruling 5 (research A7) |
| the answers-locked note is not scanned on the home, the questions list or a question page | — | 176-11 ruling 4; the standing todo annotated |

## Isolated items and their fallbacks

Three of the UI contract's proposed items depart from locked text: U-01 from the letter of roadmap criterion
4 and from D-06's first sentence, U-02 from D-06, U-08 from D-17's table. **What is true of them:** they
were shown to the operator on 2026-10-08; no ruling has been given; the plans proceed at the recommended
option on orchestrator ruling 1 and under the operator's standing convention that an unticked item means
its recommended option; and they are listed for an explicit ruling as items C1, C2 and C3 of
`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`. Each is isolated, and the plan that owns it lists every
expectation that changes if the operator overrules it, so the fallback can be applied from that text
alone: 176-01 records what the document says when the phase starts, and the owning plan reads that record
before it builds. One planning choice departs from a locked decision's plan-shape clause — item C4 — and
its fallback is of another kind.

| Item | Owner | The block | Reaches |
|------|-------|-----------|---------|
| U-01 — a save inside the questions continues the questions while one is unanswered | 176-03, ruling 1 | the first branch of `questionSaveTarget` | 176-03 (one row of `QUESTION_SAVE_CASES`); 176-17 (one component case; the `holds:` test of an answer saved while required info is missing) |
| U-02 — the questions task leads to the questions list from outside the questions | 176-03, ruling 1 | the questions task's `route` in `taskStateOf` | 176-03 (the rows whose route is the list); 176-15 (one `home:` test; the journey's steps on the questions' intro); 176-17 (the `holds:` test of the profile's save); 176-12 (the view's Continue test) |
| U-08 — the locked empty view shows the note and the empty sentence | 176-12, ruling 1 | one condition in the nominations view | 176-12 (one component case; one `nominations:` test); 176-18 (the content of one scan entry and one phone-width check) |
| the dataset before the screens, and a full run at the close of every surface plan — a departure from D-21's plan-shape clause, which is not amended (item C4) | 176-07, ruling 1; read by 176-01 Task 1 | the order of plans 176-07 to 176-18 | **Not a move: a re-plan of plans 176-07 to 176-18.** 176-07 cannot go behind the screens unchanged — plans 176-08 to 176-17 add tests to its spec, register on its composition root, call its state steps, run its project and chain their full runs from its close. Under D-21 as written the screens are built against component and server tests alone, the dataset, the spec, the fixtures and the scans become one late plan whose tests can only be shown green, and the suite is run once; every red control is lost. The re-plan is not written; 176-01 stops the phase when item C4 is ruled that way |

## Plan size

Four plans list fifteen files or more, each with a scope note in its own text: 176-05 (16 — six are test
fixtures whose only change is a shape), 176-06 (15 — seven are one catalogue file per locale), 176-11 (15 —
one replacement made in four pages) and 176-13 (17 entries, 24 files — seven are locale directories with the
same keys removed from two files each). 176-04 lists twelve entries that are about thirty-three files, the
same edit in seven locales. No plan exceeds three tasks.

Projected cost, in calibrated tokens against a budget of 100000: 176-01 68000 · 176-02 60000 · 176-03 60000 ·
176-04 60000 · 176-05 85000 · 176-06 85000 · 176-07 90000 · 176-08 90000 · 176-09 50000 · 176-10 88000 ·
176-11 80000 · 176-12 100000 · 176-13 78000 · 176-14 72000 · 176-15 85000 · 176-16 85000 · 176-17 100000 ·
176-18 85000 · 176-19 85000. Two plans were split at the revision of 2026-10-09 so that none is over: the
questions' and the preview's rules (176-09, 176-10), and the home of an entity without and with a nomination
(176-14, 176-15). 176-12 and 176-17 stay at the budget without headroom: each is one screen's, or one
rule's, uncommitted cycle, and no part of either can be moved without breaking that cycle or landing in a
plan that has no room.

---

## Wave 0 Requirements

Files and facts that must exist before the tasks that rely on them; each is created or measured by the task
named.

- [ ] Phase 175 closed and verified; `176-BASE`, `176-BASELINE`, `176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs` — 176-01 Task 1
- [ ] the names expected from Phase 175's plans 11 to 13, confirmed on the tree — 176-01 Task 2 (and again in 176-18 Task 1)
- [ ] every item of the operator's decision document under its sections C and D, read by the fixed rule with no halt, and recorded in `176-BASELINE-FACTS.md` — 176-01 Tasks 1 and 2
- [ ] `176-D9-FINDING.md` with four `held` verdict lines — 176-01 Task 3
- [ ] the function's pgTAP file, numbered one above the highest on the tree — 176-02 Task 1
- [ ] `unanswered.test.ts`, `taskState.test.ts` — 176-03
- [ ] `entityNominations.test.ts` — 176-05 Task 1
- [ ] the dataset's template, setup and teardown, the state steps and the spec's first tests; a template whose entities have no nomination shown to seed — 176-07
- [ ] the group load's server and tracking tests — 176-08 Task 2
- [ ] `previewGate.test.ts`, the preview load's server and tracking tests — 176-10 Task 2
- [ ] `NotEditableNote.svelte.test.ts` — 176-11 Task 1
- [ ] `nominations/page.svelte.test.ts` and `contestantNominationsPage.fixture.ts` — 176-12
- [ ] `questions/[questionId]/page.svelte.test.ts` — 176-17 Task 2

No framework is installed.

---

## Manual-Only Verifications

Every behaviour the phase's criteria name has automated verification. Five reads are left to a person by the
UI contract — each lifted into a plan's `must_haves` as `verification: backstop` and filed as one todo by
176-19 Task 3. None is a gate:

| Read | Plan |
|------|------|
| the new sentences and task labels in seven locales at 320px, without clipping or overlap | 176-04 |
| an entry the browser shows open after an administrator's change | 176-08 |
| focus after accepting the terms of use at a closed URL | 176-08 |
| the longest card label in any locale at 320px | 176-12 |
| a greeting with a long party name at 320px | 176-15 |

One review is filed as a todo and is not a gate: a native speaker's reading of the new strings in `da`, `et`,
`fi`, `fr`, `lb` and `sv`.

Assumptions carried, each with the task that tests it: A-175 — Phase 175's last three plans land under the
names used (176-01 Task 2, 176-18 Task 1); A-S1 — a data root can be built in a server load (176-10 Task 2,
with its fallback); research A1 — the application's loads behave as the scratch app's did (the `gate:` and
`preview:` tests and the `holds:` click test); research A2 and A3 — the cause of the formatting-error line (176-01 Task 3); research A6 —
a template whose entities have no nomination seeds (176-07 Task 1); research A9 — the lifted filters compute
what the context computed (the context's unchanged cases, 176-06 Task 2).

The code review checklist (`.agents/code-review-checklist.md`) is walked inside every plan that adds code —
its Supabase Backend section in 176-02, its Supabase Adapter section in 176-05, its tracking-events item
wherever a function a user can perform is added — and once more over the whole phase diff in 176-19 before
the closing runs start, so that no closing run is made twice for a finding.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 300s per task for its own checks; long runs in the background
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

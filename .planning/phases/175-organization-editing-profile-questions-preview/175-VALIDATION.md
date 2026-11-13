---
phase: "175"
slug: "organization-editing-profile-questions-preview"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-08"
---

# Phase 175 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Thirteen plans in eleven waves, 35
> tasks, all automated: no task is a checkpoint. Every task has a verify command with a stated failing
> direction. Where the project's precedent is test-first, the check is observed red before the change
> that turns it green and the red is kept as evidence: pgTAP cells against the applied schema, unit and
> component cases in a JSON report with the head it was taken on, and the new E2E spec's key assertions
> in a control run of an **uncommitted** tree.
>
> **No red E2E test is ever committed.** A new spec test, a new link of the chain and a moved scan helper
> exist in the working tree alone until a run of that tree, made directly through
> `tests/scripts/e2e-run.sh`, has shown them green; the suite is green at every commit of the phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | pgTAP (`supabase test db`); Vitest (the frontend, `packages/app-shared`, `packages/dev-seed`, the tests' own utilities); Playwright through `tests/scripts/e2e-run.sh`; the gated writer integration test against the local stack |
| **Config files** | `apps/supabase/supabase/tests/database/*.test.sql`, the per-workspace Vitest configs, `tests/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run commands** | `yarn workspace @openvaa/supabase test:db` (after `yarn db:reset` and `yarn db:types`) · `yarn workspace @openvaa/frontend vitest run <path filter>` · `yarn workspace @openvaa/dev-seed test:unit` · `yarn workspace @openvaa/app-shared test:unit` · `yarn workspace @openvaa/frontend check` |
| **Full suite commands** | on a committed tree: `bash .planning/phases/175-organization-editing-profile-questions-preview/175-gates.sh <label> [--rows <names>]` (fourteen rows by default) then `bash …/175-e2e.sh <label> [--project <name>] [--require-project <name>]` (one run through `tests/scripts/e2e-run.sh --no-db-reset`); at the close `tests/scripts/determinism-batch.sh --runs 3 --project perm-organization-editing --ledger-dir tests/e2e-runs/175-determinism/<label>` |
| **Runs of an uncommitted tree** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/175-e2e/<label> --no-db-reset --project <name>` then `node tests/scripts/e2e-evidence.mjs <that directory>` — the drivers refuse a dirty tree, the wrapper does not, and it records the head and the worktree status the verdict reads |
| **Verdict commands** | `node …/175-verdict.mjs gates <label> [--rows <names>]` · `… e2e <label> [--allow-slice] [--same-projects-as <label-or-path> [--except <project>=<delta>]…] [--expect-project <name>]… [--expect-title-count <project>::<substring>=<n>]…` · `… control <label> --project <name> --setup <project> --dirty-only <path>… (--red <substring>… \| --green [--were-red-in <label>])` · `… determinism <ledger-dir> --project <name> --runs <n>` · `… dir <gates\|e2e\|determinism> <label>` · `… scope` · `… hygiene` |
| **Estimated runtime** | a targeted Vitest filter 10–60 s; pgTAP about 60 s after a reset of about 60–90 s; the gate set about 10–15 min; a full E2E run about 6–9 min; a one-project run of the new project about 5–8 min (it runs its dependency chain); the three-run batch about 25–40 min. Every long run is launched in the background and polled |

The three drivers are created by 175-01 Task 1. None exists before it. The first gate-set run and the first
full E2E run of the phase are 175-05's.

**The base commit is one fixed commit.** The committed file `175-BASE` holds it: the head of the baseline run
and the last commit that changed a file outside `.planning/` before the phase. Every plan reads it with
`cat`; none derives it from a plan file's history, and the file is never edited.

**The fourteen gate rows, in their fixed order:** `typecheck`, `lint`, `db-reset`, `types-regen`,
`types-clean`, `pgtap`, `sql-lint`, `integration`, `unit`, `check-frontend`, `build`, `format`, `docs-links`,
`name-gate-self-test`. Phase 174's `auth-config` row is a link of `lint` already, and its `stack` row probes
an auth configuration no file of this phase touches; `175-verdict.mjs scope` is what says so.

**The order of the database steps is fixed:** edit `schema/*.sql`; `yarn schema:regenerate` in the same
commit; the parity gate; `yarn db:reset`; `yarn db:types` on the freshly reset database and before pgTAP;
pgTAP; `yarn db:lint:sql`. Never `supabase db push`; never a hand edit of the migration or the generated
types. Every commit that changes the schema or its migration carries the `[db]` tag in its subject.

**When the database is reset, and by what.** Plans 175-02 and 175-03 reset it directly, twice each, each time
after confirming no E2E run is in flight — a `started` marker without an `ended` beside it at any depth
under `tests/e2e-runs/`, so that a determinism batch's runs are seen too. After them it is reset only by the
gate driver's `db-reset` row (175-05, 175-13) — which refuses while a run is in flight — and by the
determinism batch's own three runs (175-13). No reset runs beside an E2E run. Docker is never restarted: a
second, unrelated Supabase stack runs on this host. The `default` dataset is restored with
`yarn db:seed:default` after the last reset.

**How a run is compared with another.** `--same-projects-as` is the per-project comparison: every project has
exactly its total in the other run, except a project named in `--except`. The baseline is the run directory
`tests/e2e-runs/261008-quick-g2-g4-g6` (220 passed in 107 projects on the commit `175-BASE` names), checked
in 175-01.

**How a label is read.** A run made again is made under `<label>-r2`, `<label>-r3` and so on; a verdict given
the label reads its newest attempt and prints the directory it read. No plan picks an attempt by sorting
directory names: a verify command that needs a file of a run asks `175-verdict.mjs dir`.

**What makes a run void.** Only the wrapper's marker: status 8 with `VOID-host-suspend.txt`, or the batch's
status 6. A void run is kept and made again under the next suffix. A red run without the marker is a
failure. A did-not-run is a failure.

---

## Red first, without a red commit

The order every plan that adds E2E tests follows (175-05, 175-09, 175-10, 175-11, 175-12):

1. Fixtures and state steps are committed first. They are no test of the suite.
2. The new tests are written into the spec and left uncommitted. A copy of the spec as it is run is kept
   beside the run directory.
3. Where a surface is still to be built (175-09, 175-10, 175-11): a control run of that uncommitted tree,
   judged with `control … --red <prefix>` — the setup green, every test of the prefix failed on an
   expectation, every other test passed, the spec the only uncommitted path.
4. The surface is built, its unit and component cases red and then green, each commit made by pathspec so
   that the uncommitted spec stays out of it.
5. A second run of the uncommitted tree, judged with `control … --green [--were-red-in <the control>]`.
6. Only then is the spec committed, and the gate rows and the full run follow on the committed tree.

**What an interrupted executor leaves** is the uncommitted spec — in 175-05 the link's files, in 175-12
Task 1 the three files of the helper move — and the kept copy. The next executor goes on from the working
tree or the copy, or discards the change with `git checkout -- <the named files>` and starts that task
again. Never `git stash`. Each plan's `<uncommitted_spec>` or `<uncommitted_changes>` block names the
files and the steps between which they are uncommitted.

**Each new accepting branch of the verdict script is seen refusing** before it is relied on: the `e2e`
comparison without its exceptions and `--expect-title-count` with a false count (175-05 Task 3); a subset
gate run read as the full set (175-06); a red control offered as `--green` and as an `e2e` slice (175-09
Task 3); a three-run batch asked for four (175-13 Task 3).

**Each test of the spec sets the state it reads** through service-role state steps built in 175-09 Task 1 —
`setOrganizationState` (with `clearAnswers`), `setCandidateState`, `setAnswersLocked` — so no test depends on
one before it, and the closing gate can run the spec three times in isolation.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command.
- **After every plan (every wave):** see the run schedule below.
- **Before `/gsd-verify-work`:** the closing gate of 175-13 Task 3 on one tree — the code review checklist
  walked over the whole phase diff first, then the fourteen gate rows, one full default E2E run compared with
  the last full run and with the baseline, the new spec three times in isolation, `scope` and `hygiene`.
- **Max feedback latency:** about 300 seconds for a task's own checks; about 25 minutes for a plan that
  closes on gate rows and a full run; about 90 minutes for the closing plan.
- **Never:** a red E2E test in a commit, a retry until green, a skipped or annotated test, a status read
  through a pipe, a foreground gate-set or E2E run, a deletion under `tests/e2e-runs/`, a Docker restart, a
  database reset beside an E2E run, a read of an untracked environment file, `git add -A`, `git stash`.

### Run schedule

Plans in one wave share one working tree. The two parallel pairs (175-01 with 175-02; 175-03 with 175-04)
are in disjoint workspaces, run no workspace-wide gate, commit by pathspec, and name 175-05's runs as their
boundary proof. `packages/supabase-types/src/database.ts` is the one file a wave-mate's typecheck reads while
175-02 or 175-03 regenerates it; each of those four plans says so.

| Plan | Wave | Tasks | Gate rows at close | E2E runs | E2E comparison | Boundary proof for |
|------|------|-------|--------------------|----------|----------------|--------------------|
| 175-01 | 1 | 2 | none (static checks of the drivers; the input directory's tests; svelte-check) | none | — | — |
| 175-02 | 1 | 2 | none (parity, `db:reset`, `db:types`, pgTAP, `db:lint:sql` run directly) | none | — | — |
| 175-03 | 2 | 3 | none (the same, plus the dev-seed suite and a default seed) | none | — | — |
| 175-04 | 2 | 2 | none (key parity, the key type, svelte-check, the helpers' tests) | none | — | — |
| 175-05 | 3 | 3 | all fourteen | uncommitted, green (`175-05-precommit`); full (`175-05-close`) | every project at its baseline total; the three new projects new | 175-01 to 175-04 |
| 175-06 | 4 | 2 | `typecheck,lint,unit,check-frontend,build,format` | slice: `contestant-a11y-scan` (`175-06-a11y-slice`) | the scan project at its total in `175-05-close` | — |
| 175-07 | 5 | 3 | `typecheck,lint,integration,unit,check-frontend,build,format` | none | — | — |
| 175-08 | 6 | 3 | the seven of 175-07 plus `docs-links,name-gate-self-test` | full (`175-08-close`) | every project equal to `175-05-close` | 175-06, 175-07 |
| 175-09 | 7 | 3 | `typecheck,lint,unit,check-frontend,build,format` | uncommitted, red (`175-09-control`); uncommitted, green (`175-09-precommit`); full (`175-09-close`) | equal to `175-08-close` except the new project | — |
| 175-10 | 8 | 3 | the same six | uncommitted, red (`175-10-control`); uncommitted, green (`175-10-precommit`); full (`175-10-close`) | equal to `175-09-close` except the new project | — |
| 175-11 | 9 | 3 | the same six | uncommitted, red (`175-11-control`); uncommitted, green (`175-11-precommit`); full (`175-11-close`) | equal to `175-10-close` except the new project | — |
| 175-12 | 10 | 3 | the same six | uncommitted, green, three times (`175-12-a11y-precommit`, `175-12-voter-precommit`, `175-12-scan-precommit`); full (`175-12-close`) | equal to `175-11-close` except the new project; 18 scans | — |
| 175-13 | 11 | 3 | all fourteen | full (`175-13-final`), then the three-run batch | equal to `175-12-close`; every pre-phase project at its baseline | — |

A one-project run of `perm-organization-editing` runs what it depends on and no more: the permutation chain before it, and the projects the chain's head names — `voter-journey`, `contestant-journey`, `contestant-entity-selection`, `contestant-terms-gate-phone`, `eperm07-term-trigger` and `contestant-a11y-scan` — with their setups. The other base leaves (the cold-entry, invitation, auth-service-contract, `a11y-smoke` and remaining voter projects) and the chain's tail are outside it: only the full run on the committed tree covers them. An uncommitted run is therefore the proof for the commit of a spec and no wider, and every plan from 175-08 on that commits application code — 175-08, 175-09, 175-10, 175-11, 175-12 — closes on a full default run of its own committed tree, each compared with the full run before it: `175-05-close` → `175-08-close` → `175-09-close` → `175-10-close` → `175-11-close` → `175-12-close` → `175-13-final`.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 175-01-01 | 01 | 1 | GEN-01 | T-175-01, T-175-02, T-175-03 | no verdict from a stale, partial or void run; no key or environment file printed | source assertion | syntax checks, usage exits, `175-verdict.mjs hygiene` and `scope`, `175-BASE` equal to the baseline's head | ❌ W0 | ⬜ pending |
| 175-01-02 | 01 | 1 | GEN-01 | T-175-04 | no part writes into state its parent owns | component (red → green) | `vitest run src/lib/components/input`, svelte-check, the two JSON reports | ✅ (expectations change) | ⬜ pending |
| 175-02-01 | 02 | 1 | GEN-03 | T-175-05, T-175-06, T-175-07, T-175-08, T-175-11 | the lock binds the entity user from the setting in both directions; a missing project is locked; JSON-boolean comparison | schema workflow + pgTAP (red → green) + SQL lint | parity, `test:db`, `db:lint:sql`, the red and green logs, the types without drift | ✅ (cells re-pointed and new) | ⬜ pending |
| 175-02-02 | 02 | 1 | GEN-03 | T-175-09, T-175-10 | `short_name` frozen on a confirmed row on four tables; both lists of each registration | schema workflow + pgTAP (red → green) + SQL lint | the registrations parsed, the trigger body unchanged, `test:db`, `db:lint:sql`, the `[db]` tag on every schema commit | ✅ (cells new) | ⬜ pending |
| 175-03-01 | 03 | 2 | GEN-01 | T-175-12, T-175-13, T-175-14 | an invalid type list refused by name for every writer; the import stores nothing on an invalid member | schema workflow + pgTAP (red → green) | parity, `test:db`, `db:lint:sql`, the `skip_columns` declaration unchanged | ❌ W0 (`40-entity-type-list.test.sql`) | ⬜ pending |
| 175-03-02 | 03 | 2 | GEN-01 | T-175-14 | the generated column on nominations still refused by name | unit (red → green) | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (new fixture pair) | ⬜ pending |
| 175-03-03 | 03 | 2 | GEN-01 | T-175-15, T-175-16 | a stored colour is a hex colour or nothing, for every writer; the seed data still stores | schema workflow + pgTAP (red → green) + seed | `test:db`, `db:lint:sql`, the default seed's exit, the dev-seed suite, the `[db]` tag on every schema commit | ❌ W0 (`41-entity-color.test.sql`) | ⬜ pending |
| 175-04-01 | 04 | 2 | GEN-01, GEN-03 | T-175-18, T-175-19 | no sentence states something false of a lock or a save; no interpolated database text | catalogue parity + typecheck | the key-parity script, the regenerated key type without diff, `assert:i18n-catalog-namespaces`, svelte-check | ✅ | ⬜ pending |
| 175-04-02 | 04 | 2 | GEN-03 | T-175-20 | a name is never editable for an unknown entity; the rule reads no nominations lock | unit (red → green) | `vitest run src/lib/contestant/utils src/lib/utils/localizedText` | ❌ W0 (three helper test files) | ⬜ pending |
| 175-05-01 | 05 | 3 | GEN-01 | T-175-25 | the dataset keeps its unconfirmed rows hidden | unit | `yarn workspace @openvaa/dev-seed test:unit` (the built-ins key gate) | ❌ W0 (the template) | ⬜ pending |
| 175-05-02 | 05 | 3 | GEN-01 | T-175-21, T-175-22, T-175-23, T-175-24, T-175-60 | a prefix that overlaps no other; the settings row not replaced under a base reader; a landing test cannot pass on a selection screen; nothing red committed | config + gates + E2E of the uncommitted tree | `typecheck:tests`, `assert:a11y-scan-wiring`, the chain edges parsed; `control 175-05-precommit … --green --dirty-only tests/` | ❌ W0 (setup, teardown, the spec) | ⬜ pending |
| 175-05-03 | 05 | 3 | GEN-01 | T-175-22 | the verdict refuses what it should | gates + E2E | `gates 175-05-close`; `e2e 175-05-close --same-projects-as <baseline> …`; the two refusals | ✅ | ⬜ pending |
| 175-06-01 | 06 | 4 | GEN-03 | T-175-27, T-175-28 | no change for a caller without the prop; help, errors and required marks announced | component (red → green) | `vitest run src/lib/components/input`, svelte-check | ❌ W0 (two test files) | ⬜ pending |
| 175-06-02 | 06 | 4 | GEN-01 | T-175-26, T-175-30 | only a parsed hex colour is painted or emitted; an alert speaks its sentence | component (red → green) + gates + E2E slice | the input and error-message tests; `gates 175-06-close --rows <six>` and its refusal as the full set; `e2e 175-06-a11y-slice --allow-slice …` | ❌ W0 (two test files) | ⬜ pending |
| 175-07-01 | 07 | 5 | GEN-01, GEN-03 | T-175-31, T-175-32, T-175-33 | a property outside the type's map is never sent; a colour is hex or null; the refusal is a named result | unit (red → green) + gates | the writer's tests, `assert:adapter-casts`, `assert:project-scoped-queries`, svelte-check with the store's call site adapted | ✅ (cases new) | ⬜ pending |
| 175-07-02 | 07 | 5 | GEN-01, GEN-03 | T-175-35, T-175-36, T-175-37 | an unchanged property is never sent; a refused name costs nothing else; staged names live in memory | unit (red → green) | `yarn workspace @openvaa/frontend test:unit` | ✅ (cases new) | ⬜ pending |
| 175-07-03 | 07 | 5 | GEN-03 | T-175-34 | the database refuses a confirmed row's name and short name to its own editor | integration (the running stack) + gates | `gates 175-07-close --rows <seven>` with `integration.json` holding the five named cases, each passed | ✅ (cases new) | ⬜ pending |
| 175-08-01 | 08 | 6 | GEN-03 | T-175-39 | the frontend reads the lock the database enforces | unit (red → green) | `app-shared test:unit`, the provider's tests, the dev-seed typecheck | ✅ (cases new) | ⬜ pending |
| 175-08-02 | 08 | 6 | GEN-01, GEN-03 | T-175-40, T-175-41 | an entity is asked its own type's questions; "none" is told from "not loaded" | unit (red → green) | `yarn workspace @openvaa/frontend test:unit` | ✅ (one describe rewritten) | ⬜ pending |
| 175-08-03 | 08 | 6 | GEN-01 | T-175-38, T-175-42 | no unparsed colour reaches a `style`; the organization warning is true | unit (red → green) + gates + E2E | the colour and voter tests; `gates 175-08-close --rows <nine>`; `e2e 175-08-close --same-projects-as 175-05-close …` | ❌ W0 (two test files) | ⬜ pending |
| 175-09-01 | 09 | 7 | GEN-01, GEN-03 | T-175-47, T-175-61 | a test sets the state it reads | E2E control of the uncommitted tree (red) | `control 175-09-control … --dirty-only <spec> --red "profile:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 175-09-02 | 09 | 7 | GEN-03 | T-175-46 | the lock is right on first paint; no field for the wrong type | component (red → green) | `yarn workspace @openvaa/frontend test:unit`, svelte-check, the type-branch search | ❌ W0 (the page's test) | ⬜ pending |
| 175-09-03 | 09 | 7 | GEN-01, GEN-03 | T-175-43, T-175-44, T-175-45, T-175-47 | a refused or failed save announced in the page's own words | component (red → green) + E2E of the uncommitted tree (green) + gates + E2E | `control 175-09-precommit … --green --were-red-in 175-09-control`; the control refusing `--green`; `gates 175-09-close --rows <six>`; `e2e 175-09-close --same-projects-as 175-08-close …` | ✅ | ⬜ pending |
| 175-10-01 | 10 | 8 | GEN-01 | T-175-63 | nothing red committed | E2E control of the uncommitted tree (red) | `control 175-10-control … --dirty-only <spec> --red "questions:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 175-10-02 | 10 | 8 | GEN-01 | T-175-51, T-175-62 | "no questions" never shown to an entity that has some; the hide-if-missing warning reads the entity's own key | component (red → green) | `yarn workspace @openvaa/frontend test:unit`, svelte-check | ❌ W0 (two test files) | ⬜ pending |
| 175-10-03 | 10 | 8 | GEN-01 | T-175-63 | the tests are committed green | E2E of the uncommitted tree (green) + gates + E2E | `control 175-10-precommit … --green --were-red-in 175-10-control`; `gates 175-10-close --rows <six>`; `e2e 175-10-close --same-projects-as 175-09-close …` | ✅ | ⬜ pending |
| 175-11-01 | 11 | 9 | GEN-01 | T-175-64 | nothing red committed | E2E control of the uncommitted tree (red) | `control 175-11-control … --dirty-only <spec> --red "preview:"` | ✅ (tests new, uncommitted) | ⬜ pending |
| 175-11-02 | 11 | 9 | GEN-01 | T-175-48, T-175-49, T-175-50 | the preview's colour passes the reader; the voter's detail unchanged; no nomination graph loaded | component (red → green) | `yarn workspace @openvaa/frontend test:unit`, svelte-check, the two JSON reports | ❌ W0 (two test files) | ⬜ pending |
| 175-11-03 | 11 | 9 | GEN-01 | T-175-49, T-175-64 | the tests are committed green; a voter sees what a voter saw | E2E of the uncommitted tree (green) + gates + E2E | `control 175-11-precommit … --green --were-red-in 175-11-control`; `gates 175-11-close --rows <six>`; `e2e 175-11-close --same-projects-as 175-10-close …` | ✅ | ⬜ pending |
| 175-12-01 | 12 | 10 | GEN-01 | T-175-53, T-175-65 | no spec builds its own axe gate; the moved helpers are committed green | gates + E2E of the uncommitted tree (green) | `assert:a11y-scan-wiring` with its control; `control 175-12-a11y-precommit --project contestant-a11y-scan --setup data-setup-base … --green` | ❌ W0 (the module) | ⬜ pending |
| 175-12-02 | 12 | 10 | GEN-01, GEN-03 | T-175-54, T-175-55, T-175-65 | an unconfirmed organization is not public; each test sets its own state | E2E of the uncommitted tree (green) | the titles and the steps of organization B's test searched for; `control 175-12-voter-precommit … --green` | ✅ | ⬜ pending |
| 175-12-03 | 12 | 10 | GEN-01, GEN-03 | T-175-52, T-175-54, T-175-65 | a scan sees the state it is counted for | E2E of the uncommitted tree (green) + gates + E2E | `control 175-12-scan-precommit … --green`; `gates 175-12-close --rows <six>`; `e2e 175-12-close … --expect-title-count "perm-organization-editing::axe accessibility scan=18"` | ❌ W0 (the geometry fixture) | ⬜ pending |
| 175-13-01 | 13 | 11 | GEN-01, GEN-03 | T-175-58 | the docs and skills state the lock, the frozen columns and the validated columns as they are | docs gate + source assertion | `validate:links --check`, the content searches, the skill audit before and after | ✅ | ⬜ pending |
| 175-13-02 | 13 | 11 | GEN-01, GEN-03 | — | every accepted residual is a filed todo | source assertion | the todo checks | ✅ | ⬜ pending |
| 175-13-03 | 13 | 11 | GEN-01, GEN-03 | T-175-56, T-175-57, T-175-59 | one tree; no reset beside a run; no secret read or printed | gates + integration + E2E + batch | `gates 175-13-final`; both `e2e 175-13-final` comparisons; `determinism … --runs 3` and its refusal of `--runs 4`; `scope`; `hygiene` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Phase Requirements → Test Map

| Req / criterion | Behaviour | Test type | Where |
|-----------------|-----------|-----------|-------|
| GEN-01 · C1 | an organization user lands on its pages, edits and saves its profile; a reload shows it | E2E | `perm-organization-editing.spec.ts`, `dataset:` and `profile:` tests (175-05, 175-09) |
| GEN-01 · C1 | the voter app displays what was saved — colour, answers, name, short name (as the avatar's initials), logo | E2E | the three `voter:` tests (175-12) |
| GEN-01 · C1 · D-19 | organization B's saved name and short name after a reload, in its own preview's header and tag line, and to a voter once it is confirmed | E2E | the `voter:` test of organization B (175-12 Task 2), over the tag line of 175-11 |
| GEN-01 · C2 | the organization answers the questions addressed to organizations, with progress; not asked a candidate's | E2E + unit | the `holds:` test (175-10); the context's scope cases (175-08) |
| GEN-01 · C3 | the preview shows its own tabs, no `children` tab, the tag line and the adjusted colour | E2E + component | the `preview:` test (175-11); `EntityDetails.svelte.test.ts`, `preview/page.svelte.test.ts` (175-11); the scan of the preview (175-12) |
| GEN-03 · C4 | name and abbreviation as multilingual fields; editable while unconfirmed and answers not locked; locked once confirmed | E2E + component + unit | the `profile:` tests (175-09); `profile/page.svelte.test.ts`; `nameRule.test.ts` |
| GEN-03 · C4 | the same rule for a candidate's first and last name | E2E + component | the candidate's `profile:` test; the page's test |
| GEN-03 · C4 | `short_name` frozen on confirmation on four tables; `entity.edit_immutable` corrects | pgTAP + integration | `19-entity-immutability.test.sql` (175-02); the integration cases (175-07) |
| GEN-03 · C4 | a name refused after a mid-session confirmation, explained by the page | E2E + component + unit | the refused-save test and scan entry 7 (175-12); the page's and the store's cases |
| D-10 (for 176, 177) | the lock enforced from the setting; fail closed on a missing project, open on a missing row or key; a project editor may set it | pgTAP | `23-nominations-write.test.sql` (175-02) |
| D-10 | `nominationsLocked` follows the setting; the stored key survives the parse and the read | unit | `contestantContext.svelte.test.ts`, `storedSettings.schema.test.ts`, the provider's tests (175-08) |
| D-18 | `entity_type` validated and carried by the import on two tables | pgTAP + unit | `40-entity-type-list.test.sql`; dev-seed's key tests (175-03) |
| Ruling 3 | a stored colour is a colour; the reader drops what it cannot parse; the app sends a hex only | pgTAP + unit | `41-entity-color.test.sql` (175-03); `ensureColors.test.ts` (175-08); the writer's and the kind's cases (175-07, 175-06) |
| D-13 | no questions entry and a neutral page for a known zero; nothing flashes for an entity that has questions | component + E2E | `questions/layout.svelte.test.ts`, `ContestantNav.svelte.test.ts`; the `questions:` test (175-10) |
| D-20 | nine states in both themes through the shared gate | E2E | the scan entries (175-12) |
| D-22 | each key assertion red before its surface, with nothing red committed | E2E of an uncommitted tree | the controls of 175-09, 175-10, 175-11 and the pre-commit runs of 175-05 and 175-09 to 175-12 |
| C5 · E2E-03 | the candidate journey unchanged; the full suite green | E2E | every full run from `175-05-close` to `175-13-final`, each with every pre-existing project at its total |

## The threats the phase must cover, and the test that holds each

| Threat | Plan · Threat ID | Named test |
|--------|------------------|-----------|
| a locked project's nominations written through the API after the lock moved | 175-02 · T-175-05 | pgTAP file 23: both directions for the update, the parent insert and the own insert |
| the lock misread for a value of the wrong JSON type | 175-02 · T-175-06 | pgTAP file 23, the lock-source cases |
| a confirmed entity changing its abbreviation through the API | 175-02 · T-175-09, T-175-10 | pgTAP file 19, cell 1 on each of four tables; the integration case through the writer |
| a misspelt type list hiding a question from everyone | 175-03 · T-175-12 | pgTAP file 40, the refusal cases |
| stored CSS injection through an entity's colour | 175-03 · T-175-15; 175-06 · T-175-26; 175-07 · T-175-32; 175-08 · T-175-38; 175-11 · T-175-48 | pgTAP file 41 (the injection shapes); `Input.color.svelte.test.ts`; the writer's colour cases; `ensureColors.test.ts`; the preview page's colour case |
| the writer sending a column the grant admits and the app may not write | 175-07 · T-175-31 | `supabaseDataWriter.test.ts`, the closed-map cases |
| a client that believes the entity unconfirmed saving a new name | 175-07 · T-175-34; 175-09 · T-175-43 | the integration cases on a confirmed row; the refused-save E2E test (175-12) |
| the database's raised text shown to the user | 175-07 · T-175-33; 175-09 · T-175-44 | the writer's refusal case; the page's "no string from a rejection" case |
| a name field editable for an unknown entity | 175-04 · T-175-20; 175-09 · T-175-46 | `nameRule.test.ts`; the page's unknown-entity case |
| an organization asked a candidate's questions | 175-08 · T-175-40 | the rewritten scope describe of `contestantContext.svelte.test.ts` |
| the screen saying unlocked while the database is locked | 175-08 · T-175-39 | the schema's and the provider's key cases |
| a prop on the voter's entity detail changing what voters see | 175-11 · T-175-49 | the "without the prop" cases; the voter journey green in the pre-commit run and the full run |
| a scan counted for a state it did not see, or a spec with its own axe gate | 175-12 · T-175-52, T-175-53 | the reach markers and the pinned scan count; `assert:a11y-scan-wiring` with its control |
| a test that passes once and fails when run again | 175-09 · T-175-61; 175-12 · T-175-54 | the state step every test begins with; the three isolated runs of 175-13 |
| a red test, setup or moved helper committed into the serial chain | 175-05 · T-175-60; 175-09 · PROH-175-36; 175-10 · T-175-63; 175-11 · T-175-64; 175-12 · T-175-65 | `control … --green` on a run of the uncommitted tree before each such commit, with the run's head shown to lack the change |
| a verdict from a stale, partial or void run; a closing statement from several trees | 175-01 · T-175-01, T-175-02; 175-13 · T-175-56 | `175-verdict.mjs` refusing a stale head and a subset; VOID exits 3; each accepting branch seen refusing |
| a database reset under a run in flight | 175-02 · T-175-11; 175-13 · T-175-57 | the in-flight check, at every depth, before each direct reset; the gate driver's refusal |
| a script reading an environment file or printing the stack's keys | 175-01 · T-175-03; 175-13 · T-175-59 | `175-verdict.mjs hygiene`, at 175-01, 175-05 and on the closing tree |

## Accepted residuals (each stated by mechanism in its plan and filed as a todo in 175-13)

| Residual | Threat ID | Where recorded |
|----------|-----------|----------------|
| a project editor can lock and unlock nominations | T-175-08 | 175-02 (OD08-B2 (a)); the comment in the policy file; todo |
| `_bulk_upsert_record` appends an item key unquoted, within the caller's own grants | T-175-17 | 175-03; todo |
| `Input` throws when handed a reactive proxy as its value | T-175-29 | 175-06; the UI contract's shared premises |
| `name` and `short_name` have no database shape check | — | 175-03 ruling 4; todo |

## Isolated items and their fallbacks

Four of the UI contract's proposed items depart from a locked decision. Each is isolated, and the plan that
owns it lists every expectation that changes if the operator overrules it, so the fallback can be applied
from that text alone:

| Item | Owner | Reaches |
|------|-------|---------|
| U-05 — a candidate's names required while editable | 175-04, ruling 2 | 175-08 Task 2 (one case), 175-09 Task 2 (two cases) |
| U-12 — a refused name does not cost the rest of the save | 175-07, ruling 1 | 175-04 (two strings in seven locales), 175-12 Task 2 (the refused-save test's last expectation) |
| U-19 — the voter filter's organization arm | 175-08, ruling 2 | 175-04 (one descriptor member), 175-09 and 175-10 (reads that then read `false`) |
| U-30 — a candidate in the dataset | 175-05, ruling 2 | 175-09, 175-10, 175-11 (one test each), 175-12 (two scan entries and one phone check: 14 scans), 175-13 (the count in two verdicts) |

## Plan size, accepted at the plan re-check

Five plans list fifteen files or more: 175-03 (19), 175-02 (18), 175-08 (18), 175-04 (17) and 175-06 (16).
The orchestrator accepted the counts at the plan re-check (scope sanity, closed by ruling): the calibrated
estimates are within budget at high confidence, no plan exceeds three tasks, and each plan's scope note
explains its count. No split is asked for, and the acceptance is recorded here alone.

---

## Wave 0 Requirements

Files and facts that must exist before the tasks that rely on them; each is created or measured by the task
named.

- [x] `175-BASE`, the fixed base commit — committed with the plans
- [ ] `175-gates.sh`, `175-e2e.sh`, `175-verdict.mjs`, and the checked baseline — 175-01 Task 1
- [ ] `apps/supabase/supabase/tests/database/40-entity-type-list.test.sql` and `41-entity-color.test.sql` — 175-03 Tasks 1 and 3
- [ ] the replacement negative-control fixtures of dev-seed's deny list — 175-03 Task 2
- [ ] `localizedText.test.ts`, `nameRule.test.ts`, `entityDescriptor.test.ts` — 175-04 Task 2
- [ ] the dataset's template, setup and teardown, and the spec's first describe; three sessions proven against rows a permutation template seeded — 175-05
- [ ] `Input.requiredLocale.svelte.test.ts`, `Input.described.svelte.test.ts`, `Input.color.svelte.test.ts`, `ErrorMessage.svelte.test.ts` — 175-06
- [ ] one measurement of the error a signed-in editor's update of a confirmed name returns (assumption A2) — 175-07 Task 3
- [ ] `ensureColors.test.ts` (no test exists under `lib/utils/color/`) and `nominationAndQuestionState.svelte.test.ts` — 175-08 Task 3
- [ ] the state steps of the spec and `profile/page.svelte.test.ts` — 175-09 Tasks 1 and 2
- [ ] `questions/layout.svelte.test.ts`, `ContestantNav.svelte.test.ts` — 175-10 Task 2
- [ ] `EntityDetails.svelte.test.ts`, `preview/page.svelte.test.ts` — 175-11 Task 2
- [ ] `tests/tests/utils/contestantAxeScan.ts` and `tests/tests/fixtures/shared/pageGeometry.fixture.ts` — 175-12

No framework is installed.

---

## Manual-Only Verifications

Every behaviour the phase's criteria name has automated verification. Seven reads are left to a person by the
UI contract — each lifted into a plan's `must_haves` as `verification: backstop` and filed as one todo by
175-13 Task 2. None is a gate:

| Read | Plan |
|------|------|
| the new sentences in seven locales at 320px, without clipping or overlap | 175-04 |
| the platform colour picker opened from the keyboard, in Chromium and in WebKit | 175-06 |
| the focus ring on the swatch's wrapper, in both themes | 175-06 |
| a failed re-read of the entity list after a successful save | 175-09 |
| a long locked name at 320px | 175-09 |
| a long party name and a long short name in the preview at 320px | 175-11 |
| the in-row labels in every locale at 320px | 175-13 |

One review is filed as a todo and is not a gate: a native speaker's reading of the new strings in `da`, `et`,
`fi`, `fr`, `lb` and `sv`.

One assumption is carried from the UI contract and tested at execution: that `InputProps` takes a fifteenth
member without a "union too complex" error (175-06, ruling 2, with its fallback).

The code review checklist (`.agents/code-review-checklist.md`) is walked inside every plan that adds code —
its Supabase Backend section in 175-02 and 175-03, its Supabase Adapter section in 175-07, its
tracking-events item wherever a function a user can perform is added — and once more over the whole phase
diff in 175-13 before the closing runs start, so that no closing run is made twice for a finding.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 300s per task for its own checks; long runs in the background
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

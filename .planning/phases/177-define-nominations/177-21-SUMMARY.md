---
phase: 177-define-nominations
plan: 21
subsystem: docs-skills-todos-closing-gate
tags: [docs, skills, todos, closing-gate, e2e, determinism, hand-over, NOM-03, NOM-04, NOM-05, NOM-06, NOM-08]
status: complete
requires:
  - "177-20: the full run 177-20-close (444 of 444, 116 projects) and the state table of its summary"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs, 177-BASE, 177-BASELINE"
  - "177-21-INPUTS.md: the orchestrator's list of what plans 01 to 20 left for this plan"
provides:
  - "docs: the developers' page contestant-app/defining-nominations, in the navigation; the home's page, the backend page, the app-settings page, the routing and contexts pages and the pre-registration page corrected; the Publishers' Guide states the one-constituency limitation"
  - "READMEs: the contestant routes, dev-seed, supabase, tests and contestant components READMEs as the tree is"
  - "skills: database (SKILL.md, schema-reference.md, rls-policy-map.md), data (SKILL.md, object-model.md), components (SKILL.md, context-reactivity.md), each count from a command"
  - "source comments and docstrings corrected: the preview's load, two SQL comments [db], the voter's two selection pages, the two selectors, DataRoot's provide methods, three more"
  - "todos: three closed, one re-scoped, twelve annotated, thirteen filed"
  - "runs: 177-gates/177-21-docs, 177-gates/177-21-final (14 rows at 0), 177-e2e/177-21-final (444 of 444), 177-determinism/177-21-final (three runs)"
affects: [177.1, 178, 179]
tech-stack:
  added: []
  patterns:
    - "a count in a skill is stated with its date and its command in the skill's freshness record; where a description will do, no count is written"
    - "a docs page that a README links to is staged before generate:docs runs: its link validation reads tracked files only, and a failed validation leaves the generated pages unformatted"
key-files:
  created:
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/defining-nominations/+page.md"
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md"
    - "apps/docs/src/lib/navigation.config.ts"
    - ".claude/skills/database/SKILL.md"
    - ".claude/skills/database/schema-reference.md"
    - ".claude/skills/database/rls-policy-map.md"
    - ".claude/skills/data/object-model.md"
    - ".claude/skills/components/SKILL.md"
    - "tests/README.md"
    - "packages/dev-seed/README.md"
    - "apps/supabase/supabase/schema/104-nominations.sql"
    - "apps/supabase/supabase/schema/011-validation-functions.sql"
decisions:
  - "five commits for Task 1 where the plan writes three: the two SQL comments are a [db] commit with the regenerated migration, and the source comments the orchestrator's list names are a commit of their own"
  - "the dated tables of the database skill's freshness record are left as records; a new entry of 2026-10-11 supersedes their rows"
  - "the standing dangling citations of the skill audits are not repaired: the audits' status is no worse and no finding is new"
requirements-completed: [NOM-03, NOM-04, NOM-05, NOM-06, NOM-08]
metrics:
  started: "2026-10-11T13:16:33Z"
  completed: "2026-10-11T14:38Z"
  duration: "about 1 hour 22 minutes, of which about 48 are the three closing runs (the gate set 3.4, the full run 11.8, the batch 32.5) and about 6 the docs gate rows and the pre-commit checks"
  tasks: 3
  files: 66 # git diff --name-only a12de2ff0..85796a39b: 37 outside .planning, 29 todos
actuals:
  tokens: 92580 # chars/4 over git diff a12de2ff0..85796a39b (370,319 characters: the whole plan, the todos included, before this file; 256,702 of them outside .planning, where long table lines are replaced whole)
  tasks: 3
  commits: 6 # git rev-list --count a12de2ff0..HEAD, measured before this file was committed
plan_head_before: a12de2ff0514a350f4be48737cf13aa8de0b76ac
plan_head_after: 85796a39b0d3c042628575e2896e548060ac284f
---

# Phase 177 Plan 21: The Phase Closed — the Docs, the Skills and the Todos Say What the Tree Does, and One Tree Is Green under Every Gate — Summary

The nomination editor, the four election types, the write function and the policies behind them are described where a developer, an administrator and an agent look for them, each sentence checked against the code it describes; every item the earlier plans left is a corrected sentence, a closed, re-scoped, annotated or filed todo, or named below as not disposed of; and one code head, `f71107820`, carries all fourteen gate rows, the full suite and three isolated runs of the nominations spec.

**`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `CLAUDE.md`, `177-DISPATCH.md`, `177-21-INPUTS.md`, `177-VALIDATION.md`, `177-CONTEXT.md`, `177-UI-SPEC.md` and the operator's decisions document were not touched. `177-VERIFICATION.md` was not written.**

## Read this first

- **Green on one head.** Code head `f71107820`: gate set `177-21-final`, fourteen rows, each 0; full run `177-21-final`, **444 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 116 projects**, on its first attempt; the batch `177-determinism/177-21-final`, three runs, each valid, each 370 of 370 with the project at 97 of 97. No run was retried, none is void, none was deleted.
- **Task 2's verify exits 1 as written, at one count, and 0 corrected.** The plan asks for sixteen scans in the nominations project; plan 177-20 made them twenty-six on the dispatch's instruction. The corrected copy differs in that number alone. Nothing was bent to the count. Tasks 1 and 3 exit 0 as written.
- **Task 1 is five commits, not three.** Beyond the plan's three there is a `[db]` commit (two SQL comments and the regenerated migration: the requested-parent key serves an organization's nomination too) and a commit of source comments and docstrings from the orchestrator's list. All five precede every closing run.
- **Two things the docs do not say that they should**, found after the closing runs had started and left for a docs-only follow-up so that no run is of a tree the phase does not end on: (1) the Publishers' Guide sentence "each change must be confirmed by an administrator before voters see it" is true and too mild: an edit by the entity's user turns the nomination's confirmation off, so a **confirmed nomination is hidden from voters from the edit until an administrator confirms it again**; (2) no docs page names `EntityNominationParent.entityId` (the database key `entity_id` is named). Proposed wording under *Not done*.
- **A standing unhandled error, older than the phase, on a surface the phase did not change**: `TypeError … (reading 'map')` in an effect of `Input.svelte`, once in the dev-server log of the baseline run and of every full run since. Reported with its evidence and filed; not fixed.
- **The whole-tree comment-hygiene report (`hygiene-grep-report.sh --assert-clean`) exits 1** on residue older than the phase: 290 planning references in 135 files. The 32,308 lines the phase added under `apps/`, `packages/` and `tests/` hold **0** hits of any of its eight patterns (measured), and `yarn assert:comment-hygiene`, the gate wired into `lint:check`, is 0.
- **The host's lid was closed** during the runs (`Entering DarkWake state due to 'Clamshell Sleep'` inside each window). No run carries the void marker and no output holds `server connection lost`.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `8f0ca98bc` | `docs(177-21)`: the preview's docstring, the new developers' page with its navigation entry, the home's, backend, app-settings, routing, contexts and pre-registration pages, the Publishers' Guide page |
| 1 | `ba89d7b1e` | `docs(177-21)`: the contestant routes, dev-seed, supabase, tests and contestant components READMEs |
| 1 | `d44b3844c` | `docs(177-21)`: the database, data and components skills |
| 1 | `50e930916` | `docs(177-21)[db]`: two SQL comments and the regenerated migration |
| 1 | `f71107820` | `docs(177-21)`: source comments and docstrings, with the two regenerated component pages — **the code head of every closing run** |
| 2 | — | runs only; the review found nothing to commit |
| 3 | `85796a39b` | `docs(177-21)`: the todos Phase 177 closes, re-scopes, annotates and files |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-21-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | As written | Corrected | Head | What the corrected copy changes |
|---|---|---|---|---|
| 1 | **0** | — | `f71107820` | nothing |
| 2 | **1** — `project 'perm-contestant-nominations' holds 26 test(s) whose title contains 'axe accessibility scan', not 16` | **0** | `f71107820`; 0 again at `85796a39b` | `axe accessibility scan=16` → `=26` (`…-t2-verify.corrected.sh`, made by `sed` on that number alone) |
| 3 | **0** | — | `85796a39b` | nothing |

Of the six known defects of the plans' verify commands none was met: no control is judged, no title is counted by its quote, no SQL message is searched, no vitest log is searched for a title, and the one count of tests by title names the alias-declared tests through the verdict's own reading of the run.

## Task 1 — the docs, the READMEs and the skills

### What was false or missing, and what it says now

**Docs site** (`apps/docs/src/routes/(content)/`):

| Page | What was false or missing | Now |
|---|---|---|
| `developers-guide/contestant-app/defining-nominations` (new) | no page for the editor | the three addresses and why the group is outside `(nominated)`; the facts load and the guard; the shared ordering module and the four differences for a contestant; the draft and the rule that every nomination in reach has a card; the selector; the save in five steps; a save that is not stored; what the database enforces and what the pages alone (T-177-98: the answers lock is the pages'); six rules to keep; the tests |
| `contestant-app/home-and-tasks` | the nomination task's page and route; `nominationsViewTarget(state)`; "A button that saves asks twice … built by `taskStateOf`"; "Nothing in the view can be edited"; "With none it … offers a way to contact support"; the note under the nominations lock only; two reasons; the preview "shows its own error view" without an answer | the task's two routes and the input that decides it; the view's six states and the fact its target takes; `nominationsSaveAction` / `nominationsSaveTarget`; the note under either lock, three reasons; the preview is served when its gate cannot read the elections or the constituencies (F8 (a)) |
| `backend/authentication` | the organization editor's row lacked `nomination.create_parent`; the parent's three keys; no word of the election types, the two functions or the delete policy | the role row; four keys; a section *Nominations an entity defines*: the four types and the matrix in SQL and in TypeScript, the row rule and the end-of-transaction rule, `set_entity_nominations` with its keys, answer and refusals, `get_nomination_parent_options`, the four entity policies with the pairing and the cap |
| `configuration/app-settings` | "The three policies" | four, with the delete; the lock closes the editor; the answers lock does the same in the frontend alone |
| `contestant-app/pre-registration-and-invitation` | "The app has no page on which a user adds a nomination" | the editor, with the administrator's import beside it |
| `frontend/routing`, `frontend/contexts` | no `selectionOrder.ts`; the two nomination functions unnamed | one line each; the two functions as stable functions |
| `publishers-guide/preparing/candidates-and-parties-data-be` | no word of the limitation | one constituency for each election in the application; a party in several is added by the administrator (D-17) |
| `lib/navigation.config.ts` | — | the new page's entry beside the home's |

`yarn workspace @openvaa/docs generate:docs`: the first run **exited 1** — its link validation found the routes README's link to the new page, which was not tracked yet, and the run stopped before formatting, leaving 46 generated pages unformatted in the working tree. With the page staged the second run exited 0 and left exactly two generated pages changed: the component pages of `ElectionSelector` and `ConstituencySelector`, each by the docstring sentence this plan changed. **The route map did not change.** `validate:links --check`: 0.

**The preview** (F8 (a)): the docstring's fifth step now says when `isPreviewOpen` gives no answer and that the preview is then served with no error view, except where the question data itself is unusable, which is the entity layout's own error view. `page.server.test.ts` already held the case (`resolves an empty object and redirects nowhere when the helper gives no answer`, for both entity types), so no case was added. No behaviour changed.

**READMEs**: `apps/frontend/src/routes/contestant/README.md` (the nominations tree's load, the `(edit)` group and its guard); `packages/dev-seed/README.md` (the four election types, that a template's rows must be admitted by them, `nominationShapeCensus.builtins.test.ts`, the nominations dataset; "31 of the 33 built-ins" became a description); `apps/supabase/README.md` ("the three `entity_*` nomination policies" — four; the two election-type triggers and the two functions); `tests/README.md` (the no-nomination link's place in the chain, "one of the two" datasets, the nominations link with its project table, thirteen scan entries, the fixtures and data modules, "every perm template but one serves candidates only" — three serve both); `apps/frontend/src/lib/contestant/components/README.md` (the note's third reason).

**Skills**: as the frontmatter's `provides` lists. The database skill's § *Freshness Record* gained an entry of 2026-10-11 with the command behind each count.

**Source comments and docstrings**: the two SQL comments on `requestedParentOrganization` (`104-nominations.sql`, rule 1 of `enforce_nomination_confirmation` in `011`), with the migration regenerated by `yarn schema:regenerate`; the voter's `elections/+page.svelte` and `constituencies/+page.svelte` (two comments that told history and named a spec's line); `ElectionSelector`'s first sentence; `ConstituencySelector`'s `useSingleGroup`, in the docstring and the type file; six docstrings of `DataRoot`'s provide methods ("Existing data will be reset" — `provideData` sets by id and clears nothing, read from its body); the entity selection page's docstring; `tests/playwright.config.ts` ("(2 tests)" for `perm-startfromcg`); item 5 of the writer integration file's header; the docblock of `scripts/assert-i18n-catalog-namespaces.mjs` (three stale counts replaced by a description; the script prints 704 keys: 254, 121, 329).

### The counts as derived, each with its command

| Statement | Value | Command |
|---|---|---|
| policies in `public` and `storage` | 93 and 15 | `select schemaname, count(*) from pg_policies where schemaname in ('public','storage') group by 1` |
| members of `grant_permission`, of `nomination_shape` | 23, 4 | `pg_enum` joined to `pg_type` |
| tables in `public` | 21 | `select count(*) from pg_tables where schemaname='public'` |
| pgTAP files; assertions in a run; planned | 44; 2312; 2303 in 43 files | `git ls-files … \| wc -l`; `Files=44, Tests=2312` of the gate's pgTAP row; the sum of `plan (N)` |
| lines of the pgTAP files | 46,693 | `cat` of the 44 files piped to `wc -l` |
| definer functions of `public` executable by `anon` / `authenticated`, trigger functions and test helpers apart | 6 / 10 | `pg_proc` where `prosecdef`, with `has_function_privilege` |
| the default of `elections.election_type` | `organization_list_and_independents` | `information_schema.columns` |
| the organization editor's permissions | seven, `nomination.create_parent` among them | `unnest(public.grant_role_permissions('entity','editor','organization'))` |
| components calling `$props()`; co-located type files | 105; 105 | `grep -rl` and `find` over the three component directories |
| files using `concatClass` in the three directories; in `apps/frontend/src` | 62; 67 | `grep -rl concatClass … --include="*.svelte"` |
| built-in dev-seed templates | 35 | the keys of `BUILT_IN_TEMPLATES` |

The policy, enum and function counts were read from the local database as the `177-20-close` run left it; they are properties of the schema and were confirmed by the reset of the closing gate set, whose pgTAP row pins the census.

### The skill audits

| Audit | Before | After |
|---|---|---|
| `audit-skill-links.sh database` | exit 1; 178 checked, 30 dangling | exit 1; 190 checked, 30 dangling — the same thirty |
| `audit-skill-links.sh data` | exit 1; 73 checked, 23 dangling | exit 1; 77 checked, 23 dangling — the same twenty-three |
| `audit-skill-links.sh components` | exit 0; 30 checked | exit 0; 31 checked |
| `audit-skill-drift.sh` | exit 1; components 8 commits, data 3, database 20 | exit 1; one commit each: this plan's own two comment-only commits that follow the skills commit |
| `audit-skill-routing.sh` | not run before | exit 1, five violations: four skills share the opening "Domain expert for the OpenVAA", and the spike-findings skill holds a second index. None is in a section this plan changed |

Three dangling citations this plan introduced were found by the first re-run and reworded before the commit (a permission name the audit reads as a file name, twice; a path relative to the package). The standing ones were not repaired.

### The docs gate rows

`tests/e2e-runs/177-gates/177-21-docs`, head `f71107820`: lint 0, unit 0, check-frontend 0, format 0, docs-links 0. `177-verdict gates 177-21-docs --rows …`: **PASS**. Before the commits, on the uncommitted tree, each read from its exit file: comment hygiene 0, format 0, lint 0, frontend check 0 (2205 files, 0 errors, 0 warnings).

## Task 2 — the closing gate on one tree

### The whole-phase review

`git diff 177-BASE..HEAD` outside `.planning/`: 159 files at the plan's start, 32,329 diff lines with the generated migration, types, catalogues and docs set apart. It was walked by searches over every added line and by reading what each search found, not by reading every line; that is said again under *Not done*.

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes, by the closing runs: criteria held in a browser are listed under *For the verifier*. |
| OWASP top 10 | The write is invoker-rights behind the policies; the two definer reads gate on the caller's own editor grant and return allow-lists; ids of an address are matched before use; a refusal's text is logged and never shown. What the database does not hold or bound is filed (`…-nomination-write-path-checks-the-database-does-not-make.md`). |
| Code style; no `any` | 0 added lines with `any`, `as any` or a TypeScript suppression. |
| No repeated code | Four repetitions found by the plans, added to the "written twice" todo; none repaired. |
| New entities documented | The gate `yarn lint:check` holds the TSDoc rules; exit 0. |
| Repo documentation | Task 1. |
| Tracking events | None added by the phase. Not judged whether the editor should emit one: no decision of the context asks for it. |
| Svelte component guidelines | One new component, `EntitySelector`: docstring, type file, barrel; the frontend check is 0 warnings. |
| Errors handled | No `console.log` or `console.debug` added. |
| Failing checks | None at the close. |
| Shared dependencies | The shared ordering module and `ElectionSelector` serve the voter: every voter project is at its baseline count in the closing run. |
| WCAG; keyboard and screen reader | Thirteen states scanned in two themes, eleven phone tests per width, `keys:` and `focus:`. No screen reader, no WebKit, no person: filed. |
| Developers' and Publishers' Guides | Task 1. |
| Comment hygiene | 0 hits of history words or planning ids on the added comment lines (two searches, the second with the ship report's eight patterns over 32,308 added lines); `yarn assert:comment-hygiene` 0. Every "no longer" among the added comments describes the domain, not the code's past. |
| Clean history; no fixes of itself | Six pairs are fixes of itself, filed for the ship (`…-commit-pairs-to-squash-when-the-branch-ships.md`). |
| Formatting changes apart | Not judged commit by commit. |
| `[db]` | This plan's schema commit carries it. The earlier plans' subjects were not re-read. |
| Supabase backend | The two new definer functions pin `search_path = ''`; policies name their role; no new table. pgTAP 44 files green on a reset database. |
| Supabase adapter | Not re-read by this plan; the integration row is 30 of 30. |

Other searches: 0 `waitForTimeout`, 0 `test.skip`/`fixme`/`only`, 0 `<dialog`, one `view-transition-name` (a test asserting none), two `eslint-disable` in a fixture, each under a `// reason:` line. No finding needed a commit.

`node 177-verdict.mjs scope`: **0**. `node 177-verdict.mjs hygiene`: **0** (0 hits, 0 advisories).

### The gate set — `tests/e2e-runs/177-gates/177-21-final`, head `f71107820`

AC power, 100 %. Docker VM 16.06 GiB free before it. 13:42:47Z to 13:46:08Z. The reset was allowed by the driver's guard: no E2E run in flight, nothing on the dev-server port.

| Row | Status | Seconds | |
|---|---|---|---|
| typecheck | 0 | 23 | |
| lint | 0 | 49 | |
| db-reset | 0 | 29 | |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | the generated types are unchanged by the `[db]` commit |
| pgtap | 0 | 6 | `Files=44, Tests=2312` |
| sql-lint | 0 | 5 | |
| integration | 0 | 4 | 30 of 30, the nomination cases among them |
| unit | 0 | 36 | frontend 4228 passed, 30 skipped; dev-seed 1050; supabase 462; data 318; app-shared 148; matching 43; filters 22; core 8 |
| check-frontend | 0 | 9 | |
| build | 0 | 16 | |
| format | 0 | 20 | |
| docs-links | 0 | 1 | |
| name-gate-self-test | 0 | 0 | |

`177-verdict gates 177-21-final`: **PASS**, not stale. The driver has fourteen rows; the dispatch's "seven frontend rows" are typecheck, lint, unit, check-frontend, build, format and docs-links.

### The full run — `tests/e2e-runs/177-e2e/177-21-final`, head `f71107820`

- Wrapper status 0, first attempt. Docker VM 16.65 GiB free before it (the driver's record, after its own builder prune). AC power, 100 %. 13:46:32Z to 13:58:22Z. No void marker; 351 heartbeats.
- **444 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.** `perm-contestant-nominations` 97 of 97, `perm-no-nomination` 68 of 68, `contestant-a11y-scan` 24 of 24, `perm-startfromcg` 6 of 6, `contestant-journey` 1 of 1.
- **Against its predecessor `177-20-close`**, as the plan writes it: **FAIL (1)** at the scan count (26, not 16); corrected: **PASS**, `per project: 116 compared, 0 not as expected`. Every project equal.
- **Against the baseline `176-e2e/261011-vj-final`** with the plan's four exceptions: **PASS**. The three projects of the new spec are above 0 (1, 1, 97), `perm-startfromcg` is 2 + 4 = 6, and every other project is at its baseline count.
- **The dev-server log**: 0 Svelte warnings (`[svelte]`). 319 lines hold "error" in any case: 240 are the file watcher's (`[watch]`, 120 warnings and 120 errors on a full rescan; `177-20-close` holds more), 19 are "Not found" for the E2E placeholder media, 12 are unhandled rejections of the client (interrupted video playback, an aborted or skipped view transition), the rest are the application's own logged messages of expected refusals in tests, and **one is an unhandled `TypeError` in `Input.svelte`** (below).

### The batch — `tests/e2e-runs/177-determinism/177-21-final`

`tests/scripts/determinism-batch.sh --runs 3 --project perm-contestant-nominations --ledger-dir tests/e2e-runs/177-determinism/177-21-final`, in the background, last and alone, after the full run had ended and with nothing on ports 5173 and 5273. AC power, 100 %; Docker VM 16.57 GiB free before it. Pinned head `f71107820`. Batch exit **0**; its abort list is empty.

| Run | Started | Ended | Wall clock | Tests | Passed | Failed | Flaky | Did not run | The project | The batch's verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 13:59:12Z | 14:10:04Z | 652 s | 370 | 370 | 0 | 0 | 0 | 97 of 97 | VALID |
| 02 | 14:10:04Z | 14:20:52Z | 648 s | 370 | 370 | 0 | 0 | 0 | 97 of 97 | VALID |
| 03 | 14:20:52Z | 14:31:42Z | 650 s | 370 | 370 | 0 | 0 | 0 | 97 of 97 | VALID |

Each run reset the database itself and ran the project with what it depends on, the permutation chain before it: 370 tests. `177-verdict determinism tests/e2e-runs/177-determinism/177-21-final/ --project perm-contestant-nominations --runs 3`: **exit 0, PASS**, not stale. The same with `--runs 4`: **exit 1** ("the ledger holds 3 run directories, not 4"), as the acceptance criterion asks. No run directory holds the void marker. The host logged a DarkWake entry ('Clamshell Sleep') ten seconds into each run's window, as in every run of this phase since 177-15; the batch judged every run valid.

### Every database reset, with the guard that allowed it

| Reset | By | Guard |
|---|---|---|
| one | the gate driver's `db-reset` row, 13:43Z | the driver's in-flight check: no `started` without `ended`, nothing on the port |
| three | the batch, one before each of its runs | launched after the full run had ended (`ended` 13:58:22Z), with ports 5173 and 5273 free |

No reset was made by hand. Docker was not restarted and nothing but the drivers' own builder prune was run against it.

### The standing unhandled error

`[vite] (client) [Unhandled error] TypeError: Cannot read properties of undefined (reading 'map')` at `Input.svelte:226`, in the effect that derives the selected options of an ordered multiple-choice input, once in the dev-server log of `261011-vj-final`, `177-19-close`, `177-20-close` and `177-21-final` (*measured*). `apps/frontend/src/lib/components/input` is unchanged since the phase's base (*measured*). No test fails on it. Which page and test raise it is *inferred* from the log's order. Filed as `2026-10-11-177-unhandled-typeerror-in-input-on-an-ordered-multiple-choice-with-no-value.md`; not fixed, as the dispatch rules for a surface the phase did not change.

## Task 3 — the todos

All under `.planning/todos/`.

**Closed** (moved to `done/` with a Resolution that says what was built, by file and test, and what was not tested):

| Todo | By |
|---|---|
| `2026-08-28-preregister-election-constituency-selection-harmonisation.md` | the shared ordering module and the four contestant tests of `perm-startfromcg`; the legacy pages left for Phase 179 |
| `2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md` | `77ec7ba38` and the store-level case; never measured in a browser |
| `2026-10-09-176-list-semantics-of-the-task-list-and-the-nominations-list-on-webkit.md` | `role="list"` on three lists, as ruled (F4 (a)); not tested on WebKit |

**Re-scoped in place**: `2026-09-24-data-model-vs-db-nomination-constraints.md` — title, files and Solution name elections, constituencies, entities and questions; a dated section records the nomination part as done by file and test and carries the four gaps the comparison table itself states; `resolves_phase` removed.

**Annotated** (one `## Update 2026-10-11 — … (Phase 177 close)` each): the twelve of the plan's table — `…176-browser-keeps-a-stale-entity…`, `…176-rules-and-helpers-written-twice` (with four repetitions the phase found), `…176-states-and-assertions-the-phase-left-unexercised` (items 4, 9 in part, 11 and 15 in part), `…174.1-daisyui-label-nowrap…`, `2026-10-01-nominations-created-by-readable-by-anon`, the two `2026-08-27-147-…-unscanned`, `…173-writer-integration-test-runs-in-no-ci-job`, `2026-05-16-extend-e2e-tests…`, `2026-09-21-preregister-route-discards…`, `2026-09-15-refactor-candidate…`, `2026-10-10-tailwind-numeric-classes…`.

**Filed**, each `2026-10-11-177-<slug>.md`:

| Slug | Owner |
|---|---|
| `several-constituencies-per-election-for-one-entity` | unassigned; the operator schedules it; the cap's ruling first |
| `election-round-conformity-across-the-app` | unassigned; before any deployment with a second round |
| `election-specific-symbol-type-setting` | unassigned; backlog |
| `cap-of-ten-counts-an-editors-own-nominations` | the operator, for G3; with the research's four options and its recommendation |
| `native-speaker-review-nomination-editor-strings` | the operator, to find six native readers |
| `reads-the-ui-contract-leaves-to-a-person` | the operator; thirteen reads, each with page, width, locale and what to look for |
| `states-held-by-component-cases-and-seen-in-no-browser` | Phase 179 (F6 (a)); twenty-eight items |
| `a-save-built-on-nominations-an-administrator-changed` | unassigned; the located change of P-18 (b) |
| `small-rulings-and-loose-ends-the-plans-left-open` | the operator for rulings; P-01 to P-18 as built, the assumptions, three departures, nine loose ends |
| `nomination-write-path-checks-the-database-does-not-make` (beyond the plan's nine) | Phase 177.1 for five items; the operator for three rulings |
| `commit-pairs-to-squash-when-the-branch-ships` (beyond) | whoever restructures the branch for review |
| `sentences-of-the-planning-records-the-phase-made-false` (beyond) | the orchestrator; a reader's key to the records that stay as written |
| `unhandled-typeerror-in-input-on-an-ordered-multiple-choice-with-no-value` (beyond) | unassigned; the next plan that edits `Input` |

The legacy `preregister` selection pages and the context's `preregistration*` members are on the tree (Task 3's verify; PROH-177-62).

## The orchestrator's list — every section of `177-21-INPUTS.md`, and what was done

| Section | Disposed of | Not disposed of, and why |
|---|---|---|
| Sentences made false (docs and skills) | every sentence of the three database skill files, the app-settings page and the authentication page corrected; the `%ROWTYPE` sketch and D-09 noted in the sentences todo | the "107 … (92 in public" rows of the skill's **dated** freshness tables stay as records; a new dated table supersedes them. The "4 enums" heading of the skill's § 5, which does not list `nomination_shape`, was not touched: the skill's own freshness record already marks that heading as unchecked |
| Findings to file (177-03 to 177-06) | all six, in the write-path todo and the squash todo | — |
| Added after 177-07 | the skill rows; the two SQL comments corrected with a `[db]` commit; four findings and the unasserted cells filed; the `keep` observation in the skill and the docs | the trigger's exception **message** still speaks of a candidate: it is asserted whole in pgTAP and is behaviour, not a comment (filed, item 8 of the write-path todo) |
| Added after 177-08 | the column-map line; the data skill; the two gaps in the re-scoped todo | — |
| Added after 177-09 and 177-10 | `tests/README.md`; the two methods and the two refusals in the docs and the skills; the integration header; the killed-run finding, the squash notes | **`EntityNominationParent.entityId` is named in no docs page** (see *Not done*). Which options of `addNomination` a test passes was not read |
| Added after 177-11 | the fixtures paragraph; the two UI-contract notes; the anchor-with-role-button question (reads todo, row 10) | — |
| Added after 177-12 | the note's three reasons in the docs and the README; the docblock re-derived to a description; the native-reader todo; the squash pair | — |
| Added after 177-13 | the canonical analog re-anchored by content; the routing page; the voter's two comments rewritten; three findings filed | — |
| Added after 177-14 | the three counts re-derived (105, 105, 62; the fourth is 67, not 68); S7 noted; the unobserved items in the reads todo; the squash pairs | — |
| Added after 177-15 | the docstrings on "reset" corrected from `provideData`'s body; the developers' page; the settings-merge finding; the WINDOWS note | the fixture's step-path constants were left: no sentence is false (filed as a loose end). **Checked which of 177-15's unit-only items a later plan exercised in a browser**: a party's side, "Other" and its error, the limits of 50 and 100, and start-from-constituency mode are (177-16 to 177-20); the failed options read, a failed save and the saving state are not (filed); whether a card with no group, in an election that asks the entity for no parent, is shown in a browser test was **not established** |
| Added after 177-16 | the config comment; the selector's docstring and type; three planning notes; four findings filed | — |
| Added after 177-17 | the totals; the three planning notes; the trigger-rule question; the in-no-browser list | `tests/playwright.config.ts` holds no count of the nominations project's tests (searched): nothing to correct |
| Added after 177-18 | the home's page; the store todo closed; the planning notes; five findings filed | the frontend unit count is stated in no doc or skill (searched) |
| Added after 177-19 | the three docs pages; the list todo closed; the unexercised todo annotated; the planning notes; five findings filed; `generate:docs`, `validate:links` and the skill audits run | **`gsd_run windows append` was not run**: no stub of the phase stands at its close, and the resolver is not on this shell's path |
| Added after 177-20 | the selector's first sentence and its generated page; convention 6; the label todo; the planning notes; the state table and five findings filed | — |

## Hand-over

### For Phase 177.1 — the contract of `set_entity_nominations`, read from `503-entity-rpcs.sql`

- **Signature:** `public.set_entity_nominations(p_entity_type public.entity_type, p_entity_id uuid, p_nominations jsonb) RETURNS jsonb`, `SECURITY INVOKER`, `search_path = ''`, EXECUTE for `authenticated` only.
- **Keys of one object of `p_nominations`:** `id` (a uuid string or absent; a JSON null is refused), `election_id`, `constituency_id`, `election_symbol` (a string, null or absent; trimmed; at most 50 characters) and `parent`: `{"kind":"none"}`, `{"kind":"entity","entity_type":…,"entity_id":…}`, `{"kind":"other","name":…}` (trimmed, not blank, at most 100 characters) or `{"kind":"keep"}`. Any other key is not read. For an invitation, which only adds, `id` and `keep` have no meaning.
- **The answer:** `{"inserted","updated","deleted","unchanged","parents_created"}`, each a count.
- **Refusals of its own**, each beginning `set_entity_nominations: `: `22023` for a malformed argument or object (the object named `p_nominations[<index>]` from zero), and `42501` twice: `…the caller does not hold nomination.edit on the named entity`, and `…a nomination could not be written; nominations are locked or the rows are no longer the caller's`. The full list of twenty-four messages, in the order they are raised, is in `177-07-SUMMARY.md` § *For plan 177-09*; it was not re-derived line by line by this plan.
- **Refusals that pass through:** `23514` beginning `Nomination shape refused: ` and `Nomination parent required: `; `23503` from the foreign key on `parent_nomination_id`; `P0001` beginning `A caller may originate at most `.
- **The step that creates a parent's nomination is not a function of its own.** It is inline in the function's loop, under the comment "The parent holds no nomination at the contest: create it": an `INSERT` of the organization's or the alliance's row carrying nothing but its contest, then the lookup again, and `42501` if the row is still not found. A second writer of the same shape repeats it or the function is split; so too the trim, the two caps and the key `requestedParentOrganization`, which live in the body and nowhere else in SQL.
- **The lookup:** `private.nomination_id_in_contest(entity_type, entity_id, election_id, constituency_id, election_round)`, definer: the nomination with no parent first, then the oldest by `created_at`, then the lowest id.
- The function forces `nominations_parent_required` as its last statement and sets it back to deferred. It reads no lock but the nominations lock, through the policies.

### For Phases 178 and 179

- **A registration that ends on the home follows the first task**: into the editor (`ContestantAppNominationElections`) when the entity has no nomination and its nominations can be edited, and to the nominations view otherwise. The task state decides it from `nominationsEditable`; where no election admits the entity's type the editor's guard sends the user on to the view.
- **The tag `@nomination-definition`** is carried by the tests of `tests/tests/specs/perm/contestant-nominations.spec.ts` that are declared with a tag (the scans, declared through `declareScans`, cannot carry one) and by the four contestant tests of `tests/tests/specs/perm/perm-startfromcg.spec.ts`.
- **In place, untouched by this phase:** `apps/frontend/src/routes/contestant/preregister/(authenticated)/elections` and `…/constituencies`, their route constants, and the context's `preregistration*` members (`preregistrationElectionIds`, `preregistrationConstituencyIds`, `preregistrationElections`, `preregistrationNominations`). Phase 179 deletes them.

### For the operator

- **P-01 to P-18 as built**, with where each other option lands: the table of `2026-10-11-177-small-rulings-and-loose-ends-the-plans-left-open.md` § 1. Two to know: P-04's kept pairing admits another organization's placeholder, never the faction's own organization's row; P-17 is built with a located difference from the plan's letter.
- **The cap (G3, not read):** built as (a); the research recommends (b); a move leaves a counted placeholder behind. `…-cap-of-ten-counts-an-editors-own-nominations.md`.
- **Flagged assumptions and what a run showed:** § 2 of the same todo.
- **The three accepted departures from the UI contract:** Continue on the election step carries no stored constituency; Keep is described by the removed line; the constituency step's sentence carries `role="status"` and the election step's hint none — one ruling for both.
- **New for the operator from this plan:** the Publishers' Guide wording on confirmation (below); the standing `Input` error; that an edit by an entity's user hides a confirmed nomination from voters until it is confirmed again, which the administrators' documentation nowhere says plainly.
- **Sentences of `CLAUDE.md`, the roadmap, the requirements, the context or the UI contract that the phase made false:** `CLAUDE.md` — none found false; three places are incomplete (the stable references, the routing paragraph, the backend paragraph). The context and the UI contract — quoted in `2026-10-11-177-sentences-of-the-planning-records-the-phase-made-false.md`. The roadmap and the requirements were not read whole by this plan (*not checked*).

### For the verifier

| Held by | What |
|---|---|
| **A browser test** (`perm-contestant-nominations`, 97 tests; `perm-startfromcg`; `perm-no-nomination`) | an entity with no nomination defines one end to end and the database holds it; which steps it meets, in which order, also under "start from the constituency"; an entity with nominations starts from them, edits, moves, removes and keeps; the main button's four labels; `hasCandidates` and `changed` after a refused save; leaving with a draft; a save across a lock that came on; the view's six states; every editor address leading to the view under either lock; the home's first task leading into the editor or to the view; the questions following a first nomination without a full page load; thirteen states scanned in two themes; every page at 320 and 390 px in English; the parent group's keyboard model; focus after each navigation |
| **A component or unit case alone** | `tooManyPending` and `failed`; the kept section of the constituency step; the options error; which removal line a card shows; the page staying mounted after a save (entity layout only); the guard and the loads reading no URL (`layout.tracking.test.ts`); the ordering module's rows; the draft arithmetic; the store's equal-copy guard; the preview served without an answer |
| **pgTAP** (44 files, 2312) | the matrix cell by cell and the end-of-transaction rule (`08`); the delete policy, the paired parent policy, the lookup's order (`23`); the write function (`43`); the parent options (`44`); the definer census (`07`) |
| **The writer's integration test** (30 cases, in no CI job) | the two functions through the API; the two named refusals |
| **A person's read** | the six other locales at 320 px; the editor by keyboard and with a screen reader; the lists in Safari; the constructed translations |
| **Nothing** | a second election round; a save built on a list an administrator changed (added or changed rows); two saves in parallel; the cap in a browser |

**What to look at hardest:** (1) the truth that a seed template states an election type its rows are admitted by — it is held for the built-in templates by the census test and for nothing else; (2) the two things the docs still do not say (below); (3) that the whole-phase review was made by searches and not by reading 32,000 lines; (4) the write-path todo's items 3 and 10 to 13, which are inferred from the function's body; (5) P-18's second and third rows, read and never provoked; (6) the plan's truth "the nominations view's six states" against the page's own seventh, unreachable state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `generate:docs` exits 1 while a page a README links to is untracked.** Found in Task 1 step 3. The link validation inside `generate:docs` reads tracked files; it stopped the run before formatting and left 46 generated pages unformatted. Fix: `git add` the new page, run again; exit 0, two pages changed. The first run's log and exit are kept (`177-21-generate-docs.{log,exit}`). The plan says to run it "once"; it ran twice.

**2. [Rule 1 — Bug, in my own text] Three dangling citations in the skills**, found by the link audit before the commit and reworded.

### Other deviations

1. **Five commits for Task 1** (above), and the READMEs commit holds `tests/README.md` and the contestant components README, which the plan's `files_modified` does not list; the orchestrator's list names both.
2. **Files outside the plan's `files_modified`**, each named by the orchestrator's list: the two SQL schema files and the migration, the voter's two pages, the two selectors and a type file, `dataRoot.ts`, the entity selection page, `tests/playwright.config.ts`, the writer integration test's header, `scripts/assert-i18n-catalog-namespaces.mjs`, and five more docs pages.
3. **No unit case was added for the preview**: the load's test already holds it, which is what the plan's ruling 2 foresees.
4. **`apps/supabase/README.md` gained a paragraph** on the election-type rules beside the corrected count: its sentence "Three rules live in trigger functions" was incomplete without it.
5. **Thirteen todos filed where the plan tables nine**: four more hold what the orchestrator's list asks to be filed and no tabled todo could carry.
6. **The skills commit is not the last commit under its targets**, so the drift audit reports one commit for each skill. The order was a mistake of mine; the two later commits change comments only.
7. **Frontmatter.** The title of the closed list-semantics todo is not valid YAML as it was filed (it holds a colon); the file was moved as it was. Seven of the new todos' frontmatter values are quoted for the same reason.

## Not done, or not checked against the code

- **The Publishers' Guide's sentence on confirmation is too mild.** Proposed: "The party's user can then edit the election symbol and the alliance of each of them in the application. Any such edit sets that nomination back to unconfirmed, and it is hidden from voters until an administrator confirms it again." *Read from `enforce_nomination_confirmation`, rule 2, and the anonymous visibility rule; not observed in a browser by this plan.* It needs a docs-only commit and the five docs gate rows.
- **`EntityNominationParent.entityId` is named in no docs page.** One clause in `home-and-tasks`, where the view's paragraph names `EntityNomination`.
- **The whole-phase review did not read every line.** It searched the 30,376 added lines for the checklist's mechanical items and read what the searches found. Logic was not re-reviewed; the earlier plans' own checklist walks stand for that.
- **Sentences of the docs not checked against the code but against a docstring or a summary:** the details step's behaviour on each card kind (the page's own docstring); "`entity` over a link to another nomination of the same party repoints the row" (observed once by 177-07, in a scratch transaction); the twenty-four refusal messages (177-07's table); what `afterSave.svelte.test.ts` mounts (its header); the pgTAP files' contents in the policy map's test table (their headers and the SQL comments that cite them); the four contestant tests of `perm-startfromcg` (their titles).
- **`ROADMAP.md` and `REQUIREMENTS.md` were not read**, so no sentence of them is quoted.
- **The roles the plan's `<the_todos>` table gives the nine filed todos "with the file or run that shows it"**: each names its files; not every item names a run.
- **The standing dangling citations of the database and data skills** (30 and 23) and the routing audit's five violations: not repaired.
- **The visual project** was not run. **No person's read** was made.
- **`gsd_run windows append`** and the state updates: not run, as the dispatch rules.

## What should go into the files I did not edit

- **`STATE.md`**: plan 177-21 complete; Phase 177 executed, 21 of 21, awaiting verification; code head `f71107820`; closing evidence: `177-gates/177-21-final` (14 rows at 0, pgTAP 44 files and 2312 tests), `177-e2e/177-21-final` (444 of 444, 116 projects), `177-determinism/177-21-final`; the decisions of this file's frontmatter.
- **`ROADMAP.md`**: Phase 177, 21 of 21 plans done. Criterion 6 (the closing gate on one tree) is met by the three runs above.
- **`REQUIREMENTS.md`**: NOM-03, NOM-04, NOM-05, NOM-06 and NOM-08 are this plan's requirements and Task 2's corrected verify is 0; whether to tick them before the phase is verified is the orchestrator's.
- **`177-DISPATCH.md`**: nothing for a later plan of this phase. For Phase 177.1's dispatch: `generate:docs` needs a new page staged first; a count in a plan's verify that an earlier ruling moved is kept as written beside a corrected copy; the skills commit goes last among commits under a skill's targets.
- **`177-VALIDATION.md`**: its three manual-only rows are filed (`…-reads-the-ui-contract-leaves-to-a-person.md` rows 1 to 7, and the native-reader todo).
- **The operator's decisions document**: the three items under *New for the operator from this plan*; G1 to G16 are still unread.
- **`CLAUDE.md`**: the three incomplete places named under *For the operator*, at the orchestrator's choice.

## Prohibitions

- **PROH-177-61** (no closing run made again until green; none deleted; void by the marker alone): each closing run was made once. Judgment.
- **PROH-177-62** (nothing of the legacy `preregister` chain deleted): Task 3's verify stage. Explicit.
- **PROH-177-63** (no todo closed for something not built): each Resolution names the file and the test and says what was not tested; the three closed are the three the plan and the orchestrator's list name. Judgment.
- **PROH-177-64** (none of the six files edited): `git diff --stat a12de2ff0..HEAD` names none of them. Explicit.

## Threat Flags

None. No endpoint, load, query, policy or function was changed: two SQL comments were, and the regenerated migration differs by those two lines.

## The state the local stack is left in

The local database holds the `default` dataset, seeded with `yarn db:seed:default` (exit 0, 752 rows) after the batch's third run, each run of which had reset it: 1 election, of the type `organization_list_and_independents`, 328 candidates, 8 organizations, 377 nominations and 26 questions; two projects, the default one and the suite's, both open for voters; 2 auth users and 2 grant rows; no election with a `test-` or `e2e-` external id; two settings rows, neither with a lock on (*measured* with `psql`). No dev server is running: ports 5173 and 5273 have no listener (*measured*). Docker was not restarted and nothing but the drivers' own builder prune was run against it; Docker VM 16.58 GiB free (*measured*). AC power, 100 %; the lid is closed (*read* from `pmset -g log`). `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-gates/177-21-docs`, `177-21-final`; `tests/e2e-runs/177-e2e/177-21-final`; `tests/e2e-runs/177-determinism/177-21-final`.
- `tests/e2e-runs/177-unit/177-21-*`: the three verify scripts as written and Task 2's corrected copy, each with log, exit and head; the skill audits before and after, the drift and routing audits; `177-21-generate-docs` and `-r2`, `177-21-validate-links` and `-r2`; `177-21-precommit-checks.sh` with its four exit files (`-pre1-`); `177-21-commit-task1.sh`; the scope and hygiene verdicts; `177-21-hygiene-grep-report.log` and `177-21-hygiene-phase-added-lines.txt`; the two verdicts of the full run against its predecessor (as written and corrected) and the one against the baseline; the launch logs and exits of the three long runs with the power source and the Docker VM's free space before each.

## Self-Check: PASSED

The six commits are ancestors of `HEAD`; the new docs page, the thirteen filed todos and the three closed ones exist where this file says; the gate, full-run and batch directories exist with their `done` or `ended` markers and each holds head `f71107820`; `git diff --stat a12de2ff0..HEAD` names none of the files an executor may not edit.

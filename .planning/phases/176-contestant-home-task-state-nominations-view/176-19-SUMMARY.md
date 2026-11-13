---
phase: 176-contestant-home-task-state-nominations-view
plan: 19
subsystem: docs
tags: [docs, skills, todos, closing-gate, e2e, determinism, hand-over, NOM-01, NOM-02, NOM-07, TASK-01]
requires:
  - phase: 176-18
    provides: the per-project baseline 176-18-close (341 tests, 113 projects) and the tree the phase closes on
  - phase: 176-01
    provides: the gate, E2E and verdict drivers; 176-BASE and 176-BASELINE; 176-D9-FINDING.md
provides:
  - the docs page developers-guide/contestant-app/home-and-tasks, and seven corrected docs pages
  - the two READMEs beside the Contestant App's routes and components, as the tree is
  - the components skill (what each task accessor derives from; re-derived counts) and the database skill (get_entity_nominations; 42 pgTAP files, 1957 assertions; the authenticated census at nine)
  - the closing evidence on one tree — gate set 176-19-final, full run 176-19-final, batches 176-19-final and 176-19-final-journey
  - four todos closed with a resolution, four annotated, ten filed
  - the hand-over to Phases 177 and 179, to the operator and to the verifier
affects: [177, 178, 179]
tech-stack:
  added: []
  patterns:
    - "a dotted backticked token in a skill file (`taskState.known`) is read by the skill link audit as a file citation: name the member in words"
    - "generate:docs appends a new page to the navigation under a `// New` comment; the entry is placed by hand"
key-files:
  created:
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/notEditableNote/NotEditableNote/+page.md
  modified:
    - apps/docs/src/lib/navigation.config.ts
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md
    - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md
    - apps/frontend/src/routes/contestant/README.md
    - apps/frontend/src/lib/contestant/components/README.md
    - .claude/skills/components/SKILL.md
    - .claude/skills/components/context-reactivity.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md
decisions:
  - "The findings of the whole-phase review that are repetitions earlier plans recorded and deferred were filed as a todo and not fixed before the closing runs: each extraction changes application files, and the dispatch routes every such item to a todo or a hand-over"
  - "apps/supabase/README.md was not edited: it names the entity RPCs as a group of schema files and lists none by name, so nothing in it is false"
  - "The operator's decision document was not read: its state at close is given by git facts and by the orchestrator's dispatch"
  - "No state command was run: executors of this phase edit none of STATE.md, ROADMAP.md and REQUIREMENTS.md"
metrics:
  duration: about 58 min (12:21Z to 13:19Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-01, NOM-02, NOM-07, TASK-01]
actuals:
  tokens: 55700 # chars/4 over `git diff 907fbc3a0 HEAD` plus this summary
  tasks: 3
  commits: 4
commits: 4
plan_head_before: 907fbc3a058189d890277d11cfaff94c08d7ba2d
plan_head_after: dba1563a0ca8a4b75325db833215b5f9a8060b7d
---

# Phase 176 Plan 19: Docs, Skills, Todos, the Hand-over and the Closing Gate — Summary

**The phase closes on one tree: fourteen gate rows at 0, a full E2E run of 341 passed with nothing failed, flaky, skipped or not run, and three isolated runs each of the no-nomination spec and of the candidate journey; the docs, the READMEs and the skills say what that tree does; four todos are closed, four annotated and ten filed; and Phases 177 and 179 have the names they build on.**

## Read this first

- **All three tasks are done and every verify exits 0.** No application file and no test changed: the plan's commits outside `.planning/` are documents and skills.
- **The closing evidence is of one tree.** The gate set, the full run and both batches are of head `0ca0305c0`, which is tree-equal to HEAD outside `.planning/`.
- **Nothing was red, flaky, skipped or void** in the gate set, the full run or the six isolated runs. Nothing was run twice.
- **The whole-phase review found no defect to fix.** It found again the repetitions earlier plans had recorded, and three places where the commit history corrects itself; the first are filed as a todo, the second reported for the ship review. See *Deviations*, item 1, for why none was fixed before the closing runs, which the plan's text asks of "a finding".
- **Not done, said plainly under *Not done, or not verified*:** the operator's decision document was not read (the dispatch); no state file was touched (the dispatch); nothing was looked at in a browser by eye.
- **For the orchestrator**, under *What the orchestrator should write*: one sentence of `CLAUDE.md` and two of `ROADMAP.md` that the phase made incomplete, the requirement boxes, and that the committed decision document is not the blob plan 176-01 read.

## Performance

- **Duration:** about 58 min (12:21Z to 13:19Z)
- **Tasks:** 3 of 3
- **Files changed outside `.planning/`:** 17 (15 modified, 2 created), all documents and skills
- **Long runs:** one gate set, one full E2E run, two determinism batches of three runs each

## Task Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `eddb32ad0` | `docs(176-19): the Contestant app's home, task state and nominations view` |
| 1 | `6b4e1d427` | `docs(176-19): the Contestant app's route tree and components as they are` |
| 1 | `0ca0305c0` | `docs(176-19): the components and database skills name the task state and the nominations read` |
| 3 | `dba1563a0` | `docs(176-19): the todos Phase 176 closes, annotates and files` |

Task 2 commits nothing outside this summary: it is runs and their evidence.

## Each task's verify command, with its real exit status

Each `<automated>` block was written to `tests/e2e-runs/176-unit/176-19-t<N>-verify.sh` byte for byte from the plan (extracted by a script, not typed) and run with `bash`.

| Task | Exit | Head | Notes |
|---|---|---|---|
| 1 | **0** | `0ca0305c0` | in the background; holds the docs link check, `yarn format:check` and `yarn lint:check` |
| 2 | **0** | `dba1563a0` | after both batches; searches and verdict readings |
| 3 | **0** | `dba1563a0` | after the todos' commit |

Task 1's own checks before its commits, each read from its own command (`176-19-t1-precommit.rows`): the docs workspace's format 0, docs link validation 0, the docs site's `check` (svelte-check) 0, `yarn assert:comment-hygiene` 0, `yarn format:check` 0, `yarn lint:check` 0, the docs site's production build 0.

## Task 1 — what the docs, the READMEs and the skills now say

### The search the plan names

`git grep -n -F` for `candidateNoNomination`, `nominationNoElection`, `basicInfo.nominations`, `contestantHome.helpers` and the three former page paths over `apps/docs/src`: **three hits before, none after**, all three `candidateNoNomination`. The plan's own form of the search, without `-F`, also matches `/contestant/profile` in two files, because `[entityId=uuid]/profile` is a bracket expression there; those are not former paths.

### Docs (`eddb32ad0`)

| Page | What was false or missing | Now |
|---|---|---|
| `contestant-app/home-and-tasks` (**new**) | No page described the home, the task state or the nominations view. | The three tasks and their statuses; `taskStateOf` and its four rules; the six accessors on the context; the five buttons with the function each calls, and the two moments a saving button asks; the home; the `(nominated)` group and the preview's own load, with why the preview's rule is in the page's load; the nominations view and the read behind it; `NotEditableNote`; the two rules to keep (nothing is decided from an empty list; a save's target is read after the save); the tests. |
| `contestant-app/entity-selection` | "These loads sign a signed-in user out … when the entity is nominated in no election or constituency (`candidateNoNomination`)". The URL list had no nominations page. "The frontend reads the user's entities through two functions." | The sign-out is for unreadable data alone; an entity with no nomination is served and reaches its home. The URL list holds `/nominations`. Three functions, with what `NULL` and an empty array from the third mean. Pointers to the new page. |
| `contestant-app/login-and-password-reset` | "When the data cannot be loaded or the entity has no nomination, the loader … signs the user out … (`loginFailed` or `candidateNoNomination`)". | The sign-out is `loginFailed` alone; an entity with no nomination reaches its home and its three pages stay closed. |
| `contestant-app/pre-registration-and-invitation` | "A candidate cannot use the Contestant App until they are nominated: the app's protected pages sign out a candidate without a nomination and show the `candidateNoNomination` error." | Such a candidate or party signs in and stays signed in, sees the nomination as its first task, and the app has no page that adds a nomination. |
| `contestant-app/registration` | "the candidate reaches the Contestant App home page, provided they have at least one nomination." | The home is reached with or without a nomination. |
| `frontend/contexts` | The list of reactive accessors did not name the task accessors, and nothing said which are value-replacing. | Names `taskState`, `tasks`, `nextStep`, `previewOpen`, `profileComplete` and `nominations`; a paragraph on `known`, on `taskState` being value-replacing where `dataRoot` is not, and on `nominations` being `undefined` where no entity is loaded. |
| `backend/authentication` | § *Which entity a user is* described two functions and said the app "calls `get_user_entities` and then `get_entity_user_data`". | The third function with its keys, its `NULL` and its empty array, that it is the one definer function of the three and why; the app's three calls. |
| `configuration/app-settings` | The nominations lock "in the frontend" was an accessor nothing visible followed. | Names the nominations view's note. |
| `lib/navigation.config.ts` | — | The new page, placed after "Entity selection and the entity routes". |

No docs page named a removed message key, the deleted helper or a moved page file at its former path (plans 13, 15 and 16 had searched; searched again). No docs page states where a save leads, a count of message keys or files, or the scoped-query guard's count of sources (searched).

### The generated pages, once

`yarn workspace @openvaa/docs generate:docs`: exit 0. Read before it was committed:

- `ContactSupport`: gained the `iconPos` property.
- `LogoutButton`: said "Displays modal notification if the user hasn't filled all the data"; now the rule as the component states it — it asks the entity's tasks.
- `ContestantNav`: listed "profile, questions, preview and settings"; now the five items with nominations first, what is closed and the reason line.
- `NotEditableNote`: a new page. The index reads **106 components** (was 105).
- The route map: the three pages under `(nominated)/`, and `nominations/`.

### READMEs (`6b4e1d427`)

- `apps/frontend/src/routes/contestant/README.md` listed the entity's pages as "its home, `profile`, `questions`, `preview` and `settings`", flat. It now gives the tree with the `(nominated)` group, what the group's load and the preview's load decide, that the home, the nominations view and the settings page are outside the group, that neither load signs anyone out or reads the URL, and where the one state lives.
- `apps/frontend/src/lib/contestant/components/README.md` listed no component. It now lists the directory's components with the note and the support block's properties, `iconPos` among them.
- **`apps/supabase/README.md` was not edited.** It names "entity RPCs" as one of the concerns of schema files `500`–`506` and lists no function by name; nothing in it is false or incomplete (deviation 3).

### Skills (`0ca0305c0`)

- **`components/context-reactivity.md`** already named the five accessors (plan 176-06). It now says what each derives from, one line each, and that `taskState`, `tasks` and `nextStep` are value-replacing while `dataRoot` is not; § 5's list of value-replacing accessors names them too.
- **`components/SKILL.md`**: the measured counts of convention 1 were 103 and 103 and are **104 files calling `$props()` and 104 co-located `*.type.ts`** (the note). Convention 3's counts were re-derived and stand: 61 files in the three directories name `concatClass`, 68 across `apps/frontend/src`. The compressed rule names the task accessors. Its re-check list names no component or rule the phase changed.
- **`database/SKILL.md`**: the frontmatter description, § *Backend Overview*, RLS and Auth Patterns § 4 and § 9, § *pgTAP Testing Conventions* item 1, § *Key Source Locations* and a new § *Freshness Record* entry with its table.
- **`database/schema-reference.md`**: the function's row — signature, gate, the answer's keys, what `NULL` and an empty array mean, EXECUTE.
- **`database/rls-policy-map.md`**: a paragraph beside `get_entity_basic_data` (the opposite reach, a child to its parent), and the row of `42-entity-nominations.test.sql` in the test table.

### The counts, as derived

Each from the tree or the applied database on 2026-10-09, not from a plan or a summary.

| Statement | Was in the skill | Is | Command |
|---|---|---|---|
| pgTAP files | 41 | **42** | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql' \| wc -l` |
| planned assertions | 1879 in 40 files | **1948 in 41 files** | the sum of `plan (N)` over the files |
| assertions in a run | 1888 | **1957** | `Files=42, Tests=1957` in `176-07-close`'s `pgtap` log when the skill was written, and again in this plan's closing gate set |
| lines of the pgTAP files | 37,275 | **38,685** | `cat` of the 42 files piped to `wc -l` |
| definer functions of `public` that `authenticated` can execute | 8 | **9** | § 8c of `07-rpc-security.test.sql` |
| the same for `anon` | 6 | 6 | the same |
| policies in `public` and `storage`; tables in `public` and `private` | 92 and 15; 21 and 4 | unchanged | `pg_policies` and `information_schema.tables` on the local database |
| schema files; migrations | 29; 1 | unchanged | `git ls-files` |

The pgTAP files did not change between `176-07-close` and HEAD (`git diff --stat` over `apps/supabase` is empty), so the count written before the closing gate was the count the closing gate then showed.

### The skill audits

| Skill | Before: exit, checked, dangling | After: exit, checked, dangling |
|---|---|---|
| `database` | 1; 176; 30 | 1; 178; 30 |
| `components` | 0; 30; 0 | 0; 30; 0 |

The `database` audit's 30 dangling citations are the same 30 lines before and after (`diff` of the two sorted lists is empty): they stood before Phase 174 and stand. My first draft of `context-reactivity.md` made the `components` audit exit 1 with two new findings, `taskState.known` and `taskState.tasks`: the audit reads a dotted backticked token as a file. The four tokens were restated in words before the commit, and the audit run again: 0. Logs and exit files: `tests/e2e-runs/176-unit/176-19-skill-audit-{before,after}.{database,components}.{log,exit}`.

## Task 2 — the closing gate

### One tree

| Evidence | Head | Tree-equal to HEAD outside `.planning/` |
|---|---|---|
| gate set `tests/e2e-runs/176-gates/176-19-final` | `0ca0305c0` | yes (the verdict's own line) |
| full run `tests/e2e-runs/176-e2e/176-19-final` | `0ca0305c0` | yes |
| batch `tests/e2e-runs/176-determinism/176-19-final` | `0ca0305c0` | yes |
| batch `tests/e2e-runs/176-determinism/176-19-final-journey` | `0ca0305c0` | yes |

Nothing outside `.planning/` was committed after `0ca0305c0`. No commit of any kind was made while a batch ran: the batch pins HEAD.

### The code review checklist over the whole phase diff (step 1, before any closing run)

Over `git diff 4c930217c 907fbc3a0 -- . ':(exclude).planning'`, the phase's application, tests and data as plan 18 left them: **154 files, 12,999 insertions, 1,538 deletions, 75 commits**. The diff is kept as `tests/e2e-runs/176-unit/176-19-review.diff`, its added lines and its 1,692 added comment lines beside it. It was taken before Task 1's three commits, whose documents were reviewed as they were written and gated by Task 1's own checks; with them the phase's diff at the closing head is 175 files, 13,323 insertions, 1,576 deletions, 78 commits. Each plan walked the checklist over its own files; this pass is the searches below over the whole diff, and a reading of the application's own files where this plan read them whole.

| Item | Outcome |
|---|---|
| Solves the issue | Yes, shown by the closing runs: the four requirements are held by `perm-no-nomination` (68 tests), `contestant-journey` and the unit tables. |
| OWASP top 10 | The gate decides on the server from rows read in the request; neither load reads a `url` or `route` property (searched every changed load: the only hits are a local named `route` in the resolver). `get_entity_nominations` gates before any read, is fail-closed, projects an allow-list, and is refused to `anon`; `scope` exits 0, so no Edge Function, auth configuration, hook or API route changed. |
| Code style guide; `any` | No `: any`, `as any`, `<any>` or `Array<any>` in an added line outside test files (searched). The lint and format rows are 0. |
| No repeated code | **Not met in five places, all recorded by earlier plans**: the reason rule (home and menu), the prospective task state (profile and question page), `inFreshContext` in two setups, the parse error path in three adapter modules, a catalogue reader in a test. Filed as `2026-10-09-176-rules-and-helpers-written-twice.md`; not fixed (deviation 1). |
| New entities documented | Yes: every module, type, function and component this plan read carries its TSDoc or `@component` docstring. |
| Repo markdown updated | Task 1. |
| Tracking events | None added. No page of the Contestant App fires one (searched `startEvent(` under its routes and library: 0), and the phase adds navigation, not an action. |
| Svelte component guidelines | No destructure of a reactive accessor in an added line (searched for the thirteen names against `contestantCtx`, `ctx` and `getContestantContext()`); no branch on the entity's type in an added `.svelte` line (searched); the three `view-transition-name` hits are test assertions that none is rendered. |
| Errors handled and logged | The loads log and sign out on a failed read, redirect on a refusal, and return for the layout's error view when no answer can be given; `isPreviewOpen` logs once when it cannot decide. |
| Failing checks | None: fourteen rows at 0. |
| Shared dependencies | The voter app and the Admin App are at their baseline totals in the full run: every project that existed before the phase is at its baseline total but the two stated. |
| WCAG A and AA; keyboard and screen reader | Fourteen scans of the phase's states in both themes with zero violations; widths at 320 and 390 px. **Not exercised:** a screen reader, and WebKit (two todos). |
| Developers' and Publishers' Guides | Task 1. The Publishers' Guide names nothing the phase changed (searched for the sign-out and for the nominations lock: its sentence on the lock stands). |
| Comment hygiene | `yarn assert:comment-hygiene` 0 and `176-verdict.mjs hygiene` 0. The 1,692 added comment lines were searched twice for history and planning words (two patterns, in the review files); every hit read is a present-tense statement. The docstrings of `taskState.ts`, `unanswered.ts`, the two gate loads, `previewGate.ts`, the home, the nominations view, the menu, the logout button, the note and the context's type were read whole by this plan: no history, no id. |
| Clean, linear history | Linear. 78 commits outside `.planning/` at the closing head: 41 `test`, 22 `feat`, 7 `docs` (this plan's three among them), 3 `chore`, 2 `refactor`, and one each of `feat[db]`, `chore[db]`, `test[db]`. |
| No fixes of itself | **Not met in three places**, for the ship review: `c72f5ea18` revises the test of `8a7716fff`; `d14fb74c5` fails `check` on its own; `c23d8ce93` carries a guard entry `fab21508d` should have. Recorded in the loose-ends todo. |
| Formatting in its own commit | No formatting-only change in the phase. |
| `[db]` tag | The two commits that touch the schema, the migration or the generated types carry it (`1119638e1`, `3bd66ff39`); the pgTAP file's commit carries it too. |
| § Supabase Backend | One definer function with `search_path = ''` and qualified names; no table, policy, index or trigger; the pgTAP file inside BEGIN/ROLLBACK with `create_test_data()`. |
| § Supabase Adapter | No adapter class added; the function's answer is its own JSON, mapped by name, not through COLUMN_MAP; no route guard touched. |
| § Edge Functions | Untouched (`scope`). |

No finding needed a commit before step 2.

### `scope` and `hygiene`

`node 176-verdict.mjs scope`: exit 0, PASS. `node 176-verdict.mjs hygiene`: exit 0, PASS, 0 hits. Both before the gate set, and again inside Task 2's verify.

### The gate set — `176-19-final`

`bash 176-gates.sh 176-19-final`, in the background, started 12:32:12Z, ended 12:36:18Z. Driver exit 0. `176-verdict.mjs gates 176-19-final` (no `--rows`): **exit 0, PASS** — "rows: 14 expected (the full gate set), 14 recorded", "not stale: head 0ca0305c0 is tree-equal to HEAD outside .planning/", "power: no Sleep entry inside the run window".

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 21 | |
| lint | 0 | 48 | `yarn lint:check`, every link |
| db-reset | 0 | 32 | the database rebuilt from the one migration and `seed.sql`; the driver's own in-flight check passed |
| types-regen | 0 | 2 | |
| types-clean | 0 | 0 | no diff in `packages/supabase-types/src/database.ts` |
| pgtap | 0 | 6 | **`Files=42, Tests=1957`**, `Result: PASS` |
| sql-lint | 0 | 4 | |
| integration | 0 | 4 | **20 of 20** against the reset stack; the four `nominations:` cases among them, all passed |
| unit | 0 | 78 | frontend **192 files passed, 1 skipped (193); 3567 tests passed, 20 skipped (3587)**; dev-seed 68 files, 1041; supabase 18 files, 462; data 47 files, 244; app-shared 148; matching 43; llm 49; argument-condensation 31; filters 22; question-info 22; core 8; the harness's own 7 files, 102 |
| check-frontend | 0 | 10 | |
| build | 0 | 17 | |
| format | 0 | 20 | |
| docs-links | 0 | 1 | |
| name-gate-self-test | 0 | 0 | |

The frontend's unit totals are those of `176-18-close`: this plan changed no test.

### The full run — `176-19-final`

`bash 176-e2e.sh 176-19-final --require-project perm-no-nomination`, in the background, after the gate set had ended. Driver exit 0, wrapper exit 0, Playwright exit 0, no void marker, `sleep_entries_in_window: 0`. Playwright 8.5 min.

**341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 113 projects.** `perm-no-nomination` 68 of 68, twelve of them with a title containing "axe accessibility scan"; `contestant-a11y-scan` 24 of 24; `contestant-journey` 1 of 1; `perm-answers-locked` 4 of 4; `perm-organization-editing` 46 of 46.

| Verdict | Exit | Output |
|---|---|---|
| against **`176-18-close`**, with the five expected projects and `perm-no-nomination::axe accessibility scan=12` | **0** | "per project: 113 compared, 0 not as expected"; PASS. **Every project is equal to its total in that run.** |
| against the baseline `tests/e2e-runs/175-e2e/175-13-final`, with the five stated exceptions | **0** | "per project: 113 compared, 0 not as expected"; PASS. `perm-no-nomination` 68 against 0, its setup and teardown 1 against 0, `contestant-a11y-scan` 22 + 2 = 24, `perm-answers-locked` 3 + 1 = 4. **Every other project that existed before the phase is at its baseline total.** |

Files: `tests/e2e-runs/176-e2e/176-19-final.verdict-18-close.txt` and `.verdict-baseline.txt`.

**The dev-server log** of the run holds the line `Error formatting nomination` **0 times** (47 in the phase's baseline run) and **0** lines naming `[svelte]`, a Svelte warning or `vite-plugin-svelte`.

### The three isolated runs of the no-nomination spec — `176-19-final`

`tests/scripts/determinism-batch.sh --runs 3 --project perm-no-nomination --ledger-dir tests/e2e-runs/176-determinism/176-19-final`, in the background, alone, after the full run had ended and with nothing on the dev-server port. Pinned head `0ca0305c0`. Batch exit **0**; its abort list is empty.

| Run | Start → end (UTC) | Wall clock | Head | Wrapper exit | Total | Passed | Failed | Flaky | Skipped | Did not run | `perm-no-nomination` | Void |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 12:46:39 → 12:54:53 | 494 s (suite 454 s) | `0ca0305c0` | 0 | 267 | 267 | 0 | 0 | 0 | 0 | 68 of 68 | no |
| 02 | 12:54:53 → 13:03:06 | 493 s (suite 455 s) | `0ca0305c0` | 0 | 267 | 267 | 0 | 0 | 0 | 0 | 68 of 68 | no |
| 03 | 13:03:06 → 13:11:21 | 495 s (suite 458 s) | `0ca0305c0` | 0 | 267 | 267 | 0 | 0 | 0 | 0 | 68 of 68 | no |

Each run reset the database itself and ran the project with what it depends on: 267 tests. The batch judged every run VALID. `176-verdict.mjs determinism tests/e2e-runs/176-determinism/176-19-final --project perm-no-nomination --runs 3`: **exit 0, PASS**, "not stale: head 0ca0305c0 is tree-equal to HEAD outside .planning/".

### The three isolated runs of the journey — `176-19-final-journey`

`tests/scripts/determinism-batch.sh --runs 3 --project contestant-journey --ledger-dir tests/e2e-runs/176-determinism/176-19-final-journey`, in the background, alone, after the first batch had ended. Pinned head `0ca0305c0`. Batch exit **0**; its abort list is empty.

| Run | Start → end (UTC) | Wall clock | Head | Wrapper exit | Total | Passed | Failed | Flaky | Skipped | Did not run | `contestant-journey` | Void |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | 13:11:40 → 13:13:03 | 83 s (suite 43 s) | `0ca0305c0` | 0 | 5 | 5 | 0 | 0 | 0 | 0 | 1 of 1 | no |
| 02 | 13:13:03 → 13:14:20 | 77 s (suite 40 s) | `0ca0305c0` | 0 | 5 | 5 | 0 | 0 | 0 | 0 | 1 of 1 | no |
| 03 | 13:14:20 → 13:15:41 | 81 s (suite 42 s) | `0ca0305c0` | 0 | 5 | 5 | 0 | 0 | 0 | 0 | 1 of 1 | no |

The five tests of a run are the journey, the base dataset's setup and teardown, and the journey's own. The journey is one test of 28 recorded steps; in each run's `results.json` its step 7 (the mid-flow logout with the modal) and its step 22 (the final logout with no dialog) hold no error. `176-verdict.mjs determinism tests/e2e-runs/176-determinism/176-19-final-journey --project contestant-journey --runs 3`: **exit 0, PASS**.

Each ledger's own header calls its batch a scoped self-test that satisfies no sixteen-run threshold; that is the tool's stamp on any scoped batch of fewer than sixteen runs, and D-22 asks for three. Each header also lists the working tree at its start as modified files: every one is under `.planning/` (the operator's file, this plan's uncommitted todos and, for the second batch, this summary) or is the operator's untracked `CAND-APP-PLAN.md`.

**The refusal.** The verdict's refusal of a ledger with too few runs was seen once, in plan 176-01, and was not asked for again here, as the plan's verification block says.

**`yarn db:seed:default` after the last batch: exit 0** (752 rows). `scope` and `hygiene` again, inside Task 2's verify: exit 0 each.

### Every database reset, with its guard

| # | By | In-flight check |
|---|---|---|
| 1 | the gate driver's `db-reset` row, `176-19-final` | the driver's own; nothing on the port, no `started` without an `ended` |
| 2 to 4 | the first batch's three runs, each through the wrapper | the full run had ended (its `done` written); nothing on port 5273; no marker in flight; nothing else used the database |
| 5 to 7 | the second batch's three runs | the first batch had ended; the same checks |

Docker and the Supabase stack were never restarted. `docker builder prune -af` ran once, inside the E2E driver. Nothing under `tests/e2e-runs/` was deleted by hand; the batch script prunes each valid run to its text and machine-readable evidence, as it is built to.

### The host before each run

| Before | When (UTC) | Load average, 1 / 5 / 15 min | Docker VM free | Power |
|---|---|---|---|---|
| the plan's start | 12:21 | 5.09 / 7.86 / 9.90 | 18.18 GiB (dispatch) | AC, 100 % |
| the gate set | 12:32 | 4.39 / 5.21 / 7.34 | 18.17 GiB (19,057,872 KiB) | AC, 100 % |
| the full run | 12:36 | 12.94 / 9.34 / 8.48 | 18.83 GiB (19,740,524 KiB; the driver's reading after its prune: 18.83 GiB) | AC, 100 % |
| the first batch | 12:46 | 6.14 / 8.37 / 8.77 | 18.78 GiB (19,688,908 KiB) | AC, 100 % |
| the second batch | 13:11 | 7.43 / 7.71 / 7.80 | 18.79 GiB (19,703,840 KiB) | AC, 100 % |
| after the seed, at the end | 13:16 | 8.39 / 7.74 / 7.76 | 18.63 GiB (19,533,520 KiB) | AC, 100 % |

The 1-minute figure was at or below 20 before every start, so no start waited. The free space rose by 0.65 GiB during the gate set, whose `db-reset` row rebuilt a database that eighteen plans' E2E runs had touched; my reading before the full run was taken before the driver's prune, which then read the same 18.83 GiB. Why the reset returned that much was not looked into. Over the whole plan the free space went from 18.17 GiB to 18.63 GiB.

## Task 3 — the todos

Committed as `dba1563a0`. Nothing outside `.planning/` changed.

### Closed, moved to `.planning/todos/done/` with a Resolution

| Todo | Resolution, in one line |
|---|---|
| `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` | The nominations view shows the parent and the real state of every nomination, read through `get_entity_nominations`; the profile's block is gone. |
| `2026-10-06-173-nomination-format-error-logged-in-every-run.md` | The cause is `176-D9-FINDING.md`'s; the logger was deleted with the profile's block; the closing run's log holds the line 0 times against 47; the todo's `files:` entry named another directory than the one that logged. |
| `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` | Its "allow an incomplete save" half is on the tree; its "gate opinion questions" half is **withdrawn by the operator's decision of 2026-10-08**, not built: the questions depend on a nomination alone. |
| `2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` | The logout rule reads the task state; the journey's step 22, the final logout, passed in the three isolated runs of `tests/e2e-runs/176-determinism/176-19-final-journey`. |

### Kept open, unchanged

`2026-10-06-173-no-entity-name-on-answering-pages.md` — not built, as ruled (PROH-176-52).

### Annotated in place, one dated paragraph each

| Todo | What the paragraph says |
|---|---|
| `2026-08-27-147-answers-locked-warning-unscanned.md` | The warning is now `NotEditableNote`. It is scanned in both themes in its nominations-locked use by two entries of this phase and in its answers-locked use on an organization's profile by Phase 175's; it is not scanned on the home, the questions list or a question page. |
| `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md` | The file gained four `nominations:` cases and holds 20, all passed in the closing gate set; it still runs in no CI job. |
| `2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md` | The profile's block that showed the defect as a second log line is deleted; the store's write stands. |
| `candidate-journey-135-intermittent.md` | The journey passed three times in isolation on the closing tree; its cause stays unknown and the todo stays open. |

### Filed under `.planning/todos/pending/`

| Todo | Owner |
|---|---|
| `2026-10-09-176-native-speaker-review-home-tasks-and-nominations-strings.md` — 120 constructed values in six locales, with the three places a locale disagrees with itself | the operator, with one native reader per language |
| `2026-10-09-176-seven-reads-the-ui-contract-leaves-to-a-person.md` — the five backstop rows and plan 18's two | whoever verifies the phase by hand |
| `2026-10-09-176-list-semantics-of-the-task-list-and-the-nominations-list-on-webkit.md` | the operator (a new question, no item of the decision document) |
| `2026-10-09-176-browser-keeps-a-stale-entity-after-an-administrators-change.md` | Phase 177 |
| `2026-10-09-176-the-nomination-gate-is-a-rule-about-pages-not-about-writes.md` | the operator (a new question, no item of the decision document) |
| `2026-10-09-176-the-previews-gate-rests-on-a-database-that-reads-its-own-write.md` | the deployment milestone |
| `2026-10-09-176-pgtap-39-test-238-is-red-on-a-database-an-e2e-run-has-touched.md` | unassigned — the next plan that edits file 39 or the invitation specs' teardown |
| `2026-10-09-176-rules-and-helpers-written-twice.md` — five repetitions | Phase 177 for the prospective state; the next editor for the rest |
| `2026-10-09-176-states-and-assertions-the-phase-left-unexercised.md` — nineteen items | unassigned; Phase 177 meets four |
| `2026-10-09-176-small-rulings-and-loose-ends-the-plans-left-open.md` — the orchestrator's two rulings, the three self-correcting commits, eight loose ends | the operator; the orchestrator; the next editor |

Filed before this plan and left as it is but for its paragraph: the user-data store's todo.

## What was done with every item of the collect file

**C** closed with a resolution · **T** filed as a todo (named by its short title above) · **H** handed over in this summary.

### Part 1 — the orchestrator's list

| Item | Outcome |
|---|---|
| pgTAP file 39 test 238 red after an E2E run | **T** — the pgTAP todo |
| `inFreshContext` duplicated in two session setups | **T** — written twice, item 3 |
| Danish "parti eller valgkreds"; French "candidature" beside "nomination"; Swedish "Kontakta supporten" | **T** — the native-review todo, with the 120 values |
| Three docs pages describe the removed sign-out | **C** — Task 1, `eddb32ad0` |
| Stale generated component pages; the components skill's counts; the database skill's counts | **C** — Task 1: regenerated; 104 and 104; 42 files, 1957 tests, the census at 9 |
| Plan 10 once saw no first-level heading on the preview after an in-app navigation | **T** — unexercised, item 12, marked unconfirmed |
| No HTTP-level assertion of the 307, none of "no frame painted" | **T** — unexercised, item 5 |
| Plan 14's sign-in wait raised on an unconfirmed diagnosis | **T** — loose ends, section 1, recorded as the orchestrator's own ruling and as unconfirmed; **H** — *For the operator* |
| Plan 13's red-test commit fails `check` on its own | **T** — loose ends, section 2; **H** — *What the orchestrator should write* |
| WebKit and list semantics (plans 14 and 18) | **T** — the WebKit todo; and read 6 of the seven reads |
| `contestant-home-task-badge` not in the UI contract's locator list | **T** — loose ends, section 3 |
| The two closable todos | **C** — both closed |
| Plan 15: the home reads `task.count` | **T** — loose ends, section 1, as the orchestrator's own ruling; **H** — *For the operator* |
| Plan 15: an entity with an empty name is greeted "Hello, !" | **T** — unexercised, item 13 |
| Plan 15: the greeting of a long party name at 320 px | **C** by plan 18 in English (measured at 320 and 390 px); the other locales and an unbroken word **T** — the seven reads, read 3 |
| Plan 15: which state the `cand-home` scan lands on | **C** by plan 18: its reach asserts `data-next-step="preview"` |
| Plan 16: the reason rule written twice | **T** — written twice, item 1 |
| Plan 16: the 176-07 plan names a `logout:` prefix where the tests are `holds:` | **T** — loose ends, section 3 |
| Plan 16: which state the `contestant-nav-menu` scan lands on; the reason line at 320 px | the width **C** by plan 18 (`expectClosedPartsInsideDrawer`); the scan's state **T** — the seven reads, last line |
| The host is shared | **C** — every start of this plan read the load first; the readings are in the table above |
| Plan 17: no `entityKnown`, combined `questionsReady` or `requiredNameMissing` on the context | **T** — written twice, item 2, owner Phase 177; **H** — *For Phase 177* |
| Plan 17: three untested states | **T** — unexercised, items 1 to 3 |
| Plan 17 changed where the last answer leads and what a question's button reads; docs may describe the old path | **C** — no docs page described either (searched); the new page states the rule as built |
| The user-data store's todo, filed already | annotated |
| Plan 18: no WebKit or Firefox project; the two lists | **T** — the WebKit todo |
| Plan 18: axe's classification of closed items; the nav scan's state; no locale but English at phone width; no Finnish scan; an unbroken name; the seven reads | **T** — the seven reads |
| Plan 18: two files outside its list | **H** — recorded here; both are test data and are in the phase's diff |
| Plan 18: `buildRoute`'s `locale` parameter | **Checked: it is inert**, not dead code in the application. The application's `buildRoute` passes `locale` to Paraglide's `localizeHref` and works. The tests' `buildRoute` (`tests/tests/utils/buildRoute.ts`) puts it in a `[[lang=locale]]` segment that no route id of `route.ts` holds. **T** — loose ends, section 3 |
| The numbers to correct docs and skills against | **C** — every count written was derived at run time; the closing run's totals equal the ones listed |

### Part 2 — the summaries' sections

| Section | Outcome |
|---|---|
| 176-12, 176-13, 176-15, 176-17 — *For Phase 177* | **H** — *For Phase 177*, restated from the tree |
| 176-13 — *For plan 176-19* (docs mentions: none; the two todos; the store's defect) | **C** — searched again, both todos closed, the store's todo annotated |
| 176-15, 176-16, 176-17 — *For plan 176-19* (counts; the spec's prefixes; the journey's steps; the two rules written twice; docs hold nothing) | **C** for the counts and the docs; **T** for the two repetitions; D-20's todo **C** on the journey's batch |
| 176-15 — *For Phase 179* | **H** — *For Phase 179*, checked against `MainContent.type.ts` and the page |
| 176-18 — *For plan 176-19* (the seven reads; the facts for the final run) | **T** — the seven reads; the facts **C** — the final run is at those totals |
| 176-18 — *For the phase's verification* | **H** — *For the verifier* |

### Summaries 01 to 11, read by heading

| Source | Outcome |
|---|---|
| 01: the todo's resolution text; why a profile logged the line twice | **C** — the resolution uses it with the finding's restated fourth point |
| 02: the finding on file 39; the database skill's counts; the two docs pages; a NULL round and `service_role` unpinned | **T**; **C**; **C**; **T** — unexercised, item 18 |
| 03: `c72f5ea18` not squashed; the hand-over to 177 and 179 | **T** — loose ends, section 2; **H** |
| 04: the native review; `EntityInfo.svelte`'s label; the catalogue reader | **T**; **T** — loose ends; **T** — written twice, item 5 |
| 05: the guard's count in documents; the parse path three times; a `null` answer in a browser; the integration cases never red; svelte-check's two counts; ESLint on `scripts/` | **C** — no document states the guard's count (searched); **T** ×5 |
| 06: the three docs pages; the catalogue counts in documents; the reload rule; the extra log line | **C**; **C** — none states one; **H** and **T** — the stale-copy todo; **T** — loose ends |
| 07: `inFreshContext`; state steps called by no test | **T**; **C** — every state step is called by the spec now (counted: `setNominationState` 59, `setAnswers` 24, `setNominationsLocked` 22, `setOrganizationName` 2) |
| 08: the reload rule; two backstop truths; no HTTP assertion | **H** and **T**; **T** — the seven reads, read 4, and unexercised, item 6; **T** |
| 09: the progress bar and a question page in a browser | **T** — unexercised, item 8 |
| 10: the organization-editing tests gained `completeAnswers`; assumption A8; `visual-regression` not run | **H** — *For the operator*; **T** — the read-your-write todo; **T** — unexercised, item 17 |
| 11: the test id's comment; the stale-entry test's timing; no scan of the note elsewhere; `generate:docs`; the fixture locating the note by the answers-locked id | **C** — the comment reads "four pages" on the tree; **C** by plan 12; **T**; **C** — run; **H** — *For Phase 177* |

## For Phase 177

Written from the tree at `0ca0305c0`.

### The context's accessors

All on `getContestantContext()`, all reactive accessors: read `contestantCtx.X` inside the tracking scope, never destructured. Types are those of `$lib/contestant/tasks` and `$lib/api/base/dataWriter.type`.

| Accessor | Type | Value |
|---|---|---|
| `taskState` | `TaskState` | `{ tasks: ReadonlyArray<Task>; nextStep: NextStep \| undefined; previewOpen: boolean; known: boolean; allComplete: boolean }`, a fresh object on every change |
| `tasks` | `ReadonlyArray<Task>` | `taskState.tasks`; `Task = { id: TaskId; status: TaskStatus \| undefined; route: TaskRoute; resume?: TaskRoute; count?: number }` |
| `nextStep` | `NextStep \| undefined` | `{ task: TaskId; route: TaskRoute }` |
| `previewOpen` | `boolean` | false while the state is not known |
| `profileComplete` | `boolean` | `taskState.allComplete` |
| `nominations` | `ReadonlyArray<EntityNomination> \| undefined` | `page.data.contestantUserData?.nominations`: an empty list for an entity with none, `undefined` where the page data holds no entity |

`TaskId = 'nomination' | 'profile' | 'questions'`. `TaskStatus = 'complete' | 'incomplete' | 'blocked'`. `TaskRoute` names six routes as literals: `ContestantAppNominations`, `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppQuestion` (with `questionId`), `ContestantAppEntityHome`, `ContestantAppPreview`. **A route the editor adds is added to `TaskRoute` too**, or no helper can lead to it.

### `taskStateOf` and its input

`taskStateOf(input: TaskStateInput): TaskState`, in `apps/frontend/src/lib/contestant/tasks/taskState.ts`, pure, a fresh result on every call.

```ts
type TaskStateInput = {
  entityKnown: boolean;                 // whether "has a nomination" has been read
  hasNomination: boolean;               // as hasNomination() answers
  questionsReady: boolean;              // whether the question lists are loaded
  unansweredRequiredInfoCount: number;
  requiredNameMissing: boolean;         // counted only while the name is editable
  opinionCount: number;
  unansweredOpinionCount: number;
  firstUnansweredOpinionId: string | undefined;
};
```

Its rules, first match decides: not known → no task; no nomination → nomination incomplete and next, profile and questions `blocked`, no count read; a nomination and lists not loaded → nomination complete, the other two with no status, `known: false`; lists loaded → statuses, the first incomplete task as `nextStep`, `previewOpen` by `previewOpenOf`.

`hasNomination(nominations: ReadonlyArray<unknown> | null | undefined): boolean` — true for a list with at least one element, **confirmed or not**. A nomination a user defines completes the task at once, so the editor's "after the save" state has the profile as the next step.

`previewOpenOf(facts: Pick<TaskStateInput, 'hasNomination' | 'unansweredRequiredInfoCount' | 'unansweredOpinionCount'>): boolean`.

A further task is one member of `TaskId`, one entry in rule 2's and rule 3's lists and one block in rule 4.

### The five Continue functions

All in `$lib/contestant/tasks`. `ContinueTarget = { route: TaskRoute; continues: boolean }`.

| Button | Signature |
|---|---|
| the home's main action | `homeAction(state: TaskState): HomeAction` — `{ kind: 'pending' } \| { kind: 'task'; task: TaskId; route: TaskRoute } \| { kind: 'preview'; route: TaskRoute }` |
| the profile's save | `profileSaveTarget(state: TaskState): ContinueTarget` |
| the questions list's start and continue | `questionsResumeRoute(state: TaskState): TaskRoute \| undefined` |
| a question page's save | `questionSaveTarget(state: TaskState, facts: QuestionSaveFacts): ContinueTarget`, `QuestionSaveFacts = { wasUnanswered: boolean }` |
| the nominations view's button | `nominationsViewTarget(state: TaskState): ContinueTarget \| undefined` — `undefined` while the state is not known |

And `taskLabelKey(task: Pick<Task, 'id' | 'status'>, answersLocked: boolean): TaskLabelKey` for a row's label.

**The form in which a new Continue asks.**

- *A button that saves nothing*: `const target = $derived(theFunction(contestantCtx.taskState))` and `href={getRoute.current(target.route)}`.
- *A button that saves first* — the editor's is one — asks twice. **Label:** a `$derived.by` that returns `theFunction(taskStateOf({...}))` with the inputs the draft changes counted as saved; `continues` picks between the "continue" and the "return" messages. While `contestantCtx.taskState.known` is false it asks the saved state itself and builds nothing. **Target:** in the submit handler, after the save has returned success, `goto(getRoute.current(theFunction(contestantCtx.taskState, facts).route))`, with any fact the save itself changes copied into a plain local **before** `await userData.save()`.
- **A gap to close first.** The context does not expose `entityKnown`, the combined `questionsReady` or `requiredNameMissing`, so the profile page and the question page each infer them and repeat one block. An accessor for the `TaskStateInput`, or a method `taskStateWith(overrides)`, removes both. It is filed (`2026-10-09-176-rules-and-helpers-written-twice.md`, item 2) with Phase 177 as its owner.

### The nomination task today, and what the operator's note on E11 asks

- **Route:** `{ route: 'ContestantAppNominations' }` in every state.
- **Label:** `taskLabelKey` — `contestantApp.home.nomination.view` ("View your nominations") when the task is complete, `contestantApp.home.nomination.enter` ("Define your nomination") otherwise. Neither lock is read for it. No string changes when the editor arrives.
- **Status:** complete with at least one nomination; never blocked.
- **What the operator's note on E11 asks of it**, as the plan carries it: the task routes to the editor only when nominations are editable and the entity has none; otherwise to the view. That is a change in `taskStateOf` (the task's `route`) with one new input — whether nominations are editable — or a route decided by the view; the row, its label keys and the home need no change.

### The nominations view

`…/[entityType]/[entityId]/nominations/+page.svelte`, route key `ContestantAppNominations`, **outside** the `(nominated)` group.

- **Where an Edit action goes.** The view has two bodies behind `viewState` (`'listed' | 'empty' | undefined`) and one `note` snippet behind `locked`. An editor's entry belongs in the listed body's card or in `primaryActions`, and an "add" in the empty body, each inside `{#if !locked}`; today the only `!locked` branch is the empty body's `ContactSupport`. The fixture's `expectNoEditAction()` and the component case that the view holds no form control assert today's absence and change with it.
- **The condition the note follows today:** `contestantCtx.nominationsLocked` alone — the setting `access.nominationsLocked`. The answers lock does not show it. **Phase 177 widens it to either lock**: one more member of `NotEditableNoteProps['reason']` (`'answersLocked' | 'nominationsLocked'` today), one more entry of `REASON_MESSAGE` in `NotEditableNote.svelte` — the `Record` type makes the compiler ask for it — and the condition in the view's `note` snippet.
- **The button.** `nominationsViewTarget(taskState).continues` is `false` for an entity with no nomination, so the button reads `common.return` and leads home (`data-action="return"`). It becomes a Continue where the user can add a nomination: then the function stops answering home for `next.task === 'nomination'`, or the page offers the add action in the button's place.
- **The list is the last load's.** `contestantCtx.nominations` is page data. After a write the entity-level load must rerun for the cards, `data-nominations-state` and the task state to follow.
- **Rendered and not rendered.** A card shows the election's name, the constituency, the parent (`parent.name || parent.shortName`) when there is one, the election symbol when there is one, and the state. `customData` and `electionRound` reach the page in each element and are not rendered.

### `get_entity_nominations` and `EntityNomination`

```sql
public.get_entity_nominations (p_project_id uuid, p_entity_type public.entity_type, p_entity_id uuid)
  RETURNS jsonb  LANGUAGE plpgsql  STABLE  SECURITY DEFINER  SET search_path = ''
```

- **Answer:** a JSON array, ordered by `sort_order` (nulls last) then `id`, of objects with exactly `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, **`custom_data`** and `parent` (JSON null, or `entity_type`, `name`, `short_name`). The names are the localized columns as stored.
- **`[]`** for an entity with no nomination; **`NULL`**, never a raise, for a NULL parameter, a type other than `candidate` or `organization`, and any entity the caller holds no editor grant on in that project.
- **Gate:** `private.caller_entity_ids(p_project_id, p_entity_type)`, before any read. EXECUTE: `authenticated` only.
- **Its one caller:** the data writer's `getEntityUserData({ type, id, loadNominations: true, locale })`, which maps each row with `entityNominationOf` into

```ts
type EntityNomination = {
  id: Id; electionId: Id; electionName: string; constituencyId: Id; constituencyName: string;
  electionRound: number;      // 1 when none is stored
  electionSymbol: string;     // '' when none
  confirmed: boolean;
  customData: Record<string, unknown> | null;
  parent?: { entityType: EntityType; name: string; shortName?: string };
};
```

  A `NULL` answer makes the writer return `undefined` — the same outcome as no entity row — and the load redirects to the app root. A malformed answer throws.
- 177's planner re-reads the function before deciding whether its own write returns the same shape (O-3).

### The gate group and the reload

- `…/[entityType]/[entityId]/(nominated)/+layout.server.ts` redirects (307) an entity whose list is empty to `ContestantAppEntityHome`; it runs once per entry to the group. The preview's own `+page.server.ts` asks `isPreviewOpen` on every arrival.
- **The entity-level load must be rerun after the user's own write of a nomination** — it depends on the two entity params alone and has no dependency key — for `nominations`, the question read, the task state and the gate to follow. The store's `reloadEntityData` reads with `loadNominations: false` and updates none of them, and the context's two election effects read `userData.current.nominations`, the list `init` was given: a write has to reach both lists. Filed with Phase 177 as owner (`2026-10-09-176-browser-keeps-a-stale-entity-after-an-administrators-change.md`).
- The profile holds nothing of the entity's nominations and links to nothing about them.

### The no-nomination dataset: state steps and fixtures

- **Template:** `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts`, prefix `e2e-perm-no-nomination-`: one election, one constituency, `ca-none` and `or-none` with **no nomination row**, `ca-nominated` with one confirmed nomination, a required info question and two opinion questions asked of both types, no seeded answer. Constants in `tests/tests/utils/permNoNominationData.ts` (`UNNOMINATED_CANDIDATE_GRANT`, `UNNOMINATED_ORGANIZATION_GRANT`, `NOMINATED_CANDIDATE_GRANT`, each with its `…_STORAGE_STATE` and `…_EDITOR_EMAIL`).
- **State steps**, exported from `tests/tests/fixtures/contestant/perm-no-nomination.ts`, each written with the service role:
  - `setNominationState(entity: EntityGrantTarget, state: 'none' | 'pending' | 'confirmed'): Promise<void>`
  - `setAnswers(entity: EntityGrantTarget, answers: { requiredInfo: boolean; opinions: 'none' | 'allButLast' | 'all' }): Promise<void>`
  - `setNominationsLocked(on: boolean): Promise<void>` — a project-wide setting; a test that turns it on restores it in a `finally`, and the step after a flip is a full load
  - `setOrganizationName(entity: EntityGrantTarget, name: Readonly<Record<string, string>>): Promise<void>`
- **Fixtures** on the same module's `test`: `contestantEntityPages`, `contestantHomePage`, `contestantNominationsPage`, `contestantProfilePage`, `contestantQuestionPage`, `contestantQuestionsOverviewPage`, `contestantPreviewPage`, `contestantLogoutButton`, `contestantLoginPage`, `navMenu`, `notEditableNote`, `pageGeometry`; and `noNominationPagesOf(page)` for a scan entry's reach.
- **`notEditableNote.expectNote(reason)` locates the note by the answers-locked id** whatever `reason` it is given; the nominations view's note has its own id and its own step, `contestantNominationsPage.expectLockedNote(present)`. A note under a third id needs the fixture to take the id.
- Every test of the spec begins with the state steps that write what it reads. Its title prefixes: `gate:` 5, `holds:` 7, `home:` 6, `menu:` 5, `nominations:` 6, `phone:` 7 (at each of two widths), `preview:` 2, `profile:` 1, `questions:` 2, `continue:` 2.

## For Phase 179

- **A freshly registered entity with no nomination stays signed in**, lands on its home and is led to the nominations view: the home's first row and its main action read "Define your nomination" and lead to `ContestantAppNominations`, which for such an entity shows the empty sentence, a way to contact support and a Return. Until Phase 177 that view offers such a user nothing else.
- **The home's structure.** `MainContent` (`$layouts/main`) takes the snippets `note`, `hero`, `heading`, `fullWidth`, `primaryActions` and `children`, and a `title`. The home fills them so:

| Place | What the home puts there | When |
|---|---|---|
| `note` — a wrapper with `role="note"` that precedes the title in reading order | `NotEditableNote reason="answersLocked"` with an optional second sentence and one Contact support button | only while answers are locked |
| `hero` | the success emoji in a `<figure role="presentation">` | only when every task is complete |
| `title` | the greeting by the entity's name, or the ready title | always |
| `children` | in order: the explanation (`contestant-home-status`); the tip (`contestant-home-tip`); the task list, an `<ol>` (`contestant-home-tasks`); the preview entry (`contestant-home-preview`); the reason sentence (`contestant-home-closed-reason`) | the tip and the reason by state |
| `primaryActions` | the main action (`contestant-home-continue`) and the logout button under it | always |

  `heading` and `fullWidth` are not used by the home.
- **There is no place for a pending-address reminder, and none was built.** The `note` snippet holds one thing, the lock note, inside one `role="note"` region: a second note there would share the region and precede the title. The places in `children` are, top to bottom: between the title and the explanation; between the explanation (or the tip) and the list; and under the reason sentence. The list, the preview entry and the reason sentence belong together, because the reason is the description of the entries above it. The title does not name the entity once every task is complete.
- **The dataset's shape for an entity without a nomination:** an entity row and an editor grant, and no row in `nominations` naming it. `perm-no-nomination`'s `ca-none` and `or-none` are that, each with a stored session; `setNominationState(entity, 'pending' | 'confirmed')` gives one a nomination and `'none'` takes it away.

## For the operator

### The three proposals that depart from locked text

Each is built at its recommended option. `176-BASELINE-FACTS.md` § *Operator rulings as read* has C1, C2 and C3 as `recommended-unticked (a)`.

| | The block it lives in | The fallback's one change | The tests that change with it |
|---|---|---|---|
| **U-01** (item C1) | `taskState.ts`, the first statements of `questionSaveTarget`: `const resume = questionsResumeRoute(state); if (resume) return { route: resume, continues: true };` | one statement before the block — `if (state.tasks.find((task) => task.id === 'profile')?.status === 'incomplete') return { route: { route: 'ContestantAppProfile' }, continues: true };` | `taskState.test.ts`: one row of `QUESTION_SAVE_CASES`, `'a question is unanswered and the profile is incomplete'` (measured by plan 03: 1 case fails). The question page's component case `leads to the other unanswered question once the save has taken this one out of the unanswered ones, with the profile incomplete`. The spec's `holds: an answer saved while required info is missing leads to the next question`. |
| **U-02** (item C2) | `taskState.ts`, rule 4 of `taskStateOf`: `const route: TaskRoute = { route: 'ContestantAppQuestions' };` | that line becomes `const route: TaskRoute = firstUnanswered ? copyOf(firstUnanswered) : { route: 'ContestantAppQuestions' };` | `taskState.test.ts`: six rows (three of `TASK_STATE_CASES`, one each of `HOME_ACTION_CASES`, `PROFILE_SAVE_CASES` and `NOMINATIONS_VIEW_CASES`; measured: 6 fail). The home's page test: `with only the questions left, shows the profile complete and leads the main action to the questions list` and the two cases that assert the questions row's `href`. The profile page's two cases that assert the questions list as the save's target. The spec's `home: with the profile filled in, the main action leads to the questions list` and `holds: the profile's save leads to the questions list once the required info is filled in`. The journey's steps 14 and 15. |
| **U-08** (item C3) | `nominations/+page.svelte`: `const emptySentenceShown = $derived(viewState === 'empty');` | it becomes `viewState === 'empty' && !locked` | The view's page test, the case that shows the note above the empty sentence while nominations are locked. The spec's `nominations: with nominations locked, the empty view shows the note above the same sentence and one support button` (the fixture needs a step for an absent sentence). The scan entry `no-nomination-nominations-locked`, which anchors on the sentence, and the phone-width check of the locked empty view. |

### Two rulings the orchestrator made on its own judgement

Neither was put to the operator; both are in `2026-10-09-176-small-rulings-and-loose-ends-the-plans-left-open.md`, section 1.

- **Plan 14's sign-in wait** was raised from the default 5 s to `TIMEOUTS.slowPage` (`2872bbf9e`) after one red run under a host load near 30. **The diagnosis is unconfirmed**: one trace, not reproduced.
- **Plan 15's read of `task.count`** on the home, to choose the answers-locked note's second sentence, was accepted as outside the letter of PROH-176-39.

### Phase 175's tests that this phase changed

The three tests, the phone test and the `org-preview` scan of `perm-organization-editing` that open an organization's preview now give the organization an answer to every opinion question first (`completeAnswers`), because the preview's rule would have refused them. No assertion of theirs changed.

### The sentence of `CLAUDE.md` to extend

§ *Context Destructuring Rule*, first paragraph:

> … and _reactive accessors_ — `appSettings`, `dataRoot`, `locale`, `selectedElections`, `opinionQuestions`, `matches` and some twenty more — which are not.

It is not false: the list is open. It is incomplete in that the contestant context gained five, and none of its examples is one of them. Proposed: "… `opinionQuestions`, `matches`, the contestant context's `taskState`, `tasks`, `nextStep`, `previewOpen` and `nominations`, and some twenty more — which are not." The second prohibition could add one clause: "`taskState` is replaced by a fresh object on every change, so a `$derived` read alias of it is safe; it is still never destructured."

## For the verifier

Four departures nobody has ruled on. Each line names the locked text, what the phase recorded when it started, and what is known when it closes — so that no criterion is read as met, or as failed, on one of them.

**What the decision document says at close.** I did not read `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`: the dispatch allows it only through `176-BASELINE-FACTS.md`. What is established without reading it: the dispatch of 2026-10-09 states that sections C and D are unanswered and every item stands at its recommended option; the committed blob at HEAD is `3f6576dc5`, **not** the `8281eeac7` plan 176-01 read; one commit changed the file between them, `746714c56` ("decision E8 — the nomination line's cause, and the un-halting of Phase 176"), which plan 176-03 recorded as touching section E and the totals alone; and the working copy differs from HEAD by whitespace only (`git diff -w --quiet` exits 0). The one command of plan 176-01's `<operator_rulings_reading>` block gives the reading mechanically and was not run by this plan.

| Item | The locked text the build departs from | Recorded at the start | At close |
|---|---|---|---|
| **U-01** (C1) | Roadmap criterion 4, "every Continue leads to the next incomplete task", and D-06's first sentence. **As built:** a save on a question page continues the questions while one is unanswered. | `C1: recommended-unticked (a)` | as above: unanswered per the dispatch |
| **U-02** (C2) | D-06, in which the questions task's route is the first unanswered question. **As built:** from the home, from the profile's save and from the nominations view the task leads to the questions list. | `C2: recommended-unticked (a)` | the same |
| **U-08** (C3) | D-17's table, which gives the nominations view of an entity with no nomination, while nominations are locked, the "not editable" note with the support link alone. **As built:** the view also shows the "no nominations" sentence and Return. | `C3: recommended-unticked (a)` | the same |
| **The order of the plans** (C4) | D-21, in which the dataset, the spec and the fixtures follow the screens and "E2E runs once on the finished phase". **As built:** the dataset and the fixtures were built at plan 176-07, and every plan that changed a contestant surface closed on a full run. D-21 was not amended. | `C4: recommended-unticked (a)` | the same |

**From plan 18, for the verification:** each scan entry with its marker and state is in `176-18-SUMMARY.md` § *The seven entries*; in this plan's closing run each scan's `reach-proof-<entry>.json`, `raw-i18n-keys-<entry>.json` and `axe-violations-<entry>.json` are attached to its test in `tests/e2e-runs/176-e2e/176-19-final/results.json`. The widths measured are 320 × 568 and 390 × 844, seven tests at each. Every reach and test that turns the nominations lock on is followed by a full load, and restores it in an `afterEach` or a `finally`. The verdict pins `contestant-a11y-scan` at its baseline + 2 and twelve scan titles in `perm-no-nomination`.

**The criteria, each with what shows it.**

| Criterion | Shown by |
|---|---|
| 1 (NOM-01) | `home:` and `gate:` tests of `perm-no-nomination` for a candidate and for a party; the label on the tree is "Define your nomination" |
| 2 (NOM-02) | `nominations:` tests (6) and `profile: the profile of an entity with a nomination has no nominations section`; the note under `access.nominationsLocked` |
| 3 (NOM-07) | `gate:` (5), `questions:` (2), `preview:` (2) and the two `holds:` preview tests; `menu:` (5) for the menu |
| 4 (TASK-01) | `continue:` (2), the `holds:` save tests, the home's tests; `taskState.test.ts`; with U-01 and U-02 as above |
| 5 (E2E-03) | the full run and both verdicts above |

## What the orchestrator should write

- **`CLAUDE.md`:** the sentence under *For the operator*.
- **`ROADMAP.md`, Phase 176, "Discussion settled":** "the one derived state is an ordered `tasks` list plus a `nextStep`, two accessors on the contestant context over a pure helper". The context has five accessors for it: `taskState` (the whole state), `tasks`, `nextStep`, `previewOpen` and `nominations`, with `profileComplete` redefined as the state's `allComplete`.
- **`ROADMAP.md`, criterion 1:** `sees "Define nomination" as the first task`. The label on the tree is "Define your nomination" (`contestantApp.home.nomination.enter`).
- **`REQUIREMENTS.md`:** NOM-01, NOM-02, NOM-07 and TASK-01 are unchecked and "Pending" in the traceability table. This plan's frontmatter names them as completed; marking them is the orchestrator's.
- **`STATE.md` and the roadmap's plan list:** plan 19 and the phase; no state command was run by this plan.
- **For the ship review:** the three self-correcting places in the history (the loose-ends todo, section 2).
- **The decision document:** its committed blob is not the one `176-BASELINE-FACTS.md` records (above); the fixed command would settle what it says.

## Deviations from Plan

**1. The whole-phase review's findings were filed, not fixed.** Task 2 step 1 says a finding "is fixed in a commit of its own … before step 2". The review's findings are the five repetitions and the three self-correcting commits. Every one was recorded by the plan that made it, and the dispatch routes every such item to a resolution, a todo or the hand-over. An extraction of the reason rule or of the prospective state changes pages a browser observes, which needs its own unit proof and a full run before the closing runs; a rewrite of history is the orchestrator's. Nothing was found that makes the tree wrong. The repetitions are a todo; the commits are reported.

**2. `apps/docs/src/lib/navigation.config.ts` is outside the plan's `files_modified`.** A new docs page needs its navigation entry, and the link validator checks the entry. `generate:docs` appended it under a `// New` comment at the end of the section; I moved it after "Entity selection and the entity routes" and removed the comment.

**3. `apps/supabase/README.md` was not edited**, though the plan lists it "where it lists the entity RPCs". It lists none by name.

**4. Two docs pages beyond the ones the plan names were corrected**: `backend/authentication` (it described two entity-scoped functions) and `configuration/app-settings` (one clause naming the view's note), and `contestant-app/registration` (one clause that made a nomination a condition of reaching the home).

**5. The todos were written before the closing runs ended and committed after them.** Ruling 5 puts the todos after the runs because one closes on a batch's result. The ten new files were drafted while the full run and the batches ran, as untracked files under `.planning/`, which no driver reads; the four closures, the annotations and the one commit came after the last batch. No commit was made while a batch ran.

**6. The verdict's refusal of a ledger with too few runs was not asked for again**, as the plan's verification block says.

**7. No state command was run** (`state.advance-plan`, `roadmap.update-plan-progress`, `requirements.mark-complete` and the others): the dispatch and the execution rules reserve `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` to the orchestrator.

**8. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named for this checkout, not on a per-agent branch; the commits were made there as instructed.

**9. Nothing was appended to `.planning/WINDOWS.md`**: this plan leaves no stub, no skipped test and no verify that did not run, and no plan of the phase wrote to that ledger.

## Not done, or not verified

- **The operator's decision document was not read**, by the dispatch. What it says at close is established only as far as the section *For the verifier* says.
- **Nothing was looked at in a browser by eye**, and no screen reader was run. The docs site was built and type-checked, and its pages were not opened.
- **The docs pages were written from the source files and their docstrings**, read at `907fbc3a0`. No sentence of the new page was checked against a running application beyond what the E2E suite asserts.
- **The whole-phase review read 1,692 added comment lines by two searches**, and read whole only the application files this plan needed for the docs. Every plan's own checklist walk is the reading of the rest.
- **`STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not searched whole** for sentences the phase made false: the roadmap's Phase 176 section and the five requirement lines were read, and what was found is under *What the orchestrator should write*.
- **`pmset -g log` was not read by hand**: every run is green and each driver's own record reports no Sleep entry in its window.
- **The `database` skill's sections that predate this entry** were not re-measured beyond the counts in the table; its 30 dangling citations stand.
- **The second paragraph proposed for `CLAUDE.md`** and the two roadmap sentences are proposals; nothing of those files was edited.

## The state the local stack is left in

Read with `psql` after `yarn db:seed:default`, which followed the last batch's last run:

- **The `default` dataset is seeded.** Default project `…0001`: 1 election, 328 candidates, 8 organizations, 377 nominations, 26 questions.
- **Projects: 2** — the default project and the E2E project `…00e2`, which holds no election, candidate, organization, nomination or question: every teardown of the last run passed. No candidate row carries an `e2e-` or `test-` external id.
- **Auth users: 2. Grants: 2.**
- **Applied schema:** the tree's, from the last batch run's own reset. **No pgTAP helper is in `public`** (pgTAP has not run since that reset), so `yarn db:types` is valid on this database as it stands.
- **`private.invitation_link_witness`: 1 row**, left by the journey's last run. `39-invitations.test.sql` test 238 is therefore red on this database until the next reset — the known finding, now filed.
- `access.answersLocked` is `false` in the E2E project's settings row and the row holds no `nominationsLocked` key: the nominations lock is off.
- The stack is up; neither it nor Docker was restarted. Nothing listens on the wrapper's port and no run is in flight. Docker VM free: 18.63 GiB (driver floor 13.8 GiB).
- The seven resets of this plan are in the table under Task 2; none was made by hand.

## Files touched that the plan did not list

- `apps/docs/src/lib/navigation.config.ts` (deviation 2).
- `apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md` — the route map, regenerated by `generate:docs` with the component pages; it is under the plan's `developers-guide/` entry.
- Under `.planning/todos/`: the four closed, the four annotated and the ten filed — the plan lists the two directories.

`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `907fbc3a0` and HEAD. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` keeps the operator's uncommitted whitespace difference, untouched. `CAND-APP-PLAN.md` stays untracked. Nothing under `tests/e2e-runs/` was deleted by hand.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. Its mitigations as built:

| Threat | Held by |
|---|---|
| T-176-71 a closing statement of several trees | every verdict's "not stale" line; the verify's comparison of the gate run's head with the full run's; the table under *One tree* |
| T-176-72 a reset under a run in flight | the gate driver's refusal; the batches last and alone; the table of resets |
| T-176-73 a doc or a skill stating the retired sign-out | the three pages corrected; the negative search exits 1 (none); the skills' entries |
| T-176-74 a withdrawn decision recorded as built | the incomplete-profile todo's Resolution says "withdrawn"; every residual is a filed todo with an owner |
| T-176-75 a driver printing the stack's keys | `176-verdict.mjs hygiene` exit 0 on the closing tree |

## Evidence (gitignored)

`tests/e2e-runs/176-gates/176-19-final`; `tests/e2e-runs/176-e2e/176-19-final` with its two verdict files beside it; `tests/e2e-runs/176-determinism/176-19-final` and `176-19-final-journey`; in `tests/e2e-runs/176-unit/`: `176-19-skill-audit-{before,after}.*`, `176-19-t1-precommit.*`, `176-19-t<N>-verify.{sh,log,exit,head}`, `176-19-generate-docs.{log,exit}`, `176-19-review.{diff,added,comments}`, `176-19-scope.log`, `176-19-hygiene-verdict.log`, `176-19-gates-verdict.log`, and the `.pre.txt` readings and launch logs of the gate set, the full run and each batch.

## Self-Check: PASSED

Checked after writing:

- The new docs page and the generated `NotEditableNote` page exist and are tracked; the gate directory, the full run's directory with its two verdict files, both ledgers, the three verify exit files (0, 0, 0) and the four skill-audit exit files exist.
- `eddb32ad0`, `6b4e1d427`, `0ca0305c0` and `dba1563a0` are ancestors of HEAD; `git rev-list --count 907fbc3a0..HEAD` was 4 when this file was written, before its own commit.
- HEAD is tree-equal to `0ca0305c0` outside `.planning/` (`git diff --quiet` exits 0), so every closing run is of the tree that stands.
- The four closed todos are under `.planning/todos/done/`; eleven files under `pending/` begin `2026-10-09-176-` (the ten filed here and the store's, filed before).
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `907fbc3a0` and HEAD.
- No stub pattern in the new docs page.

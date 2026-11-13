---
phase: 175-organization-editing-profile-questions-preview
plan: 01
subsystem: testing
tags: [gates, e2e, verdict, svelte, input, focus, ownership_invalid_mutation]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: the gate driver, E2E driver and verdict script this phase's three scripts are re-pointed copies of
  - phase: 174.1-terms-of-use-gate-phone-width-focus
    provides: the control and scope verdicts the new control and scope subcommands follow
provides:
  - 175-gates.sh, 175-e2e.sh and 175-verdict.mjs in the phase directory
  - the checked E2E baseline (tests/e2e-runs/261008-quick-g2-g4-g6 on the commit 175-BASE names)
  - focus() on MultilingualTextPart, SelectMultiplePart and MultipleTextPart; Input without an array of element references
  - the guard file asserting zero ownership warnings for every kind
affects: [175-05, 175-06, 175-09, 175-10, 175-11, 175-12, 175-13]

actuals:
  tokens: 22294 # chars/4 over the three commits' diffs (89175 chars)
  tasks: 2
  commits: 11 # MEASURED over a shared checkout: 3 are this plan's, 7 are plan 175-02's, 1 is docs(176)
plan_head_before: 0c2263f7094578324a3ca27e631c7cf9cddf41c8
plan_head_after: 548fc75b924c9721200b51828a0b6b1893c8fc77

tech-stack:
  added: []
  patterns:
    - "An Input part owns its element references and exports focus(); Input holds the rendered part through bind:this"
    - "A label names its newest attempt: <label>-rN with the highest N, read through 175-verdict.mjs dir"

key-files:
  created:
    - .planning/phases/175-organization-editing-profile-questions-preview/175-gates.sh
    - .planning/phases/175-organization-editing-profile-questions-preview/175-e2e.sh
    - .planning/phases/175-organization-editing-profile-questions-preview/175-verdict.mjs
  modified:
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts
    - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
    - apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/README.md

key-decisions:
  - "The control verdict reads the Playwright invocation from results.json (config.argv) when the run directory has no command file"
  - "The e2e verdict refuses a run whose recorded worktree status holds an uncommitted path"
  - "In the E2E driver and the verdict, a Sleep entry in the power log is informative; only the wrapper's marker makes a run void"
  - "SelectMultiplePart holds one $state reference to its dropdown, not a one-element array"

patterns-established:
  - "A part that renders a field Input returns focus to exports focus() and is handed no element reference"

requirements-completed: [GEN-01]

coverage:
  - id: D1
    description: "The phase's gate driver, E2E driver and verdict script exist, pass their static checks and refuse what they must"
    verification:
      - kind: other
        ref: "Task 1 automated verify command (exit 0); 46 verdict cases on a scratch copy against copies of earlier runs' evidence (all as expected)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Input and its three parts exchange a method, not an array; a dev compile logs no ownership warning for any kind; focus return intact"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts (18 cases; red 3 failed / 15 passed at 26f8e73a7, green 18 passed at 548fc75b9)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (2120 files, 0 errors, 0 warnings)"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 01: Phase drivers, checked baseline and the `Input` parts repair Summary

**Three re-pointed driver scripts (fourteen gate rows, one wrapper E2E run, seven verdict subcommands) with a checked 220-test baseline, and `Input`'s three parts each owning their element references behind an exported `focus()` — the guard that counted three ownership warnings now counts none for all fourteen kinds.**

## Performance

- **Duration:** about 20 min
- **Started:** 2026-10-08T11:54:28Z
- **Completed:** 2026-10-08T12:13Z
- **Tasks:** 2 of 2
- **Files:** 3 created, 9 modified

## Task Commits

1. **Task 1: the phase's drivers and the baseline** — `cfb0be608` `docs(175-01): the phase's gate driver, E2E driver and verdicts`
2. **Task 2, red** — `26f8e73a7` `test(175-01): Input logs no ownership warning for any kind`
3. **Task 2, green** — `548fc75b9` `fix(175-01): each Input part owns its element references and exports focus()`

Seven commits of plan 175-02 and one `docs(176)` commit sit between and around them in the same checkout; every commit of this plan was made by explicit pathspec.

## Gates, each with the status read from the command

| Gate | Exit | What it showed |
|---|---|---|
| Task 1 automated verify (whole chain) | **0** | syntax of the three scripts; all tracked; fourteen row names; the three no-argument calls exit 2; unknown label exits 2 (`e2e`, `dir`); `hygiene` 0; `scope` 0; the four base-commit checks |
| Guard file on the unchanged tree | 0 | 16 passed |
| Red report, on `26f8e73a7` | **1** | 18 cases: 3 failed, 15 passed |
| Green report, on `548fc75b9` | **0** | 18 cases: 18 passed |
| Task 2 automated verify (whole chain, run in the background on `548fc75b9`) | **0** | no `mainInputs` under the frontend source; `export function focus` in the three parts; `yarn workspace @openvaa/frontend check` 2120 files, 0 errors, 0 warnings; `vitest run src/lib/components/input` 2 files, 25 passed; ESLint on the input directory; `yarn assert:comment-hygiene`; red head before the component's commit, green head at it; test file identical at the two heads; the two reports' counts |
| `175-verdict.mjs hygiene` at the final head | 0 | 3 scripts, 13 plan files, 0 hits, 0 advisories |
| `175-verdict.mjs scope` at the final head | 0 | 27 changed paths outside `.planning/` (9 under the input directory, the rest plan 175-02's), none refused |

**No gate-set run and no E2E run was made here**, as the plan rules: plan 175-02 was resetting the database in the same checkout. Plan 175-05 makes the first of both.

## Task 1 — the baseline, as read

- `BASE` (`175-BASE`): `c030a0d4fcd6a3a5e1418bf6b882ae03988ef67b`. The commit exists and is an ancestor of HEAD.
- The baseline run `tests/e2e-runs/261008-quick-g2-g4-g6`: its `head` file holds the same hash; its `exit` holds 0; one preflight success, no failure; not void.
- `B`, the commit that added `175-BASE`: `9cc0f79b57e185e82b9144ec3511253f31ac952d`. `git diff --quiet BASE B -- . ':(exclude).planning'` exits 0.
- Counts from its `summary.json`: total 220, passed 220, failed 0, flaky 0, skipped 0, didNotRun 0; 107 projects, every one fully passed, their totals summing to 220.
- The directory holds no `command` file (it was made through the wrapper directly). Its `results.json` records the invocation: the tests directory with `--grep-invert @probe` and no `--project`.

Per-project totals (107): a11y-smoke 16 · admin-access 1 · auth-service-contract 2 · auth-setup 2 · cold-entry-dataroot 3 · cold-entry-dataroot-contestant 1 · contestant-a11y-scan 22 · contestant-entity-selection 8 · contestant-journey 1 · contestant-terms-gate-phone 2 · eperm07-term-trigger 1 · invitation-contract 15 · invitation-landing 3 · performance 1 · storage-cleanup 3 · voter-alliance 1 · voter-dark-mode 1 · voter-journey 2 · voter-journey-mobile 1 · voter-nominations 1 · voter-prefs-tracking 3 · voter-results-redraw 5 · the four base setups `data-setup-admin-auth` 1, `data-setup-base` 1, `data-setup-contestant-journey` 1, `data-setup-entity-selection` 3 · the four base teardowns `data-teardown-admin-access`, `-base`, `-contestant-journey`, `-entity-selection` 1 each · 26 `data-setup-perm-*` at 1 each · 26 `data-teardown-perm-*` at 1 each · the 25 `perm-*` projects (the `analytics-tracking` dataset has a setup and a teardown and no project of its name): 1e1cg1co 1, 2e-asymmetric 1, 2e-shared 2, access-disable 3, answers-locked 3, closed-project 11, disable-allow-open 3, disable-election-1co 1, disable-election-2co 1, disjoint-1co 2, header-show-help 1, hide-all-nominations 1, hide-category-tags 1, hide-election-tags 1, hide-hero 1, hide-if-missing-answers 1, interactive-info 4, localisation-positive 2, missing-nominations 1, not-located-2e2cg 5, org-matching 3, per-app-notifications 2, question-video 4, show-feedback-survey 6, startfromcg 2.

## Task 1 — what the three scripts are

**`175-gates.sh <label> [--rows <names>]`** — fourteen rows in this fixed order: `typecheck`, `lint`, `db-reset`, `types-regen`, `types-clean`, `pgtap`, `sql-lint`, `integration`, `unit`, `check-frontend`, `build`, `format`, `docs-links`, `name-gate-self-test`. Output under `tests/e2e-runs/175-gates/<label>/`. Carried unchanged from Phase 174's driver: `run_gate`, `TURBO_FORCE=true`, the Node selection, the clean-tree refusal, the label refusal, `gate_types_regen`, `gate_types_clean`, `on_exit`, `power.txt`, `--rows`, the exit codes. Changed: the `auth-config` and `stack` rows are not rows (the header says why); the in-flight search for a `started` file without an `ended` beside it has no depth limit; the new `integration` row reads `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` from `supabase status -o env` into shell variables, exports them in a subshell for the one vitest process with `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1`, writes `integration.json` into the run directory and returns 3 when a field cannot be read. `integration` is one of the rows that need the local stack.

**`175-e2e.sh <label> [--project <name>] [--require-project <name>]...`** — Phase 174's driver re-pointed to `tests/e2e-runs/175-e2e/<label>`: the same guards, build-cache prune, Docker VM free-space refusal, port refusal, wrapper call with `--run-dir` and `--no-db-reset`, `e2e-evidence.mjs`, `head`, `exit`, `playwright-exit`, power window and status 8 named VOID.

**`175-verdict.mjs`** — exit 0 pass, 1 fail, 2 usage, 3 void. Subcommands: `dir`, `gates`, `e2e`, `control` (`--red` or `--green [--were-red-in]`), `determinism`, `scope`, `hygiene`. A label resolves to `<label>-rN` with the highest N that exists as a directory, compared as a number, else `<label>`; `run: <directory>` is the first line of every verdict that takes a label, and the directory read for `--same-projects-as` and `--were-red-in` is printed too.

Each passing branch was seen refusing before it is relied on, on a scratch copy of the script pointed at copies of earlier runs' evidence (46 cases, all as expected; the scratch files are outside the repository): a void run exits 3 from `e2e`, `control` and `determinism`; a stale run fails `e2e`, `gates` and `determinism`; a 6-row run fails `gates` without `--rows` and passes with its own six; a 15-row Phase 174 run fails as "not the full gate set of 14"; the comparison with the baseline's path fails for a run that lacks one of its projects; `--expect-title-count` with 999 fails; a red control passes `--red`, fails `--green`, fails `e2e --allow-slice`, fails with a `--dirty-only` path that does not cover its dirty path, with a setup project the run does not hold, with a `--red` substring that names only one of its two red tests, and with a clean recorded worktree status; a green uncommitted run passes `--green --were-red-in <the red one>` and fails `e2e`; a three-run ledger passes `--runs 3` and fails `--runs 4`. The plans' own refusal checks (175-05, 175-06, 175-09, 175-13) still stand: these were copies, not runs of this phase.

## Task 2 — the repair

**Population before the task** (`git grep -n "mainInputs" -- apps/frontend/src` at the commit before the test commit): 21 lines in 8 files — `Input.svelte` 6, `MultilingualTextPart.svelte` 5, `SelectMultiplePart.svelte` 3, `MultipleTextPart.svelte` 3, the three `.type.ts` files 1 each, the guard file 1. Every line was in this task's files. After the task the command prints nothing, and the name appears nowhere outside `.planning/`.

**Red, on `26f8e73a7`** (`tests/e2e-runs/175-unit/175-01-input-red.json`, exit 1, 18 cases). Failed, each on `AssertionError: expected 1 to be +0`:

- `ownership warnings on mount logs no ownership warning on mount of a text-multilingual input, whose part holds the field that takes focus`
- `… of a textarea-multilingual input, …`
- `… of a select-multiple input, …`

The other 15 passed: the four focus-return cases, the two new multi-text cases (zero today through the compiler's limit), and the nine kinds that hand no focus target to a part.

**Green, on `548fc75b9`** (`175-01-input-green.json`, exit 0): the same 18 cases, all passed. The test file is byte-identical at the two heads.

**What changed.** Each part declares its own references (`fields: Array<HTMLElement> = $state([])` in the two text parts, one `dropdown` reference in `SelectMultiplePart`), binds its fields into them, and declares `export function focus(): void`, which focuses the first field and does nothing when none is rendered. The `mainInputs` member left the three `.type.ts` contracts and the three props destructurings. `Input.svelte` holds the rendered part in `focusablePart` through `bind:this` at the three places a part is rendered, and `refocus()` calls `focusablePart?.focus()`. The four "bind: keep" comments were removed: the code says it. `parts/README.md` states the contract. No kind, prop or part was added to `Input`, and `Input.type.ts` is unchanged.

**What `svelte-check` said of the bound part.** It typed it without the fallback: `let focusablePart: MultilingualTextPart | MultipleTextPart | SelectMultiplePart | undefined = $state();` — the three component types as a union, as `ConfirmationModal` types its `Modal` — with 0 errors and 0 warnings over 2120 files. The object-with-optional-`focus` holder was not needed.

**A `type` prop that changes while mounted** (the todo's other unchecked item), observed in a scratch test that was not committed: `text-multilingual` → `multiple-text-multilingual`, the reverse, and `text-multilingual` → `textarea-multilingual`. In each the first field was a new element after the change, and after the translations toggle focus was on the first field of the newly rendered part. The holder follows the live part. The first attempt at that scratch test also reproduced the todo's adjacent fact 1: a `$state` proxy handed in as `value` throws `DataCloneError` at mount.

**The code review checklist**, each item with its outcome, over the eight source files and the guard file:

| Item | Outcome |
|---|---|
| Solves the issue | yes — zero warnings for every kind, focus return intact |
| OWASP top 10 | nothing applies: no input handling, auth, data path or dependency changed |
| Code style guide | `Array<T>` form, explicit return types, TSDoc on the three exports and the three holders; Prettier and ESLint clean (Prettier reformatted two parts before the commit) |
| No `any` | none added |
| No repetition | `fields[0]?.focus()` is one line in two parts over differently indexed arrays; a shared helper would put a shared object back across the boundary — left as it is |
| New entities documented | `focus()` in three TSDoc blocks and three `@component` docstrings ("Bindable functions", the heading `Modal` and `Alert` use) |
| Repo markdown updated | `parts/README.md` gained the paragraph on the contract |
| Tracking events | nothing a user can perform is added |
| New Svelte components | none |
| Errors handled | no new failure path; `focus()` is a no-op without a field |
| Failing checks | none |
| Parts sharing the dependency | the three parts are imported by `Input.svelte` alone (searched); `Input`'s own props are unchanged, so its callers (`QuestionInput`, `PreviewAllInputs` and the three contestant pages) are untouched |
| WCAG A/AA, keyboard and screen reader | no markup, role, label or attribute changed; the four focus-return cases hold. The axe scans and the journeys run in plan 175-05's full run |
| Docs guides | the three generated component pages restate the docstrings and are regenerated in plan 175-13 |
| Comment hygiene | every touched comment read; `yarn assert:comment-hygiene` exit 0 |
| Commit history | test, then fix; no fix of a fix; no formatting-only change |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

**The components skill's re-check list:** docstrings and `.type.ts` files present; the parts stay out of the barrel by the README's rule; neither `SKILL.md` nor `context-reactivity.md` names the array or the parts; `generate:docs` is deferred to plan 175-13.

## Deviations from Plan

**1. [CLAUDE.md rule] In `175-e2e.sh` and `175-verdict.mjs`, a Sleep entry in the power log does not call a run VOID.** Phase 174's E2E driver and verdict print "the run is VOID, not red" on a Sleep entry inside the run window. CLAUDE.md and PROH-175-02 say only the wrapper's marker makes a run void. The copied header paragraph, the one `power.txt` line and the verdict's power line now say the entry is informative. Task 1, `cfb0be608`. The gate driver's `power.txt` block is kept as it stands, as the plan says: gate rows have no wrapper and no marker.

**2. [Rule 2 — T-175-01] The `e2e` verdict also refuses a run whose recorded worktree status holds an uncommitted path outside `.planning/`.** Control runs land in the same directory root as driver runs. Without it, a green run of an uncommitted tree judged before its commit reads as a run of a committed tree. A driver-made run always passes it, because the driver refuses a dirty tree first. Task 1.

**3. The `control` verdict reads the Playwright invocation from `results.json`.** A wrapper-direct run has no `command` file: the wrapper prints that line on its own output only. The verdict reads `command` when the directory has one and `config.argv` of `results.json` otherwise. Task 1.

**4. `--min-total-of` is not carried.** The plan's `e2e` signature does not list it and no plan of the phase calls it (searched).

**5. A label's newest attempt is the highest `-rN` directory that exists**, as the plan writes it. Phase 174's script also required a `head` file in it. Consequence: a `-rN` directory a driver claimed and then refused in (the Docker free-space refusal leaves only `done`) is the newest attempt and is judged as it stands.

**6. `SelectMultiplePart` holds one `$state` reference, not a one-element array.** The plan's action says a `$state` array in each part. The dropdown is one element, and a single private reference is the form `PasswordField` and `ImagePart` use. The acceptance criteria and the verify command hold.

**7. `parts/README.md` gained a paragraph instead of a correction.** It described the array nowhere, so there was nothing to correct; the contract a new part must follow is now stated there.

**8. Process: the population of Task 2's step 0 was printed after the edits, from the pre-task commit.** The first command that held the grep ended early on a shell error before reaching it. The eight files had been read whole before the first edit; the derived population (21 lines, 8 files, all in the task's files) is the one above.

**Not recorded in `.planning/WINDOWS.md`:** no stub, skipped test or unrun verify exists, and the ledger is a shared planning file beside a wave-mate.

## What was not done or not verified

- **No row of `175-gates.sh` has run**, the new `integration` row included. Checked: syntax, the refusals for a missing label, an unknown row and a missing `--rows` value, and the key capture against the running stack by length only (the URL read; both keys non-empty; nothing printed). Its first real run is plan 175-05's.
- **`175-e2e.sh` has not run past its usage refusals.**
- **The verdict's run-reading branches were exercised on copies of Phase 174 evidence, not on a run of this phase.**
- **No browser run of the repair.** The proof is jsdom plus the dev compiler; the full default E2E run that closes the todo is plan 175-05's.
- **The Input ownership todo stays in `pending/`**; plan 175-13 closes it.

## Files touched that the plan did not list

None in the repository. Gitignored evidence: `tests/e2e-runs/175-unit/175-01-input-red.json`, `-red.head`, `-green.json`, `-green.head`. An untracked scratch test (`zzTypeChangeScratch.svelte.test.ts` in the input directory) was created and removed twice and never staged.

## What the next plans should know

- **175-05:** the first gate-set run and the first driver E2E run. The baseline path for `--same-projects-as` is `tests/e2e-runs/261008-quick-g2-g4-g6`. A wrapper-direct run needs no `command` file for `control`; `e2e` without `--allow-slice` does need one, and only the driver writes it. A `--dirty-only` path that names a directory ends with a slash; a wholly untracked directory is one status line and is covered only by a `--dirty-only` directory that contains it.
- **175-06 and any plan that adds a part to `Input`:** a part that renders a field focus returns to exports `focus()` and is added to the `focusablePart` union in `Input.svelte`; a colour kind rendered inline needs neither. A `$state` proxy handed to `Input` as `value` throws at mount.
- **175-09 to 175-12:** `control` reads the Playwright status from the wrapper's `exit` file, judges "failed on an expectation" by a matcher call in the failure text with every result `failed`, and never refuses a run for being stale. `--were-red-in` takes every test the named run lists as failed, by project and title.
- **175-13:** three `@component` docstrings changed — `MultilingualTextPart`, `SelectMultiplePart`, `MultipleTextPart`, each with a new "Bindable functions" section — so their generated pages are stale until `generate:docs`. `determinism` takes the ledger directory as a path (`dir determinism <label>` prints it) and reads each run's own `exit`, `head`, preflight files and `results.json`. The batch script's fixed executed-count rule applies to unscoped batches only.
- **Orchestrator:** GEN-01 is this plan's requirement; nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited.

## Self-Check: PASSED

Checked after writing: the three scripts and the nine frontend files exist; `cfb0be608`, `26f8e73a7` and `548fc75b9` are ancestors of HEAD; the four evidence files exist under `tests/e2e-runs/175-unit/`.

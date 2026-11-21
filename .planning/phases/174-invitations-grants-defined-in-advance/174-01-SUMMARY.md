---
phase: 174-invitations-grants-defined-in-advance
plan: 01
subsystem: testing
tags: [preflight, name-map, gates, e2e, playwright, pgtap, hygiene, supabase-auth]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "the acceptance table, forceRegister's acceptance default and opt-out, the ordered gate list (9 of 9 plans executed)"
  - phase: 173-multi-entity-grants-entity-selection
    provides: "get_user_entities and get_entity_user_data, CONTESTANT_GRANTS, the root's three outcomes, the stale-token rule, the drivers this phase's are modelled on (13 of 13 plans executed)"
provides:
  - "174-NAME-MAP.md: every name the ten plans cite resolved on the tree, A1 to A11 and baseline facts 1 to 23 re-measured, twenty-two populations, the baseline, and sixteen items for the plans they touch"
  - "174-gates.sh (fifteen rows, thirteen before 174-03), 174-e2e.sh (--require-project), 174-verdict.mjs (gates, e2e, greps, exemptions, hygiene), 174-stack-probe.sh, 174-bankauth.sh"
  - "the baseline 174-01-baseline: thirteen gate rows at 0 and the full default E2E suite at 198 of 198 in 103 projects, on the tree before any source edit"
affects: [174-02, 174-03, 174-04, 174-05, 174-06, 174-07, 174-08, 174-09, 174-10]

actuals:
  tokens: 44800
  tasks: 2
  commits: 4
plan_head_before: 4125e579867cddef1f76287048107d57339fdbcd
plan_head_after: 4d75588368eddb34c228992d16bdabdaa041fc27

tech-stack:
  added: []
  patterns:
    - "A hygiene verdict over the phase's own scripts and plan files: search patterns assembled from fragments, file forms judged in scripts and actions, container forms in scripts, automated verify commands and verification blocks"
    - "A probe hands its API keys to curl on standard input, so no key is on a command line"
    - "The database reset is its own gate row, ahead of the types, pgTAP and the SQL lint"

key-files:
  created:
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-gates.sh"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-e2e.sh"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-verdict.mjs"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-stack-probe.sh"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh"
  modified: []

key-decisions:
  - "The drivers were committed and the baseline started before the name map was written, so the measuring was done while the runs were in flight; every commit is under .planning/ and both runs describe one tree"
  - "The hygiene verdict follows Task 2's split of the forms by region; a form found where it is not a hit is printed as advisory and changes no status"
  - "No requirement is marked complete: this plan is a preflight, and INV-01 and INV-03 are delivered by 174-02 and 174-04"

patterns-established:
  - "A later plan that runs pgTAP through --rows names db-reset as well, or is judged on whatever the database holds"

requirements-completed: []

coverage:
  - id: D1
    description: "Phases 172 and 173 are shown to have executed, and 174-NAME-MAP.md holds every resolved name, every re-measured fact and every starting population"
    verification:
      - kind: other
        ref: "the <automated> chain of Task 1 — exit 0; 41 fact rows, every verdict cell beginning with holds, differs:, deferred to, not measurable here: or not needed"
        status: pass
    human_judgment: false
  - id: D2
    description: "174-gates.sh, 174-e2e.sh and 174-verdict.mjs work: one gate run and one E2E run were made through them, and the verdicts gates, e2e, greps, exemptions and hygiene were each observed with their status"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-01-baseline --rows <the thirteen> — exit 0; e2e 174-01-baseline — exit 0; hygiene — exit 0, and exit 1 with fifteen hits on the negative control"
        status: pass
    human_judgment: false
  - id: D3
    description: "174-stack-probe.sh and 174-bankauth.sh exist and pass syntax, usage and hygiene checks; neither was run against the stack, as the plan directs"
    verification:
      - kind: other
        ref: "bash -n; usage refusals exit 2; the probe's parsing helpers on sample input"
        status: unknown
    human_judgment: true
    rationale: "Their first live run is plan 174-03's. Nothing here shows the probe's rows against a running auth service or the driver's restore; 174-03 Task 1 step 1 is the first observation"
  - id: D4
    description: "The gate set and the full default E2E suite are green on the tree before this phase edits a source file"
    verification:
      - kind: other
        ref: "tests/e2e-runs/174-gates/174-01-baseline — thirteen rows, every status 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/174-e2e/174-01-baseline — 198 of 198, 103 projects, 0 failed, 0 flaky, 0 did not run"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-06
status: complete
---

# Phase 174 Plan 01: Preflight — Name Map, Drivers and a Green Baseline Summary

**Phases 172 and 173 shown executed, every assumption of the ten plans turned into a measurement in `174-NAME-MAP.md`, five drivers written (with a hygiene verdict that fails on fifteen planted forms and passes on the phase's scripts and plans), and the tree recorded green before any source edit: thirteen gate rows at 0 and the full default E2E suite at 198 of 198 in 103 projects.**

## Performance

- **Duration:** about 24 min
- **Started:** 2026-10-06T19:23Z
- **Completed:** 2026-10-06T19:47Z
- **Tasks:** 2 of 2
- **Files modified:** 6, all new, all under `.planning/` (four commits, measured from the plan's ledger)

## What the Plan Asked to Have Recorded

- **Rows marked DIFFERS or `differs:`, and the plan each touches** — § *What Differs* below; the name map's last section holds the same list with its notes.
- **The INV-02 record verdict:** record already corrected. `REQUIREMENTS.md` INV-02 and roadmap criterion 2 both carry the amended wording ("… whatever role it promises, or carrying a code the project already holds, whatever its target. (amended 2026-10-06, 174-A3 (c), 174-B3)") and neither carries `UNRESOLVED`. Neither file was edited.
- **The state of Phase 175:** not executed and not planned; no directory, PLAN and SUMMARY counts 0. It regenerates the migration after this phase.
- **The baseline gate rows and E2E counts** — § *Gates and Runs*.
- **The starting output of `greps` and `exemptions`** — § *The Two Closing Verdicts at the Start*.

## Accomplishments

- The precondition was evaluated by command before any file was written: 9 PLAN and 9 SUMMARY files for Phase 172, 13 and 13 for Phase 173.
- `174-NAME-MAP.md` resolves every role the plans cite against the tree, in seven groups, each with the command that found it. A1 to A11, baseline facts 1 to 23, the two facts the research read from a 172 or 173 plan, and five unnumbered questions are each recorded as holding, differing, deferred to a named task or not measurable here. The stale-token rule is stated once, as binding on 174-08 and 174-09.
- The five drivers exist. `174-verdict.mjs hygiene` exits 0 over the five scripts and the ten plan files, and exits 1 with fifteen hits on a throwaway script and a throwaway plan file holding every forbidden form.
- The baseline is green on one tree, each run on its first attempt, on AC power under `caffeinate -dimsu`, with no Sleep entry in either window.

## Task Commits

1. **Task 2, steps 1 to 6: the five drivers** — `f3b651333` (chore)
   - the power-log filter of two drivers narrowed — `2297c6439` (fix)
2. **Task 1: the name and fact map** — `97c6a91e3` (docs)
3. **Task 2, steps 8 to 10: the baseline recorded** — `4d7558836` (docs)

**Plan metadata:** the commit that adds this file.

## Gates and Runs

Every status below was read from `$?` or a marker file, never through a pipe.

| Instrument | Label / command | Head | Result |
|---|---|---|---|
| Precondition | PLAN and SUMMARY counts of Phases 172 and 173 | `ab9c8989e` | 9 and 9; 13 and 13 |
| Driver checks | `bash -n` ×4; execute bits ×4; `node --check` | `4d7558836` | 0 each |
| Hygiene | `174-verdict.mjs hygiene` | `4d7558836` | exit 0: five scripts, ten plans, 0 hits, 2 advisory lines |
| Hygiene, negative control | the same, with two throwaway files beside the scripts | uncommitted | exit 1, fifteen hits; exit 0 again once they were removed |
| Gate set | `174-01-baseline`, `--rows` the thirteen `BASE_ROWS` | `f3b651333` | exit 0; thirteen rows, every status 0; verdict exit 0; first attempt |
| Full E2E | `174-01-baseline` | `97c6a91e3` | wrapper 0, Playwright 0; 198 of 198, 0 failed, 0 flaky, 0 skipped, 0 did not run, 103 projects, one preflight success; verdict exit 0; first attempt |
| Against Phase 173's close | per-project totals of `173-13-final` | — | 103 projects compared, none differing |
| Task 1 verify | the plan's `<automated>` chain | `97c6a91e3` | exit 0 |
| Task 2 verify | the plan's `<automated>` chain, each link read separately | `4d7558836` | 0 for each |
| Plan verification | `git diff --stat <base_rev>..HEAD -- . ':(exclude).planning'` | `4d7558836` | prints nothing |
| Stack health | `yarn db:status`; `OPTIONS` on the three functions; `170-allowlist-probe.sh after` | — | 0; 200, 200, 200; exit 0, every row OK |

Gate rows of `174-01-baseline` (seconds): typecheck 0 (20), lint 0 (49), db-reset 0 (29), types-regen 0 (3), types-clean 0 (0), pgtap 0 (5), sql-lint 0 (3), unit 0 (65), check-frontend 0 (10), build 0 (17), format 0 (20), docs-links 0 (1), name-gate-self-test 0 (0).

Counts read from the rows' logs, each equal to the figure Phase 173 closed on: pgTAP 38 files and 1447 tests; frontend unit 2546 passed and 7 skipped (the gated writer integration test without its variables); dev-seed 1015 in 67; supabase functions 206 in 15; linter census 104 policies, 20 tables partitioned, `0 error(s), 3 warning(s)`.

**Run directories.** `tests/e2e-runs/174-gates/174-01-baseline/` (window 22:34:28 to 22:38:10 local) and `tests/e2e-runs/174-e2e/174-01-baseline/` (22:38:42 to 22:44:46 local), each with `power.txt` recording `sleep_entries_in_window: 0`; markers and logs `174-01-baseline.exit` and `.log` beside each.

**Power.** Both runs on AC power. `pmset -g log` holds no Sleep entry after `2026-10-06 22:00:45 +0300` (a Maintenance Sleep, half an hour before the gate set started). No run is void and none was made twice.

**Not in this baseline.** The two opt-in bank-auth projects were not run. They were last green at Phase 172's close (8 of 8 and 134 of 134) and are unexercised since Phase 173 changed the login gate, the app root and the route tree. **Plan 174-03 is the first plan of this phase to run them.** The visual project and the tests' utility suite were not run either.

## The Two Closing Verdicts at the Start

Both fail on this tree, as the plan expects before the old path is removed.

`174-verdict.mjs greps` — exit 1: `invite-candidate` 75 hits in 33 files; `inviteUserByEmail` 15 in 9; `preregisterWithApiToken` 9 in 5; `complete-registration` 4 in 3. (`CLAUDE.md`, which the verdict excludes, is the 34th file of the first literal.)

`174-verdict.mjs exemptions` — exit 1: `EXEMPT` holds two entries; no entry names `get_candidate_user_data`; both count sentences say "exactly two" and agree with the array; the one failure is `EXEMPT still names 'invite-candidate'`.

## What Differs, and the Plan It Touches

Three rows of the name map's `## Names` are marked DIFFERS and three of its facts say `differs:`. With the notes a later plan needs, as the name map's last section has them:

1. **`git grep -n -E "^\s+name: '"` prints nothing on this host** — `-E` understands neither `\b` nor `\s`. With `-P`: 109 `name:` lines in the Playwright config. Touches 174-03, 174-06, 174-09.
2. **`ls apps/frontend/messages` lists eight entries:** the seven locales and `README.md`. A test comparing a locale set with the listing must list directories only. Touches 174-05.
3. **`getLinksInEmail` is a member of the bucket `createEmailBucket` returns, not an export.** Touches 174-06, 174-09.
4. **The abstract twin of `preregisterWithApiToken` is `_preregister`.** Touches 174-07.
5. **`ADMIN_GRANTS` admits no editor, and the Contestant App's login gate refuses a user with no contestant grant** (403 `grantNotAllowed`). A claimed `(project, editor)` promise opens neither app; a first-time invitee is admitted only if the claim and the refresh precede the gate. Touches 174-08, 174-09; ruling 18 hands both to Phase 178.
6. **`_getBasicUserData` tests the admin shapes first;** `role` is `'admin'`, `'contestant'` or `null`. Touches 174-08 where a test asserts a claimed user's role.
7. **pgTAP has only ever been shown green on a freshly reset database.** A `--rows` subset with `pgtap` and without `db-reset` is judged on whatever the database holds. Touches 174-02, 174-04.
8. **The only test of `envConfig.ts` is `invite-candidate`'s,** and `callerAuthority.test.ts` exists there alone. Touches 174-05 (which copies the new function carries) and 174-07 (`DUPLICATED_MODULES` must lose the two modules left with one copy).
9. **The lint chain has twenty links and three prose sentences state a position in it** ("link 6 of" once, "link 13 of" twice). A new gate goes at the end, or the sentences are corrected with it. Touches 174-03.
10. **`PROJECT_SCOPED_RPCS` and `PROJECT_SCOPED_EDGE_FUNCTIONS` are closed lists,** and the gate's test names the three functions literally. Touches 174-05, 174-07, 174-08.
11. **`config.toml` has two `enable_signup` and two `enable_confirmations` keys;** this phase's are under `[auth]` and `[auth.email]`. Touches 174-03.

Everything else the plans state about the tree holds: schema numbers 305 and 506 and pgTAP number 39 are free; the definer censuses hold six and seven names; `SAME_PERMISSION_ALLOW` holds one entry, `REACHES_NEITHER_ALLOW` ten (two for the terms table), `m17_unenforced_ratified` six; the name gate's list holds two entries; `[auth] enable_signup = true`, `[auth.email] enable_confirmations = false`, `[edge_runtime] policy = "oneshot"`, no `[functions.*]` table; both tracked templates say `SITE_URL=http://127.0.0.1:5173` and `SMTP_PORT=1025`.

## Decisions Made

- **Runs first, measuring during them.** See the first deviation.
- **`requirements-completed` is empty.** The plan's frontmatter names INV-01 and INV-03 as the requirements it serves. A preflight completes neither, and copying the ids would check them off nine plans early.
- **`base_rev` is the head the E2E run recorded** (`97c6a91e3…`). It is tree-equal outside `.planning/` to the gate run's head `f3b651333` and to the last source commit `2ea3b9d8d`, so any of the three serves the plans' `BASE_REV` diffs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The power record copied lines that are not Sleep or Wake entries**
- **Found during:** Task 2, reading the gate run's `power.txt`.
- **Issue:** the filter inherited from `173-gates.sh` matched the three words anywhere in a line, so two assertion lines naming a browser's "Wake Lock" were copied into the run window. The count of Sleep entries was anchored to its column already and was 0.
- **Fix:** the filter is anchored to the same column, in `174-gates.sh` and `174-e2e.sh`.
- **Verification:** the E2E run, made after the fix, has an empty window and `sleep_entries_in_window: 0`. The gate run's `power.txt` was written before the fix and keeps its two extra lines.
- **Committed in:** `2297c6439`

### Departures in procedure

- **The order of the two tasks.** The plan writes the name map, then the drivers, then runs the baseline. Here the precondition was evaluated first, then the drivers were written and committed, the gate set was started, and the name map was measured and written while the gate set and then the E2E run were in flight; its commit landed during the E2E run. The reason is the host: it suspended runs repeatedly the day before, and measuring during the runs halved the time a run was exposed. The cost: the gate run and the E2E run record different heads (`f3b651333`, `97c6a91e3`). They differ under `.planning/` alone, both verdicts report "tree-equal to HEAD outside .planning/", and no file outside `.planning/` changed in this plan. The map's commands read the working tree while the gate set ran; the one tracked file a gate row rewrites is the generated types file, which no command of the map reads.
- **A driver was changed between the two runs** (the fix above). It touches the power record only: the rows and the statuses of the gate run were produced by the committed `f3b651333` and are not affected.
- **What was read first.** The plan asks for the research whole and for every summary of Phases 172 and 173. The dispatch narrowed that: the research by section (how to read it, RQ-1, R-2 to R-6, the Assumptions Log), `173-13-SUMMARY.md` whole, three sections of `173-NAME-MAP.md`, and the hand-over section of `172-09-SUMMARY.md`. Every name in the map was resolved on the tree by command, not taken from a summary; the summaries were used for what Phases 172 and 173 say they left, and row X5 rests on `173-NAME-MAP.md` row X1.
- **The pre-commit branch assertion of the executor protocol** expects an `agent-*` branch in a worktree. This worktree is the operator's long-lived one on `feat/entity-signup-multi-grant`; commits were made there, as the standing notes direct.
- **`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` were not updated,** as the dispatch directs, and no entry was appended to the broken-windows ledger.

### Where the plan and the tree differ, measured and not bent

- **One population command cannot print on this host** (item 1 above). It is recorded with its exit status 1, and two `-P` forms beside it.
- **"`getLinksInEmail` in `emailBucket.fixture.ts`"** is found as a member, not an export (item 3).

### Beyond the plan's text

- **The hygiene verdict prints advisory lines.** A form found in a region where Task 2 does not make it a hit — a container form in an action, a file form in a verify command — is listed as advisory and changes no status. On this tree there are two, both in this plan's own description of the forms. A task of any type that is not a checkpoint is scanned as an `auto` task.
- **A negative control for the hygiene verdict,** made once with two uncommitted files and removed: three file forms and seven container forms in a script, two file forms in an action, two container forms in a verify command, one in a verification block; no hit for a comment line, the tracked template's name, a read of one named variable, a filtered log or a checkpoint's action.
- **`174-stack-probe.sh` hands its keys to curl on standard input,** which is stricter than the model's header on the command line; its cleanup pages through every auth user; and `before --only edge` with a `DIFFERS` exits 0, by the rule that a `DIFFERS` is a failure in `after` mode only.
- **`174-gates.sh` counts `stack` among the rows that need the stack up,** and keeps Phase 173's second refusal for `db-reset` (a run directory started within ten minutes and not ended) beside the port check the plan names.
- **`174-bankauth.sh` takes `BANKAUTH_SCRATCH_BASE`** from Phase 172's copy of the driver, a fifth small difference from `171-bankauth.sh`.
- **`174-verdict.mjs exemptions` has no expected-entries list.** It fails on an entry naming either deleted function and on a count sentence ("exactly <n> entries") that disagrees with the array, which is what the plan states.
- **`170-allowlist-probe.sh after` was run once at the end** as a health check of the auth container the gate set's reset recreated. It sends ten requests with an invalid token and touches no user.

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** none on scope; no file outside `.planning/` changed.

## Issues Encountered

None. Neither run was red or void.

## Known Stubs

None. The two scripts that were not run against the stack are complete as written and are named under D3 of the coverage block.

## Threat Model

| Threat | Disposition | What was done |
|---|---|---|
| T-174-01 a later task acting on an assumed fact | mitigate | A1 to A11 and the 23 baseline facts are each a row of the name map with its command; sixteen items name the plan each touches |
| T-174-02 a green verdict read from a stale or partial run | mitigate | the verdict requires every expected row, compares the run's head with HEAD outside `.planning/`, refuses a slice unless told, and reads no status through a pipe; both drivers refuse a dirty tree and an existing label. Observed: `gates nope` and `--rows bogus` exit 2 |
| T-174-03 a probe account surviving the probe | mitigate | written into `174-stack-probe.sh`: every `r174-probe-` user is deleted in both modes and none may remain. Not observed: the probe first runs in 174-03 |
| T-174-04 a key, a container's whole environment or a value of an untracked environment file printed | mitigate | no script of the phase names an untracked environment file or lists a container's environment; `hygiene` exits 0 and its negative control exits 1. No command of this plan read such a file or printed a container's environment; `170-allowlist-probe.sh` was used as it is |
| T-174-SC installs | accept | no package installed |

No new security surface: the plan changed planning files only.

## Prohibitions

- **PROH-174-01** held: `CAND-APP-PLAN.md` untouched and untracked; `CLAUDE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `PROJECT.md` and `STATE.md` unchanged from the plan's base (`git diff --quiet 4125e5798..HEAD -- <the five>` exits 0).
- **PROH-174-02** held: no run was made twice, no test skipped or annotated, nothing under `tests/e2e-runs/` deleted.
- **PROH-174-03** held: the stack was not restarted; the gate set's `yarn db:reset` is the only reset.
- **PROH-174-08** and **PROH-174-29** held, each checked by `174-verdict.mjs hygiene`.

## What 174-02 and 174-03 Must Know

**174-02 (the table and seeding)**

- Read `174-NAME-MAP.md` first. The free numbers are as planned: `305-invitations.sql`, `506-invitation-rpcs.sql`, `39-invitations.test.sql`.
- Compare against: gate rows of `174-01-baseline`; pgTAP 38 files and 1447 tests; linter census 104 policies and 20 tables partitioned, 3 warnings.
- `SAME_PERMISSION_ALLOW` holds one entry (`['public', 'admin_jobs', 'project.edit_questions']`, a reason line above it) and becomes three; `m17_unenforced_ratified` holds six members and becomes four, and the three comment lines above it ("grant administration; public.grants carries no user-facing policy at all" / "the same" / "the same, at entity scope") need rewording with it. Both edits only if the linter and file 25 report exactly `project.manage_editors` and `account.manage_admins`.
- This phase's gate driver has the reset as its own row. A subset that runs `pgtap` or `types-regen` names `db-reset` too, as the plans' `--rows` lists already do; the gate set then destroys local data, so re-seed with `yarn db:seed:default` at the end.
- pgTAP file 37 Section 7 turns red for anything that reads `terms_of_use_acceptances`.

**174-03 (the auth configuration; not autonomous)**

- **It is the first plan to run `174-stack-probe.sh` and `174-bankauth.sh` against the stack.** Both are untested live. The probe's `before` mode creates two users through open sign-up and deletes them through the admin API; read its cleanup row before anything else. Its edge rows end in `EQUAL` or `DIFFERS` and no other line of its output does.
- **It is the first plan to run the two bank-auth projects since Phase 173.** A red there has two candidate causes, Phase 173's changes to the login gate, root and route tree, and this plan's own auth configuration; diagnose from the trace before attributing it. `identity-callback` redirects to `/contestant`, now the root's three-way decision, and `findExistingCandidate` throws for a user who edits two candidates.
- The running edge container's `SITE_URL`, `SMTP_HOST` and `SMTP_PORT` were not read here. The research read `SMTP_PORT=2500` there against the template's `1025`; expect the checkpoint of Task 3 to be needed.
- The `[auth]` and `[auth.email]` keys each have a namesake under another provider table: anchor on the table header.
- A gate added to `yarn lint:check` goes at the end of the chain, or the two "link 13 of" sentences and the "link 6 of" sentence are corrected in the same commit.
- Playwright project names are listed with `git grep -P`, not `-E`.
- From 174-03 on the full gate set is fifteen rows and is run without `--rows`.

**Every later plan**

- The claim flow is session → `claim_invitations` → `refreshSession()` → gates. A grant the token predates is neither listed nor readable when the entity is not public, is listed and readable but refused on every write when it is, and a removed grant stops being listed at once.
- `174-e2e.sh` and `174-gates.sh` refuse a dirty tree, so a negative control goes through `tests/scripts/e2e-run.sh` directly. Start every run under `caffeinate -dimsu` and read `power.txt` before judging it.
- Known open defects, none of them this phase's: the terms-of-use view overflows at 390px and leaves focus on `<body>`; the navigation drawer does not close on Escape; `Error formatting nomination` is logged three times per full run (three times in this baseline too).

## State Left Behind

The local stack is up (`yarn db:status` 0; `OPTIONS` 200 on the three functions; the auth allowlist probe exits 0). The database holds migrations, `seed.sql`, the pgTAP helper functions the gate run left in `public`, and the `default` dataset (`yarn db:seed:default` exit 0, 752 rows; 328 candidates): no auth user on `test.openvaa.local`, no `test-` candidate, two rows in `grants`, no acceptance row. No dev server: nothing listens on 5173, 5273, 8777 or 9443. The working tree is clean but for the operator's untracked `CAND-APP-PLAN.md`.

## User Setup Required

None in this plan. Plan 174-03 carries the phase's one operator checkpoint.

## Self-Check: PASSED

- Files: the name map, the five drivers and this summary exist on disk; both run directories hold their summaries.
- Commits: `f3b651333`, `2297c6439`, `97c6a91e3` and `4d7558836` are ancestors of HEAD; `git rev-list --count 4125e5798..HEAD` was 4 when this file was written.

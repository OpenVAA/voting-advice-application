---
phase: 178-sign-in-email-code-registration
plan: 01
subsystem: testing
tags: [e2e, gates, verdict, baseline, stack-probe, bank-auth, operator-rulings, planning-drivers]

requires:
  - phase: 177-define-nominations
    provides: "the closing summary and the verification report (status passed), the three drivers and the reading command this plan copies, and the closing full run this plan compares its own baseline with"
  - phase: 174-invitations-grants-defined-in-advance
    provides: "the stack probe, the bank-auth driver and the two gate rows auth-config and stack"
provides:
  - "178-gates.sh — seventeen gate rows, each status read directly; the three added are auth-config, auth-config-self-test and stack"
  - "178-e2e.sh — one preflight-confirmed full or one-project E2E run of a committed tree"
  - "178-verdict.mjs — dir, gates, e2e, control (with --full), determinism, scope (this phase's refusal list), hygiene"
  - "178-stack-probe.sh — what the running auth service and edge runtime hold against what the tree states; no argument"
  - "178-bankauth.sh — the two opt-in bank-auth projects, then the stack restored and probed"
  - "178-read-rulings.mjs — the fixed-rule reading of a decision document; H1 ticked on (b) alone reads as applied"
  - "178-BASE and 178-BASELINE — the base commit and the baseline run every later comparison starts from"
  - "178-BASELINE-FACTS.md — the baseline's numbers, the hand-over names as found, the operator's rulings as read"
affects: [178-02, 178-03, 178-04, 178-05, 178-06, 178-07, 178-11, 178-14, 178-15, 178-16, 178-19, 178-20, 178-24]

actuals:
  tokens: 34650
  tasks: 2
  commits: 3
plan_head_before: b49642cce634611ef636414d992b964f7906d563
plan_head_after: 15130c485304328739a7d8e8c2935dbe691c03e1

tech-stack:
  added: []
  patterns:
    - "A probe that compares the running services with the tree needs no before and after mode: the same call judges the stack on either side of a change of the configuration"
    - "A full run of an uncommitted tree is judged by `control --full`, which counts this run's projects from its own results.json"

key-files:
  created:
    - .planning/phases/178-sign-in-email-code-registration/178-gates.sh
    - .planning/phases/178-sign-in-email-code-registration/178-e2e.sh
    - .planning/phases/178-sign-in-email-code-registration/178-verdict.mjs
    - .planning/phases/178-sign-in-email-code-registration/178-bankauth.sh
    - .planning/phases/178-sign-in-email-code-registration/178-stack-probe.sh
    - .planning/phases/178-sign-in-email-code-registration/178-read-rulings.mjs
    - .planning/phases/178-sign-in-email-code-registration/178-BASE
    - .planning/phases/178-sign-in-email-code-registration/178-BASELINE
    - .planning/phases/178-sign-in-email-code-registration/178-BASELINE-FACTS.md
  modified: []

key-decisions:
  - "The baseline is a run of this plan's own (178-01-baseline): Phase 177's closing run is complete and green, and its head differs from the base commit by two lines of two docs pages"
  - "scope's refusal sentences: the pre-registration tree, its API route and identity-callback are Phase 179's; send-email is a later phase's"
  - "control --full takes --same-projects-as and --except; without --full they are a usage error, so the one-project form reads as it did"

patterns-established:
  - "The stack row is the last gate row and is among the rows that refuse without a running stack"
  - "Refusal cases are run on scratch copies with GIT_DIR pointed at this checkout; a chosen diff for scope comes from a throwaway repository"

requirements-completed: []

coverage:
  - id: D1
    description: "Five drivers of the phase's own, copied and re-pointed, with seventeen gate rows, scope's own refusal list and control --full"
    verification:
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-01-t1-verify.sh (Task 1's automated block, byte for byte) — exit 0 at head 15130c485"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-01-refusals.sh — 52 cases on scratch copies, 52 as expected"
        status: pass
      - kind: other
        ref: "bash 178-gates.sh 178-01-rows --rows auth-config,auth-config-self-test,stack; node 178-verdict.mjs gates 178-01-rows --rows … — exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The base commit and a baseline full run of the base commit's tree: 444 of 444 in 116 projects, not void"
    verification:
      - kind: e2e
        ref: "bash 178-e2e.sh 178-01-baseline; node 178-verdict.mjs e2e 178-01-baseline — exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The operator's rounds read by one command: section H with H1 applied (b) and thirty-five items at their recommended option; the UI contract's round untouched and approved"
    verification:
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-01-t2-verify.sh (Task 2's automated block, byte for byte) — exit 0 at head 15130c485"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every name the plans read from Phases 171 to 177 found on the tree (52 of 52), and the two-argument form of create_invitations recorded"
    verification:
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-01-t2-verify.sh — exit 0; 178-BASELINE-FACTS.md, 'Names missing: 0'"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 01: The Phase's Drivers, its Baseline, the Operator's Rounds as Read and the Hand-over of Phases 171 to 177 — Summary

**Six scripts of the phase's own — a seventeen-row gate driver, an E2E driver, a verdict script whose `control` takes `--full` and whose `scope` admits what this phase edits, a stack probe that compares the running services with the tree, a bank-auth driver and a reading command that takes H1 at (b) as applied — with a baseline full run of the base commit's tree (444 of 444 in 116 projects) and a facts file written by a command.**

## Read this first

- **Nothing of the application was built.** Every commit is in the phase directory; `git diff --quiet b49642cce HEAD -- . ':(exclude).planning'` exits 0.
- **A baseline run was made**, `tests/e2e-runs/178-e2e/178-01-baseline`. Phase 177's closing run is complete and green but its head is not tree-equal to the base commit, so Task 1 step 7's third branch applied. The first dispatch's finding on this point was re-derived and holds.
- **The reading of section H exits 0 and prints `H1: applied (b)`.** No item halts. The decision document was not edited.
- **Task 1 is two commits, not one**, because step 7 commits the scripts before the baseline run exists (deviation 1).

## Performance

- **Duration:** 25 min
- **Started:** 2026-10-12T15:51:09Z
- **Completed:** 2026-10-12T16:16:00Z
- **Tasks:** 2 of 2
- **Files created:** 9, all in the phase directory; none modified

## Task Commits

1. **Task 1: the precondition, the five drivers, the base commit** — `89c842067` (chore): the five scripts and `178-BASE`
2. **Task 1: the baseline run** — `4ba1b1b14` (chore): `178-BASELINE`
3. **Task 2: the rounds as read and the hand-over** — `15130c485` (docs): `178-read-rulings.mjs`, `178-BASELINE-FACTS.md`

Measured: `git rev-list --count b49642cce..HEAD` was 3 when this file was written.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to a script file and run with `bash`; log, exit status and head are kept beside it under `tests/e2e-runs/178-unit/`.

| Verify | Run | Head | Exit |
|---|---|---|---|
| Task 1 (`178-01-t1-verify.sh`) | with `178-BASELINE` staged, before its commit | `89c842067` | **0** |
| Task 1 | at the final head | `15130c485` | **0** |
| Task 2 (`178-01-t2-verify.sh`) | with both files staged, before their commit | `4ba1b1b14` | **0** |
| Task 2 | at the final head | `15130c485` | **0** |

No stage of either block had a defect: neither needed a command of my own in its place. Both blocks had been parsed and not run by the quick task that rewrote them; both ran as written.

## Task 1 — the gate, the drivers and the baseline

### The gate (step 1)

`177-21-SUMMARY.md` and `177-VERIFICATION.md` are tracked; the report's frontmatter reads `status: passed`; `git status --porcelain -- . ':(exclude).planning'` printed `?? CAND-APP-PLAN.md` and nothing else. All observed.

### How each script differs from its original

| Script | From | Changes beyond the re-pointing |
|---|---|---|
| `178-gates.sh` | `177-gates.sh` | Three rows after the fourteen, in this order: `auth-config` (`node scripts/assert-auth-signup-closed.mjs`), `auth-config-self-test` (the same with `--self-test`), `stack` (`bash $PD/178-stack-probe.sh`). The first and the last are `174-gates.sh`'s lines, the last without a mode. `ALL_ROWS` and the header name seventeen. `stack` is in the list of rows that refuse without a running stack. The header's paragraph that said why Phase 176 dropped the two rows now says why they are rows here. |
| `178-e2e.sh` | `177-e2e.sh` | None. The run-directory note it writes is `178-preflight.txt`. |
| `178-verdict.mjs` | `177-verdict.mjs` | `ALL_ROWS` holds seventeen. `scope`'s refusal list replaced (below). `control` takes `--full` (below). |
| `178-stack-probe.sh` | `174-stack-probe.sh` | No mode and no `--only`: any argument is a usage error (exit 2). Rows 1 to 6 are the original's, expected as its `after` mode expects them. Two new rows compare the auth container with `config.toml`; one new row asks the served `account-access` function; the three edge rows are the original's and a `DIFFERS` there is now always a failure. The cleanup row is last, after the function request, and expects `0 found, 0 left`. The probe's address prefix is `r178-probe-stack-`. It reads a table-scoped key of `config.toml` with `awk`, and exits 3 when the template, the configuration or the contract file is missing. |
| `178-bankauth.sh` | `174-bankauth.sh` | One argument, `<label-stem>`; the optional mode is gone. After its restore it runs `bash $PD/178-stack-probe.sh` in place of `170-allowlist-probe.sh after` and `174-stack-probe.sh <mode>`. The header's account of what it took from Phase 171's driver is replaced by what the script does. |
| `178-read-rulings.mjs` | `177-read-rulings.mjs` | The table `APPLIED = { H1: 'b' }` and one branch in the chain (Task 2). |

**`scope`'s refusal list.** A changed path under `apps/frontend/src/routes/contestant/preregister/` (Phase 179's), under `apps/frontend/src/routes/api/contestant/` (Phase 179's), under `apps/supabase/supabase/functions/identity-callback/` (Phase 179's), under `apps/supabase/supabase/functions/send-email/` (a later phase's), the file `apps/supabase/supabase/tests/database/00-helpers.test.sql` (the shared helper every pgTAP file reads) and `CLAUDE.md` (the operator's). It no longer refuses `account-access`, `config.toml`, `hooks.server.ts` or the auth API routes.

**`control --full`.** In place of `--project <name> --setup <project>`. The recorded Playwright invocation must name no `--project` (and a run with no recorded invocation fails); no setup project is checked; `--red` looks for its titles in every project and `--green` requires at least one test in the run. The directory's four records, the preflight, the void marker, the uncommitted paths and the Playwright status are judged as before. `--same-projects-as <label-or-path>` and `--except <project>=<delta>` are accepted with `--full` only: this run's per-project numbers are counted from its `results.json`, the other run's are its `summary.json`'s (its `results.json` where it has no summary). `--full` beside `--project` or `--setup`, `--same-projects-as` without `--full`, and `--except` without `--same-projects-as` are usage errors (exit 2).

**The stack probe's rows, as run on the stack as it stands (exit 0):**

| Row | Running | Tree / expected | Verdict |
|---|---|---|---|
| container `GOTRUE_DISABLE_SIGNUP` | true | true | OK |
| container `GOTRUE_MAILER_AUTOCONFIRM` | false | false | OK |
| settings `disable_signup` | true | true | OK |
| settings `mailer_autoconfirm` | false | false | OK |
| live `POST /signup` | 422 signup_disabled | 422 signup_disabled | OK |
| live `POST /otp` with `create_user` | 422 signup_disabled | 422 signup_disabled | OK |
| `GOTRUE_PASSWORD_MIN_LENGTH` / `minimum_password_length` | 6 | 6 | EQUAL |
| `GOTRUE_HOOK_SEND_EMAIL_ENABLED` / `[auth.hook.send_email] enabled` | false (unset) | false (no such table) | EQUAL |
| `account-access` `request-recovery` / `contract.ts` | 400 bad-request | does not name it | EQUAL |
| `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` | as the template | as the template | EQUAL ×3 |
| probe users | 0 found, 0 left | 0 found, 0 left | OK |

It was run twice against the stack: once directly, once as the `stack` row of `178-01-rows`.

### The three added rows, run once

`bash $P/178-gates.sh 178-01-rows --rows auth-config,auth-config-self-test,stack` (in the background, after the baseline run had ended): exit 0, rows `auth-config=0 auth-config-self-test=0 stack=0`. `node $P/178-verdict.mjs gates 178-01-rows --rows auth-config,auth-config-self-test,stack`: **PASS (0)**; the same without `--rows`: **1**, a subset is never read as the full set. The plan does not ask for this run (deviation 4). A full seventeen-row gate set was not made by this plan.

### The base commit and the baseline (step 7)

- **Base commit:** `06d81c75e5b1acda70031018715e88fa45158feb` (`git log -1 --format=%H -- . ':(exclude).planning'`), an ancestor of HEAD.
- **The candidate**, `tests/e2e-runs/177-e2e/177-21-final`, read from the directory itself: `summary.json` present; `exit` 0; no `VOID-host-suspend.txt`; `provenance.txt` holds `project: <full default suite>`; 444 passed of 444, failed, flaky and did-not-run 0. Its head `f71107820` is **not** tree-equal to the base commit outside `.planning/`: `git diff --stat` shows one line in each of two docs pages (`developers-guide/contestant-app/defining-nominations/+page.md`, `publishers-guide/preparing/candidates-and-parties-data-be/+page.md`), from commit `06d81c75e`. So no earlier run describes this tree.
- **A baseline run was made**: `bash $P/178-e2e.sh 178-01-baseline`, in the background, at head `89c842067`.
  - Before it: battery 94 %, discharging; port 5273 free; no `started` without an `ended` under `tests/e2e-runs/`; no Playwright, wrapper or Vite process; Docker VM **16.12 GiB** free (the driver's record, after its own builder prune).
  - Wrapper status 0, first attempt. 2026-10-12T15:59:24Z to 16:12:18Z. No void marker; 383 heartbeats; 0 Sleep entries in the run window (`power.txt`). Battery 81 % at its end.
  - **444 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.**
  - `node $P/178-verdict.mjs e2e 178-01-baseline`: **PASS (0)** — the full default suite, not stale, one preflight success.
  - Against Phase 177's closing run, `--same-projects-as tests/e2e-runs/177-e2e/177-21-final`: **PASS (0)**, `per project: 116 compared, 0 not as expected`.
  - Dev-server log: 0 lines holding `[svelte]`; the standing `TypeError: Cannot read properties of undefined (reading 'map')` once, as in every full run (filed before this phase, not this plan's finding).
- **Baseline:** `tests/e2e-runs/178-e2e/178-01-baseline`, head `89c8420671942dcae164fab078ae508c69cf80e2`, tree-equal to the base commit outside `.planning/`.

**Per-project totals** (every test of every project passed). Projects above one test: a11y-smoke 16; auth-service-contract 2; auth-setup 2; cold-entry-dataroot 3; contestant-a11y-scan 24; contestant-entity-selection 8; contestant-terms-gate-phone 2; data-setup-entity-selection 3; invitation-contract 15; invitation-landing 3; perm-2e-shared 2; perm-access-disable 3; perm-answers-locked 4; perm-closed-project 11; perm-contestant-nominations 97; perm-disable-allow-open 3; perm-disjoint-1co 2; perm-interactive-info 4; perm-localisation-positive 2; perm-no-nomination 68; perm-not-located-2e2cg 5; perm-org-matching 3; perm-organization-editing 46; perm-per-app-notifications 2; perm-question-video 4; perm-show-feedback-survey 6; perm-startfromcg 6; storage-cleanup 3; voter-journey 2; voter-prefs-tracking 3; voter-results-redraw 5. The other **85 projects hold one test each**: admin-access, cold-entry-dataroot-contestant, contestant-journey, eperm07-term-trigger, performance, voter-alliance, voter-dark-mode, voter-journey-mobile, voter-nominations, the eleven one-test `perm-*` projects (1e1cg1co, 2e-asymmetric, disable-election-1co, disable-election-2co, header-show-help, hide-all-nominations, hide-category-tags, hide-election-tags, hide-hero, hide-if-missing-answers, missing-nominations), and every `data-setup-*` and `data-teardown-*` project but `data-setup-entity-selection`. The full list, one line per project, is in `178-BASELINE-FACTS.md`.

### Each accepting branch seen refusing (step 8)

On a scratch tree outside the repository (the session's scratch directory): a copy of `178-verdict.mjs` and `178-BASE` under the phase directory's path, and copies of Phase 176's and 177's kept evidence under this phase's three run roots, the HTML reports and dev-server logs left out. `GIT_DIR` pointed at this checkout's git directory; only commit-to-commit comparisons were made. Two `scope` cases ran in a throwaway repository of three planted commits. **52 cases, 52 as expected.** Nothing was written into the repository. "Planted" marks a copy changed to isolate one refusal. The script and its output are kept as `tests/e2e-runs/178-unit/178-01-refusals.{sh,out}`.

| Case | Evidence | Exit |
|---|---|---|
| no subcommand; `dir e2e` with an unknown label; `dir` with an unknown kind; `dir e2e` on a run that exists | | 2, 2, 2, 0 |
| `e2e` on a fresh full green run | copy of `177-21-final`, HEAD planted in `head` | 0 |
| `e2e` on a stale run | copy of `177-21-final`, as kept | **1** ("is stale") |
| `e2e` on a void run | marker planted; `8` planted in `exit`; `176-e2e/176-11-close` as kept, a real void run | **3**, **3**, **3** |
| `e2e --same-projects-as` the same run by path | | 0 |
| `e2e` of a run lacking projects against the full run, and the other way round | copy of `177-02-close`, HEAD planted | **1**, **1** |
| `e2e` on a green full run of an uncommitted tree | copy of `177-20-precommit`, as kept; and with HEAD planted | **1**, **1** ("made on an uncommitted tree") |
| `control --red` on a red control; the same `--green` | copy of `177-20-control-r2`, as kept | 0, **1** |
| `control` on a void control | marker planted | **3** |
| `control --red` with a substring no title holds; with a `--dirty-only` path that does not cover the dirty path | | **1**, **1** |
| `control --same-projects-as` without `--full` | | **2** |
| `control --full --green` on a real full run of an uncommitted tree; the same `--same-projects-as` the full committed run | copy of `177-20-precommit`, as kept | 0, 0 |
| the same `--same-projects-as` a run lacking projects; with one `--except` that does not hold | | **1**, **1** |
| `control --full --red` on that green run; `--full` on it with a void marker; `--full` with `--dirty-only` paths that do not cover it | marker planted for the second | **1**, **3**, **1** |
| **`control --full` on a one-project run**: `--green` on a one-project green run, `--red` on a one-project red control | copies of `177-15-precommit` and `177-20-control-r2`, as kept | **1**, **1** ("names --project: a slice, not the full suite") |
| `control --full --red` on the red control with `--project` planted out of its recorded invocation; the same `--green` | planted | 0, **1** |
| `control --full --green` on a full run of a committed tree | | **1** ("a run of a committed tree, judged with e2e") |
| `control --full` beside `--project`; with neither; `--except` without `--same-projects-as` | | **2**, **2**, **2** |
| `gates` on a five-row run without `--rows`; with its own five; with two of them | copy of `177-gates/177-17-db`, HEAD planted | **1** ("not the full gate set of 17"), 0, **1** |
| **`gates` on a fourteen-row run** without `--rows`; with its own fourteen | copy of `177-gates/177-21-final`, HEAD planted | **1** ("holds 14 row(s) … not the full gate set of 17"), 0 |
| `gates` on the fourteen-row run as kept, with its rows | stale | **1** |
| `gates` on a seventeen-row run; with the `stack` row red; with `--rows stack` | three rows planted; one status planted | 0, **1**, **1** |
| `determinism --runs 3` on the ledger as kept; with HEAD planted; `--runs 4`; with a void run | copy of `177-determinism/177-21-final` | **1**, 0, **1**, **3** |
| `scope` on the scratch copy, base as recorded | | 0 |
| `scope` with the base planted before the last real change under the pre-registration tree | real history | **1** (it names `preregister/+layout.server.ts`, `identity-callback/…`, `send-email/…` and `CLAUDE.md`) |
| `scope` with a changed path under the `account-access` function and nothing else | throwaway repository | **0** (the path is listed and not refused) |
| `scope` with one more changed path, under the pre-registration tree | throwaway repository | **1** |

In the repository itself, inside Task 1's verify: `178-gates.sh`, `178-e2e.sh` and `178-verdict.mjs` with no argument exit 2, `dir e2e no-such-label` exits 2, `hygiene` and `scope` exit 0; none created a run directory. `178-bankauth.sh` and `178-read-rulings.mjs` with no argument exit 2 as well (run by hand).

## Task 2 — the rounds, and the hand-over

### `178-read-rulings.mjs`

Phase 177's command with one table, `APPLIED = { H1: 'b' }`, and one branch after the checks for NOTE text, stray text, an odd box, the count of ★ options and more than one tick, and before the untouched case: an item of the table with exactly one box ticked on the table's letter prints `<item>: applied (<option>)`; in any other state it prints `<item>: halt — the plans build option (b) by the operator's ruling and the document does not say so` and the item verbatim. `FALLBACK` stays empty. The header says the addition.

### The two readings of the known document

`node $P/178-read-rulings.mjs .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md CD` — **exit 0**:

```
C1: recommended-unticked (a)
C2: recommended-unticked (a)
C3: recommended-unticked (a)
C4: recommended-unticked (a)
C5: recommended-ticked (a)
C6: recommended-unticked (a)
D1: recommended-unticked (a)
```

The same with `F` — **exit 1**: `F1: halt — option (b) ticked, for which the plans state no fallback an executor may build`, the item verbatim, then `HALT: 1 item(s) need the orchestrator; nothing is built`.

### The three scratch readings of the applied branch

Scratch copies of the round document outside the repository, each made by a script that changes box marks inside one item and nothing else, each read with the section `H`:

| Scratch copy | Lines changed | Exit | What it printed |
|---|---|---|---|
| H1's tick removed | 1 | **1** | `H1: halt — the plans build option (b) by the operator's ruling and the document does not say so` |
| H1's tick moved to its ★ option | 2 | **1** | the same halt for H1 |
| option (b) ticked on H2, H1 as committed | 1 | **1** | `H1: applied (b)`, then `H2: halt — option (b) ticked, for which the plans state no fallback an executor may build` |

### The UI contract's round

Between `## PROPOSED` and `## Checker Sign-Off`: 0 lines beginning with a ticked box or a bold NOTE or EDIT marker (0 ticked boxes at any indentation, 83 empty ones). Frontmatter `status: approved`. The sign-off holds the three rulings: the count from the settlement of the request, the ten-second bound, and the two wordings. No halt.

### This phase's round, as the script printed it

`178-OPERATOR-ROUND` names `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, section `H`. **Exit 0, 36 items, no halt:**

- `H1: applied (b)`
- `H2` to `H16`, `H18` to `H29` and `H31` to `H38`, each `recommended-unticked (a)` — thirty-five lines, one per item.

The document itself says H17 and H30 do not exist (two of the planner's items are facts, not choices), which is why 36 items stand for J1 to J6 and PL-01 to PL-29. With `--facts $P/178-BASELINE-FACTS.md` the reading exits 0: every item is recorded, and the facts file holds exactly one line of the applied form.

### The names, each read on the tree

**52 of 52 found; none missing; no halt.** Each was read with `git grep` on the tracked file (an export by the form `export … <name>`, a bare name between non-identifier characters) or with `git ls-files --error-unmatch` for a file. The list with its plans is in `178-BASELINE-FACTS.md`. In groups: the six functions of `506-invitation-rpcs.sql`; `public.get_user_entities`, `private.caller_entity_ids`, the grant `ON ALL FUNCTIONS IN SCHEMA private`, `contestant_app_public_config`; the seven exports of the `account-access` function's four modules; `CONTESTANT_GATES`, `firstNeededGate`, `GATE_VIEWS`, `claimAndRefresh`, `REFUSED_TYPE`; the three files of `lib/auth/`; the six route keys and `whenAuthenticatedOnLogin`; `#newUserEmail`, `#reset` and `#user = $derived(page.data.user ?? undefined)`; the five exports of `contestantAppConfig.ts`; the seven steps of the `invitationFlow` fixture, `assertSignInLinkShape`, `toRunOrigin`, `declareScans`, `registerAndStoreSession`, `expectNoHorizontalOverflow`.

### What is recorded and is no halt

- **`create_invitations: two-argument form`** — `p_confirm_entity` is on 0 lines of `506-invitation-rpcs.sql`; the header reads `public.create_invitations (p_project_id uuid, p_invitations jsonb)`. Phase 177.1 is not on the tree.
- The next free pgTAP number is **45** (44 files, the highest 44).
- Message keys: **704** in each of the seven locale directories; the seven agree. (The UI contract's 649 was read before Phase 177's 55 landed.)
- `contestant-a11y.spec.ts` holds **12** entries in four lists; the baseline's `contestant-a11y-scan` project holds 24 tests.
- Projects whose name begins `contestant-` or `invitation-`: `contestant-a11y-scan`, `invitation-contract`, `invitation-landing`, `contestant-terms-gate-phone`, `contestant-journey`, `contestant-entity-selection`.
- Every one of the 29 paths of the research's overlap list was last changed by a commit of Phase 177.

## Decisions Made

- **Whose each refused path is.** The plan gives four sentences for six paths. `identity-callback` is written as Phase 179's, on the execution rules' item PL-25 ("the pre-registration routes, their API route and `identity-callback`, which are Phase 179's"); `send-email` as a later phase's.
- **What "names that operation" means in the probe.** The contract file holds the operation as a quoted literal (`'request-recovery'` or `"request-recovery"`); a comment that mentions it unquoted does not count.
- **Where `control --full` counts from.** This run's projects are counted from `results.json`, which a control always has; `summary.json` is derived by a separate step a plan may not have run yet. Case 22 above shows the two agree on real evidence (116 projects equal).

## Deviations from Plan

**1. Task 1 is two commits, and neither carries step 9's subject word for word.** Step 9 commits seven files under one subject; step 7's third branch says to commit the scripts first and then make the baseline. So `89c842067` holds the five scripts and `178-BASE` ("… with the base commit") and `4ba1b1b14` holds `178-BASELINE` alone.

**2. Both verifies ran with their files staged before the commit**, because each asks that the files be tracked and a commit follows its gate. Each ran again at the final head: 0.

**3. `178-stack-probe.sh` does not exit 2 without an argument.** The acceptance line says "each script called with no argument exits 2"; step 4 and the plan's artifacts block say the probe takes no argument, and the verify tests the three drivers that take a label. The probe exits 2 on any argument.

**4. A three-row gate run was made, `178-01-rows`**, to see the three added rows run and be judged. The plan asks for no gate run.

**5. The refusal cases number 52, the plan names about a dozen.** The added ones are the other branches of `control --full`, its usage errors and the seventeen-row cases.

**6. The stack probe's cleanup row moved to the end** and expects no user found: the function request is a third live request and comes after the original's cleanup position.

**7. `requirements-completed` is empty**, on the plan's `<output>` block, though the plan's frontmatter names REG-11 and FIX-01: this plan supplies instruments and completes neither.

**8. Nothing was appended to `.planning/WINDOWS.md`, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated**, on the dispatch's instruction. There is no stub, skipped test or unrun verify to record.

**9. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch.

**Total deviations:** 9, none of them a fix of a defect. **Impact on plan:** none on what later plans read; the commit count of Task 1 is two.

## Issues Encountered

None. No red run, no void run, no refused guard, no halt.

## Not done, or not verified

- **A full seventeen-row gate set was not run.** The three added rows ran green; the fourteen copied ones were not run by this plan through the new driver. Their text is Phase 177's, unchanged.
- **`178-bankauth.sh` was not run.** It parses, exits 2 without an argument, and passes `hygiene`. Its first run is plan 178-24's. What it no longer does is in "For later plans".
- **The probe's `EQUAL` branch for a served recovery operation was not seen**: no tree holds that operation yet. The branch that was seen is "400 and the file does not name it".
- **Inferred, not observed:** that `yarn db:reset` leaves the auth container's configuration as it was at the last start, so that the `stack` row after a reset still tells an unapplied configuration change. It is how the original's row worked in Phase 174.

## The state the local stack is left in

Not reset and not restarted by this plan. `supabase_db_openvaa-local` and `supabase_auth_openvaa-local` up 26 hours, `supabase_edge_runtime_openvaa-local` up 5 days. The baseline run used `--no-db-reset`: the database holds what the suite's teardowns leave (so pgTAP test 238 of `39-invitations.test.sql` would be red on it until the next reset, the known finding). The stack probe ran twice and left no user (`0 found, 0 left` both times). Port 5273 is free; no run is in flight. No server or run of another worktree was seen at any check.

## For later plans

- **The baseline** is `$(cat $P/178-BASELINE)` = `tests/e2e-runs/178-e2e/178-01-baseline`: 444 tests, 116 projects. The first closing run (`178-03-close`) compares with it by path.
- **`gates` without `--rows` now expects seventeen rows.** A full gate set includes `stack`, which needs the stack up and reads the services as they are *running*.
- **The `stack` row is red by design between a change of the tree and the restart that serves it.** From the commit that adds `'request-recovery'` to `contract.ts` (178-06) until the stack restart of 178-07, the probe's function row reads `DIFFERS` (400 served, the tree names it). The same holds for `minimum_password_length`, the mail hook and anything under `[auth]` between the edit and the restart of 178-20. Plans 178-04 and 178-06 close on the database rows, which do not include `stack`; a full gate set made in those windows would be red on that row and nowhere else.
- **For plan 178-06:** the probe's function row sends one `request-recovery` for the default project (`00000000-0000-0000-0000-000000000001`) and a fresh address `r178-probe-stack-recovery-<epoch>@test.openvaa.local` on every run, and reads `EQUAL` only on status 200 with exactly `{"accepted":true}`. If `recovery_link_request` takes the address's `link:` slot before it knows whether an account exists, each probe run leaves one throttle row: the probe's cleanup deletes auth users by prefix and nothing else. Either the function leaves no row for an address with no account, or the probe gains a cleanup of that row in the plan that adds the function.
- **For plan 178-20:** the probe reads a table-scoped key of `config.toml` with `config_value <table> <key>` and prints a comparison with `compared <what> <running> <tree>`; the `otp_expiry` row is two lines beside the password-length row. An absent key prints `(no such key)` and reads `DIFFERS` against a set variable.
- **`control --full`** needs every dirty path covered by a `--dirty-only` (a path ending in `/` covers a directory), judges `--red` and `--green` over the whole run, and takes `--same-projects-as` and `--except` as `e2e` does. It reads `results.json`; `node tests/scripts/e2e-evidence.mjs` is not needed for the verdict.
- **`178-bankauth.sh <label-stem>`** takes one argument. After its restore it runs the stack probe only: **the redirect allow-list probe of Phase 170 (`170-allowlist-probe.sh after`) is no longer run by it**. Plan 178-24 runs that probe itself if it wants the allow-list read after the restart.
- **`hygiene` scans every `178-*.sh` and `178-*.mjs` in the phase directory** — six today, seven once `178-probe.mjs` exists — and all 24 plan files: 0 hits today.
- **The `auth-config` row runs a script that `yarn lint:check` also runs** (Phase 176's header said so); a wrong auth configuration is therefore red in two rows.
- **Reading a run's progress:** `tr` fails on `stdout.log` with "Illegal byte sequence" in this shell; `LC_ALL=C grep -a -o -E '\[[0-9]+/[0-9]+\]' <run>/stdout.log | tail -1` works.
- **Power:** the host was on battery throughout — 99 % at dispatch, 94 % before the full run, 80 % after everything. One full run cost about 13 points. Check `pmset -g batt` before each long run.
- **Timing on this host today:** a full run took 12 min 54 s, the three added gate rows 3 s.

## Files touched that the plan did not list

None in the repository. Gitignored evidence only: `tests/e2e-runs/178-e2e/178-01-baseline/`, `tests/e2e-runs/178-gates/178-01-rows/`, and under `tests/e2e-runs/178-unit/` the launch markers, the two verify scripts with their logs, the verdict logs, the refusal script and its output, the reading outputs and `178-01-facts.sh`, the generator of the facts file.

## Prohibitions

- **PROH-178-01:** held — nine files of the plan's own, three commits by pathspec, no branch created or switched, `CAND-APP-PLAN.md` untracked, none of the eight named files edited.
- **PROH-178-02:** held — one E2E run, first attempt, green; nothing deleted under `tests/e2e-runs/`; Docker not restarted; no reset.
- **PROH-178-03:** held — every outcome above is a line the reading command printed. The only look at the document outside the command was a list of its headings, to account for the two item numbers that do not exist.
- **PROH-178-04:** held — `hygiene` exits 0 over the six scripts; the probe prints statuses and fixed words and no body.

## Threat Flags

None. No file outside `.planning/` changed.

## Known Stubs

None.

## Next Phase Readiness

Ready for plan 178-02. The drivers, the base commit, the baseline and the rounds as read are committed; no blocker.

## Self-Check: PASSED

The nine created files exist and are tracked; `89c842067`, `4ba1b1b14` and `15130c485` are ancestors of HEAD; no commit of the plan deletes a file; the tree outside `.planning/` is unchanged since `b49642cce`.

---
*Phase: 178-sign-in-email-code-registration*
*Completed: 2026-10-12*

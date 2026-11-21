---
phase: 182-analytics-relay
plan: 28
subsystem: testing
tags: [e2e, playwright, analytics, relay, consent-free, full-suite, supabase-local]
status: complete

requires:
  - phase: 182-24
    provides: the single-project green runs and the command form of a window
  - phase: 182-31
    provides: the two consent-mode red controls, and the window practice this plan copies
  - phase: 182-30
    provides: tests/scripts/e2e-spec-verdict.mjs
  - phase: 182-11
    provides: evidence/11-skipped-baseline.txt (empty: the tree before the cutover declared no skips)
provides:
  - evidence/28-full-suite.txt (the full default suite on cb8da595b, 548 of 548, wrapper 0, verdict 0 with one --passed flag per phase spec and the skip baseline)
  - evidence/28-consent-free-final.txt (analytics-consent-free under ANALYTICS_CONSENT_MODE=free on the same commit, 7 of 7, wrapper 0, verdict 0)
  - evidence/28-window.txt (the gates rerun, the question, the relayed standing answer, the start line, the hand-back and the v2.16 reset line)
affects: [182-29]

estimate:
  tokens: 70000
  tasks: 3
actuals:
  tokens: 1150      # chars/4: 4599 chars of the records commit 6d2953e81; no code changed
  tasks: 3
  commits: 1        # MEASURED: git rev-list --count cb8da595b..HEAD at SUMMARY write (the records commit)
plan_head_before: cb8da595b414c15572ad05e23b7658731834727c
plan_head_after: 6d2953e81c38fb7b9d992099f334b8e5b65610ed

tech-stack:
  added: []
  patterns:
    - "The full-suite record reads its six counts from summary.json and its log observations from the run's own devserver.log"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/28-window.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/28-full-suite.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/28-consent-free-final.txt
  modified: []

key-decisions:
  - "The phase's closing E2E evidence is on cb8da595b, which git finds equal outside .planning to 0e343a40d (plan 182-24's green runs) and 7d35eef74 (plan 182-31's red controls)"
  - "The static gates were run again on cb8da595b (LOCAL_GATES_SOURCE=rerun), because plan 182-22's gates describe e4d535df3, which differs in code from the final tree"

requirements-completed: []   # left to the orchestrator, as instructed

duration: about 22 min (05:50:34Z to 06:12Z UTC on 2026-10-20); gates about 3 min, full suite about 15 min, consent-free run about 1 min
completed: 2026-10-20
---

# Phase 182 Plan 28: The closing full suite and consent-free run Summary

**The local E2E suite is green on the final tree. The full default run passed 548 of 548, with wrapper status 0 and verdict status 0. Each of the five phase spec files passed in full. No test failed, was flaky or did not run, and the declared skips equal the empty baseline of plan 182-11. The consent-free project passed 7 of 7 on the same commit, with wrapper 0 and verdict 0.** The wrapper reset the database from this worktree for both runs, and the schema probe printed `t` both times. Each run was made once, on one confirmation. The shared stack is stopped.

**Start sha:** `cb8da595b414c15572ad05e23b7658731834727c`. Both runs were made on it. HEAD did not move until the records commit `6d2953e81`.

## Results

| Run (slot) | Run directory | Wrapper | Verdict | Total | Passed | Failed | Flaky | Skipped | Did not run | db-reset | Probe |
|------------|---------------|---------|---------|-------|--------|--------|-------|---------|-------------|----------|-------|
| `28-full` | `tests/e2e-runs/182-28-full-20261020T055034Z.cb8da595b414` | 0 | 0 | 548 | 548 | 0 | 0 | 0 | 0 | yes | t |
| `28-free` | `tests/e2e-runs/182-28-consent-free-20261020T055034Z.cb8da595b414` | 0 | 0 | 7 | 7 | 0 | 0 | 0 | 0 | yes | t |

- **Verdict flags:**
  - `28-full`: `--passed voter-prefs-tracking.spec.ts --passed analytics-privacy.spec.ts --passed analytics-gpc.spec.ts --passed voter-pageview-only.spec.ts --passed contestant-terms-tracking.spec.ts --no-other-failures --no-flaky --skipped-baseline evidence/11-skipped-baseline.txt`.
  - `28-free`: `--passed voter-tracking-consent-free.spec.ts --no-other-failures --no-flaky`.
- **Skips:** none, in either run. No serial-describe follower was skipped, and no test did not run.
- **Run directories:**
  - Neither has `VOID-host-suspend.txt`.
  - `head` equals `cb8da595b…`, and `exit` is 0.
  - `worktree-status.txt` lists no tracked change.
  - `provenance.txt` says `db-reset: yes`.
- **Log observations** (`devserver.log` of the full run):
  - Pageview lines: 661 voter, 466 Contestant and 6 Admin. One example of each is quoted in the record.
  - `LOG_PAGEVIEW_WITH_SESSION_ID=0`.
  - `LOG_VAA_SESSION_ID=0`.

## Window (attempt `20261020T055034Z.cb8da595b414`)

- **Task 1:**
  - There was no earlier `28-window` pointer, so nothing was carried over.
  - `PREP_HEAD=cb8da595b…`, `PREP_TREE_CLEAN=yes`.
  - Plan 182-22's gates do not describe this commit. The pointer is one line and the tracked record is `cmp`-equal to it. But `git diff --quiet e4d535df3 PREP_HEAD -- . ':!.planning'` exits 1, because of the 182-24 debug commits.
  - So the four gates were run again: `yarn db:start` (no reset) first, then build, lint, unit and format, one at a time in one background script. They used `TURBO_CACHE_DIR=tmp/turbo-182-28`, and each status was read from its file.
  - Results: `LOCAL_BUILD_EXIT=0`, `LOCAL_LINT_EXIT=0`, `LOCAL_UNIT_EXIT=0` (25 of 25 turbo tasks) and `LOCAL_FORMAT_EXIT=0`.
  - The second tree sample was clean and HEAD was unchanged. `LOCAL_GATES_SOURCE=rerun`, `LOCAL_GATES_HEAD=cb8da595b…`.
  - `ENV_FILE=present`, from `test -f .env`. `PORT_FREE=yes`. `BASELINE_LINES=0`.
  - The Task 1 verify, run verbatim, exited 0.
- **Task 2:**
  1. `CHECKPOINT_PRESENTED attempt=20261020T055034Z.cb8da595b414 head=cb8da595b…`.
  2. The operator's standing words, quoted and indented, with the relay note.
  3. `OPERATOR_CONFIRMED_STACK_FREE=yes` for the same attempt and head.
- **Task 3:**
  - The answer check, run verbatim from a script file that is byte-identical to the plan's line, exited 0. `TASK3_STARTED=2026-10-20T05:54:20Z` was appended at once.
  - At Step 0 the tree was clean, with no code difference from `LOCAL_GATES_HEAD`.
  - `yarn db:stop` ran at the start and at the end, with status 0 both times.
  - **Commands:**
    - The full run unset `ANALYTICS_CONSENT_MODE` and `PLAYWRIGHT_ANALYTICS_STANDALONE`, exported `ANALYTICS_PROVIDER=log`, then ran `bash tests/scripts/e2e-run.sh --run-dir …` on its own line.
    - The consent-free run exported `PLAYWRIGHT_ANALYTICS_STANDALONE=1 ANALYTICS_PROVIDER=log ANALYTICS_CONSENT_MODE=free`, then ran the wrapper with `--project analytics-consent-free`.
    - Neither used `--no-db-reset`.
  - The tree was clean and HEAD unchanged at every sample, and nothing was committed between the question and the records.
  - The records were copied with `cp` after the last tree sample. They were committed alone, by name, in `6d2953e81`, which touches only `.planning/`.
- **Stack at the end:** stopped (no `openvaa-local` container), with nothing listening on 5273. No dev server or Playwright process of this plan is left. The skimle2 containers were not touched.
- **Last line of the window record:** "The v2.16 session must run `yarn db:reset` from its own worktree before it uses the local stack again."

## Verification

| Check | Result |
|-------|--------|
| Task 1 verify, verbatim | exit 0 (again exit 0 after the records commit) |
| Answer check, verbatim | exit 0 before any stack command. After the records commit it refuses ("the question was not asked for this attempt and this commit"), as it should |
| Task 3 verify, verbatim, after the records commit | exit 0 under `bash` and under `zsh` |
| No `(182-28):` commit touches `tests`, `apps` or `packages` | confirmed (`6d2953e81` lists only the three evidence files) |
| No run directory under `tests/e2e-runs/` deleted | confirmed |

## Deviations from Plan

1. **[Environment] `yarn db:start` in Task 1.** Task 1 says it runs no `yarn db:*`. The orchestrator directs a start without a reset before whole-tree unit gates, because the root `test:unit` needs the stack. This follows 182-24 deviation 5. `SHARED_STACK_RUNNING=yes` is recorded.
2. **[Bookkeeping] Extra keys.**
   - The window record has `BASELINE_LINES` (named by the plan), `SHARED_STACK_RUNNING`, `DB_STOP_AT_START_EXIT`, `DB_STOP_AT_END_EXIT` and a one-line `WINDOW_RESULT=`, each written once.
   - The full-suite record adds an indented line with the pageview counts by app.
3. **[Orchestrator] The answer was relayed, not typed per attempt.**
   - The record quotes the operator's words of 2026-10-19: "I'll keep the stack free, so just continue w the rest of the steps at will".
   - It notes that this is a standing authorisation for the remaining phase-182 stack windows, relayed by the orchestrator for this attempt id.
   - The binding of question, answer and start to the attempt and head is unchanged.
4. **[Orchestrator instruction] State not advanced.** No `state.advance-plan`, no `record-session`, no STATE.md edit, and no requirement ticked. ROADMAP progress for 182 was updated, as 182-31 did.

## Notes for later plans

- **182-29 (closing record):**
  - The phase's closing E2E evidence:
    - `28-full-suite.txt`: 548 of 548, verdict 0, empty skip baseline;
    - `28-consent-free-final.txt`: 7 of 7.
  - Both are on `cb8da595b`, which is code-identical to `0e343a40d` (182-24 green) and `7d35eef74` (182-31 red controls).
  - The static gates that describe it are in `28-window.txt` (`LOCAL_GATES_SOURCE=rerun`).
- **v2.16 session:** it must run `yarn db:reset` from its own worktree before it uses the local stack again. The stack is stopped now.

## Known Stubs

None.

## Threat Flags

None. This plan changed no code.

## Self-Check: PASSED

- FOUND: `evidence/28-window.txt`, `evidence/28-full-suite.txt` and `evidence/28-consent-free-final.txt`. Each is `cmp`-equal to its current attempt, and Task 3's verify checks this.
- FOUND: commit `6d2953e81` on HEAD.
- FOUND: the two run directories `tests/e2e-runs/182-28-{full,consent-free}-20261020T055034Z.cb8da595b414`.

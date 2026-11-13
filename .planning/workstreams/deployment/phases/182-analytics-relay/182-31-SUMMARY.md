---
phase: 182-analytics-relay
plan: 31
subsystem: testing
tags: [e2e, playwright, analytics, relay, consent-free, red-control, supabase-local]
status: complete

requires:
  - phase: 182-24
    provides: evidence/24-default-standalone.txt and evidence/24-consent-free.txt, green on 0e343a40d
  - phase: 182-30
    provides: tests/scripts/e2e-spec-verdict.mjs (--failed-test, --failure-contains)
  - phase: 182-21
    provides: the mode precondition of voter-tracking-consent-free.spec.ts that names ANALYTICS_CONSENT_MODE
provides:
  - evidence/31-red-free-mode.txt (analytics-default-standalone under ANALYTICS_CONSENT_MODE=free: wrapper 1, verdict 0, the pre-consent test red by its assertion)
  - evidence/31-red-default-mode.txt (analytics-consent-free without the prefix: wrapper 1, verdict 0, the mode precondition red, naming ANALYTICS_CONSENT_MODE)
  - evidence/31-window.txt (the question, the relayed standing answer, the start line, the hand-back and the v2.16 reset line)
affects: [182-28, 182-29]

estimate:
  tokens: 60000
  tasks: 3
actuals:
  tokens: 2970      # chars/4: 11891 chars of the records commit 050b47e53; no code changed
  tasks: 3
  commits: 1        # MEASURED: git rev-list --count 7d35eef74..HEAD at SUMMARY write (the records commit)
plan_head_before: 7d35eef7413d9057676402abc314ca773b6e00d2
plan_head_after: 050b47e53e2fdec8029a62d6b76406e1c151d98d

tech-stack:
  added: []
  patterns:
    - "A red control's reason is read from results.json through e2e-spec-verdict.mjs --failed-test/--failure-contains; RED_REASON is the reader's copy"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/31-window.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/31-red-free-mode.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/31-red-default-mode.txt
  modified: []

key-decisions:
  - "Both consent-mode red controls are recorded on 7d35eef74, which git finds equal outside .planning to 0e343a40d (plan 182-24's green runs): red and green differ in the consent mode only"
  - "In the default-mode control the failing assertion is a retrying toContainText with a 10 s window: the failure is the assertion's message, not a test timeout"

requirements-completed: []   # left to the orchestrator, as instructed

duration: about 6 min (05:42:54Z to 05:48:26Z UTC on 2026-10-20); the two runs about 1 min each
completed: 2026-10-20
---

# Phase 182 Plan 31: The two red controls by consent mode Summary

**Both mode-dependent privacy properties were seen failing in the other mode, each by its own assertion. The runs were on `7d35eef74`, which does not differ outside `.planning` from `0e343a40d`, the commit where plan 182-24 recorded the same specs green.**
- Under `ANALYTICS_CONSENT_MODE=free`, `analytics-default-standalone` failed "before consent only pageviews are sent, with no id" with "non-pageview events were sent before consent: answer, results_ranked". "The relay is active" passed in the same run.
- Without the prefix, `analytics-consent-free` failed "the server is in consent-free mode" at its mode precondition, with a message that names `ANALYTICS_CONSENT_MODE`.

Each run was made once, on one confirmation. Each used a database the wrapper reset from this worktree, and the schema probe printed `t` both times. The shared stack is stopped.

**Start sha:** `7d35eef7413d9057676402abc314ca773b6e00d2`. Both runs were made on it. HEAD did not move until the records commit `050b47e53`.

## Results

| Run (slot) | Run directory | Wrapper | Verdict | Passed | Failed | Flaky | Skipped | Did not run | db-reset | Probe |
|------------|---------------|---------|---------|--------|--------|-------|---------|-------------|----------|-------|
| `31-red-free` | `tests/e2e-runs/182-31-red-free-20261020T054254Z.7d35eef7413d` | 1 | 0 | 6 | 6 | 0 | 10 | 0 | yes | t |
| `31-red-default` | `tests/e2e-runs/182-31-red-default-20261020T054254Z.7d35eef7413d` | 1 | 0 | 2 | 1 | 0 | 4 | 0 | yes | t |

- **Skipped tests did not run.** These are serial-describe followers of a failed test, and the report counts them as "skipped". This record counts them as not run.
- **Verdict flags:**
  - `31-red-free`: `--passed-test "the relay is active" --failed-test "before consent only pageviews are sent" --failure-contains "non-pageview events were sent before consent" --failure-contains "answer" --allow-did-not-run`.
  - `31-red-default`: `--failed-test "the server is in consent-free mode" --failure-contains "ANALYTICS_CONSENT_MODE" --allow-did-not-run`.
- **`RED_REASON`:**
  - `31-red-free`: `non-pageview events were sent before consent: answer, results_ranked` (a `toStrictEqual` assertion at `voter-prefs-tracking.spec.ts:285`).
  - `31-red-default`: `the server is not in consent-free mode: this spec needs the server started with ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log (…)`. This is the `toContainText` mode precondition at `voter-tracking-consent-free.spec.ts:218`. The privacy page showed the default-mode text.
- **The other failures in `31-red-free`** are allowed by the plan. Each fails because free mode shows no consent prompt and no opt-out:
  - The GPC control "the same first steps show the prompt and send to the relay" fails with the message "the consent prompt did not open without the signal".
  - These four fail with `toBeVisible` on an element that free mode does not show:
    - the privacy journey "every request went to the app or to Supabase…";
    - "the application's own send at page leave arrives";
    - "the interface does not wait for the relay";
    - Contestant terms "the opt-out box is shown, unticked and accessible".
- **Run directories:** neither has `VOID-host-suspend.txt`. `head` equals `7d35eef74…`, `worktree-status.txt` lists no tracked change, `provenance.txt` says `db-reset: yes`, and `exit` is 1.

## Window (attempt `20261020T054254Z.7d35eef7413d`)

- **Task 1:**
  - There was no earlier `31-window` pointer, so nothing was carried over.
  - `PREP_HEAD=7d35eef74…` and `PREP_TREE_CLEAN=yes`.
  - Both 182-24 green records are `cmp`-equal to the files their pointers name. Both have `E2E_HEAD=0e343a40d…`, and `git diff --quiet 0e343a40d 7d35eef74 -- . ':!.planning'` exited 0. Recorded: `GREEN_RUNS_HEAD=0e343a40d…`.
  - `ENV_FILE=present`, from `test -f .env`, which the operator's allow rule now permits. `PORT_FREE=yes`.
  - The Task 1 verify, run verbatim, exited 0.
- **Task 2:**
  1. `CHECKPOINT_PRESENTED attempt=20261020T054254Z.7d35eef7413d head=7d35eef74…`.
  2. The operator's standing words, quoted and indented, with the relay note.
  3. `OPERATOR_CONFIRMED_STACK_FREE=yes` for the same attempt and head.
- **Task 3:**
  - The answer check, run verbatim from a script file, exited 0. `TASK3_STARTED=2026-10-20T05:43:43Z` was appended at once.
  - At Step 0 the tree was clean, and there was no code difference from `GREEN_RUNS_HEAD`.
  - `yarn db:stop` ran at the start and at the end, with status 0 both times. The stack had already been stopped at the start.
  - Both runs used the 182-24 command form: variables exported, then `bash tests/scripts/e2e-run.sh …` on its own line, without `--no-db-reset`. The default-mode run also unset `ANALYTICS_CONSENT_MODE` in its shell first.
  - The tree was clean and HEAD unchanged at every sample, and nothing was committed between the question and the records.
  - The records were copied with `cp` after the last tree sample. They were committed alone, by name, in `050b47e53`, which touches only `.planning/`.
- **Stack at the end:** stopped (no `openvaa-local` container). The skimle2 containers were not touched.
- **Last line of the window record:** "The v2.16 session must run `yarn db:reset` from its own worktree before it uses the local stack again."

## Verification

| Check | Result |
|-------|--------|
| Task 1 verify, verbatim | exit 0 |
| Answer check, verbatim | exit 0 before any stack command |
| Task 3 verify, verbatim, after the records commit | exit 0 under `bash` and under `zsh` |
| No `(182-31):` commit touches `tests`, `apps` or `packages` | confirmed (`git show --stat` empty for 050b47e53) |
| No run directory under `tests/e2e-runs/` deleted | confirmed |

## Deviations from Plan

1. **[Bookkeeping] Extra keys in the window record:** `DB_STOP_AT_START_EXIT`, `DB_STOP_AT_END_EXIT` and a one-line `WINDOW_RESULT=`, each written once, as in 182-24. Each run record also quotes, indented, the e2e-evidence and verdict output and the named test's full failure message, which `tmp/182-evidence/31-failmsg.mjs` extracted from `results.json`.
2. **[Orchestrator] The answer was relayed, not typed per attempt.** The record quotes the operator's words of 2026-10-19 ("I'll keep the stack free, so just continue w the rest of the steps at will"), with the note that this is a standing authorisation for the remaining phase-182 stack windows, relayed by the orchestrator for this attempt id. The binding of question, answer and start to the attempt and head is unchanged.
3. **[Orchestrator instruction] State not advanced.** No `state.advance-plan`, no `record-session`, no STATE.md edit, and no requirement ticked. ROADMAP progress for 182 was updated, as 182-24 did.

## Notes for later plans

- **182-28 (full suite):** this plan changed no code. The tree outside `.planning` is still the one the static gates of `evidence/24-window.txt` describe (`LOCAL_GATES_HEAD=0e343a40d…`).
- **182-29:** both consent-mode red controls now exist beside their green runs: `31-red-free-mode.txt` against `24-default-standalone.txt`, and `31-red-default-mode.txt` against `24-consent-free.txt`.
- **v2.16 session:** it must run `yarn db:reset` from its own worktree before it uses the local stack again. The stack is stopped now.

## Known Stubs

None.

## Threat Flags

None. This plan changed no code.

## Self-Check: PASSED

- FOUND: `evidence/31-window.txt`, `evidence/31-red-free-mode.txt` and `evidence/31-red-default-mode.txt`. Each is `cmp`-equal to its current attempt, and Task 3's verify checks this.
- FOUND: commit `050b47e53` on HEAD.
- FOUND: the two run directories `tests/e2e-runs/182-31-red-{free,default}-20261020T054254Z.7d35eef7413d`.

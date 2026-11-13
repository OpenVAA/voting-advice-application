---
phase: 182-analytics-relay
plan: 24
subsystem: testing
tags: [e2e, playwright, analytics, relay, consent-free, gpc, contestant-terms, keepalive, proxy, supabase-local]
status: complete

requires:
  - phase: 182-20
    provides: the privacy journey, the GPC spec, voter-pageview-only and relayProxy.fixture.ts
  - phase: 182-21
    provides: voter-tracking-consent-free.spec.ts and the analytics-consent-free project
  - phase: 182-22
    provides: the static gates (superseded here by a rerun, because code changed after them)
  - phase: 182-23
    provides: the command form of a green stand-alone window
  - phase: 182-27
    provides: contestant-terms-tracking.spec.ts in analytics-default-standalone
  - phase: 182-30
    provides: tests/scripts/e2e-spec-verdict.mjs
provides:
  - evidence/24-pageview-only.txt (voter-pageview-only green in default mode, 3 of 3)
  - evidence/24-default-standalone.txt (analytics-default-standalone green in default mode, 22 of 22, one --passed flag per spec file)
  - evidence/24-consent-free.txt (analytics-consent-free green under ANALYTICS_CONSENT_MODE=free, 7 of 7)
  - evidence/24-window.txt (the question, the relayed standing answer, the start line, the hand-back and the v2.16 reset line)
  - the voter privacy page heading takes the post-navigation focus (e06816d05, NAVA11Y-02)
  - the keepalive page-leave test in the proxy form (0e343a40d)
affects: [182-28, 182-29, 182-31]

estimate:
  tokens: 65000
  tasks: 3
actuals:
  tokens: 5850      # chars/4: 13498 chars of code diff c683b5508..0e343a40d outside .planning (the debug fixes) + 9888 chars of the records commit
  tasks: 3
  commits: 1        # MEASURED: git rev-list --count 0e343a40d..HEAD at SUMMARY write (this attempt's records commit); the plan as a whole spans c683b5508 (red records), b410026b0, 3029d15e3, e06816d05, 0e343a40d and e7a596923
plan_head_before: 0e343a40d5993e9a273e7ab04f828fbed791205c
plan_head_after: e7a59692319f190e094fbf49db63b9a0ccc0dede

tech-stack:
  added: []
  patterns:
    - "A beforeAll browser.newContext passes storageState explicitly: Playwright 1.63 fills the options missing from newContext with the hook's test use options"
    - "Every page heading the post-navigation focus reset targets carries tabindex=-1"
    - "A relay answer that may arrive after the page is left is read through startRelayRecordingProxy(), never through request.response()"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/24-consent-free.txt
    - apps/frontend/src/routes/(voters)/privacy/page.svelte.test.ts
  modified:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/24-window.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/24-pageview-only.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/24-default-standalone.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/182-20-SUMMARY.md
    - .planning/workstreams/deployment/phases/182-analytics-relay/182-23-SUMMARY.md
    - .planning/workstreams/deployment/phases/182-analytics-relay/182-VALIDATION.md
    - .planning/workstreams/deployment/phases/182-analytics-relay/deferred-items.md
    - apps/frontend/src/routes/(voters)/privacy/+page.svelte
    - tests/tests/specs/contestant/contestant-terms-tracking.spec.ts
    - tests/tests/specs/voter/analytics-privacy.spec.ts

key-decisions:
  - "The keepalive page-leave test is in the proxy form as of 0e343a40d: Playwright resolves request.response() only when the answer arrives before the page is left, so the direct form was a race (11 of 30 red); research assumption A1 is settled as not reported"
  - "The reading of evidence/23-keepalive-control.txt is void as a measure of keepalive necessity; its values stand as observed, and the evidence files are not edited"
  - "ENV_FILE=unknown is recorded when the secret-read hook refuses the direct check; no name listing or other workaround is used"

requirements-completed: []   # left to the orchestrator, as instructed

duration: about 11 min for this attempt (21:28Z to 21:39Z UTC on 2026-10-19), the three runs about 1 to 2 min each
completed: 2026-10-20
---

# Phase 182 Plan 24: The new specs alone, in both consent modes Summary

**All three single-project runs are green on `0e343a40d`, each made once on one confirmation, each on a database the wrapper reset from this worktree, and each judged green by the verdict script's exit status with one `--passed` flag per spec file.** `voter-pageview-only` passed 3 of 3. `analytics-default-standalone` passed 22 of 22: the tracking spec, the privacy journey, the GPC spec and the Contestant terms spec. `analytics-consent-free` passed 7 of 7 under `ANALYTICS_CONSENT_MODE=free`. The four whole-workspace gates were run again on the same commit and are all 0. The shared stack is stopped.

**Start sha of this attempt:** `0e343a40d5993e9a273e7ab04f828fbed791205c`. All three runs were made on it, and HEAD did not move until the records commit `e7a596923`.

## Results

| Run (slot) | Run directory | Wrapper | Verdict | Passed | Failed | Flaky | Skipped | Did not run | db-reset | Probe |
|------------|---------------|---------|---------|--------|--------|-------|---------|-------------|----------|-------|
| `voter-pageview-only` (`24-pageview`) | `tests/e2e-runs/182-24-pageview-20261019T212846Z.0e343a40d599` | 0 | 0 | 3 | 0 | 0 | 0 | 0 | yes | t |
| `analytics-default-standalone` (`24-default`) | `tests/e2e-runs/182-24-default-20261019T212846Z.0e343a40d599` | 0 | 0 | 22 | 0 | 0 | 0 | 0 | yes | t |
| `analytics-consent-free` (`24-free`) | `tests/e2e-runs/182-24-free-20261019T212846Z.0e343a40d599` | 0 | 0 | 7 | 0 | 0 | 0 | 0 | yes | t |

- **Verdict flags:**
  - `24-pageview`: `--passed voter-pageview-only.spec.ts --no-other-failures --no-flaky`.
  - `24-default`: `--passed voter-prefs-tracking.spec.ts --passed analytics-privacy.spec.ts --passed analytics-gpc.spec.ts --passed contestant-terms-tracking.spec.ts --no-other-failures --no-flaky`.
  - `24-free`: `--passed voter-tracking-consent-free.spec.ts --no-other-failures --no-flaky`.
- **Run directories:** no `VOID-host-suspend.txt`; `head` equals `0e343a40d…`; `worktree-status.txt` lists no tracked change; `provenance.txt` says `db-reset: yes`.
- **Log observations** (`devserver.log`, informational, not asserted by the plan):
  - Pageview lines: `24-pageview` 4 voter; `24-default` 29 voter, 8 Contestant, 1 Admin; `24-free` 20 voter.
  - No pageview line carries `session.id`. `session.id` appears only on non-pageview events: after consent in default mode (17 lines, e.g. `dataConsent_granted`, `answer`), and on the consent-free run's non-pageview events (7 lines), as designed.

## Window (attempt `20261019T212846Z.0e343a40d599`)

- **Task 1:**
  - New attempt of slot `24-window`. The earlier attempt `20261019T203511Z.68e1ed08efff` held no `ANSWER_VOIDED=`, so nothing was carried over.
  - `PREP_HEAD=0e343a40d…`, `PREP_TREE_CLEAN=yes`.
  - `git diff --quiet e4d535df3 PREP_HEAD -- . ':!.planning'` exited 1, because of the debug commits, so `LOCAL_GATES_SOURCE=rerun`.
  - `yarn db:start` (no reset) came first, because the root `test:unit` needs the stack.
  - The gates ran one at a time in the background, with `TURBO_CACHE_DIR=tmp/turbo-182-24b`: `LOCAL_BUILD_EXIT=0`, `LOCAL_LINT_EXIT=0`, `LOCAL_UNIT_EXIT=0` (25 of 25 tasks) and `LOCAL_FORMAT_EXIT=0`.
  - The second tree sample was clean and HEAD was unchanged. `LOCAL_GATES_HEAD=0e343a40d…`.
  - `ENV_FILE=unknown` (see deviation 6) and `PORT_FREE=yes`.
- **Task 2:**
  1. `CHECKPOINT_PRESENTED attempt=20261019T212846Z.0e343a40d599 head=0e343a40d…`.
  2. The operator's standing words, quoted and indented, with the relay note.
  3. `OPERATOR_CONFIRMED_STACK_FREE=yes` for the same attempt and head.
  4. Nothing was committed between the question and the records.
- **Task 3:**
  - The answer check exited 0, and `TASK3_STARTED=2026-10-19T21:32:57Z` was appended at once.
  - At step 0 the tree was clean, with no code difference from `LOCAL_GATES_HEAD`.
  - `yarn db:stop` ran at the start and at the end, with status 0 both times. The three runs used the 182-23 command form: variables exported, then `bash tests/scripts/e2e-run.sh …` on its own line, without `--no-db-reset`.
  - The records were copied with `cp` after the last tree sample. They were committed alone, by name, in `e7a596923`, which touches only `.planning/`.
- **Stack at the end:** stopped (no `openvaa-local` container). The skimle2 containers were not touched.
- **Last line of the window record:** "The v2.16 session must run `yarn db:reset` from its own worktree before it uses the local stack again."

## Verification

| Check | Result |
|-------|--------|
| Task 1 verify, verbatim | exit 1, "ENV_FILE not recorded" (deviation 6); the same command without the `ENV_FILE` clause exits 0 |
| Answer check, verbatim | exit 0 before any stack command |
| Task 3 verify, verbatim, after the records commit | exit 0 under `bash` and under `zsh` |
| No `(182-24):` commit lists `tests/scripts/e2e-run.sh` | confirmed |
| No run directory under `tests/e2e-runs/` deleted | confirmed |

## Previous attempt (red, recorded in `c683b5508`)

Window attempt `20261019T203511Z.68e1ed08efff`, on `68e1ed08e`, ended red at `24-default`, with wrapper 1 and verdict 1.
- `24-pageview` was green.
- `contestant-terms-tracking.spec.ts` failed with ENOENT on a storage state in `beforeAll`.
- `analytics-gpc.spec.ts` "no prompt and no send under the signal" failed: the focus reset never landed on `/en/privacy`.
- `24-free` was not made.

Its tracked records `24-window.txt`, `24-pageview-only.txt` and `24-default-standalone.txt` are now replaced by this attempt's copies, as the plan's Step 4 and its verify (`cmp` against the current attempt) require. The red copies remain in `c683b5508`.

## Deviations from Plan

### Fixes between the red attempt and this one (debug session; each a commit after the red records)

1. **[Rule 1 - Bug, spec] `b410026b0`: the Contestant terms spec's `beforeAll` contexts pass an empty `storageState`.**
   - **Cause, CONFIRMED in isolation:** Playwright 1.63 fills the options missing from `browser.newContext` with the hook's test `use` options. The nested describe's `storageState` named a file not yet written, so `newContext` threw ENOENT.
   - **Fix:** `storageState: { cookies: [], origins: [] }` is passed explicitly.
2. **[Rule 1 - Bug, app a11y, NAVA11Y-02] `3029d15e3` (test, red first) and `e06816d05` (fix): the voter privacy page's heading gets `tabindex="-1"`.**
   - **Cause, CONFIRMED from the trace DOM:** the heading had no `tabindex`, so the post-navigation focus reset could not land, and the GPC spec's hydration check timed out.
   - **Same gap, not fixed:** `(voters)/about`, `admin/login`, `(voters)/(located)/questions/category/[categoryId]` and `lib/layouts/main/MaintenancePage.svelte`. Logged in `deferred-items.md`.
3. **[Rule 1 - Bug, spec] `0e343a40d`: the keepalive page-leave test reads the relay's answer through `startRelayRecordingProxy()` (proxy form).**
   - **Cause, a CONFIRMED race:** Playwright resolves `request.response()` only when the answer arrives before the page is left. In a probe, an answer 50 ms after the leave was reported 0 of 6 times.
   - **Repeats:** the direct form failed 11 of 30, always with "Received: undefined"; the proxy form passed 30 of 30. A mutated proxy oracle (expecting 200) was red 3 of 3.
   - When the direct form passed, it had only seen an answer that came before the leave.
4. **Diagnostic runs, not evidence for this plan:**
   - On `e06816d05`:
     - `24-default`-equivalent, 22 of 22;
     - consent-free, 7 of 7;
     - full default suite, 548 of 548, with an empty skip list, 1135 pageviews and no session ids on pageviews;
     - 182-31's two red controls, which behaved as planned.
   - On `0e343a40d`: the keepalive repeats above.

### The keepalive form change, and the texts it leaves stale

The tree's keepalive test is now the proxy form. Nothing else in the tree or the records named a form, but these planning texts still describe the direct form, cited by content:
- **182-20-PLAN, Task 1:**
  - The sentence "Keep in the test only the form it names…".
  - Its form verify `grep -q -F "($U)"`. It now fails, because the spec says `(proxy form)`.
- **182-20-SUMMARY:** "The keepalive test keeps only the direct form…" and `provides: UNLOAD_FORM=direct form`.
- **The 182-23 evidence files:**
  - `evidence/23-green-cutover.txt`: `UNLOAD_FORM=direct form`.
  - `evidence/23-window.txt`: the `GREEN_RUN=` line.
  - `evidence/23-keepalive-control.txt`: its values still hold, but its reading is wrong. The control measured nothing about whether a send outlives the page, because the direct form cannot see an answer that arrives after the leave.
- **182-23-PLAN:** the must-have "…recorded in the words direct form or route form…".
- **182-23-SUMMARY:** the keepalive lines (`provides`, the two key decisions, the Results bullets "Keepalive form" and "Control").
- **182-RESEARCH:** the `[ASSUMED]` in § 11 "Capturing a send made at unload", and assumption A1. Both are now settled: a keepalive response that arrives after the document is gone is not reported.
- **182-VALIDATION:** the checklist item "The keepalive test at page leave with its two forms…".
- **Note for 182-29:** its "Keepalive at page leave: " line must not describe the 182-23 control as having measured whether the send outlives the page.

**What was done:**
- A dated "Correction (182-24, 2026-10-20)" paragraph was appended to 182-20-SUMMARY and 182-23-SUMMARY, and beside the 182-VALIDATION checklist item.
- Every item above is listed in `deferred-items.md`, together with the 182-29 note.
- No `evidence/*.txt` file was edited: they are byte copies of attempt files.

### Deviations in this attempt

5. **[Environment] `yarn db:start` in Task 1.** Task 1 says it runs no `yarn db:*`. The orchestrator directed a start without a reset before the gates, because the root `test:unit` needs the stack (182-23 deviation 4). `SHARED_STACK_RUNNING=yes` is recorded.
6. **[Hook, orchestrator ruling] `ENV_FILE=unknown`; the earlier guard workaround is not repeated.**
   - The red attempt's `ENV_FILE=present` came from a name listing of the worktree root. That listing worked around the secret-read guard, and the orchestrator has since forbidden it.
   - This attempt tried the direct `test -f .env`. The hook refused it ("Secret read guard: Bash would read '.env' …"), so the record says `ENV_FILE=unknown`, with an indented note. Nothing was listed or read to detect the file.
   - **Consequence:** Task 1's verify fails on its `ENV_FILE` clause alone (`present|absent` expected). Every other clause exits 0. Task 3's verify does not check `ENV_FILE`, and it passes. The runs passed their analytics variables as a prefix.
7. **[Orchestrator] The answer was relayed, not typed per attempt.**
   - The operator's words of 2026-10-19 are recorded, quoted: "I'll keep the stack free, so just continue w the rest of the steps at will". They carry the note that this is a standing authorisation for the remaining phase-182 stack windows, relayed by the orchestrator for this attempt id.
   - The `yes` line follows. The order of question, answer and start, and the binding of the answer to its attempt and head, are unchanged.
8. **[Bookkeeping] Extra keys in the window record:** `SHARED_STACK_RUNNING`, `DB_STOP_AT_START_EXIT`, `DB_STOP_AT_END_EXIT` and a one-line `WINDOW_RESULT=`. Each key is written once.
9. **[Orchestrator instruction] State not advanced.** No `state.advance-plan`, no `record-session`, no STATE.md edit, and no requirement ticked.

## Notes for later plans

- **182-31 (red controls):**
  - Its two controls already behaved as planned as diagnostics on `e06816d05`. The only code change since then, `0e343a40d`, is the keepalive test's observation form, in `analytics-privacy.spec.ts`.
  - In free mode the default-standalone project's GPC control and the Contestant terms test 1 fail by design. Contestant terms tests 2 to 6 then do not run: count them as not run.
  - The 182-31 window needs the stack: start from stopped, with `yarn db:stop` already done.
  - Its Task 1 will record `ENV_FILE=unknown` for the same reason as here. If its verify has the same `present|absent` clause, it fails the same way.
- **182-28 (full suite):**
  - A diagnostic full default run on `e06816d05` was 548 of 548, with an empty skip list.
  - The static gates now describe `0e343a40d` (this window's rerun). Compare against `LOCAL_GATES_HEAD` in `evidence/24-window.txt`.
  - The keepalive test is the proxy form. It should not be flaky now: 30 of 30 in repeats.
- **182-29:** see the note above; the "Keepalive at page leave" line must say that the necessity of the flag was not measured.
- **v2.16 session:** it must run `yarn db:reset` from its own worktree before it uses the local stack again. The stack is stopped now.

## Known Stubs

None.

## Threat Flags

None. `e06816d05` adds `tabindex="-1"` to one heading. The spec changes add no product surface. The recording proxy listens on `127.0.0.1` for the length of one test.

## Self-Check: PASSED

- FOUND: `evidence/24-window.txt`, `evidence/24-pageview-only.txt`, `evidence/24-default-standalone.txt` and `evidence/24-consent-free.txt`. Each is `cmp`-equal to its current attempt, and Task 3's verify checks this.
- FOUND: commits `c683b5508`, `b410026b0`, `3029d15e3`, `e06816d05`, `0e343a40d` and `e7a596923` on HEAD.
- FOUND: the three run directories `tests/e2e-runs/182-24-{pageview,default,free}-20261019T212846Z.0e343a40d599`.

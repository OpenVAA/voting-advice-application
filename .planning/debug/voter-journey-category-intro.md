---
status: awaiting_human_verify
trigger: "Operator ruling 2026-10-11, before Phase 177: a diagnosis of the voter-journey failure of run 261010-f1-slice-1 (expectCategoryIntroAndAdvance, toHaveText on voter-questions-category-intro timed out at 2000 ms under a held load of 31 on a cold dev server), then a root-cause fix, then slice-shaped loaded runs on AC power."
created: 2026-10-10T21:45:00Z
updated: 2026-10-10T23:42:00Z
---

## Current Focus

bug_class: Mandelbug — environment-triggered (the host starts a sleep transition), deterministic from the socket loss onward
hypothesis: confirmed (see the reasoning checkpoint kept below and Resolution)
next_action: none for the agent. Awaiting the human — (1) the unmet guardrail signal: accept the wrapper's assertion without a re-induced sleep, or have one made on an idle host; (2) the three open items of the todo (a closed lid; the dev client's reload; the selection across a reload). On "confirmed fixed": archive this file to resolved/ and write the knowledge-base entry. Not archived by the agent.

reasoning_checkpoint:
  hypothesis: "The journey failed because the page was reloaded under it. The host began an idle sleep at 08:08:15Z, which it could because the run held no sleep assertion of its own; the browser's socket to the Vite dev server closed in that second; Vite's dev client answered with location.reload(); the reload re-seeded the voter's in-memory category selection with every category; the walk met the deselected Opt-B category eleven seconds later."
  confirming_evidence:
    - "Trace of the red run: socket loss 08:08:15.541Z, the same document fetched again 08:08:15.559Z, new client 08:08:15.891Z; progress max 12 before and 13 after; every step around the failure at its normal speed."
    - "Power log: caffeinate PID 50336 ClientDied and 'Entering DarkWake state due to Idle Sleep' in the same second, 11:08:15 +0300; display off 30 s earlier; system sleep timer 1 minute. The run was not started under caffeinate."
    - "Isolation re-test: closing the page's Vite socket by hand, unloaded and with no power event, reproduces the error character for character (probe-socket-close-1); the same run without the probe is green (probe-control-1)."
    - "The record: 3 of 3 dated socket losses fall in the second the OS starts a sleep transition; 0 in 3 284 passing page consoles; 0 in 156 page consoles of six runs under induced load; one idle sleep inside any run window of the span, in this run."
  falsification_test: "For the mechanism: a forced socket close that leaves the journey green, or fails it elsewhere — made, and it did not happen. For the absence of a load cause: a loaded slice run, under a held assertion and with no power entry and no socket loss in the page console, that goes red on voter-journey — Part C is that test. For the fix: an 'Idle Sleep' entry in the power log inside the window of a run made through the changed wrapper."
  fix_rationale: "The first link is the one the repository owns: whether a gate run can be put to idle sleep depends today on how it was launched. The wrapper owns the run, so it holds the assertion for the run's whole life. That removes the trigger of this incident and of every idle sleep. The links further down are not the place: a sleep transition also fails the browser's in-flight requests, so silencing the dev client's reload or persisting the selection would hide one symptom of a suspend and leave the others."
  blind_spots: "Which end closes the socket was not observed; Chromium's documented suspend handling is the reading, and the sleep was not re-induced. A sleep forced by a closed lid is not prevented by any assertion: two of the three dated socket losses were of that kind, and a transition that leaves the CPU running leaves no heartbeat gap, so such a run is still red and not void. Whether an idle display sleep alone closes sockets is not in the record. The 09-05 and 09-17 socket losses predate the power log's span."
  candidate_causes:
    - "environment: the host starts an idle sleep during the run — CONFIRMED as the trigger"
    - "environment: CPU load / a cold dev server — no part: step timings normal, 0 socket losses in 156 loaded page consoles; Part C tests it again in the red run's shape"
    - "config: the wrapper holds no sleep assertion, so wakefulness depends on the launcher — CONFIRMED as the precondition, and the link fixed"
    - "code (dev tool): the Vite client reloads the page on a socket loss — CONFIRMED as a link, dev-server only, not changed"
    - "code (product): the category selection is plain $state and is re-seeded on a reload — CONFIRMED as a link, a documented design choice, not changed"
    - "code (spec): a 2000 ms window too short for a slow navigation — ELIMINATED: the navigation took 70 ms and landed on a different page"
    - "code (dev server): a restart, a dependency re-optimisation, the package watcher rewriting dist — ELIMINATED: none in devserver.log, the reloaded document answered in 202 ms"
  and_gate: "Yes. The failure needs a sleep transition during the run AND a dev client that reloads on a socket loss AND state that does not survive a reload. Any one removed, this assertion holds. The transition is the one that damages a run in other ways too, so it is the one removed."

## Symptoms

expected: voter-journey "full voter journey end-to-end" passes; after Opt-A is skipped the walk shows the "Opinion Questions for Regional Elections Only" category intro.
actual: at spec line 864 (`expectCategoryIntroAndAdvance({ text: regionalOpinionsCategory })`) the category intro read "[qg-opin-opt-b-Skipped] Optional Opinion Questions B  1 question" in all 21 polls of a 2000 ms window.
errors: |
  Error: expect(locator).toHaveText(expected) failed
  Locator: getByTestId('voter-questions-category-intro')
  Expected pattern: /Opinion Questions for Regional Elections Only/i
  Received string:  "[qg-opin-opt-b-Skipped] Optional Opinion Questions B  1 question"
  Timeout: 2000ms
reproduction: one occurrence — `tests/e2e-runs/261010-f1-load/loaded-run.sh 261010-f1-slice-1 31 --project perm-no-nomination` (load average held near 31 on 14 cores, cold dev server, the test starting 6 s into the run beside four parallel sign-ins).
started: 2026-10-10, run 261010-f1-slice-1. Green in five loaded full runs (test starts ~50 s in), in slice-2 before its void, and in every unloaded run.

## Eliminated

## Evidence
<!-- Stamps before 21:58Z are to the minute, written as the checks were made; those of the runs are the runs' own. -->

- timestamp: 2026-10-10T21:45:00Z
  checked: error-context.md of the kept run against the spec source
  found: the failing call is the one at spec line 864, reached right after `expectCategoryIntroAndAdvance({ text: optionalOpinionsA, skip: true })` at line 862 passed. The heading received is Opt-B's, not Opt-A's. Opt-B is the category the walk DESELECTED at line 648 (`toggleCategoryListItem(... optionalOpinionsB, checked: false)`).
  implication: the todo's reading ("the previous category's heading still shown") is wrong. The Skip click on Opt-A DID advance — to the next category in order, Opt-B, which should not be in the walk at all. The question is why a deselected category was walked, not why a navigation was slow.

- timestamp: 2026-10-10T21:47:00Z
  checked: test.trace of the kept run (step and action timeline; trace monotonic 0 = 08:07:57.694Z from the context-options record)
  found: no step of the walk is slow. Around the failure: Skip click 257 ms, URL wait 13 ms, destination-DOM settle 54 ms, then `toHaveText` 2003 ms against a heading that never changes. The only long action of the whole walk is the click on the Base-5 option at t=11499 ms (08:08:15.469Z), 1349 ms against about 250 ms for its neighbours.
  implication: the navigation the step waits on completed in 70 ms. No wait of any length would have passed; the destination was a different page. The 2000 ms window, the load and the cold server are not involved.

- timestamp: 2026-10-10T21:49:00Z
  checked: 1-trace.trace (console and action logs) and 1-trace.network in the window 08:08:15.3 to 08:08:17.2Z
  found: |
    08:08:15.541Z console "[vite] server connection lost. Polling for restart..."
    08:08:15.544Z GET blob:http://localhost:5273/… (the Vite client's ping worker)
    08:08:15.559Z GET document /questions/742e4017-… 200, 202 ms — the page it was already on
    08:08:15.578Z click log: waiting for "http://localhost:5273/questions/742e4017-…" navigation to finish
    08:08:15.763Z click log: navigated to the same URL; 15.788Z "element was detached from the DOM, retrying"
    08:08:15.887Z GET ws://localhost:5273/?token=… 101; 15.891Z console "[vite] connecting...", 15.892Z "connected."
    08:08:16.812Z the click is performed on the reloaded page; the walk goes on.
    No request of the trace carries a failure text. node_modules/vite/dist/client/client.mjs (8.3.1), on `vite:ws:disconnect` outside an unload: log that line, `await waitForSuccessfulPing`, `location.reload()`.
  implication: OBSERVED — the page under test was reloaded in full at 08:08:15.56Z by the Vite dev client, after its socket closed.

- timestamp: 2026-10-10T21:51:00Z
  checked: the trace's DOM snapshots, resolved with their back-references: the top bar's <progress max>, the h1, the category checkboxes and the start button
  found: questions intro 08:08:11.426Z: boxes 11111, "Answer 12 Questions", max 13. After the Opt-B uncheck 08:08:11.771Z: boxes 11011, "Answer 11 Questions", max 12. max stays 12 through 08:08:15.392Z (Base-4). First snapshot after the reload, 08:08:16.810Z: max 13, and 13 to the end. The layout sets `progress.max = selectedQuestionBlocks.questions.length + 1`.
  implication: OBSERVED — the deselection reached application state (12 → 11 questions) and was lost across the reload (11 → 12). `voterContext.svelte.ts` keeps `#selectedQuestionCategoryIds` as plain `$state`, "not persisted", and seeds it with every category once they load.

- timestamp: 2026-10-10T21:53:00Z
  checked: `pmset -g log` for 2026-10-10 11:00 to 11:12 local (+0300), assertions included; `pmset -g custom`
  found: |
    11:04:15 caffeinate PID 47376 ClientDied PreventUserIdleSystemSleep 00:03:59 (one of a chain of four-minute caffeinates: 10:52:15, 10:56:15, 11:00:15, 11:04:15, 11:08:15, 11:12:15)
    11:07:45 Notification "Display is turned off"; powerd Released PreventUserIdleSystemSleep "Prevent sleep while display is on"
    11:08:15 caffeinate PID 50336 ClientDied PreventUserIdleSystemSleep 00:03:59 [System: NetAcc kCPU] — no idle-sleep assertion left
    11:08:15 Sleep "Entering DarkWake state due to 'Idle Sleep'" Using AC, 204 secs
    11:11:39 caffeinate PID 57099 Created PreventUserIdleDisplaySleep / PreventSystemSleep / UserIsActive; DarkWake to FullWake (the start of slice-2 under `caffeinate -dimsu`)
    System sleep timer: 1 minute on AC and on battery; display sleep 10 minutes on AC.
  implication: OBSERVED — the host began an idle sleep at 08:08:15Z, in the second the last idle-sleep assertion on the host lapsed, thirty seconds after the display went off. The run held no assertion of its own (it was not started under caffeinate). The heartbeat's largest gap was 73 ms: DarkWake keeps the CPU running, so the wrapper saw nothing.

- timestamp: 2026-10-10T21:54:00Z
  checked: every results.json under tests/e2e-runs (527 files) for page-console attachments holding the connection-lost line; then the same restricted to the power log's span (2026-10-04 onward) against every Sleep / Wake / DarkWake entry inside a run's window
  found: |
    All time: 5 756 page consoles in 291 runs, the line in 4 — 09-05 and 09-17 (perm-show-feedback-survey, outside the power log's span), 10-06 07:17:14.143Z (voter-journey, 172-09-final) and 10-10 08:08:15.542Z (this run).
    Inside the span: 3 288 page consoles in 152 runs (3 284 passed, 3 failed, 1 interrupted); the line in 2, both failed, both voter-journey, both ending at this same assertion with this same received text.
    Each dated loss falls in the second the OS starts a sleep transition: 10:17:14 "Entering DarkWake state due to 'Clamshell Sleep'"; 11:08:15 "Entering DarkWake state due to 'Idle Sleep'". A third, in the trace of 173-01-baseline (08:46:14.857Z, recorded in 173-01-SUMMARY), falls on 11:46:14 "Display is turned off", the start of a clamshell sleep whose Sleep entry follows 30 s later after "cupsd timed out(30000 ms)".
    Wake-side entries with the same page open (10-06 07:17:03 DarkWake, 07:17:04 FullWake, 07:17:20 FullWake): no loss.
    Six runs under induced CPU load (five at a 1-minute mean of 30 to 32, one peaking at 85.6): 156 page consoles, the line in none.
  implication: the socket loss is tied to the start of a host sleep transition (3 of 3 dated occurrences) and not to load (0 of 156 under load, 0 of 3 284 passing consoles). Which side closes the socket in that second is NOT observed.

- timestamp: 2026-10-10T21:55:00Z
  checked: `.planning/debug/172-closing-run-red-on-slow-host.md` (status diagnosed, 2026-10-06)
  found: it records this failure as its shape C — "a reload the test did not ask for" — with the identical assertion and received text, from the 10:17:14 clamshell transition. Its options 5 (no Vite socket under E2E) and 6 (persist the category selection) were listed and not applied; options 1 and 2 (the heartbeat and the power record) were built.
  implication: the same mechanism, second occurrence. The heartbeat built after the first cannot see it when the transition does not stop the CPU.

- timestamp: 2026-10-10T21:58:00Z
  checked: ISOLATION RE-TEST — tests/e2e-runs/261011-vj-diag/probe-socket-close-1: `caffeinate -dimsu tests/scripts/e2e-run.sh --no-db-reset --project voter-journey`, AC power, no induced load (load at start 9.74), heartbeat max 86 ms, no void marker, no power entry. One intervention, the uncommitted probe kept beside the run as probe-socket-close.patch: `page.routeWebSocket` holds the page side of the Vite socket and closes it once, when the walk has settled on Base-5, then waits for the `load` event of the reload.
  found: |
    wrapper exit 1: 3 passed, 1 failed — voter-journey "full voter journey end-to-end".
    Console: 21:57:05.686Z "[vite] server connection lost. Polling for restart...", 21:57:05.930Z "[vite] connecting...".
    Snapshots: progress max 12 up to 21:57:05.622Z, 13 from 21:57:06.496Z to the end.
    Error, at spec line 194: `expect(locator).toHaveText(expected)` on voter-questions-category-intro, Expected /Opinion Questions for Regional Elections Only/i, Received "[qg-opin-opt-b-Skipped] Optional Opinion Questions B  1 question", Timeout 2000ms, 21 polls — character for character the error of 261010-f1-slice-1.
  implication: CONFIRMED by the observation that could have refuted it. A closed dev socket alone, on an unloaded host with a server that had been serving for seconds, produces the failure in full. Neither load nor a cold server nor a power event is needed downstream of the socket loss.

- timestamp: 2026-10-10T22:00:30Z
  checked: MATCHED CONTROL — tests/e2e-runs/261011-vj-diag/probe-control-1: the same command minutes later, the spec restored by `git checkout` (tree clean outside .planning)
  found: wrapper exit 0, 4 passed, 0 failed.
  implication: the probe's one intervention is the only difference between the red run and the green one.

- timestamp: 2026-10-10T22:01:00Z
  checked: every Sleep / Wake / DarkWake entry of the power log (2026-10-04 onward) that falls inside the Playwright window of a kept run, by its stated reason
  found: five runs hold such entries. 172-09-final: 'Maintenance Sleep' twice on battery and a 'Clamshell Sleep' DarkWake. 173-01-baseline: 'Clamshell Sleep' three times. 174-10-final: 'Clamshell Sleep' (void by the marker). 261010-f1-slice-2: 'Clamshell Sleep' twice (void by the marker). 261010-f1-slice-1: 'Idle Sleep' once — the only idle sleep inside any run of the span, in the one run of the five that was started without caffeinate.
  implication: an idle sleep is the trigger a held assertion prevents; a closed lid is the trigger it does not.

- timestamp: 2026-10-10T22:01:30Z
  checked: what closes the socket in that second (research, not measurement)
  found: Chromium's network stack fails connected TCP sockets when the OS announces a suspend; the change that moved that logic into the TCP socket layer says it covers WebSockets after a connection is established (codereview.chromium.org/2447083003). The dev server is Node and has no such observer; it logged no restart, no "page reload" and no "optimized dependencies changed", and it answered the reloaded document in 202 ms.
  implication: consistent with the browser being the side that closes. NOT observed on this host: the trace does not record which end closed the socket, and the sleep was not re-induced (it would suspend every other session on the host).

- timestamp: 2026-10-10T22:02:40Z
  checked: `tests/scripts/e2e-run.sh --self-test` on the changed wrapper (tests/e2e-runs/261011-vj-diag/wrapper-self-test.log)
  found: exit 0, 5 of 5 cases; no `caffeinate -dimsu -w` process left behind.
  implication: the heartbeat's contract is unchanged by the edit.

- timestamp: 2026-10-10T22:04:44Z
  checked: FIX OBSERVED — tests/e2e-runs/261011-vj-diag/fix-observe-1: the voter-journey slice through the changed wrapper with NO caffeinate around it, while `ps` and `pmset -g assertions` were sampled every 10 s (fix-observe-1.assertions.txt)
  found: |
    22:03:24Z, before the wrapper's step 3: the only assertion holders are two `caffeinate -i -t 300` of the agent sessions' shells; system totals PreventUserIdleDisplaySleep 0, PreventSystemSleep 0.
    22:03:34Z to the end: `49921 49878 caffeinate -dimsu -w 49878`, a child of the wrapper (pid 49878), holding PreventUserIdleSystemSleep, PreventUserIdleDisplaySleep and PreventSystemSleep; totals 1 / 1 / 1.
    After exit, 22:04:44Z: no such process. Wrapper exit 0, 4 passed; env-posture.txt `sleep_assertion=caffeinate -dimsu`, heartbeat max 36 ms.
  implication: a run now holds its own assertions whatever launched it. The `caffeinate -i -t 300` processes are the rolling assertions seen dying every four minutes in the power log of 2026-10-10; the red run had nothing else.

- timestamp: 2026-10-10T23:00:04Z
  checked: PART C, runs 1 to 5 — `caffeinate -dimsu` around `tests/e2e-runs/261010-f1-load/loaded-run.sh 261011-f1-slice-<n> 31 --project perm-no-nomination`, one after another (tests/e2e-runs/261011-vj-diag/slice-chain.sh and slice-chain.log), AC power, the changed wrapper, tree outside .planning that of 1f765a6db in every run
  found: |
    All five: driver exit 0, 267 of 267 passed, 0 failed, 0 flaky, 0 did not run, 91 projects; AC power at both ends; no Sleep entry in the window; no void marker; `sleep_assertion=caffeinate -dimsu`; heartbeat max 89 to 138 ms; no burner left after any of them.
    1-minute load in the window, min / mean / max: 27.88 / 30.76 / 33.82; 26.44 / 30.44 / 33.80; 18.79 / 28.57 / 34.87; 20.41 / 28.65 / 34.79; 28.20 / 31.37 / 40.70.
    The voter journey started 4.0 to 9.6 s into each run, beside the four cold sign-ins, and passed in 37.8 to 40.9 s. 100 page consoles, the connection-lost line in none.
    The four cold sign-ins, whole-test seconds: run 1 5.5 5.0 4.7 4.4; run 2 6.0 5.5 5.3 5.2; run 3 4.0 3.6 3.5 3.4; run 4 4.0 3.9 3.6 3.4; run 5 5.2 5.2 5.1 4.4. All passed.
    LOAD AT THE COLD START IS NOT THE SAME IN THE FIVE. The launcher's prewarm waits on the 1-minute average; runs 3 and 4 began while that average was still above the threshold from the run before, with 0 s of prewarm and 3 to 9 burners running. While their cold sign-ins ran, the controller's estimate of runnable threads was 13 to 22, against 27 to 37 (run 1), 31 to 38 (run 2) and 27 to 66 (run 5).
  implication: under a held assertion and a held load the journey does not fail in the red run's shape: nothing in five runs contradicts "load has no part". For the sign-in helper's wait, runs 1, 2 and 5 are loaded at the moment that matters and runs 3 and 4 are loaded at about half. Two more runs are made after a cool-down each (slice-chain-cooled.sh), so that five carry the load at the cold start.

- timestamp: 2026-10-10T23:25:49Z
  checked: PART C, runs 6 and 7 — the same launcher, each started after a cool-down that let the 1-minute average fall below 20, so the launcher prewarmed it (slice-chain-cooled.sh)
  found: |
    Both: driver exit 0, 267 of 267, AC power at both ends, no Sleep entry, no void marker, no burner left.
    1-minute load in the window, min / mean / max: 27.14 / 30.77 / 34.43 (prewarm 140 s); 27.41 / 31.34 / 36.39 (prewarm 170 s).
    While the cold sign-ins ran, the estimate of runnable threads was 25 to 42 (run 6) and 34 to 45 (run 7), with 12 to 17 burners.
    Cold sign-ins, whole-test seconds: run 6 5.1 5.8 5.6 4.6; run 7 5.8 6.0 5.9 5.0. The journey passed in 40.3 and 39.8 s. 40 page consoles, the connection-lost line in none.
    After the last run: `pgrep -f F1LOAD261010` empty, no controller, launcher or chain process, no listener on 5273; uptime 24.89 28.72 29.02 at 23:26Z and 13.63 23.75 27.04 at 23:28Z.
  implication: seven loaded slice runs in the red run's shape, seven green. Five of them (1, 2, 5, 6, 7) carry the held load while the four cold sign-ins and the start of the journey run; two (3, 4) carry about half of it there. The helper's default wait was not reached in any: the slowest cold sign-in took 6.0 s as a whole test, against 11.1 to 12.9 s in the original red run of 176-14. That run's condition is therefore still not recreated by processor-bound load.

- timestamp: 2026-10-10T23:27:30Z
  checked: whether the ORIGINAL red sign-in run (tests/e2e-runs/176-e2e/176-14-precommit, 2026-10-09 08:28:51Z to 08:31:43Z) is the mechanism diagnosed here — its kept trace and the power log (that day's entries are stamped +0200)
  found: the trace's page console holds "[vite] connecting..." and "[vite] connected." and no connection-lost line. No Sleep, Wake or DarkWake entry falls inside the run window; "Display is turned off" is logged at 10:31:53 and a 'Clamshell Sleep' at 10:31:58 +0200, ten and fifteen seconds after the run ended. The first power-source reading of that half hour is "Using Batt" at 10:31:41 +0200, two seconds before the run ended.
  implication: the original failure at the helper's wait is NOT this mechanism: no reload under the test, no sleep entry in its window. Whether the host was already on battery while the four sign-ins ran (08:29:17Z to 08:29:30Z) is not in the log. Its cause stays unconfirmed.

- timestamp: 2026-10-10T23:40:05Z
  checked: PART D on ae55fb89b (the tree of 1f765a6db plus one sentence of tests/README.md), unloaded, AC power, under caffeinate — `176-gates.sh 261011-vj-final --rows lint,unit,check-frontend,build,format` (TURBO_FORCE=true), then `176-e2e.sh 261011-vj-final`; each status read from its own file
  found: |
    tests/e2e-runs/176-gates/261011-vj-final/summary.tsv: lint 0, unit 0 (25 tasks, 0 cached; frontend 3575 passed, 20 skipped), check-frontend 0 (2808 files, 0 errors, 0 warnings), build 0 (14 tasks, 0 cached), format 0; driver 0; no Sleep entry in the window.
    tests/e2e-runs/176-e2e/261011-vj-final: wrapper exit 0, driver exit 0; 341 total, 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 113 projects; 23:31:18Z to 23:40:05Z; AC power at both ends; no Sleep entry; no void marker; `sleep_assertion=caffeinate -dimsu`; heartbeat max 111 ms. Against 261010-f1-b2-final: 113 projects compared, 0 different in counts.
    Afterwards: no listener on 5273, no load process, no wrapper caffeinate; uptime 7.93 10.20 17.19.
  implication: the final commit passes every closing gate, and the full run is complete and green.

## Resolution

root_cause: >
  The page under the test was reloaded. The host began an idle sleep at 08:08:15Z, 11.6 s into the journey
  ("Entering DarkWake state due to 'Idle Sleep'", in the second the last idle-sleep assertion on the host
  lapsed; the run held none of its own, having been started without caffeinate). In that second the page's
  socket to the Vite dev server closed, Vite's dev client answered with location.reload(), and the reload
  re-seeded the voter's category selection, which the application keeps in memory only. The walk then met
  the category it had deselected. Contributing conditions, each a link of the same chain and none a second
  cause: a dev client that reloads on a socket loss; a selection that does not survive a reload; a dark
  wake that keeps the CPU running, so the heartbeat had no gap to void the run by. Load, the cold dev
  server and the 2000 ms window have no part.
fix: >
  tests/scripts/e2e-run.sh holds a sleep assertion itself for the life of the run
  (`caffeinate -dimsu -w <its pid>`, where the command exists) and records it in env-posture.txt as
  `sleep_assertion`; the script header and tests/README.md describe it. Commits 1f765a6db and ae55fb89b
  (one README sentence). The spec and the application are not changed.
oracle_type: derived — the model is the trace of the red run; the probe asserts that the same intervention produces the same error
verification:
  target_test: { result: pass, note: "the journey in the red run's shape, seven loaded slice runs under the wrapper's assertion, 267 of 267 each; the full suite 341 of 341. None of them met a sleep transition, so they show the shape is green and that load does not fail it; they do not show a failure being prevented." }
  mutation_check: { result: skipped, reason_if_skipped: "the change is to a bash wrapper; no mutation tool covers it" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false, note: "additive: one background process, one posture line, its release at teardown" }
  adjacent_tests: { result: pass, suites_run: ["e2e-run.sh --self-test (5 of 5)", "yarn test:unit (25 tasks)", "yarn lint:check", "yarn format:check", "frontend check", "yarn build", "full E2E 341 of 341"] }
  revert_and_reconfirm: { result: not-run, bug_returned_on_revert: not_tested, fixed_on_reapply: not_tested, note: "the idle sleep cannot be re-induced without suspending every other session on the host. Observed instead: the red run held no assertion of its own (power log); a run through the changed wrapper does, with no caffeinate around it (fix-observe-1). The half of the chain below the socket loss was reproduced and controlled (probe-socket-close-1, probe-control-1)." }
  guardrail_verdict: not accepted by the agent — one signal is not run. The human decides: accept with that named as the unmet signal, or have the sleep re-induced on a host with nothing else running.
  rejected_signal: none failed; revert_and_reconfirm not run
files_changed:
  - tests/scripts/e2e-run.sh
  - tests/README.md
why_not_caught: the wrapper's heartbeat detects a host that stops running; a sleep transition that leaves the CPU running stops nothing, and nothing held the host awake on the run's behalf
recurrence_guard: the wrapper's own assertion (env-posture.txt `sleep_assertion`), for an idle sleep. None for a closed lid — see the todo's "What is left".
specialist_hint: general

---
status: diagnosed
trigger: "Phase 172 closing default-suite run tests/e2e-runs/172/172-09-final (commit 40523cd16, clean tree) went 77 passed / 9 failed / 94 did not run; a second attempt on the same commit with no change (172-09-final-r2) was 180/180. Bring it to a named, evidenced root cause."
created: 2026-10-06T07:50:13Z
updated: 2026-10-06T08:25:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

bug_class: Mandelbug — environment-triggered, and deterministic once the trigger is present
hypothesis: CONFIRMED. The host was not slow, it was ASLEEP. The machine is a laptop that was running lid-closed on external power and display; that link dropped ten seconds after the wrapper started, and macOS put the system to sleep four times (198 s in all) before it came back six minutes later.
test: done — records of the incident itself (OS power log, Playwright traces, results.json), a differential over every full run of the phase, and one loaded plus one control run for the alternative
expecting: n/a
next_action: none for this session. The fix is not applied (goal: find_root_cause_only); the options are in § Options below.

reasoning_checkpoint:
  hypothesis: "A system sleep during the run caused all nine failures, because (1) Playwright's deadlines are measured on a clock that keeps counting while the host sleeps, (2) Chromium aborts in-flight requests when the network changes after a wake, which leaves SvelteKit on its error page, and (3) the Vite dev client reloads the page when its socket closes, which resets the voter's in-memory category selection."
  confirming_evidence:
    - "pmset -g log: AC lost 10:11:18 local; Sleep 10:11:30 (17 s), 10:12:32 (83 s), 10:14:40 (91 s), 10:16:56 (7 s); AC back 10:17:04; clamshell DarkWake 10:17:14-10:17:20. The unified log is empty between 10:14:41.892 and 10:16:11.348."
    - "Trace steps with a 2 s and a 3 s budget that lasted 89 522 ms and 89 492 ms of wall clock (07:14:41.8Z -> 07:16:11.3Z); a browser that issued no request for 89.5 s over the same interval."
    - "Five tests end at 07:16:10.5-07:16:11.7Z, the wake instant; two more end at 07:16:57.2Z and 07:17:03.9Z, the edges of the fourth sleep."
    - "`net::ERR_NETWORK_CHANGED` on 54 and 20 requests in two traces after the 10:16:11 wake, followed by SvelteKit's error page in both page snapshots."
    - "Two browsers of two different workers log '[vite] server connection lost' at 07:17:14.142Z and 07:17:14.143Z, the second the OS logs the clamshell transition."
    - "Of the nine full runs of the phase, the red one is the only one that overlaps a sleep entry."
  falsification_test: "A full run that overlaps no sleep entry and shows the same three shapes; or a sleep during a run that leaves it green. Neither exists in the record. The alternative, CPU starvation alone, was tested and did not reproduce: 180 of 180 under a 1-minute load of up to 85.6."
  fix_rationale: "Nothing in the product or the specs is wrong, so the fix belongs to the harness: detect that the host was suspended during a run and say so by name, instead of reporting a wall of voter-flow failures. See § Options."
  blind_spots: "The sleep was not re-induced (it would suspend every other session on the host). Why work ran 3-6x slower inside the DarkWake windows was not measured. The `performance` project records no trace, so its failure is classified by its end time and message. What dropped the power and display link is not in any log."
  candidate_causes:
    - "environment: system sleep of the host during the run — CONFIRMED"
    - "environment: CPU starvation — ELIMINATED by experiment"
    - "environment: memory pressure — swap occupancy does not discriminate (93.9 % in the red run, 95.1 % at the peak of the green control); not induced"
    - "code: a dev-server stall or restart — ELIMINATED from the dev-server log and the traces"
    - "data / config: the tree — ELIMINATED, no difference outside .planning between 40523cd16 and the tree of three green runs"
  and_gate: "No. The sleep alone is sufficient: every failure follows from it by a mechanism the artifacts show. Two properties decide HOW it surfaces rather than WHETHER: the harness has no suspend detection (so a void run reads as a red one), and the category selection is in memory only (so the one reload shows up as a wrong category)."

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: the full default suite passes 180 of 180 on commit 40523cd16, as it did on seven earlier full runs of the phase on closely related trees
actual: tests/e2e-runs/172/172-09-final — 180 total, 77 passed, 9 failed, 0 flaky, 94 did not run, wrapper exit 1. Failures: performance 1, a11y-smoke 7, voter-journey 1. Second attempt on the same commit with no change (172-09-final-r2) — 180/180.
errors: "voter-journey: the answer walk did not advance after answering a single-choice / boolean / Likert question … 30000 ms"; "Test timeout of 90000ms exceeded while setting up locatedVoterPage / answeredVoterPage"; "the voter flow reaches one of […] Timeout 30000ms exceeded while waiting on the predicate"; "expect(locator).toHaveText(expected) failed … voter-questions-category-intro … Expected /Opinion Questions for Regional Elections Only/i Received '[qg-opin-opt-b-Skipped] Optional Opinion Questions B 1 question'"
reproduction: not known — one red run in nine full runs of the phase; the previous executor attributes it to a dev server that took 161 s to become ready on a loaded host
started: 2026-10-06T07:11:08Z, the closing run of plan 172-09

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: "The host was heavily CPU-loaded before or at the start of the red run, and that made the dev server slow."
  evidence: env-posture.txt of the red run records load_at_start=9.38/8.22/6.54; the green 172-08-axe records 9.31/7.92/6.68. The gate that preceded the red run (tests/e2e-runs/172-gates/172-09-final/summary.tsv) has the same row timings as every earlier gate (45/31/0/3/5/59/8/16/17 s) and ended 07:10:20Z, 48 s before the run started. The host was not more loaded than in a green run when the red run began.
  timestamp: 2026-10-06T07:56:00Z

- hypothesis: "The dev server itself stalled (dependency re-optimisation, a restart, an HMR storm, the turbo package watcher rewriting dist)."
  evidence: devserver.log of the red run holds exactly one "Forced re-optimization" line like every green run, no "optimized dependencies changed", no "page reload", no "hmr update", no "server restarted". In the trace of the voter journey 2 389 of 2 390 dev-server requests were answered, median 4 ms, max 447 ms. In the trace of `results (dark)` the browser issued no request at all for 89.5 s (07:14:41.868Z -> 07:16:11.4Z): the browser was not waiting on the server, the browser was not running.
  timestamp: 2026-10-06T08:01:00Z

- hypothesis: "113 of 811 dev-server requests never received a response, all issued at one instant, so the dev server dropped them."
  evidence: the count is right (trace b5c61b59, `axe accessibility scan — questions`), the reading is not. They were issued in two bursts (60 at 07:14:33.7-34.3Z, 53 at 07:14:37.1-37.5Z), carry status -1 with NO failure text, and the same trace shows requests answered up to 07:14:41.507Z. Every trace of the run has such a block at its page loads, including a trace whose page went on to complete thousands of answered requests (02a714c4: 133 at 07:16:12.5-12.9Z, then 2 893 answered, median 7 ms). An entry without a response and without a failure text is what a document leaves behind when the walk navigates away from it; it is not a stall signature. The requests that DID fail carry a failure text, and it is `net::ERR_NETWORK_CHANGED`.
  timestamp: 2026-10-06T08:02:00Z

- hypothesis: "Host CPU starvation alone reproduces the nine failures."
  evidence: tests/e2e-runs/172/172-diag-load-1 — a cold start after a production build with 14 busy loops running for the first 240 s. 1-minute load 26 -> 85.62 (peak 08:07:04Z), 5-minute peak 36.10: above the 29.75 read after the red run. Dev server ready in 80 174 ms. Result 180 of 180, wrapper 0, no retry. Largest per-test slowdown x2.2; the longest test under the 90 s ceiling took 39.0 s. Dev server probed every 5 s: 63 answers, mean 11 ms, max 130 ms. Dev-server log: 0 failed module fetches, 0 HMR reload warnings. All nine tests that failed in the incident ran inside the loaded window.
  timestamp: 2026-10-06T08:11:54Z

- hypothesis: "Memory pressure (swap about 94 % used) is the driver."
  evidence: not induced, by instruction. Swap occupancy does not separate red from green: 93.9 % (14 424 of 15 360 M) 78 s after the red run by the executor's note; 92.4 % at the peak of the green loaded run (13 250 of 14 336 M); 95.1 % at the peak of the green control (13 640 of 14 336 M). Nothing in the artifacts points at memory once the sleep is known. A test would be a bounded allocation on a host with no other session (for example `memory_pressure -S -l critical` for a fixed time) around a cold-start run; it was not made.
  timestamp: 2026-10-06T08:20:16Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-10-06T07:50:13Z
  checked: host state before any work — `uptime`, `sysctl -n vm.swapusage`, listeners on 5173/5273, process list
  found: load averages 3,14 3,38 6,02 on 14 cores; swap total 15360,00M used 14256,31M free 1103,69M; 36 GiB RAM; nothing listening on 5173 or 5273; no Playwright, gate, turbo or dev-server process of this repo (a Vite on 5199 and a `next dev` on 3007 belong to other projects)
  implication: the host is calm; the induced-load experiment is permitted by the brief

- timestamp: 2026-10-06T07:55:00Z
  checked: tests/e2e-runs/172/172-09-final/results.json against 172-09-final-r2 and 172-08-axe, test by test
  found: red run — Playwright started 07:13:58.194Z; first test 10.5 s later (green: 3.4 s). Tests that touch no dev server were slow too: data-setup-base 2 934 ms (green 795 / 705), storage-cleanup 953 ms (596 / 574). a11y home 4 456 ms (1 054), auth-setup 26 180 + 25 619 ms (4 005 + 4 079). FIVE tests end within 1.2 s of each other at 07:16:10.5-07:16:11.7Z. From 07:17:06Z every test has its normal duration.
  implication: the whole host, not only the dev server, was degraded from before the first test until about 07:17; and something happened at 07:16:11Z that ended five tests at once

- timestamp: 2026-10-06T07:57:00Z
  checked: devserver.log of red against 172-08-axe and 172-09-final-r2 (stream by stream, with the Vite line timestamps)
  found: "ready in 161409 ms" printed at 10:13:55 local; every green cold start 27 300-31 032 ms; warm starts about 1 s. The 27-31 s is the Paraglide recompile ("Compilation complete (locale-modules)") that follows a production build, which leaves 606 message-module files where the dev plugin wants 15; warm starts print "Compilation skipped — inputs unchanged". `yarn dev` runs `yarn dev:clean` itself, so the Vite cache is cold on every wrapper run. The turbo watcher printed nothing between 10:13:55 and 10:17:17 in the red run and ten rebuild passes in the 41 s after; in green runs it prints a pass every 5-20 s throughout. Vite forwards browser console.warn / console.error / unhandled rejections into this log: red holds 3 x "The next HMR update will cause the page to reload" and 6 x "Failed to fetch dynamically imported module …/.svelte-kit/generated/client/nodes/N.js" at 10:16:26-10:16:41; green holds none.
  implication: processes of the run were silent for minutes at a time; the client-side module-fetch failures are real and specific to the red run

- timestamp: 2026-10-06T07:59:00Z
  checked: macOS power-management log, `pmset -g log`, for 2026-10-06 10:05-10:20 local (UTC+3), and the unified log (`/usr/bin/log show`) for powerd in the same window
  found: |
    10:11:18 powerd "Power Source change. Source:Batt" — AC lost ten seconds after the wrapper started (started = 07:11:08Z)
    10:11:25 "Display is turned off"
    10:11:30 Sleep — "Entering Sleep state due to 'Clamshell Sleep' … Using Batt" — 17 secs
    10:11:47 DarkWake (wake reason USB-C_plug) — 45 secs
    10:12:32 Sleep — 'Maintenance Sleep' — 83 secs
    10:13:55 DarkWake — 45 secs
    10:14:40 Sleep — 'Maintenance Sleep' — 91 secs
    10:16:11 DarkWake — 45 secs
    10:16:56 Sleep — 'Maintenance Sleep' — 7 secs
    10:17:03 DarkWake (USB-C_plug); 10:17:04 "Using AC", DarkWake to FullWake, display on
    10:17:14 "Entering DarkWake state due to 'Clamshell Sleep' … Using AC" — 6 secs, display off
    10:17:20 FullWake due to HID Activity, display on
    The unified log has NO line from any process between 10:14:41.892 and 10:16:11.348.
    The same log shows `caffeinate` (PreventUserIdleSystemSleep) and Claude (NoIdleSleepAssertion) holding their assertions at 10:11:25; the system slept all the same.
  implication: the machine was asleep for 17 + 83 + 91 + 7 = 198 s of the 454 s run, and in DarkWake on battery for most of the rest until 10:17:04. Idle-sleep assertions do not stop a clamshell sleep on battery.

- timestamp: 2026-10-06T08:00:00Z
  checked: every other full run of the phase against the same log
  found: on 2026-10-06 local the log holds sleep entries in two windows only: 08:17:47-08:43:49 (between plans, no run in flight) and 10:11:30-10:17:20. None of 172-01-baseline (02:59-03:04 local), 172-01-table, 172-03-writer, 172-04-stage1, 172-06-visibility (08:52-08:57), 172-07-stage2, 172-08-axe (09:43-09:49) or 172-09-final-r2 (10:26-10:31) overlaps a sleep entry. The log holds 11 to 31 sleep entries per day over the last eight days.
  implication: the one red run of nine is the one run that overlapped a system sleep; the trigger is an everyday event on this host

- timestamp: 2026-10-06T08:01:00Z
  checked: the traces of the red run. They were NOT lost: the HTML report in the run directory keeps its own copies, tests/e2e-runs/172/172-09-final/html/data/*.zip (8 traces; the performance project records none), two videos and nine error-context files
  found: |
    Frozen steps: `results` (c60d60e6) "Click … Timeout 3000ms exceeded", 07:14:41.848Z -> 07:16:11.340Z, 89 492 ms. `questions (dark)` (e41cfc2e) "Click … Timeout 2000ms exceeded", 07:14:41.821Z -> 07:16:11.343Z, 89 522 ms. `questions` (b5c61b59) "Wait for selector" 89 476 ms. `results (dark)` (59254159): requests 07:14:41.745-41.868Z, then nothing for 89.5 s, then 64 at 07:16:11Z.
    `voter-detail-drawer` (84e7def5): 54 requests issued 07:16:18.2-18.7Z failed with `net::ERR_NETWORK_CHANGED`; console 07:16:36.316Z "Failed to load resource: net::ERR_NETWORK_CHANGED" x 60, "The next HMR update will cause the page to reload", "TypeError: Failed to fetch dynamically imported module: …/nodes/4.js". Page snapshot at the failure: "Status: 500 / Message: Internal Error".
    `route announcer` (92faa105): 20 requests failed with `net::ERR_NETWORK_CHANGED`; the same console sequence at 07:16:25.863-30.525Z. Page snapshot: the app's "Internal Error" page.
    `results-filter-drawer (dark)` (02a714c4): `Navigate` 07:16:18.859Z -> 07:16:53.028Z, 34 170 ms (the document request took 32 050 ms); "[vite] server connection lost. Polling for restart..." at 07:17:14.142Z; the next "Wait for navigation" never returned.
    `voter journey` (df33b2ad), a different worker and browser process: the same line at 07:17:14.143Z, "[vite] connecting..." at 07:17:14.678Z (a reload). 2 389 of 2 390 requests answered, median 4 ms, max 447 ms. Failing step 07:17:25.584Z -> 07:17:28.078Z.
  implication: Playwright itself did not run for 89.5 s; the browser reports a network change after the wake; two independent browsers lose the Vite socket in the same millisecond, in the second the OS logs the 10:17:14 clamshell transition. The socket loss is a host event, not a dev-server event.

- timestamp: 2026-10-06T08:02:00Z
  checked: the harness's clocks and budgets — tests/tests/helpers/timeouts.ts, tests/tests/utils/voterNavigation.ts, tests/tests/fixtures/voter/voter-journey.fixture.ts, tests/playwright.config.ts, tests/global-setup.ts, tests/scripts/e2e-run.sh; and node_modules/vite/dist/client/client.mjs, node_modules/@sveltejs/kit/src/runtime/client/client.js
  found: test ceiling 90 s locally (TIMEOUTS.testMax), STAGE_BUDGET = testMax / 3 = 30 s for every stage resolve and for `requireNavigation`; retries 0, workers 6, trace retain-on-failure. The wrapper waits for a LISTEN on the port for at most DEVSERVER_TIMEOUT_S = 180 s of wall clock (about 165 s elapsed, 100 s of them asleep). The preflight asserts the served checkout and the served project and nothing else. env-posture.txt records the load at start and never enforces it; nothing records the power source, and nothing compares wall clock with running time. Vite 8.3.1's client, on `vite:ws:disconnect` outside an unload: log "server connection lost. Polling for restart...", ping, `location.reload()`. SvelteKit's client `handle_error`, in dev: `console.warn('The next HMR update will cause the page to reload')` — its unexpected-error path, here a failed dynamic import of a route node.
  implication: a suspended host passes every gate the harness has, and each deadline that falls inside a sleep fires on wake

- timestamp: 2026-10-06T08:03:00Z
  checked: apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts and the journey step that failed
  found: `#selectedQuestionCategoryIds = $state<Array<Id>>([])` under the comment "Plain `$state`, not persisted: `bind:group` through a context accessor backed by a persisted store drops writes intermittently. An effect in the constructor selects every category once they load". `#firstQuestionId` beside it IS session-persisted, and the answers are persisted too. The spec already documents a sibling case: "a full `page.goto('/questions')` reload drops the in-memory election scope".
  implication: after the reload at 07:17:14.6Z the seeding effect selected every category again, so the deselected Opt-B category was walked. The reload is dev-server-only (a production build has no Vite client); losing the selection on a reload is the product's documented behaviour, not a regression

- timestamp: 2026-10-06T08:04:10Z
  checked: host state immediately before the experiment, and the tree
  found: load averages 2,95 4,10 5,01; swap total 14336,00M used 12731,75M; AC power, lid open (`AppleClamshellState = No`); ports 5173/5273 free; no process of this repo; `git diff --stat 40523cd16 HEAD -- . ':(exclude).planning'` is empty (HEAD c071b0823: five docs commits since the red run)
  implication: the experiment runs on the product and test tree of the red run, on a calm host

- timestamp: 2026-10-06T08:11:54Z
  checked: LOADED RUN tests/e2e-runs/172/172-diag-load-1 — `TURBO_FORCE=true yarn build` (gate row 08 alone, no database reset) for the post-gate cold state, then 14 `perl -e 'alarm 240; 1 while 1'` loops (pids 49471 49472 49474-49485) started with the runner at 08:05:02Z
  found: |
    180 total, 180 passed, 0 failed, 0 flaky, 0 did not run; wrapper 0; verdict GREEN. started 08:05:04Z, ended 08:11:49Z, Playwright 08:06:35.576Z for 313.8 s.
    Dev server: "Compilation complete", ready in 80 174 ms; first HTTP 200 on the probe 08:06:34Z; 63 probes answered, mean 11 ms, max 130 ms; 0 failed module fetches, 0 HMR reload warnings in devserver.log.
    Load 1 / 5 / 15 min every 15 s: 08:05:02 7,26 4,95 5,26 | 08:05:18 26,44 9,26 6,78 | 08:05:33 51,61 15,69 9,12 | 08:05:48 65,05 20,42 10,92 | 08:06:03 70,64 23,87 12,32 | 08:06:18 71,28 26,32 13,40 | 08:06:34 72,56 28,85 14,53 | 08:06:49 79,79 32,53 16,09 | 08:07:04 85,62 36,10 17,65 | 08:07:19 73,11 35,77 17,85 | 08:07:35 60,86 35,38 18,13 | 08:07:50 54,41 35,21 18,37 | 08:08:06 49,38 35,01 18,59 | 08:08:21 47,20 35,19 18,94 | 08:08:36 42,63 34,75 19,07 | 08:08:51 41,24 34,85 19,37 | 08:09:07 37,74 34,42 19,49 | 08:09:22 30,37 32,96 19,23 | 08:09:37 24,56 31,55 18,97 | 08:09:52 20,56 30,32 18,75 | 08:10:07 17,53 29,18 18,54 | 08:10:22 15,16 28,07 18,34 | 08:10:37 13,26 27,01 18,13 | 08:10:52 11,05 25,85 17,87 | 08:11:07 10,16 24,93 17,68 | 08:11:22 9,26 24,00 17,47 | 08:11:38 8,27 23,05 17,25
    Swap used 12 731,75M -> 12 699,75M -> 13 250,31M of 14 336,00M. AC power on every sample. No sleep entry in the power log.
    Slowest against green: performance 38 960 ms (18 205), results-filter-drawer (dark) 26 417 ms (18 517), voter journey 45 084 ms (40 898), auth-setup 7 710 + 7 603 ms (4 005 + 4 079); largest factor x2.2.
    All 14 load pids gone at the end; ports free; tree clean outside .planning.
  implication: CPU starvation at more than the load reported for the red run slows the suite by up to x2.2 and breaks nothing. The dev server stays responsive under it.

- timestamp: 2026-10-06T08:20:16Z
  checked: CONTROL RUN tests/e2e-runs/172/172-diag-control-1 — the same cold start, no induced load, started once the 1-minute load was back at 4,31
  found: |
    180 total, 180 passed, 0 failed, 0 flaky, 0 did not run; wrapper 0; verdict GREEN. started 08:14:37Z, ended 08:20:11Z, Playwright 08:15:19.741Z for 291.7 s.
    Dev server: "Compilation complete", ready in 32 267 ms; first HTTP 200 08:15:17Z; 59 probes answered, mean 6 ms, max 82 ms; 0 failed module fetches, 0 HMR reload warnings.
    Load 1 / 5 / 15 min every 15 s: 08:14:37 6,14 14,82 14,85 | 08:14:52 6,72 14,53 14,75 | 08:15:07 6,15 14,03 14,56 | 08:15:22 5,92 13,59 14,40 | 08:15:38 8,31 13,74 14,43 | 08:15:53 11,98 14,25 14,60 | 08:16:08 13,26 14,44 14,67 | 08:16:23 15,76 14,93 14,83 | 08:16:38 14,11 14,60 14,72 | 08:16:53 12,33 14,18 14,57 | 08:17:09 15,71 14,87 14,81 | 08:17:24 13,12 14,33 14,62 | 08:17:39 11,16 13,84 14,44 | 08:17:54 9,80 13,41 14,27 | 08:18:09 9,28 13,11 14,15 | 08:18:24 8,07 12,66 13,97 | 08:18:39 7,33 12,27 13,81 | 08:18:54 6,31 11,80 13,61 | 08:19:09 5,71 11,40 13,44 | 08:19:24 6,55 11,31 13,37 | 08:19:40 6,01 10,96 13,21 | 08:19:55 6,37 10,78 13,10 | 08:20:10 6,26 10,54 12,98
    The 5- and 15-minute figures at the start still carry the loaded run; the host was calm by the 1-minute figure only.
    Swap used 13 066,25M -> 13 640,25M of 14 336,00M. AC power on every sample. No sleep entry in the power log.
  implication: a cold start on an awake host behaves as the seven earlier cold starts did. It measures the alternative hypothesis and nothing else: it is not offered as evidence that the suite is sound.

- timestamp: 2026-10-06T08:22:27Z
  checked: the host as left
  found: load averages 5,57 8,49 11,75; swap total 14336,00M used 13576,25M; AC power; ports 5173 and 5273 free; no perl loop, Playwright, wrapper, watcher or dev-server process; 14 containers running and Supabase REST answering 200; `git status --porcelain` shows this file and CAND-APP-PLAN.md only
  implication: nothing of this session is left running

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: >
  The host went to sleep during the run. The machine is a laptop that was running lid-closed on external power and
  display; at 07:11:18Z, ten seconds after the wrapper started, that link dropped, and until it came back at
  07:17:04Z macOS cycled Sleep / 45 s DarkWake four times (asleep 17 + 83 + 91 + 7 = 198 s of a 454 s run).
  Nothing in the harness knows a host can be suspended: Playwright's deadlines are measured on a clock that keeps
  counting through sleep, Chromium aborts requests on the network change that follows a wake, and the Vite dev
  client reloads the page when its socket closes. Contributing property of the harness, not a second cause: with no
  suspend detection, a void run is reported as a red one with no line naming why.
fix: not applied — goal is find_root_cause_only. See § Options.
verification: >
  Confirmed from records of the incident (OS power log, eight surviving traces, results.json) and a differential
  over the nine full runs of the phase. The alternative the brief was written around, CPU starvation alone, was
  tested once and did not reproduce (172-diag-load-1, 180/180 under a 1-minute load of up to 85.6); the control
  (172-diag-control-1) was 180/180. The sleep itself was not re-induced.
files_changed: []
why_not_caught: no gate existed for this class — the wrapper records the load at start and asserts the served application, and neither says anything about a host that stops running
specialist_hint: general

## The causal chain

| # | When (UTC) | What happened | Evidence |
|---|---|---|---|
| 1 | 07:11:08 | wrapper starts; load 9.38 / 8.22 / 6.54, the same as the green 172-08-axe | 172-09-final/started, env-posture.txt |
| 2 | 07:11:18 | the laptop, lid closed, loses AC and its external display | powerd "Power Source change. Source:Batt"; pmset "Clamshell Sleep" |
| 3 | 07:11:30-07:11:47, 07:12:32-07:13:55 | two sleeps (17 s, 83 s) while Vite is starting | pmset log |
| 4 | 07:13:55 | Vite prints "ready in 161409 ms" in the second of the wake; 100 of those 161 s were sleep | devserver.log line 232, pmset "DarkWake 10:13:55" |
| 5 | 07:13:57 | the wrapper sees a listener about 165 s into its 180 s wall-clock wait and starts Playwright; the preflight passes, because the right checkout and the right project are being served | e2e-run.sh, wrapper.log "E2E PREFLIGHT OK" |
| 6 | 07:13:58-07:14:40 | 45 s of DarkWake on battery: tests pass, 3 to 6 times slower than green | results.json (home 4.5 s against 1.1 s; auth-setup 26 s against 4 s) |
| 7 | 07:14:40-07:16:11 | third sleep, 91 s; five tests in flight | pmset; unified log empty 10:14:41.892-10:16:11.348; traces: 2 s and 3 s steps lasting 89.5 s |
| 8 | 07:16:11 | on wake every deadline that fell inside the sleep fires: FIVE failures (questions, questions dark, results, results dark, performance) | results.json end times 07:16:10.5-07:16:11.7 |
| 9 | 07:16:11-07:16:56 | 45 s of DarkWake; the network comes back and Chromium aborts in-flight requests with ERR_NETWORK_CHANGED; SvelteKit cannot import its route nodes and renders its error page | traces 84e7def5, 92faa105; error-context snapshots |
| 10 | 07:16:26-07:17:04 | the two walks parked on an error page run out their 30 s stage budget: TWO failures. `voter-detail-drawer` at 07:16:55.7, before the fourth sleep (7 s, 07:16:56-07:17:03); `route announcer` at 07:17:03.7, across it | traces 84e7def5, 92faa105; results.json; pmset |
| 11 | 07:17:04 | AC back, full wake; from 07:17:06 every test has its normal duration | pmset "Using AC"; results.json |
| 12 | 07:17:14 | clamshell DarkWake transition on AC; two browsers lose the Vite socket in the same millisecond and the Vite client reloads both pages | pmset 10:17:14; traces 02a714c4 and df33b2ad at 07:17:14.142 / .143 |
| 13 | 07:17:28 | the reloaded voter journey has every category selected again and meets the deselected one: ONE failure | voterContext.svelte.ts; trace df33b2ad |
| 14 | 07:17:42 | `results-filter-drawer (dark)`, 34 s into one navigation, slept on, then reloaded mid-walk, reaches its 90 s ceiling: ONE failure | trace 02a714c4 |
| 15 | 07:18:42 | 94 dependents never start | summary.json |

## The three failure shapes and what each exceeded

| Shape | Tests | Budget or assumption exceeded | Kind |
|---|---|---|---|
| A — a deadline that expired while the host slept | `questions`, `questions (dark)`, `results` (90 s `TIMEOUTS.testMax`, the global `timeout` of playwright.config.ts); `results (dark)` (`resolveVoterStage` `toPass({ timeout: STAGE_BUDGET })`, 30 s); `performance` (`requireNavigation` `waitForURL`, STAGE_BUDGET 30 s) | none of the budgets is too small: the steps under them had 2 s and 3 s budgets and "took" 89.5 s. The assumption exceeded is that elapsed time is time the suite was running | harness assumption |
| B — the network change that follows a wake | `voter-detail-drawer`, `route announcer` (STAGE_BUDGET 30 s, spent on an error page that will never show a voter stage); `results-filter-drawer (dark)` (90 s ceiling, spent on a 34 s navigation, the 7 s sleep and then the reload of shape C) | the stage walk assumes every page of the flow eventually renders; its message names the stages it did not find and not the error page it did | harness assumption |
| C — a reload the test did not ask for | `voter journey` (`toHaveText` on the category intro, 2 s `TIMEOUTS.element`) | the journey assumes nothing reloads the page but itself. The reload comes from the Vite dev client, so it is dev-server-only. That a reload loses the category selection is the product's documented choice: plain `$state`, re-seeded to every category; answers and `firstQuestionId` are persisted, the selection is not | harness assumption; the product side is a design choice, not a defect established here |

## The previous record, claim by claim

| Claim | Status | From |
|---|---|---|
| dev server ready in 161 409 ms, against 27-31 s in the seven green cold starts | CONFIRMED, and explained: 100 of the 161 s were sleep | devserver.log of every run; pmset log |
| "the slow start came before Playwright launched, so no test caused it" | CONFIRMED | results.json stats.startTime 07:13:58.194Z |
| host load 10.6 / 29.75 / 19.43 at 07:20:00Z | NOT CHECKABLE (it exists only in the executor's note). The run directory records 9.38 / 8.22 / 6.54 at the start, which is normal | env-posture.txt |
| 14 cores | CONFIRMED | env-posture.txt cpu_count=14 |
| swap about 94 % used | NOT CHECKABLE for that moment; consistent with every reading of this session (88.8-95.1 %), green runs included | sysctl during the two diagnosis runs |
| nine failures = performance 1 + a11y-smoke 7 + voter-journey 1; 94 did not run | CONFIRMED | results.json, summary.json |
| 113 of 811 dev-server requests without a response; the rest median 29 ms, p90 177 ms, max 2 750 ms | COUNT CONFIRMED, READING WRONG — see Eliminated | trace b5c61b59 |
| "all issued at 07:14:33.74Z" | WRONG: 60 at 07:14:33.7-34.3Z and 53 at 07:14:37.1-37.5Z | trace b5c61b59 |
| voter-journey console: "server connection lost" at trace time 196198, reconnect at 196734/196735, failing step ends 207639 + 2494 | CONFIRMED to the millisecond; in wall clock 07:17:14.143Z, 07:17:14.678Z and 07:17:28.078Z | trace df33b2ad |
| 2 390 requests in that trace, 1 unanswered (a blob: URL), median 4 ms, max 447 ms | CONFIRMED | trace df33b2ad |
| the dev-server log shows no server restart | CONFIRMED | devserver.log |
| six "Failed to fetch dynamically imported module" and three "The next HMR update…" lines; none in green runs | CONFIRMED; the second line is SvelteKit's client error handler, not Vite's HMR | devserver.log; kit client.js |
| auth-setup 51.8 s against 8.1 s | CONFIRMED (26 180 + 25 619; 4 005 + 4 079) | results.json of both runs |
| the tree differs from the last green tree in five Markdown files | CONFIRMED | git diff --stat cd9a4ad8c 40523cd16 |
| "the dev-server log does not carry the browser's console" | PARTLY WRONG: Vite forwards console.warn, console.error and unhandled rejections; it does not forward console.log, which is the level of the socket-loss line | devserver.log |
| "the traces were overwritten by the rerun" | WRONG: tests/playwright-results was; the HTML report in the run directory holds all eight traces, two videos and nine error-context files | 172-09-final/html/data |
| "what degraded the host is not identified … cannot be recovered now" | SUPERSEDED: the power log names it | pmset -g log |

## What rests on inference

- **That the socket loss at 07:17:14 was caused by the power transition.** Observed: two browsers of two workers lost it in the same millisecond, the dev server did not restart, and the OS logs a clamshell DarkWake in that second. The step from simultaneity to cause is inference, and a strong one. `net::ERR_NETWORK_CHANGED` itself is observed directly, 40 to 60 s earlier, in two other traces.
- **Why work ran 3 to 6 times slower inside the DarkWake windows.** Measured from results.json; the reason (a power-limited CPU in DarkWake on battery, the network coming and going) was not measured. The chain does not need it: the failures come from deadlines that straddle a sleep and from the network change.
- **The `performance` failure.** That project records no trace. Its classification rests on its message (a 30 s budget) and its end time, 07:16:10.485Z, within a second of the wake.
- **The load average of 29.75 read after the run.** Not checkable. A burst of runnable threads after each wake would produce it; that is a reading, not a measurement.
- **What dropped the link.** The log shows the power source change, a clamshell sleep and two wakes with the reason `USB-C_plug`. It is consistent with the laptop being unplugged with its lid closed and docked again six minutes later; who or what did it is not in any log.
- **The production-build side of shape C.** That a voter who reloads mid-questionnaire gets every category back follows from the source; it was observed only under the dev server.
- **No re-induction.** The cause is established from the incident's own records. Reproducing the trigger means putting the host to sleep, which would suspend every other session on it. On a machine with nothing else running: start a run, `pmset sleepnow`, wake after 90 s.

## Options

Ordered by how directly each addresses the cause. None is applied.

1. **Detect a suspended host and void the run by name.** A heartbeat in `tests/scripts/e2e-run.sh`: a background loop that writes the wall clock every 2 s and flags any gap far above 2 s. A sleeping host stops the loop too, so the gap is the measurement; it needs no macOS API and also catches a paused VM and a stopped process tree. On a gap the wrapper ends the run at once with its own exit status and one line ("the host did not run for 91 s from 07:14:40Z — this run is void"), in the manner of the served-application preflight.
   - Guarantees: a run that overlapped a suspend can never again be read as a red tree, and stops within seconds instead of running out 94 dependents.
   - Does not guarantee: that a run passes; a slow but awake host is not detected (the experiment says it does not need to be).
   - Needs a ruling: whether "void, with a logged host suspend" is a category the cardinal E2E rule admits. It is bound to a positive observation, which is what separates it from a flaky exemption.
   - Testable without sleeping the host: `kill -STOP` then `kill -CONT` on the wrapper's process group.
2. **Record the power state as evidence.** In `env-posture.txt`: power source at start and at end (`pmset -g ps`), and the Sleep / Wake / DarkWake lines of `pmset -g log` between `started` and `ended` (macOS; absent elsewhere).
   - Guarantees: the next occurrence is attributable from the run directory in one read. Costs a few lines.
   - Does not guarantee: anything at run time. It is the fallback if option 1 is not wanted, and a useful companion if it is.
3. **Keep the trigger away from a gate run.** Operating practice: not undocking or closing the lid during a closing run; or `sudo pmset -a disablesleep 1` for the session.
   - Guarantees: nothing from the harness. An unprivileged wrapper cannot prevent this: `caffeinate` and the Claude app were both holding idle-sleep assertions and the machine slept anyway, and `caffeinate -s` holds only on AC power.
   - A start-time refusal on battery power would NOT have caught this run: AC was lost ten seconds after the wrapper started.
4. **Name the error page in the stage walk's failure.** `resolveVoterStage` could report "the application is showing its error page" when it is, instead of the stages it did not find.
   - Guarantees: a more legible shape B. Does not prevent anything.
5. **Switch the Vite socket off for E2E runs** (`server.hmr: false` behind the wrapper's environment).
   - Guarantees: no unrequested reload on a socket loss, so shape C cannot occur.
   - Does not guarantee: anything about shapes A and B, eight of the nine failures. It also makes the served application differ from `yarn dev` in one more way.
6. **Persist the voter's category selection across a reload.** A product decision, not a fix for this incident: the source says a persisted store behind `bind:group` dropped writes, so it needs a different binding.
   - Guarantees: a voter who reloads mid-questionnaire keeps the selection; shape C disappears as a side effect.
   - Worth its own todo on product grounds; it is not established here as a defect.
7. **Run the suite against a production build.** Removes the Vite client (shape C) and the on-demand module fetches a network change can abort (most of shape B).
   - Does not guarantee: anything about shape A, the five deadline failures. The preflight is built on Vite's `/@fs` endpoint and would have to be redesigned. Large, and aimed beside the cause.
8. **Not recommended: a time-to-ready threshold, a load-average abort, a warm-up pass, larger budgets.** They are aimed at a slow host, and the loaded run shows a slow host does not break the suite: 180 of 180 with the dev server ready in 80 s and a 1-minute load of 85. A load threshold would have aborted that green run and would not have fired at the start of the red one (9.38). A time-to-ready threshold would have fired on the red run only because sleep inflated the figure; the sleep that did the damage began 45 s after "ready". No budget survives a 91 s sleep, and a larger one hides a real stall.

## For the record of Phase 172

- The todo `.planning/todos/pending/2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md` and `172-09-SUMMARY.md` § _The Red First Attempt_ both state that the cause is not identified and that the traces are gone, and the todo's title names a slow dev-server start. All three are superseded by this file. They were not edited in this session; amending the premise there, and not only appending to it, keeps it from travelling into a later phase.
- Runs added by this session, both kept: `tests/e2e-runs/172/172-diag-load-1` and `tests/e2e-runs/172/172-diag-control-1`, each 180 of 180 on a tree with no difference outside `.planning` from `40523cd16`.
- Departure from the brief: the cold start was recreated with `TURBO_FORCE=true yarn build` (the gate's row 08 alone), not with `yarn dev:clean`. `yarn dev` already runs `dev:clean` on every start; what makes a post-gate start cost 27-31 s is the Paraglide recompile after a production build. It writes ignored build output only, and resets no database.

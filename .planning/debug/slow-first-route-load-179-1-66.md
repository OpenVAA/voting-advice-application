---
status: decided_recording_added
trigger: "179.1-66-final red: [performance] voter results page renders matches within budget, Test timeout of 90000ms exceeded waiting for voter-results-list, page on Loading…; 24 did not run. Diagnose the intermittent slow first route load as a real defect and fix it at the root."
created: 2026-11-07T11:40:00Z
updated: 2026-11-07T16:30:00Z
goal: find_and_fix
symptoms_prefilled: true
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

bug_class: Mandelbug (environment-triggered latency; the shape is deterministic once the host is degraded)
hypothesis: CLASS CONFIRMED from the record, SOURCE UNCONFIRMED. 66-final's red is a host-wide slowdown in the run's first ~2.5 minutes that came from outside the repository's workflow; every test ran slower (median 1.91x, 35 tests finished in 150 s against 110-142), and the performance test, whose fixture walk plus two reloads is ~19-26 s on a normal host, ran past its 90 s test timeout. No defect of the tree, the spec, the dev server or the watcher was found.
test: done — differential over 17 full runs, plan 66's sequence repeated (c1-after-gates-r2, 695/695), and targeted stressor runs t1-t9
expecting: n/a
next_action: done for this session. The operator chose options 1 + 2: e2e-run.sh now records host-state.log in every run; the orchestrator makes 179.1-66-final-r2 on a quiet host

reasoning_checkpoint:
  hypothesis: "An external workload on the shared host degraded it for the first ~2.5 minutes of 66-final; the suite, which alone keeps the 14 cores ~95 % busy in its cold phase, stretched ~3-4x, and the longest early test exceeded its 90 s timeout."
  confirming_evidence:
    - "Every test of 66-final's first 150 s was slower, database-only ones too: data-setup-base 3.7x, a storage delete 16x, auth-setup 2.6-2.8x, a11y results scans 2.4-3.6x; only 35 tests finished there against 110-142 in green runs"
    - "Heartbeat lateness mean 103 ms / max 682 in the first 150 s and 27 afterwards; green runs 27-57 / 85-385 and 16-18"
    - "Plan 66's own sequence repeated (c1-after-gates-r2: the same gate rows, the same production drive, prune, then the full run): 695/695, median ratio 0.97, heartbeat 43/162; its 5-minute load at the start was 23 against 66-final's 86"
    - "Same signature in 179.1-33-close and 179.1-09-held (median 1.41 and 1.46 in the first 150 s)"
  falsification_test: "A full run on a quiet host, the tree unchanged, that shows the 66-final shape (median first-150 s ratio >= 1.4 with the heartbeat at green levels); or a red of this class while a host sampler shows nothing outside the suite running"
  fix_rationale: "No code defect exists to fix: Vite never used more than 0.8 core, the dev server log has no reload, HMR or dependency re-optimisation, and the tree is 695/695 under the same sequence. A fix can only change how the suite meets a degraded host (record it, refuse to start on it, void on it, or carry more headroom) — each a harness or policy trade-off, so it is the operator's decision"
  blind_spots: "The source of 66-final's extra load was not reproduced: no stressor tried here (42 same-priority busy loops, 28 loops above the suite's priority, a 6 GiB memory hog) stretched the early tests by more than ~2.1x. The simulator boot was not re-induced (it would act on the operator's own simulator). No host sampling existed at the time of 66-final, so its load cannot be attributed after the fact"
  candidate_causes:
    - "environment: a GUI workload at higher priority than the suite — the iOS Simulator (iPad Pro 13-inch M5 16GB) booted 12:56:52 local, 4 min before the run, new since the last green — UNCONFIRMED, the leading candidate"
    - "environment: memory pressure (swap 13.6-16.9 GB in use of 14-18 GB, ~170 MB free) — insufficient alone at 6 GiB (t6), UNCONFIRMED in combination"
    - "environment: CPU oversubscription at the suite's priority — ELIMINATED as sufficient (t3-t5)"
    - "environment: thermal throttling — ELIMINATED (pressure level 0 at 13:02:10 local)"
    - "config: turbo watch churn — ELIMINATED as the differentiator (300 rescans, normal)"
    - "code: the results route, the spec, the dev server — ELIMINATED (c1-after-gates-r2 green on the same sequence; Vite <= 0.8 core; no reload in the log)"
  and_gate: "Yes, in the weak sense: the red needs a degraded host AND the suite's lack of headroom (6 workers at ~95 % of the cores in the cold phase, and a 90 s timeout around a walk plus two reloads). Neither the tree nor the harness alone produces it"

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: the full default suite is green; the performance budget's results reload renders the list in well under its 20 s ceiling
actual: tests/e2e-runs/179.1-e2e/179.1-66-final (head 3a57893fb): 670 passed, 1 failed, 24 did not run; the performance test timed out at 90 s on the measured reload, page on "Loading…"
errors: "Error: locator.waitFor: Test timeout of 90000ms exceeded. waiting for getByTestId('voter-results-list') to be visible" (performance-budget.spec.ts:118)
reproduction: intermittent; full runs early in their first 2-3 minutes; earlier instances in .planning/todos/pending/2026-11-01-e2e-intermittent-slow-first-route-load.md
started: intermittent since phase 176; this instance after plan 66's gate set and production drive

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: host sleep (knowledge-base / 172 session pattern)
  evidence: no Sleep/Wake/DarkWake entry in the window (power.txt); heartbeat max lateness 682 ms, below the 3 s void threshold
  timestamp: 2026-11-07T11:40:00Z

- hypothesis: the dev server's (Vite's) single thread saturates in the cold phase and is the bottleneck
  evidence: t1-base: the Vite process used at most 0.8 core in any 5 s bucket of the results phase; the browsers used 4-6 cores
  timestamp: 2026-11-07T15:10:00Z

- hypothesis: CPU oversubscription at the suite's own priority is sufficient for the 66-final shape
  evidence: dose-response t2-t5: 42 busy loops (3x cores) give perf 51.9 s and heartbeat mean 25 ms, against 66-final's >90 s and 103 ms
  timestamp: 2026-11-07T15:10:00Z

- hypothesis: thermal throttling
  evidence: unified log reports thermal pressure level 0 at 13:02:10 local, inside 66-final's slow window
  timestamp: 2026-11-07T15:10:00Z

- hypothesis: turbo watch churn caused 66-final's slowdown
  evidence: 66-final logged 300 rescan lines and 200 package cleans, inside the greens' 110-400 range; 09-held and 47-close logged ~5500 rescans, so the watcher's churn follows the host's state rather than leading it
  timestamp: 2026-11-07T15:10:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-11-07T11:40:00Z
  checked: results.json of 179.1-66-final against 179.1-65-close, -65-green, -64-close-r2 (same projects)
  found: every test in the first ~2 min was slower, the results-route ones most: a11y results scans 57-85 s against 20-24 s (2.4-3.6x), performance 90.5 s (timeout) against 18-26 s, data-setup-base 4.3 s against 1.0-1.2 s (3.7x, API and database only), auth-setup 2.6-2.8x. Tests after ~130 s were 1.1-1.6x.
  implication: the slowness was global (database-only work too), not a stall of one page; the results-route tests are the ones closest to their 90 s timeout under it

- timestamp: 2026-11-07T11:40:00Z
  checked: heartbeat.log, first 150 s and rest, across 14 runs
  found: 66-final mean lateness 103 ms (max 682) in the first 150 s and 27 ms afterwards; green runs 27-57 ms (max 85-385) and 16-18 ms. Before the dev server started (0-18 s) 66-final beat at 11-37 ms, like the greens.
  implication: contention rose with the suite's start and stayed above the greens' level for the whole run; the host was not busy before the dev server and Playwright started

- timestamp: 2026-11-07T11:40:00Z
  checked: devserver.log startup of 66-final against greens
  found: 66-final alone shows "[paraglide-js] Compilation complete" (greens: "Compilation skipped — inputs unchanged") and "VITE ready in 4018 ms" (greens 0.9-1.5 s); load_at_start 47.96/85.60/47.20 (greens 4-8); the gate set (TURBO_FORCE build, unit, check) ended 10:59:21Z and the production drive 11:00:19Z, the run started 11:00:48Z
  implication: the run started straight after heavy work; the decaying 5-minute average shows it, the heartbeat shows the host idle at the start itself

- timestamp: 2026-11-07T11:40:00Z
  checked: host processes now
  found: an iOS Simulator booted at 12:56:52 local (10:56:52Z), between the green 179.1-65-close (10:22Z) and 66-final; a Skimle dev stack (turbo dev, three next dev servers) running since 09:29Z, through the green 65-close too
  implication: the simulator is new between the last green and the red; UNCONFIRMED as a contributor

- timestamp: 2026-11-07T11:55:00Z
  checked: targeted run tests/e2e-runs/179.1-debug/t1-base (fresh dev server with the watcher, --project=performance --project=a11y-smoke, 6 workers; 2 perl busy loops ran by mistake, BSD seq 1 0 counts down), 1 s process sampler
  found: 19/19 passed; performance 31.3 s, timeToMatches 1766 ms; a11y results scans 23-25 s. CPU during the results phase (10-45 s): headless Chromium 4.3 cores, this checkout's Vite process at most 0.8 core in any 5 s bucket, the Docker VM 0.8-1.2, Playwright workers ~1; 10-12 of 14 cores in use. turbo watch 1-3 cores in bursts after the tests (45-60 s).
  implication: the Vite process is not the saturated resource in the cold results phase; the browsers are the largest consumer. H1's "Vite main thread saturated" part is not supported by this run.

- timestamp: 2026-11-07T14:50:00Z
  checked: tests/e2e-runs/179.1-debug/c1-after-gates — plan 66's gate rows (179.1-gates.sh, tests/e2e-runs/179.1-gates/c1-after-gates-gates, all 0), 60 s gap, then e2e-run.sh full run, top sampler throughout
  found: the E2E run is VOID (exit 8, VOID-host-suspend.txt: gap 1681 s from 11:50:14Z; the operator's laptop slept). Not diagnosed. As a host measurement only, its first ~4 min before the gap: load_at_start 15.3; paraglide "Compilation complete" and Vite ready 2.6 s, as in 66-final; early test durations at 0.9-1.2x of 179.1-65-close (performance 19.0 s, a11y results scans 21-24 s). The sampler showed the host 13.3-13.7 of 14 cores busy from 40 s to 80 s into the run, and during the gates up to ~20 mdworker_shared + mds + corespotlightd (Spotlight indexing what the gates wrote) and swap-ins with 139 MB of memory free.
  implication: the gates' aftermath (paraglide recompile, Spotlight, the decaying load) did not by itself reproduce the slowdown; the coordinator asked for the run to be repeated as c1-after-gates-r2. Separately: the suite alone keeps this 14-core host ~95 % busy in its cold phase, so it has no headroom for any other workload.

- timestamp: 2026-11-07T14:50:00Z
  checked: host memory now (sysctl vm.swapusage, vm_stat, ps rss) and swapfile birth times in /System/Volumes/VM
  found: 36 GiB host; swap 13.7-16.9 GB in use of 15-18 GB; ~170 MB free pages; swapfiles created today at 11:30 and 11:57 local (the Skimle dev stack's start), none in 66-final's window; no kernel memorystatus or pressure entry in the unified log for 12:55-13:05 local
  implication: memory is near-exhausted on this host independent of the suite; no record shows a change of memory pressure in 66-final's window, so memory stays a candidate, UNCONFIRMED

- timestamp: 2026-11-07T15:10:00Z
  checked: CPU dose-response, targeted perf + a11y-smoke on a fresh dev server (watcher on, 6 workers) with 0/14/28/42 perl busy loops at default priority; runs t2-b0, t3-b14, t4-b28, t5-b42 under tests/e2e-runs/179.1-debug/, each with a 2 s heartbeat like the wrapper's
  found: |
    burners  perf test   a11y results scans   heartbeat mean/max
    0        24.6 s      19.3-22.0 s          27/74 ms
    14       37.2 s      20.6-28.1 s          30/77 ms
    28       43.9 s      20.5-32.7 s          24/40 ms
    42       51.9 s      20.6-36.8 s          25/36 ms
    All 19/19 green in every run. 42 busy loops (3x the core count) stretch the perf test 2.1x and the scans up to 1.7x, and do not move the heartbeat.
  implication: CPU competition at the suite's own priority is not sufficient for 66-final's signature (perf >= 3.7x, scans 2.4-3.6x, data-setup-base 3.7x, heartbeat mean 103 ms / max 682 ms). The extra load in 66-final was of another kind: something that delays a sleeping shell's wake-up by hundreds of milliseconds (paging, I/O, or work at a higher QoS than the suite's), UNCONFIRMED which

- timestamp: 2026-11-07T15:10:00Z
  checked: median duration ratio against 179.1-65-close by phase of the run, 17 full runs (scratchpad ratio.js)
  found: greens 0.94-1.10 in every phase. 66-final 1.91 in 0-150 s with only 35 tests finished there (greens 110-142), then 1.13 and 1.06. 179.1-33-close 1.41 (n 63) and 179.1-09-held 1.46 (n 59) in 0-150 s, the same shape. 179.1-39-green 0.95 (n 115): its red (a client module never answered) is NOT this shape. 179.1-47-close 1.05 then 1.50 and 1.90: a slowdown later in the run.
  implication: 66-final, 33-close and 09-held are one class: a host-wide slowdown in the first minutes, every test slower, throughput a quarter to a half of a green run's. The todo's record mixes this class with at least one other (39-green)

- timestamp: 2026-11-07T15:10:00Z
  checked: unified log, 12:20-13:25 local (thermalmonitord, thermal pressure, launchd JETSAM_REASON)
  found: "current thermal pressure level=0" at 12:56:50 and 13:02:10 (mid-window); JETSAM_REASON_MEMORY_IDLE_EXIT idle-daemon exits in bursts at 12:23-24 (59, 41 — the start of the green 65-close), 12:56-59 (40, 60, 16, 22 — gates and simulator boot), 13:00-02 (8, 16, 24 — 66-final's start)
  implication: thermal throttling ELIMINATED. Idle-exit bursts happen at the start of green runs too, so they do not discriminate; memory pressure is chronic on this host

- timestamp: 2026-11-07T15:25:00Z
  checked: tests/e2e-runs/179.1-debug/c1-after-gates-r2 — plan 66's whole sequence again: the same eleven gate rows (179.1-gates/c1-after-gates-r2-gates, all 0), 25 s, the production drive of the same 22 titles (179.1-prod/c1-after-gates-r2-prod, 22 passed), docker builder prune + VM df, then e2e-run.sh --no-db-reset; top sampler throughout
  found: 695 passed, 0 failed, 0 did not run, wrapper exit 0, no void marker. load_at_start 11.82/23.26/26.11 (66-final: 47.96/85.60/47.20). paraglide recompiled and Vite ready in 3.2 s, as in 66-final. Heartbeat first 150 s mean 43 / max 162 ms, rest 18. Median duration ratio against 179.1-65-close 0.97 (n 129) in 0-150 s, 0.99, 0.98.
  implication: plan 66's own sequence does not reproduce the slowdown (E2E-run-wise this is also a complete green full run of head 99ff6dc8f's tree). The same gate rows and drive gave a 5-minute load of 23 here and 86 before 66-final, so before and during 66-final something outside the repository's workflow added load; the one new workload in that window on record is the iOS Simulator (an iPad Pro 13-inch (M5) (16GB) device) booted at 12:56:52 local, ~4 min before the run. UNCONFIRMED: not reproduced by booting a simulator

- timestamp: 2026-11-07T15:35:00Z
  checked: targeted perf + a11y-smoke under a 6 GiB incompressible, continuously touched memory hog (t6-mem6; hog.py), kern.memorystatus_level down to 35 %
  found: 19/19 green; perf 27.5 s (control t2-b0 24.6 s), a11y results scans 17.8-23.3 s (control 19.3-22.0), heartbeat 30/120 ms, data-setup-base 2.2 s
  implication: memory pressure at this level is NOT sufficient for the 66-final shape

- timestamp: 2026-11-07T15:35:00Z
  checked: scheduling priority (ps PRI) of the suite's shell and of the GUI workloads on the host
  found: the shells the suite runs from, the Docker VM (pid 12170) and the busy loops: 31 (default). Simulator.app 46, the simulator's SpringBoard 55, Google Chrome 55, iTerm2 47, WindowServer 79
  implication: a GUI app's work (the simulator's boot, a browser) runs above the whole suite and its heartbeat, while the busy loops of t3-t5 ran at the suite's own priority and only shared with it. New hypothesis H-PRIO: competing work at a HIGHER priority than the suite gives the 66-final signature (late heartbeat, every test slower)

- timestamp: 2026-11-07T15:50:00Z
  checked: targeted perf + a11y-smoke with the suite (dev server, Playwright, heartbeat) at nice 10 and 0/14/28 busy loops at nice 0, i.e. competing work above the suite's priority (t7-n10-b0, t8-n10-b14, t9-n10-b28)
  found: |
    run          perf     a11y results scans   heartbeat mean/max   data-setup-base
    t7 (0)       20.0 s   17.7-18.5 s          30/211 ms            0.8 s
    t8 (14)      28.8 s   18.6-25.1 s          176/1077 ms          7.1 s
    t9 (28)      43.3 s   19.8-32.1 s          62/226 ms            5.0 s
    All 19/19 green.
  implication: work above the suite's priority reproduces the late heartbeat of 66-final (t8: 176/1077) and a slow database setup, but not its 3-4x stretch of the browser tests; the source of 66-final's extra load is still UNCONFIRMED

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "CLASS CONFIRMED, SOURCE UNCONFIRMED: a host-wide slowdown from outside the repository's workflow in 66-final's first ~2.5 minutes, on a host the suite alone keeps ~95 % busy, stretched every test ~2-4x; the performance test's walk plus two reloads passed its 90 s timeout. Leading candidate for the load: the iOS Simulator booted 4 min before the run."
fix: "no fix of the tree (none was needed). By the operator's ruling (options 1 + 2), tests/scripts/e2e-run.sh records the host's state into host-state.log through every run, so the next occurrence can be attributed; it changes no verdict, exit code or timing"
verification: "c1-after-gates-r2 (plan 66's sequence, unchanged tree): 695/695, wrapper exit 0, no void marker"
files_changed: [tests/scripts/e2e-run.sh, tests/README.md]

- timestamp: 2026-11-07T16:30:00Z
  checked: the operator's ruling (options 1 + 2) implemented — e2e-run.sh's host-state recorder; proof runs hs-1-performance and hs-2-void-path under tests/e2e-runs/179.1-debug/
  found: hs-1-performance (--project performance): 3/3 passed, wrapper exit 0, restore ok; host-state.log holds 13 samples from the run's start to the end of teardown (16:18:27Z to 16:19:28.7Z, ended 16:19:29Z); heartbeat max 33 ms. hs-2-void-path: the heartbeat held with SIGSTOP for 5 s once Playwright ran; wrapper exit 8 with VOID-host-suspend.txt, restore ok, the recorder's last sample at 16:21:07.2Z against ended 16:21:08Z, no recorder left afterwards. One sample costs ~60 ms of wall time, at the suite's own priority.
  implication: the recorder runs and stops on the green and the void paths and changes no status

- timestamp: 2026-11-07T16:52:00Z
  checked: 179.1-66-final-r2, made by plan 66's executor through 179.1-e2e.sh on head a3fa09eb4, after the gate set 179.1-66-gates-r2 (PASS) and a three-minute pause; no iOS Simulator booted; 1-minute load 5.3 at the start
  found: 695/695, wrapper exit 0, no void marker, no Sleep entry, restore ok; host-state.log holds 212 samples, 1-minute load peaking at 20.8; heartbeat max 173 ms; 153 tests finished in the first 150 s; the performance test 18.0 s
  implication: green on a quiet host, as c1-after-gates-r2 was; the source of 66-final's load stays UNCONFIRMED

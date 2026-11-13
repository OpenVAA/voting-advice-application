---
created: 2026-10-06T07:45:00.000Z
title: A full-suite E2E run went red on a dev server that took 161 s to start, and passed 180 of 180 on the same commit 15 minutes later
area: E2E / harness
severity: major
source: Phase 172 (plan 172-09, Task 3, the closing gate; run directories tests/e2e-runs/172/172-09-final and 172-09-final-r2)
files:
  - tests/scripts/e2e-run.sh
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/tests/specs/perf/performance-budget.spec.ts
  - apps/frontend/vite.config.ts
---

## Superseded diagnosis (2026-10-06, debug session)

**Root cause confirmed: the host was asleep, not slow.** `.planning/debug/172-closing-run-red-on-slow-host.md` shows from `pmset -g log` that the laptop lost external power and display with the lid closed ten seconds after the wrapper started and cycled Sleep / DarkWake four times, asleep 198 s of the 454 s run. Playwright deadlines kept counting through sleep, Chromium aborted requests on the network change after each wake, and the Vite dev client reloaded two pages when its socket closed. A cold-start run under an induced 1-minute load of up to 85 on 14 cores was 180 of 180, so CPU starvation does not reproduce it. The statements below that the cause is unidentified and that the traces were overwritten are wrong: all eight traces survive under `tests/e2e-runs/172/172-09-final/html/data/`.

What remains open is a harness decision, not a defect: whether the E2E wrapper should detect a host suspend (a wall-clock heartbeat) and end the run as void by name, and whether power state should be recorded in the run's posture file. See the debug file's options 1 and 2.

## What happened

On commit `40523cd16`, on 2026-10-06, the full default suite was run twice with no change to the tree in
between:

| Attempt | Started (UTC) | Dev server "ready in" | Result |
|---|---|---|---|
| `tests/e2e-runs/172/172-09-final` | 07:11:08 | **161 409 ms** | **77 passed, 9 failed, 94 did not run** |
| `tests/e2e-runs/172/172-09-final-r2` | 07:26:13 | 1 088 ms (warm Vite cache) | 180 passed of 180, no retry |

The seven earlier full runs of the phase, each a cold start after a gate run, were ready in 27.3 to 31.0 s.
The tree of the red run differs from the tree of the last green run before it (`172-08-axe`, `cd9a4ad8c`,
180 of 180) in five Markdown files under `.claude/skills/database` and `apps/docs`, which neither the
frontend dev server nor Playwright reads.

**The cause of the slow start is not identified.** This is the open part of the item. What is known:

- The dev server was slow before Playwright started, so no test and no load of the suite's own caused it.
- 78 s after the red run ended the host's load averages were 10.6 / 29.75 / 19.43 (1 / 5 / 15 min) on 14
  cores. During the green rerun, sampled every 15 s, the 1-minute average peaked at 15.7 and the 5-minute
  average at 14.0. The red run executed 86 tests, the green one 180.
- `auth-setup`'s two tests, which passed in both attempts, took 51.8 s in the red one and 8.1 s in the
  green one.
- Swap was 94% used (14.4 of 15.4 GB) at both times, with about 2.5 million pages in the compressor.
- A listing of the files written in the repository during the red run, taken two minutes after it ended,
  showed only what a run writes itself (`.svelte-kit` at server start, the paraglide output,
  `tests/playwright-results`, `.turbo/cookies`). The listing was cut at 40 groups, so it does not rule out
  a single file elsewhere, and it cannot be taken again: the later runs rewrote the same paths.
- No process of the executing agent ran during the run other than status polls and file reads. Other
  agent sessions and applications were active on the host; what they did in that window is not known.

## The nine failures, in three kinds

1. **Voter flows that stalled** (`performance` 1, `a11y-smoke` 7). "The answer walk did not advance …
   30000 ms later", "Test timeout of 90000ms exceeded while setting up `locatedVoterPage` /
   `answeredVoterPage`", "the voter flow reaches one of […]". In the trace of `axe accessibility scan —
   questions`, 113 of 811 dev-server requests have no response, all issued at 07:14:33.74Z; the other 698
   were answered with a median of 29 ms. The dev-server log holds six "Failed to fetch dynamically imported
   module …/.svelte-kit/generated/client/nodes/N.js" lines and three "The next HMR update will cause the
   page to reload"; the green runs hold none. The generated files themselves were written once, at server
   start.
2. **A page reload in the middle of the voter journey** (`voter-journey` 1). The failing step is "skip the
   Opt-A category, and the deselected Opt-B category never appears": the category that had been deselected
   was shown. The trace's console holds `[vite] server connection lost. Polling for restart...` about 11 s
   before the failing assertion, and a reconnect half a second later; Vite's client reloads the page when
   that happens. The dev-server log shows no server restart. During that journey the server was fast
   (2 390 requests, median 4 ms, maximum 447 ms).
3. **94 tests that did not run**, because the projects that depend on the failed ones were skipped.

## What was not established

- Whether the socket loss in (2) also happens in green runs at moments that do no harm. Traces are kept for
  failed tests only, and the dev-server log does not carry the browser's `console.log`.
- Whether a voter who reloads the page in the middle of the questions loses their category selection in a
  production build, where there is no Vite socket. If so, (2) is a product finding and not only a harness
  one.
- Whether the turbo package watcher has a part. It rebuilds all twelve packages 12 to 18 times in every
  run, restoring their `dist` output from cache each time ("cache hit, replaying logs"), after file-watcher
  errors ("file watching backend requires a full rescan": 130 to 180 lines per run). The green runs show
  the same pattern, so it is not sufficient on its own.

## Why it matters

The project's rule is that an intermittently failing test is a defect to be fixed, not a run to be
repeated. Here the run was repeated once, as a measurement of the unchanged tree on a host observed to be
quiet, and both attempts are kept. That makes the red attempt explained in part and not root-caused: the
suite has nothing that tells a run on a degraded host apart from a run on a broken tree, so the first
produces a wall of failures about voter pages and no line naming the cause.

## Directions, none of them decided

1. **A measurement-validity check in `tests/scripts/e2e-run.sh`**, in the spirit of its served-application
   preflight: record the dev server's time to ready and the host's load average in the run directory, and
   abort (or mark the run void) above a threshold, before any spec runs. A 161 s start against a 30 s norm
   would have been caught at 07:13:55Z, before the first failure.
2. **Find out what the Vite socket loss is** and whether the voter journey should survive a reload.
3. **Stop the package watcher rebuilding during an E2E run**, or exclude the run's own output directories
   from what it watches, so that a run does not rewrite `packages/*/dist` under its own dev server.
4. **Reduce the host's standing memory pressure** before a closing gate.

## Evidence kept

- `tests/e2e-runs/172/172-09-final/` (red): `summary.json`, `results.json`, `devserver.log`, `wrapper.log`.
- `tests/e2e-runs/172/172-09-final-r2/` (green).
- `tests/playwright-results/` held the traces of the red attempt until the next run overwrote them. The
  figures above were read from them before that and are kept, with the host samples of the green rerun, in
  `tests/e2e-runs/172/_drivers/172-09-final.red-attempt-diagnosis.txt` (gitignored, like the run
  directories).
- `.planning/phases/172-terms-of-use-per-user-and-project/172-09-SUMMARY.md` § _The Red First Attempt_.

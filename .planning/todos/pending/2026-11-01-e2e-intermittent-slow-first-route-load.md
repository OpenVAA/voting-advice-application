---
created: 2026-11-01T00:00:00.000Z
title: Intermittent slow first route load turns full E2E runs red; fix before the branch ships
area: testing
severity: blocking
source: Phase 179.1 (plans 179.1-33 and 179.1-39; operator ruling of 2026-11-01)
files:
  - tests/tests/setup/shared/registerAndStoreSession.ts
  - tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts
  - tests/scripts/e2e-run.sh
---

## Problem

Full E2E runs intermittently go red because the dev server does not answer a route's first load in time.
Under the project's hard rule this is a real defect, not an accepted flake. The operator allowed one rerun
of plan 179.1-39's control on condition that it is filed here and fixed before the branch ships.

The cause is unconfirmed. Host contention is suspected but not shown: no load was sampled during a failure.

## Record

Each is a red full run with no void marker.

| Run | Failure | Host |
|---|---|---|
| `176-14-precommit` | sign-in helper's wait to leave the login page, at 5 s | load near 30 |
| `179.1-09-held` | same line of the helper; not re-read when this was filed | not re-read |
| `179.1-33-close` | same wait, at 5 s; first `GET /contestant` unanswered; test 14.0 s | battery, load near 37 |
| `179.1-39-green` | same wait, at the raised 10 s; test 19.9 s | AC, load 13 before the run |
| `179.1-39-green` | `contestant-email-sent` not visible in 10 s; client module `nodes/52.js` never answered; test 11.9 s, against 1.9 to 2.6 s | same run |
| `179.1-89-targeted` | `admin-access` "a session ended elsewhere…": `Back settled neither on the home nor on the login form` at 10 s; `/admin/login` document in 59 ms, then 76 client-module requests (incl. `Alert.svelte`, `adminContext.svelte.ts`) never answered from 19:00:21Z while other workers were served; watcher "full rescan" burst about 19:00:30Z. Trace kept at `tests/e2e-runs/179.1-e2e/179.1-89-targeted/kept-trace/trace.zip` | load near 10, about 35 GB swap, another project's Supabase stack up (first record with load sampled during the failure). Operator ruling 2026-11-11: one rerun as `-r2` after that stack was stopped; this todo stays blocking |
| `179.1-81-targeted-r2`, a one-project run (`contestant-entry-phone`) on `1196a5da1` | same wait, at 10 s, in `data-setup-passwordless-session` (`passwordless-session.setup.ts:25`): `POST /en/auth/confirm` answered 303 to `/contestant` in 903 ms, the first `GET /contestant` unanswered, the page still on `/auth/confirm`; 24 tests did not run | AC, load about 36 at the start, peak about 44; another Supabase stack (Skimle's `next-supabase-skimle2`) up throughout |
| `179.1-81-targeted-r3`, the same project on the same head | none: green, 68 of 68; the same setup test passed in 2.9 s | AC, 1-minute load 9.97 at the start, mean 9.4, peak 10.9 over 27 samples every 5 s (`tests/e2e-runs/179.1-e2e/179.1-81-targeted-r3.load.txt`); Skimle's stack stopped by the operator before it |

- **Raising the wait did not cure it.** `dd7450857` raised the sign-in wait to `TIMEOUTS.slowPage`, and that wait
  still timed out in `179.1-39-green`.
- **It does not reproduce on demand.** Five full runs at a held load near 30 were green
  (`.planning/quick/261010-f1-b2-operator-replies/SUMMARY.md`), and `179.1-33-diag-auth` passed alone at the same load.
- **Smaller runs pass.** One-project runs on the same trees were green, so parallel cold starts of many routes may matter.
- **Timing of the start.** The failing test started about 7 s into `179.1-39-green`, against 2.7 s in recent closes.

## Measurements of 2026-11-02

Host load sampled every 5 s, in `tests/e2e-runs/slow-load/quiet-<n>.load.txt`. All on head `98e212aee`.

| Run | Result | Mean / peak 1-minute load | Other work on the host |
|---|---|---|---|
| `quiet-1` | 656 of 656 | peak about 21 | Chrome |
| `quiet-2` | 656 of 656 | peak about 20 | Chrome |
| `quiet-3` | void, stopped at 382 of 656 when Claude Code reaped it for low memory | peak 189 | a Skimle dev stack started during it |
| `quiet-4` | 656 of 656 | mean 25, peak about 83 | Skimle |
| `quiet-5` | 656 of 656 | mean 18, peak about 38 | Skimle |
| `quiet-6` | **red**: 1 failed, 194 did not run | mean 25, peak about 89 | Skimle, its `turbo` at up to about 700% CPU |

`quiet-6` failed in `perm-no-nomination`, "home: with everything answered...", on the poll `the open preview leads with its own icon` at 10 s; test 11.6 s, against 1.1 to 1.5 s in the four green runs. A different line from the record above, the same shape. Trace kept in `tests/e2e-runs/slow-load/quiet-6-failure/`; see the correction below. No run at low load has gone red, and no run on a host free of other work was made: the suite alone reaches a load of about 20.

**A lead, cause UNCONFIRMED.** The wrapper starts the dev server with `yarn _dev:concurrent`, so `turbo watch build` runs through every E2E run. It logs `file watching backend requires a full rescan` and cleans and rebuilds the packages: 15 bursts of about 8 package rebuilds in each green full run checked, each tsup build cleaning its output folder while the dev server serves from it. `quiet-6` and `179.1-09-held`, both red, logged 5540 and 5710 rescan lines, against 110 to 360 in the others.

Times are taken from the nearest `[frontend]` log line, so they are coarse:

- `quiet-6`'s failing test started in the same second as a burst.
- `179.1-39-green`'s second failure had bursts 17 s before and 1 s after its start.
- The three sign-in failures at 9 to 19 s into `179.1-09-held`, `179.1-33-close` and `179.1-39-green` show no burst in the window. So this does not explain every failure as measured, and `176-14-precommit` was not checked.
- Green runs also have these bursts, so a burst alone does not fail a test.

Next check: full runs with the wrapper's `--no-watch`, under the same outside load. E2E has no need of the watcher, since nothing edits a package during a run.

**Correction: `quiet-6` was not this defect.** Its trace shows no slow load: every request finished within about a second of navigation, the slowest in 172 ms, and the page was drawn by 1.25 s. The button stayed enabled with `data-preview="open"` while drawing the lock icon until the test ended. `Icon.svelte`'s `loadSvg` sets `innerHTML` when a dynamic import resolves and has no guard against an older one, so a `locked` import resolving after the newer icon's would leave this state. The end state is read from the trace; the order of the two resolutions is inferred (both modules were served within 1 ms). A product defect of its own, not fixed here, and it should not be counted in the record above.

Plan 179.1-44 fixed that race in `Icon.svelte`, shown by `apps/frontend/src/lib/components/icon/Icon.svelte.test.ts`, and the defect this todo is about stays open and blocking.

**The `--no-watch` comparison was inconclusive.** `nowatch-1` to `-5`: all 656 of 656, no watcher line in any log. But the outside load had gone: mean load 16.5 in the first and 7.4 to 8.3 in the rest, with no `next-server` or `turbo` sampled, against 18.4 to 25.1 in `quiet-4` to `-6`. The fair comparison is with `quiet-1` and `-2` (watcher on, mean 8.1 and 9.4), which were also green. So the watcher is neither implicated nor cleared, and with `quiet-6` removed, none of the ten complete runs reproduced the slow load.

## Observation of 2026-11-02, plan 179.1-47

**A red close, then a green one on the same code, with the operator's rerun between them.** Both ran with the operator's `yarn dev` up on 5173 and Skimle's stack up. Nothing was changed outside `.planning/` between them, and neither was on battery or had a Sleep entry.

| Run | Result | Load (1 minute) | Rescan lines | `perm-organization-editing` voter test |
|---|---|---|---|---|
| `179.1-47-close` | **red**, exit 1: 398 passed, 1 failed, 263 did not run | by hand at moments: 22.5 at one minute, 53 to 56 close to the failure, 65 after. Skimle active, and a vitest run | 5350 | failed at 5 s, test 19.2 s |
| `179.1-47-close-r2` | 662 of 662 | every 5 s: 6.04 at the start, mean 11.9, peak 34.09. Skimle idle | 390 | passed, 7.5 s |

- **A form the record above does not have.** `contestant-questions-intro` was not visible in 5 s, but the server was not slow: the last of 515 requests started at 1.6 s, none went unanswered and the slowest took 470 ms. The client's last `Loading…` frame was at 1.9 s, and its next frame, drawn correctly, at 13.4 s. So the client took between 4 and 12 s to draw a page whose data it had. Read from the trace in `tests/e2e-runs/179.1-e2e/179.1-47-close`.
- **The rerun does not show the cause.** The operator chose it knowing that. Load and rescans moved together between the two runs, and neither was varied alone. `quiet-4` and `quiet-5` were green at peaks near 83 and 38 with Skimle running, so load alone did not fail those.
- **The load was still not sampled at the failing instant.** The red run's samples are by hand, and the 5 s samples exist only for the green run: `tests/e2e-runs/179.1-e2e/179.1-47-close-r2.load.txt`.
- **This todo stays open and blocking.**

## Measurements of 2026-11-07, after `179.1-66-final`

Session: `.planning/debug/slow-first-route-load-179-1-66.md`. Runs under `tests/e2e-runs/179.1-debug/`.

**`179.1-66-final` is a host-wide slowdown, not a slow route.** Its red is the performance budget's results page,
timed out at 90 s on `Loading…`. Every test of its first 150 s was slower, database-only ones too:
`data-setup-base` 3.7x, a storage delete 16x, the a11y results scans 2.4-3.6x, against `179.1-65-close`. Only 35
tests finished in those 150 s, against 110 to 142 in green runs. The heartbeat was late by a mean of 103 ms,
against 27 to 57 ms in greens. CONFIRMED from the record.

**Plan 66's own sequence does not cause it.** `c1-after-gates-r2` repeated it: the same gate rows, the same
production drive, the prune, then the full run. It went 695 of 695, with a median ratio of 0.97 in its first
150 s and a heartbeat of 43 ms. Its 5-minute load at the start was 23, against 86 before `179.1-66-final`.
(`c1-after-gates` is void: the laptop slept.) So the extra load came from outside the repository's workflow.
The one new workload on record is an iOS Simulator booted 4 min before the run. UNCONFIRMED: no simulator was
booted to test it.

**What was ruled out, by targeted runs** (performance + a11y-smoke on a fresh dev server, 6 workers):

- **CPU load at the suite's priority.** 42 busy loops, three per core, stretch the performance test 2.1x
  (51.9 s) and leave the heartbeat at 25 ms.
- **CPU load above the suite's priority.** 28 loops: 43.3 s. 14 loops reproduce the late heartbeat
  (176/1077 ms), but not the stretch.
- **Memory pressure.** A 6 GiB hog, at a memory level of 35 %: 27.5 s.
- **Vite's thread.** It never used more than 0.8 core; the browsers used 4 to 6.
- **Thermal throttling.** Pressure was at level 0 at 13:02:10 local, inside the slow window.
- **`turbo watch`.** 300 rescans, inside the greens' range.

No stressor tried reproduced a 3-4x stretch.

**The record mixes classes.** `179.1-33-close` and `179.1-09-held` have the same shape, with medians of 1.41
and 1.46 in their first 150 s. `179.1-39-green` does not: its median was 0.95, and its red was a client module
that never answered. `179.1-47-close` slowed later in the run.

**Headroom.** The suite alone keeps this 14-core host about 95 % busy in its cold phase, measured in `c1` and
`c1-r2`. The host also carries about 14 GB of swap. Any heavy outside workload therefore lands directly on
the first tests.

**No fix applied.** No defect of the tree, the spec, the dev server or the watcher was found. The remedies
left are harness or policy choices for the operator: record the host's state in every run, refuse to start on a
loaded host, add a void class for a contended host, or run with fewer workers.

**Recording now exists (operator's option 2).** Every `tests/scripts/e2e-run.sh` run writes `host-state.log` into
its run directory. Every 5 s, from before database preparation to the end of teardown, it records the load
averages, the memory available, the swap in use and the ten processes using the most CPU. It decides nothing.

**`179.1-66-final-r2`, the first full run with the recording, is green.** Head `a3fa09eb4`, 695 of 695, wrapper
exit 0, no void marker, no Sleep entry. No iOS Simulator was booted, and the 1-minute load was 5.3 at the start
and peaked at 20.8 across 212 samples. 153 tests finished in the first 150 s, and the performance test took
18.0 s. This is one more green on a quiet host. It neither confirms nor rules out the simulator as the source of
`179.1-66-final`'s load. The todo stays open and blocking.

## What to do

1. Sample the load during full runs, so the next occurrence shows whether contention is present. Plan 179.1-39's rerun
   does this by hand; the wrapper could do it for every run.
2. Measure the time to a route's first answer across a full run, with and without other heavy processes running.
3. Decide from that: warm the routes before the specs start, lower the suite's parallelism during the cold start, or fix
   whatever the measurement shows. Do not raise another wait without a measurement behind it.

The longer wait of `dd7450857` can hide a real slowdown in the first protected page load. Reconsider it once the cause
is known.

## Done when

The cause is measured, a fix is committed, and full runs under held load are green. Until then, every green run on this
branch still carries this risk.

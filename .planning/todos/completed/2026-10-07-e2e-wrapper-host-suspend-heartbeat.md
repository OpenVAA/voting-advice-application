---
created: 2026-10-07T00:00:00.000Z
title: The E2E wrapper detects a host suspend itself and ends the run as void, by name
area: Test infrastructure
severity: major
source: Operator decision C6 (a), .planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md; diagnosis in .planning/debug/172-closing-run-red-on-slow-host.md
scheduled: "A quick task of its own, between two plans of Phase 174, at a moment when no gate set or E2E run is in flight"
files:
  - tests/scripts/e2e-run.sh
  - tests/README.md
resolved: 2026-10-07
---

## Problem

A host that suspends in the middle of an E2E run produces a wall of timeouts and did-not-run tests that reads as a red tree. The laptop slept mid-run five times on 2026-10-06. Each case is caught afterwards from `pmset -g log`, and the run is made again; the phase drivers since Phase 173 record the power state for every run, but every executor has to remember to read it.

## Ruling

C6 (a): a wall-clock heartbeat in `tests/scripts/e2e-run.sh` that ends a suspended run as void, by name. A suspended run is then never read as a red tree, and it stops in seconds instead of running out its dependents.

## Solution, as ruled; the details are the task's to settle

- A background loop in the wrapper that sleeps a short fixed interval and compares the wall-clock time that passed with the interval; a gap well beyond the interval means the process was not scheduled, which is what a suspend looks like from inside.
- On detection: stop Playwright, write a marker in the run directory that names the run void and records the gap, and exit with a status that is distinct from both a pass and a test failure, so that no verdict script can read it as either.
- The threshold has to be measured, not guessed: a loaded host also delays a sleeping loop, and a run under an induced CPU load of 85 on 14 cores was green and must not be ended as void.
- A self-test or a control that shows the heartbeat firing on a simulated gap (for example the loop process stopped with `SIGSTOP` for longer than the threshold) and not firing on a loaded but awake host.
- `tests/README.md` § Run says what a void run is, how it is named, and that it is made again rather than diagnosed.
- The phase drivers' own power record (`power.txt`) stays; this does not replace it.

## Resolution

Closed 2026-10-07 by the quick task `.planning/quick/261007-c6-e2e-wrapper-suspend-heartbeat/` (commits `a3dd90644`, `a0ceabd59`, `9b1a67363`, `674b056db`).

- The wrapper's heartbeat beats every 2 s and ends the run as void on a beat 3 s or more late: marker `VOID-host-suspend.txt` in the run directory, wrapper exit status **8**. Status 8 and the marker always go together.
- The threshold is measured: 87 beats under 14 and 84 busy loops on 14 cores were at most 144 ms late, and the 159 beats of a full green suite at most 126 ms; the shortest sleep of the incident is 7 s.
- Control, without sleeping the laptop: the detector fires when its loop is held with `SIGSTOP` for 6 s and stays silent under load and under a 2 s hold (`tests/scripts/e2e-run.sh --self-test`); a wrapper run in which the heartbeat was held for 6 s ended with exit 8, Playwright stopped and the port free.
- Callers: `determinism-batch.sh` (VOID row, exit 6), `e2e-evidence.mjs` (`void` in `summary.json`), and the three Phase 174 drivers. `power.txt` stays.
- Wider than the todo's wording in one respect: the heartbeat covers database preparation and the dev server's start as well as the suite.

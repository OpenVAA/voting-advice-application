---
created: 2026-10-10T00:00:00.000Z
updated: 2026-10-11T00:00:00.000Z
title: voter-journey went red when the host began an idle sleep mid-run and the Vite client reloaded the page — not load, not a cold server
area: e2e / harness
severity: major
source: quick task 261010-f1-b2-operator-replies (a loaded slice run made outside its five counted runs); diagnosed in .planning/debug/voter-journey-category-intro.md
files:
  - tests/scripts/e2e-run.sh
  - tests/tests/specs/voter/voter-journey.spec.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
---

## Diagnosis (2026-10-11) — this replaces the reading the item was filed with

The file name and the first version of this item say "red under load on a cold server" and "the previous
category's heading still shown". Both are wrong, and the name is kept only so that links to it hold.

- **The heading was not the previous category's.** The step had just skipped Opt-A; the heading it then
  read was Opt-B's, the category the walk had deselected at the questions intro. The Skip click took
  257 ms, the URL changed 13 ms later and the destination DOM was there 54 ms after that. Nothing was
  slow; the walk had arrived on a page that should not have been in it. No longer window would have
  passed.
- **The page had been reloaded eleven seconds earlier.** Trace of `261010-f1-slice-1`: the page console
  logs `[vite] server connection lost. Polling for restart...` at 08:08:15.541Z, the browser fetches the
  document it is already on at 08:08:15.559Z, and a new Vite client connects at 08:08:15.891Z. Vite's dev
  client reloads the page when its socket closes.
- **The reload reset the category selection.** The top bar's progress maximum is 12 before the reload
  (eleven questions, Opt-B deselected) and 13 after it. `voterContext.svelte.ts` keeps the selection as
  plain `$state`, not persisted, and seeds it with every category once they load.
- **The socket closed in the second the host began an idle sleep.** `pmset -g log`, 11:08:15 +0300:
  `caffeinate` PID 50336 `ClientDied` (the last idle-sleep assertion on the host, one of another
  process's rolling four-minute ones), and `Entering DarkWake state due to 'Idle Sleep'`. The display had
  gone off at 11:07:45; the system sleep timer is one minute. The run was not started under
  `caffeinate`. A dark wake keeps the CPU running, so the wrapper's heartbeat saw no gap (73 ms at most)
  and the run is red, not void.
- **Re-tested in isolation.** `tests/e2e-runs/261011-vj-diag/probe-socket-close-1`: the same project on an
  unloaded host on AC power, with one intervention — the page's Vite socket closed by hand on Base-5 —
  fails with the same error, character for character. `probe-control-1`, the same run without the
  intervention, is green.
- **Load has no part that the record shows.** 156 page consoles of six runs under induced load hold no
  socket loss; 3 284 passing page consoles since 2026-10-04 hold none; each of the three dated losses
  falls in the second the OS starts a sleep transition.

It is the second occurrence of shape C of `.planning/debug/172-closing-run-red-on-slow-host.md`
(`172-09-final`, 2026-10-06, a closed lid).

## What was changed

`tests/scripts/e2e-run.sh` holds a sleep assertion itself for the life of the run
(`caffeinate -dimsu -w <its own pid>`, where the command exists) and records it in `env-posture.txt` as
`sleep_assertion`. A run can no longer be put to idle sleep because of how it was launched.

On it: seven loaded slice runs in the red run's shape (`261011-f1-slice-1` to `-7`, 267 of 267 each, no
socket loss in 140 page consoles) and the full suite (`261011-vj-final`, 341 of 341). None of them met a
sleep transition, so they show that load does not fail the journey; a sleep was not re-induced, and the
debug file records that as the one guardrail signal not run.

## What is left, and whose it is

1. **A closed lid.** No assertion prevents the sleep it forces, and when that transition leaves the CPU
   running the heartbeat cannot void the run: it is red, with `pmset -g log` naming the cause. Two of the
   three dated socket losses were of this kind. Whether such a run should be void by a marker of its own
   (a Sleep entry of the power log inside the run window) is a change to the void rule and the operator's
   decision.
2. **The dev client's reload.** Serving the suite without Vite's socket would remove the unrequested
   reload. It would not remove the rest of what a sleep transition does to a browser, and it makes the
   served application differ from `yarn dev` once more. Not done; option 5 of the 172 debug file.
3. **The selection across a reload — a product question.** A voter who reloads in the middle of the
   questions gets every category back, while the answers, the first-question id and the election scope
   survive. Observed under the dev server; for a production build it follows from the source. The source
   says why it is not persisted (`bind:group` through a persisted store dropped writes). Not established
   here as a defect, and not changed.
4. **Unknown:** which end closes the socket (Chromium's documented handling of a suspend is the reading;
   it was not observed), and whether an idle display sleep alone does it.

## Evidence kept

- `tests/e2e-runs/176-e2e/261010-f1-slice-1/` and its `kept-playwright-results/` (the red run).
- `tests/e2e-runs/261011-vj-diag/`: `probe-socket-close.patch`, `probe-socket-close-1/` (red, with its
  trace), `probe-control-1/` (green).
- `.planning/debug/voter-journey-category-intro.md`.

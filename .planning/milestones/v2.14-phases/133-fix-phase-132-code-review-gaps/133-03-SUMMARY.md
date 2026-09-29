---
phase: 133-fix-phase-132-code-review-gaps
plan: 03
subsystem: testing
tags: [playwright, e2e, determinism-gate, verification, no-code-change, forensics]

# Dependency graph
requires:
  - phase: 133-fix-phase-132-code-review-gaps
    provides: "Plan 01 — `voterNavigation.ts` with the `page.goto()` hard-nav fallback removed (WR-01, IN-02)"
  - phase: 133-fix-phase-132-code-review-gaps
    provides: "Plan 02 — `candidate-journey.spec.ts` step 13.5 positive-home URL settle (IN-01)"
provides:
  - "Behavioral proof that removing the hard-nav fallback did NOT reintroduce the elections/constituencies continue-stall flake — 3 consecutive full-suite runs, 129/129 each"
  - "Closure of Plan 01 coverage item D3 (`human_judgment: true`), whose behavioral gate was deliberately deferred to this plan"
  - "Recovered forensic root-cause hypothesis for the prior killed attempt's unexplained failure (previously believed unrecoverable)"
affects: [phase 133 close, v2.14 milestone green-gate posture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Long-running gate execution under a watchdog: run each suite pass with `run_in_background` + tee to a per-run log, then poll with bounded until-loops — a foreground ~11 min run is guaranteed to trip a 600 s no-output watchdog"
    - "Per-run evidence preservation BEFORE the next run overwrites `tests/playwright-report/`: copy `index.html` per run and decode the embedded `playwrightReportBase64` zip to read the authoritative `report.json` stats, rather than trusting only the console tail"

key-files:
  created:
    - .planning/phases/133-fix-phase-132-code-review-gaps/133-03-SUMMARY.md
    - .planning/phases/133-fix-phase-132-code-review-gaps/deferred-items.md
  modified: []

key-decisions:
  - "Kept the run protocol IDENTICAL across all three runs — one `yarn db:reset` before run 1, NO re-reset between runs, one dev server process for all three — so the runs are directly comparable"
  - "Did NOT restart the 3× count after recovering evidence of the prior attempt's failure; instead diagnosed it and located it outside this phase's change surface (restarting a count after an undiagnosed failure is retry-until-green, which the E2E Hard Rule forbids)"
  - "Did NOT fix the recovered `voterIntro.ts` flake — it is outside the Phase 133 change surface and outside `files_modified: []`; logged as DEF-133-01 instead of silently widening a shared timeout bucket mid-gate"
  - "Did NOT reinstate the `page.goto()` hard-nav fallback under any circumstance (would defeat the phase); `grep -c 'page.goto'` on the helper re-verified as 0 after the gate"

requirements-completed: [WR-01, IN-01, IN-02]

coverage:
  - id: D1
    description: "Full E2E suite passes with 0 failed and 0 did-not-run, three consecutive times (the project's 3× determinism convention)"
    requirement: "WR-01"
    verification:
      - kind: e2e
        ref: "yarn test:e2e run 1 — report.json {total:129, expected:129, unexpected:0, flaky:0, skipped:0, ok:true}; exit 0"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e run 2 — report.json {total:129, expected:129, unexpected:0, flaky:0, skipped:0, ok:true}; exit 0"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e run 3 — report.json {total:129, expected:129, unexpected:0, flaky:0, skipped:0, ok:true}; exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Removing the hard-nav fallback did NOT reintroduce the elections/constituencies continue-stall flake — the four perm specs consuming the rewritten `advanceVoterFlow` via `navigateToFirstQuestion` reach the first question through real UI traversal"
    requirement: "WR-01"
    verification:
      - kind: e2e
        ref: "perm-hide-election-tags 1/1, perm-hide-category-tags 1/1, perm-hide-if-missing-answers 1/1, perm-disable-allow-open 3/3 — passing in all three runs (per-project tallies decoded from each run's report.json)"
        status: pass
      - kind: other
        ref: "grep -c 'page.goto' tests/tests/utils/voterNavigation.ts → 0, re-verified after the gate; green was achieved through UI traversal, not a hard-nav shortcut"
        status: pass
    human_judgment: false
  - id: D3
    description: "The candidate-journey positive-home assertion (IN-01) passes end-to-end inside the full suite"
    requirement: "IN-01"
    verification:
      - kind: e2e
        ref: "candidate-journey project 1/1 passing in all three runs"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-02 dead code (uuidCache / resolveSeedUuids / degenerate `/questions?` URL) removal caused no behavioral regression"
    requirement: "IN-02"
    verification:
      - kind: e2e
        ref: "Full suite 129/129 × 3 with the symbols deleted; no consumer surfaced a missing-symbol or navigation failure"
        status: pass
    human_judgment: false

# Metrics
duration: 45min
completed: 2026-07-26
status: complete
---

# Phase 133 Plan 03: Full E2E suite 3× determinism gate Summary

**Three consecutive full-suite runs came back 129/129 with 0 unexpected, 0 flaky and 0 skipped — behavioral proof that removing the `page.goto()` hard-nav fallback did not reintroduce the elections/constituencies continue-stall — and forensic recovery of the prior killed attempt's surviving console logs turned its "unrecoverable" failure into a precisely located, pre-existing flake outside this phase's change surface.**

## Performance

- **Duration:** ~45 min (08:10:42Z → 08:55:58Z)
- **Started:** 2026-07-26T08:10:42Z
- **Completed:** 2026-07-26T08:55:58Z
- **Tasks:** 1 (auto — read-only gate run)
- **Files modified:** 0 source files (plan declares `files_modified: []`; honored exactly)

## The Gate Result

### Verbatim per-run counts

Counts below are decoded from each run's own preserved HTML report — specifically the
`report.json` inside the base64 zip embedded in the `<script id="playwrightReportBase64">`
element — not from the console tail alone.

| Run | total | expected | unexpected | flaky | skipped | ok | exit | wall clock |
|-----|-------|----------|------------|-------|---------|----|------|------------|
| 1   | 129   | 129      | **0**      | **0** | **0**   | `true` | 0 | 11.2 m |
| 2   | 129   | 129      | **0**      | **0** | **0**   | `true` | 0 | 10.9 m |
| 3   | 129   | 129      | **0**      | **0** | **0**   | `true` | 0 | 11.0 m |

`unexpected: 0` covers failures; `total == expected` with `skipped: 0` establishes **0 did-not-run**
— no cascade skip from an upstream data-setup failure occurred in any run. `flaky: 0` confirms no
test needed a retry (locally `retries: 0`, so there is no retry masking available in the first
place). Each run executed 129 tests across 88 projects.

### Watchlist projects — the specs that actually prove the phase

Per-project tallies decoded from each run's `report.json`:

| Project | Purpose | Run 1 | Run 2 | Run 3 |
|---------|---------|-------|-------|-------|
| `perm-hide-election-tags` | consumes rewritten `advanceVoterFlow` via `navigateToFirstQuestion` | 1/1 | 1/1 | 1/1 |
| `perm-hide-category-tags` | ditto | 1/1 | 1/1 | 1/1 |
| `perm-hide-if-missing-answers` | ditto | 1/1 | 1/1 | 1/1 |
| `perm-disable-allow-open` | ditto | 3/3 | 3/3 | 3/3 |
| `candidate-journey` | Plan 02 IN-01 positive-home settle | 1/1 | 1/1 | 1/1 |
| `voter-journey` | full voter walk | 2/2 | 2/2 | 2/2 |
| `perm-2e-asymmetric` | the spec that failed in the prior attempt | 1/1 | 1/1 | 1/1 |

### Gate discipline honored

- No test was skipped, retried-until-green, or annotated as known-flaky.
- No `--retries` flag was passed; `retries: 0` locally, `workers: 6`.
- No code was changed to reach green — `git diff 8bf64c4d8..HEAD -- tests/ apps/ packages/` is empty.
- `grep -c 'page.goto' tests/tests/utils/voterNavigation.ts` → **0**, re-verified after the gate.
  The green suite reflects real UI traversal of the elections/constituencies Continue leg, not a
  hard-nav bypass.

## Environment and Protocol

Stated explicitly so the three runs are known to be comparable.

1. **Preflight:** `yarn db:status` healthy (local Supabase up on :54321); port :5173 confirmed
   FREE; no stray vite/playwright processes; working tree clean apart from the pre-existing
   `supabase/.temp/cli-latest`.
2. **Clean DB:** one `yarn db:reset` before run 1 (exit 0 — migrations + `seed.sql` reapplied,
   storage buckets recreated).
3. **Dev server:** exactly ONE fresh `yarn dev`, started detached, PID 91355, verified serving
   before any spec ran — `curl -sL http://localhost:5173/en/` returned **HTTP 200**, 195 690 bytes
   of rendered HTML, and `lsof -nP -iTCP:5173 -sTCP:LISTEN -t | sort -u` returned exactly one PID.
   There is no Playwright `webServer` for the app (the only `webServer` entry in
   `tests/playwright.config.ts` is the `PLAYWRIGHT_BANK_AUTH`-gated mock OIDC issuer), so the
   running dev server is a hard prerequisite. The same single server served all three runs; its
   single-listener status was re-confirmed between runs.
4. **DB between runs — NO re-reset.** The protocol was deliberately identical across all three:
   a single `db:reset` before run 1 only, then three back-to-back `yarn test:e2e` invocations with
   nothing in between. This is also what the suite is designed for — each `data-setup-*` project
   seeds its own dataset and each `data-teardown-*` clears its own prefix.
5. **Execution shape:** each run was launched in the background with output tee'd to
   `run{1,2,3}.log`, then polled with bounded until-loops. A foreground run is not viable — one
   full suite takes ~11 min and the harness kills any agent producing no output for 600 s. This is
   precisely what killed the previous executor attempt.
6. **Evidence preservation:** immediately after each run — before the next could overwrite
   `tests/playwright-report/` — `index.html` was copied to `run{1,2,3}-report.html` and its
   embedded report zip decoded for the authoritative stats.
7. **Cleanup:** dev server stopped; :5173 confirmed FREE; no stray vite/playwright processes;
   working tree back to only the pre-existing `supabase/.temp/cli-latest` modification.

**Artifacts** (session scratchpad, outside the repo):
`…/scratchpad/e2e-133-03/` — `db-reset.log`, `devserver.log`, `run{1,2,3}.log`,
`run{1,2,3}-report.html`, plus the `extract-stats.mjs` / `projects.mjs` decoders used to read the
embedded `report.json`.

## The Prior Attempt's "Unexplained" Failure — RECOVERED

The re-dispatch brief recorded that a previous executor attempt hit a failing run, restarted the
3× count instead of diagnosing it, and that the failing run's report had been overwritten — making
the cause **unrecoverable**.

**That turned out to be false.** The HTML report was overwritten, but the previous attempt's
console logs survived in the session scratchpad (the session ID is unchanged across the
re-dispatch). Reconstructed tally of the prior attempt:

| Prior attempt | Result |
|---------------|--------|
| attempt 1 · run 1 | 129 passed (11.6 m), exit 0 |
| attempt 1 · run 2 | 129 passed (12.3 m), exit 0 |
| attempt 1 · run 3 | **1 failed / 72 did not run / 56 passed** (3.1 m), exit 1 |
| attempt 2 · run 1 | 129 passed (13.4 m), exit 0 |
| attempt 2 · run 2 | 129 passed (11.4 m), exit 0 |
| attempt 2 · run 3 | killed by the watchdog mid-run at ~70/129 |

The failure was:

```
[perm-2e-asymmetric] › perm-2e-asymmetric.spec.ts:17:3
  › user selects both elections: constituency selector shows active CG-2 picker (CG-1 auto-implied)

TimeoutError: locator.click: Timeout 2000ms exceeded.
  - waiting for getByTestId('voter-intro-start')
    - locator resolved to <a … data-testid="voter-intro-start" href=".../elections" class="btn …">
  - attempting click action
    - waiting for element to be visible, enabled and stable
  at tests/tests/utils/voterIntro.ts:28  →  introStart.click({ timeout: TIMEOUTS.click })
```

**Root-cause hypothesis — treated as UNCONFIRMED.** Visibility was already asserted on the line
above with `TIMEOUTS.slowPage` (10 s) and passed; the click then timed out inside actionability at
*"visible, enabled and stable"* against `TIMEOUTS.click` (2 s). The most likely blocking condition
is therefore the **stability** check — the DaisyUI `.btn` still settling — rather than existence
or visibility. This was **not** re-tested in isolation (it did not reproduce), so per
`feedback_flag_unverified_root_cause` it stays a hypothesis, not a finding.

**It is outside this phase's change surface, provably:**

- `git diff --stat` since the Phase 132 close touches exactly two files —
  `tests/tests/specs/candidate/candidate-journey.spec.ts` and `tests/tests/utils/voterNavigation.ts`.
- `tests/tests/utils/voterIntro.ts` is not one of them.
- `perm-2e-asymmetric.spec.ts` imports **only** from `../../utils/voterIntro`; it never imports
  `voterNavigation`, so the removed hard-nav fallback cannot be implicated.

**Did anything similar recur in this gate?** No. `perm-2e-asymmetric` passed in all three runs, and
no run produced any failure or did-not-run. Across the full observed history of this code state —
6 prior runs + 3 gate runs = 9 full-suite runs — there is exactly **1** failure, all of it that
single `voterIntro.ts` click.

**It was NOT fixed, and that is a deliberate, declared choice.** Under the E2E Hard Rule this is a
real defect that must eventually be ironed out — but it is out of this plan's scope boundary
(pre-existing, unrelated file, `files_modified: []`), and widening a shared timeout bucket mid-gate
would both contaminate the comparison and slow every fail-fast path in the suite. It is recorded as
**DEF-133-01** in `deferred-items.md` with the full call log, the hypothesis, the scope argument,
and recommended follow-up levers.

## Task Commits

No task commit — this is a read-only verification gate that changed no source files (the plan
declares `files_modified: []`). The only commit is the plan-metadata commit carrying this SUMMARY,
`deferred-items.md`, and the state/roadmap updates.

## Files Created/Modified

- `.planning/phases/133-fix-phase-132-code-review-gaps/133-03-SUMMARY.md` — this summary.
- `.planning/phases/133-fix-phase-132-code-review-gaps/deferred-items.md` — DEF-133-01, the
  recovered out-of-scope `voterIntro.ts` flake.
- No source files. `git diff 8bf64c4d8..HEAD -- tests/ apps/ packages/` is empty.

## Decisions Made

- **Protocol held identical across all three runs.** One `db:reset` before run 1, no re-reset
  between runs, one dev server for all three. Varying the protocol mid-sequence would make the
  runs non-comparable and the "3× consecutive" claim meaningless.
- **Did not restart the count after recovering the prior failure.** Restarting a 3× sequence after
  an undiagnosed failure is retry-until-green, which the E2E Hard Rule forbids — and it is exactly
  the pattern the previous attempt fell into. Instead the failure was diagnosed first and shown to
  live outside the change surface; the three runs reported here are a single uninterrupted
  sequence with no discarded runs.
- **Did not pre-emptively fix `voterIntro.ts`.** The observed ~11 % per-run rate made it tempting
  to widen the budget before running the gate, but that would have been unfounded tuning against
  an unconfirmed hypothesis, in a shared helper, outside the plan's declared file set — and it
  would have changed the harness under test. Deferred with full evidence instead.
- **Background execution + bounded polling as the required shape.** Recorded as a pattern because
  the previous attempt died to exactly this: an ~11 min foreground run against a 600 s no-output
  watchdog is guaranteed to be killed.
- **Report stats read from the embedded `report.json`, not the console tail.** The console tail is
  a convenience signal; the decoded stats object is the authoritative one and is what is quoted
  verbatim above.

## Deviations from Plan

None — the plan executed exactly as written, with no code changes, and every acceptance criterion
met as specified.

Two judgment calls are worth recording, neither of which is a code deviation:

1. **Forensic recovery was performed before the gate ran.** Not requested by the plan, but the
   re-dispatch brief flagged an unexplained failure as an unresolved problem, and the E2E Hard Rule
   forbids proceeding past an undiagnosed failure. The surviving logs made diagnosis possible, so
   the honest path was to diagnose before re-running rather than roll the dice again.
2. **DEF-133-01 was logged rather than fixed** (see above) — the executor SCOPE BOUNDARY rule
   directs out-of-scope discoveries to `deferred-items.md` rather than inline fixes.

## Issues Encountered

- **Dev-server health probe returned a false negative.** The first readiness poll used
  `curl -sf http://localhost:5173/en/` and looked for HTTP 200, but that URL 308-redirects to
  `/en`; `-sf` without `-L` reported failure while the server was in fact healthy, so the poll
  loop spun for ~7 min. Resolved by re-probing with `-L` (HTTP 200, 195 690 bytes) and killing the
  stale loop. No effect on the gate — no spec had started.
- **`timeout(1)` is unavailable on this macOS host**, so bounded waits were expressed as
  `until <condition> || [ $i -ge N ]; do sleep 10; i=$((i+1)); done` instead.
- No infrastructure flakes: no imgproxy/storage 502 wedge, no HMR staleness, no port contention.

## Verification Performed

| Check | Result |
|-------|--------|
| `yarn db:status` | healthy — local Supabase up (API :54321, DB :54322) |
| `yarn db:reset` | exit 0 — migrations + `seed.sql` reapplied, storage buckets recreated |
| Port :5173 before start | FREE; no stray vite/playwright processes |
| Dev server serving | HTTP 200, 195 690 bytes rendered HTML, exactly 1 listener PID (91355) |
| `yarn test:e2e` run 1 | exit 0 — 129/129, unexpected 0, flaky 0, skipped 0, `ok: true` |
| `yarn test:e2e` run 2 | exit 0 — 129/129, unexpected 0, flaky 0, skipped 0, `ok: true` |
| `yarn test:e2e` run 3 | exit 0 — 129/129, unexpected 0, flaky 0, skipped 0, `ok: true` |
| Watchlist projects (all 3 runs) | perm-hide-election-tags 1/1, perm-hide-category-tags 1/1, perm-hide-if-missing-answers 1/1, perm-disable-allow-open 3/3, candidate-journey 1/1, voter-journey 2/2, perm-2e-asymmetric 1/1 |
| `grep -c 'page.goto' tests/tests/utils/voterNavigation.ts` | **0** (re-verified post-gate) |
| `git diff 8bf64c4d8..HEAD -- tests/ apps/ packages/` | empty — no code changed to reach green |
| Cleanup | dev server stopped, :5173 FREE, no stray processes, tree clean except pre-existing `supabase/.temp/cli-latest` |

Plan 01's coverage item **D3** (`human_judgment: true`, behavioral proof deferred to this plan) is
hereby **closed**: the loop re-detects and every perm spec reaches the first question without the
bypass, demonstrated three consecutive times.

## Known Stubs

None. This plan produced no code and therefore no stubs, placeholders, or unwired data paths.

## Deferred Issues

| ID | Item | Disposition |
|----|------|-------------|
| DEF-133-01 | Latent intermittent flake at `tests/tests/utils/voterIntro.ts:28` — intro-CTA click times out against the 2 s `TIMEOUTS.click` actionability/stability budget. Observed 1× in 9 full-suite runs; root cause UNCONFIRMED. | Logged in `deferred-items.md`, **not fixed** — pre-existing, outside the Phase 133 change surface, outside `files_modified: []`. Needs a dedicated diagnose-then-fix follow-up per the E2E Hard Rule. |

No `.planning/WINDOWS.md` ledger exists in this project, so the cross-phase defect register append
was a no-op; DEF-133-01 is recorded in the phase directory instead.

## User Setup Required

None — the local dev stack prerequisites (`yarn db:status` healthy, :5173 free) were satisfied and
handled by the gate itself.

## Next Phase Readiness

- **Phase 133 is behaviorally proven and ready to close.** WR-01, IN-01 and IN-02 are all resolved
  and demonstrated end-to-end; the elections/constituencies continue-stall flake did not return
  after removing the fallback.
- **The suite is cardinal-clean at 129/129**, consistent with the v2.13 and Phase 124 gate posture.
- **One carried defect:** DEF-133-01. It does not block Phase 133 close (it is unrelated to this
  phase's changes and the gate ran clean), but it should be triaged before the v2.14 milestone
  close gate, since a ~11 % per-run flake in a shared intro helper is a live risk to any future
  3× determinism run.

## Self-Check: PASSED

- `.planning/phases/133-fix-phase-132-code-review-gaps/133-03-SUMMARY.md` — FOUND
- `.planning/phases/133-fix-phase-132-code-review-gaps/deferred-items.md` — FOUND
- Preserved per-run evidence `run{1,2,3}-report.html` + `run{1,2,3}.log` — FOUND in the session scratchpad
- No source files created, modified, or deleted — confirmed by an empty `git diff` over `tests/ apps/ packages/`
- No untracked files left in the repo; no unintended deletions
- Dev server stopped and port :5173 released

---
*Phase: 133-fix-phase-132-code-review-gaps*
*Completed: 2026-07-26*

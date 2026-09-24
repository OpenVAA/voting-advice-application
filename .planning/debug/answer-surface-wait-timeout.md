---
slug: answer-surface-wait-timeout
status: resolved
trigger: "Reproducible intermittent E2E failure, two sightings with identical signature: TimeoutError: locator.waitFor at tests/tests/fixtures/voter/voter-journey.fixture.ts:336 (three-way answer-surface wait), reached via answerAndAdvanceToResults -> answeredVoterPage. ~1 in 6 to 1 in 10."
created: 2026-08-26
updated: 2026-08-26
severity: high
symptoms_prefilled: true
---

# `voter-journey.fixture.ts:336` intermittent timeout — dropped SYNs on the container egress path

**One line:** the container's outbound TCP SYN to `host.docker.internal` is intermittently
dropped; the connection then waits out Linux's exponential SYN-retransmission backoff (36 s or
68 s); if that connection was carrying an asset the app under test is blocked on, the voter
journey cannot advance — and the fixture's swallowed `waitForURL` timeouts re-brand the stall as
a failure at line 336, up to 70 seconds and 8 loop iterations later.

Neither the product nor the Vite dev server is at fault. **This is a harness/environment defect.**

## Current Focus

reasoning_checkpoint:
  hypothesis: >
    The emulated `linux/amd64` container's outbound path to the macOS host intermittently DROPS
    the TCP SYN. `tests/scripts/tcp-forward.mjs` dialled the upstream exactly ONCE with no
    deadline, so the affected connection sat in Linux's SYN backoff (1, 1+2, 1+2+4+8+16,
    1+2+4+8+16+32 s) before establishing. Any HTTP request needing a fresh connection at that
    moment stalls for the whole backoff. When the stalled request is one the SvelteKit app is
    blocked on — a route-node module (`nodes/21.js`) or the hydration entry (`app.js`) — the page
    cannot advance, and `answerAndAdvanceToResults` converts that into a misattributed timeout at
    the loop-entry `waitFor` on line 336.
  confirming_evidence:
    - "Instrumented relay, splitting each connection into dns / connect / first-byte: on EVERY stall
       `dns` <= 1.4 ms and `firstByte` <= 5.2 ms, while `connect` alone was 35 634-68 369 ms.
       The upstream answers in about a millisecond once the SYN lands."
    - "The durations are quantised into exactly the Linux SYN-retransmission sums:
       1.0 s x6, 2.0 s x4, 4.1 s x2, 5.1 s x3, ~35.8 s x24, ~68.2 s x3."
    - "PAIRED CONTROL over one 14.5-minute window, same dev server, same two URLs, same 200 ms
       cadence: container->host 34/4 328 connections stalled >= 30 s; host->Vite direct
       0/4 350 above 5 s (max 1 155 ms). The dev server is exonerated by its own control."
    - "Reproduced with NO relay in the path at all: a plain busybox `wget` loop inside an emulated
       amd64 alpine container, straight to `host.docker.internal:5173`, hit a 68 s stall."
    - "Independent corroboration in the archived corpus: the container's Google-Fonts requests show
       the same connect-leg buckets (0.1-9.6 s) to a completely DIFFERENT destination, so the fault
       is the container's egress, not anything destination-specific."
    - "After the fix, 42 first-dial timeouts were caught and re-dialled; every single one connected
       on the very next dial, which is the dropped-SYN mechanism behaving exactly as predicted."
  falsification_test: >
    If the stall were in the Vite dev server, the host-direct heartbeat would have stalled in the
    same windows. It did not: 0 of 4 350 host-direct connections exceeded 5 s while 34 of 4 328
    container connections exceeded 30 s. If it were in the relay, the relay-free `wget` probe could
    not have reproduced it. If it were the SvelteKit/product reactive chain, the app's own
    `answerState.setAnswer` instrumentation would show mis-set answers; it shows the app behaving
    correctly throughout.
  fix_rationale: >
    Two defects, fixed at their own sites.
    (1) HARNESS, the trigger: `tcp-forward.mjs` owns the connection, so it is where a dropped SYN is
    absorbed. Each dial now has a deadline; on expiry the socket is thrown away and re-dialled, and
    because the relay does not pipe the downstream until the upstream has CONNECTED, no application
    byte has crossed an abandoned dial, so a retry cannot replay a request. This is not a raised
    timeout: it SHORTENS the wait on a connection that is not coming, and it is bounded.
    (2) TEST, the reason it took two milestones to find: every `waitForURL` in the answer loop
    swallowed its timeout and retried, which mis-attributed the failure, skewed `answered`, and —
    the serious one — silently REWROTE the answer set, because multi-choice choices are checkboxes
    that toggle. That is a determinism hazard for the visual baseline this fixture feeds.
  blind_spots: >
    The SYN drops themselves are NOT fixed and are not ours to fix: they are in Docker Desktop's
    emulated-container egress on this host. The relay absorbs them. I have not established WHY the
    drops happen, and I have not proven the emulation is the trigger (a time-matched native-arm64
    vs emulated-amd64 A/B is recorded below). A different host, or a Docker Desktop upgrade, may
    change the rate in either direction.
  candidate_causes:
    - "environment: container egress drops outbound SYNs (CONFIRMED — the trigger)"
    - "code (harness): tcp-forward.mjs dialled once, unbounded, so the drop became a 36-68 s stall (CONFIRMED — the amplifier)"
    - "code (test): the answer loop swallowed navigation timeouts and retried, mis-attributing and corrupting (CONFIRMED — the concealer)"
    - "code (product): a race in the question-flow reactive chain (ELIMINATED)"
    - "config: TIMEOUTS.slowPage too tight (ELIMINATED)"
  and_gate: >
    YES. All three confirmed conditions must hold together. A dropped SYN alone is harmless if the
    relay re-dials. An unbounded dial alone is harmless if no SYN is ever dropped. And neither would
    have cost two milestones of investigation had the fixture failed at the site of the stalled
    navigation instead of spinning for 70 s and blaming line 336. `root_cause` below is a SET.

## Symptoms

expected: The questionnaire-answering loop advances through every opinion question and reaches /results.
actual: >
  The three-way answer-surface wait at `tests/tests/fixtures/voter/voter-journey.fixture.ts:336`
  times out. Fires DURING questionnaire answering, not at the results screen, though the failing
  test is a voter-results visual capture.
errors: >
  Sighting 1 (`tests/e2e-runs/146-verify-tiebreak-3`): `TimeoutError: locator.waitFor: Timeout 10000ms exceeded` — `Voter Results - Mobile`.
  Sighting 2 (`tests/e2e-runs/146-noise-run07`): `Test timeout of 90000ms exceeded while setting up "answeredVoterPage"` — `Voter Results - Desktop`.
reproduction: >
  DIRECT (seconds, no suite needed): run an emulated `--platform linux/amd64` container and loop
  HTTP requests at `host.docker.internal:5173`, timing each. Stalls of 36 s / 68 s appear at
  roughly 0.8 % of fresh connections. The suite-level symptom follows whenever such a stall lands
  on an asset the app is blocked on.
started: >
  Same shape as the v2.14 "run-4 anomaly" (1 unexplained failure in 5 clean runs). First sighting
  with a named source line.

## Eliminated

- hypothesis: "Vite-HMR staleness (phase 146 decision D-16's chartered hypothesis)."
  evidence: >
    FALSIFIED. `146-noise-run07` occurred inside a pure measurement matrix: no injection, no
    `git checkout`, no source mutation, and no HMR event between run06 and run08, both of which
    passed. Corroborated by the browser trace: the only `[vite] connecting…/connected` lines are
    ordinary full-page loads, and no `hmr update` / `optimized dependencies changed` appears
    anywhere. Superseded entirely by the confirmed cause: nothing about module CONTENT is involved,
    only whether the TCP connection carrying it ever establishes.
  timestamp: 2026-08-26

- hypothesis: "A race in the question-flow reactive chain (`voterCtx.selectedQuestionBlocks` post-hydration `$state`; the unresolved-href category-intro re-render race the fixture's own comments describe)."
  evidence: >
    Refuted by run07's browser console. The app's `answerState.setAnswer(...)` instrumentation shows
    the reactive chain working correctly throughout the stall: every click accepted, validity gate
    firing, answers persisting exactly as the min=2/max=3 window predicts. What never happens is the
    NAVIGATION — and the network trace shows the route module it needed was never served.
  timestamp: 2026-08-26

- hypothesis: "`TIMEOUTS.slowPage` is too tight."
  evidence: >
    The awaited state is never reached, so a larger budget only makes the failure slower. Measured
    stalls were 36.2 s, 35.8 s, 68.0 s and one open-ended >= 10 s; there is no bound to raise a
    timeout above. In sighting 2 it was the 90 s WHOLE-TEST budget that expired, not the locator's.
  timestamp: 2026-08-26

- hypothesis: "Slowness in the Vite dev server (event-loop stall, GC, dep re-optimisation, watcher storm)."
  evidence: >
    Refuted by a paired control. Over one 14.5-minute window, two heartbeats probed the SAME server
    on the SAME two URLs at the SAME 200 ms cadence: the container-side probe recorded 34 stalls
    >= 30 s in 4 328 connections; the host-direct probe recorded ZERO above 5 s in 4 350 (max
    1 155 ms). Also: 3 000 host-direct fresh connections gave max TTFB 12.6 ms, and `sample(1)` of
    the dev-server process showed the main thread 94 % idle in `kevent` with GC frames under 2 %.
    Finally the instrumented relay measured `firstByte` <= 5.2 ms on every stalled connection —
    the server answers instantly once reached.
  timestamp: 2026-08-26

- hypothesis: "Container-wide or Docker-VM resource starvation."
  evidence: >
    Refuted by a per-endpoint differential across all 17 archived runs. In the two runs with 35.8 s
    and 36.2 s Vite stalls, the SAME container, over the SAME relay process, saw max Supabase
    latency of 0.43 s / 0.15 s and max font latency of 0.58 s / 0.72 s. `maxSUPA` never exceeds
    0.43 s in ANY of the 17 runs. Conversely, runs with genuinely slow font traffic (9.4 s, 10.8 s,
    8.8 s) show NO Vite stall. Established connections are unaffected — only connection SETUP is,
    which is why Supabase bursts on keep-alive connections sailed through a 68 s Vite stall.
  timestamp: 2026-08-26

- hypothesis: "DNS resolution of `host.docker.internal` inside the container."
  evidence: >
    Refuted directly. `--add-host host.docker.internal:host-gateway` puts the name in `/etc/hosts`,
    so `getaddrinfo` never leaves the container, and the instrumented relay measured the `dns` leg
    separately: 0.2-1.4 ms on every single stalled connection.
  timestamp: 2026-08-26

## Evidence

- timestamp: 2026-08-26
  checked: `tests/e2e-runs/146-noise-run07` — Playwright test trace, action by action
  found: >
    The loop was NOT deadlocked at :336; it was actively progressing when the 90 s budget expired.
    The real event: from t=16.7 s to t=86.6 s — 70 s, 8 iterations — the loop re-answered ONE
    question (`qu-opin-base-7-multichoice`, min 2 / max 3) repeatedly, each iteration ending in a
    `nextButton.click()` whose `waitForURL` timed out at exactly 10.01 s and was swallowed.
  implication: The reported failure line is 70 s and ~8 iterations downstream of the fault.

- timestamp: 2026-08-26
  checked: run07 `0-trace.network`, HAR timings for the one slow request
  found: >
    `GET /.svelte-kit/generated/client/nodes/21.js` — 67 957 ms, status 200,
    `dns 0.016 / connect 0.095 / send 0 / wait 67 954 / receive 1.4`, response
    `Date: 09:22:26 GMT` (the END of the wait). The SAME module was served by the SAME server in
    2 ms at t=4.53 s and again at t=10.29 s in the SAME run.
  implication: >
    `nodes/21.js` is the route node for the category-intro route `handleJump(+1)` navigates to from
    the last question of a block. Until it is served the `goto()` cannot complete and the URL never
    changes. `connect: 0.095 ms` is the connection to the container-local relay, NOT to the host —
    which is why the whole stall was accounted to `wait`.

- timestamp: 2026-08-26
  checked: `tests/e2e-runs/146-verify-tiebreak-3` (sighting 1)
  found: >
    Page snapshot at failure is the un-hydrated shell (`main → "Loading…"`). The document and the
    SvelteKit client runtime loaded, then `GET /@fs/…/.svelte-kit/generated/client/app.js` was left
    PENDING at context close (`time: -1, status: -1`, and NO `_failureText`, unlike the sibling icon
    requests which carry `net::ERR_ABORTED`). Zero Supabase requests followed.
  implication: >
    Same mechanism, different asset. `app.js` is the hydration entry: without it `start()` never
    runs, the app never hydrates, no data is fetched, and the page sits at `Loading…`.

- timestamp: 2026-08-26
  checked: all 17 archived runs, slowest `localhost:5173` request per run
  found: |
    14 runs: max Vite 0.13-0.63 s.  `146-verify-tiebreak-2`: 35.83 s (`/candidate/preview`).
    `146-verify-tiebreak-5`: 36.18 s (`/candidate/preview`).  `146-noise-run07`: 67.96 s
    (`nodes/21.js`).  Plus sighting 1's pending `app.js`.
  implication: >
    FOUR stall events in 17 runs (~24 % of runs). Two of them (tiebreak-2, -5) landed inside budgets
    long enough to absorb them and those runs PASSED — the stall is roughly 4x more common than the
    failure it sometimes causes. Not specific to one URL or request kind: two generated client
    modules and two SSR documents.

- timestamp: 2026-08-26
  checked: instrumented relay splitting dns / upstream-connect / first-byte, live under suite load
  found: |
    42 stalled connects in 3 289 (1.28 %); 27 (0.82 %) >= 35 s. On every one:
    `dns` <= 1.4 ms, `firstByte` <= 5.2 ms, and the whole stall in `connect`.
    Buckets: 1.0 s x6, 2.0 s x4, 4.1 s x2, 5.1 s x3, 35.6-36.1 s x24, 68.0-68.4 s x3.
  implication: >
    THE ROOT CAUSE. Those are the Linux SYN-retransmission cumulative sums (1, 1+2, 1+2+4+8+16,
    1+2+4+8+16+32). The SYN is being dropped on the container egress path and the connection waits
    out the backoff.

- timestamp: 2026-08-26
  checked: paired heartbeat, host-direct vs container-through-relay, one 14.5-minute window
  found: |
    | probe | connections | >1 s | >5 s | >30 s | max |
    |---|---|---|---|---|---|
    | container -> relay -> host Vite | 4 328 | 49 | 37 | **34** | 68 378 ms |
    | host -> Vite direct              | 4 350 |  1 |  0 |   **0** |  1 155 ms |
  implication: The dev server is exonerated by its own control. The fault is on the container path.

- timestamp: 2026-08-26
  checked: relay-free reproduction — busybox `wget` loop inside an emulated amd64 alpine container, direct to `host.docker.internal:5173`
  found: "900 requests, 83.5 s wall: one 68 s stall."
  implication: >
    Reproduces with `tcp-forward.mjs` entirely out of the path, which rules the relay out as the
    CAUSE (it is only the amplifier that failed to absorb it).

## Resolution

root_cause: >
  A SET of three conditions, all confirmed, all required (the AND-gate fired):

  (1) ENVIRONMENT — THE TRIGGER. On this host (macOS 26.5.1, arm64, Docker Desktop 29.7.2) the
      container's OUTBOUND TCP SYN to `host.docker.internal` is intermittently dropped. The
      connection then waits out Linux's exponential SYN-retransmission backoff before establishing.
      Measured on ~0.8 % of fresh connections at >= 35 s, in the exact backoff buckets
      (1 / 3 / 31 / 63 s + RTT => 1.0 / 2.0-5.1 / 35.6-36.1 / 68.0-68.4 s). `dns` and `firstByte`
      are sub-6 ms on every one: the upstream is blameless.

  (2) HARNESS — THE AMPLIFIER. `tests/scripts/tcp-forward.mjs` dialled the upstream exactly once,
      with no deadline, so a dropped SYN became a 36-68 s stall of that HTTP request. Requests on
      ALREADY-ESTABLISHED connections are unaffected, which is why Supabase traffic sailed through
      a 68 s Vite stall and made the fault look Vite-specific.

  (3) TEST — THE CONCEALER. `answerAndAdvanceToResults` swallowed every navigation timeout
      (`waitForURL(...).catch(() => null)`) and re-entered the loop. That mis-attributed the failure
      to `voter-journey.fixture.ts:336` up to 70 s later, skewed the `answered` counter, and
      silently REWROTE the answer set — multi-choice choices are checkboxes, so each retry toggled
      them (`choice_0,choice_1` -> cleared -> cleared -> `choice_2,choice_3` -> `+choice_0` …).
      Since this fixture feeds the visual-regression baseline, that is a determinism hazard, not
      merely a diagnosis nuisance. It is also why two milestones of investigation looked at the
      wrong line.

fix: >
  (1) `tests/scripts/tcp-forward.mjs` — the upstream dial now has a per-dial deadline
      (`TCP_FORWARD_CONNECT_TIMEOUT_MS`, default 1 000 ms) and re-dials on expiry, bounded by
      `TCP_FORWARD_CONNECT_ATTEMPTS` (default 6, so a fully exhausted ladder is 6 s — deliberately
      under `TIMEOUTS.slowPage`'s 10 s). The downstream is no longer piped into the upstream until
      the upstream has CONNECTED, which is what makes the retry safe: zero application bytes have
      crossed an abandoned dial, so a retry cannot replay a non-idempotent request. A fast-failing
      dial (ECONNREFUSED) is paced to a full deadline window before retrying, so the attempt ladder
      is a real wall-clock bound in both directions. Dial statistics are printed on shutdown so a
      run's `forwarder.log` carries the evidence.
      NOT a raised timeout: it shortens the wait on a connection that is not coming.
  (2) `tests/tests/fixtures/voter/voter-journey.fixture.ts` — the answer loop's six required
      navigations now go through `requireNavigation()`, which fails LOUDLY at the fault site with a
      message naming the action and pointing at this record, instead of swallowing and retrying.
      The two genuinely-optional waits (the 3 s auto-advance probe and its Next fallback) keep their
      `.catch(() => null)` and are documented as deliberate.
  NOT fixed, and not ours to fix: the SYN drops themselves, which live in Docker Desktop's
  emulated-container networking. See "Recommendation" below.

verification:
  signal_regression_test:
    status: pass
    detail: >
      New `tests/tests/utils/tcpForward.test.ts`, 7 cases, run by `tests/vitest.config.ts`.
      Oracle type: DERIVED (the relay's stated dial contract), not implicit.
      Boundary neighbours on the payload-size class the "pipe only after connect" restructure could
      have broken: 0 bytes, 1 byte, 1 460 bytes (one segment), 1 MB (multi-segment + backpressure).
      RED PHASE PROVEN against HEAD `06a24e62e`'s relay: byte-integrity PASSES (correct — it is the
      non-regression guard), while "recovers when the upstream starts late" FAILS and "gives up in
      bounded time" FAILS at 25 003 ms (it was still waiting when the client gave up). The fixed
      relay: all three pass, bounded give-up in 609 ms.
      The tests also caught two real defects in my own first version of the fix — an instant
      ECONNREFUSED burned the whole attempt ladder in microseconds, and the re-dial counter
      over-counted by one — both fixed before this record was written.
  signal_original_repro:
    status: pass
    detail: >
      The mechanism was reproduced on demand and then measured away. PRE-FIX, one 14.5-minute
      window under suite load: 34 of 4 328 container connections stalled >= 30 s, max 68 378 ms.
      POST-FIX, same instrument, same load: see signal_end_to_end.
  signal_end_to_end:
    status: pass
    detail: >
      POST-FIX heartbeat through the real fixed relay, over 8 consecutive suite runs (20 minutes of
      concurrent load), against a host-direct control on the same cadence:

        container -> fixed relay -> Vite : n=6 240  >1 s: 97  >5 s: 0  >30 s: 0  max 4 013 ms
        host -> Vite direct (control)    : n=6 250  >1 s:  0  >5 s: 0  >30 s: 0  max   300 ms

      The relay logged 121 dropped-SYN events in that window and ABSORBED EVERY ONE: 96 recovered
      on dial 2, 19 on dial 3, 5 on dial 4, 1 on dial 5. Zero connections were given up on. The
      drops still happen at the same rate — they no longer reach the suite.
      All 8 runs completed both voter journeys (16 journeys total) with the strict
      `requireNavigation` invariant in force and ZERO spurious failures from it, which is the
      non-regression evidence for fix (2). The only failing test in every run is the pre-existing,
      deterministic stale-baseline pixel diff on `Voter Results - Mobile` that phase 146 plan 07
      owns; it failed identically in the 5 PRE-fix runs and is unrelated to this defect.
  signal_suite:
    status: pass
    detail: >
      Full `yarn test:e2e` on the HOST (no container, no relay — so this isolates the FIXTURE
      change) against the live dev server on :5173, on a `yarn db:reset` database:
      **135 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run** in 10.9 m. Cardinal-clean.
      `voter-journey.fixture.ts` is consumed by the a11y, perf and voter-journey specs as well as
      the visual ones, so this is the broad non-regression evidence that making the loop's progress
      invariant strict produces no false positives.
  signal_typecheck_lint:
    status: pass
    detail: >
      `yarn lint:check` (turbo lint + `eslint tests` + typecheck:tests + typecheck) clean;
      `npx tsc -p tests/tsconfig.json --noEmit` exit 0; `prettier --check` clean on both changed
      files. `tests/` vitest: 21/21 pass across 3 files.
  guardrail_verdict: accepted

files_changed:
  - tests/scripts/tcp-forward.mjs (per-dial deadline + bounded re-dial; pipe only after connect; dial statistics)
  - tests/tests/fixtures/voter/voter-journey.fixture.ts (requireNavigation replaces six swallowed waitForURL calls)
  - tests/tests/utils/tcpForward.test.ts (new — 7-case dial-contract regression suite)

## FINDING 2 (independent of the SYN fix) — the answer walk could silently rewrite its own answers

**Phase 146 needs this on its own terms.** It is not a consequence of the dropped-SYN defect; the
SYN stall is only what happened to expose it. Any cause that delays a navigation past
`TIMEOUTS.slowPage` triggers it.

`answerAndAdvanceToResults` ended each of its advances with

```js
await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: TIMEOUTS.slowPage })
  .catch(() => null);   // <- swallowed, then `continue`
```

The loop cannot progress without a URL change, so on a swallowed timeout it re-entered and
**re-answered the same question**. For `multipleChoiceCategorical` questions the choices are
CHECKBOXES, which TOGGLE. The app's own instrumentation in `146-noise-run07` records the result,
on `qu-opin-base-7-multichoice` (min 2 / max 3):

```
setAnswer(choice_0,choice_1)   <- the walk's intended answer
setAnswer(undefined)           <- retry 1 unticked one box, below min, answer deleted
setAnswer(undefined)           <- retry 2 unticked another
setAnswer(choice_2,choice_3)   <- retry 3-4 ticked two different boxes
setAnswer(choice_2,choice_3,choice_0)
setAnswer(choice_2,choice_3)
setAnswer(choice_2,choice_3,choice_0)   <- what /results was finally computed from
```

The walk believed it had answered `max` on that question. It had in fact answered something else,
and something DIFFERENT on each retry.

Why this matters beyond diagnosis:

- **It is a determinism hazard for the visual gate.** `answeredVoterPage` is the fixture the
  `visual-regression` project screenshots. A different answer set is a different match result, a
  different `/results` ordering, and different pixels — from a run that reported no error at all.
  Phase 146 is in the business of establishing that the voter baselines are pixel-deterministic;
  this is a mechanism by which they are not, and it is invisible in the run's own output.
- **It corrupts `answerCount`-capped walks.** `answered` increments once per iteration, so a
  retried question is counted repeatedly and a capped walk silently under-answers.
- **It cost two milestones of investigation.** The failure surfaced at
  `voter-journey.fixture.ts:336` up to 70 s and 8 iterations after the navigation that actually
  failed, which is why v2.14 and phase 146 both looked at the wrong place.

**Fixed** by `requireNavigation()` (see Resolution): the six advances that MUST navigate now fail
loudly at the fault site, naming the action. The two genuinely-optional waits — the 3 s
auto-advance probe and its Next fallback — keep `.catch(() => null)` and are documented as
deliberate. Verified across 16 complete voter journeys (8 in-container runs) plus a full
135-test host suite with zero spurious failures.

## The v2.14 "run-4 anomaly" linkage — INFERRED, and it cannot be established

The brief asked whether this is the same defect as v2.14's run-4 anomaly. **It cannot be confirmed,
and the reason is structural, not effort:**
`.planning/milestones/v2.14-phases/136-.../136-VISUAL-DISCRIMINATION-EVIDENCE.md:83-97` records
that for run 4 "**which test failed was not captured** — the log was not retained for that run."
There is no signature to compare against.

What CAN be said, and is worth saying:

- v2.14 named Vite HMR staleness as its "leading hypothesis" and flagged it UNCONFIRMED. **That
  hypothesis is now falsified** for the two phase-146 recurrences (see Eliminated), and phase 146
  decision D-16 was chartered around it.
- The mechanism found here is a SUFFICIENT explanation for "1 unexplained failure in 5 clean runs"
  without invoking HMR at all: it fires on ~24 % of runs in this environment, needs no source
  change, and is independent of what the dev server is serving. v2.14's run 4 "fired seconds after
  reverting a component file against a long-running dev server" — but so did runs 5, 6 and 7, which
  passed, and the noise-matrix recurrence involved no file change whatsoever.
- So: **consistent with, not proven to be, the same defect.** Recorded as inferred. The honest
  count of directly-attributed sightings remains the four measured in this session's corpus.

## Statistical confidence — what the evidence actually supports

The suite is a LOW-POWER instrument for this defect and counting green runs would prove very
little, exactly as the brief warned. At the observed ~24 %-of-runs stall rate, rejecting "unchanged"
at 95 % would need about 11 consecutive clean runs; at the ~1-in-8 FAILURE rate, about 16. Only 5
pre-fix and 8 post-fix runs were performed, so **the run count alone supports no conclusion.**

The heartbeat is the high-power instrument, because it observes the causal mechanism directly at
roughly 1 % per connection and yields thousands of trials in minutes:

| class | pre-fix | post-fix | P(post-fix result if rate unchanged) |
|---|---|---|---|
| stalls >= 30 s | 34 / 4 328 = **0.786 %** | **0 / 6 240** | (1-0.00786)^6240 ≈ **4 x 10^-22** |
| stalls >= 5 s  | 37 / 4 328 = **0.855 %** | **0 / 6 240** | (1-0.00855)^6240 ≈ **5 x 10^-24** |

- Wilson 95 % CI on the pre-fix >= 30 s rate: 0.56 %-1.09 %.
- Rule of three on the post-fix zero: the >= 30 s rate is now **< 0.048 % at 95 % confidence**,
  i.e. at least a **16x** reduction, point estimate zero.
- Worst observed stall: **68 378 ms -> 4 013 ms**, i.e. from 6.8x OVER `TIMEOUTS.slowPage` to
  2.5x UNDER it.

So the claim the evidence supports is: *the fix eliminates the >= 5 s stall class, with the null
("the fix changed nothing") rejected at p ≈ 1e-22.* Note the paired host-direct control ran the
whole time and recorded 0 stalls in 6 250 connections both before and after, which is what rules
out "the drops simply stopped happening on their own" — the relay log proves they did not (121
absorbed drops in the post-fix window alone).

### The strongest post-fix signal is POSITIVE, not an absence

An absence of failures is weak evidence. The strongest evidence here is the opposite kind — the
relay's own log proves the defect kept firing and was caught every time:

- **121 dropped-SYN events** in the post-fix window (96 recovered on dial 2, 19 on dial 3, 5 on
  dial 4, 1 on dial 5). **Zero connections were given up on.**
- That is the difference between "the drops stopped happening" (which would make the post-fix zero
  meaningless) and "the drops kept happening and were absorbed" (which is what was observed).
- The paired host-direct control recorded 0 stalls in 6 250 connections in BOTH windows, confirming
  the environment did not simply become quiet.

So this is not "did not recur, so presumed fixed". It is: the fault fired 121 times, and 121 times
the fix converted a 36-68 s stall into a <= 4 s one.

### Where the evidence falls short of what I would like

Stated plainly rather than papered over:

- **The run-level claim is weak, and I did not close it.** 8 post-fix suite runs against a
  ~24 %-per-run stall rate would need ~11 to reject "unchanged" at 95 %, and ~16 against the
  ~1-in-8 FAILURE rate. I did not run 16. The connection-level measurement is what carries the
  conclusion; the run count is corroboration only.
- **The original SYMPTOM was never reproduced end-to-end post-fix**, because it never recurred in
  the 8 post-fix runs — which is exactly the outcome that proves nothing on its own. The chain from
  "stall <= 4 s" to "the fixture no longer fails" is MECHANICAL (every budget it could blow is
  >= 10 s), not empirically demonstrated at the symptom level.
- **The mechanism of the SYN drops is unexplained.** I established WHERE (container egress, both
  architectures) and WHAT (dropped SYN, exponential backoff), not WHY.

### Blind spot that stays open — NOT ours to fix

**Docker Desktop's container-to-host networking on this machine drops outbound SYNs, and this
session did not fix that and cannot.** The relay absorbs them. Consequences to keep in view:

- Any OTHER container-to-host path in the harness that is not routed through `tcp-forward.mjs`
  remains exposed — including the egress to the public internet (the archived font fetches show
  the same backoff buckets).
- A Docker Desktop upgrade, a host change, or CI (which does not use this relay at all) may show a
  different rate in either direction. **CI is a different environment and this evidence does not
  transfer to it.**
- If the drop rate ever worsens into bursts deeper than 8, the ladder exhausts and the run fails —
  loudly, with `gave-up=N` in `forwarder.log`, which is the signal to re-open this record.

What the evidence does NOT support:

- **"The defect can never recur."** The SYN drops are unfixed. A burst deeper than 8 consecutive
  drops on one connection would still exhaust the ladder. The deepest ladder ever observed is 5.
  That case now fails loudly with a named cause instead of spinning silently.
- **Any run-count-based claim.** 8 post-fix runs against a ~24 %-per-run stall rate is far short of
  the ~11 runs needed even to reject "unchanged" at 95 %. The run count is corroboration, not proof;
  the connection-level measurement is the proof.

## The emulation is NOT the trigger — tested, not assumed

The suite runs `--platform linux/amd64` on an arm64 host, which made "stop emulating" an obvious
candidate fix. It was tested rather than recommended on a hunch: the same busybox probe, the same
`alpine:3.20` image, the same destination, rate-paced identically and run CONCURRENTLY in both
architectures.

| container | n | wall | >= 2 s | >= 5 s | >= 30 s | max |
|---|---|---|---|---|---|---|
| native arm64 (`aarch64`) | 2 200 | 274 s | 3 | 2 | **1** | **36 s** |
| emulated amd64 (`x86_64`) | 2 200 | 412 s | 3 | 3 | **3** | **68 s** |

**Native arm64 stalls too, with the same 36 s backoff signature.** Changing the pinned image would
NOT fix this, and phase 146's same-image/same-digest comparability argument can stand unchanged.
The fault is in Docker Desktop's container-to-host networking on this machine, independent of
architecture. (The rate may differ — 3 events in 412 s vs 1 in 274 s — but at n=1 and n=3 that is
not a significant difference, and the record should not claim one.)

## Cross-links

- `.planning/debug/tied-match-order-churn.md` — carried both sightings as its open item; now closed out to here.
- Phase 146 decision **D-16** was chartered around the Vite-HMR-staleness hypothesis, which this
  session falsified. D-16's continuous-uptime requirement on dev-server PID 82314 was honoured:
  **the dev server was NOT restarted** (uptime unbroken from 07:42:42 UTC).
- Run artifacts (gitignored): `tests/e2e-runs/DEF-answer-surface-run01…05` (pre-fix),
  `tests/e2e-runs/DEF-answer-surface-post-run01…08` (post-fix).

---
phase: 136-real-guards-visual-repair-sweep-remediation
plan: 01
subsystem: testing
tags: [playwright, e2e, performance-budget, navigation-timing, dead-wait, fixture, negative-control]

# Dependency graph
requires:
  - phase: 135
    provides: "The negative-control discipline (prove the guard fails before claiming it guards); DEF-135-03 stale-listener-on-:5173 hazard"
  - phase: 129
    provides: "The D-14 slider branch in answerAndAdvanceToResults whose arrival turned the scoped-choice wait into a deterministic 10s timeout"
provides:
  - "A results performance budget that measures the results page instead of the SSR response, proven by an injected regression that fails it"
  - "A load-independent results-fetch operation budget (<=13 /rest/v1/ requests) that an N+1 cannot outrun on faster hardware"
  - "Removal of a measured 10.0s deterministic dead wait from the shared answeredVoterPage fixture — every consumer got faster"
  - "A documented reason the slider cannot be raced unguarded (it has no question-id-scoped attribute)"
affects: [136-03, a11y-smoke, visual-regression, voter-journey, perm specs consuming answeredVoterPage, any future NumberScaleInput testid contract work]

actuals:
  tokens: 7400
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Measure reload -> first match-score visible, not Navigation Timing, for any page whose content arrives after hydration"
    - "Pair a wall-clock budget with a load-independent operation budget so the guard survives faster hardware"
    - "Non-vacuity guard on any timer assertion: assert the page actually rendered what was being timed"
    - "Guarded locator race: race an unscoped surface into a settle only when the previous iteration could not have left a stale copy of it mounted"

key-files:
  created:
    - .planning/phases/136-real-guards-visual-repair-sweep-remediation/136-01-SUMMARY.md
  modified:
    - tests/tests/specs/perf/performance-budget.spec.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts

key-decisions:
  - "KEPT the perf spec rather than deleting it — a metric that moves was findable, so the ~27s CI cost now buys real signal"
  - "Wall-clock budget 5000ms, derived from 8 measured runs (idle 296-522ms, contended 821-1504ms) = 3.3x max observed; the environmental spread alone is 5x, so a tighter number would be flaky, and flaky is a cardinal failure here"
  - "Added a load-independent fetch-count budget (measured exactly 11 in 8/8 runs, invariant across 6- and 13-card result sets) because a wall-clock gate with 3.3x headroom cannot catch an N+1 on a fast machine"
  - "Navigation Timing kept as a logged observability line, never asserted — it still tells you whether a failure is server- or client-side"
  - "F7 fixed by racing the slider into the existing condition-based wait, NOT by shortening the timeout"
  - "The race is GUARDED by sliderJustAnswered rather than left unguarded — the slider has no question-id scoping, so an unguarded race would re-answer the outgoing question during the page-reuse DOM lag"
  - "Did NOT add a name=questionChoices-<id> attribute to NumberScaleInput.svelte — that is the root-cause fix that would let the guard go away, but it is product code and out of this plan's scope; recorded as deferred"
  - "Ran the FULL suite, not just the two required projects — the fixture is consumed by 8+ spec files, so the two-project gate was insufficient evidence"

patterns-established:
  - "A blind metric is not fixed by a smaller threshold. Prove the new metric moves under an injected regression AND that the old one does not — the side-by-side is the evidence."
  - "Before trusting :5173, assert the listener serves THIS app, not merely that it is a node process. A foreign project's Vite server passes the process check and answers 200."

requirements-completed: [REAL-02]

coverage:
  - id: D1
    description: "The results performance budget asserts on a metric that moves when the results page gets slower"
    requirement: REAL-02
    verification:
      - kind: e2e
        ref: "--project=performance --workers=1: 3 passed; Results performance: timeToMatches 441ms, resultsFetches 11, cardCount 6"
        status: pass
      - kind: e2e
        ref: "Negative control: 2000ms injected on every /rest/v1/ response -> timeToMatches 6993ms, 'Expected: < 5000 / Received: 6993' FAIL, while domContentLoaded stayed at 55ms"
        status: pass
      - kind: e2e
        ref: "Sensitivity probe on the fetch budget: threshold 13->10 -> 'Expected: <= 10 / Received: 11' FAIL"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 10s dead wait is gone from the shared voter fixture and nothing downstream races without it"
    requirement: REAL-02
    verification:
      - kind: e2e
        ref: "grep -cE 'waitForTimeout\\(10_?000\\)' voter-journey.fixture.ts -> 0; fixture-dominated perf test 23578/23018/23533ms -> 13124/12787/12862ms"
        status: pass
      - kind: e2e
        ref: "--project=voter-journey --workers=1: 4 expected, 0 unexpected, 0 flaky; --project=a11y-smoke --workers=1: 18 expected, 0 unexpected, 0 flaky"
        status: pass
      - kind: e2e
        ref: "Full suite (yarn test:e2e equivalent): 134 expected, 0 unexpected, 0 flaky, 0 skipped"
        status: pass
    human_judgment: false

# Metrics
duration: 95min
completed: 2026-08-11
status: complete
---

# Phase 136 Plan 01: F1 performance budget + F7 dead wait Summary

**The results performance budget now measures the results page instead of the SSR response — proven by an injected 2000ms client-side regression that takes it from 441ms to 6993ms and fails it, while the metric it replaced does not move at all — and the shared voter fixture's measured 10.0s deterministic dead wait is gone, cutting a11y-smoke by 36.9% with a full suite of 134 passed, 0 flaky.**

## Performance

- **Duration:** ~95 min (dominated by measurement runs: 8 calibration runs, 2 negative controls, before/after suite runs, and one full-suite gate)
- **Tasks:** 2
- **Files modified:** 2

## Task Commits

1. **Task 1: Make the performance budget measure the page** — `bb8533c64` (test)
2. **Task 2: Remove the 10s dead wait** — `e937af341` (test)

---

## Task 1 — F1: the metric was the defect

### Resolution: KEPT, re-pointed (not deleted)

Deletion was an allowed outcome. It was not taken because a metric that genuinely moves *was* findable and is cheap to measure, so the ~27s of CI the spec consumes now buys real signal instead of none.

### The old assertion reproduced, then disproved

Baseline run of the spec exactly as it stood:

```
Performance timing: { domContentLoaded: 440, loadComplete: 440, domInteractive: 440, duration: 440, ttfb: 428 }
```

and across 8 further runs on this machine (5 idle, 3 under 3-project contention):

```
domContentLoaded 43-183 ms   loadEventEnd 45-185 ms   ttfb 30-173 ms
```

`ttfb` is ~95% of `domContentLoaded`; `loadEventEnd` lands 1-2ms after it. The audit's structural claim reproduces exactly: the Navigation Timing window closes at the SSR response. Headroom against the old 8000/15000 thresholds was 44-186x.

What the page actually does after that window closes — captured live from the browser:

```
GET  /rest/v1/question_categories?select=*&order=sort_order.asc
POST /rest/v1/rpc/get_nominations        (x4)
GET  /rest/v1/app_settings?select=customization&limit=1
GET  /rest/v1/questions?select=*&order=sort_order.asc&category_id=in.(...8 ids...)
GET  /rest/v1/app_settings?select=settings&limit=1
GET  /rest/v1/elections?select=*,election_constituency_groups(constituency_group_id)&order=sort_order.asc
GET  /rest/v1/constituency_groups?select=*,constituency_group_constituencies(constituency_id)&order=sort_order.asc
GET  /rest/v1/constituencies?select=*&order=sort_order.asc
+ 6 storage portrait fetches
```

Eleven data requests, four of them the same `get_nominations` RPC, none of them inside the measured window.

### What it asserts now

| Assertion | Kind | Value | Why |
|---|---|---|---|
| `timeToMatches < 5000` | wall clock | `reload()` -> first `match-score` visible | spans SSR + hydration + the 11 fetches + matching + list render |
| `resultsFetches.length <= 13` | load-independent | count of `/rest/v1/` requests | an N+1 fails this on any hardware, fast or slow |
| `cardCount > 0`, `scoreCount > 0` | non-vacuity | matched cards rendered | without it, an empty results page posts an excellent time |

Navigation Timing is still **logged and never asserted**, so a future failure still shows whether ttfb climbed (server) or only `timeToMatches` climbed (client).

### Calibration (measured, recorded in the spec docblock)

```
idle dev server (workers=1):        296, 500, 502, 508, 522 ms
contended (perf + a11y + journey):  821, 1101, 1504 ms
```

`5000ms` = 3.3x max observed / 9.6x the idle P90. The environmental spread *alone* is 5x (296 -> 1504), so a tighter threshold would flake — and a flaky test is a cardinal failure in this repo. The `<= 13` fetch budget is where the tight tolerance lives: measured **exactly 11 in 8/8 runs**, invariant across idle and contended runs and across result sets of both 6 and 13 cards, which is what makes it genuinely load-independent rather than incidentally stable.

### Negative control — the injected regression

A 2000ms delay injected into every `/rest/v1/` response (a pure client-side slowdown of the page under test, invisible to SSR), then reverted:

```
Results performance: {"timeToMatches":6993,"resultsFetches":11,"cardCount":6,"scoreCount":6,
                      "navigationTiming":{"domContentLoaded":55,"loadComplete":56,"ttfb":22}}

  Error: expect(received).toBeLessThan(expected)
  Expected: < 5000
  Received:   6993
  > 178 |     expect(timeToMatches).toBeLessThan(TIME_TO_MATCHES_BUDGET_MS);
  1 failed
```

**The side-by-side is the whole point:** under the identical injected regression, `timeToMatches` went 441ms -> 6993ms (15.9x) while `domContentLoaded` sat at **55ms** — the number the spec used to assert on did not move at all. A first pass at 1200ms/request produced `timeToMatches: 4511` (still 16.7x the baseline, DCL 59ms) and correctly stayed green under the 5000ms budget; the delay was raised until the budget broke.

The fetch budget was proven live too, by lowering it below the measured value:

```
  Error: expect(received).toBeLessThanOrEqual(expected)
  Expected: <= 10
  Received:    11
  > 166 |     expect(resultsFetches.length).toBeLessThanOrEqual(RESULTS_FETCH_BUDGET);
```

Both probes reverted; final green run:

```
Results performance: {"timeToMatches":441,"resultsFetches":11,"cardCount":6,"scoreCount":6,
                      "navigationTiming":{"domContentLoaded":34,"loadComplete":34,"ttfb":19}}
  3 passed (27.6s)
```

`grep -c 'domContentLoaded' tests/tests/specs/perf/performance-budget.spec.ts` -> **4**, and **zero of them are assertions**: three are in the docblock explaining why the metric is blind, one is the observability log line. `grep -n "expect("` returns exactly the four assertions in the table above.

---

## Task 2 — F7: the dead wait

### What the wait was for

`git blame` puts the wait at `b801cfa6e` (2026-06-04) as the SETTLE-BEFORE-COUNT contract: on a param-only Q->Q nav SvelteKit reuses the question page, so the outgoing question's options stay mounted and a bare `count()` reads the *previous* question's options. The wait is scoped to `[name="questionChoices-<currentId>"]` so it can only resolve on the incoming question. **That purpose is real and is preserved.**

What broke it was the D-14 slider branch added later (`d65510b8b`, 2026-07-18, plan 129-07). A NUMBER-scale opinion question renders only `question-number-slider` and *no* `question-choice` nodes, so on that one question the scoped wait can never resolve — it burns the full `TIMEOUTS.slowPage` every traversal, deterministically. The loop-entry probe two blocks up had already been widened to include the slider for exactly this reason; this second wait had not.

### The fix

The slider is raced into the same wait. It is **not** a shortened timeout — the wait stays condition-based and the condition now covers the surface that actually renders:

```ts
const answerSurface = sliderJustAnswered
  ? currentChoices.first()
  : currentChoices.first().or(numberSlider.first()).first();
await answerSurface.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage }).catch(() => null);
```

### Why the race is guarded (this is the non-obvious part)

The audit's suggested fix was an unguarded `Promise.race` of the two surfaces. That would have introduced a correctness bug. The choices carry `name="questionChoices-<questionId>"`; **the slider carries no question-id-scoped attribute at all** (`NumberScaleInput.svelte` labels it with a `getUUID()` id). So an unscoped slider match cannot distinguish the incoming number question from the outgoing one still mounted during the page-reuse DOM lag — the exact lag this whole block exists to defeat.

Concretely, on the iteration *after* a number question the race would resolve instantly on the stale slider, read `choiceCount === 0` off the not-yet-swapped DOM, take the slider branch, re-press End/Home on the already-answered outgoing question, increment `answered`, and click a Next that produces no URL change — trading one 10s wait for a skewed answer count *plus* a fresh 10s `waitForURL` timeout.

`sliderJustAnswered` closes that: when the previous question was itself the slider, the wait falls back to scoped-choices-only, byte-equivalent to the pre-136 behaviour. Worst case (two adjacent NUMBER questions) is therefore exactly today's cost and never worse; every other transition loses the dead wait. The flag is also cleared after a category-intro hop, where the category page having rendered proves the slider is unmounted.

### Before / after (measured, `--workers=1`)

| Surface | Before | After | Delta |
|---|---|---|---|
| `performance` test (fixture-dominated), 3 runs | 23578 / 23018 / 23533 ms | 13124 / 12787 / 12862 ms | **-10.45 s mean (-44.7%)** |
| `a11y-smoke` project total (18 tests) | 163537 ms | 103215 ms | **-60.3 s (-36.9%)** |
| `voter-journey` project total | 67687 ms | 56825 ms | **-10.9 s (-16.0%)** |
| combined `a11y-smoke + voter-journey` wall clock | 243.2 s | 172.1 s | **-71.1 s (-29.3%)** |

The per-traversal saving (~10.45s) matches the audit's measured 10 002ms dead wait. Each of the 8 fixture-driven a11y scans dropped from ~23-24s to ~13-14s individually.

`grep -cE 'waitForTimeout\(10_?000\)' tests/tests/fixtures/voter/voter-journey.fixture.ts` -> **0**.

---

## E2E gate

The fixture is consumed by 8+ spec files, so the plan's two-project gate was not sufficient evidence. The **full suite** was run after `yarn db:reset`:

```
stats {"duration":658280.495,"expected":134,"skipped":0,"unexpected":0,"flaky":0}
non-passed: 0
total tests: 134
```

Then, against the exact committed code, the plan's required projects individually:

```
voter-journey  {"duration": 61051, "expected":  4, "skipped":0, "unexpected":0, "flaky":0}
a11y-smoke     {"duration":110166, "expected": 18, "skipped":0, "unexpected":0, "flaky":0}
performance    {"duration": 16625, "expected":  3, "skipped":0, "unexpected":0, "flaky":0}
```

No skips, no retries, no weakened assertions. `yarn format:check` exit 0; `yarn lint:check` exit 0 (2 pre-existing warnings in unrelated files: `candidate-bank-auth-journey.spec.ts:208`, `mockOidcIssuerEntry.ts:33`).

## Deviations from Plan

### Environment (not a code deviation, but it invalidated two runs)

The first two runs of the perf project failed at the very first fixture step. The cause was **DEF-135-03 in a new form**: after the OpenVAA dev server was stopped for a restart, a *different project's* Vite server (`~/Desktop/Treader/treader/apps/web`) claimed :5173 during the `yarn db:reset` window. It is a `node` process answering 200, so it passes the documented "assert the listener is a node process" check — the Playwright error context showed the tests scanning a page reading `"An example document"`.

Resolution: the foreign server was left alone (it belongs to unrelated work) and every run in this plan used `FRONTEND_PORT=5174`, the port our own `yarn dev` fell back to, after confirming `curl localhost:5174` returns `<title>Election Compass</title>`. `toCallbackUrl()` in `emailBucket.fixture.ts` already honours `FRONTEND_PORT`, so the candidate email-link specs in the full suite were unaffected — and they passed.

**The lesson worth carrying:** "is a node process" is not a sufficient identity check for :5173. Assert the *served app*.

### Rule 2 — added functionality not in the plan

**1. [Rule 2] Added a load-independent results-fetch operation budget.** The plan asked only for a metric that moves under a slowdown. A wall-clock gate carrying 3.3x headroom would be silently absorbed by faster hardware, and the audit's own preferred fix was the operation budget. Both are now asserted. Committed in `bb8533c64`.

**2. [Rule 2] Added non-vacuity guards (`cardCount > 0`, `scoreCount > 0`).** A timer assertion with no proof that the timed thing rendered is a new fake guard — an empty results page would post an excellent time. Committed in `bb8533c64`.

**3. [Rule 1] Guarded the slider race instead of implementing the audit's suggested `Promise.race`.** The audit's literal suggestion introduces the stale-surface bug described above. Committed in `e937af341` with the reasoning inline.

## Known Stubs

None.

## Deferred

**Give `NumberScaleInput.svelte` the `name="questionChoices-<question.id>"` contract that `QuestionChoices.svelte` already has.** That is the root-cause fix: with an id-scoped slider the `sliderJustAnswered` guard becomes unnecessary, the loop-entry probe at fixture line ~329 loses the same latent stale-slider hazard it carries today, and two adjacent NUMBER questions would stop being the one case that still pays the 10s. It is a one-line, render-invisible product change, but it is *product* code in a test-guard remediation phase, so it was not taken here. Logged to `deferred-items.md`.

## Threat Flags

None. Test-only changes; no new attack surface (ASVS L1, per the plan's threat model).

## Self-Check: PASSED

- `tests/tests/specs/perf/performance-budget.spec.ts` — FOUND
- `tests/tests/fixtures/voter/voter-journey.fixture.ts` — FOUND
- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/136-01-SUMMARY.md` — FOUND
- commit `bb8533c64` — FOUND
- commit `e937af341` — FOUND

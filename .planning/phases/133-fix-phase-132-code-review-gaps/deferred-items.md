# Phase 133 — Deferred Items

Out-of-scope discoveries surfaced during Phase 133 execution. Per the executor SCOPE BOUNDARY
rule these were **logged, not fixed** — they are not caused by this phase's changes.

---

## DEF-133-01 — Latent intermittent flake in `voterIntro.ts` intro-CTA click (2 s stability budget)

**Status:** RESOLVED 2026-08-09 — root cause confirmed by reproduction, fixed, gated (see § Resolution below)
**Severity:** medium (E2E Hard Rule: an intermittent failure is a real defect and must be ironed out)
**Surfaced during:** Plan 03 (full-suite 3× determinism gate), by forensic recovery of the prior
killed executor attempt's console logs.

### Observation

One full-suite run out of nine observed runs of the current code state failed:

```
[perm-2e-asymmetric] › tests/tests/specs/perm/perm-2e-asymmetric.spec.ts:17:3
  › user selects both elections: constituency selector shows active CG-2 picker (CG-1 auto-implied)

TimeoutError: locator.click: Timeout 2000ms exceeded.
Call log:
  - waiting for getByTestId('voter-intro-start')
    - locator resolved to <a tabindex="0" role="button" data-testid="voter-intro-start"
      href="http://localhost:5173/elections" class="btn relative flex flex-nowrap ...">…</a>
  - attempting click action
    - waiting for element to be visible, enabled and stable

  at utils/voterIntro.ts:28
     26 |   const introStart = page.getByTestId(testIds.voter.intro.startButton);
     27 |   await expect(introStart).toBeVisible({ timeout: TIMEOUTS.slowPage });
   > 28 |   await introStart.click({ timeout: TIMEOUTS.click });
  at bypassIntroThen (tests/tests/utils/voterIntro.ts:28:20)
  at bypassIntroAndExpectElectionSelector (tests/tests/utils/voterIntro.ts:82:3)
  at tests/tests/specs/perm/perm-2e-asymmetric.spec.ts:20:5
```

Run tally for that run: **1 failed / 72 did not run / 56 passed** (3.1 m) — the 72 did-not-run are
cascade skips from the perm serial chain, which under `feedback_e2e_did_not_run` also count as
failures.

### Root-cause hypothesis — **UNCONFIRMED**

`bypassIntroThen` asserts the intro CTA visible with `TIMEOUTS.slowPage` (10 s), then clicks it
with `TIMEOUTS.click` (2 s). The call log shows the locator **resolved** and the click entered
Playwright's actionability re-check, then timed out at *"waiting for element to be visible,
enabled and stable"*. Because visibility had already been asserted one statement earlier, the
most likely blocking condition is the **stability** check (two consecutive animation frames at an
identical bounding box) rather than existence or visibility — i.e. the DaisyUI `.btn` was still
settling (layout/transition) when the 2 s action-ack budget expired.

This hypothesis has **not** been re-tested in isolation and must be treated as unconfirmed
(per `feedback_flag_unverified_root_cause`). The failure did not reproduce in the Plan 03 gate,
so no isolation run was possible without deliberately provoking it.

### Why it is out of Phase 133 scope

- The Phase 133 change surface is exactly two files (`git diff --stat` since the Phase 132 close):
  `tests/tests/specs/candidate/candidate-journey.spec.ts` and `tests/tests/utils/voterNavigation.ts`.
- `tests/tests/utils/voterIntro.ts` is **not** among them.
- `perm-2e-asymmetric.spec.ts` imports **only** from `../../utils/voterIntro` — it never touches
  `voterNavigation`, so the removed hard-nav fallback cannot be implicated.
- Therefore this is a pre-existing latent defect exposed by repeated full-suite execution, not a
  regression introduced by WR-01 / IN-01 / IN-02.

### Recommended follow-up (separate phase / quick task)

Diagnose the stability stall at `voterIntro.ts:28` before changing any budget. Candidate levers,
in order of preference:

1. Identify and remove the source of the post-mount layout shift on the intro CTA (best fix —
   removes the defect rather than widening the window).
2. If the shift is intrinsic (an intentional transition), reclassify this specific wait: the
   click is gated on a *render-settle* boundary, not an *action-ack* boundary, so `TIMEOUTS.click`
   may be the semantically wrong bucket for it.

Do **not** simply raise `TIMEOUTS.click` globally — it is a shared bucket used across the suite
and widening it would slow every fail-fast path.

**Observed rate:** 1 / 9 full-suite runs (~11 %) at the current code state. Prior milestone gates
(v2.13, Phase 124) recorded cardinal-clean runs, so this is low-frequency but real.

---

## DEF-133-01 — Resolution (2026-08-09)

### The original hypothesis was WRONG

The Phase-133 hypothesis (DaisyUI `.btn` still settling → Playwright *stability*
check blocked) was tested directly and **disproven as the cause**:

- A post-mount layout mutation on the intro page **does exist and was measured**:
  the step `<ol>` goes 4 → 5 `<li>` at **t=529 ms** (`constituenciesSelectable`
  flips `false → true` once the root-layout `$effect` applies `dataRoot`, which
  starts empty because `.some()` on an empty election array returns `false`).
- But it is **not the cause**: the CTA becomes visible at **~20 ms** and the click
  completes in **43–138 ms**, i.e. the flow has already navigated away long before
  the 529 ms mutation lands. The mutation also **did not move the CTA**
  (`y: 656 → 656`, `h: 44 → 44`) — `MainContent`'s `flex-grow` + `justify-center`
  absorbed it.

(The 529 ms content flip is a real *product* CLS concern — the intro step list
renders an incomplete list for ~½ s on client-side entry — but it is a separate
issue from this flake. Not fixed here; see the todo note.)

### Confirmed root cause — budget mismatch under main-thread contention

The click's cost is **CPU-bound** and scales linearly with main-thread
contention. Measured with CDP `Emulation.setCPUThrottlingRate`, all else equal:

| throttle | 1x | 4x | 8x | 12x | 20x | 40x | 60x | 80x |
|---|---|---|---|---|---|---|---|---|
| `visible` | 12–23 ms | ~100 | ~165 | ~250 | ~370 | — | — | — |
| `click` | ~55 ms | ~138 | ~290 | ~420 | ~690 | ~1800 | ~2400 | >2000 |
| click timeouts | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | **1/4** | **4/4** |

**The failure reproduces at ≥60x contention** — the exact
`locator.click: Timeout 2000ms exceeded` at `voterIntro.ts:28`.

The defect the old code encoded is an **asymmetric budget allocation**: the
*visibility* wait preceding each click got `TIMEOUTS.slowPage` (10 s) while the
click itself got `TIMEOUTS.click` (2 s) — even though the two costs scale
together at roughly 1 : 1.7. The click was therefore **always** the budget that
blew first. These clicks are the first interaction with a freshly-hydrating
page, so they are gated on a *render-settle* boundary, not an *action-ack* one —
`TIMEOUTS.click` was the semantically wrong bucket, exactly as lever #2 above
suspected.

### Fix applied

`bypassIntroThen` now advances both hydration-gated navigation clicks (home → intro,
intro → next) via the in-tree **`clickAndRaceSettle`** idiom (`helpers/navigation.ts`),
whose own "Stuck click" docstring describes this failure family. It bounds the
click, swallows the actionability timeout, and races the **landing** instead —
the signal that actually matters. Hard assertions move downstream (the intro-CTA
`toBeVisible`, then the caller's `expectation()`), so a genuinely stuck flow
still fails loudly, with a better message than "click timed out". The module's
rigidity contract gained an explicit carve-out documenting why this is not a
weakening.

`TIMEOUTS.click` was **NOT** widened (15 shared call sites — per lever guidance).

### Rejected alternative

`settleNetworkIdle` before the click. Measured **worse**: it helps at moderate
contention (20x: 247–438 ms vs 693–788 ms) but adds its own unbounded wait and
produced a **6254 ms** outlier at 60x. Its `.catch(() => null)` form would also
violate this module's rigidity contract.

### Validation

**Targeted:** `clickAndRaceSettle` produced **0/4 click timeouts at every
throttle level tested (20x / 40x / 60x / 80x)**, against 1/4 (60x) and 4/4 (80x)
for the old code.

**Full suite (3x determinism gate, 2026-08-09):**

| run | result | baseline |
|---|---|---|
| 1 | **129 passed** / 0 failed / 0 skipped / 0 did-not-run (10.6 m) | clean `db:reset`, fresh dev server |
| 2 | **129 passed** / 0 failed / 0 skipped / 0 did-not-run (10.4 m) | consecutive off run 1's baseline |
| 3 | **129 passed** / 0 failed / 0 skipped / 0 did-not-run (10.5 m) | full cold start — Supabase bounced, `db:reset`, dev server restarted |

Method note: runs 1-2 were consecutive off one clean baseline, run 3 off a fresh
cold baseline — the Phase-122-accepted shape (repeated rapid `db:reset` container
bounces 502-wedge local Supabase Storage, an environment artifact; that wedge was
in fact hit and recovered from during this gate via `db:stop` + `db:start`).

Two earlier attempts at run 3 were **killed by the OS at ~38/129 with zero test
failures** — host swap exhaustion (20.6 GB of 21.5 GB used; 27 containers
including two unrelated Supabase stacks). Not a suite defect; resolved by freeing
~2.5 GB of unrelated containers. Recorded here rather than silently retried.

Run 3 logged 25 `[setupFromTemplate] Database is NOT fresh` advisories that runs
1-2 did not. Benign and by design: `probeFreshDatabasePrecondition` runs at
step 0, BEFORE the step-1a/1b teardowns that clear those rows, and step 1a's own
comment documents the brief cross-chain coexistence window. The probe is
warn-only unless `E2E_REQUIRE_FRESH_DB=true`. The freed memory simply made
scheduling fast enough to hit the documented window. DB verified clean (0
non-baseline candidate rows) after teardown.

### Follow-up filed separately (NOT fixed here)

The 529 ms intro step-list content flip (incomplete list rendered pre-hydration,
corrected after the root-layout `dataRoot` `$effect` applies) is a real
user-visible CLS/flash on client-side entry. Out of scope for a test-flake fix —
it needs a product decision about gating the intro list on data readiness.

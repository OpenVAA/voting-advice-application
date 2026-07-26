# Phase 133 — Deferred Items

Out-of-scope discoveries surfaced during Phase 133 execution. Per the executor SCOPE BOUNDARY
rule these were **logged, not fixed** — they are not caused by this phase's changes.

---

## DEF-133-01 — Latent intermittent flake in `voterIntro.ts` intro-CTA click (2 s stability budget)

**Status:** open — NOT fixed in Phase 133
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

---
created: 2026-08-28T09:00:00.000Z
title: candidate-journey step 13.5 failed once in 3 observations — intermittent, root cause UNKNOWN
area: tests/tests/specs/candidate
severity: blocking
source: Phase 151 post-merge integration gate (2026-08-28)
files:
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
---

## Problem

The full E2E suite was run on the integrated `ship-12` tip (`b410d3a90`). It failed
**once**, then passed. This is exactly the shape CLAUDE.md forbids treating as flaky:

> A test that fails intermittently is a real defect (in the test or the code) and MUST
> be ironed out — not skipped, retried-until-green, or annotated as flaky.

**The root cause is NOT known.** It is filed here rather than closed.

## Observations (3)

| # | Scope | Server | Result |
|---|---|---|---|
| 1 | full suite | fresh, after `db:reset` | **FAILED** at step 13.5 → 1 failed, 70 passed, **79 did not run** |
| 2 | `--project=candidate-journey` only | fresh | 5 passed |
| 3 | full suite | fresh | **150 passed**, exit 0 |

## The failure

```
candidate-journey.spec.ts:367 › full candidate journey end-to-end @candidate
  › 13.5. profile rejects an invalid URL in a link question with an inline error

TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  waiting for navigation until "load"
  at candidate-journey.spec.ts:711:18
    await page.waitForURL(/\/candidate\/?(?:\?|#|$)/, { timeout: TIMEOUTS.slowPage });
```

Trace was captured: `tests/playwright-results/candidate-journey-candidat-0d8d0-.../trace.zip`
(the suite retains traces only for failures). **Start there** — it is the only recording
of the failing state that exists.

## Prime suspect, NOT confirmed

`ship-12` carries quick task `260824-sdp`, which rewrote `appContext`'s upstream
forwarding onto `inheritContextMembers`. Its own record says in terms:

> **E2E NOT RUN — outstanding, counts as a failure**

So this integration is the **first** time that refactor has met the E2E suite, and
`appContext` is the root context of both apps. That makes it the obvious suspect —
but observation 3 (150/150 on the same tree) means it is **not a deterministic
break**, and no causal link has been established. Do not record it as the cause
without evidence.

Alternative hypotheses not yet excluded: a save-then-navigate race in the profile
form independent of the refactor; suite-ordering state left by an earlier spec
(the failure is at 44/150 in full-suite order but passes standalone).

## Definition of done

Not "it passed N times". A **named** root cause, plus a negative control showing
the fix addresses that cause. Until then the `260824-sdp` E2E gate stays open.

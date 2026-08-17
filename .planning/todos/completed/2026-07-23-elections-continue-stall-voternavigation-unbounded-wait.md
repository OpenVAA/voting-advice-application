---
created: "2026-07-23T00:00:00.000Z"
title: elections/constituencies-continue-stall — unbounded waitFor in voterNavigation.advanceVoterFlow
area: testing
priority: medium
resolves_phase: 132
files:
  - tests/tests/utils/voterNavigation.ts (advanceVoterFlow — elections + constituencies branches)
source: Phase 132 Plan 03 milestone-close 3x gate, run 1 (pre-fix)
---

## Problem

During the Phase 132 Plan 03 milestone-close 3x determinism gate, run 1 (fresh server, clean DB)
FAILED once, late in the 129-test suite (test ~79/129, ~8m in):

```
[perm-hide-election-tags] perm-hide-election-tags.spec.ts:15:3 › showElectionTags=false: election-tag absent on /questions
  Test timeout of 90000ms exceeded.
  locator.waitFor: waiting for getByTestId('voter-elections-continue') to be visible
  at tests/tests/utils/voterNavigation.ts:216 (advanceVoterFlow → navigateToFirstQuestion)
```

This is a recurrence of the known `perm-hide-election-tags` navigation-helper timing race
(see completed todo 2026-07-16-perm-hide-election-tags-navigation-timing-flake.md, resolves_phase 131).
Phase 131 hardened `navigateToFirstQuestion` with a terminal waitForURL+answer-option settle, but the
residual gap was UPSTREAM in `advanceVoterFlow`: the `electionsCont.waitFor({ state: 'visible' })` at
:216 (and the identical `constituenciesCont.waitFor({ state: 'visible' })` at :193) had NO bounded
timeout and NO hard-nav fallback — unlike the sibling CLICK and URL-settle steps in the same branches,
which fast-fail at 3s and recover via `navigateDirectlyToQuestions()`. When the continue button stalls
(the documented `elections-continue-stall` under the single dev server's SSR-compile load, surfacing
later in the now-larger 129-test suite) OR the page has already advanced past /elections (the
error-context page snapshot showed the QUESTION page), the unbounded waitFor hangs for the full 90s
test timeout with no recovery, and 23 downstream tests cascade to did-not-run.

Per the project's cardinal rule, an intermittently-failing test is a real defect that must be
ironed out — not skipped or retried-until-green.

## Solution

Give both unbounded `...Cont.waitFor({ state: 'visible' })` visibility waits (elections :216 +
constituencies :193) a bounded `TIMEOUTS.slowPage` (10s) timeout and a `navigateDirectlyToQuestions()`
hard-nav fallback on stall — the same fast-fail + hard-nav recovery already proven on the sibling
click/URL-settle steps in the same two branches. Behavior-neutral for the happy path (button appears
in <1s); under stall it fast-fails at 10s and bypasses the stalled UI via direct navigation to
/questions with the seed election+constituency UUIDs, reaching the same terminal state.

## Disposition: FIXED

Fixed in Phase 132 Plan 03 (test-side harden per D-03/D-06), commit on tests/tests/utils/voterNavigation.ts.
Proven by the restarted 3x determinism gate (see 132-MILESTONE-CLOSE-ANCHOR.md).

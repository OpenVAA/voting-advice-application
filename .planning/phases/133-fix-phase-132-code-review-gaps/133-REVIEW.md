---
phase: 133-fix-phase-132-code-review-gaps
reviewed: 2026-07-26T10:11:38Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - tests/tests/utils/voterNavigation.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 133: Code Review Report

**Reviewed:** 2026-07-26T10:11:38Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found (advisory — no blockers)

## Summary

Scope: the whole phase diff (`f64e7c223..HEAD -- tests/`), 56 insertions / 92 deletions across
`tests/tests/utils/voterNavigation.ts` (substantive rewrite) and one regex line in
`tests/tests/specs/candidate/candidate-journey.spec.ts`. `tests/tests/helpers/timeouts.ts` was read
as reference only (unchanged by this phase).

**The three stated fixes are real and verified against the code:**

- **WR-01 (hard-nav fallbacks removed):** verified. Both `navigateDirectlyToQuestions(page)` calls in
  `advanceVoterFlow`'s catch branches are gone, and the two throwing `waitForURL` probes that fired
  them are now non-throwing `.catch(() => null)` settles. No `page.goto` remains anywhere in
  `voterNavigation.ts` (only `voterHomePage.goToPage`, which is the fixture's asserted home nav).
  There is **no re-created bypass in a new shape** — no branch routes around a stuck screen; every
  failure path falls back to "loop again and re-detect", which is what the fix intended.
- **IN-02 (dead UUID path deleted):** verified complete. `navigateDirectlyToQuestions`,
  `resolveSeedUuids`, `uuidCache` and the now-unused `SupabaseAdminClient` import are all gone;
  repo-wide grep finds **zero** remaining references to any of the three symbols. All were
  module-private, so no external consumer was orphaned. `Locator`, `Page`, `TIMEOUTS`, `testIds` and
  `createVoterHomePage` are all still used — no other imports went dead.
- **IN-01 (candidate step 13.5 positive assertion):** verified. `/\/candidate\/?(?:\?|#|$)/` matches
  `/candidate`, `/candidate/`, `/candidate?…`, `/candidate#…` (with or without a locale prefix) and
  correctly rejects `/candidate/profile` and `/candidate/login`. I checked the misroute the old
  negative-lookahead would have swallowed: `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:38`
  redirects an unauthenticated user to `CandAppLogin` → `/candidate/login`, which the new regex
  rejects. The fix genuinely closes the hole it claims to close, and there is no
  `?redirectTo=/candidate`-style query param in the candidate routes that could produce a
  tail-position false positive.

The findings below are **advisory quality issues, not correctness breakage**. Consistent with the
3× green suite, I found nothing that would make a currently-passing test fail. The two warnings are
about the *failure path* — the code's behaviour when something is genuinely stuck diverges from what
its own new comments promise, which matters because that failure path is precisely what this phase
exists to protect.

## Warnings

### WR-01: The "exhausts `maxSteps` and fails loudly at the terminal wait" contract is unreachable in the button-never-renders case

**File:** `tests/tests/utils/voterNavigation.ts:163-171` and `196-204` (comment), `105` (`maxSteps`), `232-241` (terminal wait)

**Issue:** Both new continue-button comments state: *"a genuinely-stuck screen exhausts `maxSteps` and
fails loudly at the terminal wait rather than being routed around."* Traced against the clock, that
cannot happen for the case the comment is written about.

When `electionsCont` / `constituenciesCont` never renders, each loop iteration costs the full
`TIMEOUTS.slowPage` = 10 000 ms (`timeouts.ts:33`) before the `catch { continue }`. The top-of-loop
`anyCheckpoint.waitFor` and the five `isVisible()` probes all resolve immediately because
`electionsList` *is* visible. So the loop budget is `maxSteps` (10) × 10 s = **100 s**, against a
90 s Playwright global ceiling (`timeouts.ts:38`, `testMax`). The test is killed inside iteration 9's
`waitFor` — the loop never exhausts, and the terminal `stopAt` wait at lines 235-241 is never reached.

This is **not** a masked failure (the test still fails, and the surfaced error
`waiting for getByTestId('voter-elections-continue') to be visible` is arguably *more* diagnostic
than the terminal answer-option wait). The defect is that the documented control flow is wrong, and
`maxSteps` is not the binding constraint it is described as. A maintainer tuning `maxSteps` or
`slowPage` would reason from a false model — e.g. raising `maxSteps` to 15 would change nothing, and
lowering `slowPage` would change the failure surface silently.

Contrast the case the fix *does* handle correctly: button renders but the click no-ops. There the
per-iteration cost is the `TIMEOUTS.page` = 5 s URL settle, so 10 × 5 s = 50 s + a 5 s terminal wait
lands at ~55 s, comfortably inside 90 s, and the loop does reach the terminal `stopAt` wait exactly
as documented. Constituencies is heavier (combobox re-selection every retry) but still lands inside
the ceiling under normal listbox latency.

**Fix:** Either correct the comment to state the real behaviour, or make the budget self-consistent.
Cheapest honest option — make the invariant explicit and derive `maxSteps` headroom from it:

```ts
// The stuck-button worst case is maxSteps × TIMEOUTS.slowPage. Keep that product
// under TIMEOUTS.testMax so the loop reaches the terminal stopAt wait rather than
// being killed by the global test ceiling mid-waitFor.
const maxSteps = opts.maxSteps ?? 10;
```

with the continue-visibility wait dropped to `TIMEOUTS.page` (the button is same-render, not a
network roundtrip) — 10 × 5 s = 50 s, which restores the documented terminal-wait path. If
`slowPage` is genuinely required there for cold start, then instead amend both comments to say the
stuck case surfaces as a global-timeout failure *at the continue-button wait*, and drop the
"exhausts `maxSteps`" claim.

### WR-02: Retry headroom is 4 iterations, not the "generous" margin the docstring implies — and retries are now the only recovery layer

**File:** `tests/tests/utils/voterNavigation.ts:96-97` (docstring), `130` (loop)

**Issue:** The docstring says *"default 10; the journey has at most 5 real hops so 10 is generous
headroom."* Counting actual iterations: intro-start, elections-continue, constituencies-continue,
questions-intro-start, category-intro-start = 5 click iterations, **plus** the sixth iteration that
detects `answerOption` and returns at line 136. That leaves **4** spare iterations, not 5.

This mattered less before the diff, because a stalled continue consumed one iteration and then
hard-navigated straight to `/questions`, skipping the remaining hops. With the bypass removed
(correctly), retries are the *only* recovery mechanism, so the spare-iteration count is now
load-bearing: two retried hops on a loaded dev server consume half the remaining margin. The wall
clock (WR-01) binds before `maxSteps` does in the slow branches, so the stated headroom is
optimistic on both axes.

Not a defect in current behaviour — 4 spare iterations is still adequate for the observed flake
shapes, and the suite is green 3×. It is a stale-reasoning defect in the doc that governs future
tuning.

**Fix:** Correct the arithmetic and name the real constraint:

```ts
 * @param opts.maxSteps - safety cap on the loop (default 10; the journey has at
 *   most 5 click-hops plus 1 terminal-detect iteration, leaving 4 retry
 *   iterations. Note the wall-clock budget — maxSteps × the slowest per-iteration
 *   wait — binds before maxSteps does; see the continue-button waits below).
```

## Info

### IN-01: Stale line reference in the `navigateToFirstQuestion` comment, introduced by the deletion

**File:** `tests/tests/utils/voterNavigation.ts:267`

**Issue:** The comment reads *"advanceVoterFlow can short-circuit (line ~167) on an answer option
that is visible…"*. The short-circuit is `if (await answerOption.isVisible()) return;` at **line 136**.
Line 167 now lands in the middle of the constituencies continue-button comment block. The pointer was
correct before this phase; deleting `resolveSeedUuids`/`uuidCache` (~31 lines from the top of the
file) shifted everything up and the comment was not re-anchored. This is exactly the class of
staleness the phase was cleaning up elsewhere.

**Fix:** Drop the line number rather than re-pinning it (it will drift again):
`advanceVoterFlow can short-circuit (the terminal answerOption.isVisible() early return)`.

### IN-02: `.catch(() => null)` on the URL settles swallows every error class, not just timeouts

**File:** `tests/tests/utils/voterNavigation.ts:189`, `222`

**Issue:** The bare `.catch(() => null)` on both `waitForURL` settles is correct for the intended
case (settle timeout → re-detect next iteration), but it also absorbs `Target page, context or
browser has been closed`, `Navigation failed because page was closed`, and frame-detached errors. In
those cases the loop continues to the next iteration and the failure re-surfaces at the following
`isVisible()` call — so nothing is permanently masked — but the reported error is one step removed
from its cause, and the "settle timed out" comment above it becomes misleading in the logs.

Low risk; noting it because the whole point of WR-01's fix was to stop catch-alls from eating real
signal. Same pattern already exists at lines 69-70 in `advanceClick` (pre-existing, unchanged).

**Fix:** Narrow to timeouts if you want the guarantee tight:

```ts
.catch((e) => {
  if (!/Timeout .* exceeded/.test(String(e))) throw e;
  return null;
});
```

### IN-03: Elections/constituencies branch asymmetry — the combobox interaction is unguarded (pre-existing, unchanged by this diff)

**File:** `tests/tests/utils/voterNavigation.ts:153-161`

**Issue:** Focus item 3 asks whether the two branches are symmetric. From the continue-button wait
onward they are byte-for-byte symmetric (visibility wait → 3 s click → non-throwing settle → continue),
and the only URL-predicate difference (`/constituencies` vs `/elections`) is correct. The asymmetry is
upstream: the constituencies branch performs three unguarded actions per iteration — `combo.click()`,
`listbox.waitFor(TIMEOUTS.page)`, `option.first().click()` — none in a try/catch. The function's
"Resilient to: elements detaching mid-click due to concurrent settings mutation (retry on next
iteration)" claim (lines 86-87) therefore does not hold for this block: a detach there rejects
`advanceVoterFlow` outright instead of retrying.

Two secondary notes on the same block, both hypotheses I could not confirm without running the suite:
`page.getByRole('listbox')` is page-scoped rather than combobox-scoped, so two simultaneously-open
listboxes would be a strict-mode violation; and the whole selection loop re-runs on every retry
iteration, which the removed hard-nav previously short-circuited after one attempt.

None of this was touched by the phase and a loud rejection is directionally what WR-01 wanted.
Flagged only because it contradicts the docstring's resilience claim in the same function.

**Fix:** None required for this phase. If addressed later, wrap the selection loop in the same
`try { … } catch { continue; }` shape the sibling branches use, and scope the listbox to the combobox
(`combo.locator('..').getByRole('listbox')` or the aria-controls id).

### IN-04: `stopAt: 'category-intro'` / `'questions-intro'` can return successfully without ever reaching that checkpoint (pre-existing, unchanged)

**File:** `tests/tests/utils/voterNavigation.ts:136`

**Issue:** The `answerOption.isVisible()` early return at line 136 fires before the `stopAt` checks at
lines 139 and 145. If the requested intermediate page is disabled in app settings, the walk sails past
it to the first question and `advanceVoterFlow(page, 'category-intro')` resolves **successfully** — a
silent pass on a checkpoint that never existed. Same "assertion that passes when the thing under test
is absent" shape as the IN-01 negative-lookahead this phase just fixed in the candidate spec.

Not in the diff, and currently harmless: every in-repo consumer
(`perm-hide-category-tags.spec.ts:21`, `perm-hide-election-tags.spec.ts:22`,
`minimalVoterResultsPage.fixture.ts:53`) calls the default `'first-question'`, for which the early
return is exactly right. Raised as a candidate for the deferred-items list, not for this phase.

**Fix:** Guard the early return on the stop point:
`if (stopAt === 'first-question' && (await answerOption.isVisible())) return;` — then a
`'category-intro'` walk that overshoots falls through to the terminal wait and fails loudly.

---

_Reviewed: 2026-07-26T10:11:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

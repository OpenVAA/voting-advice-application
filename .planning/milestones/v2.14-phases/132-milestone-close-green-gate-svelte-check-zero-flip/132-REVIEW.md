---
phase: 132-milestone-close-green-gate-svelte-check-zero-flip
reviewed: 2026-07-23T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - .github/workflows/main.yaml
  - apps/frontend/package.json
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts
  - apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts
  - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/voter/voter-nominations.spec.ts
  - tests/tests/utils/voterNavigation.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 132: Code Review Report

**Reviewed:** 2026-07-23
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase's diff is deliberately narrow: a blocking svelte-check CI step + `--fail-on-warnings`
on the frontend `check` script, behavior-neutral lint remediation across 8 files (func-style
declarations, import-sort, extended reasoned eslint-disable comments), a post-submit navigation
settle in `candidate-journey.spec.ts` step 13.5, and bounded visibility waits + a hard-nav
fallback in `advanceVoterFlow` (`voterNavigation.ts`).

I verified the three calibration concerns directly:

1. **Did any lint "fix" change test semantics?** No. The arrow-const → function-declaration
   conversions (`app-navigation.ts` mock, `supabaseDataProvider.test.ts` `q(i)` helper,
   `candidateContext` import reorder), the import-sort changes (`voter-nominations.spec.ts`,
   `+layout.server.ts`, `candidate-journey.spec.ts`), and the extended eslint-disable comments
   (`entityDetails.fixture.ts` `no-raw-locators`, `candidate-bank-auth-journey.spec.ts`
   `no-conditional-in-test`) are all behavior-neutral. The disabled `no-conditional-in-test`
   ternaries are discriminated-union data-extraction narrowing that cannot skip an assertion;
   the downstream `expect(...length)` assertions run unconditionally. No test relies on
   reassigning the (now function-declaration) navigation stubs. Confirmed clean.

2. **Can the new CI step silently pass?** No. `yarn workspace @openvaa/frontend check` runs
   `svelte-kit sync && svelte-check --fail-on-warnings`; warnings now exit non-zero, yarn
   propagates the exit code, the step carries no `continue-on-error`, and it runs after
   `yarn build` (line 61) so dependent packages are built first. A real warning fails the job.

3. **Can the new waits mask genuine product failures?** The `candidate-journey.spec.ts` step
   13.5 `waitForURL` does NOT mask — a submit that stays on `/profile` times out and fails
   (see IN-01 for a lesser precision concern). The `voterNavigation.ts` hard-nav fallback DOES
   introduce a real masking risk (WR-01) — the primary finding below.

No BLOCKER-tier defects. One WARNING and two INFO items.

## Warnings

### WR-01: Hard-nav fallback in `advanceVoterFlow` masks a genuinely broken continue button

**File:** `tests/tests/utils/voterNavigation.ts:193-202` (constituencies) and `:224-233` (elections)
**Issue:** This phase converts two previously-unbounded waits
(`await constituenciesCont.waitFor({ state: 'visible' })` /
`await electionsCont.waitFor({ state: 'visible' })`) into bounded `TIMEOUTS.slowPage` (10s) waits
whose `catch` branch calls `navigateDirectlyToQuestions(page)` — a `page.goto()` that hard-navigates
straight to `/questions?electionId=…&constituencyId=…`, bypassing the elections/constituencies
continue UI entirely.

Before this change, a continue button that never rendered (a genuine product regression) would
hang and time out — a *failure signal*. After this change, that same regression is silently routed
around: the fallback hard-navigates and the journey proceeds green. The E2E test for the
elections/constituencies "Continue" leg therefore no longer fails on a real breakage of that leg.

The `catch` also does not distinguish the two documented causes it conflates in its own comment:
"the continue button can stall (SSR-compile load)" vs. "the page may already have advanced past
/constituencies." The first is a legitimate slow-render race; a never-rendering button is a product
bug. The code treats both identically. Because `slowPage` is 10s (generous), the fallback should not
fire on healthy runs, which limits the blast radius — but on the exact class of failure E2E exists to
catch, it now hides it.

**Fix:** Gate the fallback on evidence the page actually advanced, so a still-on-`/elections` stall
surfaces as a real failure instead of being bypassed:
```ts
} catch {
  // Only hard-nav if the app already left the elections/constituencies page
  // (benign transition race). If we're still parked here, the continue button
  // genuinely failed to render — let it fail loudly rather than route around it.
  if (/\/(elections|constituencies)/.test(page.url())) {
    throw new Error('elections/constituencies continue never became visible while still on the page');
  }
  await navigateDirectlyToQuestions(page);
  continue;
}
```
At minimum, emit a `console.warn`/test-annotation when the fallback fires so a masked regression is
visible in the report rather than fully silent.

## Info

### IN-01: Negative-lookahead settle regex passes on any non-profile candidate route

**File:** `tests/tests/specs/candidate/candidate-journey.spec.ts:671`
**Issue:** `await page.waitForURL(/\/candidate(?!\/profile)/, …)` resolves for *any* candidate URL
that isn't `/profile` — including a misroute to an error page, the login page, or an unexpected
sub-route. If submit navigates somewhere wrong-but-not-profile, this wait passes and the failure is
only caught (10s later) by the downstream `statusMessage` visibility assertion, obscuring the real
cause. A positive match on the actual home route would fail faster and point at the true destination.
The regex correctly does NOT prematurely pass while still on `/profile` (verified), so it does not
mask a stuck-on-profile failure — this is a precision/diagnostics concern only.
**Fix:** Assert the expected destination directly, e.g. `waitForURL(/\/candidate(?:\/(?:home)?)?$/)`
or the app's canonical candidate-home route pattern, rather than "anything that isn't profile."

### IN-02: `resolveSeedUuids` caches empty arrays; fallback builds a degenerate `/questions?` URL

**File:** `tests/tests/utils/voterNavigation.ts:25-46, 279-289`
**Issue:** `resolveSeedUuids` writes `uuidCache` unconditionally, including when the seed lookups
return no rows (`e1.data?.[0]?.id` is `undefined` → `electionUuids: []`). The empty result is then
cached permanently for the process, so a transient lookup failure is never retried. When both arrays
are empty, `navigateDirectlyToQuestions` produces `${baseUrl}/questions?` (trailing `?`, no
election/constituency params), which the app will bounce back to `/elections` — the loop then
re-stalls, re-hard-navs, and burns iterations until `maxSteps` (10), ending in the opaque terminal
`waitFor` failure that misattributes the root cause (looks like a missing answer option, not a seed
lookup miss). Bounded by `maxSteps`, so no infinite loop.
**Fix:** Don't cache an empty resolution (retry on next call), and guard the fallback:
```ts
if (!electionUuids.length || !constituencyUuids.length) {
  throw new Error('navigateDirectlyToQuestions: seed UUID lookup returned no rows — cannot build fallback URL');
}
```
so the failure names its real cause instead of surfacing as a generic loop-out.

---

_Reviewed: 2026-07-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

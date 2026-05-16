# voter-not-located-redirect CLEAN-02 chain-head — v2.11+ deferral

**Phase 86.1-03 cell 2 disposition:** SKIP-FALLBACK per CONTEXT D-04 (1h RCA budget exceeded) + D-05 (FIX-ATTEMPT first; skip-fallback if no fix found).

**Phase:** 86.1-pre-phase-87-convergence-sweep
**Plan:** 03
**Cell:** 2 (DETERM-14)
**Spec:** `tests/tests/specs/voter/voter-not-located-redirect.spec.ts:75`
**Test name:** `voter-app :: specs/voter/voter-not-located-redirect.spec.ts > CLEAN-02 voter-not-located deferred-target redirect CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results`

## Summary

The CLEAN-02 chain-head test asserts that a cold-start voter navigating directly to `/results` (with empty cookies + empty localStorage via `storageState: { cookies: [], origins: [] }`) is redirected through the `?next=` deferred-target chain (`/elections?next=…` → `/constituencies?next=…` → `/results`). Phase 86 added a `domcontentloaded` settle gate at line 90 to give the 307 redirect chain headroom; Phase 86.1-03 cell 2 attempted a defensive `localStorage.clear() + sessionStorage.clear()` after the `page.goto('/results')` to close H2/H4 (storage-isolation across serial-describe siblings). The fix was empirically insufficient: per-spec smoke shows the page landing on `/results/candidates` directly, suggesting the `(located)/+layout.ts` gate is either short-circuited by auto-implication on cold-start full-suite runs OR a downstream routing change made the `?next=` bounce unreachable for the simplest cold path. 4 within-cascade tests (lines 125, 152, 181, 215) remain cascade-blocked.

## Hypothesis history

- **H1 — Phase 84 DETERM-08 portrait-gate inversion (DISPROVED):** The Phase 86 commit's `domcontentloaded` settle gate at line 90 was added precisely to give the redirect chain headroom; if H1 were the cause, this gate would have closed the symptom.
- **H2 — Cookie/storage isolation across parallel projects (EMPIRICALLY INSUFFICIENT):** Phase 86.1-03 cell 2 attempted a defensive `localStorage.clear() + sessionStorage.clear()` after the goto. The clear runs AFTER `page.goto + waitForLoadState`, so by the time the clear fires, the `(located)/+layout.ts` loader has already evaluated. The clear cannot influence a redirect decision that has already been made. Plausible but the chosen mitigation does not address the root cause.
- **H3 — `effect_update_depth_exceeded` during cold-start (LOW):** The spec does not observe console errors.
- **H4 — Test-position in serial describe block (UNTESTED):** This is the FIRST test in a `mode: 'serial'` describe (line 50). Serial mode means it shares browser context with the 4 follow-up tests; if a PRIOR describe block in a parallel run leaks browser context (Playwright generally isolates contexts per worker, but the storageState override may be a partial reset), the assumption breaks. The storage-clear after goto does NOT address this — it would need to be addInitScript-level OR per-test storageState reset.
- **NEW HYPOTHESIS (research-surfaced during fix-attempt):** The (`located)/+layout.ts` gate is now auto-implying election+constituency on cold-start. The fix-attempt smoke recorded `Received string: "http://localhost:5173/results/candidates"` — the voter landed directly on `/results/candidates` without ever bouncing to `/elections?next=`. This suggests one of:
  - The `(located)/+layout.ts` loader's `?next=` guard has a code-path that auto-implies when `getImpliedElectionIds()` succeeds.
  - The e2e seed template's election count or constituency configuration changed between Phase 78 (when CLEAN-02 was authored) and now, such that auto-implication succeeds where it previously failed.
  - A downstream routing-config change made `/results/candidates` the default landing path.

## Recommended v2.11+ next action

1. **Capture per-spec trace + inspect URL state on goto+settle+poll.** Open the trace.zip at `tests/playwright-results/voter-not-located-redirect-c52b2-s-twice-and-resumes-results-voter-app/trace.zip` and frame-by-frame review what URL the loader yields. The fact that the smoke recorded "19 × unexpected value http://localhost:5173/results/candidates" tells us the page lands on `/results/candidates` and stays there — no redirect chain fires at all.

2. **Inspect `apps/frontend/src/routes/(voters)/(located)/+layout.ts`** for changes since Phase 78. Specifically: (a) the `?next=` redirect-emit conditional; (b) whether `getImpliedElectionIds()` now succeeds for the e2e seed where it previously returned `undefined`.

3. **Check the e2e seed template** at `packages/dev-seed/src/templates/e2e.ts`. The Phase 78 spec docstring (lines 22-23) states "default `voter-app` Playwright project consumes the e2e seed (2 elections × multi-constituency)". If the seed now contains only 1 election (or auto-implication threshold dropped), the loader will skip the `?next=` bounce entirely. The Phase 85-03 `applyLikertOnlyFilter` only drops opinion questions, not elections — but a different recent phase may have reduced the election count.

4. **Consider whether CLEAN-02's contract is still load-bearing.** If the routing layer now auto-implies on cold-start (the loader does its job correctly), the `?next=` round-trip is exercised only when implication fails. The 4 within-cascades may be testable independently of the chain-head's specific URL-pattern assertion. Reframe the spec to test the contract that DOES fire today.

## Cross-refs

- `.planning/phases/86.1-…/86.1-RESEARCH.md` §6.2 — Cell 2 hypothesis ranking H1-H4 + recommended sequence
- `.planning/phases/86.1-…/86.1-CONTEXT.md` D-04 (1h cap) + D-05 (FIX-ATTEMPT first disposition) + D-06 (3-element skip protocol)
- `.planning/phases/86-…/86-RESEARCH.md` §3.4 — Phase 86 H1/H2/H3 hypothesis space for CLEAN-02
- `.planning/phases/86.1-…/post-fix/86.1-03-cell2-smoke.txt` — empirical fix-attempt failure record
- `tests/scripts/diff-playwright-reports.ts` `SKIPPED_TESTS` const — Plan 86.1-04 manually adds this entry
- `tests/tests/specs/voter/voter-not-located-redirect.spec.ts:75` — the skipped chain-head test
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — the loader gate under test (suspected upstream change)
- `packages/dev-seed/src/templates/e2e.ts` — the e2e seed template (election count / implication threshold suspected)

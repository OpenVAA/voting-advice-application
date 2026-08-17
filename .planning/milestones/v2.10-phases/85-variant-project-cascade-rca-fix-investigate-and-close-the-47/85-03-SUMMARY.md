---
phase: 85
plan: 03
status: closed
nyquist_compliant: true
date_executed: 2026-05-15
commits:
  - 94cf88723  # docs(85-03): plan
  - 26c187d93  # fix(85-03): filter
  - 0432fbf27  # test(85-03): spec refactor
---

# Phase 85-03 — Summary

## What changed

Two coupled fixes that resolve the 2 deferred variant-multi-election deterministic FAILs (DETERM-12a / DETERM-13 candidates):

1. **Filter at variant-multi-election setup level** (`26c187d93`)
   - Exported `applyLikertOnlyFilter` from `@openvaa/dev-seed` package barrel.
   - Called it in `tests/tests/setup/variant-multi-election.setup.ts` between `runTeardown` and `runPipeline`. Drops `test-question-boolean-1` (QSPEC-01) and `test-question-directional-1` (singleChoiceCategorical) from the variant dataset before write — both inherited via `baseFixed('questions')` from base e2e template and both break the spec's `.nth(2).click()` assumption.

2. **Spec refactor to per-test page** (`0432fbf27`)
   - Replaced shared-`Page` + `browser.newPage()` + `beforeAll` + serial-mode pattern with per-test `page` fixtures in the `Multi-election voter journey` describe.
   - Extracted `navigateMultiElectionToResults(page)` helper for journey reuse across 3 tests.
   - Removed `test.use({ trace: 'off' })` — Playwright 1.58.2 ENOENT race was sharedPage-specific.
   - Removed manual `page.goto(/questions?electionId=...&constituencyId=...)` SvelteKit-silent-nav fallback — same root cause as the trace race.

## Why this lands under Phase 85

Phase 85 (`85-02-SUMMARY.md` §"Phase 86 Routing Recommendation §A") explicitly named DETERM-12a / DETERM-13 as the 2 deterministic FAILs to investigate. Phase 86 inherited them but routed to v2.11+ in its own close. Phase 87's pre-gate (Path A) RCA produced the fix and per user routing the fix lands here as Phase 85's third plan, completing the cascade-tail Phase 85 originally owned.

## Empirical verification

Run command (against the local Supabase + dev server stack):

```bash
yarn test:e2e --project=variant-multi-election --grep "should display questions and reach results|should bypass election selection when disallowSelection is true|should show election selection page with 2 elections|should show election accordion and results after selecting election|should display election-specific questions"
```

Result (2026-05-15 14:34 — captured locally, not part of the binding 3-run gate):

- **5/5 multi-election tests passed** (the 4 Multi-election voter journey tests + the disallowSelection test).
- 41 total tests passed across the dependency chain (`candidate-app-password → data-setup-multi-election → variant-multi-election`).
- 3 tests skipped (filtered out by `--grep`).
- 0 tests failed.
- Wall-clock: 2.1 minutes.

## Cascade-math projection

Pre-fix (per Phase 87 pre-gate cascade check, 2026-05-15):

- PASS_LOCKED: 113
- DATA_RACE: 3
- CASCADE: 40 (32 cascade-victims of DETERM-12a/13 + 3 PRODUCT-GAP source-skips + 5 other variant-spec cells)
- SKIPPED: 2

Projected post-fix (subject to confirmation on next 3-run regen — Phase 87 Task 1 will measure):

- PASS_LOCKED: ~143 (113 + 30–32 cascade-victims promoted + 2 root-cause FAILs promoted)
- DATA_RACE: 3 (unchanged — D-09 imgproxy binding)
- CASCADE: ~5–10 (residual = 3 PRODUCT-GAP source-skips + ~5 non-multi-election variant-spec cells; no longer includes the variant-multi-election cascade-tail)
- SKIPPED: 2 (unchanged — Phase 86 QSPEC source-skips)

This is within Phase 87 CONTEXT D-05's tolerance (CASCADE 0 or ≤5 if the residual is dominated by PRODUCT-GAP source-skips, which is the case here — the 3 PRODUCT-GAP cells were already documented v2.10 deferrals in `tests/scripts/diff-playwright-reports.ts`'s skip-narrative comments).

## Anchor implications

The Phase 85 anchor (`411e09f5ff…`) and Phase 86 anchor (`9a6d74a3088ec2de933cce9ff40797ec1a1cf8180923f02fbfcaf6f690a30af9`) are unchanged by this plan — no regen runs as part of 85-03. Phase 87's binding 3-run cold-start gate (Task 1) will produce the new v2.10-ship anchor on the post-85-03 codebase. Per Phase 87 CONTEXT D-04, that regen will overwrite the active constants arrays in `diff-playwright-reports.ts` atomically.

## Files modified (final, this plan)

- `packages/dev-seed/src/index.ts` — +2 lines (runtime + type export).
- `tests/tests/setup/variant-multi-election.setup.ts` — +9 lines (import + filter call + rationale comment).
- `tests/tests/specs/variants/multi-election.spec.ts` — +96 / −138 lines (net −42; describe rewritten + helper extracted).

## Out of scope (deferred)

- Other 11 specs with `trace: 'off'` overrides — audited in Phase 87 Path A discovery, categorized A/B/C by whether the workaround is genuinely needed. Group C (2 specs: `1e-Nc.spec.ts`, `Ne-Nc.spec.ts`) have no underlying rationale and can be cleaned up trivially; Group A (5 specs) need the same per-test-page refactor as this plan applied. Track as a separate v2.11+ phase.
- Playwright 1.58.2 → 1.59+ upgrade — would resolve the underlying ENOENT race upstream and let Group B drop their overrides. Mid-term.
- `package.json` `db:*` scripts refactor — captured as todo `2026-05-15-refactor-package-scripts-db-prefixed-scripts-only-affect-the.md`, queued for post-v2.10-ship.

## Threat flags

None. Plan 03 touches:
- Package barrel export (`@openvaa/dev-seed`).
- Playwright setup project (TypeScript-only, no schema/auth/network changes).
- One spec file (test-only, no production code path).

No new endpoints, no auth paths, no schema migrations, no file access patterns.

## Self-check

Files claimed created / modified (verified):
- ✅ `.planning/phases/85-…/85-03-PLAN.md` (created)
- ✅ `.planning/phases/85-…/85-03-SUMMARY.md` (this file)
- ✅ `packages/dev-seed/src/index.ts` (modified — 2 exports added)
- ✅ `tests/tests/setup/variant-multi-election.setup.ts` (modified — filter call added)
- ✅ `tests/tests/specs/variants/multi-election.spec.ts` (modified — describe refactored)

Commits (verified via `git log --oneline`):
- ✅ `94cf88723` docs(85-03): plan
- ✅ `26c187d93` fix(85-03): filter
- ✅ `0432fbf27` test(85-03): spec refactor
- (this commit pending) docs(85-03): summary

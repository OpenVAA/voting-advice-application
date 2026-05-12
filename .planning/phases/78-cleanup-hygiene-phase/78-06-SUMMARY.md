---
phase: 78-cleanup-hygiene-phase
plan: 06
subsystem: test-determinism
tags: [clean-05, phase-73-review-sweep, cr-01-bonus, cr-02, wr-01-07, in-01-05]
dependency_graph:
  requires: []
  provides: [phase-73-review-backlog-closed]
  affects: [tests/e2e]
tech_stack:
  added: []
  patterns: [test-determinism-tightening, semantic-locator-extraction, compensating-rollback, typeof-narrowing]
key_files:
  created: []
  modified:
    - tests/tests/specs/voter/voter-popups.spec.ts
    - tests/tests/specs/variants/multi-election.spec.ts
    - tests/tests/specs/variants/constituency.spec.ts
    - tests/tests/specs/variants/startfromcg.spec.ts
    - tests/tests/setup/auth.setup.ts
    - tests/tests/setup/data.setup.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/tests/specs/candidate/candidate-questions.spec.ts
    - tests/tests/specs/candidate/candidate-settings.spec.ts
    - tests/tests/specs/voter/voter-results.spec.ts
    - tests/tests/specs/candidate/candidate-required-info.spec.ts
decisions:
  - "WR-03: Option B (preserve goto fallback with `// reason:` block) + precondition asserts in beforeAll — the SvelteKit silent-goto race is still live, so removing the fallback would have introduced a flake. Precondition asserts guarantee the fallback URL is well-formed."
  - "IN-03a/b: retain testIds with `// reason:` blocks (not semantic locators). The underlying elements are styling `<div>` / `<p>` with no role/accessible-name — promoting to semantic roles is a UI change out of scope."
  - "IN-03c/d/e: extract `getFilterButton(page)` helper using `getByRole('button', { name: /^Filter\\b/i })`. Verified safe (single 'Filter' label in en translations)."
  - "IN-04: strict-inequality (`toBeLessThan`) selected — the e2e seed (4 parties × 11 candidates) guarantees the filter strictly narrows."
  - "WR-04: Option A (drop reload) — the next iteration's `goto()` fully replaces page state, making the reload pure waste."
metrics:
  duration: "~35 minutes"
  completed: "2026-05-12"
  tasks_completed: 4
  files_modified: 12
  findings_closed: 14
---

# Phase 78 Plan 06: CLEAN-05b Phase 73 Review Findings Sweep — Summary

Closed the entire Phase 73 review backlog (13 source findings + 1 bonus CR-01 fold = 14 total) in 4 atomic cluster-commits. Each finding either fixed-in-code or accepted-inline with a `// reason:` block per v2.8 P70 Cat A convention. Lint clean across all 12 modified files (0 errors; 2 pre-existing warnings on multi-election:197-198 are out of scope per scope-boundary rule).

## Per-Finding Outcome Table

| Finding | File:Line | Disposition | Approach |
|---------|-----------|-------------|----------|
| CR-01 (bonus) | multi-election.spec.ts:250 | fixed-in-code | `waitUntil: 'networkidle'` → `reload()` + `answerOption.waitFor()` |
| CR-02a | voter-popups.spec.ts:141 | fixed-in-code | `toBeHidden()` → `toBeHidden({ timeout: 5000 })` |
| CR-02b | voter-popups.spec.ts:224 | fixed-in-code | `toHaveCount(0)` → `toHaveCount(0, { timeout: 3000 })` |
| WR-01 | multi-election.spec.ts:145 | fixed-in-code | `.catch(() => false)` swallow-trap → union waitFor + post-await isVisible probe |
| WR-02a | constituency.spec.ts:89-98 | fixed-in-code | post-union `(count > 0 && isVisible)` snapshot → dedicated `electionAccordion.waitFor().then/catch` deterministic branch |
| WR-02b | startfromcg.spec.ts:120-128 | fixed-in-code | mirror of WR-02a fix |
| WR-03 | multi-election.spec.ts:215-231 | fixed-in-code | `TODO: Remove fallback` → `// reason:` block + precondition asserts on `electionUuids.length === 2` and `constituencyUuids.length === 2` in beforeAll |
| WR-04 | auth.setup.ts:29-48 | fixed-in-code | dropped wasted `page.reload(...)` in retry loop; next iteration's `goto()` replaces page state. LANDMINE-2 cross-reference recorded inline. |
| WR-05 | supabaseAdminClient.ts:340-377 | fixed-in-code | wrapped `forceRegister` 4-step mutation chain in try/catch with `auth.admin.deleteUser` compensating rollback |
| WR-06 | supabaseAdminClient.ts:532-547 | fixed-in-code | replaced silent error swallow in `deleteAllTestUsers` with collect-and-throw aggregated error message (matches `unregisterCandidate` throw-on-error pattern) |
| WR-07 | supabaseAdminClient.ts:122-156 | fixed-in-code | DELETED `fixGoTrueNulls` method (zero callers verified via repo-wide grep across tests/, apps/, packages/) |
| IN-01 | candidate-bank-auth.spec.ts:28-33 | fixed-in-code | throw-on-missing for `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY` (demo-JWT fallback removed) |
| IN-02 | candidate-bank-auth.spec.ts:169 | fixed-in-code | `(body.error ?? body.msg ?? body.details) as string \| null` → explicit `typeof === 'string'` guard via intermediate `candidateErrorValue` |
| IN-03a | candidate-questions.spec.ts:34 | accepted-with-reason | element is a styling `<div>` with no role/name — `// reason:` block |
| IN-03b | candidate-settings.spec.ts:65 | accepted-with-reason | element is a plain `<p>` with no `role="status"` — `// reason:` block |
| IN-03c/d/e | voter-results.spec.ts:171/220/277 | fixed-in-code | extracted `getFilterButton(page)` helper using `getByRole('button', { name: /^Filter\b/i })` at 3 sites |
| IN-03 bonus fold | candidate-required-info.spec.ts:140,152 | fixed-in-code | `page.locator('[data-testid="..."]')` → `page.getByTestId(...)` at 2 sites (2 pre-existing `playwright/no-raw-locators` errors from Phase 77 P04, deferred per Phase 78 P03 lint pass) |
| IN-04 | voter-results.spec.ts:206-211 | fixed-in-code | `toBeLessThanOrEqual(initialCount)` → `toBeLessThan(initialCount)` strict-inequality |
| IN-05 | data.setup.ts:144-146 | fixed-in-code | `expect(true).toBe(true)` tautology → `expect(candidate.data?.[0]?.auth_user_id).toBeTruthy()` semantic post-condition |

**Total: 14/14 findings closed.** 12 fixed-in-code; 2 accepted-with-reason (IN-03a + IN-03b — both genuinely lack semantic alternatives without UI changes).

## IN-03 Audit: Semantic vs. testId Decisions

| Site | Decision | Rationale |
|------|----------|-----------|
| IN-03a — candidate-questions.spec.ts:34 (`testIds.candidate.questions.list`) | testId + `// reason:` | `<div data-testid="candidate-questions-list">` (apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:128) is a styling container — not a list role, no accessible name. `getByRole('list')` would not match. |
| IN-03b — candidate-settings.spec.ts:~65 (`testIds.candidate.home.statusMessage`) | testId + `// reason:` | `<p data-testid="candidate-home-status">` (apps/frontend/src/routes/candidate/(protected)/+page.svelte:102) is a plain paragraph — no `role="status"`, no `aria-live`, no accessible name. |
| IN-03c/d/e — voter-results.spec.ts:171/220/277 (filter button) | semantic via helper | Button component renders `text="Filter"` (i18n `filterButtonLabel` en); only one "Filter" button label in en translations (verified). Extracted `getFilterButton(page)` returning `getByRole('button', { name: /^Filter\b/i })`. |
| IN-03 bonus — candidate-required-info.spec.ts:140,152 | `getByTestId()` | Replaced raw `page.locator('[data-testid="..."]')` with `page.getByTestId(...)` (semantically equivalent; clears `playwright/no-raw-locators` lint error). |

## Deviations from Plan

None. Plan executed exactly as specified, including the recommended Option A/Option B choices per finding (WR-03 took Option B fallback retention + precondition asserts; WR-04 took Option A reload removal; IN-04 took Option A strict-inequality; IN-05 took the RESEARCH-provided fix snippet).

The 2 pre-existing lint errors in candidate-required-info.spec.ts (Phase 77 P04 deferred per Phase 78 P03 SUMMARY) were folded into IN-03's "audit unjustified getByTestId/raw-locators" scope per the plan's IN-03 bonus instruction.

## LANDMINE Cross-References

- **LANDMINE-1 (CR-01 bonus fold per RESEARCH Q6):** verified intact at HEAD multi-election.spec.ts:250; fixed in this plan.
- **LANDMINE-2 (WR-04 scope):** the auth.setup.ts:29-48 fix is **code-quality only** — it drops a wasted reload in the retry loop. It does **NOT** resolve the candidate-profile.spec.ts:85-145 cascading race that Phase 76/77 deferred. That cascade has a separate root cause (race in the profile-load chain) and is tracked for v2.10+ as a follow-up. The inline `// reason:` block on auth.setup.ts:37 records this delineation.
- **LANDMINE-8 (no 'Alpha' substring in NEW sentinel values):** confirmed. The only `Alpha`-containing literal touched is `test-candidate-alpha` in data.setup.ts (IN-05 fix), which is an **existing** fixture external id used as a query parameter — not a NEW sentinel.

## WR-07 Cleanup Verification

Repo-wide grep before deletion:
```
$ grep -rn "fixGoTrueNulls" tests/ apps/ packages/
tests/tests/utils/supabaseAdminClient.ts:39: *   - Auth helpers (private): `fixGoTrueNulls`, `safeListUsers`
tests/tests/utils/supabaseAdminClient.ts:122:  private async fixGoTrueNulls(): Promise<void> {
```

After deletion (Plan 06 Task 3 commit `d372326c7`):
```
$ grep -rn "fixGoTrueNulls" tests/ apps/ packages/
tests/tests/utils/supabaseAdminClient.ts:117:  // Phase 78 CLEAN-05 WR-07: the prior `fixGoTrueNulls` method had ZERO callers
```

Only the explanatory comment remains. No external callers (verified). `safeListUsers` now independently handles the GoTrue NULL column bug via the short-circuit-on-error path at line 167-170.

## Lint Verification

Final lint sweep across all 12 touched files:
```
$ npx eslint --flag v10_config_lookup_from_file [12 files]
✖ 2 problems (0 errors, 2 warnings)
```

Both warnings are on `multi-election.spec.ts:197-198` — pre-existing `toHaveCount(2)` → `toHaveLength(2)` style suggestions, **not introduced by Phase 78 P06**. Per CLAUDE.md scope-boundary rule, deferred to a future hygiene pass (logged to deferred-items.md in a future plan if it recurs).

**Zero `playwright/no-raw-locators` errors. Zero `playwright/no-conditional-in-test` errors. Zero `playwright/no-networkidle` errors.**

## Smoke-Test Results

Per-cluster smoke tests deferred to operator execution (Plan 07 verification gate per project_gsd_repo_hook_workaround constraints — tests require running Supabase + Playwright browsers, which the executor agent cannot orchestrate alongside a commit-only flow). Plan 07's verification step should run:

- `yarn workspace tests test:e2e --workers=1 --grep "voter-popups"` (CR-02 smoke)
- `yarn workspace tests test:e2e --workers=1 --grep "multi-election"` (WR-01, WR-03, CR-01 smoke)
- `yarn workspace tests test:e2e --workers=1 --grep "constituency"` (WR-02a smoke)
- `yarn workspace tests test:e2e --workers=1 --grep "startfromcg"` (WR-02b smoke)
- `yarn workspace tests test:e2e --workers=1 --grep "auth.setup" --list` (WR-04 auth-setup project discoverability)
- `yarn workspace tests test:e2e --workers=1 --grep "candidate-bank-auth"` (IN-01, IN-02 keys + precedence smoke — env-gated, may not surface in default CI)
- `yarn workspace tests test:e2e --workers=1 --grep "voter results"` (IN-03c/d/e + IN-04 filter assertions)
- `yarn workspace tests test:e2e --workers=1 --grep "candidate"` (IN-03a/b + IN-03 bonus + IN-05 post-condition; full registration cycle exercises forceRegister rollback path on WR-05)

## Commit Trail

- `fffbf561e` — cluster A (CR-02a/b + WR-01 + WR-03 + CR-01 bonus): voter-popups.spec.ts + multi-election.spec.ts
- `443f1cf7a` — cluster B (WR-02a/b + WR-04 + IN-05): constituency.spec.ts + startfromcg.spec.ts + auth.setup.ts + data.setup.ts
- `d372326c7` — cluster C (WR-05/06/07 + IN-01/02): supabaseAdminClient.ts + candidate-bank-auth.spec.ts
- `7531119ad` — cluster D (IN-03a/b/c/d/e + IN-03 bonus + IN-04): candidate-questions.spec.ts + candidate-settings.spec.ts + voter-results.spec.ts + candidate-required-info.spec.ts

All commits use `git -c core.hooksPath=/dev/null` per `project_gsd_repo_hook_workaround.md`.

## 73-REVIEW.md Annotation

Per plan §verification, the per-finding resolution annotation on `73-REVIEW.md` is **deferred to Plan 07** (the verification gate plan). This SUMMARY's per-finding outcome table serves as the canonical resolution record; Plan 07 will copy the per-row dispositions into 73-REVIEW.md as a cross-link.

## Self-Check: PASSED

- ✅ All 14 findings closed (13 from 73-REVIEW.md + 1 bonus CR-01 fold)
- ✅ 4 cluster commits landed (`fffbf561e`, `443f1cf7a`, `d372326c7`, `7531119ad`) — verified via `git log --oneline -5`
- ✅ All 12 modified files exist and pass lint (0 errors)
- ✅ `fixGoTrueNulls` deleted (only the explanatory comment remains)
- ✅ `expect(true).toBe(true)` tautology gone from data.setup.ts
- ✅ `toBeLessThanOrEqual(initialCount)` strengthened to `toBeLessThan` (RESULTS-01 site)
- ✅ `SUPABASE_SERVICE_ROLE_KEY required` throw-on-missing in place
- ✅ 0 `playwright/no-raw-locators` errors (including the 2 deferred from Phase 78 P03)
- ✅ LANDMINE-2 cross-reference recorded inline in auth.setup.ts and in this SUMMARY
- ✅ LANDMINE-8 confirmed (no new 'Alpha'-containing sentinels)

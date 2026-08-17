---
phase: 111-candidatecontext-orchestrator-userdata-store
plan: 03
subsystem: ui
tags: [svelte5, runes, context-as-class, candidate-context, ssr, e2e-gate, phase-gate, bugfix]

# Dependency graph
requires:
  - phase: 111-01
    provides: "CandidateUserDataStoreImpl behind byte-identical candidateUserDataStore(opts) factory"
  - phase: 111-02
    provides: "CandidateContextProvider Svelte 5 class (two-base Object.assign inheritance, logout prototype-getter override)"
provides:
  - "Phase-111 quality gate evidence: build + full frontend unit + svelte-check (151 baseline) + candidate-journey + a11y-smoke all green"
  - "SSR fix: logout excluded from Object.assign(this, authContext) so the getter-only override no longer throws under strict-mode SSR"
affects: [candidate-app routes, candidate-app components, phase-111-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Getter-only override + Object.assign: destructure the overridden key OUT of the source before Object.assign, because writing to a getter-only accessor throws TypeError in strict-mode (SSR) ESM — the survives-clobber reasoning is necessary but NOT sufficient"

key-files:
  created:
    - .planning/phases/111-candidatecontext-orchestrator-userdata-store/111-03-SUMMARY.md
  modified:
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts

key-decisions:
  - "The Plan-02 logout LANDMINE fix was incomplete: a getter-only prototype accessor survives Object.assign (not own-enumerable) BUT Object.assign still ATTEMPTS the write and throws 'Cannot set property logout ... which has only a getter' in strict-mode SSR. Fixed by destructuring `logout` out of authContext (`const { logout: _inheritedLogout, ...authContextRest }`) before Object.assign(this, authContextRest); the inherited logout was already captured in #authLogout."
  - "This regression was invisible to the unit suite + build + svelte-check (all green both before and after) and only surfaced under the live SSR candidate-journey E2E — validating the phase-end live-gate decision (SC-4)."

patterns-established:
  - "When overriding an inherited member with a getter-only accessor AND reproducing inheritance via Object.assign, OMIT the overridden key from the assign source — survives-clobber is not enough; the write itself must be prevented."

requirements-completed: [CLASS-06]

# Metrics
duration: 7min
completed: 2026-06-13
---

# Phase 111 Plan 03: Phase-Gate (build + unit + svelte-check + candidate-journey + a11y-smoke) Summary

**Ran the Phase 111 quality gate once at phase end and it surfaced a real SSR regression from the Plan-02 class conversion — every candidate route 500'd with `Cannot set property logout of #<CandidateContextProvider> which has only a getter` because `Object.assign(this, authContext)` writes to the getter-only `logout` override. Fixed by destructuring `logout` out of the authContext before the assign; after the fix, build + full frontend unit (759) + svelte-check (151 baseline, zero new) + candidate-journey (1) + a11y-smoke (8) are all green, proving SC-4 — the candidate app behaves identically.**

## Performance
- **Duration:** ~7 min
- **Started:** 2026-06-13T01:13:31Z
- **Completed:** 2026-06-13T01:20:57Z
- **Tasks:** 2
- **Files modified:** 1 (+ 1 SUMMARY created)

## Accomplishments
- **Task 1 (static gate):** `yarn build` (full Turborepo workspace) green — 14/14 tasks; `cd apps/frontend && yarn vitest run` green — 57 files / 759 tests passed; `yarn svelte-check` at the exact 151-error baseline, 0 warnings, zero NEW errors (only the known pre-existing `qs` declaration, candidate-settings `currentPassword`/`confirmPasswordTestId`, and questions string-vs-number errors).
- **Task 2 (E2E gate):** seeded with the explicit `yarn db:reset && yarn db:seed --template e2e/base --likert-only` chain (22 → 20 questions, e2e/base built-in template applied — NOT db:reset-with-data per the CLAUDE.md Yarn arg-forwarding caveat); ran the `candidate-journey` + `a11y-smoke` Playwright projects. After the SSR fix: **13/13 passed (37.1s)** — candidate-journey (1 serial end-to-end journey incl. the password-setter step that previously 500'd), a11y-smoke (8 axe + navigation-a11y specs), plus the 4 setup/teardown chain steps. Zero failed, zero "did not run".
- **Deviation (Rule 1 bug fix):** caught and fixed the Plan-02 logout-override SSR regression (see below) — exactly the class of behavioral/SSR regression this live gate exists to catch.

## Task Commits
1. **Task 1 (static gate):** No source changes — verification-only; nothing to commit.
2. **Task 2 (E2E gate) — Rule 1 SSR fix:** `1327096e6` (fix) — exclude `logout` from `Object.assign(this, authContext)`.

## Files Created/Modified
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` — constructor now destructures `logout` out of `this.#authContext` (`const { logout: _inheritedLogout, ...authContextRest } = this.#authContext; Object.assign(this, authContextRest);`) so the getter-only `logout` prototype accessor is never written to. Added an inline LANDMINE-FIX comment documenting the strict-mode-SSR root cause.
- `.planning/phases/111-candidatecontext-orchestrator-userdata-store/111-03-SUMMARY.md` — this phase-gate evidence file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SSR `Cannot set property logout` TypeError in CandidateContextProvider**
- **Found during:** Task 2 (first candidate-journey E2E run — candidate route rendered the 500 error page at the password-setter step; dev log showed `Server error: TypeError: Cannot set property logout of #<CandidateContextProvider> which has only a getter` at `candidateContext.svelte.ts:294` in `new CandidateContextProvider`).
- **Issue:** Plan 02 exposed the `logout` override as a getter-ONLY prototype accessor and reproduced authContext inheritance via `Object.assign(this, this.#authContext)`. The Plan-02 reasoning ("a prototype getter is not own-enumerable, so Object.assign does not clobber it") is necessary but NOT sufficient: under SSR the server renderer runs strict-mode ESM, where `Object.assign` ATTEMPTING to write authContext's own-enumerable `logout` arrow onto a getter-only accessor throws `TypeError`. The getter survives, but the write itself throws — 500ing every candidate route. Invisible to the unit suite + build + svelte-check (all green both before and after); only the live SSR candidate-journey E2E exposed it.
- **Fix:** Destructure `logout` out of the authContext source before the assign: `const { logout: _inheritedLogout, ...authContextRest } = this.#authContext; Object.assign(this, authContextRest);`. The inherited logout was already captured separately in `#authLogout` (line 102) and is wrapped by the unchanged `get logout()` prototype getter, so behavior is identical.
- **Files modified:** `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts`
- **Commit:** `1327096e6`
- **Verification of fix:** post-fix svelte-check still 151 (zero new); build green; unit 759/759; `lint:check` adds zero new errors (`_inheritedLogout` matches the `^_` varsIgnorePattern; the `#questionCategories` lint error is pre-existing baseline across all *Context.svelte.ts files); fresh-restarted dev server — `/candidate` returns 303 (login redirect, expected) instead of 500, `/candidate/register` returns 200, zero `Server error` in the dev log; candidate-journey + a11y-smoke 13/13 green.

## Issues Encountered
- The first candidate-journey E2E run failed (Test timeout 90000ms at the password-setter `.fill`), with the page snapshot showing the 500 error page. Diagnosed from the dev-server log as a deterministic SSR `TypeError` (not stale HMR). Restarted the dev server fresh after the fix (per project memory — Vite HMR serves stale SSR/large modules after a large context-module change) to trust the re-run. The re-run passed 13/13.
- svelte-check 151 baseline errors and the `no-unused-private-class-members` lint errors are pre-existing and out of scope per the scope boundary (confirmed identical pre/post change via a temporary stash comparison on the main working tree).

## Verification
- `yarn build` (workspace) → 14/14 tasks successful (frontend built in ~7.9s)
- `cd apps/frontend && yarn vitest run` → 57 files / 759 tests passed
- `cd apps/frontend && yarn svelte-check` → 2667 files, **151 ERRORS, 0 WARNINGS** (exact baseline; zero new)
- `yarn db:reset && yarn db:seed --template e2e/base --likert-only` → e2e/base applied, 22→20 questions (Likert-only), 137 rows seeded
- `yarn test:e2e --project=candidate-journey --project=a11y-smoke` → **13 passed (37.1s)** — candidate-journey 1/1, a11y-smoke 8/8, + 4 setup/teardown; zero failed, zero "did not run"
- Fresh dev-server SSR smoke: `/candidate` → 303 (expected login redirect), `/candidate/register` → 200, zero `Cannot set property logout` / `Server error` in the dev log
- Dev server torn down cleanly afterward (port 5173 free)

## E2E Evidence (per-project pass counts)
- **candidate-journey:** 1 passed (the full serial end-to-end candidate journey @candidate — preregister/login/profile-edit/save/logout/password-setter), 0 failed, 0 did-not-run
- **a11y-smoke:** 8 passed (axe scans: elections-selector, results, constituencies-selector, home, questions, voter-detail-drawer; navigation-a11y: route announcer is route-derived, focus lands on heading after Q→Q nav), 0 failed
- **setup/teardown chain:** 4 passed (data-setup-base, data-setup-candidate-journey, data-teardown-candidate-journey, data-teardown-base)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLASS-06 SC-4 satisfied: the candidate app behaves identically after the candidateContext orchestrator + candidateUserDataStore composite class conversions, proven by the live candidate-journey + a11y-smoke gate.
- Phase 111 is now ready to close. One real SSR regression from the Plan-02 conversion was caught and fixed here — the phase-end live-gate decision (over relying on unit + build + svelte-check, all of which were green) was vindicated.
- LANDMINE follow-up captured as a pattern: getter-only override + Object.assign inheritance requires OMITTING the overridden key from the assign source. The Phase-110 VoterContextProvider single-base precedent and Phase-107 AuthContextProvider should be audited if either reuses a getter-only override over an Object.assign'd member (logout is the only such override in candidateContext).

## Self-Check: PASSED
- FOUND: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
- FOUND: .planning/phases/111-candidatecontext-orchestrator-userdata-store/111-03-SUMMARY.md
- FOUND commit: 1327096e6

---
*Phase: 111-candidatecontext-orchestrator-userdata-store*
*Completed: 2026-06-13*

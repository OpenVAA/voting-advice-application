---
phase: 121-e2e-specs-flow-coverage
plan: 03
subsystem: testing
tags: [playwright, e2e, nav-menu, candidate-auth, voter-perms, eflow-09]

# Dependency graph
requires:
  - phase: 119-e2e-fixtures
    provides: navMenu fixture (createNavMenu / expectNavMenuItems / openMobileNav) built + verified
  - phase: 121-e2e-specs-flow-coverage
    provides: EPERM-02 perm datasets (perm-1e1cg1co / perm-disable-election-1co) with not-selectable seeds
provides:
  - EFLOW-09 candidate nav-menu logged-out vs logged-in auth-state assertions in candidate-journey.spec.ts
  - EFLOW-09 D-02 voter conditional nav-item omission (Select an election / Select your constituency) on the existing EPERM-02 perm seeds
affects: [e2e-coverage, navMenu-fixture-consumers, eflow-09-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auth-state nav-menu assertion: exact-list expectNavMenuItems for the nav-menu-item set + separate candidate-nav-* testid presence check for the testid-overridden auth group"
    - "Conditional nav-item omission proof: open drawer, anchor on the always-present leading Close menu item, assert the conditional item locator has count 0"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/perm/perm-1e1cg1co.spec.ts
    - tests/tests/specs/perm/perm-disable-election-1co.spec.ts

key-decisions:
  - "Logged-in candidate auth nav group (Start/Basic Information/Your Opinions/Preview/Settings) is asserted via its own candidate-nav-* testids, NOT through the navMenu fixture's nav-menu-item reader — NavItem.svelte spreads the caller's data-testid over its default nav-menu-item, hiding those items from items()."
  - "The active-locale language item is a disabled link (loc === currentLocale) with an EMPTY accessible name, so its slot in the exact expectNavMenuItems list is matched with /^$/."
  - "candidate-journey 3x determinism is gated WITH its setup deps each run (the spec is a stateful registration journey; the setup unregisters the candidate). --no-deps reruns are not valid for it. The perm D-02 specs are assert-only/read-only and pass repeatably."

patterns-established:
  - "navMenu testid-override caveat: items() (nav-menu-item) does not see NavItems that pass their own data-testid; assert those via their explicit testid."

requirements-completed: [EFLOW-09]

# Metrics
duration: 75min
completed: 2026-06-16
---

# Phase 121 Plan 03: E2E Flow Coverage — Candidate Auth-State Nav + Voter Conditional Nav Omission Summary

**EFLOW-09 now asserts the candidate nav-menu differs by auth state (logged-out login/register set vs logged-in candidate-nav-* group) and, per D-02, that the voter "Select an election" / "Select your constituency" items are omitted on the existing not-selectable EPERM-02 seeds — all green to the 3x cardinal gate and in the full 113/113 suite.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- EFLOW-09 candidate nav-menu auth-state assertions: logged-out exact item set (Sign in / Registration / Forgot Password? present) on /candidate/privacy, logged-in set (login/register dropped, candidate-nav-* auth group present), and the two sets asserted to differ.
- EFLOW-09 D-02 voter conditional-nav-item omission: both EPERM-02 perm specs assert "Select an election" and "Select your constituency" are omitted from the voter nav-menu on their not-selectable seeds — riding the existing datasets, no new dataset.
- All three edited specs pass 3x (candidate-journey gated with its setup deps; perm specs assert-only) and pass inside the full ordered suite (113/113).

## Task Commits

1. **Task 1: EFLOW-09 candidate nav-menu logged-out vs logged-in** - `161cb50d1` (test)
2. **Task 2: EFLOW-09 D-02 voter conditional nav-item omission on EPERM-02 seeds** - `7281385f9` (test)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-journey.spec.ts` - Added step 2.5 (logged-out nav-menu exact-list assertion) + step 19.5 (logged-in nav-menu: nav-menu-item set + candidate-nav-* auth group presence + login/register absence + the two sets differ). Added module-scope CANDIDATE_NAV_LOGGED_OUT / CANDIDATE_NAV_LOGGED_IN regex lists and the assertCandidateAuthNavPresent helper.
- `tests/tests/specs/perm/perm-1e1cg1co.spec.ts` - Added voter nav-menu open + assertion that "Select an election" / "Select your constituency" items are omitted (count 0) on the 1e/1cg/1co not-selectable seed.
- `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` - Same D-02 omission assertion on the disallowSelection + single-shared-CO seed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking finding] navMenu fixture cannot see the authenticated candidate nav group**
- **Found during:** Task 1
- **Issue:** The plan's intended logged-in assertion ("profile/questions present via expectNavMenuItems") could not work as written. `NavItem.svelte` renders `data-testid="nav-menu-item"` BEFORE spreading `{...concatClass(restProps, ...)}`; when a NavItem is given its own `data-testid` (the candidate auth group uses `candidate-nav-home/profile/questions/preview/settings`), the spread OVERRIDES the `nav-menu-item` testid. So the navMenu fixture's `items()` reader (which filters `nav-menu-item`) does NOT resolve the authenticated candidate nav group at all — only the static help/privacy/feedback/language items retain `nav-menu-item`.
- **Fix:** Split the logged-in assertion into two halves — (a) `expectNavMenuItems` on the `nav-menu-item` set (which has DROPPED login/register/forgot-password vs logged-out), and (b) assert the authenticated group present via its explicit `candidate-nav-*` testids, plus assert Sign in / Registration absent. The combination (login/register gone AND candidate-nav-* present) is the auth-state difference. This is an assertion-design adjustment, not an app-code change.
- **Files modified:** tests/tests/specs/candidate/candidate-journey.spec.ts
- **Commit:** 161cb50d1

**2. [Rule 1 - Assertion correctness] active-locale item has an empty accessible name**
- **Found during:** Task 1
- **Issue:** `toHaveAccessibleName(/^English$/)` failed on the current-locale language item. `LanguageSelection.svelte` renders the current locale's NavItem with `disabled={loc === currentLocale}`; NavItem drops `href` and sets `aria-disabled` for a disabled link, so the item computes an EMPTY accessible name.
- **Fix:** Matched the active-locale slot in the exact-list with `/^$/` (empty accessible name) instead of the language label.
- **Files modified:** tests/tests/specs/candidate/candidate-journey.spec.ts
- **Commit:** 161cb50d1

**3. [Rule 1 - Type] ReadonlyArray not assignable to expectNavMenuItems param**
- **Found during:** Task 1 (typecheck)
- **Issue:** `expectNavMenuItems(expected: Array<RegExp|string>)` rejects a `ReadonlyArray<RegExp>` constant.
- **Fix:** Spread the frozen constant into a mutable array at the call sites (`[...CANDIDATE_NAV_LOGGED_OUT]`).
- **Files modified:** tests/tests/specs/candidate/candidate-journey.spec.ts
- **Commit:** 161cb50d1

## Determinism / E2E Gate

- **candidate-journey:** 3x green WITH its setup deps (stateful registration journey — `--no-deps` reruns are invalid because the candidate is left registered; the setup project unregisters it each run). Verified 3/3.
- **perm-1e1cg1co + perm-disable-election-1co:** the two edited specs pass every run. Note: running ONLY the perm subset via `--project=perm-1e1cg1co --project=perm-disable-election-1co` surfaces an INTERMITTENT pre-existing failure in `voter-journey` (a transitive dependency of the perm setup chain) — the perm-setup serial chain over the shared `app_settings` singleton interleaves badly when only a perm subset is spawned. `voter-journey` passes cleanly in isolation (`--project=voter-journey`, 3/3) and in the full ordered suite. NOT caused by this plan's edits (voter-journey is untouched).
- **Full suite:** `yarn test:e2e` → **113 passed (8.6m)**, 0 failed — the trusted cardinal signal.
- **Lint/typecheck:** clean on all three edited specs (pre-existing unused-var warnings in @openvaa/core + @openvaa/dev-seed are out of scope).

## Known Stubs

None — assert-only edits against existing seeds and the pre-built navMenu fixture.

## Threat Flags

None — test-only assertions against existing candidate-journey + EPERM-02 datasets; no new production surface, no new auth code, no package installs.

## Self-Check: PASSED

- Files: candidate-journey.spec.ts, perm-1e1cg1co.spec.ts, perm-disable-election-1co.spec.ts, 121-03-SUMMARY.md — all FOUND.
- Commits: 161cb50d1, 7281385f9 — all FOUND in git history.

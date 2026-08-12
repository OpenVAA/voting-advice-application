---
phase: 125-svelte-check-0-trivial-tier
plan: 02
subsystem: frontend
tags: [svelte-check, typescript, dead-code, admin-jobs, auth, api-routes]

# Dependency graph
requires:
  - phase: 125-svelte-check-0-trivial-tier
    provides: TYPE-01 qs types landed (Wave 1) — node_modules settled, active/past already qs-clean
  - phase: 125-svelte-check-0-trivial-tier
    provides: TYPE-02 cluster scoping (RESEARCH.md TYPE-02 Mechanics + D-02 no-widen decision)
provides:
  - "6 admin-jobs +server.ts routes with the dead `cookies` argument removed — resolves all admin-jobs cookies excess-property errors"
  - "svelte-check total lowered 143 → 137 (−6) with zero net-new errors"
affects: [125-04 (D-04 phase-total gate plan)]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Behavior-neutral dead-argument removal aligning a call site to its source-of-truth helper signature without widening the helper (D-02)"]

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/api/admin/jobs/abort-all/+server.ts
    - apps/frontend/src/routes/api/admin/jobs/active/+server.ts
    - apps/frontend/src/routes/api/admin/jobs/past/+server.ts
    - apps/frontend/src/routes/api/admin/jobs/start/+server.ts
    - apps/frontend/src/routes/api/admin/jobs/single/[jobId]/abort/+server.ts
    - apps/frontend/src/routes/api/admin/jobs/single/[jobId]/progress/+server.ts

key-decisions:
  - "Removed `cookies` from BOTH the handler destructure AND the getUserData call in every file (per Pitfall 2) — dropping only the call-site property would leave an unused destructured binding the ESLint no-unused-vars gate rejects"
  - "getUserData signature deliberately NOT widened and cookies NOT threaded through (D-02) — getUserData.ts is untouched; the source-of-truth `{ fetch, parent? }` shape stays byte-identical"
  - "Auth gate (`getUserData({ fetch }).role !== 'admin'`) left byte-identical apart from the removed token — behavior-neutral; behavior-neutrality proven at the D-04 full-E2E gate (125-04)"

patterns-established:
  - "Per-cluster edit lands in one atomic commit touching only the cluster's files so bisect can isolate it and per-cluster error accounting stays exact"

requirements-completed: [TYPE-02]

coverage:
  - id: D1
    description: "All 6 admin-jobs routes drop `cookies` from both the destructure and the getUserData call; getUserData.ts unchanged"
    requirement: TYPE-02
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && grep -rc 'cookies' src/routes/api/admin/jobs/ → all :0 (NO_COOKIES_REMAIN)"
        status: pass
    human_judgment: false
  - id: D2
    description: "admin-jobs cookies cluster at zero svelte-check errors and zero admin-jobs errors of any kind"
    requirement: TYPE-02
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && yarn check → 0 \"'cookies' does not exist\" and 0 'api/admin/jobs' (total 143 → 137)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No unused-var fallout from the destructure edits — lint clean for the 6 files"
    requirement: TYPE-02
    verification:
      - kind: automated_ui
        ref: "cd apps/frontend && npx eslint src/routes/api/admin/jobs/ → exit 0, no violations"
        status: pass
    human_judgment: false

# Metrics
duration: 2min
completed: 2026-07-15
status: complete
---

# Phase 125 Plan 02: TYPE-02 admin-jobs cookies Cluster Summary

**Removed the dead `cookies` argument from all 6 `api/admin/jobs/**/+server.ts` routes — from both the request-event destructure and the `getUserData({ fetch, cookies })` call — clearing the admin-jobs cookies excess-property cluster with zero net-new errors (143 → 137). getUserData was not widened; the admin auth gate is byte-identical apart from the dropped token.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-07-15T19:38:21Z
- **Completed:** 2026-07-15T19:40:00Z
- **Tasks:** 2 (edits + verify/commit — one atomic commit)
- **Files modified:** 6 admin-jobs route handlers

## Accomplishments
- Removed `cookies` from each handler's request-event destructure while keeping every other param (`url`, `request`, `params`, `fetch`) exactly as-is, per the per-file map in RESEARCH.md:
  - abort-all `{ fetch, cookies, request }` → `{ fetch, request }`
  - active `{ url, cookies, fetch }` → `{ url, fetch }`
  - past `{ url, fetch, cookies }` → `{ url, fetch }`
  - start `{ fetch, cookies, request }` → `{ fetch, request }`
  - single/[jobId]/abort `{ params, request, fetch, cookies }` → `{ params, request, fetch }`
  - single/[jobId]/progress `{ fetch, cookies, params }` → `{ fetch, params }`
- Removed `cookies` from the identical `getUserData({ fetch, cookies })` call in all 6 files → `getUserData({ fetch })`.
- `getUserData.ts` untouched — signature not widened, cookies not threaded through (D-02).
- svelte-check total dropped 143 → 137 (exactly −6, zero net-new); lint clean.

## Task Commits

The TYPE-02 cluster is a single atomic commit (dead-code removal, 6 files):

1. **Task 1 + Task 2 (TYPE-02 cluster)** - `b46b6abcb` (fix)

## Files Created/Modified
- `apps/frontend/src/routes/api/admin/jobs/abort-all/+server.ts` - dropped `cookies` from POST destructure + getUserData call.
- `apps/frontend/src/routes/api/admin/jobs/active/+server.ts` - dropped `cookies` from GET destructure + getUserData call.
- `apps/frontend/src/routes/api/admin/jobs/past/+server.ts` - dropped `cookies` from GET destructure + getUserData call.
- `apps/frontend/src/routes/api/admin/jobs/start/+server.ts` - dropped `cookies` from POST destructure + getUserData call.
- `apps/frontend/src/routes/api/admin/jobs/single/[jobId]/abort/+server.ts` - dropped `cookies` from POST destructure + getUserData call.
- `apps/frontend/src/routes/api/admin/jobs/single/[jobId]/progress/+server.ts` - dropped `cookies` from GET destructure + getUserData call.

## Decisions Made
- **Both lines removed per file (Pitfall 2):** `cookies` was dropped from the destructure AND the call in each file. Removing only the call-site property would leave an unused destructured binding that the mandatory `@typescript-eslint/no-unused-vars` gate rejects. Lint confirms no fallout.
- **getUserData not widened (D-02):** The source-of-truth helper `{ fetch, parent? }` is untouched. `cookies` was a dead argument the helper already ignored at runtime (session is cookie-based via the forwarding server `fetch`, per the getUserData.ts docstring). Only the excess call-site property + its now-unused destructure were removed — no auth-plumbing change.
- **Auth gate behavior-neutral:** Each `getUserData({ fetch }).role !== 'admin'` guard is byte-identical apart from the removed token. Runtime auth is unchanged.

## Flagged Assumptions — Resolved
- **[Prohibition D-02 — flagged-unverified]** getUserData not widened / cookies not threaded through. **Verified:** `getUserData.ts` is not in the commit diff; only the 6 route files changed, each dropping the token from destructure + call. Confirmed.
- **[Prohibition auth-neutrality — flagged-unverified]** `role !== 'admin'` gate + session resolution unchanged. **Verified at this plan's scope** by byte-diff (only `cookies` removed). Full runtime proof deferred to the D-04 full-E2E gate (125-04), which exercises admin flows — per the plan's own division of labor.
- **[Edge-probe TYPE-02 / concurrency]** Per-file edits independent + idempotent; the authoritative count is the single `yarn check` re-run, which reads 137 with 0 admin-jobs errors — no false pass from partial state.

## Deviations from Plan
None - plan executed exactly as written. Both tasks' acceptance criteria met; only the 6 admin-jobs route files touched (Pitfall 4 satisfied — no adjacent non-cookies error touched).

## Threat Mitigation
- **T-125-02 (Elevation of Privilege, high, mitigate):** admin auth gate mitigation preserved — `getUserData({ fetch }).role !== 'admin'` remains byte-identical apart from the dead token. No trust-boundary change.
- **T-125-02b (Tampering, low, mitigate):** getUserData signature not codified with a dead parameter — helper untouched.
No new security-relevant surface introduced.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TYPE-02 cluster fully resolved and committed atomically. svelte-check total now 137 (from the 143 Wave-1 baseline).
- Ready for the remaining trivial-tier cluster (Plan 03) and the D-04 phase-total gate (Plan 04), which asserts the full reduction and runs the behavior-neutrality E2E proof.

## Self-Check: PASSED

- 6 admin-jobs `+server.ts` files contain no `cookies` token — FOUND (grep → NO_COOKIES_REMAIN)
- `apps/frontend/src/lib/auth/getUserData.ts` not modified — FOUND (absent from commit diff)
- Commit `b46b6abcb` — FOUND
- `125-02-SUMMARY.md` — FOUND

---
*Phase: 125-svelte-check-0-trivial-tier*
*Completed: 2026-07-15*

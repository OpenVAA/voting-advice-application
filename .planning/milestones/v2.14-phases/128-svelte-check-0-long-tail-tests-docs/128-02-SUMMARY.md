---
phase: 128-svelte-check-0-long-tail-tests-docs
plan: 02
subsystem: testing
tags: [svelte-check, typescript, supabase-adapter, auth, testids, type-truth]

# Dependency graph
requires:
  - phase: 127
    provides: prepareDataWriter(dataWriter: UniversalDataWriter) seam (must keep compiling)
  - phase: 128 (Plan 01)
    provides: SupabaseAdapterConfig typed-local pattern for the serverClient excess-property check
provides:
  - Concrete-typed candidate +layout.server.ts SSR init handles (serverClient typechecks)
  - AuthContext.setPassword type widened to { currentPassword?; password } mirroring the writer shim
  - settings/+page.svelte free of the dead confirmPasswordTestId prop
  - testIds catalogue reconciled to the component-hardcoded confirmation id (dead entry removed)
affects: [128-05 (E2E live gate), svelte-check-zero milestone gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Typed-local SupabaseAdapterConfig at the SSR init site (subtype value assignable to AdapterConfig sidesteps the mixin-erased widened init override without widening the universal layer — D-01)"
    - "Wrapper-level optional shim param (currentPassword?) defaulted to '' when forwarding to the writer's required shim — models the real 3-flow call surface truthfully while staying behavior-neutral"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
    - apps/frontend/src/lib/contexts/auth/authContext.type.ts
    - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
    - apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte
    - tests/tests/utils/testIds.ts

key-decisions:
  - "currentPassword made OPTIONAL (not required) at the AuthContext wrapper — the wrapper serves three flows (settings change-password supplies it; register first-set and password-reset post-recovery omit it). Required would have introduced 2 net-new svelte-check errors, violating the phase's hard zero-net-new gate. Optional still accepts { currentPassword, password } (must_have satisfied) and stays truthful to the actual call surface."
  - "Used the Plan-01 typed-local pattern for the SSR seam rather than retyping the exported dataWriter/dataProvider promise — smallest honest footprint, universal layer untouched (D-01)."

patterns-established:
  - "Pattern 1: SupabaseAdapterConfig typed local at .init() call sites clears the serverClient excess-property error without touching universalAdapter.type.ts."
  - "Pattern 2: Optional wrapper shim param + impl default when the wrapper fans out to more flows than the underlying writer's single required shape."

requirements-completed: [TYPE-07]

coverage:
  - id: D1
    description: "Candidate +layout.server.ts SSR init handles accept serverClient (2 seam errors cleared at 27:28 and 67:30); prepareDataWriter UniversalDataWriter seam still compiles."
    requirement: "TYPE-07"
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at +layout.server.ts; overall 9→7 after Task 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "setPassword type aligned with the writer shim; settings-page call at 52:40 and dead prop at 121:11 cleared; register/password-reset call sites stay green; dead testIds entry removed (grep-unreferenced)."
    requirement: "TYPE-07"
    verification:
      - kind: other
        ref: "cd apps/frontend && yarn check — 0 errors at settings/+page.svelte; overall 7→5, zero net-new"
        status: pass
      - kind: other
        ref: "grep -rn 'settings.confirmPassword|settings-confirm-password' tests apps/frontend/src — NONE remaining"
        status: pass
    human_judgment: false
  - id: D3
    description: "Runtime password behavior unchanged across all three flows (currentPassword remains a Supabase-side no-op; the wrapper defaults it to '' exactly as the former hardcode did) — Pitfall 1."
    verification: []
    human_judgment: true
    rationale: "Type-only change; the behavior-neutrality of the password flows (settings change, register first-set, reset post-recovery) is proven at runtime by the Plan-05 live E2E gate, not by svelte-check."

# Metrics
duration: 6min
completed: 2026-07-16
status: complete
---

# Phase 128 Plan 02: Production-Side Type-Truth Seams Summary

**Cleared the 4 production svelte-check errors — concrete-typed the candidate SSR serverClient seam and aligned the setPassword type with the writer shim — landing frontend svelte-check at exactly 5 errors / 1 warning with zero net-new.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-16T18:13Z
- **Completed:** 2026-07-16T18:19:06+03:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Concrete-typed the two `+layout.server.ts` SSR `init({ fetch, serverClient })` handles via `SupabaseAdapterConfig` typed locals — 2 seam errors cleared, universal adapter layer untouched (D-01), Phase-127 `prepareDataWriter` seam still compiles (Pitfall 2).
- Widened `AuthContext.setPassword` to `{ currentPassword?; password }` mirroring the writer's real shim (`universalDataWriter.ts:147`); the settings-page call now typechecks with no edit to the call itself.
- Removed the dead `confirmPasswordTestId` prop on `PasswordSetter` (it fell into `<form>` restProps and never rendered a usable id) and the dead `candidate.settings.confirmPassword` testIds catalogue entry (grep-confirmed unreferenced) — the live confirmation id is the component-hardcoded `password-setter-confirmation` (D-03).
- Frontend `yarn check`: 9 errors / 1 warning → **5 errors / 1 warning**, the exact prior-wave target, zero net-new.

## Task Commits

Each task was committed atomically:

1. **Task 1: Concrete-type the candidate +layout.server.ts serverClient seam** - `5e799bcae` (fix)
2. **Task 2: Widen setPassword type-truth, drop dead confirm-password prop, reconcile testIds** - `47d4bdefb` (fix)

_Plan metadata commit follows this summary._

## Files Created/Modified
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` - Two `SupabaseAdapterConfig` typed locals so the SSR `init({ fetch, serverClient })` calls typecheck.
- `apps/frontend/src/lib/contexts/auth/authContext.type.ts` - `setPassword` param widened to `{ currentPassword?: string; password: string }`.
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` - impl accepts optional `currentPassword`, defaults to `''` when forwarding to the writer (behavior-neutral).
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte` - dead `confirmPasswordTestId` prop pass removed.
- `tests/tests/utils/testIds.ts` - dead `candidate.settings.confirmPassword` entry removed, replaced with an explanatory pointer to `candidate.passwordSetter.confirm`.

## Decisions Made
- **`currentPassword` optional, not required (deviation — see below).** The plan artifact literally specified widening to `{ currentPassword: string; password: string }` (required), but that assumed the settings page was the only `setPassword` caller. Two further callers (`candidate/register/password/+page.svelte:81`, `candidate/password-reset/+page.svelte:65`) call `setPassword({ password })` — these flows have no current password (first-set / post-recovery). Required would have introduced 2 net-new errors, violating the phase's hard zero-net-new gate. Optional satisfies the must_have ("accepts `{ currentPassword, password }`"), models the real call surface truthfully, and keeps runtime behavior identical.
- **Typed-local over promise-retype for the SSR seam.** Reused Plan-01's `SupabaseAdapterConfig` typed-local pattern — smallest honest annotation, `universalAdapter.type.ts` untouched (D-01 verified via `git diff`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / plan gap] setPassword widening broke two undocumented call sites**
- **Found during:** Task 2 (setPassword type-truth widening)
- **Issue:** Widening `setPassword` to require `currentPassword: string` (as the plan literally specified) surfaced 2 net-new svelte-check errors at `candidate/register/password/+page.svelte:81:40` and `candidate/password-reset/+page.svelte:65:40`, which call `setPassword({ password })`. The planner enumerated only the settings page as a caller.
- **Fix:** Made `currentPassword` OPTIONAL (`{ currentPassword?: string; password: string }`) at the AuthContext wrapper; the impl defaults it to `''` when forwarding to the writer's required shim — behavior-neutral (the former impl hardcoded `currentPassword: ''`). Still accepts `{ currentPassword, password }`, so the must_have holds.
- **Files modified:** `authContext.type.ts`, `authContext.svelte.ts`
- **Verification:** `cd apps/frontend && yarn check` → 5 errors / 1 warning; register + password-reset call sites green; the 4 target errors cleared with zero net-new.
- **Committed in:** `47d4bdefb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug / plan gap)
**Impact on plan:** The optional-vs-required choice is the only substantive divergence and was mandatory to honor the phase's zero-net-new gate. No scope creep; runtime behavior unchanged.

## Issues Encountered
None beyond the deviation above.

## Pitfall Flags

- **Pitfall 1 (flagged, out of scope):** the settings page's `currentPassword` field is UI-collected but backend-unverified — Supabase's session-based password change verifies the active session (cookies), not the old password. This is a pre-existing product concern (threat register T-128-02-02, disposition `transfer`), unchanged by this type-only plan. It maps to the standing Strapi-era auth-flow backlog (`password-reset-code-method.md` / auth-flow investigation) and is deferred; no new todo filed as the observation is already captured in the phase threat model.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Frontend svelte-check at 5 errors / 1 warning; the remaining 5 (`FeedbackPopup`, `viewTransition`, `EntityInfo`, voter `questions/+layout`, candidate `questions/[questionId]`) are the long-tail targets for the sibling plans (128-03/04).
- `universalAdapter.type.ts` and `PasswordSetter.svelte` hardcoded ids confirmed untouched — the Plan-05 E2E live gate can re-prove nothing consumed the removed catalogue entry.

## Self-Check: PASSED

---
*Phase: 128-svelte-check-0-long-tail-tests-docs*
*Completed: 2026-07-16*

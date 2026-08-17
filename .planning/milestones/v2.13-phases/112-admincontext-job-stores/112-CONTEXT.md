# Phase 112: adminContext + Job Stores - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart discuss — infrastructure phase detected (class conversion; admin surface unbroken; technical success criteria only)

<domain>
## Phase Boundary

The `adminContext` and client `jobStores` contexts are classes, preserving the v2.11 explicit auth-forwarding fix. Requirement CLASS-07.

Success criteria from ROADMAP:
1. `adminContext` is a class, and the client `admin/jobStores` context (the `$state` Map registry + its `$derived` projections) is a class.
2. The v2.11 explicit auth-forwarding fix is preserved — `isAuthenticated` is a getter that re-reads the live `authContext.isAuthenticated` `$derived`, and the four auth functions are direct reference forwards; there is NO `{ ...authContext }` spread regression (which would drop the reactive getter and re-introduce the AdminNav production bug).
3. The `appContext` composition uses explicit getter forwarding consistent with Phase 109 (no instance-spread of the class).
4. `yarn build` + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; the admin surface is unbroken.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — pure infrastructure phase. Follow:
- Phase 110/111 sibling-orchestrator conversions (VoterContextProvider, CandidateContextProvider) as primary analogs.
- **LANDMINE (from Phase 111 E2E catch, commit 1327096e6):** writing to a name that exists as a getter-only prototype accessor via `Object.assign` throws TypeError in strict-mode SSR. adminContext's `isAuthenticated` MUST be a prototype getter re-reading live `authContext.isAuthenticated` — therefore if the conversion uses `Object.assign(this, appContext-or-authContext-source)`, any key colliding with a prototype getter must be excluded from the assign source first. Per SC-2 there must be NO `{ ...authContext }` spread at all — the four auth functions are direct reference forwards (arrow/field assignments of the live references), and isAuthenticated is a live-delegating getter.
- Audit consumers: does anything spread `{ ...adminContext }`? (decides own member shapes; likely zero like voter/candidate).
- adminContext composes appContext — the current code may spread `{ ...appContext }` (L98 noted in earlier audits); reproduce via `Object.assign(this, appContext)` (own-enumerable since Phase 109), excluding any getter-colliding keys.
- jobStores: `$state` Map registry + `$derived` projections → class; preserve registry semantics + factory signatures byte-identical.
- D1 field-init order; arrow fields for detached methods; @internal + type-only barrel precedent; back-compat handles until Phase 113.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` (+ `.type.ts`) — conversion target; v2.11 explicit auth-forwarding fix lives here (do not regress).
- `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts` (+ `.type.ts`) — `$state` Map registry target.
- VoterContextProvider / CandidateContextProvider — sibling analogs incl. the logout-exclusion mechanic (candidateContext.svelte.ts, commit 1327096e6).

### Established Patterns
- Object.assign inheritance from own-enumerable class instances WITH getter-collision exclusion; prototype getters for own reactive accessors; live-delegating getters for cross-context forwards; arrow-function fields; $deriveds as field initializers in D1 order; $effects in constructor; @internal + type-only barrel export.

### Integration Points
- Admin routes/components consuming `getAdminContext()` — byte-identical.
- Test gate: `yarn build` + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` (151 baseline, zero new). No E2E required this phase (admin E2E coverage lands via Phase 116 full gate).

</code_context>

<specifics>
## Specific Ideas

Roadmap marks 110 ∥ 111 ∥ 112; sequential in this run. Lightest of the three sibling phases.

</specifics>

<deferred>
## Deferred Ideas

None — discuss skipped (infrastructure detection). Handle flatten → Phase 113; jobStore naming exclusions documented at Phase 114 (RENAME).

</deferred>

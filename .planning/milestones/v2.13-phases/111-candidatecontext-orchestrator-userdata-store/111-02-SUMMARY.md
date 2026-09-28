---
phase: 111-candidatecontext-orchestrator-userdata-store
plan: 02
subsystem: ui
tags: [svelte5, runes, context-as-class, candidate-context, orchestrator, two-base-inheritance, refactor]

# Dependency graph
requires:
  - phase: 111-01
    provides: "CandidateUserDataStoreImpl behind byte-identical candidateUserDataStore(opts) factory — imported unchanged at candidateContext.svelte.ts:11"
  - phase: 110-votercontext-orchestrator
    provides: "VoterContextProvider orchestrator-class precedent (Object.assign inheritance, readonly x! inherited-member block, prototype-getter reactive accessors, D1 field-init order, type-only barrel)"
  - phase: 107-authcontext
    provides: "AuthContextProvider — own-enumerable isAuthenticated accessor + 4 arrow-field DataWriter wrappers reproduced via Object.assign(this, #authContext)"
provides:
  - "CandidateContextProvider Svelte 5 class implements CandidateContext, constructed via new CandidateContextProvider() inside initCandidateContext()"
  - "Two-base inheritance: Object.assign(this, #appContext) + Object.assign(this, #authContext) replacing the L366-367 spreads"
  - "logout override as a prototype getter (survives Object.assign — the LANDMINE) delegating to a private #logout arrow"
  - "Narrowed candidate barrel (type-only class export + getCandidateContext/initCandidateContext)"
affects: [candidate-app routes, candidate-app components, 111-03-e2e-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator-class on TWO inherited bases (app + auth) via two Object.assign calls — extends the single-base VoterContextProvider precedent"
    - "Inherited-method override (logout) as a prototype getter delegating to a private arrow — prototype members are not own-enumerable so Object.assign does not clobber them"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/candidate/index.ts

key-decisions:
  - "logout exposed as a PROTOTYPE GETTER delegating to a private #logout arrow (NOT an arrow field) — field initializers run before the constructor body, so an arrow-field logout would be clobbered by Object.assign(this, #authContext); the prototype getter is not own-enumerable and survives"
  - "#userData declared AFTER #answersLocked + #reactiveLocale (D1) because its getter-thunks read them"
  - "All OWN surface members exposed as plain prototype get/set accessors (zero-spread audit) — only the inherited app+auth members need Object.assign own-enumerable reproduction"

patterns-established:
  - "Two-base context-orchestrator class idiom: Object.assign(this, #appContext) + Object.assign(this, #authContext) + inherited-method override via prototype getter"

requirements-completed: [CLASS-06]

# Metrics
duration: 2min
completed: 2026-06-13
---

# Phase 111 Plan 02: candidateContext Orchestrator Class Conversion Summary

**Converted the 452-line `candidateContext` orchestrator factory to a Svelte 5 `class CandidateContextProvider implements CandidateContext` with byte-identical factory wrappers, reproducing the two inherited app+auth spreads via `Object.assign`, preserving the logout override as a prototype getter (the Object.assign-clobber landmine), keeping the 3 persisted fields imperative and the userData composite + 3 `$effect`s in D1 order, and narrowing the candidate barrel to a type-only class export.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-13T01:08:19Z
- **Completed:** 2026-06-13T01:11:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `candidateContext.svelte.ts` is now `export class CandidateContextProvider implements CandidateContext`, constructed via `new CandidateContextProvider()` inside an unchanged `initCandidateContext()` (hasContext-500 double-init guard byte-identical); `getCandidateContext()` guard byte-identical; `CONTEXT_KEY = Symbol()` and all imports unchanged (the Plan-01 class-shaped `candidateUserDataStore` factory import line is identical).
- The two inherited bases are reproduced via `Object.assign(this, this.#appContext)` + `Object.assign(this, this.#authContext)` in the constructor (replacing the L366-367 `...appContext` / `...authContext` spreads); the AppContext + AuthContext members (incl. `isAuthenticated`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`) are declared as `readonly x!: ...` definite-assignment members and present on the instance.
- **logout override (LANDMINE):** exposed as a prototype getter `get logout() { return this.#logout; }` delegating to a private `#logout` arrow that awaits `#authLogout()` then `goto('CandAppLogin', { invalidateAll: true }).then(#reset)`. A prototype getter is NOT own-enumerable, so `Object.assign(this, this.#authContext)` (which copies the authContext's own-enumerable `logout` arrow field) does NOT clobber it — documented inline.
- Every reactive accessor (answersLocked, profileComplete, selectedElections/Constituencies, electionsSelectable/constituenciesSelectable, info/opinion questions + categories, questionBlocks, requiredInfoQuestions, unanswered*, idTokenClaims, preregistrationElections/Nominations, plus the get/set pairs isPreregistered/newUserEmail/preregistrationElectionIds/preregistrationConstituencyIds) is a prototype get/set accessor backed by a private `#field` — reads via `ctx.X` re-invoke the getter in the tracking scope (destructure-trap contract preserved for the canonical Phase-61 context).
- The 3 persisted fields (`#isPreregistered` via localStorageState; `#preregistrationElectionIds`/`#preregistrationConstituencyIds` via sessionStorageState) round-trip imperatively through `.current`/`.set()` with the EXACT key strings and NO `$effect` init (spike 021/023).
- `#userData = candidateUserDataStore({...})` is declared AFTER `#answersLocked` + `#reactiveLocale` (D1); the 3 `$effect` blocks (selectedElections mirror, selectedConstituencies mirror, question-chain mirror with the matchable-check `error(500)` + full questionBlocks rebuild) live VERBATIM in the constructor; the DataWriter wrappers + IdP methods (checkRegistrationKey/register/exchangeCodeForIdToken/preregister/clearIdToken) are arrow fields; `#reset` is a private arrow field; every preserved comment (QUESTION-04 push-mirror, question-chain inline-helper, _reset isAuthenticated note, logout-override note) is present.
- The candidate barrel `candidate/index.ts` is narrowed (WR-01) to `export type { CandidateContextProvider }` + `export { getCandidateContext, initCandidateContext }` + the two `.type` re-exports + the WR-01 comment (no bare `export * from './candidateContext.svelte'`).
- `candidateContext.type.ts` and all route/component consumers are untouched (the CONTEXT_KEY Symbol + factory names are unchanged, so consumers resolve the same instance).

## Task Commits

1. **Task 1: Convert candidateContext to the CandidateContextProvider class** - `0e6f39f5a` (refactor)
2. **Task 2: Narrow the candidate barrel + verify destructure-trap contract, full unit, svelte-check** - `4df486d43` (refactor)

This is a behavior-preserving refactor gated by the full frontend unit suite + build + svelte-check (GREEN-preservation, identical to Plan 01 which the existing 4-case userData test gated). No new test commit was needed — the existing suite stays unchanged and MUST pass; the live candidate-app E2E + a11y-smoke gate runs once in Plan 03 (not here, per the plan).

## Files Created/Modified
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` - Rewritten as `CandidateContextProvider` class + byte-identical `getCandidateContext`/`initCandidateContext` factory wrappers (two-base Object.assign inheritance, logout override as prototype getter, 3 persisted fields imperative, userData composite + 3 constructor `$effect`s in D1 order, all reactive accessors as prototype get/set, arrow-field DataWriter/IdP methods, private `#reset` arrow).
- `apps/frontend/src/lib/contexts/candidate/index.ts` - Narrowed barrel: type-only `CandidateContextProvider` export + `getCandidateContext`/`initCandidateContext` runtime exports + the two `.type` re-exports + the WR-01 comment.

## Decisions Made
None beyond the plan — followed the plan and 111-PATTERNS guidance exactly (VoterContextProvider shape, two Object.assign calls, prototype-getter logout override, D1 ordering, imperative persisted fields, type-only barrel).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. `yarn svelte-check` surfaces only the 151 pre-existing, unrelated errors (`qs` missing declaration file, candidate settings `currentPassword`/`confirmPasswordTestId` typing, questions `[questionId]` string-vs-number) — none reference the converted files, so they are out of scope per the scope boundary and match the captured pre-change baseline (151) exactly with ZERO new errors. The frontend build, the full 759-test unit suite, and svelte-check all pass.

## Verification
- `yarn build --filter=@openvaa/frontend` → built in 7.96s (class compiles; inherited app+auth members + own members type-check; Plan-01 factory import resolves)
- `cd apps/frontend && yarn vitest run` → 57 files / 759 tests passed (no new failures vs the pre-phase baseline)
- `yarn svelte-check` → 2667 files, 151 ERRORS, 0 WARNINGS (pre-change baseline was identical 151; ZERO new errors)
- grep — no NEW destructure-trap violation: all candidate-app consumer destructures are of STABLE refs (getRoute, t, userData, appSettings, appCustomization, dataRoot, locale, reactiveDataRoot, logout, clearIdToken, setPassword, checkRegistrationKey, requestForgotPasswordEmail); NO reactive accessor is destructured (those are read via `ctx.X`)
- grep — `class CandidateContextProvider implements CandidateContext`, `Object.assign(this, this.#appContext)`, `Object.assign(this, this.#authContext)`, `new CandidateContextProvider()`, `get logout()` prototype getter, `#authLogout = this.#authContext.logout`, `candidateUserDataStore(` after `#answersLocked`, barrel `export type { CandidateContextProvider }`
- (Live candidate-app E2E + a11y-smoke gate deferred to Plan 03 — runs once at phase end)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 completes the candidateContext orchestrator conversion (CLASS-06 SC-1/SC-2/SC-3). Plan 03 is the live candidate-app E2E + a11y-smoke gate (SC-4) confirming the logout flow, the destructure-trap reactive edge, and the preregistration persisted round-trips end-to-end against the running app.
- The barrel is now narrowed; `CandidateContextProvider` is type-only (no accidental direct construction).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/candidate/index.ts
- FOUND: .planning/phases/111-candidatecontext-orchestrator-userdata-store/111-02-SUMMARY.md
- FOUND commit: 0e6f39f5a
- FOUND commit: 4df486d43

---
*Phase: 111-candidatecontext-orchestrator-userdata-store*
*Completed: 2026-06-13*

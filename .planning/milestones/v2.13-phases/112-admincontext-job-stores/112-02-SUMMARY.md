---
phase: 112-admincontext-job-stores
plan: 02
subsystem: frontend/admin-context
tags: [svelte5, context-as-class, runes, adminContext, auth-forwarding, refactor]
requires:
  - "JobStoresProvider class + back-compat jobStores() factory (Plan 01)"
  - "candidateContext.svelte.ts (CandidateContextProvider) — two-base Object.assign + delegating-getter analog"
  - "AppContextProvider (Phase 109) — own-enumerable appContext instance"
  - "AuthContextProvider (Phase 107) — live isAuthenticated $derived source"
provides:
  - "AdminContextProvider class (appContext via Object.assign + authContext via individual forwards; v2.11 auth-forwarding fix preserved)"
  - "type-only admin barrel (AdminContextProvider type-only; getAdminContext/initAdminContext values)"
  - "Phase 112 gate result: build + vitest contexts + svelte-check green (CLASS-07 closed)"
affects:
  - "16 getAdminContext()/initAdminContext() consumers (byte-identical surface — zero churn)"
tech-stack:
  added: []
  patterns:
    - "v2.11 auth-forwarding fix in class form: isAuthenticated prototype getter re-reading live $derived; 4 auth fns as arrow-field direct-reference forwards; NO authContext spread"
    - "112-PATTERNS §2 getter-collision audit: appContext carries zero auth keys → Object.assign cannot overwrite getter-only isAuthenticated → Phase-111 TypeError structurally absent"
    - "CONVENTIONS §17 prototype get/set over private $state (userData); §18 arrow fields for DataWriter wrappers + injectAuthToken (detach-safe)"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/admin/index.ts"
decisions:
  - "Kept jobStores() back-compat factory (jobs = jobStores()) for minimal diff rather than new JobStoresProvider() directly — Plan 01 guarantees it returns a JobStoresProvider"
  - "logout is a PLAIN arrow field (not a getter-only override like candidateContext) — nothing assigns over it, so no exclusion-on-assign needed; only appContext is Object.assign'd"
  - "No $effect introduced — adminContext has none; the sole constructor work is Object.assign(this, this.#appContext)"
metrics:
  duration: ~2min
  completed: 2026-06-13
  tasks: 2
  files: 2
---

# Phase 112 Plan 02: adminContext → AdminContextProvider Class Summary

Converted the `adminContext` factory into a Svelte 5 `AdminContextProvider` class behind byte-identical `getAdminContext()` / `initAdminContext()`, preserving the v2.11 auth-forwarding fix verbatim (isAuthenticated live-delegating prototype getter + four direct-reference arrow forwards, NO `{ ...authContext }` spread), reproducing the former `...appContext` spread via a single `Object.assign(this, this.#appContext)`, narrowing the admin barrel to a type-only class export, and running the Phase 112 gate green — closing CLASS-07.

## What Was Built

- **`AdminContextProvider` class** (`adminContext.svelte.ts`): replaces the `initAdminContext()` factory body, constructed via `new AdminContextProvider()` inside `initAdminContext()`.
  - `#appContext = getAppContext()` / `#authContext = getAuthContext()` private base fields (field initializers, run before constructor).
  - **31 inherited appContext members** declared as `readonly X!: AppContext['X']` definite-assignment fields; installed via a single `Object.assign(this, this.#appContext)` in the constructor (own-enumerable per Phase 109).
  - **v2.11 auth-forwarding fix preserved verbatim**: `get isAuthenticated() { return this.#authContext.isAuthenticated; }` (prototype getter re-reading the live `$derived`, with the carried-over CONS-03 / Pitfall-2 explanatory comment); the four auth functions (`logout`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`) as arrow-field direct-reference forwards. NO `{ ...authContext }` spread and NO `Object.assign(this, this.#authContext)` anywhere.
  - `userData` get/set prototype accessor over `#userData = $state<BasicUserData | undefined>(undefined)`.
  - `jobs = jobStores()` field initializer (Plan 01 back-compat factory).
  - `#injectAuthToken` private arrow field + 8 DataWriter wrappers (`updateQuestion`, `getActiveJobs`, `getPastJobs`, `startJob`, `getJobProgress`, `abortJob`, `abortAllJobs`, `insertJobResult`) as public arrow fields with unchanged `WithOptionalAuth<...> → ReturnType<...>` signatures (CONVENTIONS §18 detach-safe).
  - `@internal` JSDoc documenting the two-base composition, the auth-forwarding-fix preservation, the getter-collision audit (appContext carries no auth key → no exclusion), no-`$effect` note, and "use initAdminContext()".
  - `CONTEXT_KEY = Symbol('admin')` + both error messages byte-identical.
- **Admin barrel narrowed** (`index.ts`): `export type { AdminContextProvider }` (type-only, WR-01) + `export { getAdminContext, initAdminContext }` (runtime values) + unchanged `.type` barrels, matching the candidate-barrel precedent.

## Verification Results

- **`grep -c "class AdminContextProvider"`** = 1.
- **`grep -c "...authContext | Object.assign(this, this.#authContext)"`** = **0** (SC-2 / T-112-03 satisfied — no auth spread).
- **`Object.assign(this, this.#appContext)`** = exactly **1** real statement (line 220; the 4 other grep hits are JSDoc/comment references). No `isAuthenticated`-bearing assign (T-112-05 satisfied).
- **`grep -c "get isAuthenticated()"`** = 1.
- **`yarn build`** (client + SSR): green — 14/14 tasks, SSR built in 8.02s.
- **`yarn vitest run src/lib/contexts/`**: **104 passed / 104** (21 files, incl. Plan 01's jobStores smoke test).
- **`yarn svelte-check`**: **151 ERRORS — exactly baseline, zero new errors**; no errors in adminContext.svelte.ts or index.ts.
- **Admin surface unbroken**: git diff scope = adminContext.svelte.ts + index.ts only; **zero consumer-file changes**.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Convert adminContext factory to class AdminContextProvider (preserve v2.11 auth-forwarding fix) | 9319fb58f | adminContext.svelte.ts |
| 2 | Narrow admin barrel to type-only class export + run the phase gate | 53d393961 | index.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/admin/index.ts
- FOUND commit: 9319fb58f
- FOUND commit: 53d393961

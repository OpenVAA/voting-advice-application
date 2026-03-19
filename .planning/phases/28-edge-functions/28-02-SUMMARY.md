---
phase: 28-edge-functions
plan: 02
subsystem: auth
tags: [signicat, oidc, supabase, edge-functions, bank-auth, verifyOtp, magiclink]

# Dependency graph
requires:
  - phase: 28-edge-functions plan 01
    provides: signicat-callback Edge Function that handles JWE/JWT and returns magic link
  - phase: 24-auth
    provides: Supabase auth infrastructure (locals.supabase, verifyOtp patterns)
provides:
  - Dual-adapter preregister server route handling Strapi and Supabase flows
  - Supabase session establishment via Edge Function magic link + verifyOtp
affects: [frontend-auth, candidate-registration, bank-auth]

# Tech tracking
tech-stack:
  added: []
  patterns: [adapter-branching via staticSettings.dataAdapter.type, Edge Function invocation from SvelteKit server route, magic link token extraction and verifyOtp session establishment]

key-files:
  created: []
  modified:
    - frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts

key-decisions:
  - "Supabase path passes raw encrypted id_token to Edge Function (no client-side decryption)"
  - "Session established server-side via verifyOtp using magic link token from Edge Function response"
  - "id_token cookie cleared after successful session establishment to prevent replay"
  - "SvelteKit HttpError re-thrown from catch block to avoid double-wrapping"

patterns-established:
  - "Adapter branching: staticSettings.dataAdapter.type === 'supabase' guard at top of handler, with Strapi fallthrough"
  - "Edge Function invocation: locals.supabase.functions.invoke('name', { body }) pattern"
  - "Magic link token extraction: parse action_link URL to get token and type params for verifyOtp"

requirements-completed: [EDGE-02]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 28 Plan 02: Preregister Server Route Summary

**Dual-adapter preregister route with Supabase Edge Function invocation and verifyOtp session establishment for Signicat bank auth**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T17:48:53Z
- **Completed:** 2026-03-19T17:50:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added Supabase adapter path to preregister server route that calls signicat-callback Edge Function
- Session established server-side via verifyOtp using magic link token from Edge Function response
- id_token cookie cleared after successful session establishment (replay prevention)
- Existing Strapi adapter flow preserved unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Supabase adapter path to preregister server route** - `1b8253157` (feat)

## Files Created/Modified
- `frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts` - Dual-adapter preregister handler with Supabase Edge Function invocation and verifyOtp session establishment

## Decisions Made
- Supabase path passes raw encrypted id_token to Edge Function -- the Edge Function handles JWE decryption and JWT verification internally, keeping crypto off the SvelteKit server
- Session established server-side via verifyOtp using magic link token extracted from Edge Function's action_link URL
- id_token cookie cleared after successful session establishment to prevent replay attacks
- SvelteKit HttpError objects re-thrown from catch block (checked via 'status' in e) to avoid double-wrapping error responses

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TS6310 error in frontend tsconfig (supabase-types project reference has noEmit) -- not related to this plan's changes, verified via svelte-check that the modified file has zero errors

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The preregister server route now handles both adapter paths, completing the bank auth flow chain: Signicat OIDC -> id_token cookie -> preregister route -> Edge Function -> magic link -> verifyOtp -> Supabase session
- Ready for integration testing once Docker stack with Supabase and Signicat config is available

## Self-Check: PASSED

- [x] `frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts` exists
- [x] Commit `1b8253157` exists in git log

---
*Phase: 28-edge-functions*
*Completed: 2026-03-19*

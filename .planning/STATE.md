---
gsd_state_version: 1.0
milestone: v2.3
milestone_name: Idura FTN Auth
status: executing
stopped_at: Completed 48-02-PLAN.md
last_updated: "2026-03-27T18:34:47.340Z"
last_activity: 2026-03-27
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 48 — backward-compatibility-and-testing

## Current Position

Phase: 48
Plan: Not started
Status: Ready to execute
Last activity: 2026-03-27

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Cumulative:**

- Milestones shipped: 7 (v1.0, v1.1, v1.2, v1.3, v1.4, v2.0, v2.1) + 1 paused (v2.2)
- Total plans completed: 130 + 6 tasks (31 v1.0 + 15 v1.1 + 14 v1.2 + 19 v1.3 + 7 v1.4 + 42 v2.0 + 6 tasks v2.1 + 2 v2.2)
- Timeline: 27 days (2026-03-01 to 2026-03-27)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.

Key context for v2.3:

- Architecture mirrors current Signicat flow but uses JAR + private_key_jwt instead of PKCE + client_secret
- Supabase built-in OAuth cannot fulfill FTN security requirements (private_key_jwt, JAR, JWE, static JWKS)
- Provider abstraction lets deployments switch via env var, only one provider active at a time
- [Phase 45]: ProviderType as literal union, IdTokenClaimsResult as discriminated type alias, PUBLIC_IDENTITY_PROVIDER_TYPE defaults to signicat
- [Phase 45-provider-abstraction-and-configuration]: Used direct config references instead of this.authConfig for plain-object providers
- [Phase 45-provider-abstraction-and-configuration]: Fully implemented Idura getIdTokenClaims (not stubbed) since JWE+JWT flow identical to Signicat
- [Phase 46]: AuthorizeResult extended with optional state/nonce for Idura JAR flow
- [Phase 46]: Token endpoint URL used as aud claim for private_key_jwt client assertion
- [Phase 46]: jose v6 CryptoKey|Uint8Array replaces removed KeyLike type
- [Phase 46]: Both Idura and Signicat preregister flows use /api/oidc/authorize endpoint for URL construction
- [Phase 46]: Code verifier stored in cookie (samesite=lax) instead of localStorage for server-side callback access
- [Phase 46]: State verification conditional in callback (only when oidc_state cookie present)
- [Phase 47-edge-function-provider-support]: PROVIDER_CONFIGS as inline TypeScript record for type safety; default provider signicat for backward compat
- [Phase 47-edge-function-provider-support]: Clean break: findUserByIdentityMatch searches only identity_match_value, not old birthdate_id (D-06)
- [Phase 48]: @vitest-environment node required for jose v6 crypto tests (jsdom Uint8Array mismatch)
- [Phase 48]: vi.hoisted pattern for dynamic mock state in vitest when testing jose ESM modules
- [Phase 48]: Test files must NOT be placed in routes/ with + prefix (SvelteKit reserves them)
- [Phase 48]: Extract Edge Function pure functions into claimConfig.ts for vitest testability (no Deno deps)

### Blockers/Concerns

- Local imgproxy Docker container crashes intermittently (502 on image upload) — not a code issue
- 10 E2E tests still skipped due to Svelte 5 pushState reactivity bug (framework-level)
- Idura production access requires legal agreement (business step, not blocking technical work)

## Session Continuity

Last session: 2026-03-27T12:45:56.943Z
Stopped at: Completed 48-02-PLAN.md
Resume file: None

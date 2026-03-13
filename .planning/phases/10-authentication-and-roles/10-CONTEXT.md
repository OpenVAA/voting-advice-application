# Phase 10: Authentication and Roles - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Candidates and admins can authenticate via Supabase Auth, with role-based RLS policies enforcing data access at every level. Covers email/password login, password reset, pre-registration invite flow, user_roles table with scoped assignments, Custom Access Token Hook for JWT claims, SvelteKit integration via @supabase/ssr, and Signicat OIDC bank auth. Storage, email services, and load testing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Pre-registration invite flow
- Use Supabase's native `inviteUserByEmail()` for admin-initiated candidate invites
- Edge Function API endpoint handles the full flow: accepts candidate details (name, email, election/party), creates the candidate DB record, and calls `inviteUserByEmail()`
- Signicat bank auth is a separate self-service pre-registration path — any candidate authenticating via bank ID gets a candidate user created automatically
- Two distinct onboarding paths: (1) admin invite via email, (2) self-service via Signicat bank auth

### Post-authentication behavior
- Bank auth creates an immediate Supabase session — candidate is logged in right away
- After bank auth, candidate is prompted to enter an email address, which is confirmed via Supabase's email verification flow
- Candidates who registered via bank auth can also set a password and log in with email/password (both auth methods available)

### Signicat OIDC integration
- Implemented as a follow-up after core email/password auth + roles + RLS are working
- Claude decides the integration approach (SvelteKit server-side decryption + admin session, Supabase OIDC provider config, or Edge Function middleware) based on research into current Signicat token format
- Signicat configuration may have changed since original implementation — researcher should investigate both JWE (encrypted) and standard JWT paths
- Identity claims: given_name, family_name, birthdate (as identifier) — same as current implementation

### Role structure
- Multiple roles per user — a single user can have several role assignments simultaneously (e.g., candidate in one project + project_admin in another)
- `user_roles` table with rows: (user_id, role, scope_type, scope_id)
- Five role types: candidate, party, project_admin, account_admin, super_admin
- Party role scoped to a specific party_id (not project-level) — party admin manages their party's data
- Candidate role scoped to candidate_id — a user can be a candidate in multiple projects (one role row per candidate record)
- Account admin accesses all projects within their account
- Project admin scoped to a specific project
- Super admin has global access

### JWT claims
- All user_roles rows injected into JWT via Custom Access Token Hook — no DB lookups needed in RLS policies
- RLS policies read role/scope data directly from `auth.jwt()` claims

### RLS policy design
- Anon (voter) read access via RLS policies granting SELECT to the anon role — standard Supabase PostgREST pattern
- Published flag on key tables (elections, candidates, questions) — anon RLS only allows SELECT WHERE published = true
- Candidates can edit all their own fields except structural ones (project_id, role assignments) — those are admin-managed
- Answer locking (deadline-based write prevention) enforced at application layer, not RLS — simpler policies, lock logic can change without migration
- Replace all deny-all placeholder policies from Phase 9 with real role-based policies

### Claude's Discretion
- Signicat OIDC integration approach (SvelteKit decryption vs Supabase OIDC provider vs Edge Function)
- Exact JWT claims structure (how roles array is formatted in the token)
- RLS policy SQL patterns (per-operation granularity, helper functions for scope checking)
- Which tables get the published flag and default value
- Custom Access Token Hook implementation details
- SvelteKit hooks.server.ts migration approach (@supabase/ssr integration)
- Password validation rules (carry forward from existing `validatePassword()` or use Supabase defaults)
- How to add auth_user_id FK columns to existing entity tables

</decisions>

<specifics>
## Specific Ideas

- The current Strapi pre-registration uses a 3-step flow (pre-register with registrationKey, check key, register with password). The Supabase migration should be simpler using native invite.
- Bank auth (Signicat) and email invite are two independent onboarding paths — they share the same candidate record structure but differ in how the auth user is created.
- Current frontend auth uses httpOnly cookies with JWT — @supabase/ssr continues this pattern.
- The existing `getIdTokenClaims.ts` handles JWE decryption + JWT verification for Signicat — this logic may need to be preserved or adapted depending on the OIDC approach chosen.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lib/auth/` — Auth token storage, cookie handling patterns (AUTH_TOKEN_KEY)
- `frontend/src/lib/contexts/auth/authContext.ts` — AuthContext with logout, password reset, change password methods
- `frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` — JWE decryption + JWT verification for Signicat
- `frontend/src/hooks.server.ts` — Protected route checking pattern (redirect if no token + route includes `(protected)`)
- `backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts` — Role/permission definitions, password validation integration
- `backend/vaa-strapi/src/policies/user-owns-candidate.ts` — Ownership check pattern (maps to RLS candidate self-edit policy)
- `@openvaa/app-shared` validatePassword() — Password validation utility to carry forward

### Established Patterns
- httpOnly cookies for JWT storage — @supabase/ssr continues this
- `(protected)` route group in SvelteKit for auth-required pages
- Role-based login validation — frontend checks role matches before granting access
- Two frontend apps (voter + candidate) with different auth requirements
- Admin login at separate route with explicit role='admin' check

### Integration Points
- `apps/supabase/supabase/schema/010-rls.sql` — Deny-all placeholders to replace
- `apps/supabase/supabase/schema/003-entities.sql` — auth_user_id column to add
- `apps/supabase/supabase/functions/` — Edge Functions for invite flow and potentially OIDC
- `frontend/src/hooks.server.ts` — Needs @supabase/ssr server client creation
- `packages/supabase-types/` — Types regenerated after schema changes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-authentication-and-roles*
*Context gathered: 2026-03-13*

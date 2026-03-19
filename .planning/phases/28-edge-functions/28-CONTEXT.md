# Phase 28: Edge Functions - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** Auto-selected defaults

<domain>
## Phase Boundary

Integrate the three existing Supabase Edge Functions (invite-candidate, signicat-callback, send-email) into the frontend adapter layer. Each Edge Function is already built and deployed — this phase wires the frontend to call them. No new Edge Functions are created; no admin UI pages are created (admin app is post-v3.0).

</domain>

<decisions>
## Implementation Decisions

### Candidate invitation flow (EDGE-01)
- `_preregister` (specifically `preregisterWithApiToken`) in SupabaseDataWriter calls the `invite-candidate` Edge Function via `supabase.functions.invoke('invite-candidate', { body: {...} })`
- Maps interface params: `firstName`, `lastName`, `email` pass through; `identifier` is ignored (Supabase uses email-based invite, not personal ID); `nominations` array maps to `projectId` (from election context) and `organizationId` (from first nomination if available)
- The Edge Function handles: creating candidate row, sending invite email via GoTrue `inviteUserByEmail()`, creating role assignment, linking auth user — no adapter-side candidate creation needed
- Admin authorization: the Edge Function validates admin roles from JWT claims — the frontend just passes the session token

### Signicat bank auth integration (EDGE-02)
- `preregisterWithIdToken` in SupabaseDataWriter calls the `signicat-callback` Edge Function via `supabase.functions.invoke('signicat-callback', { body: { id_token, project_id } })`
- Frontend initiates bank auth by redirecting to Signicat's OIDC authorization endpoint (URL constructed from environment variable `PUBLIC_SIGNICAT_AUTH_URL` or similar)
- Signicat redirects back to a frontend callback route (e.g., `/candidate/auth/signicat-callback`) with the `id_token`
- The callback route POSTs the id_token to the Edge Function, which creates/finds the user and returns session data (magic link or user_id)
- Frontend uses the returned session to establish a Supabase auth session (via magic link URL or `setSession`)
- Note: The existing auth callback at `/candidate/auth/callback/+server.ts` handles GoTrue flows — Signicat needs its own callback route because the id_token comes from Signicat, not Supabase

### Email integration (EDGE-03)
- Implement a `sendEmail` method (or equivalent) in the SupabaseDataWriter that calls `send-email` Edge Function via `supabase.functions.invoke('send-email', { body: { templates, recipient_user_ids, from, dry_run } })`
- The send-email Edge Function resolves template variables server-side via the `resolve_email_variables()` RPC — frontend sends locale-keyed templates with `{{variable.path}}` placeholders
- This is a general-purpose admin method for bulk/transactional emails (not tied specifically to invitations — invite-candidate handles its own email)
- If the DataWriter interface doesn't already have a `sendEmail` method, add one to the interface and base class with admin-only semantics

### Interface method mapping
- `preregisterWithApiToken` → `invite-candidate` Edge Function (admin invites candidate via API token)
- `preregisterWithIdToken` → `signicat-callback` Edge Function (candidate self-registers via bank ID token)
- New `sendEmail` method → `send-email` Edge Function (admin sends transactional/bulk emails)
- Both preregister methods already exist in the DataWriter interface — just implement the Supabase versions
- `sendEmail` may need interface addition if not already present

### Claude's Discretion
- Exact Signicat callback route path and implementation details
- How to construct the Signicat OIDC authorization URL (which env vars, which params)
- Whether sendEmail needs a new interface method or can reuse an existing one
- Error handling and retry logic for Edge Function calls
- Test approach for Edge Function integration (mocking supabase.functions.invoke)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Edge Functions (API contracts)
- `apps/supabase/supabase/functions/invite-candidate/index.ts` — Invite candidate Edge Function: POST body {firstName, lastName, email, projectId, organizationId?}, returns {success, candidateId, userId}
- `apps/supabase/supabase/functions/signicat-callback/index.ts` — Signicat bank auth Edge Function: POST body {id_token, project_id?}, returns {success, user_id, candidate_id, is_new_user, session}
- `apps/supabase/supabase/functions/send-email/index.ts` — Send email Edge Function: POST body {templates, recipient_user_ids, from?, dry_run?}, returns {success, sent, failed, results}

### DataWriter interface (methods to implement)
- `frontend/src/lib/api/base/dataWriter.type.ts` — preregisterWithApiToken, preregisterWithIdToken signatures (and check for sendEmail)
- `frontend/src/lib/api/base/universalDataWriter.ts` — Abstract base class with preregister methods
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` — Strapi _preregister implementation (reference for behavior)

### Supabase adapter (stubs to replace)
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — _preregister stub throwing 'not implemented'

### Auth infrastructure
- `frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts` — Existing GoTrue auth callback (Signicat needs separate route)
- `apps/supabase/supabase/schema/012-auth-hooks.sql` — Custom access token hook, can_access_project(), admin role validation

### Email helpers
- `apps/supabase/supabase/schema/017-email-helpers.sql` — resolve_email_variables() RPC for template variable resolution

### Prior phase patterns
- `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — supabaseAdapterMixin providing Supabase client (Phase 23)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase.functions.invoke()`: Supabase client method for calling Edge Functions — available via the supabaseAdapterMixin's exposed client
- `resolve_email_variables()` RPC: Server-side template variable resolution — send-email Edge Function uses it internally, frontend doesn't need to call it directly
- Auth callback route: Existing pattern for handling auth redirects — can be extended for Signicat callback
- `can_access_project()`: Admin role validation — Edge Functions check this internally, frontend doesn't need to validate

### Established Patterns
- Supabase adapter exposes client directly — `this.supabase.functions.invoke()` is the natural call pattern (Phase 23)
- Auth is cookie-based; session token passed automatically with Edge Function calls (Phase 24)
- Edge Functions use JWT claims for authorization — no separate admin auth needed from frontend
- Error handling: adapter methods throw on failure, return success result objects (Phase 26)

### Integration Points
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Replace _preregister stub, add sendEmail
- `frontend/src/routes/[[lang=locale]]/candidate/auth/` — New Signicat callback route
- `frontend/src/lib/api/base/dataWriter.type.ts` — Potentially add sendEmail method to interface

</code_context>

<specifics>
## Specific Ideas

- invite-candidate Edge Function already handles the full candidate creation + email invite flow internally — the frontend adapter just needs to call it and pass the right parameters
- Signicat callback returns either a magic link or a user_id — frontend needs to handle both cases for establishing the session
- send-email supports dry_run mode which could be useful for admin preview functionality
- STATE.md blocker noted: "Phase 28 registration flows (GoTrue invite + Signicat OIDC) need targeted research before implementation"

</specifics>

<deferred>
## Deferred Ideas

- Admin UI for candidate invitation management — post-v3.0 admin app milestone
- Admin UI for bulk email sending — post-v3.0 admin app milestone
- Signicat configuration UI (setting up OIDC endpoints, client IDs) — deployment concern, not frontend feature
- Email template management UI — post-v3.0 admin app milestone

</deferred>

---

*Phase: 28-edge-functions*
*Context gathered: 2026-03-19 via auto-selected defaults*

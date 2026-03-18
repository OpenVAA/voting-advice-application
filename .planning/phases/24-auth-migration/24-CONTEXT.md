# Phase 24: Auth Migration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace Strapi JWT auth with Supabase cookie-based sessions across the entire frontend. Candidates and admins can log in, log out, reset passwords, and change passwords using Supabase GoTrue. Protected route guards use Supabase session verification. No Strapi JWT cookies are read or written anywhere. All auth operations go through the adapter abstraction layer so alternative adapters remain possible.

</domain>

<decisions>
## Implementation Decisions

### AuthContext model
- Replace the token-based AuthContext with a session-based model. Remove `authToken: Readable<string>` entirely (clean break, no compatibility shim)
- `candidate/+layout.server.ts` calls `safeGetSession()` from locals and passes `{ session, user }` in page data. AuthContext derives auth state from this
- Auth methods (logout, setPassword, resetPassword) no longer take or expose tokens. Components that reference `authToken` get updated in this phase
- All auth operations go through the DataWriter adapter abstraction (not direct Supabase calls in routes/components). The Supabase DataWriter implementation calls Supabase auth internally. This keeps route/component code adapter-agnostic

### Adapter-agnostic auth principle
- **No Supabase imports in route or component code for auth operations.** Routes use DataWriter (server variant) for server-side auth, AuthContext uses DataWriter for client-side auth
- The existing `candidate/login/+page.server.ts` (which currently calls `locals.supabase.auth.signInWithPassword()` directly) must be refactored to go through the adapter
- `safeGetSession` in hooks.server.ts must either be adapter-independent or called through the adapter. The server hook should not directly import Supabase for session verification
- If needed, add a SupabaseServerAdapter or use the existing DataWriter server type — whichever avoids Supabase deps in route code

### Password reset flow
- Use Supabase native flow: user clicks email link -> redirected to auth callback route with token hash fragments -> Supabase auto-establishes recovery session -> page calls updateUser({ password }) via adapter
- Create a new `/candidate/auth/callback` route that handles all Supabase auth redirects (PASSWORD_RECOVERY, SIGNED_IN, email confirmation, invite token exchange). Handle all auth event types now to avoid rework in Phase 26
- The existing `/candidate/password-reset` page stays but is updated to work with the recovery session (no `code` query param)
- Forgot-password page already uses `supabase.auth.resetPasswordForEmail()` — this should also go through the adapter for consistency

### Password change flow
- Drop old password requirement for password change. If `updateUser({ password })` is callable from the client with just an active session, requiring the old password doesn't add security
- setPassword in DataWriter takes only the new password (no currentPassword parameter)

### Logout mechanism
- Logout goes through the DataWriter adapter (adapter-agnostic)
- Supabase implementation uses `signOut({ scope: 'local' })` — current session only, other devices stay logged in
- The DataWriter server variant handles cookie cleanup via `@supabase/ssr`'s cookie handler

### Route guards
- hooks.server.ts route guard uses `safeGetSession()` (through the adapter) to verify sessions against Supabase Auth server, not just cookie presence checks
- This catches expired/tampered sessions — more secure than cookie existence check
- Remove dual cookie checking (Strapi token + sb-* cookies)

### Admin auth
- Admin login migrated to Supabase in this phase alongside candidate auth
- Admin login uses the same adapter-based auth with role checking
- Keeps all auth migration in one phase

### Strapi auth cleanup (full)
- Remove `AUTH_TOKEN_KEY` constant and `$lib/auth/authToken.ts`
- Delete `api/auth/login/+server.ts` and `api/auth/logout/+server.ts` routes
- Remove `authHeaders.ts` and its test file
- Remove dual cookie checking in hooks.server.ts
- All auth paths use Supabase via adapter only

### Claude's Discretion
- Exact mechanism for making hooks.server.ts adapter-agnostic (adapter factory, server adapter class, or config-based approach)
- Whether the auth callback route needs a +page.server.ts, +server.ts, or both
- How to pass the Supabase server client to the DataWriter server variant (via locals, via adapter config, etc.)
- File organization for the new auth callback route
- Whether `safeGetSession` moves into the adapter or remains a separate utility called by the adapter

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing auth infrastructure (what's being replaced)
- `frontend/src/lib/auth/authToken.ts` — AUTH_TOKEN_KEY constant (to be removed)
- `frontend/src/lib/contexts/auth/authContext.ts` — Current token-based AuthContext implementation (to be rewritten)
- `frontend/src/lib/contexts/auth/authContext.type.ts` — AuthContext type with authToken (to be rewritten)
- `frontend/src/lib/api/utils/authHeaders.ts` — Strapi JWT header utility (to be removed)
- `frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts` — Old Strapi login API route (to be removed)
- `frontend/src/routes/[[lang=locale]]/api/auth/logout/+server.ts` — Old Strapi logout API route (to be removed)

### Existing Supabase infrastructure (already built)
- `frontend/src/hooks.server.ts` — Server hook with Supabase client creation, safeGetSession, route guards (to be updated)
- `frontend/src/lib/supabase/server.ts` — createSupabaseServerClient using @supabase/ssr
- `frontend/src/lib/supabase/browser.ts` — createSupabaseBrowserClient singleton
- `frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts` — Login form action (already uses Supabase, needs adapter refactoring)
- `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` — Forgot password page (already uses Supabase browser client)

### Route structure (auth-related)
- `frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts` — Outermost candidate layout (passes token to page data, needs session migration)
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/` — Protected route group (layout, settings, profile, questions, preview)
- `frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte` — Password reset completion page (needs rewrite for Supabase flow)
- `frontend/src/routes/[[lang=locale]]/admin/login/+page.server.ts` — Admin login (needs Supabase migration)

### Adapter architecture
- `frontend/src/lib/api/base/dataWriter.type.ts` — DataWriter interface with auth methods (login, logout, resetPassword, setPassword, WithAuth type)
- `frontend/src/lib/api/adapters/supabase/` — Supabase adapter directory (stub classes from Phase 23)
- `frontend/src/lib/api/base/universalAdapter.ts` — Base adapter class

### Backend auth
- `apps/supabase/supabase/functions/` — Edge Functions directory (invite-candidate, signicat-callback for future phases)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createSupabaseServerClient` in `$lib/supabase/server.ts`: Already creates typed server client with cookie handling — adapter can wrap this
- `createSupabaseBrowserClient` in `$lib/supabase/browser.ts`: Singleton browser client — adapter can wrap this for client-side auth
- `safeGetSession` pattern in `hooks.server.ts`: Already implements session verification (getSession + getUser) — needs to be made adapter-agnostic
- `PasswordSetter` component in `$lib/candidate/components/passwordSetter`: Reusable password input with validation — used by password-reset page
- `buildRoute` utility: Used for post-login redirects

### Established Patterns
- Form actions for auth (login already uses this): SvelteKit form actions with `locals.supabase` access
- `(protected)` route group: Layout group that requires authentication — route guard in hooks.server.ts
- Page data flow: `+layout.server.ts` → `page.data` → Svelte context (AuthContext derives from page store)
- DataWriter server/universal type variants: Server returns Response, universal returns typed objects

### Integration Points
- `frontend/src/lib/api/adapters/supabase/` — Supabase DataWriter stub needs auth method implementations
- `frontend/src/hooks.server.ts` — Route guards and session handling need adapter-agnostic refactoring
- `frontend/src/lib/contexts/auth/` — AuthContext type and implementation need session-based rewrite
- `frontend/src/routes/[[lang=locale]]/candidate/` — Login, logout, password flows all change
- `frontend/src/routes/[[lang=locale]]/admin/login/` — Admin login needs same migration

</code_context>

<specifics>
## Specific Ideas

- All auth operations must be adapter-agnostic: no Supabase imports in routes or components. The adapter abstraction should be the only thing that knows about Supabase
- The auth callback route should handle all Supabase auth event types from the start (PASSWORD_RECOVERY, SIGNED_IN, email confirmation, invite exchange) to prevent rework in Phase 26
- The forgot-password page already uses Supabase directly — it should be refactored to go through the adapter for consistency with the adapter-agnostic principle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-auth-migration*
*Context gathered: 2026-03-18*

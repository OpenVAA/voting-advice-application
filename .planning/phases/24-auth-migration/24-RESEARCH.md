# Phase 24: Auth Migration - Research

**Researched:** 2026-03-18
**Domain:** Supabase SSR authentication with SvelteKit, cookie-based sessions, adapter-agnostic auth architecture
**Confidence:** HIGH

## Summary

Phase 24 replaces the legacy Strapi JWT authentication system with Supabase cookie-based sessions across the entire frontend. The project already has the core Supabase SSR infrastructure in place: `createSupabaseServerClient` (using `@supabase/ssr`), `createSupabaseBrowserClient`, and a `safeGetSession` pattern in `hooks.server.ts`. The candidate login form action already uses `locals.supabase.auth.signInWithPassword()` directly. The key work is: (1) making all auth operations adapter-agnostic via the DataWriter abstraction, (2) rewriting the AuthContext from token-based to session-based, (3) implementing password reset via Supabase's PKCE-based callback flow, (4) migrating admin login, and (5) removing all Strapi auth code.

The existing `SupabaseDataWriter` stub class (from Phase 23) already has empty `_login`, `_logout`, `_requestForgotPasswordEmail`, `_resetPassword`, and `_setPassword` methods that need implementation. The `UniversalDataWriter` base class has a well-defined public/protected method pattern. The `WithAuth` type (`{ authToken: string }`) is used pervasively in the DataWriter interface, the candidateUserDataStore, and the admin context -- but per REQUIREMENTS.md "Out of Scope", `WithAuth` interface refactoring is pragmatically deferred (keep signatures, ignore token internally).

**Primary recommendation:** Implement auth methods in SupabaseDataWriter using the Supabase client from `supabaseAdapterMixin`, create an auth callback route for PKCE token exchange, replace `safeGetSession` cookie-checking in hooks with adapter-aware session verification, and rewrite AuthContext to derive auth state from `page.data.session` instead of `page.data.token`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace the token-based AuthContext with a session-based model. Remove `authToken: Readable<string>` entirely (clean break, no compatibility shim)
- `candidate/+layout.server.ts` calls `safeGetSession()` from locals and passes `{ session, user }` in page data. AuthContext derives auth state from this
- Auth methods (logout, setPassword, resetPassword) no longer take or expose tokens. Components that reference `authToken` get updated in this phase
- All auth operations go through the DataWriter adapter abstraction (not direct Supabase calls in routes/components). The Supabase DataWriter implementation calls Supabase auth internally. This keeps route/component code adapter-agnostic
- No Supabase imports in route or component code for auth operations. Routes use DataWriter (server variant) for server-side auth, AuthContext uses DataWriter for client-side auth
- The existing `candidate/login/+page.server.ts` (which currently calls `locals.supabase.auth.signInWithPassword()` directly) must be refactored to go through the adapter
- `safeGetSession` in hooks.server.ts must either be adapter-independent or called through the adapter. The server hook should not directly import Supabase for session verification
- Use Supabase native flow for password reset: user clicks email link -> redirected to auth callback route with token hash fragments -> Supabase auto-establishes recovery session -> page calls updateUser({ password }) via adapter
- Create a new `/candidate/auth/callback` route that handles all Supabase auth redirects (PASSWORD_RECOVERY, SIGNED_IN, email confirmation, invite token exchange). Handle all auth event types now to avoid rework in Phase 26
- The existing `/candidate/password-reset` page stays but is updated to work with the recovery session (no `code` query param)
- Forgot-password page already uses `supabase.auth.resetPasswordForEmail()` -- this should also go through the adapter for consistency
- Drop old password requirement for password change. setPassword in DataWriter takes only the new password (no currentPassword parameter)
- Logout goes through the DataWriter adapter (adapter-agnostic). Supabase implementation uses `signOut({ scope: 'local' })` -- current session only
- hooks.server.ts route guard uses `safeGetSession()` (through the adapter) to verify sessions against Supabase Auth server, not just cookie presence checks
- Remove dual cookie checking (Strapi token + sb-* cookies)
- Admin login migrated to Supabase in this phase alongside candidate auth. Admin login uses the same adapter-based auth with role checking
- Remove `AUTH_TOKEN_KEY` constant and `$lib/auth/authToken.ts`
- Delete `api/auth/login/+server.ts` and `api/auth/logout/+server.ts` routes
- Remove `authHeaders.ts` and its test file
- Remove dual cookie checking in hooks.server.ts

### Claude's Discretion
- Exact mechanism for making hooks.server.ts adapter-agnostic (adapter factory, server adapter class, or config-based approach)
- Whether the auth callback route needs a +page.server.ts, +server.ts, or both
- How to pass the Supabase server client to the DataWriter server variant (via locals, via adapter config, etc.)
- File organization for the new auth callback route
- Whether `safeGetSession` moves into the adapter or remains a separate utility called by the adapter

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Login/logout server routes using Supabase cookie-based sessions instead of Strapi JWT | SupabaseDataWriter._login/_logout implementations; refactor candidate login +page.server.ts and admin login +page.server.ts to use adapter; delete old api/auth/login and api/auth/logout routes |
| AUTH-02 | Auth context updated to use Supabase session state | AuthContext rewrite: derive `isAuthenticated` from `page.data.session` instead of `page.data.token`; remove `authToken` readable; candidateUserDataStore needs refactoring to not require authToken |
| AUTH-03 | Protected route guards using Supabase session verification | hooks.server.ts refactored to use adapter-provided safeGetSession instead of dual cookie checking; protected layout loaders use session instead of token |
| AUTH-04 | Password reset and change flows via Supabase GoTrue | Auth callback route with PKCE verifyOtp; SupabaseDataWriter._requestForgotPasswordEmail, _resetPassword, _setPassword using Supabase auth API; password-reset page rewrite |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.9.0 | Server-side Supabase client with cookie handling | Already installed; official Supabase SSR package for SvelteKit integration |
| @supabase/supabase-js | 2.99.2 | Supabase client library with GoTrue auth | Already installed; provides auth.signInWithPassword, auth.signOut, auth.updateUser, auth.verifyOtp, auth.resetPasswordForEmail |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/supabase-types | workspace:^ | Database type definitions | Already a dependency; provides typed Supabase client via Database generic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom adapter factory in hooks | Direct Supabase calls in hooks | Adapter abstraction is a locked decision per CONTEXT.md |
| Server-side form actions | API routes for login/logout | Form actions are already the established pattern (candidate login already uses them) |

**Installation:**
No new packages needed. All required dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── hooks.server.ts                    # Adapter-agnostic session verification + route guards
├── lib/
│   ├── api/
│   │   ├── adapters/supabase/
│   │   │   ├── dataWriter/
│   │   │   │   └── supabaseDataWriter.ts  # Auth method implementations
│   │   │   └── serverAuth.ts              # Server-side auth adapter (safeGetSession, createClient)
│   │   └── base/
│   │       ├── dataWriter.type.ts         # Updated: WithAuth may be kept but ignored internally
│   │       └── serverAuth.type.ts         # Interface for server auth adapter (new)
│   ├── auth/
│   │   ├── index.ts                       # Re-export getUserData (updated)
│   │   └── getUserData.ts                 # Updated: session-based instead of token-based
│   └── contexts/
│       └── auth/
│           ├── authContext.ts             # Rewritten: session-based
│           └── authContext.type.ts        # Rewritten: no authToken
├── routes/[[lang=locale]]/
│   ├── candidate/
│   │   ├── +layout.server.ts             # Updated: passes session/user instead of token
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── +server.ts            # NEW: PKCE auth callback handler
│   │   ├── login/
│   │   │   └── +page.server.ts           # Updated: uses adapter instead of direct Supabase
│   │   ├── forgot-password/
│   │   │   └── +page.svelte              # Updated: uses adapter instead of direct Supabase
│   │   ├── password-reset/
│   │   │   └── +page.svelte              # Rewritten: uses recovery session, no code param
│   │   └── (protected)/
│   │       └── +layout.ts                # Updated: session-based instead of token-based
│   └── admin/
│       ├── +layout.server.ts             # Updated: passes session/user instead of token
│       ├── login/
│       │   └── +page.server.ts           # Updated: uses Supabase via adapter
│       └── (protected)/
│           └── +layout.ts                # Updated: session-based instead of token-based
```

### Pattern 1: Server Auth Adapter Interface
**What:** An abstraction layer for server-side auth operations that hooks.server.ts uses instead of importing Supabase directly.
**When to use:** In hooks.server.ts and server-side form actions.
**Example:**
```typescript
// frontend/src/lib/api/base/serverAuth.type.ts
import type { Session, User } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

export interface ServerAuthAdapter {
  /** Create a request-scoped auth client and attach to event.locals */
  createRequestClient(event: RequestEvent): void;
  /** Verify session against auth server (not just cookie presence) */
  safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
  /** Sign in with email/password */
  signIn(email: string, password: string): Promise<{ error: Error | null }>;
  /** Sign out current session */
  signOut(): Promise<{ error: Error | null }>;
}
```

### Pattern 2: Auth Callback Route (PKCE Token Exchange)
**What:** A `+server.ts` route that handles Supabase auth redirects for PKCE flow.
**When to use:** For password recovery email links, email confirmations, invite token exchange.
**Example:**
```typescript
// frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts
import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next') ?? '/candidate';

  if (token_hash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      // For PASSWORD_RECOVERY type, redirect to password reset page
      if (type === 'recovery') {
        redirect(303, `/${locals.currentLocale}/candidate/password-reset`);
      }
      redirect(303, `/${locals.currentLocale}/${next.replace(/^\//, '')}`);
    }
  }
  redirect(303, `/${locals.currentLocale}/candidate/login?errorMessage=authError`);
};
```

### Pattern 3: Session-Based AuthContext
**What:** AuthContext derives auth state from `page.data.session` instead of `page.data.token`.
**When to use:** Every client-side component that needs auth state.
**Example:**
```typescript
// frontend/src/lib/contexts/auth/authContext.ts
import { derived } from 'svelte/store';
import { page } from '$app/stores';

const isAuthenticated = derived(page, (page) => !!page.data.session);
const userEmail = derived(page, (page) => page.data.user?.email);
```

### Pattern 4: SupabaseDataWriter Auth Methods
**What:** Implementing auth methods in the SupabaseDataWriter using the Supabase client from the mixin.
**When to use:** All auth operations in the Supabase adapter.
**Example:**
```typescript
// In SupabaseDataWriter
protected async _login({ username, password }: { username: string; password: string }) {
  const { error } = await this.supabase.auth.signInWithPassword({
    email: username,
    password
  });
  if (error) throw new Error(error.message);
  return { type: 'success' as const };
  // Note: no authToken returned -- Supabase manages sessions via cookies
}

protected async _logout() {
  const { error } = await this.supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error(error.message);
  return { type: 'success' as const };
}

protected async _setPassword({ password }: { password: string }) {
  const { error } = await this.supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { type: 'success' as const };
}

protected async _requestForgotPasswordEmail({ email }: { email: string }) {
  const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/candidate/auth/callback?type=recovery`
  });
  if (error) throw new Error(error.message);
  return { type: 'success' as const };
}

protected async _resetPassword({ password }: { password: string }) {
  // Called after recovery session is established via callback
  const { error } = await this.supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { type: 'success' as const };
}
```

### Anti-Patterns to Avoid
- **Direct Supabase imports in routes/components:** All auth goes through DataWriter adapter. The only place that directly uses Supabase is the adapter implementation itself.
- **Using getSession() for authorization:** Always use `safeGetSession()` (getSession + getUser) on the server. `getSession()` alone reads unverified cookies.
- **Cookie existence as auth check:** The current hooks.server.ts checks `event.cookies.getAll().some((c) => c.name.startsWith('sb-'))` -- this must be replaced with actual session verification via `safeGetSession()`.
- **Storing auth tokens in page data:** Session-based auth derives state from the session object, not from JWT tokens passed through page data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based session management | Custom cookie parsing/setting | `@supabase/ssr` createServerClient/createBrowserClient | Handles cookie chunking, secure flags, PKCE flow automatically |
| Password reset email delivery | Custom email sending | `supabase.auth.resetPasswordForEmail()` | Handles token generation, email templating, redirect URL validation |
| Token exchange (PKCE) | Custom token parsing from URL fragments | `supabase.auth.verifyOtp({ token_hash, type })` | PKCE flow is complex; Supabase handles code_verifier/code_challenge automatically |
| Session validation | JWT verification logic | `supabase.auth.getUser()` | Verifies against auth server; catches expired/revoked sessions |
| Password updates | Custom password change endpoint | `supabase.auth.updateUser({ password })` | Handles password hashing, validation, session update automatically |

**Key insight:** Supabase Auth (GoTrue) provides a complete auth system. The adapter layer translates between OpenVAA's DataWriter interface and Supabase's auth API -- it should never reimplement auth logic.

## Common Pitfalls

### Pitfall 1: Using getSession() Without getUser() on Server
**What goes wrong:** Session data from cookies can be tampered with. A malicious user could forge a cookie with a spoofed user ID.
**Why it happens:** `getSession()` reads from cookies without server verification. It's fast but insecure for authorization decisions.
**How to avoid:** Always pair `getSession()` with `getUser()` on the server (this is exactly what `safeGetSession` does). Only use `getSession()` alone for non-security-critical UI state on the client.
**Warning signs:** Any server-side code that calls `supabase.auth.getSession()` without also calling `getUser()`.

### Pitfall 2: Password Reset Session Not Persisting
**What goes wrong:** After clicking the password reset email link, the recovery session is not available when the password reset page loads.
**Why it happens:** When using PKCE flow with SSR, the `verifyOtp` call establishes a session on the server, but if the redirect doesn't carry the session cookies properly, the client has no session.
**How to avoid:** Use a `+server.ts` callback route (not client-side) to call `verifyOtp` with the server Supabase client. The `@supabase/ssr` cookie handler on the server will set the session cookies, which persist across the redirect.
**Warning signs:** User clicks reset link, gets redirected to password reset page, but `updateUser` fails with "not authenticated".

### Pitfall 3: Adapter-Agnostic Leakage
**What goes wrong:** Supabase types or imports creep into route/component code, coupling it to the specific backend.
**Why it happens:** It's easier to call `locals.supabase.auth.signInWithPassword()` directly than to go through the adapter.
**How to avoid:** Enforce the rule: no `@supabase/*` imports in any file under `routes/` or `lib/components/` or `lib/contexts/`. Only `lib/api/adapters/supabase/` and `lib/supabase/` may import Supabase.
**Warning signs:** `import { ... } from '@supabase/supabase-js'` appearing outside adapter code.

### Pitfall 4: WithAuth Interface Compatibility
**What goes wrong:** Changing the `WithAuth` type breaks all DataWriter method signatures and every call site.
**Why it happens:** `WithAuth = { authToken: string }` is used in ~30+ locations across the codebase (candidateUserDataStore, adminContext, universalDataWriter, etc.).
**How to avoid:** Per REQUIREMENTS.md Out of Scope: "keep signatures, ignore token internally." The Supabase adapter's auth methods accept `WithAuth` parameters but ignore the `authToken` value -- Supabase manages auth via cookies automatically. The contexts pass empty/dummy tokens where needed.
**Warning signs:** Wanting to change `WithAuth` type definition -- that's explicitly deferred to v4.0.

### Pitfall 5: Multiple Supabase Client Instances
**What goes wrong:** Creating multiple Supabase server clients per request leads to session state inconsistency.
**Why it happens:** Each `createServerClient` call creates a new instance with its own cookie handler.
**How to avoid:** Create ONE Supabase server client in `hooks.server.ts` and pass it through `event.locals`. The adapter gets the server client from locals via `serverClient` config option.
**Warning signs:** `createServerClient` called in form actions or load functions instead of using `locals.supabase`.

### Pitfall 6: Redirect After signOut Showing Stale Data
**What goes wrong:** After logging out, the user sees stale page data because SvelteKit's client-side cache isn't invalidated.
**Why it happens:** SvelteKit caches load function results. `signOut()` changes the server state but doesn't invalidate client-side cache.
**How to avoid:** After signOut, use `goto('/login', { invalidateAll: true })` to force all load functions to re-run.
**Warning signs:** After logout, navigating back shows the previously logged-in state.

## Code Examples

### Auth Callback Route (PKCE Token Exchange)
```typescript
// Source: Supabase docs + SvelteKit SSR auth guide
// frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts
import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = url.searchParams.get('next');
  const lang = locals.currentLocale ?? 'en';

  if (token_hash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      // Route based on auth event type
      switch (type) {
        case 'recovery':
          redirect(303, `/${lang}/candidate/password-reset`);
        case 'invite':
          redirect(303, `/${lang}/candidate/register`);
        case 'email':
        case 'signup':
          redirect(303, next ? `/${lang}/${next}` : `/${lang}/candidate`);
        default:
          redirect(303, `/${lang}/candidate`);
      }
    }
  }
  // Error or missing params
  redirect(303, `/${lang}/candidate/login?errorMessage=authError`);
};
```

### Updated hooks.server.ts Route Guard
```typescript
// Replace the current dual-cookie check (section 4) with:
if (pathname.startsWith(`/${servedLocale}/candidate`)) {
  const { session } = await safeGetSession();
  const hasAuth = !!session;

  if (hasAuth && pathname.endsWith('candidate/login')) {
    redirect(303, `/${servedLocale}/candidate`);
  }

  if (!hasAuth && route.id?.includes('(protected)')) {
    redirect(303, `/${servedLocale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
  }
}
```

### Session-Based Layout Server Loader
```typescript
// frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  return { session, user };
}
```

### Supabase DataWriter _login Implementation
```typescript
protected async _login({
  username,
  password
}: {
  username: string;
  password: string;
}): DWReturnType<DataApiActionResult & Partial<WithAuth>> {
  const { error } = await this.supabase.auth.signInWithPassword({
    email: username,
    password
  });
  if (error) throw new Error(error.message);
  // No authToken returned -- session managed via cookies
  return { type: 'success' };
}
```

### Updated AuthContext (Session-Based)
```typescript
// frontend/src/lib/contexts/auth/authContext.ts
const isAuthenticated = derived(page, (page) => !!page.data.session);

async function logout(): Promise<void> {
  const dataWriter = await prepareDataWriter(dataWriterPromise);
  await dataWriter.logout({ authToken: '' }).catch((e) => {
    logDebugError(`Error logging out: ${e?.message ?? '-'}`);
  });
}

async function setPassword(opts: { password: string }): Promise<DataApiActionResult> {
  const dataWriter = await prepareDataWriter(dataWriterPromise);
  return dataWriter.setPassword({ ...opts, authToken: '', currentPassword: '' });
  // authToken and currentPassword are kept in signature for WithAuth compatibility
  // but ignored by the Supabase adapter internally
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi JWT stored in httpOnly cookie | Supabase session cookies via @supabase/ssr | Phase 24 | All auth routes, contexts, and guards change |
| `getSession()` for server auth checks | `safeGetSession()` = getSession + getUser | Supabase SSR v0.5+ | More secure, catches tampered cookies |
| Password reset via code query param | PKCE flow with token_hash + verifyOtp callback | Supabase Auth PKCE default | Callback route handles token exchange server-side |
| Auth state from `page.data.token` | Auth state from `page.data.session` | Phase 24 | AuthContext and all consumers updated |
| `AUTH_TOKEN_KEY` cookie for auth presence | Supabase-managed session cookies | Phase 24 | Cookie management delegated to @supabase/ssr |

**Deprecated/outdated:**
- `AUTH_TOKEN_KEY` / `$lib/auth/authToken.ts`: Strapi JWT constant -- removed in this phase
- `api/auth/login/+server.ts` and `api/auth/logout/+server.ts`: Old API routes for Strapi JWT auth -- removed in this phase
- `authHeaders.ts` and test: Only used for Strapi JWT Bearer headers -- removed in this phase
- `supabase.auth.getSession()` alone on server: Insecure, always pair with `getUser()` for authorization

## Open Questions

1. **Server auth adapter vs direct locals access**
   - What we know: CONTEXT.md says hooks.server.ts should not directly import Supabase for session verification. The adapter mixin provides a `serverClient` config option.
   - What's unclear: Whether to create a formal `ServerAuthAdapter` interface or use a lighter approach where hooks simply delegates to a function imported from the adapter.
   - Recommendation: Use a factory function pattern (`createServerAuthHelpers(event)`) that returns `{ safeGetSession, supabase }` -- hooks imports from the adapter, never from `@supabase/ssr` directly. The factory can be typed to an interface for future non-Supabase adapters.

2. **candidateUserDataStore authToken dependency**
   - What we know: `candidateUserDataStore` takes `authToken: Readable<string | undefined>` and uses it for `save()` and `reloadCandidateData()`. These call `dataWriter.getCandidateUserData({ authToken })` and `dataWriter.updateAnswers({ authToken, ... })`.
   - What's unclear: Since WithAuth refactoring is deferred, how to handle the token parameter.
   - Recommendation: Pass a dummy readable (e.g., `readable('supabase-session')`) that satisfies the type constraint. The Supabase adapter ignores `authToken` values since auth is managed via cookies. The `isAuthenticated` check replaces the `!token` guard.

3. **Admin auth callback route**
   - What we know: Admin login also needs migration. Admin protected layout uses `getUserData({ parent })` which reads the token from parent data.
   - What's unclear: Whether admin needs its own callback route or can share the candidate one.
   - Recommendation: The auth callback route should be shared (e.g., at `/auth/callback` under the locale route, not under `/candidate/`). Both candidate and admin password resets would use the same PKCE callback, with a `next` parameter to redirect to the appropriate app section.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1.8 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && yarn test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | SupabaseDataWriter._login calls signInWithPassword and returns success | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts -x` | Wave 0 |
| AUTH-01 | SupabaseDataWriter._logout calls signOut with scope local | unit | (same file) | Wave 0 |
| AUTH-02 | AuthContext derives isAuthenticated from page.data.session | unit | `cd frontend && npx vitest run src/lib/contexts/auth/authContext.test.ts -x` | Wave 0 |
| AUTH-03 | hooks.server.ts redirects unauthenticated users from protected routes | integration | Manual -- requires running server | Manual-only (hooks are hard to unit test) |
| AUTH-04 | SupabaseDataWriter._requestForgotPasswordEmail calls resetPasswordForEmail | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts -x` | Wave 0 |
| AUTH-04 | SupabaseDataWriter._setPassword calls updateUser | unit | (same file) | Wave 0 |
| AUTH-04 | Auth callback route handles recovery type | integration | Manual -- requires running server with Supabase | Manual-only |

### Sampling Rate
- **Per task commit:** `cd frontend && yarn test:unit`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` -- covers AUTH-01, AUTH-04 (unit tests for auth method implementations with mocked Supabase client)
- [ ] `frontend/src/lib/contexts/auth/authContext.test.ts` -- covers AUTH-02 (session-based auth state derivation)
- [ ] Removal of `frontend/src/lib/api/utils/authHeaders.test.ts` -- file being deleted, test must also be deleted

## Sources

### Primary (HIGH confidence)
- Codebase analysis: Direct reading of all referenced files in CONTEXT.md canonical_refs
- [Supabase Official Docs - SSR Auth for SvelteKit](https://supabase.com/docs/guides/auth/server-side/sveltekit) - safeGetSession pattern, cookie handling, PKCE flow
- [Supabase Official Docs - auth.verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp) - Token hash verification, EmailOtpType values (email, recovery, invite, email_change)
- [Supabase Official Docs - auth.updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser) - Password update requires active session only, no reauthentication
- [Supabase Official Docs - auth.resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) - redirectTo parameter, PKCE flow support
- [Supabase Official Docs - Signing out](https://supabase.com/docs/guides/auth/signout) - scope options (global, local, others), token behavior after signout

### Secondary (MEDIUM confidence)
- [Supabase SSR Auth with SvelteKit - DEV Community](https://dev.to/kvetoslavnovak/supabase-ssr-auth-48j4) - Complete implementation reference with auth callback, form actions, onAuthStateChange patterns
- [Supabase Discussion #22353](https://github.com/orgs/supabase/discussions/22353) - getSession() security concerns and safeGetSession pattern
- [Supabase Discussion #23224](https://github.com/orgs/supabase/discussions/23224) - SSR attack vectors when using session from getSession()

### Tertiary (LOW confidence)
- [Supabase Discussion #20699](https://github.com/orgs/supabase/discussions/20699) - Password reset and invite flow gaps in official SvelteKit example (informs pitfall documentation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed and verified against npm registry
- Architecture: HIGH - patterns derived from existing codebase + official Supabase docs
- Pitfalls: HIGH - common SSR auth pitfalls well-documented in Supabase community
- Auth callback (PKCE): MEDIUM - verified via official docs but the exact behavior with @supabase/ssr cookie handler needs integration testing

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days - Supabase auth API is stable)

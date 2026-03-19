# Phase 28: Edge Functions - Research

**Researched:** 2026-03-19
**Domain:** Supabase Edge Function integration, OIDC bank auth, transactional email
**Confidence:** HIGH

## Summary

Phase 28 integrates three existing Supabase Edge Functions into the frontend adapter layer. The Edge Functions are already built and deployed -- this phase wires the frontend to call them via `supabase.functions.invoke()`. The three integrations are: (1) `invite-candidate` for admin-driven candidate invitations, (2) `signicat-callback` for Finnish bank ID authentication via Signicat OIDC, and (3) `send-email` for transactional/bulk email. Each has a clear API contract defined in the Edge Function source code.

The primary challenge is the Signicat bank auth flow (EDGE-02), which requires a new callback route, OIDC redirect construction, and session establishment from the magic link returned by the Edge Function. The other two integrations (EDGE-01, EDGE-03) are straightforward `functions.invoke()` calls within existing or new DataWriter methods.

**Primary recommendation:** Implement `_preregister` for invite-candidate, add a Signicat callback route + `preregisterWithIdToken` override, and add a `sendEmail` method to the DataWriter interface -- all using `this.supabase.functions.invoke()` as the transport.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `_preregister` (specifically `preregisterWithApiToken`) in SupabaseDataWriter calls the `invite-candidate` Edge Function via `supabase.functions.invoke('invite-candidate', { body: {...} })`
- Maps interface params: `firstName`, `lastName`, `email` pass through; `identifier` is ignored (Supabase uses email-based invite, not personal ID); `nominations` array maps to `projectId` (from election context) and `organizationId` (from first nomination if available)
- The Edge Function handles: creating candidate row, sending invite email via GoTrue `inviteUserByEmail()`, creating role assignment, linking auth user -- no adapter-side candidate creation needed
- Admin authorization: the Edge Function validates admin roles from JWT claims -- the frontend just passes the session token
- `preregisterWithIdToken` in SupabaseDataWriter calls the `signicat-callback` Edge Function via `supabase.functions.invoke('signicat-callback', { body: { id_token, project_id } })`
- Frontend initiates bank auth by redirecting to Signicat's OIDC authorization endpoint (URL constructed from environment variable `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` or similar)
- Signicat redirects back to a frontend callback route with the `id_token`
- The callback route POSTs the id_token to the Edge Function, which creates/finds the user and returns session data (magic link or user_id)
- Frontend uses the returned session to establish a Supabase auth session (via magic link URL or `setSession`)
- The existing auth callback at `/candidate/auth/callback/+server.ts` handles GoTrue flows -- Signicat needs its own callback route because the id_token comes from Signicat, not Supabase
- Implement a `sendEmail` method in the SupabaseDataWriter that calls `send-email` Edge Function via `supabase.functions.invoke('send-email', { body: { templates, recipient_user_ids, from, dry_run } })`
- The send-email Edge Function resolves template variables server-side via `resolve_email_variables()` RPC -- frontend sends locale-keyed templates with `{{variable.path}}` placeholders
- This is a general-purpose admin method for bulk/transactional emails (not tied to invitations -- invite-candidate handles its own email)
- If the DataWriter interface doesn't already have a `sendEmail` method, add one to the interface and base class with admin-only semantics
- Interface method mapping: `preregisterWithApiToken` -> `invite-candidate`, `preregisterWithIdToken` -> `signicat-callback`, new `sendEmail` -> `send-email`
- Both preregister methods already exist in the DataWriter interface -- just implement the Supabase versions

### Claude's Discretion
- Exact Signicat callback route path and implementation details
- How to construct the Signicat OIDC authorization URL (which env vars, which params)
- Whether sendEmail needs a new interface method or can reuse an existing one
- Error handling and retry logic for Edge Function calls
- Test approach for Edge Function integration (mocking supabase.functions.invoke)

### Deferred Ideas (OUT OF SCOPE)
- Admin UI for candidate invitation management -- post-v3.0 admin app milestone
- Admin UI for bulk email sending -- post-v3.0 admin app milestone
- Signicat configuration UI (setting up OIDC endpoints, client IDs) -- deployment concern, not frontend feature
- Email template management UI -- post-v3.0 admin app milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDGE-01 | invite-candidate Edge Function integrated into candidate invite flow | `_preregister` calls `supabase.functions.invoke('invite-candidate', ...)` mapping interface params to Edge Function body; Edge Function handles candidate creation, invite email, role assignment, auth user linking |
| EDGE-02 | signicat-callback Edge Function integrated for bank authentication | New Signicat callback route receives id_token from OIDC redirect, POSTs to `signicat-callback` Edge Function, establishes Supabase session via magic link action_link; existing OIDC flow already handles code exchange and cookie storage |
| EDGE-03 | send-email Edge Function integrated for transactional email | New `sendEmail` method added to DataWriter interface and SupabaseDataWriter calls `supabase.functions.invoke('send-email', ...)` with templates, recipient_user_ids, from, dry_run params |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.99.1 | Supabase client, `functions.invoke()` | Already installed, provides typed Edge Function invocation |
| @supabase/functions-js | 2.99.1 | Underlying functions client (bundled) | Part of supabase-js, provides `FunctionsHttpError`, `FunctionsFetchError` types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | (already installed) | JWT/JWE handling for OIDC tokens | Already used in `getIdTokenClaims.ts` for Signicat token decryption/verification |

### Alternatives Considered
None -- the stack is fully determined by what's already installed.

**Installation:**
No new packages needed. All dependencies are already in the project.

## Architecture Patterns

### Recommended Changes
```
frontend/src/lib/api/
  base/
    dataWriter.type.ts          # ADD: sendEmail method to DataWriter interface
    universalDataWriter.ts      # ADD: sendEmail public method + _sendEmail abstract method
  adapters/
    supabase/
      dataWriter/
        supabaseDataWriter.ts   # IMPLEMENT: _preregister, _sendEmail, override preregisterWithIdToken
        supabaseDataWriter.test.ts  # ADD: tests for Edge Function integration

frontend/src/routes/[[lang=locale]]/
  candidate/
    preregister/
      signicat/oidc/callback/
        +page.svelte            # MODIFY: handle Supabase session establishment after Edge Function call
```

### Pattern 1: Edge Function Invocation via supabase.functions.invoke()

**What:** All Edge Function calls go through the Supabase client's `functions.invoke()` method. The Authorization header with the user's JWT is automatically included by the client.

**When to use:** For all three Edge Function integrations.

**Example:**
```typescript
// Source: Verified from @supabase/functions-js/src/FunctionsClient.ts
const { data, error } = await this.supabase.functions.invoke<ResponseType>(
  'function-name',
  { body: { key: 'value' } }
);

// Error handling
if (error) {
  // error can be FunctionsHttpError (non-2xx), FunctionsFetchError (network),
  // or FunctionsRelayError (relay issue)
  throw new Error(`Edge Function error: ${error.message}`);
}
```

**Key detail:** `functions.invoke()` automatically:
- Sets `Content-Type: application/json` when body is a Record
- Includes the Authorization header from the Supabase client's auth state
- Returns `{ data, error }` where data is parsed JSON for JSON responses
- Throws `FunctionsHttpError` for non-2xx responses (error contains the Response object as context)

### Pattern 2: Existing Preregister Flow (OIDC Code Exchange)

**What:** The current Signicat flow uses a multi-step OIDC authorization code exchange pattern:
1. Frontend redirects to Signicat with PKCE challenge (`+page.svelte` in preregister)
2. Signicat redirects back with `code` to `/candidate/preregister/signicat/oidc/callback/+page.svelte`
3. Callback page calls `exchangeCodeForIdToken()` which POSTs to `/api/oidc/token/+server.ts`
4. Server route exchanges code for id_token at Signicat's token endpoint, stores id_token in httpOnly cookie
5. User proceeds through election/constituency/email selection pages
6. Final preregister call sends email + nominations to `/api/candidate/preregister/+server.ts`
7. Server route reads id_token cookie, decrypts/verifies, calls `preregisterWithApiToken()` with claims

**Critical insight for Supabase migration:** The existing flow keeps the id_token in an httpOnly cookie and does the code exchange server-side. For the Supabase adapter, the flow changes significantly:
- The code exchange step stays the same (or can be kept as-is since it's generic OIDC)
- The final preregister call needs to POST the stored id_token to the `signicat-callback` Edge Function instead of calling Strapi
- The Edge Function returns a magic link `action_link` for session establishment
- The frontend must then navigate to or fetch the `action_link` to establish the Supabase session

### Pattern 3: Error Handling for Edge Functions

**What:** Consistent error handling pattern that maps Edge Function HTTP errors to adapter-level errors.

**Example:**
```typescript
// Source: Established pattern from Phase 26 SupabaseDataWriter
protected async _preregister({ body }: { body: PreregisterBody } & WithAuth): Promise<DataApiActionResult> {
  const { data, error } = await this.supabase.functions.invoke('invite-candidate', {
    body: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      projectId: /* resolve from election context */,
      organizationId: /* optional, from nominations */
    }
  });

  if (error) throw new Error(`invite-candidate: ${error.message}`);
  return { type: 'success' };
}
```

### Anti-Patterns to Avoid
- **Direct fetch() to Edge Functions:** Do NOT use raw `fetch()` to call Edge Functions. Always use `this.supabase.functions.invoke()` which handles auth headers, URL construction, and error types automatically.
- **Client-side id_token handling:** Do NOT pass the raw Signicat id_token to the client. The existing pattern keeps it in an httpOnly cookie on the server. The Supabase adapter should continue this security practice.
- **Reimplementing Edge Function logic in the adapter:** The Edge Functions handle candidate creation, role assignment, and email sending internally. The adapter should only call them and handle the response.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Edge Function HTTP calls | Custom fetch with auth headers | `supabase.functions.invoke()` | Handles auth, content-type, error types automatically |
| Candidate creation during invite | PostgREST insert from adapter | `invite-candidate` Edge Function | Edge Function handles create + invite email + role + auth user atomically |
| Email template variable resolution | Client-side variable substitution | `send-email` Edge Function (uses `resolve_email_variables()` RPC) | Server-side resolution has access to auth.users and full entity context |
| Bank auth user creation | Manual GoTrue admin operations | `signicat-callback` Edge Function | Edge Function handles JWE decryption, JWT verification, user find/create, role assignment |

**Key insight:** All three Edge Functions are self-contained -- they handle authorization, business logic, and side effects internally. The adapter's job is purely to call them with the right parameters and handle the response.

## Common Pitfalls

### Pitfall 1: FunctionsHttpError Contains Response, Not JSON
**What goes wrong:** Treating `error.message` as the Edge Function's JSON error body.
**Why it happens:** `FunctionsHttpError` wraps the raw `Response` object in `error.context`, not the parsed JSON error. The `error.message` is a generic "Edge Function returned a non-2xx status code".
**How to avoid:** For detailed error messages, read the response body from `error.context`:
```typescript
if (error instanceof FunctionsHttpError) {
  const errorBody = await error.context.json();
  throw new Error(errorBody.error || error.message);
}
```
**Warning signs:** All Edge Function errors show the same generic message instead of specific error details.

### Pitfall 2: Magic Link action_link Is an Absolute URL
**What goes wrong:** Treating the `session.action_link` from `signicat-callback` as a relative URL or trying to parse tokens from it.
**Why it happens:** `generateLink()` in Supabase returns a full URL like `http://localhost:54321/auth/v1/verify?token=...&type=magiclink&redirect_to=...`
**How to avoid:** The action_link contains `token_hash` and `type` parameters that can be extracted and passed to `supabase.auth.verifyOtp()` directly, or the link can be fetched server-side. The existing auth callback at `/candidate/auth/callback/+server.ts` already handles this pattern via `verifyOtp({ token_hash, type })`.
**Warning signs:** Redirect loops, 401 errors when establishing session.

### Pitfall 3: preregisterWithIdToken Has Different Semantics in Supabase
**What goes wrong:** Trying to follow the exact same flow as Strapi's `preregisterWithIdToken`.
**Why it happens:** In Strapi, `preregisterWithIdToken` calls a server API route which reads the id_token cookie and creates the candidate via Strapi API. In Supabase, the `signicat-callback` Edge Function both creates the candidate AND returns session data for immediate login.
**How to avoid:** The Supabase `preregisterWithIdToken` must be a two-phase operation: (1) call the Edge Function with the id_token, (2) establish a Supabase auth session from the returned magic link data. This is fundamentally different from Strapi where session establishment happens through a separate invite-based registration flow.
**Warning signs:** Candidate is created but user can't log in, or session is not established.

### Pitfall 4: Edge Function Auth Header Not Sent in SSR Context
**What goes wrong:** `functions.invoke()` fails with 401 when called from server-side code without proper session.
**Why it happens:** The Supabase client created via `supabaseAdapterMixin` may be either a browser client (with cookies) or a server client (from `locals.supabase`). The server client has the session from hooks.server.ts, but if the adapter is initialized without `serverClient`, auth headers may not be set.
**How to avoid:** Ensure admin-only Edge Function calls (`invite-candidate`, `send-email`) use a properly authenticated server client. For `signicat-callback`, the call is unauthenticated (no user session yet) -- the Edge Function uses service_role key internally.
**Warning signs:** 401 "Missing Authorization header" errors from Edge Functions.

### Pitfall 5: projectId Resolution for invite-candidate
**What goes wrong:** Passing the wrong `projectId` to the invite-candidate Edge Function.
**Why it happens:** The `_preregister` interface receives `nominations: Array<{ electionId, constituencyId }>` but the Edge Function needs `projectId`. There's no direct mapping from electionId to projectId in the nominations array.
**How to avoid:** `projectId` must be resolved from the election context. Options: (1) query the `elections` table to get `project_id` from `election_id`, or (2) if the admin session has project context in JWT claims, extract it. The Edge Function validates that the caller has admin access to the specified project.
**Warning signs:** Edge Function returns 403 "caller does not have admin role for this project".

### Pitfall 6: signicat-callback Without Authorization Header
**What goes wrong:** `signicat-callback` Edge Function requires no Authorization header from the caller (it's called before the user has a Supabase session), but `functions.invoke()` automatically includes the auth header if a session exists.
**Why it happens:** The Signicat callback is called when the user doesn't have a Supabase session yet -- they're authenticating via bank ID. However, if there's a stale session, the auth header could be included but invalid.
**How to avoid:** The `signicat-callback` Edge Function actually does NOT require an Authorization header (unlike `invite-candidate` and `send-email`). It uses `service_role` key internally. The `functions.invoke()` call will still include the anon key, which is fine.
**Warning signs:** None expected -- this should work naturally.

## Code Examples

### EDGE-01: _preregister Implementation for invite-candidate

```typescript
// Source: Verified from Edge Function contract at apps/supabase/supabase/functions/invite-candidate/index.ts
// Edge Function expects: POST { firstName, lastName, email, projectId, organizationId? }
// Edge Function returns: { success: true, candidateId, userId }

protected async _preregister({
  body
}: {
  body: {
    firstName: string;
    lastName: string;
    identifier: string;  // Ignored for Supabase (email-based invite, not personal ID)
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
  };
} & WithAuth): Promise<DataApiActionResult> {
  // Resolve projectId from the first nomination's electionId
  const { data: election, error: electionError } = await this.supabase
    .from('elections')
    .select('project_id')
    .eq('id', body.nominations[0].electionId)
    .single();
  if (electionError || !election)
    throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

  const { data, error } = await this.supabase.functions.invoke('invite-candidate', {
    body: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      projectId: election.project_id
      // organizationId: optional, could be resolved from nominations if needed
    }
  });

  if (error) throw new Error(`invite-candidate: ${error.message}`);
  return { type: 'success' };
}
```

### EDGE-02: Signicat Callback Session Establishment

```typescript
// Source: Verified from Edge Function at apps/supabase/supabase/functions/signicat-callback/index.ts
// Edge Function expects: POST { id_token, project_id? }
// Edge Function returns: { success, user_id, candidate_id, is_new_user, session: { action_link, hashed_token, ... } }

// In the callback route or DataWriter method:
const { data, error } = await supabase.functions.invoke('signicat-callback', {
  body: {
    id_token: idToken,
    project_id: projectId  // Optional, defaults to DEFAULT_PROJECT_ID in Edge Function
  }
});

if (error) throw new Error(`signicat-callback: ${error.message}`);

// Establish Supabase session from the magic link
if (data.session?.action_link) {
  // Extract token_hash from action_link URL
  const actionUrl = new URL(data.session.action_link);
  const tokenHash = actionUrl.searchParams.get('token');
  const type = actionUrl.searchParams.get('type') as EmailOtpType;

  // Use verifyOtp to establish session (same pattern as existing auth callback)
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash!,
    type: type ?? 'magiclink'
  });

  if (verifyError) throw new Error(`Session establishment failed: ${verifyError.message}`);
}
```

### EDGE-03: sendEmail Implementation

```typescript
// Source: Verified from Edge Function at apps/supabase/supabase/functions/send-email/index.ts
// Edge Function expects: POST { templates, recipient_user_ids, from?, dry_run? }
// Edge Function returns: { success, sent, failed, dry_run, results }

// Interface addition:
sendEmail: (opts: SendEmailOptions) => DWReturnType<SendEmailResult, TType>;

// Type definitions:
type SendEmailOptions = WithAuth & {
  templates: Record<string, { subject: string; body: string }>;
  recipientUserIds: string[];
  from?: string;
  dryRun?: boolean;
};

type SendEmailResult = DataApiActionResult & {
  sent?: number;
  failed?: number;
  results?: Array<{ user_id: string; email: string; status?: string; error?: string }>;
};

// Implementation:
async sendEmail(opts: SendEmailOptions): DWReturnType<SendEmailResult> {
  return this._sendEmail(opts);
}

protected async _sendEmail({
  templates,
  recipientUserIds,
  from,
  dryRun
}: SendEmailOptions): Promise<SendEmailResult> {
  const { data, error } = await this.supabase.functions.invoke('send-email', {
    body: {
      templates,
      recipient_user_ids: recipientUserIds,
      from,
      dry_run: dryRun
    }
  });

  if (error) throw new Error(`send-email: ${error.message}`);
  return { type: 'success', sent: data.sent, failed: data.failed, results: data.results };
}
```

### Test Pattern: Mocking supabase.functions.invoke

```typescript
// Source: Established mock pattern from existing supabaseDataWriter.test.ts
function createMockSupabaseClient() {
  return {
    auth: { /* existing mocks */ },
    rpc: vi.fn(),
    from: vi.fn(),
    storage: { from: vi.fn() },
    // ADD: functions mock
    functions: {
      invoke: vi.fn()
    }
  };
}

// Usage in test:
it('calls invite-candidate Edge Function', async () => {
  mockSupabase.functions.invoke.mockResolvedValue({
    data: { success: true, candidateId: 'cand-1', userId: 'user-1' },
    error: null
  });

  // Also mock elections table lookup for projectId resolution
  const selectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { project_id: 'proj-1' }, error: null })
    })
  });
  mockSupabase.from.mockReturnValue({ select: selectMock });

  const result = await writer.preregisterWithApiToken({
    body: {
      firstName: 'Test',
      lastName: 'User',
      identifier: '1990-01-01',
      email: 'test@example.com',
      nominations: [{ electionId: 'elec-1', constituencyId: 'const-1' }]
    },
    authToken: ''
  });

  expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('invite-candidate', {
    body: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      projectId: 'proj-1'
    }
  });
  expect(result).toEqual({ type: 'success' });
});
```

## State of the Art

| Old Approach (Strapi) | Current Approach (Supabase) | Impact |
|----------------------|----------------------------|--------|
| `preregisterWithApiToken` -> Strapi `apiPost` | `_preregister` -> `supabase.functions.invoke('invite-candidate')` | Edge Function handles everything atomically |
| `preregisterWithIdToken` -> server route -> Strapi `preregisterCandidate` | `preregisterWithIdToken` -> `supabase.functions.invoke('signicat-callback')` + session establishment | Simpler: Edge Function creates user + candidate + role in one call |
| No general email method | New `sendEmail` -> `supabase.functions.invoke('send-email')` | Adds new capability not present in Strapi adapter |
| id_token stored in httpOnly cookie, decoded server-side | Same cookie pattern, but final call goes to Edge Function instead of Strapi | Cookie security model preserved |

**Key architectural difference:** In Strapi, the server routes (`/api/oidc/token`, `/api/candidate/preregister`) acted as middleware between the frontend and Strapi. In Supabase, the Edge Functions serve this role directly, so some server routes may become pass-throughs or can be simplified.

## Open Questions

1. **How should preregisterWithIdToken interact with the existing OIDC flow?**
   - What we know: The current flow stores the id_token in an httpOnly cookie via `/api/oidc/token/+server.ts`. The `preregisterWithIdToken` method is called from the email submission page with the id_token retrieved from the cookie.
   - What's unclear: Should the Supabase adapter's `preregisterWithIdToken` call the Edge Function directly from the existing server route (`/api/candidate/preregister/+server.ts`), or should the callback page call it directly? The server route approach maintains the httpOnly cookie security model. The direct approach is simpler.
   - Recommendation: Keep the existing server route pattern. Modify `/api/candidate/preregister/+server.ts` to detect Supabase adapter and call `signicat-callback` Edge Function instead of `preregisterWithApiToken`. The id_token remains in the httpOnly cookie, read server-side only.

2. **Should sendEmail be added to the DataWriter interface or kept Supabase-only?**
   - What we know: The DataWriter interface currently has no `sendEmail` method. Strapi's email was handled internally by the backend, not via the frontend adapter.
   - What's unclear: Whether other adapters (Strapi, future adapters) would need this method.
   - Recommendation: Add `sendEmail` to the DataWriter interface and UniversalDataWriter abstract class. The Strapi implementation can throw "not implemented" (same pattern used for other methods). This ensures interface consistency and allows future adapters to implement it.

3. **Session establishment after signicat-callback**
   - What we know: The Edge Function returns `session.action_link` containing a magic link URL with token parameters. The existing auth callback at `/candidate/auth/callback/+server.ts` handles `verifyOtp` for GoTrue redirects.
   - What's unclear: Whether the action_link should be followed via browser redirect (which would go through the existing auth callback) or if `verifyOtp` should be called directly server-side.
   - Recommendation: Extract `token_hash` and `type` from the `action_link` URL and call `verifyOtp` directly server-side. This avoids an unnecessary redirect and keeps the flow within the preregister server route.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && yarn test:unit --run` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDGE-01 | _preregister calls invite-candidate Edge Function with correct params | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts -t "preregister"` | Partially (file exists, test case needed) |
| EDGE-01 | _preregister resolves projectId from electionId | unit | Same as above | Wave 0 |
| EDGE-01 | _preregister throws on Edge Function error | unit | Same as above | Wave 0 |
| EDGE-02 | preregisterWithIdToken calls signicat-callback Edge Function | unit | Same as above | Wave 0 |
| EDGE-02 | preregisterWithIdToken establishes session from magic link | unit | Same as above | Wave 0 |
| EDGE-02 | preregisterWithIdToken handles missing session (fallback) | unit | Same as above | Wave 0 |
| EDGE-03 | sendEmail calls send-email Edge Function with correct params | unit | Same as above | Wave 0 |
| EDGE-03 | sendEmail handles dry_run mode | unit | Same as above | Wave 0 |
| EDGE-03 | sendEmail throws on Edge Function error | unit | Same as above | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `supabaseDataWriter.test.ts` -- add `functions.invoke` mock to existing mock factory
- [ ] `supabaseDataWriter.test.ts` -- add test cases for EDGE-01 (_preregister with invite-candidate)
- [ ] `supabaseDataWriter.test.ts` -- add test cases for EDGE-03 (sendEmail with send-email)
- [ ] EDGE-02 tests require more complex mocking (verifyOtp session establishment) -- may need separate test file or integration approach

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/functions/invite-candidate/index.ts` -- Full Edge Function source with API contract
- `apps/supabase/supabase/functions/signicat-callback/index.ts` -- Full Edge Function source with JWE/JWT handling and session generation
- `apps/supabase/supabase/functions/send-email/index.ts` -- Full Edge Function source with template resolution and SMTP sending
- `frontend/src/lib/api/base/dataWriter.type.ts` -- DataWriter interface showing existing method signatures
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` -- Current Supabase adapter with _preregister stub
- `node_modules/@supabase/functions-js/src/FunctionsClient.ts` -- functions.invoke() API and error types
- `node_modules/@supabase/functions-js/src/types.ts` -- FunctionInvokeOptions, FunctionsHttpError, FunctionsResponse types
- `frontend/src/routes/[[lang=locale]]/candidate/preregister/+page.svelte` -- Current OIDC redirect flow with PKCE
- `frontend/src/routes/[[lang=locale]]/api/oidc/token/+server.ts` -- Current OIDC code exchange server route
- `frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts` -- Current preregister server route (reads id_token cookie)

### Secondary (MEDIUM confidence)
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` -- Strapi _preregister implementation as behavioral reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions verified from node_modules
- Architecture: HIGH -- Edge Function contracts verified from source, existing adapter patterns well-established across 6 prior phases
- Pitfalls: HIGH -- identified from direct source code analysis of Edge Functions and existing auth flows

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- Edge Functions already built, adapter patterns established)

# Phase 10: Authentication and Roles - Research

**Researched:** 2026-03-13
**Domain:** Supabase Auth, RLS, Custom Access Token Hooks, @supabase/ssr, Edge Functions, Signicat OIDC
**Confidence:** HIGH

## Summary

Phase 10 replaces the current Strapi-based authentication with Supabase Auth. The core work involves: (1) creating a `user_roles` table with scoped role assignments, (2) writing a Custom Access Token Hook (PostgreSQL function) to inject roles into JWTs, (3) replacing all 16 deny-all RLS placeholder policies with real role-based policies, (4) creating an Edge Function for the pre-registration invite flow, (5) integrating `@supabase/ssr` into SvelteKit `hooks.server.ts`, and (6) adding Signicat OIDC bank auth as a follow-up integration.

The existing schema from Phase 9 has deny-all policies on every table, `candidates` table has a comment placeholder for `auth_user_id`, and there are no Edge Functions yet. The `@openvaa/app-shared` `validatePassword()` utility can be carried forward. The existing `getIdTokenClaims.ts` in the frontend handles JWE decryption for Signicat and provides the pattern for the new integration.

**Primary recommendation:** Build in layers -- user_roles table + Custom Access Token Hook first, then RLS policies, then SvelteKit integration, then Edge Function invite flow, then Signicat OIDC last. Each layer is independently testable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Supabase's native `inviteUserByEmail()` for admin-initiated candidate invites
- Edge Function API endpoint handles the full flow: accepts candidate details (name, email, election/party), creates the candidate DB record, and calls `inviteUserByEmail()`
- Signicat bank auth is a separate self-service pre-registration path -- any candidate authenticating via bank ID gets a candidate user created automatically
- Two distinct onboarding paths: (1) admin invite via email, (2) self-service via Signicat bank auth
- Bank auth creates an immediate Supabase session -- candidate is logged in right away
- After bank auth, candidate is prompted to enter an email address, which is confirmed via Supabase's email verification flow
- Candidates who registered via bank auth can also set a password and log in with email/password (both auth methods available)
- Signicat implemented as a follow-up after core email/password auth + roles + RLS are working
- Multiple roles per user -- a single user can have several role assignments simultaneously
- `user_roles` table with rows: (user_id, role, scope_type, scope_id)
- Five role types: candidate, party, project_admin, account_admin, super_admin
- Party role scoped to a specific party_id (not project-level)
- Candidate role scoped to candidate_id
- Account admin accesses all projects within their account
- All user_roles rows injected into JWT via Custom Access Token Hook
- RLS policies read role/scope data directly from `auth.jwt()` claims
- Anon (voter) read access via RLS policies granting SELECT to the anon role
- Published flag on key tables -- anon RLS only allows SELECT WHERE published = true
- Candidates can edit all their own fields except structural ones (project_id, role assignments)
- Answer locking (deadline-based) enforced at application layer, not RLS
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Email/password login for candidates via Supabase Auth | Built-in Supabase Auth email/password; @supabase/ssr handles session cookies |
| AUTH-02 | Password reset for candidates via email link | Supabase `resetPasswordForEmail()` + Inbucket for local dev |
| AUTH-03 | Candidate pre-registration invite flow via Edge Function | `inviteUserByEmail()` admin API + Edge Function with service_role client |
| AUTH-04 | `user_roles` table with scoped role assignments | Custom table schema with enum types, FK to auth.users |
| AUTH-05 | Five role types enforced via RLS | Per-operation RLS policies using `auth.jwt()` claims with helper functions |
| AUTH-06 | Custom Access Token Hook injects roles into JWT | PostgreSQL function `custom_access_token_hook` reading from user_roles |
| AUTH-07 | SvelteKit hooks.server.ts creates per-request Supabase server client | `@supabase/ssr` createServerClient with cookie getAll/setAll pattern |
| AUTH-08 | Signicat OIDC bank auth integrated with Supabase session | Edge Function approach: decrypt JWE, verify JWT, call admin.createUser + generateLink |
| MTNT-04 | RLS policies enforce project-level data isolation via JWT claims | Role scoping in JWT claims, project_id checks in USING/WITH CHECK |
| MTNT-05 | Candidate-to-auth-user link explicit in schema | `auth_user_id uuid REFERENCES auth.users(id)` column on candidates table |
| MTNT-06 | Party-to-auth-user link in schema | `auth_user_id uuid REFERENCES auth.users(id)` column on organizations table |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Supabase client (browser + server) | Required by @supabase/ssr |
| @supabase/ssr | ^0.9.0 | SSR cookie-based auth for SvelteKit | Official Supabase SSR package, replaces deprecated auth-helpers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/supabase-types | workspace:^ | Generated TypeScript types | Already exists; regenerate after schema changes |
| @openvaa/app-shared | workspace:^ | validatePassword() utility | Password validation on registration/change password |
| jose | ^5.9.6 | JWE/JWT decryption for Signicat | Already in frontend dependencies; used for bank auth token handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Access Token Hook (pg function) | app_metadata on user record | Hook is cleaner -- no manual metadata sync, all roles always current |
| Edge Function for invite | SvelteKit API route with service_role | Edge Function keeps admin credentials server-side, closer to Supabase |
| Edge Function for Signicat | Supabase external OAuth provider config | Signicat uses JWE (encrypted tokens) which Supabase can't natively verify |

**Installation:**
```bash
yarn workspace @openvaa/frontend add @supabase/supabase-js @supabase/ssr
```

## Architecture Patterns

### Recommended Project Structure
```
apps/supabase/supabase/
  schema/
    000-functions.sql          # Existing + new helper functions
    010-rls.sql                # REPLACE deny-all with real policies
    011-auth-tables.sql        # NEW: user_roles table, published columns
    012-auth-hooks.sql         # NEW: custom_access_token_hook function
    013-auth-rls.sql           # NEW: RLS policies for user_roles
  functions/
    invite-candidate/
      index.ts                 # Edge Function: pre-registration invite
    signicat-callback/
      index.ts                 # Edge Function: bank auth callback
  config.toml                  # Enable auth hook
  seed.sql                     # Add test user_roles entries

frontend/src/
  hooks.server.ts              # MODIFY: add @supabase/ssr integration
  app.d.ts                     # MODIFY: add Supabase types to Locals
  lib/
    supabase/
      server.ts                # Helper: createServerClient factory
      browser.ts               # Helper: createBrowserClient factory
```

### Pattern 1: Custom Access Token Hook
**What:** PostgreSQL function that injects user roles into JWT claims before token issuance
**When to use:** Every auth token refresh/login -- automatic via Supabase Auth
**Example:**
```sql
-- Source: Supabase official docs (custom-access-token-hook)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_roles_claim jsonb;
BEGIN
  claims := event->'claims';

  -- Fetch all role assignments for this user
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'role', ur.role::text,
      'scope_type', ur.scope_type,
      'scope_id', ur.scope_id
    )
  ), '[]'::jsonb)
  INTO user_roles_claim
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::uuid;

  -- Inject into JWT claims
  claims := jsonb_set(claims, '{user_roles}', user_roles_claim);

  -- Return modified event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

### Pattern 2: RLS Helper Functions
**What:** Security-definer helper functions that check role scoping from JWT claims
**When to use:** Called from RLS policies to avoid complex inline expressions
**Example:**
```sql
-- Check if current user has a specific role with matching scope
CREATE OR REPLACE FUNCTION public.has_role(
  check_role text,
  check_scope_type text DEFAULT NULL,
  check_scope_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF role_entry->>'role' = check_role THEN
      -- super_admin matches everything
      IF check_role = 'super_admin' THEN RETURN true; END IF;
      -- Check scope match
      IF check_scope_type IS NULL THEN RETURN true; END IF;
      IF role_entry->>'scope_type' = check_scope_type
         AND role_entry->>'scope_id' = check_scope_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

-- Check if current user can access a specific project
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
  p_account_id uuid;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    -- super_admin can access anything
    IF role_entry->>'role' = 'super_admin' THEN RETURN true; END IF;
    -- project_admin for this project
    IF role_entry->>'role' = 'project_admin'
       AND role_entry->>'scope_type' = 'project'
       AND role_entry->>'scope_id' = p_project_id::text THEN
      RETURN true;
    END IF;
    -- account_admin for the project's account
    IF role_entry->>'role' = 'account_admin' THEN
      SELECT account_id INTO p_account_id FROM public.projects WHERE id = p_project_id;
      IF role_entry->>'scope_type' = 'account'
         AND role_entry->>'scope_id' = p_account_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;
```

### Pattern 3: Per-Operation RLS Policies
**What:** Separate policies for SELECT, INSERT, UPDATE, DELETE with role-specific grants
**When to use:** Every table needs policies after replacing deny-all placeholders
**Example:**
```sql
-- Candidates table example: anon read (published), candidate self-edit, admin full
CREATE POLICY "anon_select_candidates"
  ON candidates FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_candidates"
  ON candidates FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
  );

CREATE POLICY "candidate_update_own"
  ON candidates FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    -- Prevent modifying structural fields by checking they haven't changed
    AND project_id = project_id  -- no-op but documents intent
  );

CREATE POLICY "admin_insert_candidates"
  ON candidates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_candidates"
  ON candidates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_candidates"
  ON candidates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));
```

### Pattern 4: SvelteKit @supabase/ssr Integration
**What:** Per-request Supabase server client in hooks.server.ts with cookie-based auth
**When to use:** Every server-side request in SvelteKit
**Example:**
```typescript
// Source: Supabase official docs + verified community patterns
// frontend/src/hooks.server.ts
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' });
          });
        }
      }
    }
  );

  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  // ... existing locale handling ...

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
```

### Pattern 5: Edge Function Invite Flow
**What:** Deno Edge Function that creates candidate record + sends invite email
**When to use:** Admin pre-registration of candidates
**Example:**
```typescript
// Source: Supabase Edge Functions docs + inviteUserByEmail API
// apps/supabase/supabase/functions/invite-candidate/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify the requesting user is an admin
  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser();

  // ... verify user has project_admin/account_admin/super_admin role ...

  const { firstName, lastName, email, projectId, organizationId } = await req.json();

  // Create candidate record
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from('candidates')
    .insert({ first_name: firstName, last_name: lastName, project_id: projectId, organization_id: organizationId })
    .select()
    .single();

  // Send invite email
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin
    .inviteUserByEmail(email, {
      data: { candidate_id: candidate.id, project_id: projectId },
      redirectTo: `${Deno.env.get('SITE_URL')}/candidate/complete-registration`
    });

  // Create role assignment
  await supabaseAdmin.from('user_roles').insert({
    user_id: inviteData.user.id,
    role: 'candidate',
    scope_type: 'candidate',
    scope_id: candidate.id
  });

  // Link auth user to candidate
  await supabaseAdmin.from('candidates')
    .update({ auth_user_id: inviteData.user.id })
    .eq('id', candidate.id);

  return new Response(JSON.stringify({ success: true, candidateId: candidate.id }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Anti-Patterns to Avoid
- **Querying user_roles table in every RLS policy:** Use JWT claims via `auth.jwt()->'user_roles'` instead. The Custom Access Token Hook puts roles in the token so no DB lookup is needed per request.
- **Using raw `auth.uid()` or `auth.jwt()` without SELECT wrapper:** Always use `(SELECT auth.uid())` and `(SELECT auth.jwt())` for the Postgres optimizer to cache the result per-statement.
- **Using `user_metadata` for authorization:** `raw_user_meta_data` can be modified by authenticated users via `supabase.auth.update()`. Always use `app_metadata` or custom JWT claims for authorization data.
- **Overly broad RLS policies:** Always specify `TO anon` or `TO authenticated` to prevent unnecessary policy evaluation.
- **Missing indexes on RLS-referenced columns:** `auth_user_id` columns need B-tree indexes for efficient RLS evaluation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token management | Custom JWT signing/verification | Supabase Auth + @supabase/ssr | Handles refresh, rotation, httpOnly cookies automatically |
| Email sending for invite/reset | Custom SMTP integration | Supabase Auth email + Inbucket (dev) | Built-in templates, rate limiting, deliverability |
| Password hashing | bcrypt/argon2 implementation | Supabase Auth | Secure defaults, timing-safe comparison |
| Session cookie management | Manual cookie read/write | @supabase/ssr getAll/setAll | Handles chunked cookies, SameSite, expiry |
| PKCE/OAuth flows | Custom state/nonce management | Supabase Auth PKCE | Security-critical, easy to get wrong |

**Key insight:** Supabase Auth handles the entire authentication lifecycle. The Custom Access Token Hook is the single point where custom authorization data enters the JWT. RLS policies then consume JWT claims without any application-layer middleware.

## Common Pitfalls

### Pitfall 1: Circular RLS on user_roles
**What goes wrong:** The Custom Access Token Hook reads from `user_roles`, but if `user_roles` has RLS enabled, the hook (running as `supabase_auth_admin`) gets blocked.
**Why it happens:** Auth hooks run as `supabase_auth_admin` role, not as the user.
**How to avoid:** Grant explicit SELECT permission to `supabase_auth_admin` on `user_roles` and create a permissive policy for that role. Also `REVOKE ALL ON public.user_roles FROM authenticated, anon, public` so only admins and the auth system can read roles.
**Warning signs:** Login returns empty JWT claims; hook errors in Supabase logs.

### Pitfall 2: getSession() vs getUser() in hooks
**What goes wrong:** Using only `getSession()` to check auth status. The session data comes from cookies and could be tampered with.
**Why it happens:** `getSession()` reads from local storage/cookies without server verification.
**How to avoid:** Always call `getUser()` after `getSession()` to verify the session against the Supabase Auth server. The `safeGetSession()` pattern does this correctly.
**Warning signs:** Auth seems to work but user data is stale or spoofable.

### Pitfall 3: Missing USING/WITH CHECK clause combinations
**What goes wrong:** INSERT policies need `WITH CHECK` (not `USING`), UPDATE needs both, DELETE needs only `USING`.
**Why it happens:** Mixing up which clause applies to which operation.
**How to avoid:** Follow strict patterns: SELECT=USING, INSERT=WITH CHECK, UPDATE=USING+WITH CHECK, DELETE=USING.
**Warning signs:** Policies silently fail, "new row violates RLS" errors.

### Pitfall 4: PKCE not supported with inviteUserByEmail
**What goes wrong:** Trying to use PKCE flow with invite links fails because the inviting browser differs from the accepting browser.
**Why it happens:** PKCE requires code_verifier on the same browser that initiated the flow.
**How to avoid:** Accept that invite links use the implicit/hashed token flow. The `inviteUserByEmail()` API handles this correctly.
**Warning signs:** Invite links fail with PKCE-related errors.

### Pitfall 5: Forgetting to wrap auth functions in SELECT
**What goes wrong:** `auth.uid()` or `auth.jwt()` called inline in RLS policy runs per-row instead of once per query.
**Why it happens:** Postgres optimizer can't cache the function result without the SELECT wrapper.
**How to avoid:** Always write `(SELECT auth.uid())` and `(SELECT auth.jwt() -> 'user_roles')`.
**Warning signs:** Slow queries on large tables; same function called thousands of times.

### Pitfall 6: published flag missing from anon queries
**What goes wrong:** Anonymous users can see unpublished/draft data.
**Why it happens:** Anon SELECT policy doesn't check `published = true`.
**How to avoid:** Every table that needs anon read access must have a `published` boolean column (default `false`) and the anon SELECT policy must include `USING (published = true)`.
**Warning signs:** Draft elections/candidates visible to voters.

### Pitfall 7: Structural field protection in candidate self-edit
**What goes wrong:** Candidate changes their own `project_id` or `auth_user_id` via UPDATE.
**Why it happens:** RLS `WITH CHECK` only verifies the new row state, not what changed.
**How to avoid:** Use a trigger function to prevent modification of structural columns, OR use column-level grants (`REVOKE UPDATE (project_id, auth_user_id) ON candidates FROM authenticated`), OR use application-layer checks.
**Warning signs:** Candidate escalates to different project.

## Code Examples

### user_roles Table Schema
```sql
-- Source: Supabase RBAC docs + project-specific scoping
CREATE TYPE user_role_type AS ENUM (
  'candidate', 'party', 'project_admin', 'account_admin', 'super_admin'
);

CREATE TABLE user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role_type NOT NULL,
  scope_type text        NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
  scope_id   uuid,                  -- NULL for super_admin (global scope)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

-- Index for Custom Access Token Hook lookups
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
```

### auth_user_id Column Addition
```sql
-- Add to candidates table
ALTER TABLE candidates
  ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_candidates_auth_user_id ON candidates (auth_user_id);

-- Add to organizations table (for party admin linking)
ALTER TABLE organizations
  ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_organizations_auth_user_id ON organizations (auth_user_id);
```

### published Column Addition
```sql
-- Tables needing anon read access with publish control
ALTER TABLE elections ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE candidates ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE questions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE question_categories ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE nominations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE constituencies ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE constituency_groups ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE factions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE alliances ADD COLUMN published boolean NOT NULL DEFAULT false;

-- Indexes for published flag (used in anon RLS)
CREATE INDEX idx_elections_published ON elections (published) WHERE published = true;
CREATE INDEX idx_candidates_published ON candidates (published) WHERE published = true;
```

### Custom Access Token Hook Permissions
```sql
-- Grant the auth admin access to read user_roles
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;

-- Prevent regular users from reading the user_roles table directly
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;

-- RLS policy for auth admin to read user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_admin_read_user_roles"
  ON user_roles FOR SELECT TO supabase_auth_admin
  USING (true);

-- Admin users can manage roles via service_role (Edge Functions)
CREATE POLICY "service_role_manage_user_roles"
  ON user_roles FOR ALL TO postgres
  USING (true);
```

### config.toml Auth Hook Configuration
```toml
# Add to existing [auth] section in config.toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

### SvelteKit app.d.ts Type Declarations
```typescript
// Source: Supabase SSR docs + @openvaa/supabase-types
import type { Database } from '@openvaa/supabase-types';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession(): Promise<{
        session: Session | null;
        user: User | null;
      }>;
      currentLocale: string;
      preferredLocale?: string;
    }
    interface PageData {
      session?: Session | null;
      user?: User | null;
    }
  }
}
```

### JWT Claims Structure (Recommended)
```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "candidate@example.com",
  "role": "authenticated",
  "user_roles": [
    {
      "role": "candidate",
      "scope_type": "candidate",
      "scope_id": "candidate-uuid"
    },
    {
      "role": "project_admin",
      "scope_type": "project",
      "scope_id": "project-uuid"
    }
  ]
}
```

### Signicat OIDC Integration (Edge Function Approach)
```typescript
// Recommended approach: Edge Function handles JWE decryption + session creation
// apps/supabase/supabase/functions/signicat-callback/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';

Deno.serve(async (req) => {
  const { id_token } = await req.json();

  // Step 1: Decrypt JWE (Signicat encrypted token)
  const privateJWKSet = JSON.parse(Deno.env.get('SIGNICAT_DECRYPTION_JWKS')!);
  const { kid } = jose.decodeProtectedHeader(id_token);
  const privateKey = privateJWKSet.find((jwk: jose.JWK) => jwk.kid === kid);
  const { plaintext } = await jose.compactDecrypt(id_token, await jose.importJWK(privateKey));

  // Step 2: Verify signed JWT
  const jwksUri = Deno.env.get('SIGNICAT_JWKS_URI')!;
  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    jose.createRemoteJWKSet(new URL(jwksUri))
  );

  const { given_name, family_name, birthdate } = payload;

  // Step 3: Create or find user in Supabase Auth
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ... find existing candidate by birthdate identifier or create new ...
  // ... create auth user, candidate record, role assignment ...
  // ... generate magic link for immediate session ...

  return new Response(JSON.stringify({ session: /* ... */ }));
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-sveltekit | @supabase/ssr | 2024 | Single package for all frameworks; auth-helpers deprecated |
| app_metadata for custom claims | Custom Access Token Hook | 2024 | No manual metadata sync; hook runs on every token issue |
| Separate JWT signing for custom providers | Third-party auth support | 2024-2025 | External OIDC providers can be trusted directly |
| Deno 1 edge runtime | Deno 2 edge runtime | 2024-2025 | config.toml `deno_version = 2` already set |

**Deprecated/outdated:**
- `@supabase/auth-helpers-sveltekit`: Replaced by `@supabase/ssr`
- `supabase.auth.session()`: Removed; use `getSession()` + `getUser()` pattern
- Direct `raw_app_meta_data` modification for roles: Use Custom Access Token Hook instead

## Open Questions

1. **Signicat JWE vs plain JWT configuration**
   - What we know: Signicat supports both signed (JWS) and encrypted (nested JWE) id_tokens. Encryption is opt-in via dashboard settings. The existing OpenVAA code (`getIdTokenClaims.ts`) handles JWE decryption, meaning the current Signicat client IS configured for encryption.
   - What's unclear: Whether the Signicat configuration can be changed to return plain JWTs (which would simplify integration), or whether JWE is required for Finnish bank auth compliance.
   - Recommendation: Keep the JWE decryption approach since it works today. The Edge Function can use the same `jose` library pattern from `getIdTokenClaims.ts`. If Signicat is later reconfigured to plain JWTs, the Edge Function simplifies (remove decryption step).

2. **Candidate structural field protection mechanism**
   - What we know: Candidates should edit their own data but NOT `project_id`, `auth_user_id`, or `organization_id`.
   - What's unclear: Whether to use column-level REVOKE, trigger-based protection, or application-layer enforcement.
   - Recommendation: Use column-level REVOKE (`REVOKE UPDATE (project_id, auth_user_id, organization_id) ON candidates FROM authenticated`) as the most straightforward PostgreSQL-native approach. This works transparently with PostgREST.

3. **Supabase auth.users table access from RLS**
   - What we know: RLS policies can reference `auth.uid()` and `auth.jwt()` but direct joins to `auth.users` table from public schema are discouraged.
   - What's unclear: Whether helper functions in RLS policies can safely reference `auth.users` if needed.
   - Recommendation: Avoid joining `auth.users` in RLS. All authorization data should flow through JWT claims via the Custom Access Token Hook. This is the Supabase-recommended pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual SQL verification + psql scripts |
| Config file | None -- Wave 0 gap |
| Quick run command | `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f test.sql` |
| Full suite command | `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f tests/auth-tests.sql` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password login creates session | manual | Supabase Studio or curl to auth endpoint | N/A |
| AUTH-02 | Password reset email sent, link works | manual | Check Inbucket at localhost:54324 | N/A |
| AUTH-03 | Edge Function creates candidate + sends invite | smoke | `curl -X POST http://127.0.0.1:54321/functions/v1/invite-candidate` | N/A -- Wave 0 |
| AUTH-04 | user_roles table accepts scoped assignments | unit (SQL) | `psql` INSERT + SELECT verification | N/A -- Wave 0 |
| AUTH-05 | RLS enforces role-based access | integration (SQL) | `psql` queries as different roles | N/A -- Wave 0 |
| AUTH-06 | JWT contains user_roles after login | smoke | Login via API, decode JWT, check claims | N/A -- Wave 0 |
| AUTH-07 | SvelteKit creates per-request Supabase client | manual | Browser dev tools, check cookies set | N/A |
| AUTH-08 | Signicat callback returns valid session | manual | End-to-end with Signicat test credentials | N/A |
| MTNT-04 | Cross-project access denied | integration (SQL) | `psql` SET ROLE + query cross-project data | N/A -- Wave 0 |
| MTNT-05 | Candidate linked to auth user | unit (SQL) | `psql` INSERT candidate with auth_user_id FK | N/A -- Wave 0 |
| MTNT-06 | Organization linked to auth user | unit (SQL) | `psql` INSERT organization with auth_user_id FK | N/A -- Wave 0 |

### Sampling Rate
- **Per task commit:** Manual SQL verification against local Supabase
- **Per wave merge:** Full auth flow test (signup, login, RLS check, invite, password reset)
- **Phase gate:** All RLS policies verified with multi-role SQL test script

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/` directory -- needs creation
- [ ] SQL test scripts for RLS policy verification (set role, query, check results)
- [ ] Test auth user creation script (create users with different roles for testing)
- [ ] Seed data with test users and role assignments

## Sources

### Primary (HIGH confidence)
- [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) - Hook function signature, config.toml setup, permissions
- [Supabase RBAC with Custom Claims](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - user_roles schema, hook example, authorize() helper, RLS patterns
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Per-operation policy patterns, auth.uid(), auth.jwt(), TO clause
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - SELECT wrapper pattern, index recommendations
- [Supabase inviteUserByEmail API](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) - Invite API, PKCE limitations
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions/quickstart) - Deno serve pattern, service_role client, environment variables
- [Supabase SvelteKit SSR](https://supabase.com/docs/guides/auth/server-side/sveltekit) - createServerClient, cookie handling, safeGetSession

### Secondary (MEDIUM confidence)
- [Supabase SSR npm](https://www.npmjs.com/package/@supabase/ssr) - Version 0.9.0 confirmed
- [SvelteKit Supabase setup guide (dev.to)](https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp) - hooks.server.ts pattern, app.d.ts types
- [Signicat OIDC Implementation](https://developer.signicat.com/docs/eid-hub/oidc/oidc-implementation/) - Token endpoint flow, id_token signed by default
- [Signicat Signed and Encrypted Tokens](https://developer.signicat.com/docs/eid-hub/oidc/code-examples/signed-and-encrypted-tokens/) - JWE optional, nested JWT format, decryption workflow

### Tertiary (LOW confidence)
- Signicat JWE requirement for Finnish bank auth compliance -- inferred from existing code but not verified against current regulations
- Column-level REVOKE compatibility with PostgREST -- standard PostgreSQL feature but not verified with Supabase PostgREST specifically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs, npm registry confirmed
- Architecture: HIGH - Supabase RBAC guide provides exact patterns; existing schema known
- Pitfalls: HIGH - Well-documented in Supabase troubleshooting guides and community discussions
- Signicat integration: MEDIUM - Existing code provides pattern but Signicat config may have changed

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable Supabase patterns, 30 days)

# Technology Stack: v3.0 Frontend Adapter Migration

**Project:** v3.0 Frontend Adapter (Strapi to Supabase)
**Researched:** 2026-03-18
**Overall confidence:** HIGH

## Scope: What This Document Covers

This STACK.md covers **only the new or changed** technologies needed for the frontend adapter migration. It does NOT re-document the existing validated infrastructure (Supabase backend schema, RLS policies, Edge Functions, pgTAP tests).

## Already Installed -- No New Dependencies

The project already has all required Supabase packages installed. No new npm packages are needed for the core adapter work.

### Core Supabase Packages (Already in frontend/package.json)

| Technology | Installed Version | Latest | Purpose | Status |
|------------|------------------|--------|---------|--------|
| `@supabase/supabase-js` | 2.99.1 | 2.99.2 | PostgREST query builder, auth, storage, functions client | Installed; minor patch available |
| `@supabase/ssr` | 0.9.0 | 0.9.0 | Cookie-based auth with createServerClient / createBrowserClient | Installed; current |
| `@openvaa/supabase-types` | workspace:^ | N/A | Generated Database types, COLUMN_MAP, PROPERTY_MAP | Installed; workspace package |

**Recommendation:** Bump `@supabase/supabase-js` to 2.99.2 (patch) when starting work. No breaking changes.

### Supabase CLI (Already in apps/supabase/package.json)

| Technology | Installed Version | Latest | Purpose | Status |
|------------|------------------|--------|---------|--------|
| `supabase` (CLI) | 2.78.1 | 2.78.1 | Local dev stack, type generation, migrations, Edge Functions | Installed; current |

**Confidence:** HIGH -- versions verified via installed `node_modules/*/package.json` and npm registry (2026-03-18).

## What Changes: Configuration, Not Dependencies

### 1. Static Settings: Add `SupabaseDataAdapter` Type

The adapter selection switch in `frontend/src/lib/api/dataProvider.ts` uses `staticSettings.dataAdapter.type`. Currently only `'strapi'` and `'local'` are defined.

**Change needed in `packages/app-shared/src/settings/staticSettings.type.ts`:**

```typescript
// ADD this type alongside existing StrapiDataAdapter and LocalDataAdapter
export type SupabaseDataAdapter = {
  readonly type: 'supabase';
  readonly supportsCandidateApp: true;
  readonly supportsAdminApp: true;
};

// UPDATE the union type
readonly dataAdapter: StrapiDataAdapter | LocalDataAdapter | SupabaseDataAdapter;
```

**Change needed in `packages/app-shared/src/settings/staticSettings.ts`:**

```typescript
dataAdapter: {
  type: 'supabase',          // was: 'strapi'
  supportsCandidateApp: true,
  supportsAdminApp: true
}
```

**Change needed in `frontend/src/lib/api/dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`:**

Add `case 'supabase':` to the switch statements that dynamically import adapter modules.

### 2. Supabase Client Integration Points (Already Wired)

The project already has the correct Supabase SSR pattern implemented:

| Component | File | Status |
|-----------|------|--------|
| Server client factory | `frontend/src/lib/supabase/server.ts` | Done -- `createServerClient<Database>` with cookie handler |
| Browser client singleton | `frontend/src/lib/supabase/browser.ts` | Done -- `createBrowserClient<Database>` |
| Hooks integration | `frontend/src/hooks.server.ts` | Done -- creates client, defines `safeGetSession()`, adds to `event.locals` |
| TypeScript locals | `frontend/src/app.d.ts` | Done -- `App.Locals` has `supabase: SupabaseClient<Database>` and `safeGetSession()` |
| Response header filter | `frontend/src/hooks.server.ts` | Done -- filters `content-range` and `x-supabase-api-version` |

**No changes to the Supabase client setup are needed.** The adapter will receive the client via constructor injection or from `event.locals`.

### 3. Auth Token Migration: JWT Cookie to Supabase Session

**Current state (hybrid):**
- Login page (`candidate/login/+page.server.ts`) already uses `locals.supabase.auth.signInWithPassword()` (Supabase auth)
- But `candidate/+layout.server.ts` still reads `cookies.get('token')` (Strapi JWT)
- `AuthContext` derives `authToken` from `page.data.token` (Strapi JWT)
- `DataWriter.WithAuth` passes `authToken: string` to every write operation
- `hooks.server.ts` checks BOTH old `token` cookie AND `sb-*` cookies for auth guard

**Target state:**
- All auth flows use Supabase session cookies (managed automatically by `@supabase/ssr`)
- `candidate/+layout.server.ts` uses `locals.safeGetSession()` instead of `cookies.get('token')`
- Auth context provides Supabase session/user instead of JWT string
- DataWriter methods no longer need `authToken` parameter -- the Supabase client carries auth via cookies
- `hooks.server.ts` only checks Supabase session for auth guard

**Key auth operations and their Supabase equivalents:**

| Strapi Operation | Strapi Method | Supabase Equivalent |
|-----------------|---------------|---------------------|
| Login | POST to `/api/auth/local` returning JWT | `supabase.auth.signInWithPassword()` -- already done |
| Logout | Client-side JWT removal | `supabase.auth.signOut()` |
| Get user data | GET to `/api/users/me` with JWT header | `supabase.auth.getUser()` + query user_roles |
| Register | POST to custom endpoint | `supabase.auth.signUp()` or accept invite |
| Forgot password | POST to `/api/auth/forgot-password` | `supabase.auth.resetPasswordForEmail()` |
| Reset password | POST to `/api/auth/reset-password` | `supabase.auth.updateUser({ password })` after token exchange |
| Change password | POST to `/api/auth/change-password` | `supabase.auth.updateUser({ password })` |
| Check registration key | Custom Strapi endpoint | Query candidates table by invite token |

### 4. Query Pattern: supabase-js PostgREST Builder

The Strapi adapter uses a custom `apiGet`/`apiPost` pattern with `qs` for URL params. The Supabase adapter replaces this with the type-safe PostgREST query builder.

**Pattern for the new adapter:**

```typescript
// Strapi pattern (current):
const data = await this.apiGet({ endpoint: 'elections', params });
// --> GET /api/elections?populate[constituencyGroups]=true&pagination[pageSize]=50000

// Supabase pattern (new):
const { data, error } = await supabase
  .from('elections')
  .select('*, election_constituency_groups(constituency_group_id)')
  .eq('project_id', projectId);
if (error) throw error;
```

**Key differences:**
- No `qs` serialization needed -- query builder handles parameterization
- Relationships via PostgREST embedding: `table(columns)` syntax in `.select()`
- JSONB columns returned as-is (locale selection happens client-side, per existing v2.0 decision)
- `project_id` filtering required on every query (multi-tenant; RLS enforces but explicit is clearer)
- Result shape: `{ data, error }` instead of parsed Strapi response

**COLUMN_MAP usage:** The existing `@openvaa/supabase-types` COLUMN_MAP and PROPERTY_MAP handle snake_case (DB) to camelCase (TypeScript) conversion. The adapter must transform query results using these maps.

### 5. Storage: Supabase Storage Replaces S3/LocalStack

**Current:** Strapi adapter uploads files via custom `apiUpload` method to Strapi, which stores in S3 (LocalStack in dev).

**Target:** Supabase Storage with two configured buckets (already in `config.toml`):
- `public-assets` (public) -- entity images, project media
- `private-assets` (private) -- authenticated-only files

**Upload pattern:**

```typescript
const { data, error } = await supabase.storage
  .from('public-assets')
  .upload(`${projectId}/candidates/${candidateId}/photo.jpg`, file);
```

No new packages needed -- `supabase-js` includes the storage client.

### 6. Edge Function Invocation

Three Edge Functions need frontend integration (all already deployed in `apps/supabase/supabase/functions/`):

| Function | Purpose | Invocation |
|----------|---------|------------|
| `invite-candidate` | Admin invites candidate, creates record + sends email | `supabase.functions.invoke('invite-candidate', { body })` |
| `signicat-callback` | Bank auth OIDC callback | `supabase.functions.invoke('signicat-callback', { body })` |
| `send-email` | Transactional email sending | `supabase.functions.invoke('send-email', { body })` |

No new packages needed -- `supabase-js` includes the functions client. Auth is passed automatically via the client's session cookies.

### 7. Local Dev Environment: supabase CLI Replaces Docker Compose

**Current:** `docker-compose.dev.yml` runs 4 services: frontend, strapi, postgres, awslocal (LocalStack).

**Target:** `supabase start` replaces strapi + postgres + awslocal. Frontend continues running via `vite dev` (or Docker).

**What `supabase start` provides:**
- PostgreSQL (port 54322)
- PostgREST API (port 54321)
- GoTrue Auth (port 54321/auth/v1)
- Supabase Studio (port 54323)
- Storage API with local filesystem
- Inbucket email testing server (port 54324) -- replaces LocalStack SES
- Edge Function runtime (Deno)

**Dev workflow changes:**

```bash
# OLD (current)
yarn dev              # docker compose up (strapi + postgres + localstack + frontend)

# NEW (target)
yarn supabase:start   # supabase start (already exists in root package.json)
yarn workspace @openvaa/frontend dev  # vite dev server
```

**Environment variables that change:**

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `PUBLIC_SUPABASE_URL` | (was optional) | `http://127.0.0.1:54321` (from `supabase status`) |
| `PUBLIC_SUPABASE_ANON_KEY` | (was optional) | Local anon key (from `supabase status`) |
| `PUBLIC_BROWSER_BACKEND_URL` | `http://localhost:1337` (Strapi) | Removed |
| `PUBLIC_SERVER_BACKEND_URL` | `http://strapi:1337` (Docker internal) | Removed |

The supabase CLI workspace is already configured at `apps/supabase/` with `config.toml`, migrations, seed data, and Edge Functions.

## Packages to REMOVE After Migration

These become unnecessary once Strapi is fully removed:

| Package | Location | Reason |
|---------|----------|--------|
| `qs` | frontend/dependencies | Strapi URL param serialization; PostgREST builder replaces this |
| `jose` | frontend/dependencies | Strapi JWT verification; Supabase handles JWT internally |
| `flat-cache` | frontend/dependencies | Server-side response caching for Strapi; evaluate if still needed |
| `@openvaa/strapi` workspace | backend/vaa-strapi | Entire Strapi backend |

**Do NOT remove yet:** `qs`, `jose`, `flat-cache` should only be removed in the final Strapi cleanup phase after the adapter is verified.

## Packages to NOT Add

| Package | Why NOT |
|---------|---------|
| `@supabase/auth-helpers-sveltekit` | Deprecated; replaced by `@supabase/ssr` which is already installed |
| `supabase-js` v3 (if released) | Not yet stable; v2 is the current production version |
| `pg` / `postgres` / any direct DB driver | PostgREST (via supabase-js) is the intended data access layer; direct connections bypass RLS |
| `drizzle-orm` / `prisma` / `kysely` | Same reason -- ORM would bypass PostgREST and RLS policies |
| Custom fetch wrapper | The `UniversalAdapter.fetch` base class pattern should NOT be used by the Supabase adapter; use the supabase-js client directly |

## Architecture: How the Supabase Adapter Fits

The adapter extends the existing abstract base classes, same as the Strapi adapter does:

```
UniversalDataProvider (abstract)          UniversalDataWriter (abstract)
  |                                         |
  +-- StrapiDataProvider (current)          +-- StrapiDataWriter (current)
  +-- SupabaseDataProvider (NEW)            +-- SupabaseDataWriter (NEW)
```

**Key design decision:** The Supabase adapter should NOT extend `UniversalAdapter`'s `fetch`-based HTTP methods (`get`, `post`, `put`, `delete`). Instead, it should use the supabase-js client directly for all operations. The `UniversalDataProvider` and `UniversalDataWriter` abstract classes define the _method signatures_ that must be implemented, but the Supabase adapter provides its own internal implementation using `SupabaseClient.from()`, `SupabaseClient.auth.*`, `SupabaseClient.storage.*`, and `SupabaseClient.functions.invoke()`.

This means the Supabase adapter will NOT call `this.get()` or `this.post()` -- it bypasses the HTTP fetch layer entirely and uses the Supabase client's typed methods.

**Client injection:** The adapter needs access to the Supabase client. Two approaches:

1. **Server adapter:** Receives `SupabaseClient` from `event.locals.supabase` (per-request, cookie-authenticated)
2. **Browser adapter:** Uses the singleton from `createSupabaseBrowserClient()` (auto-refreshes tokens)

The adapter's `init()` method (from `UniversalAdapter`) should accept the Supabase client in addition to or instead of `fetch`.

## Summary of Changes

| Category | What Changes | Scope |
|----------|-------------|-------|
| New code | SupabaseDataProvider class | ~300-400 lines implementing 7 abstract methods |
| New code | SupabaseDataWriter class | ~400-500 lines implementing 14 abstract methods |
| New code | SupabaseFeedbackWriter class | ~50 lines implementing 1 abstract method |
| New code | Supabase adapter utilities | Column mapping, JSONB locale handling, error wrapping |
| Modified | staticSettings type + value | Add `'supabase'` adapter type |
| Modified | dataProvider.ts, dataWriter.ts, feedbackWriter.ts | Add `case 'supabase'` |
| Modified | candidate/+layout.server.ts | Use safeGetSession instead of cookie token |
| Modified | authContext.ts | Derive auth from Supabase session, not JWT cookie |
| Modified | hooks.server.ts | Remove dual-auth check, use only Supabase session |
| Modified | getUserData.ts | Use Supabase session instead of JWT token |
| Removed (final phase) | Strapi adapter directory | `frontend/src/lib/api/adapters/strapi/` |
| Removed (final phase) | `backend/vaa-strapi/` | Entire Strapi backend |
| Removed (final phase) | `docker-compose.dev.yml` Strapi/postgres/awslocal services | Docker services |
| Removed (final phase) | `qs`, `jose` dependencies | No longer needed |

## Existing Package Versions (Reference)

| Package | Version | Location |
|---------|---------|----------|
| `svelte` | 4.2.19 | frontend |
| `@sveltejs/kit` | 2.15.2 | frontend |
| `typescript` | 5.7.3 | frontend |
| `vite` | 5.4.11 | frontend |
| `zod` | 4.0.0 | frontend |
| `vitest` | 2.1.8 | frontend + root |
| `@playwright/test` | 1.58.2 | root |

These are NOT changing as part of this milestone.

## Sources

- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) -- version verification, HIGH confidence
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- version verification, HIGH confidence
- [Supabase SSR Auth for SvelteKit (official docs)](https://supabase.com/docs/guides/auth/server-side/sveltekit) -- auth patterns, HIGH confidence
- [PostgREST Query Builder v2 API docs](https://supabase.github.io/postgrest-js/v2/classes/PostgrestQueryBuilder.html) -- query patterns, HIGH confidence
- [Supabase Local Development docs](https://supabase.com/docs/guides/local-development) -- CLI setup, HIGH confidence
- [SvelteKit + Supabase Setup 2025](https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp) -- community patterns, MEDIUM confidence
- [PostgREST Type Inference System](https://deepwiki.com/supabase/postgrest-js/3.3-query-type-inference) -- type safety details, MEDIUM confidence
- Codebase analysis of `frontend/src/lib/api/`, `frontend/src/lib/supabase/`, `apps/supabase/`, `packages/supabase-types/` -- PRIMARY source, HIGH confidence

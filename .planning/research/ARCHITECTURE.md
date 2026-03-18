# Architecture Patterns: Supabase Frontend Adapter

**Domain:** Frontend adapter migration (Strapi to Supabase) in a SvelteKit 2 / Svelte 4 monorepo
**Researched:** 2026-03-18
**Confidence:** HIGH (based on thorough codebase analysis of existing patterns)

## Executive Summary

The existing adapter architecture is built around three inheritance chains: `UniversalDataProvider`, `UniversalDataWriter`, and `UniversalFeedbackWriter` -- all extending `UniversalAdapter`. The Strapi implementation uses a mixin pattern (`strapiAdapterMixin`) to inject HTTP API helpers (`apiGet`, `apiPost`, `apiUpload`) into these base classes. The Supabase adapter should follow the same structural pattern but replace the mixin with one that injects a typed Supabase client instead of HTTP fetch helpers. This preserves the existing dynamic import switch, context system, and page data flow while fundamentally changing the transport layer from REST-over-fetch to supabase-js query builder.

The key architectural shift is authentication: Strapi uses explicit JWT tokens passed as `authToken: string` through the entire call chain. Supabase uses cookie-based sessions managed automatically by `@supabase/ssr`. This difference threads through every layer -- from `hooks.server.ts` through page loaders, contexts, and data writers -- and requires careful rethinking of the `WithAuth` pattern used by 15+ DataWriter methods.

## Recommended Architecture

### Overview: Supabase Adapter Mixin Pattern

Use a `supabaseAdapterMixin` analogous to `strapiAdapterMixin`. The mixin injects a typed Supabase client reference rather than HTTP helpers. The concrete classes (`SupabaseDataProvider`, `SupabaseDataWriter`, `SupabaseFeedbackWriter`) extend the mixed base classes and implement the abstract `_getFoo` / `_doBar` methods using supabase-js queries.

```
UniversalAdapter
  |
  +-- UniversalDataProvider (abstract _getFoo methods)
  |     |
  |     +-- supabaseAdapterMixin(UniversalDataProvider)
  |           |
  |           +-- SupabaseDataProvider (implements _getFoo with supabase.from().select())
  |
  +-- UniversalDataWriter (abstract _doBar methods)
  |     |
  |     +-- supabaseAdapterMixin(UniversalDataWriter)
  |           |
  |           +-- SupabaseDataWriter (implements _doBar with supabase mutations + auth)
  |
  +-- UniversalFeedbackWriter (abstract _postFeedback)
        |
        +-- supabaseAdapterMixin(UniversalFeedbackWriter)
              |
              +-- SupabaseFeedbackWriter (implements _postFeedback with supabase.from().insert())
```

### Why Mixin Pattern, Not Direct supabase-js Bypass

**Option 1 (REJECTED): Bypass UniversalAdapter entirely, use supabase-js directly.**

Tempting because supabase-js manages its own HTTP layer. However, this would break:
- The dynamic import switch in `dataProvider.ts` / `dataWriter.ts` / `feedbackWriter.ts` which expects `UniversalDataProvider` / `UniversalDataWriter` / `UniversalFeedbackWriter` instances
- The `init({ fetch })` call in `+layout.ts` and `prepareDataWriter.ts`
- The `ensureColors` post-processing in `UniversalDataProvider.getNominationData()` etc.
- Every context that calls `dataWriter.someMethod()` expecting the standard return types

**Option 2 (RECOMMENDED): Mixin pattern mirroring Strapi.**

The mixin adds a `supabaseClient` accessor or injection point. The `init()` override accepts fetch (for compatibility) but also wires the Supabase client. The concrete implementations use `this.supabase.from('table').select(...)` instead of `this.apiGet(...)`. All existing contracts are preserved.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `supabaseAdapterMixin` | Injects typed Supabase client into base adapter classes; provides `this.supabase` getter | `@supabase/ssr`, `@openvaa/supabase-types` |
| `SupabaseDataProvider` | Implements all 7 read operations using supabase-js queries | `supabaseAdapterMixin`, base class `UniversalDataProvider` |
| `SupabaseDataWriter` | Implements all 14+ write/auth operations using supabase-js mutations and GoTrue auth | `supabaseAdapterMixin`, base class `UniversalDataWriter`, Edge Functions |
| `SupabaseFeedbackWriter` | Implements feedback posting via supabase-js insert | `supabaseAdapterMixin`, base class `UniversalFeedbackWriter` |
| `SupabaseDataAdapter` type | New type in `staticSettings.type.ts` for the adapter switch | `staticSettings`, dynamic imports |
| Data transform utilities | Convert Supabase row format (snake_case JSONB) to `@openvaa/data` types (camelCase, translated) | `COLUMN_MAP`, `PROPERTY_MAP` from `@openvaa/supabase-types` |
| Auth integration layer | Bridges Supabase cookie sessions with existing `WithAuth`-based method signatures | `hooks.server.ts`, `+layout.server.ts`, auth context |

### Directory Structure

```
frontend/src/lib/api/adapters/supabase/
  supabaseAdapter.ts              # supabaseAdapterMixin function
  supabaseAdapter.type.ts         # Interface for mixin (like StrapiAdapter)
  dataProvider/
    supabaseDataProvider.ts       # Concrete DataProvider
    index.ts                      # Export singleton
  dataWriter/
    supabaseDataWriter.ts         # Concrete DataWriter
    index.ts                      # Export singleton
  feedbackWriter/
    supabaseFeedbackWriter.ts     # Concrete FeedbackWriter
    index.ts                      # Export singleton
  utils/
    transformRow.ts               # snake_case -> camelCase using COLUMN_MAP
    parseLocalized.ts             # JSONB localization extraction
    parseImage.ts                 # Supabase storage URL resolution
    buildFilters.ts               # Convert GetDataOptions to PostgREST filters
```

## Data Flow

### Read Operations (Voter App -- Anonymous)

```
+layout.ts load()
  |
  v
dataProvider = await import('./adapters/supabase/dataProvider')
dataProvider.init({ fetch })
  |
  v
SupabaseDataProvider._getElectionData({ locale })
  |
  v
this.supabase
  .from('elections')
  .select('id, name, short_name, ...')  // typed via Database
  .eq('published', true)
  |
  v
Transform rows: snake_case -> camelCase via COLUMN_MAP
Localize JSONB fields: name[locale], short_name[locale]
  |
  v
Return ElectionData[] (same shape as Strapi adapter returns)
```

**Key difference from Strapi:** No HTTP round-trip to a separate backend server. The supabase-js client talks directly to PostgREST. RLS policies handle access control. The `published = true` filter matches what RLS already enforces for `anon` role, but explicit filtering improves query clarity and catches configuration errors.

### Write Operations (Candidate App -- Authenticated)

```
Candidate login form submits to /api/auth/login
  |
  v
+server.ts: supabase.auth.signInWithPassword({ email, password })
  -> Session cookie set automatically by @supabase/ssr
  -> Return { type: 'success', userData }
  |
  v
+layout.server.ts: const { session, user } = await locals.safeGetSession()
  -> Pass session to page data
  |
  v
SupabaseDataWriter._setAnswers({ target, answers })
  |
  v
this.supabase
  .from('candidates')
  .update({ answers: mergedAnswers })
  .eq('id', target.id)
  .eq('auth_user_id', (await this.supabase.auth.getUser()).data.user.id)
  .select()
  .single()
  |
  v
Transform and return LocalizedCandidateData
```

### Auth Token Flow: Before and After

**BEFORE (Strapi):**

```
Login -> Strapi returns JWT string
  -> Stored in httpOnly cookie named 'token'
  -> +layout.server.ts reads cookie, passes as page.data.token
  -> authContext derives authToken store from page.data.token
  -> Every DataWriter method receives { authToken: string }
  -> UniversalAdapter.fetch() adds Authorization: Bearer header
```

**AFTER (Supabase):**

```
Login -> supabase.auth.signInWithPassword()
  -> @supabase/ssr sets session cookies automatically (sb-* cookies)
  -> hooks.server.ts creates request-scoped Supabase client from cookies
  -> +layout.server.ts calls safeGetSession(), passes session to page data
  -> authContext derives session/user from page.data.session
  -> DataWriter methods use the Supabase client (session embedded in client)
  -> No explicit authToken passing needed for Supabase operations
```

**The `WithAuth` bridge problem:** The base `UniversalDataWriter` defines abstract methods that accept `WithAuth` ({ authToken: string }). The Supabase adapter does not need this parameter because auth is embedded in the client session. Two approaches:

1. **Keep `WithAuth` in signatures, ignore `authToken` in Supabase impl.** The `authToken` parameter becomes a no-op. Existing contexts that pass it continue to work during transition. This is the pragmatic approach for v3.0.

2. **Refactor `WithAuth` to be adapter-generic.** Make it optional or use a discriminated union. This is cleaner but touches every call site. Better deferred to v4.0 (Svelte 5 migration) when contexts are being rewritten anyway.

**Recommendation:** Approach 1 for v3.0. The Supabase DataWriter silently ignores `authToken`. The auth context still derives `authToken` from page data but it comes from `session?.access_token` instead of a raw cookie. This provides backward compatibility for any code that checks `if (authToken)` as a proxy for "is user logged in".

## Integration Points

### 1. Static Settings: New Adapter Type

**Modified:** `packages/app-shared/src/settings/staticSettings.type.ts`

```typescript
export type SupabaseDataAdapter = {
  readonly type: 'supabase';
  readonly supportsCandidateApp: true;
  readonly supportsAdminApp: true;
};

// Update union:
readonly dataAdapter: StrapiDataAdapter | LocalDataAdapter | SupabaseDataAdapter;
```

**Modified:** `packages/app-shared/src/settings/staticSettings.ts`

```typescript
dataAdapter: {
  type: 'supabase',    // was 'strapi'
  supportsCandidateApp: true,
  supportsAdminApp: true
}
```

### 2. Dynamic Import Switch

**Modified:** `frontend/src/lib/api/dataProvider.ts`

```typescript
case 'supabase':
  module = import('./adapters/supabase/dataProvider');
  break;
```

Same pattern for `dataWriter.ts` and `feedbackWriter.ts`.

### 3. Supabase Client Injection Into Adapter

**The init() problem:** The existing pattern calls `dataProvider.init({ fetch })` in `+layout.ts`. The Supabase adapter needs a Supabase client, not just fetch. Two options:

**Option A: Override init() to create client from fetch.**

```typescript
// In supabaseAdapterMixin
init({ fetch }: AdapterConfig): this {
  super.init({ fetch });
  // Create a client that uses the provided fetch
  this._client = createBrowserClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    { global: { fetch } }
  );
  return this;
}
```

This works because `@supabase/supabase-js` accepts a custom `fetch` function. The SvelteKit-provided `fetch` handles cookies and relative URLs correctly. On the server side, the `+layout.ts` load function's `fetch` automatically includes cookies. On the browser side, browser `fetch` handles cookies natively.

**Option B: Accept Supabase client in init().**

This would require changing `AdapterConfig` or adding a Supabase-specific config type. More correct but more invasive.

**Recommendation: Option A.** Override `init()` to create a Supabase client from the provided fetch. This requires zero changes to the existing call sites (`dataProvider.init({ fetch })` in `+layout.ts`, `dataWriter.init({ fetch })` in login server route, `prepareDataWriter` utility). The supabase-js library accepts a custom fetch, so the SvelteKit-managed fetch (which includes cookies) is passed through seamlessly.

**However**, for server-side operations that need the authenticated server client (from `event.locals.supabase`), the mixin should also support receiving an existing client. The `AdapterConfig` type can be extended:

```typescript
export type AdapterConfig = {
  fetch: Fetch | undefined;
  supabaseClient?: SupabaseClient<Database>;  // Optional: use pre-created server client
};
```

When `supabaseClient` is provided, use it directly. When only `fetch` is provided, create a new client from fetch. This handles both the browser case (init from `+layout.ts` with fetch) and server case (init from `+server.ts` with the request-scoped server client).

### 4. Auth Context Changes

**Modified:** `frontend/src/lib/contexts/auth/authContext.ts`

The `authToken` store currently derives from `page.data.token`. With Supabase, it should derive from `page.data.session?.access_token`:

```typescript
const authToken = derived(page, (page) =>
  page.data.session?.access_token ?? page.data.token ?? undefined
);
```

This supports both Strapi (during transition) and Supabase auth. The `page.data.session` is populated by `+layout.server.ts` calling `safeGetSession()`.

### 5. Candidate Layout Server Loader

**Modified:** `frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts`

Currently reads `cookies.get(AUTH_TOKEN_KEY)`. With Supabase, uses `safeGetSession()`:

```typescript
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  return {
    session,
    user,
    token: session?.access_token  // backward compat for authToken store
  };
}
```

### 6. Login Server Route

**Modified:** `frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts`

Currently uses `dataWriter.login()` which calls Strapi auth API. With Supabase:

```typescript
export async function POST({ request, locals }) {
  const { username, password, role } = await request.json();
  const { data, error } = await locals.supabase.auth.signInWithPassword({
    email: username,
    password
  });
  if (error) return apiFail(400);

  // Session cookie is set automatically by @supabase/ssr
  // Get user data from Supabase
  const userData = await getUserDataFromSupabase(locals.supabase, data.user);

  if (role != null && ![role].flat().includes(userData.role!)) {
    await locals.supabase.auth.signOut();
    return apiFail(403);
  }

  return json({ ok: true, type: 'success', userData });
}
```

### 7. Logout Server Route

**Modified:** `frontend/src/routes/[[lang=locale]]/api/auth/logout/+server.ts`

```typescript
export async function POST({ locals }) {
  await locals.supabase.auth.signOut();
  // @supabase/ssr clears session cookies automatically
  return json({ ok: true, type: 'success' });
}
```

### 8. hooks.server.ts Auth Guard

**Modified:** `frontend/src/hooks.server.ts` (lines 97-111)

Currently checks both `cookies.get(AUTH_TOKEN_KEY)` and `sb-*` cookies. After migration, simplify to only Supabase session check:

```typescript
if (pathname.startsWith(`/${servedLocale}/candidate`)) {
  const { session } = await safeGetSession();
  if (session && pathname.endsWith('candidate/login')) {
    redirect(303, `/${servedLocale}/candidate`);
  }
  if (!session && route.id.includes('(protected)')) {
    redirect(303, `/${servedLocale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
  }
}
```

### 9. Edge Function Integration

Three Edge Functions need frontend integration:

| Edge Function | Current Frontend Integration | Supabase Adapter Integration |
|---|---|---|
| `invite-candidate` | `_preregister()` via Strapi API | `supabase.functions.invoke('invite-candidate', { body })` |
| `signicat-callback` | `exchangeCodeForIdToken()` via API route | Direct Edge Function call or keep API route as proxy |
| `send-email` | Via Strapi email plugin | `supabase.functions.invoke('send-email', { body })` |

Edge Functions are called via `supabase.functions.invoke()` which uses the same auth session. The `service_role` key is NOT exposed to the frontend -- Edge Functions that need elevated access use their own `SUPABASE_SERVICE_ROLE_KEY`.

### 10. getUserData Utility

**Modified:** `frontend/src/lib/auth/getUserData.ts`

Currently makes a round-trip to Strapi for basic user data. With Supabase, user data (including role claims from Custom Access Token Hook) is available directly from the JWT:

```typescript
export async function getUserData({ locals }: { locals: App.Locals }): Promise<BasicUserData | undefined> {
  const { session, user } = await locals.safeGetSession();
  if (!user) return undefined;

  // Roles are embedded in JWT by Custom Access Token Hook
  const roles = session?.user?.user_metadata?.user_roles ?? [];
  const role = roles.find(r => r.role === 'candidate') ? 'candidate'
    : roles.find(r => ['project_admin', 'account_admin', 'super_admin'].includes(r.role)) ? 'admin'
    : null;

  return {
    id: user.id,
    email: user.email ?? '',
    username: user.email ?? '',
    role,
    settings: { language: user.user_metadata?.language }
  };
}
```

## Data Transformation Layer

### The Core Problem

Strapi adapter has ~12 parse utility functions (`parseBasics`, `parseCandidate`, `parseOrganization`, etc.) that transform Strapi's deeply-nested JSON response format into `@openvaa/data` types. The Supabase adapter needs equivalent transformers, but the source format is different:

| Aspect | Strapi Format | Supabase Format |
|--------|--------------|-----------------|
| Column names | camelCase (Strapi convention) | snake_case (Postgres convention) |
| Localized fields | `{ en: "...", fi: "..." }` in field value | `{ en: "...", fi: "..." }` as JSONB (same!) |
| Relations | Nested objects with `data` wrapper | Flat rows from join or separate query |
| IDs | `documentId` (Strapi's internal) | `id` (UUID) |
| Images | Strapi upload URLs | Supabase Storage URLs |
| Answers | JSONB on entity (same in new Strapi) | JSONB on entity |

### Transform Utilities

**`transformRow(row, locale)`**: Generic row transformer using `COLUMN_MAP`.

```typescript
import { COLUMN_MAP } from '@openvaa/supabase-types';

function transformRow<T>(row: Record<string, unknown>, locale?: string | null): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = COLUMN_MAP[key as keyof typeof COLUMN_MAP] ?? key;
    // If value is JSONB localized object and locale is provided, extract
    if (locale && isLocalizedValue(value)) {
      result[mappedKey] = extractLocale(value, locale);
    } else {
      result[mappedKey] = value;
    }
  }
  return result as T;
}
```

**`parseLocalized(value, locale)`**: Mirrors the database's `get_localized()` function in TypeScript for client-side locale extraction from JSONB fields.

### Query Patterns

**Simple read (elections):**

```typescript
const { data, error } = await this.supabase
  .from('elections')
  .select('id, name, short_name, info, type, election_date, election_type, ...')
  .eq('published', true);
```

**Join read (nominations with candidate and organization):**

```typescript
const { data, error } = await this.supabase
  .from('nominations')
  .select(`
    id, election_id, constituency_id, election_symbol, election_round,
    candidate:candidates!candidate_id (
      id, first_name, last_name, image, answers, organization_id,
      organization:organizations!organization_id ( id, name, short_name, image, color )
    )
  `)
  .eq('published', true);
```

supabase-js handles the PostgREST foreign key joins. The `Database` type from `@openvaa/supabase-types` provides full type inference for these queries.

**Candidate answer update:**

```typescript
const { data, error } = await this.supabase
  .from('candidates')
  .update({ answers: mergedAnswers })
  .eq('id', candidateId)
  .select()
  .single();
```

RLS policy `is_candidate_self(auth_user_id)` ensures a candidate can only update their own record. No explicit auth_user_id filter needed in the query -- RLS handles it.

## Multi-Tenant Project Scoping

The Supabase schema uses `project_id` on every content table. RLS policies for anonymous users check `published = true` but do NOT filter by project_id. This works for single-project deployments (one Supabase instance per VAA).

For multi-project deployments, the adapter must filter by project_id. Add `PUBLIC_PROJECT_ID` environment variable:

```typescript
// In supabaseAdapterMixin or as a query helper
const projectFilter = (query) => {
  const projectId = constants.PUBLIC_PROJECT_ID;
  return projectId ? query.eq('project_id', projectId) : query;
};
```

This is not needed for v3.0 MVP (single-project) but should be designed in from the start.

## Patterns to Follow

### Pattern 1: Mixin-Based Transport Abstraction

**What:** Use the mixin pattern to inject transport-specific helpers into base adapter classes, keeping concrete provider/writer implementations transport-agnostic at the method level.

**When:** Creating any new adapter (Supabase, future GraphQL, etc.)

**Example:**

```typescript
export function supabaseAdapterMixin<TBase extends Constructor>(base: TBase) {
  abstract class WithMixin extends base {
    #client: SupabaseClient<Database> | undefined;

    override init(config: AdapterConfig): this {
      super.init(config);
      if (config.supabaseClient) {
        this.#client = config.supabaseClient;
      } else if (config.fetch) {
        this.#client = createBrowserClient<Database>(
          PUBLIC_SUPABASE_URL,
          PUBLIC_SUPABASE_ANON_KEY,
          { global: { fetch: config.fetch } }
        );
      }
      return this;
    }

    get supabase(): SupabaseClient<Database> {
      if (!this.#client) throw new Error('Adapter not initialized. Call init() first.');
      return this.#client;
    }
  }
  return WithMixin;
}
```

### Pattern 2: Transform-At-Boundary

**What:** Convert between database format (snake_case, JSONB localization) and application format (camelCase, locale-resolved strings) at the adapter boundary. Never let snake_case leak into application code.

**When:** Every data read and write in the Supabase adapter.

### Pattern 3: Graceful Auth Degradation

**What:** During the transition period, support both Strapi JWT and Supabase session auth. Check Supabase session first, fall back to Strapi token.

**When:** Throughout v3.0 development until Strapi is fully removed.

**Example (hooks.server.ts):**

```typescript
const hasAuth = event.cookies.getAll().some(c => c.name.startsWith('sb-'))
  || event.cookies.get(AUTH_TOKEN_KEY);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Bypassing UniversalAdapter Base Class

**What:** Implementing SupabaseDataProvider without extending UniversalDataProvider, using supabase-js directly in components or contexts.

**Why bad:** Breaks the adapter abstraction. Every consumer would need Supabase-specific imports. Cannot switch adapters via `staticSettings.dataAdapter.type`. Breaks the `init({ fetch })` contract used by SvelteKit loaders.

**Instead:** Always extend via mixin pattern. All Supabase-specific code stays inside `frontend/src/lib/api/adapters/supabase/`.

### Anti-Pattern 2: Exposing service_role Key to Frontend

**What:** Using `SUPABASE_SERVICE_ROLE_KEY` in frontend code for admin operations.

**Why bad:** service_role bypasses all RLS. If exposed to browser, any user can read/write/delete any data.

**Instead:** Admin operations that need elevated privileges go through Edge Functions (which have their own service_role access) or SvelteKit server routes (which use `event.locals.supabase` with the authenticated user's session, letting RLS handle authorization).

### Anti-Pattern 3: Duplicating RLS Logic in Application Code

**What:** Adding explicit `project_id` filters, `published` checks, and role checks in every query when RLS already enforces them.

**Why bad:** Duplicates security logic. If RLS policy changes, app code may drift. Harder to audit.

**Instead:** Trust RLS for security enforcement. Add explicit filters only when RLS is permissive and application needs additional filtering (e.g., project_id for multi-tenant, or specific election filtering).

### Anti-Pattern 4: Creating a New Supabase Client Per Request in Browser

**What:** Calling `createBrowserClient()` in every component or context.

**Why bad:** Creates multiple GoTrue listeners, duplicates WebSocket connections, wastes memory.

**Instead:** Browser client is a singleton (already implemented in `frontend/src/lib/supabase/browser.ts`). The adapter mixin creates one client per `init()` call and reuses it.

## Build Order (Dependency-Aware)

### Phase 1: Foundation (no dependencies on other new code)

| Step | Component | Depends On | Why First |
|------|-----------|-----------|-----------|
| 1a | `SupabaseDataAdapter` type in staticSettings | Nothing | Enables the dynamic import switch |
| 1b | `supabaseAdapterMixin` | `@supabase/ssr`, `@openvaa/supabase-types` | Core transport layer, all concrete classes depend on it |
| 1c | Transform utilities (`transformRow`, `parseLocalized`, `buildFilters`) | `COLUMN_MAP` from supabase-types | All concrete implementations use these |

### Phase 2: Read Path (DataProvider)

| Step | Component | Depends On | Why This Order |
|------|-----------|-----------|----------------|
| 2a | `SupabaseDataProvider._getAppSettings()` | Phase 1 | Simplest query -- single row, no joins |
| 2b | `SupabaseDataProvider._getElectionData()` | Phase 1 | Simple table scan, tests data transform |
| 2c | `SupabaseDataProvider._getConstituencyData()` | Phase 1 | Join table pattern (groups + constituencies) |
| 2d | `SupabaseDataProvider._getQuestionData()` | Phase 1 | Category + question join, most complex read |
| 2e | `SupabaseDataProvider._getNominationData()` | Phase 1 | Most complex: nominations + candidates + organizations + alliances |
| 2f | `SupabaseDataProvider._getEntityData()` | Phase 1 | After nominations proves the pattern works |
| 2g | `SupabaseDataProvider._getAppCustomization()` | Phase 1 | Storage URLs for images |
| 2h | Dynamic import switch for dataProvider | 2a-2g | Wire it up and test Voter App end-to-end |

### Phase 3: Auth Path

| Step | Component | Depends On | Why This Order |
|------|-----------|-----------|----------------|
| 3a | Login server route rewrite | `@supabase/ssr` in hooks | Foundation for all authenticated operations |
| 3b | Logout server route rewrite | 3a | Paired with login |
| 3c | Auth context updates (session-based) | 3a | Contexts consume session from page data |
| 3d | `+layout.server.ts` session passing | 3a | Provides session to page data |
| 3e | hooks.server.ts auth guard simplification | 3d | Uses safeGetSession instead of cookie check |

### Phase 4: Write Path (DataWriter)

| Step | Component | Depends On | Why This Order |
|------|-----------|-----------|----------------|
| 4a | `SupabaseDataWriter._login()` / `_logout()` | Phase 3 | Core auth operations |
| 4b | `SupabaseDataWriter._getBasicUserData()` | 4a | JWT claims extraction |
| 4c | `SupabaseDataWriter._getCandidateUserData()` | 4b | Most-used authenticated read |
| 4d | `SupabaseDataWriter._setAnswers()` / `_updateEntityProperties()` | 4c | Core candidate writes |
| 4e | `SupabaseDataWriter._register()` / `_checkRegistrationKey()` | 4a | Registration flow |
| 4f | `SupabaseDataWriter._preregister()` | 4e | Edge Function integration |
| 4g | Password operations | 4a | GoTrue password management |
| 4h | `SupabaseFeedbackWriter` | Phase 1 | Simple insert, low dependency |
| 4i | Dynamic import switch for dataWriter + feedbackWriter | 4a-4h | Wire up Candidate App |

### Phase 5: Edge Functions and Cleanup

| Step | Component | Depends On |
|------|-----------|-----------|
| 5a | `exchangeCodeForIdToken` via Edge Function | Phase 4 |
| 5b | `preregisterWithIdToken` via Edge Function | 5a |
| 5c | Remove Strapi adapter code | All phases verified |
| 5d | Remove `AUTH_TOKEN_KEY` cookie code | 5c |
| 5e | Remove Strapi-specific parse utilities | 5c |

## New vs. Modified Files

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` | Mixin function |
| `frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` | Mixin interface |
| `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | DataProvider impl |
| `frontend/src/lib/api/adapters/supabase/dataProvider/index.ts` | Singleton export |
| `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | DataWriter impl |
| `frontend/src/lib/api/adapters/supabase/dataWriter/index.ts` | Singleton export |
| `frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts` | FeedbackWriter impl |
| `frontend/src/lib/api/adapters/supabase/feedbackWriter/index.ts` | Singleton export |
| `frontend/src/lib/api/adapters/supabase/utils/transformRow.ts` | Row transformation |
| `frontend/src/lib/api/adapters/supabase/utils/parseLocalized.ts` | JSONB locale extraction |
| `frontend/src/lib/api/adapters/supabase/utils/parseImage.ts` | Storage URL handling |
| `frontend/src/lib/api/adapters/supabase/utils/buildFilters.ts` | Filter conversion |

### Modified Files

| File | Change | Why |
|------|--------|-----|
| `packages/app-shared/src/settings/staticSettings.type.ts` | Add `SupabaseDataAdapter` type | Enable adapter switch |
| `packages/app-shared/src/settings/staticSettings.ts` | Change `type: 'supabase'` | Activate new adapter |
| `frontend/src/lib/api/dataProvider.ts` | Add `case 'supabase'` | Dynamic import |
| `frontend/src/lib/api/dataWriter.ts` | Add `case 'supabase'` | Dynamic import |
| `frontend/src/lib/api/feedbackWriter.ts` | Add `case 'supabase'` | Dynamic import |
| `frontend/src/lib/api/base/universalAdapter.type.ts` | Extend `AdapterConfig` with optional `supabaseClient` | Server client injection |
| `frontend/src/hooks.server.ts` | Simplify auth guard to use session only | Remove dual auth check |
| `frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts` | Use `locals.supabase.auth` | Supabase auth |
| `frontend/src/routes/[[lang=locale]]/api/auth/logout/+server.ts` | Use `locals.supabase.auth.signOut()` | Supabase auth |
| `frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts` | Use `safeGetSession()` | Session-based auth |
| `frontend/src/lib/contexts/auth/authContext.ts` | Derive from session | Session-based auth |
| `frontend/src/lib/auth/getUserData.ts` | Extract from JWT/session | No backend round-trip |
| `frontend/src/app.d.ts` | Already has Supabase types | No change needed (already correct) |

### Deleted Files (Phase 5 only, after full verification)

| File/Directory | Reason |
|----------------|--------|
| `frontend/src/lib/api/adapters/strapi/` | Entire Strapi adapter directory |
| `frontend/src/lib/auth/authToken.ts` | `AUTH_TOKEN_KEY` no longer needed |

## Scalability Considerations

| Concern | Current (Strapi) | After (Supabase) | Notes |
|---------|------------------|-------------------|-------|
| Read latency | HTTP to Strapi -> Strapi to Postgres | PostgREST direct to Postgres | Fewer hops, lower latency |
| Auth verification | JWT decode (fast) | `safeGetSession()` verifies with GoTrue | One extra call per request but more secure |
| Query flexibility | Strapi REST API with limited filtering | Full PostgREST filter/select syntax | More powerful, type-safe queries |
| Bundle size | Strapi adapter + `qs` library | `@supabase/supabase-js` + `@supabase/ssr` | Similar total; `qs` removed |
| Multi-tenant | Strapi configured per project | project_id filter + RLS | RLS is more robust than app-level filtering |
| Connection pooling | Strapi manages pool | Supabase manages via Supavisor | No client-side concern |

## Confidence Assessment

| Decision | Confidence | Source |
|----------|-----------|--------|
| Mixin pattern over direct bypass | HIGH | Codebase analysis: 3 existing adapters (Strapi, ApiRoute, FeedbackWriter) all use this pattern; breaking it would require rewriting all consumers |
| Override init() with fetch-based client creation | HIGH | supabase-js docs confirm custom fetch support; existing init() contract preserved |
| Ignore `authToken` param in Supabase adapter | HIGH | Pragmatic: avoids touching all call sites; session embedded in client handles auth |
| COLUMN_MAP-based transformation | HIGH | `@openvaa/supabase-types` already provides bidirectional maps |
| Edge Functions via `supabase.functions.invoke()` | HIGH | Official supabase-js API; Edge Functions already deployed |
| Multi-tenant via env var project_id | MEDIUM | Not needed for v3.0 single-project; designed in for future |
| RLS-trusting query pattern | HIGH | 79 RLS policies + 204 pgTAP tests validate access control |

## Sources

- Existing codebase: `frontend/src/lib/api/` (all base classes and Strapi adapter)
- Existing codebase: `frontend/src/hooks.server.ts` (already has Supabase client wired)
- Existing codebase: `packages/supabase-types/` (COLUMN_MAP, Database types)
- Existing codebase: `apps/supabase/supabase/migrations/00001_initial_schema.sql` (RLS policies, auth functions)
- [Supabase SvelteKit Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/sveltekit) -- Official SSR auth guide
- [Supabase Creating SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=sveltekit) -- Client creation patterns
- [supabase-js TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support) -- Type inference for queries
- [supabase-js Query Builder](https://supabase.com/docs/reference/javascript/select) -- PostgREST query API

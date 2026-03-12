# Architecture: Supabase Migration

**Domain:** Backend migration from Strapi v5 to Supabase for a SvelteKit 2 VAA monorepo
**Researched:** 2026-03-12
**Confidence:** MEDIUM-HIGH (verified against official Supabase docs, existing codebase direct inspection)

## System Overview: Before and After

### Current Architecture (Strapi)

```
Frontend (SvelteKit 2 :5173)
    |
    |-- staticSettings.dataAdapter.type = 'strapi'
    |-- dataProvider.ts  --> StrapiDataProvider (extends UniversalDataProvider)
    |-- dataWriter.ts    --> StrapiDataWriter (extends UniversalDataWriter)
    |-- feedbackWriter.ts --> StrapiFeedbackWriter (extends UniversalFeedbackWriter)
    |
    |-- All use strapiAdapterMixin which adds apiGet/apiPost/apiUpload
    |-- All inherit from UniversalAdapter (wraps fetch with caching/auth headers)
    |
    v
Strapi v5 REST API (:1337)
    |-- Custom routes: candidate register/check/preregister, update-answers, etc.
    |-- users-permissions plugin (auth, JWT tokens)
    |-- upload plugin (S3 via localstack)
    |-- email plugin (SES via localstack)
    |
    v
PostgreSQL (:5432)           LocalStack (:4566)
(Strapi-managed schema)      (S3 buckets, SES email)
```

### Target Architecture (Supabase)

```
Frontend (SvelteKit 2 :5173)
    |
    |-- staticSettings.dataAdapter.type = 'supabase'
    |-- hooks.server.ts  --> Creates server Supabase client per request
    |-- dataProvider.ts  --> SupabaseDataProvider (extends UniversalDataProvider)
    |-- dataWriter.ts    --> SupabaseDataWriter (extends UniversalDataWriter)
    |-- feedbackWriter.ts --> SupabaseFeedbackWriter (extends UniversalFeedbackWriter)
    |
    |-- supabaseAdapterMixin: wraps @supabase/supabase-js client
    |-- Uses supabase-js for data queries, auth, storage
    |-- RLS policies enforce access control at database level
    |
    v
Supabase Stack (local CLI or self-hosted)
    |
    +-- Kong API Gateway (:8000)
    |     |-- Routes to GoTrue, PostgREST, Storage, Realtime
    |
    +-- GoTrue (:9999) - Auth service (replaces Strapi users-permissions)
    +-- PostgREST (:3000) - Auto-generated REST API from Postgres schema
    +-- Supabase Storage - File management (replaces S3 plugin)
    +-- Supabase Studio (:54323) - Admin dashboard (dev only)
    +-- Inbucket (:54324) - Local email capture (replaces LocalStack SES)
    |
    v
PostgreSQL (:54322)
(Migration-managed schema with RLS policies)
```

## Component Boundaries

### New Components to Create

| Component | Path | Responsibility | Communicates With |
|-----------|------|----------------|-------------------|
| `SupabaseDataProvider` | `frontend/src/lib/api/adapters/supabase/dataProvider/` | Read-only data queries for voter/candidate apps | Supabase PostgREST via supabase-js |
| `SupabaseDataWriter` | `frontend/src/lib/api/adapters/supabase/dataWriter/` | Auth, candidate CRUD, answer management, admin ops | Supabase Auth + PostgREST via supabase-js |
| `SupabaseFeedbackWriter` | `frontend/src/lib/api/adapters/supabase/feedbackWriter/` | Feedback submission | Supabase PostgREST |
| `supabaseAdapterMixin` | `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` | Shared Supabase client creation and query helpers | supabase-js client |
| Supabase client factories | `frontend/src/lib/supabase/` | Create server/browser clients with cookie handling | @supabase/ssr, @supabase/supabase-js |
| Schema migrations | `supabase/migrations/` | SQL migrations for all tables, RLS policies, functions | Supabase CLI |
| Seed data | `supabase/seed.sql` | Development seed data | Supabase CLI |
| Edge Functions | `supabase/functions/` | Custom server logic (email templates, candidate registration) | Supabase Edge Runtime |
| `SupabaseDataAdapter` type | `packages/app-shared/src/settings/staticSettings.type.ts` | Adapter type definition for config switching | staticSettings |

### Components to Modify

| Component | Path | Change |
|-----------|------|--------|
| `staticSettings.type.ts` | `packages/app-shared/src/settings/staticSettings.type.ts` | Add `SupabaseDataAdapter` type alongside `StrapiDataAdapter` and `LocalDataAdapter` |
| `staticSettings.ts` | `packages/app-shared/src/settings/staticSettings.ts` | Switch `dataAdapter.type` to `'supabase'` |
| `dataProvider.ts` (selector) | `frontend/src/lib/api/dataProvider.ts` | Add `case 'supabase'` to switch statement |
| `dataWriter.ts` (selector) | `frontend/src/lib/api/dataWriter.ts` | Add `case 'supabase'` to switch statement |
| `feedbackWriter.ts` (selector) | `frontend/src/lib/api/feedbackWriter.ts` | Add `case 'supabase'` to switch statement |
| `hooks.server.ts` | `frontend/src/hooks.server.ts` | Add Supabase client creation, session management alongside existing locale/auth logic |
| `app.d.ts` | `frontend/src/app.d.ts` | Add `supabase` and `getSession` to `App.Locals` |
| `docker-compose.dev.yml` | Root | Replace strapi+localstack+postgres with `supabase start` or self-hosted compose |
| `.env` | Root | Replace Strapi env vars with Supabase env vars |

### Components Left Unchanged

| Component | Why |
|-----------|-----|
| `UniversalAdapter` | Abstract base class, adapter-agnostic |
| `UniversalDataProvider` | Abstract base class, adapter-agnostic |
| `UniversalDataWriter` | Abstract base class, adapter-agnostic |
| `UniversalFeedbackWriter` | Abstract base class, adapter-agnostic |
| `@openvaa/data` package | Data model types are adapter-agnostic; `DPDataType` is the contract |
| `@openvaa/core` package | No backend dependency |
| `@openvaa/matching` package | Operates on in-memory data, no backend calls |
| `@openvaa/filters` package | Operates on in-memory data, no backend calls |
| `apiRoute` adapter | Independent adapter for local JSON data, unaffected |

## Frontend Adapter Layer Integration

### Architecture Decision: New Adapter Alongside Existing

Create a new `supabase` adapter that implements the same abstract interfaces, selected via `staticSettings.dataAdapter.type`. Do NOT replace the Strapi adapter -- keep it for backward compatibility during transition and for deployments that still use Strapi.

**Rationale:** The existing adapter pattern is designed for exactly this. The switch-based dynamic import in `dataProvider.ts`, `dataWriter.ts`, and `feedbackWriter.ts` already supports adding new adapter types. The `UniversalDataProvider` and `UniversalDataWriter` define the exact abstract methods that the Supabase adapter must implement.

### Adapter Structure

```
frontend/src/lib/api/adapters/supabase/
    |-- supabaseAdapter.ts          # Mixin: shared query helpers wrapping supabase-js
    |-- supabaseAdapter.type.ts     # Type definitions for Supabase-specific options
    |-- dataProvider/
    |   |-- index.ts                # Exports singleton: new SupabaseDataProvider()
    |   |-- supabaseDataProvider.ts # Implements all _get* abstract methods
    |-- dataWriter/
    |   |-- index.ts
    |   |-- supabaseDataWriter.ts   # Implements all _set*, _login, _register, etc.
    |-- feedbackWriter/
    |   |-- index.ts
    |   |-- supabaseFeedbackWriter.ts
    |-- utils/
        |-- parseElection.ts        # Supabase row -> ElectionData
        |-- parseCandidate.ts       # Supabase row -> CandidateData
        |-- parseOrganization.ts    # Supabase row -> OrganizationData
        |-- ... (one per entity type)
```

### Abstract Methods the Supabase Adapter Must Implement

**DataProvider (7 methods):**
1. `_getAppSettings()` -- Query `app_settings` table
2. `_getAppCustomization()` -- Query `app_customizations` table + storage for images
3. `_getElectionData()` -- Query `elections` + join `constituency_groups`
4. `_getConstituencyData()` -- Query `constituency_groups` + `constituencies`
5. `_getNominationData()` -- Query `nominations` + join candidates, parties, alliances
6. `_getEntityData()` -- Query `candidates` + `parties` (organizations)
7. `_getQuestionData()` -- Query `question_categories` + `questions` + `question_types`

**DataWriter (15+ methods):**
1. `_preregister()` -- Supabase Edge Function (custom registration logic)
2. `_checkRegistrationKey()` -- Query `candidates` by registration key
3. `_register()` -- Supabase Auth `signUp` + link to candidate record
4. `_login()` -- Supabase Auth `signInWithPassword`
5. `_logout()` -- Supabase Auth `signOut`
6. `_getBasicUserData()` -- Supabase Auth `getUser()` + query profile
7. `_requestForgotPasswordEmail()` -- Supabase Auth `resetPasswordForEmail`
8. `_resetPassword()` -- Supabase Auth `updateUser`
9. `_setPassword()` -- Supabase Auth `updateUser`
10. `_getCandidateUserData()` -- Query `candidates` + optionally `nominations`
11. `_setAnswers()` -- Update `candidates.answers` JSONB or `answers` table
12. `_updateEntityProperties()` -- Update candidate + Supabase Storage for images
13. `_updateQuestion()` -- Update `questions.custom_data` JSONB
14. `_insertJobResult()` -- Insert into `admin_jobs`

**FeedbackWriter (1 method):**
1. `_postFeedback()` -- Insert into `feedbacks`

### supabase-js Client Integration with SvelteKit SSR

The key architectural challenge is that supabase-js needs different client instances for server-side rendering (SSR) and browser contexts, with cookie-based session management bridging the two.

**Server client (hooks.server.ts):**
```typescript
// frontend/src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  // Create per-request server client with cookie access
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          );
        }
      }
    }
  );

  event.locals.getSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    return session;
  };

  // ... existing locale handling stays the same ...
  // ... auth redirect logic migrates from cookie-based JWT to Supabase session ...
};
```

**Browser client (singleton):**
```typescript
// frontend/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createBrowserClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);
```

**Impact on existing auth flow:** The current system stores a JWT in a cookie (`AUTH_TOKEN_KEY = 'token'`) and passes it as `authToken` in every DataWriter call. With Supabase, the auth session is managed automatically via cookies by `@supabase/ssr`. The `WithAuth` type and `authToken` parameter pattern in `DataWriter` can either:
- (a) Be adapted so `authToken` is the Supabase access token extracted from the session, or
- (b) Be bypassed entirely since the supabase-js client automatically includes auth headers from its cookie-managed session.

**Recommendation:** Option (b) -- the Supabase adapter's internal implementation ignores the `authToken` parameter and relies on the supabase-js client's built-in session management. The `UniversalDataWriter` interface still passes `authToken` for backward compatibility with the Strapi adapter, but the Supabase implementation does not use it directly.

### Data Type Mapping

The adapters must transform Supabase query results into the same `DPDataType` types the frontend expects. The existing `@openvaa/data` types (`ElectionData`, `CandidateData`, `QuestionCategoryData`, etc.) are the contract. The Supabase adapter's `utils/` parsers perform this transformation, mirroring how the Strapi adapter's `utils/` parsers transform Strapi response shapes.

## Database Schema Design

### Multilingual Content Pattern

The existing Strapi schema stores multilingual content as JSON columns (e.g., `name: json` containing `{"en": "...", "fi": "...", "sv": "..."}`). This is the same JSONB pattern naturally supported by PostgreSQL.

**Decision: Keep the JSONB pattern.** Store localized strings as `jsonb` columns (e.g., `name jsonb NOT NULL DEFAULT '{}'::jsonb`). This matches the existing data model exactly, requires no change to the frontend parsing logic (the `translate()` function from `@openvaa/data` already expects `{locale: string}` objects), and avoids the complexity of separate translation tables.

### Core Tables

Based on direct analysis of all 15 Strapi content-type schemas:

```sql
-- Core election structure
CREATE TABLE elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  election_date date NOT NULL,
  election_start_date date NOT NULL,
  election_type text CHECK (election_type IN ('local', 'presidential', 'congress')),
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE constituency_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  subtype text,
  external_id text,
  created_at timestamptz DEFAULT now()
);

-- M:N via junction (Strapi has election -> constituency_groups as oneToMany)
CREATE TABLE election_constituency_groups (
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  constituency_group_id uuid REFERENCES constituency_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, constituency_group_id)
);

CREATE TABLE constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  keywords jsonb DEFAULT '{}',
  parent_id uuid REFERENCES constituencies(id),
  external_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE constituency_group_members (
  constituency_group_id uuid REFERENCES constituency_groups(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (constituency_group_id, constituency_id)
);

-- Organizations (parties) and candidates
CREATE TABLE parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  color text,
  color_dark text,
  image_path text,  -- Supabase Storage path
  answers jsonb DEFAULT '{}',
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES auth.users(id),  -- Supabase Auth link
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  registration_key text,
  identifier text,
  party_id uuid REFERENCES parties(id),
  image_path text,  -- Supabase Storage path
  answers jsonb DEFAULT '{}',
  app_language text,
  terms_of_use_accepted timestamptz,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- The nomination junction table (central to the data model)
CREATE TABLE nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  election_id uuid NOT NULL REFERENCES elections(id),
  constituency_id uuid REFERENCES constituencies(id),
  candidate_id uuid REFERENCES candidates(id),
  party_id uuid REFERENCES parties(id),
  election_symbol text,
  election_round integer NOT NULL DEFAULT 1,
  unconfirmed boolean DEFAULT false,
  external_id text,
  created_at timestamptz DEFAULT now()
);

-- Alliances
CREATE TABLE alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  image_path text,
  color text,
  color_dark text,
  election_id uuid REFERENCES elections(id),
  external_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE alliance_parties (
  alliance_id uuid REFERENCES alliances(id) ON DELETE CASCADE,
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  PRIMARY KEY (alliance_id, party_id)
);

CREATE TABLE alliance_constituencies (
  alliance_id uuid REFERENCES alliances(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (alliance_id, constituency_id)
);

-- Questions
CREATE TABLE question_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  settings jsonb DEFAULT '{}',
  info text,
  external_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE question_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  "order" integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'opinion' CHECK (type IN ('opinion', 'info')),
  color text,
  color_dark text,
  custom_data jsonb DEFAULT '{}',
  external_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE question_category_elections (
  question_category_id uuid REFERENCES question_categories(id) ON DELETE CASCADE,
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  PRIMARY KEY (question_category_id, election_id)
);

CREATE TABLE question_category_constituencies (
  question_category_id uuid REFERENCES question_categories(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (question_category_id, constituency_id)
);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  question_type_id uuid NOT NULL REFERENCES question_types(id),
  category_id uuid REFERENCES question_categories(id),
  text jsonb NOT NULL DEFAULT '{}',
  short_name jsonb DEFAULT '{}',
  info jsonb DEFAULT '{}',
  filling_info jsonb DEFAULT '{}',
  allow_open boolean DEFAULT true,
  filterable boolean DEFAULT false,
  required boolean DEFAULT true,
  locked boolean DEFAULT false,
  "order" integer DEFAULT 0,
  entity_type text DEFAULT 'all' CHECK (entity_type IN ('all', 'candidate', 'party')),
  custom_data jsonb DEFAULT '{}',
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE question_elections (
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, election_id)
);

CREATE TABLE question_constituencies (
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, constituency_id)
);

-- App configuration (singleton per tenant)
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id),
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE app_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id),
  publisher_name jsonb,
  publisher_logo_path text,
  publisher_logo_dark_path text,
  poster_path text,
  poster_dark_path text,
  cand_poster_path text,
  cand_poster_dark_path text,
  candidate_app_faq jsonb DEFAULT '[]',
  translation_overrides jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feedback
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  description text,
  user_agent text,
  date timestamptz,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Admin operations
CREATE TABLE admin_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  job_id text NOT NULL,
  job_type text NOT NULL,
  election_id text NOT NULL,
  author text NOT NULL,
  end_status text CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time timestamptz,
  end_time timestamptz,
  input jsonb,
  output jsonb,
  messages jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Languages
CREATE TABLE languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  localisation_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Answer Storage: JSONB vs Relational

The current Strapi schema stores answers as a JSONB column on `candidates` and `parties`:
```json
{
  "questionDocumentId1": { "value": 3, "openAnswer": {"en": "...", "fi": "..."} },
  "questionDocumentId2": { "value": 1 }
}
```

**This is a key design decision that the PROJECT.md explicitly calls out for load testing.** The schema above shows JSONB as the default, but a relational alternative exists:

```sql
CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  entity_id uuid NOT NULL,    -- candidate or party id
  entity_type text NOT NULL,  -- 'candidate' or 'party'
  question_id uuid NOT NULL REFERENCES questions(id),
  value jsonb NOT NULL,       -- the answer value (number, array, etc.)
  open_answer jsonb,          -- localized open answer text
  UNIQUE (entity_id, question_id)
);
```

**Tradeoffs:**
- JSONB: Simpler reads (single row fetch), matches current adapter parsing, but harder to query across candidates (e.g., "all candidates who answered question X with value Y") and no referential integrity on question IDs.
- Relational: Better for admin analytics, cross-candidate queries, referential integrity, but requires JOINs or multiple queries for loading a candidate's full answer set.

**Recommendation:** Start with JSONB (matches existing pattern, lower migration risk), but build the load test infrastructure to compare both approaches under realistic data volumes (200-2000 candidates, 30-50 questions, 3-4 languages). The adapter's `_setAnswers` and `_getEntityData` methods should be written to abstract this so switching is easy.

## Multi-Tenant Isolation

### Tenant Model

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,    -- URL-friendly identifier
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link users to tenants
CREATE TABLE tenant_members (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (tenant_id, user_id)
);
```

Every data table includes `tenant_id uuid NOT NULL REFERENCES tenants(id)`. The tenant context is stored in the user's JWT as a custom claim (via `app_metadata`).

### RLS Policy Pattern

```sql
-- Helper function to extract tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE;

-- Standard RLS pattern applied to every data table
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;

-- Public read (voter app): anon users can read if they know the tenant
-- This requires tenant_id to be passed as a query parameter or header
CREATE POLICY "Public read elections"
  ON elections FOR SELECT
  USING (tenant_id = auth.tenant_id() OR auth.tenant_id() IS NULL);

-- Authenticated write (admin only)
CREATE POLICY "Admin write elections"
  ON elections FOR ALL
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());
```

**Important consideration for the voter app:** The voter app currently makes unauthenticated (public) read requests. With Supabase, the anon key provides access, but RLS policies still need to filter by tenant. Two approaches:

1. **Tenant in URL/header:** Frontend passes tenant slug, resolved to ID server-side, set in a Supabase function context.
2. **Tenant-specific anon key:** Each tenant deployment uses its own Supabase project (simpler RLS, but harder to manage at scale).

**Recommendation for initial migration:** Use approach (2) -- single-tenant per deployment, matching the current model where each VAA deployment is its own instance. The `tenant_id` column and RLS infrastructure is still present for future multi-tenant support, but a single tenant row is created during initialization and all records use it. This avoids the complexity of JWT-based tenant resolution while keeping the schema future-proof.

### Impact on @openvaa/data Package

None. The `@openvaa/data` package defines data types (`ElectionData`, `CandidateData`, etc.) and object constructors. These are adapter-agnostic. The `tenant_id` is a backend concern that never surfaces in the frontend data model. The Supabase adapter's parser functions strip `tenant_id` from query results before constructing `DPDataType` objects, just as the Strapi adapter's parsers strip Strapi-specific fields like `documentId` and `locale`.

## Authentication Flow

### Current Strapi Auth Flow

```
1. Candidate opens login page
2. Frontend POSTs {identifier, password} to Strapi /api/auth/local
3. Strapi returns {jwt: "..."}
4. Frontend stores JWT in cookie (AUTH_TOKEN_KEY = 'token')
5. Subsequent requests include Authorization: Bearer <jwt>
6. hooks.server.ts checks cookie presence for route protection
```

### New Supabase Auth Flow

```
1. Candidate opens login page
2. Frontend calls supabase.auth.signInWithPassword({email, password})
3. Supabase Auth (GoTrue) validates credentials, returns session
4. @supabase/ssr automatically manages session cookies
5. hooks.server.ts creates server client, extracts session for route protection
6. All supabase-js queries automatically include auth context from session
```

**Detailed hooks.server.ts integration:**

```typescript
// frontend/src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const { params, route, url, request } = event;

  // 1. Create per-request Supabase server client
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          );
        }
      }
    }
  );

  // 2. Session getter (lazy -- only called when needed)
  event.locals.getSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    return session;
  };

  // 3. Existing locale handling stays exactly the same
  // ... (all the locale matching and redirect logic is unchanged) ...

  // 4. Updated candidate route protection (replaces cookie check)
  if (pathname.startsWith(`/${servedLocale}/candidate`)) {
    const session = await event.locals.getSession();

    if (session && pathname.endsWith('candidate/login')) {
      redirect(303, `/${servedLocale}/candidate`);
    }

    if (!session && route.id?.includes('(protected)')) {
      redirect(303, `/${servedLocale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
    }
  }

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', `${servedLocale}`)
  });
};
```

**Updated app.d.ts:**
```typescript
declare global {
  namespace App {
    interface Locals {
      currentLocale: string;
      preferredLocale?: string;
      supabase: SupabaseClient;
      getSession: () => Promise<Session | null>;
    }
  }
}
```

### Registration Flow Migration

The current Strapi-based candidate registration is a multi-step custom flow:
1. Admin pre-registers candidate (creates candidate + user record)
2. System sends email with registration key
3. Candidate clicks link, enters registration key + sets password
4. System activates user account

This custom flow does NOT map directly to Supabase Auth's built-in flows. It requires **Supabase Edge Functions** to replicate:

```
POST /functions/v1/candidate-preregister
  - Creates candidate record in `candidates` table
  - Creates unconfirmed auth.user via Supabase Admin API
  - Generates registration key, stores on candidate
  - Sends email via SMTP (Supabase Auth email or custom)

POST /functions/v1/candidate-check
  - Validates registration key, returns candidate info

POST /functions/v1/candidate-register
  - Validates registration key + new password
  - Confirms auth.user, sets password
  - Links auth.user to candidate record
```

**Alternative:** Use database functions (PL/pgSQL) called via Supabase RPC instead of Edge Functions. This keeps the logic in SQL, which is more performant and avoids the cold-start overhead of Edge Functions. The tradeoff is that SQL is less readable for complex business logic.

**Recommendation:** Use Edge Functions for the registration flow because it involves email sending, multiple table operations, and complex validation that benefits from TypeScript readability.

## Realtime Capabilities

**Assessment:** The VAA does NOT benefit from Supabase Realtime for the voter app. Voter data is read-only and changes only when admins update election data. The candidate app could potentially use Realtime for live answer-locking notifications, but this is a future enhancement, not a migration requirement.

**Recommendation:** Do not configure Realtime subscriptions during migration. If using self-hosted Docker, the Realtime service can be kept running (minimal resource cost) but no client subscriptions should be created.

**One potential use:** Admin app could use Realtime to show live progress of data import jobs (replacing the current polling pattern), but this is an optimization for after the migration is stable.

## Docker Compose Changes

### Current Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `frontend` | Custom SvelteKit | 5173 | Frontend app |
| `strapi` | Custom Strapi v5 | 1337 | Backend API + admin |
| `postgres` | postgres:15 | 5432 | Database |
| `awslocal` | localstack/localstack | 4566 | S3 + SES emulation |
| `adminer` | adminer | 4567 | DB admin (dev only) |

### Target Services (using Supabase CLI)

**Recommended approach for local dev: Use `supabase start` from the Supabase CLI.** This manages its own Docker containers and is the supported development workflow. The frontend Docker service connects to Supabase's exposed ports.

```yaml
# docker-compose.dev.yml (simplified)
services:
  frontend:
    extends:
      file: ./frontend/docker-compose.dev.yml
      service: frontend
    environment:
      PUBLIC_SUPABASE_URL: http://host.docker.internal:54321
      PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      # Keep existing vars that are still needed
      PUBLIC_BROWSER_FRONTEND_URL: ${PUBLIC_BROWSER_FRONTEND_URL}
      PUBLIC_DEBUG: ${PUBLIC_DEBUG}
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  cache:
    driver: local
```

**Services provided by `supabase start`:**

| Service | Port | Replaces |
|---------|------|----------|
| Supabase API (Kong) | 54321 | Strapi REST API (:1337) |
| Supabase Studio | 54323 | Strapi Admin UI (:1337/admin) |
| PostgreSQL | 54322 | postgres (:5432) |
| Inbucket (email) | 54324 | LocalStack SES (:4566) |
| Supabase Storage | (via API) | LocalStack S3 (:4566) |
| GoTrue (Auth) | (via API) | Strapi users-permissions |

**Alternative: Self-hosted Supabase in Docker Compose.** If the team prefers a single `docker-compose up` command rather than `supabase start` + `docker-compose up frontend`, the Supabase services can be embedded in the project's docker-compose. However, this is significantly more complex (15+ services to configure) and harder to maintain. The CLI approach is strongly recommended.

### Migration of Environment Variables

| Current (.env) | Replacement | Notes |
|-----------------|-------------|-------|
| `PUBLIC_BROWSER_BACKEND_URL` | `PUBLIC_SUPABASE_URL` | Supabase API gateway URL |
| `PUBLIC_SERVER_BACKEND_URL` | `PUBLIC_SUPABASE_URL` | Same URL for server-side (supabase-js handles this) |
| `STRAPI_HOST`, `STRAPI_PORT` | Removed | No Strapi service |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET` | `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase JWT keys |
| `DATABASE_*` | Managed by Supabase CLI | Direct DB access via `supabase db` commands |
| `AWS_SES_*`, `MAIL_FROM*` | Supabase Auth SMTP settings | Configured in `supabase/config.toml` |
| `AWS_S3_*` | Supabase Storage config | Local storage by default, S3-compatible in production |
| `GENERATE_MOCK_DATA_*` | `supabase/seed.sql` | SQL-based seeding |
| `BACKEND_API_TOKEN` | `SUPABASE_SERVICE_ROLE_KEY` | Admin-level access |
| `IDENTITY_PROVIDER_*` | Supabase Auth providers | Configured via dashboard or `config.toml` |

## Build Order and Dependency Flow

### Existing Dependency Flow (unchanged)

```
@openvaa/core --> @openvaa/data --> @openvaa/app-shared --> frontend
              --> @openvaa/matching
              --> @openvaa/filters
```

### New Dependencies Added

```
@supabase/supabase-js  --> frontend (devDependency or dependency)
@supabase/ssr          --> frontend (dependency)
supabase (CLI)         --> dev tooling (global or npx)
```

### Build Order for Migration

The migration does NOT change the package build order. The Supabase client libraries are frontend-only dependencies. The `@openvaa/data` and `@openvaa/app-shared` packages are modified only for type additions (new `SupabaseDataAdapter` type), which is a backwards-compatible change.

```
1. packages/app-shared  -- Add SupabaseDataAdapter type, rebuild
2. frontend             -- Add @supabase/supabase-js, @supabase/ssr
3. supabase/            -- New directory at repo root for migrations, config, functions
```

**Build commands remain the same:**
```bash
yarn build:app-shared    # After adding SupabaseDataAdapter type
yarn workspace @openvaa/frontend dev  # Now with Supabase adapter available
```

### File Changes Summary by Phase

**Phase 1: Schema and Local Dev**
- New: `supabase/config.toml`, `supabase/migrations/*.sql`, `supabase/seed.sql`
- Modified: Root `.env` (add Supabase vars)
- Modified: `docker-compose.dev.yml` (simplified for frontend-only)

**Phase 2: Adapter Layer**
- New: `frontend/src/lib/api/adapters/supabase/` (entire directory)
- New: `frontend/src/lib/supabase/client.ts`
- Modified: `packages/app-shared/src/settings/staticSettings.type.ts`
- Modified: `frontend/src/lib/api/dataProvider.ts` (add case)
- Modified: `frontend/src/lib/api/dataWriter.ts` (add case)
- Modified: `frontend/src/lib/api/feedbackWriter.ts` (add case)

**Phase 3: Auth Integration**
- Modified: `frontend/src/hooks.server.ts`
- Modified: `frontend/src/app.d.ts`
- Modified: `frontend/src/lib/auth/` (adapt to Supabase sessions)
- New: `supabase/functions/candidate-preregister/`
- New: `supabase/functions/candidate-register/`
- New: `supabase/functions/candidate-check/`

**Phase 4: Storage and Email**
- New: Supabase Storage bucket configuration
- Modified: Image handling in adapter parsers
- Modified: Email template configuration in `supabase/config.toml`

**Phase 5: Switch Over**
- Modified: `packages/app-shared/src/settings/staticSettings.ts` (`type: 'supabase'`)
- Deprecated: `backend/vaa-strapi/` directory (kept for reference, eventually removed)

## Coexistence Strategy

Strapi and Supabase CAN coexist during transition because the adapter selection is config-driven:

```typescript
// frontend/src/lib/api/dataProvider.ts
switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataProvider');
    break;
  case 'supabase':
    module = import('./adapters/supabase/dataProvider');
    break;
  case 'local':
    module = import('./adapters/apiRoute/dataProvider');
    break;
}
```

**Switching is a one-line config change** in `staticSettings.ts`. During development:
- Run `supabase start` for Supabase services
- Run `docker compose up` for just the frontend
- Toggle between adapters by changing `staticSettings.dataAdapter.type`
- Both adapters can exist in the codebase simultaneously

**Data migration path:** Once the Supabase schema is finalized and all adapter methods pass tests, a one-time data migration script exports from Strapi's Postgres and imports into Supabase's Postgres. The existing Admin Tools import/export functionality can be adapted for this.

## Patterns to Follow

### Pattern 1: Supabase Adapter Mixin (mirrors Strapi pattern)

```typescript
// frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';

export function supabaseAdapterMixin<TBase extends Constructor>(
  base: TBase
): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base {
    #supabase: SupabaseClient | undefined;

    initSupabase(client: SupabaseClient): this {
      this.#supabase = client;
      return this;
    }

    get supabase(): SupabaseClient {
      if (!this.#supabase) throw new Error('Supabase client not initialized');
      return this.#supabase;
    }

    // Helper: query with tenant filtering built in
    async query<T>(table: string, options?: QueryOptions): Promise<T[]> {
      let q = this.supabase.from(table).select(options?.select ?? '*');
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          q = q.eq(key, value);
        }
      }
      const { data, error } = await q;
      if (error) throw new Error(`Supabase query error on ${table}: ${error.message}`);
      return data as T[];
    }
  }
  return WithMixin;
}
```

### Pattern 2: Parser Functions (Supabase Row to DPDataType)

```typescript
// frontend/src/lib/api/adapters/supabase/utils/parseElection.ts
import { translate } from '$lib/i18n';
import type { ElectionData } from '@openvaa/data';

interface SupabaseElectionRow {
  id: string;
  name: Record<string, string>;
  short_name: Record<string, string>;
  info: Record<string, string>;
  election_date: string;
  election_start_date: string;
  election_type: string | null;
  constituency_groups: Array<{ id: string }>;
}

export function parseElection(row: SupabaseElectionRow, locale: string | null): ElectionData {
  return {
    id: row.id,
    name: translate(row.name, locale),
    shortName: translate(row.short_name, locale),
    info: translate(row.info, locale),
    date: row.election_date,
    subtype: row.election_type,
    constituencyGroupIds: row.constituency_groups?.map(cg => cg.id) ?? [],
    customData: {}
  };
}
```

### Pattern 3: RLS Policy Indexing

```sql
-- Every table with RLS and tenant_id must have this index
CREATE INDEX idx_elections_tenant_id ON elections(tenant_id);
CREATE INDEX idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX idx_nominations_tenant_id ON nominations(tenant_id);
-- ... for every table

-- Composite indexes for common query patterns
CREATE INDEX idx_nominations_election_constituency
  ON nominations(election_id, constituency_id);
CREATE INDEX idx_questions_category
  ON questions(category_id);
CREATE INDEX idx_candidates_party
  ON candidates(party_id);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using PostgREST Directly Instead of supabase-js

**What:** Making raw HTTP calls to Supabase's PostgREST API from the adapter.
**Why bad:** Loses auth session management, cookie handling, type safety, and retry logic that supabase-js provides. Also bypasses RLS context.
**Instead:** Always use the supabase-js client. The `UniversalAdapter.fetch()` method should NOT be used for Supabase queries (it's for generic HTTP). The Supabase adapter bypasses the fetch-based architecture and uses supabase-js directly.

### Anti-Pattern 2: Storing Session Tokens Manually

**What:** Extracting the Supabase JWT and storing it in a cookie manually (like the current Strapi `AUTH_TOKEN_KEY` pattern).
**Why bad:** `@supabase/ssr` handles cookie management, token refresh, and session lifecycle. Manual management leads to stale tokens and refresh race conditions.
**Instead:** Let `@supabase/ssr`'s `createServerClient` and `createBrowserClient` manage sessions. Access the session via `supabase.auth.getSession()`.

### Anti-Pattern 3: Skipping RLS During Development

**What:** Using the `service_role` key in client-facing code to bypass RLS during development.
**Why bad:** Hides authorization bugs that only appear in production. Service role key in client code is a security vulnerability.
**Instead:** Always use the `anon` key for client code. Use `service_role` only in server-side Edge Functions or admin scripts.

### Anti-Pattern 4: One Giant Migration File

**What:** Putting all table definitions, RLS policies, functions, and seed data in a single SQL migration.
**Why bad:** Impossible to review, debug, or roll back individual changes.
**Instead:** Use incremental migrations: one for core tables, one for junction tables, one for RLS policies, one for helper functions, one for indexes. The Supabase CLI's `supabase migration new <name>` creates timestamped files in order.

### Anti-Pattern 5: Putting Business Logic in RLS Policies

**What:** Complex conditional logic in RLS policies (e.g., "candidates can only update their own answers if the election is not locked").
**Why bad:** RLS policies are hard to debug, hard to test, and have performance implications. Complex policies become unmaintainable.
**Instead:** Keep RLS policies simple (tenant isolation + role-based access). Business logic (locking, validation) belongs in Edge Functions or database functions called via RPC.

## Scalability Considerations

| Concern | Single VAA Deployment | 10+ Tenant Deployments | 100+ Concurrent Elections |
|---------|----------------------|------------------------|--------------------------|
| Query performance | Postgres handles easily; index tenant_id | RLS overhead is real; indexes critical | Partition by election or tenant |
| Auth sessions | GoTrue handles thousands of sessions | Per-tenant Supabase projects or shared with JWT claims | Shared GoTrue, tenant in JWT |
| Storage | Local filesystem sufficient | Supabase Storage with S3 backend | CDN in front of Storage |
| Answer queries | JSONB on candidates table | Consider relational answers table | Definitely relational with partitioning |
| Admin operations | Edge Functions fine | Edge Functions with queue for bulk ops | Background workers, not Edge Functions |

## Sources

- [Setting up Server-Side Auth for SvelteKit | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/sveltekit) -- HIGH confidence (official docs)
- [Creating a Supabase client for SSR | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- HIGH confidence (official docs)
- [Self-Hosting with Docker | Supabase Docs](https://supabase.com/docs/guides/self-hosting/docker) -- HIGH confidence (official docs)
- [Local Development & CLI | Supabase Docs](https://supabase.com/docs/guides/local-development) -- HIGH confidence (official docs)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence (official docs)
- [Storage | Supabase Docs](https://supabase.com/docs/guides/storage) -- HIGH confidence (official docs)
- [Send emails with custom SMTP | Supabase Docs](https://supabase.com/docs/guides/auth/auth-smtp) -- HIGH confidence (official docs)
- [Email Templates | Supabase Docs](https://supabase.com/docs/guides/auth/auth-email-templates) -- HIGH confidence (official docs)
- [Send Email Hook | Supabase Docs](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) -- HIGH confidence (official docs)
- [Standard Uploads | Supabase Docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads) -- HIGH confidence (official docs)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- MEDIUM confidence (third-party, verified against official RLS docs)
- [Perfect Local SvelteKit Supabase Setup in 2025](https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp) -- MEDIUM confidence (community guide)
- [supabase/docker/docker-compose.yml](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml) -- HIGH confidence (official repo)
- Direct codebase analysis of all Strapi content types, adapter layer, auth flow, and Docker configuration -- HIGH confidence

---

_Architecture research for: Supabase Migration, SvelteKit 2 VAA monorepo_
_Researched: 2026-03-12_

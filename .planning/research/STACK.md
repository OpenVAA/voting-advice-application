# Technology Stack

**Project:** OpenVAA Supabase Migration (v2.0)
**Researched:** 2026-03-12
**Overall Confidence:** HIGH (verified against official Supabase docs, npm registry, CLI docs)

## Context

OpenVAA is migrating its backend from Strapi v5 to Supabase. The existing stack uses Docker Compose with four services (frontend/SvelteKit, strapi, postgres:15, localstack/S3+SES). This research covers what to ADD, what to CHANGE, and what to REMOVE for the Supabase migration. The SvelteKit frontend, shared packages, and test infrastructure remain unchanged.

---

## Recommended Stack

### Supabase Core (Local Development)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `supabase` (CLI) | `^2.78.1` | Local development stack, migrations, type generation, testing | The Supabase CLI is the single entry point for local development. Running `supabase start` launches all needed services as Docker containers: PostgreSQL 15, GoTrue (auth), Storage API, PostgREST, Studio dashboard, Mailpit (email), Kong (API gateway), and more. This replaces the entire existing docker-compose backend stack. Install as a dev dependency in the monorepo root so all developers get the same version via `yarn install`. |
| Docker Desktop | Latest | Container runtime for Supabase CLI services | Already required for current dev stack. Supabase CLI orchestrates its own Docker Compose internally -- no manual docker-compose.yml needed for backend services. Compatible alternatives: OrbStack, Rancher Desktop, Podman, colima. |

**Confidence:** HIGH -- verified via [Supabase CLI docs](https://supabase.com/docs/guides/local-development/cli/getting-started) and [npm registry](https://www.npmjs.com/package/supabase).

### Supabase Client Libraries (Frontend Integration)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@supabase/supabase-js` | `^2.99.1` | Isomorphic JavaScript client for Supabase (database queries, auth, storage, realtime) | The core client library. Provides typed database queries via PostgREST, auth session management, storage file operations, and realtime subscriptions. Used in both server-side (hooks, load functions) and client-side (components) SvelteKit code. |
| `@supabase/ssr` | `^0.9.0` | Server-side rendering auth helper (cookie-based session management) | Replaces the deprecated `@supabase/auth-helpers-sveltekit` package. Framework-agnostic SSR helper that configures supabase-js to use cookies for session persistence. Required for SvelteKit's server hooks to access the user session. Creates two client types: browser client and server client. |

**Confidence:** HIGH -- versions verified via npm registry (supabase-js@2.99.1 published 2026-03-11, ssr@0.9.0 published 2026-03-10). Official SvelteKit integration guide at [Supabase SvelteKit SSR docs](https://supabase.com/docs/guides/auth/server-side/sveltekit).

### Database & Migrations

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 15 (via Supabase CLI) | Primary database | Same major version as current stack (postgres:15 in docker-compose). Supabase CLI bundles its own Postgres container. No version mismatch risk. |
| Supabase Migrations | Built into CLI | Version-controlled SQL schema changes | Files in `supabase/migrations/<timestamp>_<name>.sql`. Apply with `supabase migration up`, validate full history with `supabase db reset`. Diff-based generation available via `supabase db diff` but should always be reviewed manually. |
| `supabase/seed.sql` | N/A | Seed data for development | Replaces Strapi's `GENERATE_MOCK_DATA_ON_INITIALISE` mechanism. SQL-based seeding runs automatically on `supabase db reset`. Deterministic and version-controlled. |

**Confidence:** HIGH -- verified via [Supabase migration docs](https://supabase.com/docs/guides/deployment/database-migrations).

### Database Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pgTAP | Bundled with Supabase | SQL-native database unit testing framework | Tests RLS policies, functions, triggers, and schema constraints directly in PostgreSQL. Tests live in `supabase/tests/database/*.test.sql`. Run with `supabase test db`. Each test runs in a transaction and rolls back, ensuring isolation. This is the canonical way to test RLS policies -- critical for the multi-tenant model. |

**Confidence:** HIGH -- verified via [Supabase testing docs](https://supabase.com/docs/guides/database/testing) and [pgTAP extension docs](https://supabase.com/docs/guides/database/extensions/pgtap).

### Email (Development)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Mailpit | Bundled with Supabase CLI | Human-readable email capture for local development | Supabase CLI bundles Mailpit (replaced Inbucket in recent versions) as a local SMTP server that captures all emails. Web UI at `http://localhost:54324`. All Supabase Auth emails (verification, password reset, magic links) are automatically routed here. No configuration needed -- it works out of the box with `supabase start`. This replaces LocalStack SES for development email testing. |

**Mailpit for custom (non-auth) emails:** For application-level emails (e.g., candidate notifications sent via Edge Functions or database webhooks), configure the Edge Function to use the local Mailpit SMTP endpoint (`localhost:54325`) during development. All emails land in the same Mailpit inbox regardless of sender.

**Confidence:** HIGH -- verified via [Supabase CLI config docs](https://supabase.com/docs/guides/local-development/cli/config). Mailpit is the default email service; ports 54324 (web), 54325 (SMTP), 54326 (POP3).

### Storage (Replacing Strapi S3 Plugin)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Storage | Bundled with Supabase CLI | S3-compatible object storage with RLS policies | Replaces both the Strapi `@strapi/provider-upload-aws-s3` plugin and LocalStack S3. Stores files locally on disk during development (no external S3 dependency). Supports public buckets (candidate photos, media) and private buckets (sensitive documents). RLS policies on `storage.objects` table control access. S3-compatible endpoint at `http://localhost:54321/storage/v1/s3` for any existing S3 tooling. In production, can back onto real AWS S3, MinIO, or Cloudflare R2. |

**Confidence:** HIGH -- verified via [Supabase Storage docs](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [S3 compatibility docs](https://supabase.com/docs/guides/storage/s3/compatibility).

### Type Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `supabase gen types typescript` | Built into CLI | Generate TypeScript types from database schema | Replaces Strapi's `strapi ts:generate-types`. Generates a `database.types.ts` file from the local database schema. Pass to `createClient<Database>()` for end-to-end type safety across all queries. Run locally with `--local` flag. Add as a package.json script: `"gen:types": "supabase gen types typescript --local > frontend/src/lib/database.types.ts"`. |

**Confidence:** HIGH -- verified via [Supabase type generation docs](https://supabase.com/docs/guides/api/rest/generating-types).

### Load Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| k6 | Latest binary (v1.0+) | HTTP and database load testing for schema validation | Use k6 to compare JSON vs relational answer storage strategies under load. k6 is NOT distributed via npm (the npm package is a dummy). Install via Homebrew (`brew install k6`) or download the binary. Write test scripts in JavaScript/TypeScript that hit the Supabase PostgREST API. For direct Postgres benchmarking, use the `xk6-pgxpool` extension or pgbench (see below). |
| pgbench | Bundled with PostgreSQL | Direct Postgres benchmarking | Built into every Postgres installation. Use for raw SQL performance comparison of schema alternatives (e.g., JSONB column vs normalized answer tables). Run against the local Supabase Postgres on port 54322. Custom SQL scripts via `pgbench -f`. Best for measuring query latency and throughput at the database level. |

**Why k6 + pgbench (not just one):** k6 tests the full API path (PostgREST + RLS policies + network), pgbench tests raw query performance. Both perspectives matter for the answer storage decision.

**Confidence:** MEDIUM -- k6 verified via [official site](https://k6.io/) and [GitHub releases](https://github.com/grafana/k6/releases). pgbench verified via [PostgreSQL docs](https://www.postgresql.org/docs/current/pgbench.html). The combination for Supabase schema validation is a recommendation based on common patterns, not an officially prescribed workflow.

### Multi-Tenant Support

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL RLS (Row Level Security) | Native to PostgreSQL | Tenant data isolation | No additional library needed. RLS policies enforce tenant isolation at the database level. Use `auth.jwt() ->> 'app_metadata'` or a custom `auth.tenant_id()` helper function to extract the organization/tenant ID from the JWT. Store `tenant_id` in `app_metadata` (not `raw_user_meta_data`) because app_metadata is a restricted field users cannot modify. |
| Custom Access Token Hook | Built into Supabase Auth | Inject tenant_id into JWT claims | Use a Postgres function registered as a Custom Access Token Hook to add `organization_id` to the JWT at token issuance time. This avoids the round-trip of querying tenant membership on every request. |

**Confidence:** HIGH for RLS approach -- verified via [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) and [custom claims docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac). MEDIUM for custom access token hook -- pattern is documented but implementation details will vary by project.

### Supporting Libraries (Existing -- Keep)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^4.0.0` | Runtime validation of API responses and form data | Already in frontend dependencies. Use for validating data from Supabase queries where TypeScript types alone are insufficient (user input, external data). |
| `jose` | `^5.9.6` | JWT handling for IdP (Signicat) integration | Already in frontend. Continue using for the OpenID Connect bank authentication flow. Supabase Auth handles its own JWTs separately. |
| `@faker-js/faker` | `^8.4.1` | Mock data generation for seed scripts and tests | Already a root devDependency. Use in seed.sql generation scripts and E2E test fixtures. |

---

## What to REMOVE from the Stack

| Component | Currently Used For | Replacement | Notes |
|-----------|-------------------|-------------|-------|
| **Strapi v5** (`@strapi/strapi`, all `@strapi/*` plugins) | Backend CMS, API, auth, admin UI | Supabase (PostgREST API + GoTrue Auth + Storage + Studio) | Remove entire `backend/vaa-strapi/` workspace from monorepo after migration. This includes `@strapi/plugin-users-permissions`, `@strapi/provider-email-nodemailer`, `@strapi/provider-upload-aws-s3`, `@aws-sdk/client-ses`, `strapi-plugin-multi-select`, and all React dependencies (react, react-dom, react-router-dom, styled-components). |
| **LocalStack** (`localstack/localstack` Docker image) | Local S3 and SES emulation | Supabase Storage (local file-based) + Mailpit (bundled with CLI) | LocalStack was only used for S3 bucket emulation and SES email. Both are natively provided by the Supabase CLI stack. Remove the `awslocal` service, `localstack-init-aws.sh`, `localstack-s3-cors-policy.json`, and all `AWS_*` environment variables. |
| **Root docker-compose.dev.yml** (backend portion) | Orchestrating strapi, postgres, awslocal services | `supabase start` (CLI manages its own Docker Compose) | The root docker-compose.dev.yml currently defines 4 services. After migration, only the frontend service definition may be needed (or the frontend can run natively with `yarn workspace @openvaa/frontend dev`). The Supabase CLI handles postgres, auth, storage, email, and the API gateway internally. |
| **Adminer** (`adminer` Docker image, port 4567) | Database admin web UI | Supabase Studio (port 54323) | Studio provides a much richer UI: table editor, SQL editor, RLS policy editor, auth user management, storage bucket browser, and log viewer. |
| **`@openvaa/strapi-admin-tools`** plugin | Import/delete data in Strapi | Supabase seed.sql + direct SQL/API calls | The admin tools plugin was Strapi-specific. Data import for development uses seed.sql. Admin CRUD operations move to the frontend Admin App (separate milestone). |
| **`mailparser`** + **`cheerio`** (root devDependencies) | Parse emails from LocalStack SES in E2E tests | Mailpit API (`http://localhost:54324/api/v1/messages`) | Mailpit provides a REST API to query captured emails programmatically. E2E tests can fetch emails via `GET /api/v1/messages` and parse them directly as JSON instead of using mailparser to parse raw SMTP messages from LocalStack. Evaluate during E2E test migration whether these can be fully dropped. |

---

## What STAYS Unchanged

| Component | Why |
|-----------|-----|
| SvelteKit 2 frontend | Unaffected by backend migration. Data adapters abstract the backend. |
| `@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters` | Pure logic packages with no backend dependency. |
| `@openvaa/app-shared` | May need setting updates but the package itself stays. |
| Playwright E2E tests | Test infrastructure is backend-agnostic (tests via browser). E2E tests will need adapter updates but the framework stays. |
| Vitest unit tests | No backend dependency. |
| Yarn 4 workspaces | Monorepo structure is unchanged. |
| Tailwind CSS + DaisyUI | Styling is unrelated to backend. |
| `sveltekit-i18n` | i18n is frontend-only. Supabase stores translated content in JSON columns. |

---

## Docker Compose Changes

### Before (Current Stack -- 4 services)

```
docker-compose.dev.yml
  frontend    -> SvelteKit (port 5173)
  strapi      -> Strapi v5 (port 1337)
  postgres    -> PostgreSQL 15 (port 5432)
  awslocal    -> LocalStack S3+SES (port 4566)
  adminer     -> Database UI (port 4567)
```

### After (Supabase Stack)

```
supabase start -> Managed by Supabase CLI (ports 54321-54326)
  supabase_db         -> PostgreSQL 15 (port 54322)
  supabase_auth       -> GoTrue auth (internal)
  supabase_rest       -> PostgREST API (via Kong at port 54321)
  supabase_storage    -> Storage API (via Kong at port 54321)
  supabase_studio     -> Dashboard UI (port 54323)
  supabase_kong       -> API Gateway (port 54321)
  supabase_mailpit    -> Email (web: 54324, SMTP: 54325)
  supabase_realtime   -> Realtime subscriptions (internal)
  supabase_meta       -> Postgres metadata API (internal)
  supabase_imgproxy   -> Image transformations (internal)
  supabase_edge       -> Edge Functions runtime (internal)

docker-compose.dev.yml (simplified -- frontend only)
  frontend    -> SvelteKit (port 5173)
```

**Key port changes:**
- Backend API: `1337` (Strapi) -> `54321` (Supabase Kong gateway)
- Database: `5432` -> `54322`
- Email UI: none -> `54324` (Mailpit web)
- Dashboard: `4567` (Adminer) -> `54323` (Supabase Studio)
- S3 Storage: `4566` (LocalStack) -> `54321/storage/v1` (Supabase Storage)

---

## Environment Variables Changes

### Remove (Strapi-specific)

```bash
# All of these go away:
STRAPI_HOST, STRAPI_PORT, APP_KEYS, API_TOKEN_SALT
ADMIN_JWT_SECRET, JWT_SECRET
DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_SCHEMA, DATABASE_SSL_SELF
GENERATE_MOCK_DATA_ON_INITIALISE, GENERATE_MOCK_DATA_ON_RESTART
AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_REGION
AWS_S3_ACCESS_KEY_ID, AWS_S3_ACCESS_SECRET, AWS_S3_REGION, AWS_S3_BUCKET
STATIC_CONTENT_BASE_URL, STATIC_MEDIA_CONTENT_PATH
LOCALSTACK_ENDPOINT
BACKEND_API_TOKEN
```

### Add (Supabase-specific)

```bash
# Frontend .env
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>

# Server-side only (not PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

# Keep existing (unchanged)
PUBLIC_BROWSER_FRONTEND_URL=http://localhost:5173
PUBLIC_SERVER_FRONTEND_URL=http://frontend:5173
```

### Supabase CLI Config (`supabase/config.toml`)

```toml
[project]
id = "openvaa-local"

[api]
port = 54321

[db]
port = 54322
major_version = 15

[studio]
port = 54323

[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/auth/callback"]

[auth.email]
enable_confirmations = true
enable_signup = true

[storage]
file_size_limit = "10MiB"
```

---

## Installation

### New Dependencies (add to root package.json)

```bash
# Supabase CLI as dev dependency (ensures version consistency across team)
yarn add -D supabase

# Frontend: Supabase client libraries
yarn workspace @openvaa/frontend add @supabase/supabase-js @supabase/ssr
```

### Load Testing Tools (system-level, not npm)

```bash
# k6 (macOS via Homebrew)
brew install k6

# pgbench is bundled with PostgreSQL -- available inside Supabase's Postgres container
# Access via: docker exec -it supabase_db_openvaa-local pgbench ...

# Or install postgresql client tools locally:
brew install libpq
```

### TypeScript Types for k6 (optional, for IDE support)

```bash
yarn add -D @types/k6
```

### Initialize Supabase in the monorepo

```bash
# From monorepo root
npx supabase init

# Start local stack (first run downloads images -- takes ~5 min)
npx supabase start

# Note the output: API URL, anon key, service_role key
# Copy these to .env
```

### Package.json Scripts (add to root)

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:migrate": "supabase migration up",
    "supabase:types": "supabase gen types typescript --local > frontend/src/lib/database.types.ts",
    "supabase:test": "supabase test db",
    "supabase:seed": "supabase db reset --no-migrations"
  }
}
```

---

## SvelteKit Integration Pattern

### File Structure (new files in frontend)

```
frontend/
  src/
    lib/
      database.types.ts              # Generated by supabase gen types
      supabase/
        client.ts                    # Browser client factory
        server.ts                    # Server client factory (uses cookies)
    api/
      adapters/
        supabase/                    # New adapter (parallel to strapi/)
          supabaseAdapter.ts
          supabaseDataProvider.ts
          supabaseDataWriter.ts
          supabaseFeedbackWriter.ts
          utils/
    hooks.server.ts                  # Updated: create Supabase server client
    routes/
      auth/
        callback/
          +server.ts                 # OAuth code exchange endpoint
```

### hooks.server.ts Pattern

```typescript
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/database.types';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient<Database>(
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
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
```

---

## Monorepo Structure Changes

```
voting-advice-application/
  supabase/                          # NEW: Supabase project directory
    config.toml                      # Local dev config (ports, auth, storage)
    migrations/                      # SQL migration files
      20260312000000_initial_schema.sql
      20260312000001_rls_policies.sql
      ...
    seed.sql                         # Development seed data
    tests/
      database/                      # pgTAP test files
        000-setup.test.sql
        001-schema.test.sql
        002-rls-policies.test.sql
        003-answer-storage.test.sql
  load-tests/                        # NEW: k6 + pgbench scripts
    k6/
      answer-storage-json.js
      answer-storage-relational.js
      concurrent-voters.js
    pgbench/
      json-answers.sql
      relational-answers.sql
  backend/vaa-strapi/                # REMOVE after migration complete
  frontend/                          # MODIFY: add Supabase adapter
    src/lib/
      supabase/                      # NEW
      database.types.ts              # NEW (generated)
      api/adapters/supabase/         # NEW
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend platform | Supabase (self-hosted capable) | PocketBase, Directus, Hasura | Supabase matches existing Postgres stack, has native SvelteKit support, built-in auth + storage + RLS. PocketBase is SQLite-only. Directus adds ORM overhead. Hasura lacks integrated auth/storage. |
| Client library | `@supabase/supabase-js` + `@supabase/ssr` | Raw `fetch` + PostgREST | supabase-js provides typed queries, auth session management, and storage helpers. Raw fetch loses type safety and requires manual cookie handling. |
| Auth SSR helper | `@supabase/ssr` | `@supabase/auth-helpers-sveltekit` | auth-helpers-sveltekit is deprecated. @supabase/ssr is the official replacement, framework-agnostic, and actively maintained. |
| Local email | Mailpit (bundled) | Separate Mailpit/MailHog container | Supabase CLI already bundles Mailpit. Adding a separate container creates port conflicts and maintenance overhead with no benefit. |
| Storage | Supabase Storage (local files) | Keep LocalStack for S3 | Supabase Storage works out of the box locally, supports S3 protocol for production, and has RLS policies. LocalStack adds unnecessary complexity. |
| DB testing | pgTAP (bundled) | Jest + pg client | pgTAP runs inside PostgreSQL -- tests RLS policies in the actual security context. Jest tests from outside cannot properly test RLS behavior because they bypass the PostgREST/GoTrue auth chain. |
| Load testing | k6 + pgbench | Artillery, Locust, JMeter | k6 has native JavaScript scripting (team skill), excellent CLI output, and direct Postgres extensions. pgbench is the canonical Postgres benchmarking tool. Artillery/Locust add Python/Node dependencies unnecessarily. JMeter is Java-heavy and UI-oriented. |
| Schema migrations | Supabase CLI migrations | Prisma, Drizzle ORM, Knex | Supabase migrations are plain SQL -- no ORM abstraction layer. RLS policies, functions, and triggers are first-class citizens. ORMs struggle with Postgres-specific features like RLS. The team writes SQL directly for the schema; an ORM adds complexity without value for this project. |
| Type generation | `supabase gen types` | Prisma generate, Drizzle introspect | supabase gen types reads directly from the running database and produces types matching the PostgREST API response shape. Prisma/Drizzle types match their ORM query builders, which we are not using. |

---

## What NOT to Add (Avoid Over-Engineering)

| Avoid | Why | What to Do Instead |
|-------|-----|-------------------|
| Prisma or Drizzle ORM | Adds an abstraction layer that conflicts with Supabase's PostgREST pattern. RLS policies, database functions, and Supabase's type system all assume direct SQL. An ORM would create two sources of truth for the schema. | Use `supabase-js` for queries (uses PostgREST under the hood) and raw SQL for migrations. |
| Supabase Edge Functions (in this milestone) | Edge Functions are useful for custom server logic but are not needed for the initial migration. The SvelteKit server already handles server-side logic. Adding Edge Functions introduces Deno as a second runtime. | Keep server-side logic in SvelteKit server routes (`+server.ts`, `+page.server.ts`). Evaluate Edge Functions later for specific use cases (e.g., database webhooks, background jobs). |
| Supabase Realtime | Not needed for a VAA. Candidates fill out questionnaires asynchronously; voters view static results. Realtime adds WebSocket complexity and resource consumption. | Use standard HTTP queries. If live updates are ever needed (e.g., live election night), evaluate then. |
| Custom Docker Compose for Supabase services | The Supabase CLI manages its own Docker Compose internally. Writing a custom docker-compose.yml for Supabase services creates a maintenance burden and diverges from the standard Supabase local dev experience. | Use `supabase start` / `supabase stop`. Configure via `supabase/config.toml`. |
| Separate email service (Resend, SendGrid) in dev | Mailpit bundled with Supabase CLI captures all emails locally. Adding a real email service for development is unnecessary and risks sending real emails during testing. | Use bundled Mailpit for development. Configure production SMTP (AWS SES or Resend) via Supabase dashboard/config for production only. |
| `supabase-community/supabase-custom-claims` library | This library provides helper functions for custom JWT claims. The functionality is achievable with a simple Postgres function (5-10 lines of SQL). A library dependency for such a small piece of logic is overkill. | Write a `auth.tenant_id()` SQL function directly in a migration file. |

---

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|----------------|-------|
| `supabase` CLI `^2.78.1` | Docker Desktop 4.x, OrbStack, Node.js 20+ | CLI requires Node.js 20+ when installed via npm. Also available as standalone binary. |
| `@supabase/supabase-js@^2.99.1` | Node.js 18+, all modern browsers | Isomorphic -- works in browser and Node.js. |
| `@supabase/ssr@^0.9.0` | `@supabase/supabase-js@^2.x`, SvelteKit 2.x | Peer dependency on supabase-js@^2. Works with any SvelteKit version using hooks. |
| PostgreSQL 15 (via CLI) | Supabase CLI `^2.x` | Same major version as current docker-compose postgres:15. |
| pgTAP (bundled) | PostgreSQL 15 | No version management needed -- bundled as Postgres extension. |
| k6 `1.0+` | macOS (Homebrew), Linux (apt/rpm), Windows (choco) | Standalone binary -- no Node.js dependency. |

---

## Migration Path: Parallel Operation

During the migration, both backends can run simultaneously:

1. **Phase 1:** Supabase stack runs alongside Strapi. Frontend has both adapters. Feature flag switches between them.
2. **Phase 2:** All features migrated to Supabase adapter. Strapi adapter deprecated.
3. **Phase 3:** Remove Strapi workspace, LocalStack, old docker-compose backend services.

This allows incremental migration without a big-bang cutover.

---

## Sources

- Supabase CLI getting started: https://supabase.com/docs/guides/local-development/cli/getting-started -- HIGH confidence
- Supabase CLI config reference: https://supabase.com/docs/guides/local-development/cli/config -- HIGH confidence
- Supabase SSR auth for SvelteKit: https://supabase.com/docs/guides/auth/server-side/sveltekit -- HIGH confidence
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations -- HIGH confidence
- Supabase database testing (pgTAP): https://supabase.com/docs/guides/database/testing -- HIGH confidence
- Supabase Storage fundamentals: https://supabase.com/docs/guides/storage/buckets/fundamentals -- HIGH confidence
- Supabase Storage S3 compatibility: https://supabase.com/docs/guides/storage/s3/compatibility -- HIGH confidence
- Supabase TypeScript type generation: https://supabase.com/docs/guides/api/rest/generating-types -- HIGH confidence
- Supabase RLS and custom claims: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac -- HIGH confidence
- Supabase self-hosting with Docker: https://supabase.com/docs/guides/self-hosting/docker -- HIGH confidence
- npm: @supabase/supabase-js: https://www.npmjs.com/package/@supabase/supabase-js -- HIGH confidence
- npm: @supabase/ssr: https://www.npmjs.com/package/@supabase/ssr -- HIGH confidence
- npm: supabase (CLI): https://www.npmjs.com/package/supabase -- HIGH confidence
- k6 load testing: https://k6.io/ -- HIGH confidence
- k6 PostgreSQL extension: https://github.com/gcfabri/xk6-pgxpool -- MEDIUM confidence
- pgbench documentation: https://www.postgresql.org/docs/current/pgbench.html -- HIGH confidence
- SvelteKit + Supabase local setup guide: https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp -- MEDIUM confidence (community source, patterns verified against official docs)
- Supabase multi-tenant RLS patterns: https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/ -- MEDIUM confidence (community source)
- Supabase custom access token hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook -- HIGH confidence

---

_Stack research for: Supabase Migration, OpenVAA v2.0_
_Researched: 2026-03-12_

# Pitfalls Research

**Domain:** Strapi v5 to Supabase migration with multi-tenant support for a SvelteKit 2 VAA monorepo
**Researched:** 2026-03-12
**Confidence:** HIGH (official Supabase docs, codebase analysis, multiple verified community sources)

---

## Critical Pitfalls

### Pitfall 1: RLS Policies Missing on New Tables

**What goes wrong:**
Every new table created via SQL Editor or migration files has RLS disabled by default. The table is fully accessible through Supabase's auto-generated REST API (PostgREST) to anyone with the anon key. In January 2025, 170+ apps built with AI coding tools were found to have exposed databases because developers forgot to enable RLS. 83% of exposed Supabase databases involve RLS misconfigurations. This is the single most common Supabase security failure.

In OpenVAA's context, this means candidate personal data (emails, identifiers, registration keys), answer data, and organization-scoped election data could all be publicly accessible if a single migration forgets `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

**Why it happens:**
- Developers create tables iteratively during schema design, adding RLS "later"
- SQL migrations are written focusing on schema structure, not access control
- The `storage.objects` table already has RLS enabled by default, but custom tables in the `public` schema do not
- When copying table definitions from Strapi schemas (which have no RLS concept), the access control translation step is missed entirely

**How to avoid:**
- Adopt a strict convention: every `CREATE TABLE` migration MUST include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and at least one policy in the same migration file. Never split table creation and RLS into separate migrations.
- Create a migration template that includes RLS boilerplate by default:
  ```sql
  CREATE TABLE public.my_table (...);
  ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
  -- Deny all by default; explicit policies grant access
  ```
- Use Supabase's built-in Security Advisor (Splinter linter) to scan for tables with RLS disabled. The advisor checks for three specific conditions: `0007` (policy exists but RLS disabled), `0008` (RLS enabled but no policies), and `0013` (RLS disabled in public schema).
- Add a CI check that runs `supabase db lint` and fails on any RLS-related warnings before merging migration PRs.
- After every `supabase db push` or deployment, verify RLS status in the Supabase dashboard under Database > Security Advisor.

**Warning signs:**
- Migration files that contain `CREATE TABLE` without a corresponding `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Supabase dashboard showing yellow warnings on the Security Advisor page
- API calls returning data without authentication headers (test with `curl` using only the anon key)
- Any table that "works fine" during development without explicit policies

**Phase to address:** Phase 1 (Schema Design) -- establish convention and template before the first table is created

---

### Pitfall 2: RLS Policy Performance Degradation at Scale

**What goes wrong:**
RLS policies execute as additional WHERE clauses on every query. Naive policies can cause 100x+ performance degradation on tables with thousands of rows. The most critical performance killers:

1. **Missing indexes on policy columns**: A policy like `auth.uid() = user_id` without an index on `user_id` forces full table scans. Supabase testing showed improvement from 171ms to ~0.1ms just by adding a btree index.
2. **Per-row function evaluation**: `auth.uid()` and custom functions like `get_tenant_id()` execute once per row evaluated, not once per query. On a table with 10,000 candidate answers, that means 10,000 function calls.
3. **Inefficient join patterns**: `auth.uid() IN (SELECT user_id FROM team_user WHERE team_user.team_id = table.team_id)` evaluates the subquery for every row. The correct pattern reverses it: `team_id IN (SELECT team_id FROM team_user WHERE user_id = auth.uid())`.

For OpenVAA specifically, the candidate answers table and nominations table will be queried heavily during election periods (potentially thousands of concurrent voters requesting matching results). A slow RLS policy on these tables will bottleneck the entire voter experience.

**Why it happens:**
- RLS policies are written to be logically correct without considering execution plans
- Multi-tenant RLS (`organization_id = get_current_org()`) on every table seems simple but multiplies overhead
- Developers test with small datasets (10 candidates) where performance issues are invisible
- The load testing phase is scheduled after schema design -- by then, changing RLS policies means changing the security model

**How to avoid:**
- Always wrap function calls in SELECT to enable PostgreSQL's initPlan caching: `(SELECT auth.uid())` instead of `auth.uid()`. This caches the result per-statement instead of evaluating per-row.
- Add btree indexes on every column referenced in an RLS policy. This is non-negotiable.
- Use `SECURITY DEFINER` functions for complex permission checks that involve joining multiple tables. This lets the function bypass RLS on the joined tables (running as the function creator) while still enforcing RLS on the target table.
- Add `TO authenticated` (or appropriate role) to every policy to skip evaluation entirely for anonymous/non-matching roles.
- Structure load tests specifically to measure query performance WITH RLS enabled, not just raw query performance. The load testing phase must test realistic query patterns against realistic data volumes.
- Use `EXPLAIN ANALYZE` on queries against tables with RLS to verify the execution plan includes index scans, not sequential scans.

**Warning signs:**
- Queries that take >100ms on tables with fewer than 10,000 rows
- `EXPLAIN ANALYZE` showing "Seq Scan" on tables with RLS policies
- Load tests showing dramatically different performance between queries with `service_role` key (bypasses RLS) and `anon` key (evaluates RLS)
- Policy definitions that reference columns from other tables without wrapping the subquery pattern correctly

**Phase to address:** Phase 1 (Schema Design) for index creation alongside policies; Phase 3 (Load Testing) for validation

---

### Pitfall 3: Multi-Tenant Isolation Leaks with RLS-Based Tenancy

**What goes wrong:**
OpenVAA is adding multi-tenant support (shared infrastructure, data isolated by organization) where it did not exist before. With the RLS-per-tenant approach (shared tables with `organization_id` column), a single misconfigured policy allows Tenant A to read or modify Tenant B's data. This is not a hypothetical -- it is the primary failure mode of RLS-based multi-tenancy.

Specific leak vectors in OpenVAA's context:
- A candidate updates their answers, but the mutation does not filter by `organization_id` -- the RLS INSERT policy checks `organization_id` on new rows, but the application passes the wrong org context
- An admin queries all candidates, and the RLS policy correctly filters by org, but a JOIN to the nominations table (which also needs tenant filtering) returns cross-tenant nominations because the nominations table policy was missed
- JWT custom claims store `organization_id`, but the claim is stale (user was removed from org, token is valid for up to 1 hour)

**Why it happens:**
- Adding multi-tenancy to a system that was single-tenant means every existing query pattern needs tenant context added. It is easy to miss one.
- RLS policies on related tables must all agree on the tenant filter. If `candidates` filters by org but `nominations` does not, a JOIN leaks data.
- JWT-based tenant identification has a 1-hour cache window -- changes to user-org associations are not reflected until token refresh.
- The "schema-per-tenant" alternative avoids these leaks but creates different problems: Supabase's PostgREST and Realtime are primarily designed for the `public` schema. Schema changes must be applied to N schemas manually. Cross-schema foreign key constraints should be avoided. There is no built-in way to dynamically expose new schemas when new tenants sign up.

**How to avoid:**
- Use RLS-per-tenant with `organization_id` on every tenant-scoped table (the right choice for OpenVAA given the need for both single-tenant and multi-tenant deployment). Do NOT use schema-per-tenant.
- Store `organization_id` in `auth.users.raw_app_meta_data` (not `user_metadata`, which users can modify). Use a Custom Access Token Hook to include it in the JWT.
- Create a helper function `get_org_id()` that extracts the organization ID from the JWT: `((SELECT current_setting('request.jwt.claims', true)::json->>'app_metadata')::json->>'organization_id')::uuid`. Wrap in `(SELECT ...)` for caching.
- Write integration tests that specifically verify tenant isolation: create data as Tenant A, attempt to read as Tenant B, assert zero results. Automate these tests.
- For single-tenant deployments, set a default organization_id so the same schema works without multi-tenant configuration (the RLS policies still run but always match the single org).
- Document that organization membership changes take up to 1 hour to propagate due to JWT caching. For immediate revocation, implement a database-level check (lookup table) as a defense-in-depth measure, accepting the performance cost on critical operations.

**Warning signs:**
- Tables in the schema that do not have an `organization_id` column but contain tenant-specific data
- RLS policies that reference `auth.uid()` but not `organization_id` on tenant-scoped tables
- Tests that only verify "user can see their own data" but never verify "user cannot see other tenant's data"
- Any query pattern that uses `service_role` key to "simplify" multi-tenant logic (bypasses all RLS)

**Phase to address:** Phase 1 (Schema Design) for column and policy design; Phase 2 (Auth) for JWT claims setup; Phase 4 (Integration Testing) for isolation verification

---

### Pitfall 4: Supabase Auth Cannot Natively Integrate Signicat/Bank OIDC

**What goes wrong:**
OpenVAA currently uses Signicat for bank authentication via a custom OIDC flow (authorization code + PKCE). The frontend exchanges an authorization code for an ID token, stores it in an httpOnly cookie, and uses the ID token claims to verify candidate identity during preregistration. Supabase Auth has a fixed list of built-in OAuth providers (Google, GitHub, Apple, etc.) and does NOT support arbitrary custom OIDC providers in the dashboard as of early 2026. The "generic OIDC provider" feature has been in discussion since 2022 (GitHub Discussion #6547) and Supabase plans to add it, but it is not production-ready.

This means you cannot simply "switch on" Signicat in Supabase Auth settings. The bank authentication flow requires custom implementation.

**Why it happens:**
- Developers assume "Supabase Auth supports OIDC" means any OIDC provider works out of the box. It does not -- it supports specific pre-configured providers.
- Supabase's Third-Party Auth feature allows trusting external JWTs, but this is for Supabase APIs to trust tokens from another auth system, not for Supabase Auth to act as an OIDC client.
- The existing OpenVAA flow handles the OIDC exchange server-side in SvelteKit (at `/api/oidc/token`) and stores the ID token in a cookie. This is independent of Strapi's auth system and can survive the migration -- but it must be explicitly preserved, not replaced.

**How to avoid:**
- Keep the bank authentication (Signicat OIDC) flow in SvelteKit server routes, exactly as it works today. The `/api/oidc/token` endpoint exchanges the authorization code for an ID token and stores it in a cookie. This is already backend-agnostic.
- After bank auth verifies candidate identity, use Supabase Auth for session management: create a Supabase user via `supabase.auth.admin.createUser()` or use `signInWithIdToken()` if the Signicat JWT meets Supabase's third-party auth requirements (asymmetric signing with JWKS endpoint -- Signicat does provide this).
- If using `signInWithIdToken()`, configure Supabase Third-Party Auth to trust Signicat's JWKS endpoint. The JWT must use asymmetric signing (RS256) and include a `kid` header. Verify Signicat's token format meets these requirements before committing to this approach.
- If `signInWithIdToken()` does not work due to Signicat's encrypted JWTs (the current flow uses JWE with decryption keys), implement a SvelteKit server route that decrypts the Signicat token, verifies claims, and creates/signs in the Supabase user server-side using the admin API.
- Do NOT attempt to make Supabase Auth "handle" the entire Signicat flow. The decryption step (`IDENTITY_PROVIDER_DECRYPTION_JWKS` in .env) is a custom requirement that no standard OAuth library handles automatically.

**Warning signs:**
- Plans that say "migrate bank auth to Supabase Auth" without specifying the exact mechanism
- Removing the `/api/oidc/token` SvelteKit route before the replacement is working
- Assuming Supabase's built-in providers list will "add generic OIDC support soon"
- Any approach that requires the service_role key in the browser to create users after bank auth

**Phase to address:** Phase 2 (Authentication Migration) -- this is the highest-risk auth migration item

---

### Pitfall 5: JSONB Answer Storage Creating Query and Index Nightmares

**What goes wrong:**
OpenVAA currently stores candidate answers as a JSON column on the candidate table (`"answers": { "type": "json" }`). The same pattern exists for party answers. This works in Strapi because answers are loaded as a blob and processed client-side by the matching algorithm. But in Supabase, if you put answers in a JSONB column:

1. **GIN index limitations**: GIN indexes on JSONB only support Bitmap Index Scans (not Index Scan or Index Only Scan). Complex predicates fall back to sequential scans. The `jsonb_path_ops` operator class supports fewer operators than `jsonb_ops`.
2. **Write amplification**: Updating a single answer in a JSONB column rewrites the entire JSONB value. GIN indexes on the column must then re-index the entire document, not just the changed key. Frequent updates (candidates answering questions one at a time) create massive write overhead and index bloat.
3. **RLS + JSONB compound cost**: RLS policies execute per-row. If the policy needs to inspect the JSONB column (e.g., filtering by a value inside the JSON), the cost compounds -- each row evaluation does a JSONB parse.
4. **Supabase Studio becomes unusable**: Heavy JSONB columns with thousands of rows cause Supabase Studio to freeze (documented issue #28361), making admin operations impossible.

The relational alternative (separate `candidate_answers` table with `candidate_id`, `question_id`, `value` columns) avoids all of these issues and enables proper indexing, partial updates, and clean RLS.

**Why it happens:**
- JSONB feels simpler: one column instead of a join table. The existing Strapi schema uses JSON, so "just keep it" is the path of least resistance.
- The matching algorithm loads all answers for all candidates at once, making a single JSONB blob seem efficient (one row read vs. many join-table reads).
- Developers underestimate write frequency during the candidate data collection period, when hundreds of candidates are simultaneously filling in answers.

**How to avoid:**
- Use the relational approach (`candidate_answers` table) as the default. The load testing phase exists specifically to validate this decision -- but start with relational because it is strictly more flexible.
- If load testing shows the bulk-read pattern (matching algorithm needs all answers) is significantly faster with JSONB, consider a hybrid: relational `candidate_answers` for writes and individual queries, plus a materialized JSONB column on the candidate table that is refreshed periodically for bulk reads.
- Never store individual answer updates by rewriting the entire JSONB blob. If you must use JSONB, use `jsonb_set()` for partial updates and ensure the column has a GIN index with `jsonb_path_ops` (smaller, faster than default `jsonb_ops`).
- Test both approaches under realistic load during Phase 3 (Load Testing) with the actual matching algorithm query patterns, not synthetic benchmarks.

**Warning signs:**
- Schema design that puts `answers JSONB` on the candidates table "because that is how Strapi had it"
- No separate candidate_answers table in the migration
- Write latency increasing as more candidates fill in answers
- `EXPLAIN ANALYZE` showing sequential scans on the candidate table when filtering or joining by answers

**Phase to address:** Phase 1 (Schema Design) for initial design; Phase 3 (Load Testing) for validation and final decision

---

### Pitfall 6: Service Role Key Leaking to the Browser

**What goes wrong:**
The Supabase `service_role` key bypasses ALL Row Level Security. If exposed in client-side code, any user can read, modify, or delete any data in the database. A 2025/2026 scan of 20,000+ apps found 11% expose Supabase credentials in their frontend, often because AI coding assistants or tutorials use the service_role key for convenience.

In OpenVAA's context, the service_role key would be needed for:
- Creating Supabase users during candidate preregistration (admin operation)
- Sending emails via Supabase's auth hooks
- Administrative data operations (import/export)

If any of these operations are accidentally triggered from client-side code with the service_role key bundled in, the entire database is compromised.

**Why it happens:**
- SvelteKit blurs the server/client boundary. A `+page.svelte` file can import from `+page.server.ts` load functions, but environment variables prefixed with `PUBLIC_` are client-accessible while non-prefixed variables are server-only. Mixing up which Supabase client to use (anon vs. service_role) in the wrong context exposes the key.
- During development, using the service_role key "just works" without needing RLS policies, creating a habit.
- The preregistration flow (currently using `BACKEND_API_TOKEN` for Strapi) needs an equivalent server-side privileged operation in Supabase -- the temptation is to use the service_role key in a way that leaks.

**How to avoid:**
- Never store the service_role key in any environment variable prefixed with `PUBLIC_`. In SvelteKit, only `$env/static/private` and `$env/dynamic/private` are safe for the service_role key.
- Create the service_role Supabase client ONLY in server-side code: `+page.server.ts`, `+server.ts` (API routes), `hooks.server.ts`, or server-side load functions. Never in `+page.svelte`, `+layout.svelte`, or any `$lib` module that could be imported client-side.
- Use Supabase's new API key model (if available): `sb_publishable_...` for client, `sb_secret_...` for server. Projects created after November 2025 use this model.
- Audit imports: if `SUPABASE_SERVICE_ROLE_KEY` appears in any file that is not explicitly server-only, it is a security vulnerability.

**Warning signs:**
- `SUPABASE_SERVICE_ROLE_KEY` or `service_role` appearing in browser network requests (check DevTools)
- Environment variable named `PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (the `PUBLIC_` prefix exposes it)
- Service role client created in a shared module (`$lib/supabase.ts`) instead of a server-only module (`$lib/server/supabase.ts`)
- Operations that "work without RLS policies" during development

**Phase to address:** Phase 1 (Infrastructure Setup) -- establish client initialization patterns before any feature code is written

---

### Pitfall 7: SvelteKit + Supabase SSR Auth Cookie/Hydration Mismatches

**What goes wrong:**
Supabase SSR auth uses cookies to maintain sessions across server and client. In SvelteKit, this requires careful coordination between `hooks.server.ts`, layout load functions, and client-side auth state. Common failure modes:

1. **Stale session on tab switching**: User logs out in Tab A, Tab B still shows logged-in state because the client-side auth state was not invalidated. The cookie is cleared but the nav bar does not update on client-side navigation.
2. **getSession() vs getUser() mismatch**: `supabase.auth.getSession()` returns cached session data from cookies, but Supabase logs warnings if you use the `user` object from `getSession()` directly. You must call `supabase.auth.getUser()` to get a validated user object.
3. **Cookie configuration errors**: The `@supabase/ssr` package requires `getAll` and `setAll` methods on the cookies configuration. Getting these wrong produces silent failures -- auth appears to work but sessions are not persisted.
4. **Server/client client confusion**: Creating the Supabase client incorrectly (e.g., using `createBrowserClient` on the server or vice versa) causes hydration mismatches where the server renders one state and the client renders another.

**Why it happens:**
- SvelteKit 2's cookie handling changed from SvelteKit 1, and some Supabase tutorials are outdated
- The `@supabase/auth-helpers` package is deprecated in favor of `@supabase/ssr`, but old examples still circulate
- The boundary between server-side rendering and client-side hydration in SvelteKit is subtle, and auth state must be consistent across both

**How to avoid:**
- Follow the official Supabase SvelteKit SSR guide exactly. Key files to configure:
  - `src/hooks.server.ts`: Create server client with `createServerClient`, refresh session, pass session to `event.locals`
  - `src/routes/+layout.server.ts`: Return session from `event.locals.safeGetSession()`
  - `src/routes/+layout.ts`: Create browser client with `createBrowserClient` or server client for SSR, listen to `onAuthStateChange`
- Always validate the user with `supabase.auth.getUser()` in server-side code. Use `getSession()` only for checking if a session exists (not for extracting user data).
- Implement `onAuthStateChange` listener in the root layout to handle cross-tab auth changes and token refresh.
- Use `@supabase/ssr` (not `@supabase/auth-helpers-sveltekit`) -- the auth-helpers package is deprecated.
- Test auth flows explicitly: login in one tab, logout in another, verify both tabs reflect the correct state.

**Warning signs:**
- Console warnings about "Using supabase.auth.getSession() to get user information is not recommended"
- Auth state that works on initial page load but breaks on client-side navigation
- Users remaining "logged in" after logout until a full page refresh
- Different auth states between server-rendered HTML and client-hydrated DOM (visible as a flash of content)

**Phase to address:** Phase 2 (Authentication Migration) -- implement as the first auth task, before candidate or admin auth flows

---

## Moderate Pitfalls

### Pitfall 8: Supabase Local Dev CLI Migration Ordering and Sync Issues

**What goes wrong:**
Supabase CLI manages migrations as sequentially-applied SQL files with timestamps. Common issues:
- Migrations created out of timestamp order cause application failures on `supabase db reset`
- `supabase db reset` has a documented bug where the latest migration can be ignored (CLI issue #3723, reported June 2025)
- Migration history mismatch between local and remote databases produces "not in sync" errors that block deployment
- `supabase db pull` from remote may not detect storage RLS policies (CLI issue #3919)
- Multiple developers creating migrations simultaneously can produce conflicting timestamps

For a team working on the migration, these issues waste significant time during development and risk data loss during deployment.

**Why it happens:**
- The Supabase CLI is evolving rapidly, with frequent version updates that can change behavior
- Developers create migrations locally, and when rebasing or merging, timestamp ordering can break
- The migration history table (`supabase_migrations.schema_migrations`) can drift from the actual filesystem state

**How to avoid:**
- Pin the Supabase CLI version in the project (`package.json` or CI config). Keep all team members on the same version. Update deliberately, not automatically.
- Use a naming convention for migration files: `YYYYMMDDHHMMSS_descriptive_name.sql`. Never manually rename timestamps.
- After merging branches that both added migrations, verify migration ordering with `ls -la supabase/migrations/` and ensure timestamps are sequential.
- Use `supabase migration repair` to fix history mismatches instead of manual database edits.
- For complete resets during development, `supabase db reset` is the canonical approach. If it misbehaves, use `supabase stop && supabase start` for a fresh local instance.
- Commit seed data as SQL in `supabase/seed.sql`. Seeds run after all migrations on `supabase start` (first time) and `supabase db reset`. Only include INSERT statements in seeds, never schema changes.
- Storage bucket RLS policies must be managed separately (create them in migrations explicitly, do not rely on `supabase db pull` to detect them).

**Warning signs:**
- `supabase db push` failing with "migration history not in sync" errors
- Different team members getting different local database states
- Seed data failing because it references tables that do not exist yet (migration ordering issue)
- `supabase db diff` returning "no schema changes found" when changes were clearly made in the dashboard

**Phase to address:** Phase 1 (Infrastructure Setup) -- establish migration workflow before the first migration is written

---

### Pitfall 9: Supabase Storage Policy Mismatch with Existing S3 Workflow

**What goes wrong:**
OpenVAA currently uses AWS S3 for media uploads (candidate photos, party images) via Strapi's upload plugin. Migrating to Supabase Storage introduces several gotchas:

1. **Public bucket does not mean public uploads**: Setting a Supabase Storage bucket to "public" only allows unauthenticated downloads. Uploads are always blocked without an RLS policy on `storage.objects`.
2. **RLS already enabled**: Unlike custom tables, `storage.objects` has RLS enabled by default. You do not need `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` -- doing so is a no-op but confusing.
3. **Cannot modify storage schema**: Platform permission changes in April 2025 restricted `ALTER TABLE` on storage tables. You can only create RLS policies and triggers, not modify the table structure.
4. **Migration detection failures**: Storage RLS policies are not reliably detected by `supabase db pull` or `supabase db diff`, meaning your migration files may be incomplete.
5. **No S3 versioning**: Supabase Storage does not support object versioning. Deleted objects are permanently removed. If the migration script fails midway, deleted S3 objects cannot be recovered from Supabase.
6. **File path structure**: Supabase Storage organizes files by bucket/folder/filename. Strapi's S3 uploads may use different path conventions that need mapping.

**Why it happens:**
- Developers assume Supabase Storage works like S3 with a different API. The access control model is fundamentally different (RLS on a Postgres table vs. S3 bucket policies).
- Storage migration is often treated as a simple "copy files from S3 to Supabase Storage" task, but the access control migration is where the complexity lies.

**How to avoid:**
- Supabase Storage is S3-compatible, so existing S3 client libraries can interact with it. Use this for the data migration itself (copying files).
- Create storage RLS policies in migration files explicitly. Do not rely on the dashboard UI for policies -- they need to be version-controlled.
- For candidate photo uploads: create a policy allowing authenticated users to upload to their own folder (`storage.foldername(name)[1] = auth.uid()::text`), and a public read policy for all images.
- Test storage policies locally before deploying. Note that `supabase db diff` may not detect storage policy changes -- verify manually.
- Keep S3 as a backup during migration. Do not delete S3 data until Supabase Storage is verified working in production.
- For multi-tenant storage, organize buckets or folders by organization_id and add tenant-scoping to storage RLS policies.

**Warning signs:**
- Candidate photo uploads returning 403 errors despite the user being authenticated
- Storage policies created in the dashboard but not present in migration files (will be lost on next `supabase db reset`)
- Migration scripts that copy files but do not set up access control policies
- `supabase db pull` output that does not include any `storage` schema policies

**Phase to address:** Phase 5 (Storage Integration) -- but plan the access control model during Phase 1 (Schema Design)

---

### Pitfall 10: Application Settings Migration Losing Strapi's Component Nesting

**What goes wrong:**
OpenVAA's `app-setting` content type in Strapi uses deeply nested Strapi components (`settings.header`, `settings.matching`, `settings.survey`, `settings.entity-details`, etc.) to organize application configuration. Each component has its own schema with typed fields. When migrating to Supabase, naively converting this to a single JSONB column loses the validation, typing, and query capability of the nested structure. Conversely, normalizing every component into its own table creates an explosion of small tables with 1:1 relationships that are awkward to query.

**Why it happens:**
- Strapi's "component" concept has no direct equivalent in raw PostgreSQL
- The settings are a single-type (singleton), so the instinct is to use a single row with a large JSONB column
- The nested settings rarely change after initial configuration, making JSONB seem "good enough"

**How to avoid:**
- Store application settings as a single JSONB column in a `settings` table, with validation at the application layer (TypeScript types). This is acceptable because:
  - Settings are a singleton (one row per organization in multi-tenant)
  - Settings are read-heavy, write-rare (admin changes configuration, voters/candidates read it)
  - Settings do not need individual field indexing or querying
  - The existing `DynamicSettings` type in `app-shared` already validates the structure at the application layer
- Add a JSON Schema constraint on the column for database-level validation if needed (`ALTER TABLE settings ADD CONSTRAINT settings_valid CHECK (jsonb_matches_schema(schema, value))`).
- For multi-tenant, add `organization_id` to the settings table and an RLS policy filtering by org.
- Document the settings schema in a TypeScript type that serves as the source of truth, with migration scripts that insert default settings matching the type.

**Warning signs:**
- Settings table with 20+ columns mirroring every field from the Strapi component structure
- Settings JSONB column with no TypeScript type or JSON Schema validation
- Frontend code that expects specific Strapi component structure (`.data.attributes.header.publisherName`) instead of flat field access

**Phase to address:** Phase 4 (Application Settings Migration)

---

### Pitfall 11: Email Testing Silently Failing in Local Development

**What goes wrong:**
Supabase local development uses Mailpit (formerly InBucket) to capture emails, accessible at `http://localhost:54324`. Common failures:

1. **Auth confirmation emails not appearing**: If `enable_confirmations` is set to `false` in `config.toml`, no confirmation emails are sent. The user is auto-confirmed, which masks the email flow entirely. When deployed to production with confirmations enabled, the flow breaks.
2. **Custom SMTP not supported locally**: The Supabase CLI does not support custom SMTP for local development. Auth emails always go through Mailpit, even if you configure an SMTP provider. This means you cannot test real email delivery locally.
3. **resend() not working**: The `auth.resend()` function has been reported to silently fail to send to Mailpit in certain configurations, with no error on the client or in logs.
4. **Email templates differ**: Local email templates are configured in `config.toml` (using `content_path`), while production templates are configured in the Supabase dashboard. Template differences between environments cause unexpected behavior.
5. **Port confusion**: Mailpit runs on port 54324 by default, but this can be changed in `config.toml`. Hardcoding the port in test code or scripts breaks when the configuration changes.

For OpenVAA, email is critical for candidate registration (registration key emails) and password reset flows. If email testing silently fails, these flows are untested until production.

**Why it happens:**
- Email is often the last thing tested and the first thing to break
- The split between local (Mailpit) and production (real SMTP) configurations means the dev environment is never truly representative
- Silent failures (no error, just no email) make debugging extremely difficult

**How to avoid:**
- Enable `enable_confirmations = true` in `config.toml` for local development to match production behavior. Handle the confirmation step in E2E tests by reading from the Mailpit API.
- Use Mailpit's HTTP API (`http://localhost:54324/api/v1/messages`) in integration tests to verify email delivery programmatically, replacing the existing LocalStack SES polling pattern.
- Pin all Mailpit-related configuration in `config.toml` (port, enable_confirmations, email templates) and document it.
- Create a helper function for tests that polls Mailpit for emails and extracts confirmation links, similar to the existing `candidateApp-advanced.spec.ts` pattern but adapted for Supabase.
- Keep email template files in the repository (referenced by `config.toml` `content_path`) so they are version-controlled and consistent across developer machines.

**Warning signs:**
- E2E tests that skip email verification steps locally but fail in staging
- Registration flow tests that "work" because confirmations are disabled locally
- No Mailpit URL or API calls in any test or development documentation
- Different email template content between local `config.toml` and production dashboard

**Phase to address:** Phase 2 (Authentication Migration) for auth emails; Phase 5 (Email Integration) for transactional emails

---

### Pitfall 12: Candidate Registration Flow Has No Direct Supabase Equivalent

**What goes wrong:**
OpenVAA's current candidate registration is a multi-step flow unique to VAA applications:
1. Admin pre-registers candidates via API with name, identifier, email, and nominations
2. System generates a `registrationKey` and sends an email with it
3. Candidate visits the registration URL with their key
4. System validates the key, shows the candidate's info
5. Candidate sets a password, creating a User linked to their Candidate record

This flow has no equivalent in Supabase Auth's built-in flows (magic link, password signup, OAuth). Supabase Auth's `signUp()` creates a user immediately -- there is no concept of "pre-registered candidate waiting for activation with a key."

**Why it happens:**
- VAA candidate registration is a domain-specific workflow, not a standard auth pattern
- Supabase Auth is designed for self-service signup, not admin-initiated pre-registration
- The existing flow is tightly coupled to Strapi's `users-permissions` plugin and custom candidate controller

**How to avoid:**
- Implement the preregistration flow as a Supabase Edge Function or SvelteKit server route (not as a Supabase Auth flow):
  1. Admin calls server endpoint with candidate data + email template
  2. Server creates candidate record in `candidates` table (no auth user yet), generates registration key, stores it hashed
  3. Server sends registration email via Supabase's email service or external SMTP
  4. Candidate visits registration URL, submits key + password
  5. Server validates key, calls `supabase.auth.admin.createUser()` with the candidate's email and password, links the auth user ID to the candidate record
- Store the `registrationKey` hashed (not plaintext) in the candidates table. The current Strapi implementation stores it as a plaintext string field.
- Use Supabase Auth's `admin.createUser()` (requires service_role key, server-side only) rather than `signUp()` to avoid sending Supabase's default confirmation email (the registration email serves as confirmation).
- The candidate-user linking (`candidate.auth_user_id = user.id`) replaces Strapi's `candidate.user` relation.

**Warning signs:**
- Plans to use `supabase.auth.signUp()` for candidate registration (this would send a generic confirmation email, not the custom registration email)
- Registration keys stored as plaintext in the database
- Preregistration endpoint that requires the browser to have the service_role key
- Loss of the multi-step verification flow (key check -> display name -> set password)

**Phase to address:** Phase 2 (Authentication Migration) -- design and implement as a custom flow, not a standard Supabase Auth integration

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| JSONB for all multilingual text fields (`{"en": "...", "fi": "..."}`) | Simple schema, matches current Strapi pattern | Cannot index individual languages, cannot use PostgreSQL full-text search per locale, all languages loaded even when only one is needed | Acceptable for fields that are always loaded in all languages (settings, question text). Not acceptable for searchable content. |
| Using `service_role` key in Edge Functions for all operations | No need to write RLS policies | Bypasses all security, any Edge Function bug exposes entire database | Only for admin operations (preregistration, data import) that are genuinely privileged. Never for read operations that should respect RLS. |
| Single seed.sql for all environments | One file to maintain | Dev data in production, or production missing data needed for operation | Never -- use environment-aware seeding (check for existing data before inserting) |
| Skipping RLS policies during prototyping | Faster iteration | Forgetting to add them before production (the #1 Supabase security failure) | Only if `supabase db lint` runs in CI and blocks deployment without RLS |
| Storing organization_id in user_metadata instead of app_metadata | Easier to set (client-side accessible) | Users can modify their own user_metadata, potentially changing their organization assignment | Never -- always use app_metadata for authorization-relevant claims |
| One Supabase client for both server and browser | Less code | Service role key in browser, or browser client on server missing cookie context | Never -- always create separate server and browser clients |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SvelteKit `hooks.server.ts` + Supabase | Creating one global Supabase client | Create a new server client per request using `createServerClient` with the request's cookies |
| Supabase Auth + RLS policies | Using `auth.uid()` directly in policies (per-row evaluation) | Wrap in `(SELECT auth.uid())` for per-statement caching |
| Supabase Storage + candidate photos | Assuming "public bucket" = "public uploads" | Public buckets only allow downloads; uploads require explicit RLS policies on `storage.objects` |
| Supabase Edge Functions + service_role | Using service_role for all database operations | Use the user's JWT for operations that should respect RLS; only use service_role for admin ops |
| Supabase + existing adapter pattern | Rewriting the entire adapter layer at once | Implement `SupabaseDataProvider` behind the existing `UniversalAdapter` interface, swap in stages |
| Supabase migrations + storage policies | Relying on `supabase db pull` to capture storage policies | Write storage RLS policies in migration files manually; `db pull` misses them |
| Supabase Auth + JWT custom claims | Storing tenant ID in `user_metadata` | Use `app_metadata` (admin-only writable) via `auth.admin.updateUserById()` |
| Mailpit + E2E tests | Hardcoding `localhost:54324` in test code | Read the port from `config.toml` or environment variable |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| RLS policy without index on filter column | Queries >100ms on tables with >1000 rows | Add btree index on every column in RLS WHERE clauses | At ~5,000 rows (realistic candidate count for national elections) |
| Per-row `auth.uid()` calls in RLS | Query time scales linearly with table size | Wrap in `(SELECT auth.uid())` for initPlan caching | At ~1,000 rows with multiple policies |
| JSONB full-document writes for single answer updates | Write latency spikes, GIN index bloat, increasing disk usage | Use relational `candidate_answers` table or `jsonb_set()` for partial updates | At ~100 concurrent candidate writers |
| Loading all candidates with all answers for matching | Response time >5 seconds, memory pressure on server | Paginate, use database-side filtering, consider materialized views | At ~5,000 candidates with ~50 questions each |
| Multiple permissive RLS policies on same table | Supabase Security Advisor warning, unexpected data access from policy OR combination | Combine into fewer policies using CASE expressions or helper functions | Immediately -- any two permissive policies are OR'd, not AND'd |
| Realtime subscriptions without proper filtering | All changes broadcast to all clients, high bandwidth | Use Realtime filters and channel-based subscriptions | At ~100 concurrent users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `service_role` key in `PUBLIC_` env var or client bundle | Complete database compromise -- all RLS bypassed | Store only in `$env/static/private`; audit all imports |
| `organization_id` in `user_metadata` (client-writable) | Tenant impersonation -- user changes their org assignment | Use `app_metadata` (admin-only writable) |
| Multiple permissive RLS policies creating unintended OR | Data from one policy "leaking" through another policy's conditions | Audit policies with Security Advisor; use restrictive policies for defense-in-depth |
| Trusting `getSession()` user object without `getUser()` validation | Session could be tampered with from cookies | Always call `getUser()` for server-side authorization decisions |
| Registration keys stored as plaintext in candidates table | Key theft from database dump allows unauthorized registration | Hash registration keys before storage; compare hashes during validation |
| No rate limiting on preregistration endpoint | Enumeration attack to discover valid registration keys | Implement rate limiting on the preregistration and registration API routes |

---

## "Looks Done But Isn't" Checklist

- [ ] **RLS on all tables:** Every table has `ENABLE ROW LEVEL SECURITY` -- verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] **RLS policies on all tables:** Every table with RLS enabled has at least one policy -- verify with Security Advisor lint `0008`
- [ ] **Multi-tenant isolation:** Create test data for Org A, authenticate as Org B user, verify zero results from all tenant-scoped tables
- [ ] **Cookie auth working:** Login, navigate with client-side routing, refresh the page -- auth state persists across all three scenarios
- [ ] **Service role key server-only:** Search entire frontend codebase for `service_role` or `SUPABASE_SERVICE_ROLE_KEY` -- should only appear in `+server.ts`, `+page.server.ts`, `hooks.server.ts`, or `$lib/server/` files
- [ ] **Storage upload works:** Authenticated candidate can upload a photo; unauthenticated user can view it; other candidates cannot overwrite it
- [ ] **Email delivery works:** Registration email appears in Mailpit locally; confirmation links work; password reset email appears
- [ ] **Seed data is environment-aware:** `supabase db reset` locally produces a working dev environment; production migration does not insert dev data
- [ ] **Migration ordering:** `supabase db reset` runs all migrations without errors on a fresh local instance
- [ ] **Bank auth still works:** Signicat OIDC flow completes end-to-end (may require sandbox testing)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing RLS on production table | LOW-MEDIUM | Enable RLS immediately (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), add policies. Data may have been exposed -- assess impact and notify if needed. |
| Service role key exposed in client | HIGH | Rotate the key immediately in Supabase dashboard, audit all client code, check access logs for unauthorized operations |
| Tenant isolation leak | HIGH | Fix the policy, audit cross-tenant data access in logs, notify affected tenants, verify no data modification occurred |
| JSONB answer performance bottleneck | MEDIUM-HIGH | Migrate to relational table. Requires new migration, data transform script, adapter code changes, and load test re-validation |
| Migration history out of sync | LOW-MEDIUM | Use `supabase migration repair` to reconcile, or create a baseline migration from current state with `supabase db dump` |
| Auth cookie/hydration mismatch | LOW | Follow official SvelteKit SSR guide step-by-step, ensure `onAuthStateChange` listener is in root layout |
| Registration flow broken after migration | MEDIUM | The existing SvelteKit OIDC route is backend-agnostic -- fall back to it while fixing the Supabase-integrated flow |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing RLS on new tables | Phase 1 (Schema Design) | `supabase db lint` returns zero RLS warnings; Security Advisor clean |
| RLS performance degradation | Phase 1 (Schema) + Phase 3 (Load Test) | Load test with RLS shows <50ms p95 for voter queries |
| Multi-tenant isolation leaks | Phase 1 (Schema) + Phase 4 (Integration Tests) | Cross-tenant data access tests all return zero results |
| Signicat OIDC integration | Phase 2 (Auth Migration) | Bank auth flow completes end-to-end in sandbox environment |
| JSONB answer storage traps | Phase 1 (Schema) + Phase 3 (Load Test) | Load test validates chosen approach under realistic data volume |
| Service role key exposure | Phase 1 (Infrastructure) | Grep for service_role in non-server files returns zero matches |
| SSR cookie/hydration mismatches | Phase 2 (Auth Migration) | Login/logout/refresh/multi-tab all maintain correct auth state |
| CLI migration ordering | Phase 1 (Infrastructure) | `supabase db reset` succeeds from clean state on every CI run |
| Storage policy mismatches | Phase 5 (Storage) | Candidate photo upload + public read + ownership protection all work |
| Settings migration structure | Phase 4 (Settings) | Settings load correctly for both single-tenant and multi-tenant |
| Email testing failures | Phase 2 (Auth) + Phase 5 (Email) | Registration email visible in Mailpit; confirmation link works |
| Candidate registration flow | Phase 2 (Auth Migration) | Pre-register, receive email, register with key, login -- all work |

---

## Sources

- [Supabase RLS Troubleshooting: Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- HIGH confidence (official docs)
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence (official docs)
- [Supabase Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors?lint=0006_multiple_permissive_policies) -- HIGH confidence (official docs)
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys) -- HIGH confidence (official docs)
- [Supabase SvelteKit SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/sveltekit) -- HIGH confidence (official docs)
- [Supabase Third-Party Auth Documentation](https://supabase.com/docs/guides/auth/third-party/overview) -- HIGH confidence (official docs)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- HIGH confidence (official docs)
- [Supabase Custom Claims and RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) -- HIGH confidence (official docs)
- [Supabase Local Development Overview](https://supabase.com/docs/guides/local-development/overview) -- HIGH confidence (official docs)
- [Supabase Seeding Documentation](https://supabase.com/docs/guides/local-development/seeding-your-database) -- HIGH confidence (official docs)
- [Supabase Managing JSON and Unstructured Data](https://supabase.com/docs/guides/database/json) -- HIGH confidence (official docs)
- [Supabase Storage Buckets Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- HIGH confidence (official docs)
- [Supabase Security Flaw: 170+ Apps Exposed](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) -- MEDIUM confidence (security report, Jan 2025)
- [SupaExplorer Cybersecurity Insight Report](https://supaexplorer.com/cybersecurity-insight-report-january-2026) -- MEDIUM confidence (January 2026 scan data)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- MEDIUM confidence (community article, verified against official patterns)
- [Efficient Multi-Tenancy with Supabase](https://arda.beyazoglu.com/supabase-multi-tenancy) -- MEDIUM confidence (community article)
- [Signing in with a Generic OAuth2/OIDC Provider (Discussion #6547)](https://github.com/orgs/supabase/discussions/6547) -- HIGH confidence (official GitHub discussion)
- [PostgreSQL JSONB Indexing Limitations with B-Tree and GIN](https://dev.to/mongodb/postgresql-jsonb-indexing-limitations-with-b-tree-and-gin-3851) -- MEDIUM confidence (technical article, verified against PostgreSQL docs)
- [PostgreSQL JSONB GIN Index Performance Analysis](https://pganalyze.com/blog/gin-index) -- HIGH confidence (pganalyze, verified against PostgreSQL docs)
- [Supabase CLI Migration Repair Discussions](https://github.com/supabase/supabase/issues/15695) -- HIGH confidence (official GitHub issue)
- [Supabase CLI db reset Issue #3723](https://github.com/supabase/cli/issues/3723) -- HIGH confidence (official GitHub issue, June 2025)
- [Supabase Storage Policies Not in db pull (CLI Issue #3919)](https://github.com/supabase/cli/issues/3919) -- HIGH confidence (official GitHub issue)
- [Supabase SSR Auth with SvelteKit (DEV Community)](https://dev.to/kvetoslavnovak/supabase-ssr-auth-48j4) -- MEDIUM confidence (community walkthrough, 2025)
- [SvelteKit Auth - A Nightmare (Discussion #13835)](https://github.com/orgs/supabase/discussions/13835) -- MEDIUM confidence (real developer pain points)
- OpenVAA codebase analysis: Strapi schemas, users-permissions extension, OIDC token endpoint, adapter pattern -- HIGH confidence (primary source)

---

*Pitfalls research for: Strapi v5 to Supabase migration with multi-tenant support -- OpenVAA VAA framework*
*Researched: 2026-03-12*

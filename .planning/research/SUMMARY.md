# Project Research Summary

**Project:** OpenVAA Supabase Migration (v2.0)
**Domain:** Backend migration from Strapi v5 to Supabase for a SvelteKit 2 VAA monorepo
**Researched:** 2026-03-12
**Confidence:** MEDIUM-HIGH (stack and pitfalls verified against official Supabase docs; architecture verified against codebase; features MEDIUM-HIGH due to some community sources)

## Executive Summary

OpenVAA is migrating its backend from Strapi v5 to Supabase while simultaneously adding multi-tenant support for the first time. The existing stack (Docker Compose with SvelteKit, Strapi, PostgreSQL 15, and LocalStack) is replaced by the Supabase CLI-managed local stack, which bundles PostgreSQL, GoTrue auth, PostgREST API, Storage, Mailpit email, and a Studio dashboard into a single `supabase start` command. The SvelteKit frontend, all shared packages (`@openvaa/core`, `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`), Playwright E2E tests, and the Yarn 4 monorepo structure remain completely unchanged. The migration delivers its value through the existing clean adapter abstraction: a new `SupabaseDataProvider` / `SupabaseDataWriter` / `SupabaseFeedbackWriter` is written behind the same `UniversalAdapter` interfaces the Strapi adapter already implements.

The recommended approach is incremental and phased: establish the Supabase infrastructure and schema first, then migrate authentication (the highest-risk area), then edge services (Storage and Edge Functions), then the frontend adapter layer, and finally remove Strapi. The schema design is the foundational decision — every content table needs `tenant_id`, JSONB locale columns, and RLS enabled before any other layer is built. Multi-tenancy is implemented via shared tables with a `tenant_id` column plus PostgreSQL Row Level Security, not schema-per-tenant. This is cheaper to operate, compatible with Supabase's PostgREST, and sufficient for the expected 10-50 tenant scale.

The primary risks are authentication complexity and the answer storage design decision. The candidate pre-registration flow (admin-initiated, multi-step, registration-key-based) has no native Supabase Auth equivalent and must be reimplemented as custom Edge Functions. Bank authentication via Signicat OIDC cannot use Supabase's built-in provider list and must be preserved in SvelteKit server routes. Answer storage is a contested design decision: the Features researcher recommends JSONB (matching existing patterns and the matching library's consumption format), while the Pitfalls researcher recommends relational by default (better write performance and indexing). This must be resolved by load testing before the frontend adapter is written. Both researchers agree that load testing infrastructure must be built before committing to either approach.

---

## Key Findings

### Recommended Stack

The migration replaces the Strapi backend entirely. The Supabase CLI (`supabase@^2.78.1`) is installed as a dev dependency in the monorepo root and manages all backend services locally. Two frontend packages are added: `@supabase/supabase-js@^2.99.1` for typed database queries, auth, and storage; and `@supabase/ssr@^0.9.0` for cookie-based session management in SvelteKit's SSR context. Database testing uses pgTAP (bundled with the CLI), which is the only tool that can properly test RLS policies in the actual security execution context. Load testing uses k6 (system binary, not npm) for API-level tests and pgbench (bundled with PostgreSQL) for raw query benchmarks — both are needed because they measure different layers of the stack.

**Core technologies:**
- `supabase` CLI `^2.78.1`: Local development orchestration, migrations, type generation, pgTAP test runner — single entry point replacing all backend Docker services
- `@supabase/supabase-js` `^2.99.1`: Typed API queries, auth session management, storage operations — replaces StrapiAdapterMixin's custom fetch wrapper
- `@supabase/ssr` `^0.9.0`: Cookie-based session bridging between SvelteKit SSR and browser — official replacement for deprecated `@supabase/auth-helpers-sveltekit`
- PostgreSQL 15 (via Supabase CLI): Same major version as current stack, zero version mismatch risk
- pgTAP (bundled): SQL-native RLS policy testing — cannot be replaced by Jest because Jest tests from outside bypass the PostgREST/GoTrue auth chain
- k6 + pgbench: Load testing the answer storage decision under realistic data volumes (10K candidates, 100 questions)
- Mailpit (bundled): Local email capture replacing LocalStack SES, accessible at port 54324 with a REST API for programmatic test assertions

**Remove from stack:** Strapi v5 and all `@strapi/*` packages, LocalStack, root docker-compose backend services, Adminer, `mailparser`, `cheerio`.

**Retain unchanged:** SvelteKit 2, all `@openvaa/*` packages, Playwright, Vitest, Yarn 4, Tailwind/DaisyUI, `sveltekit-i18n`, `zod`, `jose`, `@faker-js/faker`.

### Expected Features

**Must have (table stakes):**
- Database schema with `tenant_id` on every content table, JSONB locale columns, and RLS enabled on all tables — foundational, nothing else works without this
- Email/password login and password reset via Supabase Auth — direct `signInWithPassword` / `resetPasswordForEmail` replacement
- Candidate pre-registration invite flow — custom Edge Function replacing Strapi's `users-permissions` custom registration route; admin creates candidate record, generates invite link, sends custom email
- Role-based access (candidate / admin) via `raw_app_meta_data` — Supabase has no built-in role concept, roles must be stored in admin-writable metadata
- Bank auth (Signicat OIDC) — highest-complexity auth item; keep SvelteKit `/api/oidc/token` route unchanged, integrate with Supabase session after identity verification
- Supabase Storage bucket setup with RLS for candidate photos, party images, and public assets — replaces Strapi S3 plugin + LocalStack
- Frontend Supabase adapter (`SupabaseDataProvider` + `SupabaseDataWriter` + `SupabaseFeedbackWriter`) implementing the existing `UniversalAdapter` interfaces
- Transactional bulk import/delete via Postgres RPC functions — preserves the atomic guarantee of the current Strapi Admin Tools plugin
- App settings as a typed `app_settings` table (one row per tenant) with JSONB columns per section

**Should have (competitive):**
- pgTAP tests for all RLS policies (tenant isolation, candidate self-edit, public read)
- Cross-tenant isolation integration tests (create as Tenant A, verify zero results as Tenant B)
- Custom Access Token Hook to inject `tenant_id` into JWT at issuance, avoiding round-trips on every request
- Postgres `localized()` helper function for server-side locale extraction
- Image transformation URLs via Supabase Storage CDN (on-the-fly resizing — new capability not in Strapi)
- Supabase type generation script (`supabase gen types typescript --local`) wired into build pipeline
- `supabase db lint` in CI blocking deployment on RLS warnings

**Defer to v2+:**
- Supabase Realtime — no use case in voter app; candidate app notifications are a future enhancement
- Admin App UI migration — separate planned milestone; Supabase Studio is for developers, not election administrators
- GraphQL via pg_graphql — no benefit; frontend uses REST patterns via PostgREST
- Schema-per-tenant isolation — disproportionate operational overhead for 10-50 tenants

### Architecture Approach

The migration introduces no new architectural patterns to the frontend — it adds a fourth adapter alongside the existing Strapi, local JSON, and apiRoute adapters. The `SupabaseDataProvider` implements 7 abstract read methods; the `SupabaseDataWriter` implements 15+ abstract write/auth methods. The key structural change is in `hooks.server.ts`, which gains a per-request Supabase server client created via `createServerClient` from `@supabase/ssr`. The existing locale handling and route protection logic in `hooks.server.ts` is preserved and extended, not rewritten. On the backend side, the Supabase CLI manages all services. Migration files in `supabase/migrations/` replace Strapi's schema, and `supabase/seed.sql` replaces the `GENERATE_MOCK_DATA_ON_INITIALISE` mechanism.

**Major components:**
1. `supabase/` directory — Supabase project root: `config.toml`, `migrations/`, `seed.sql`, `tests/database/` (pgTAP), Edge Functions
2. `SupabaseDataProvider` / `SupabaseDataWriter` / `SupabaseFeedbackWriter` — frontend adapter layer in `frontend/src/lib/api/adapters/supabase/`
3. Supabase CLI managed stack — replaces the entire docker-compose backend (PostgreSQL, auth, API, storage, email, dashboard)
4. Edge Functions — custom server logic for pre-registration invite flow, custom email sending, bulk admin operations
5. RLS policies — replace Strapi's permission system entirely; every table has `ENABLE ROW LEVEL SECURITY` plus explicit policies
6. `load-tests/` directory — k6 + pgbench scripts for answer storage decision validation

### Critical Pitfalls

1. **RLS missing on new tables** — PostgreSQL tables have RLS disabled by default; PostgREST exposes them publicly to anyone with the anon key. Prevention: every `CREATE TABLE` migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` plus at least one policy in the same file. Add `supabase db lint` to CI blocking on lint codes `0007`, `0008`, `0013`.

2. **RLS performance degradation** — naive policies without indexes cause 100x+ slowdowns at realistic candidate counts. Prevention: B-tree index on every RLS-referenced column (especially `tenant_id`); wrap all JWT function calls as `(SELECT auth.uid())` for per-statement caching, not per-row evaluation.

3. **Multi-tenant isolation leaks** — a single misconfigured policy lets Tenant A read Tenant B's data. Prevention: `organization_id` stored in `raw_app_meta_data` (not `user_metadata`, which users can modify); Custom Access Token Hook injects it into JWT; automated cross-tenant tests assert zero results.

4. **Signicat OIDC cannot use Supabase's built-in provider list** — Supabase Auth does not support arbitrary OIDC providers as of early 2026. Prevention: keep the existing SvelteKit `/api/oidc/token` server route unchanged; use `supabase.auth.admin.createUser()` or `signInWithIdToken()` after identity verification. Do not attempt to route Signicat through Supabase Auth's OAuth provider system.

5. **Service role key leaking to the browser** — the service_role key bypasses all RLS. Prevention: never prefix it with `PUBLIC_`; create the service_role client only in `+server.ts`, `+page.server.ts`, `hooks.server.ts`, or `$lib/server/` modules; audit with grep before every deployment.

---

## Implications for Roadmap

Based on research, the dependency ordering is unambiguous: schema must precede RLS policies, RLS policies must precede the frontend adapter, auth must precede storage (storage RLS references `auth.uid()`), and load testing must resolve the answer storage decision before the adapter's `_setAnswers` and `_getEntityData` methods are finalized.

### Phase 1: Infrastructure and Schema Foundation

**Rationale:** Everything else depends on this. You cannot write RLS policies without tables, cannot write the frontend adapter without a verified schema, and cannot load test without data. Establishes the migration workflow conventions (migration template with RLS boilerplate, pinned CLI version, CI lint check) that all subsequent phases depend on.

**Delivers:** Supabase CLI initialized in monorepo, `supabase/config.toml` configured, all 15+ content tables created with `tenant_id`, JSONB locale columns, and RLS enabled, all indexes on RLS-referenced columns, `supabase db lint` in CI, seed data replacing `GENERATE_MOCK_DATA_ON_INITIALISE`.

**Addresses features:** Database schema, tenant isolation columns, JSONB locale columns, app settings table, migration tooling.

**Avoids:** RLS missing on tables (Pitfall 1), RLS performance degradation (Pitfall 2), CLI migration ordering issues (Pitfall 8).

**Research flag:** Standard patterns for table creation and RLS. The answer storage design (JSONB vs relational) is an OPEN DECISION — see section below. Both schema alternatives should be drafted in this phase to support Phase 3 load testing.

### Phase 2: Authentication Migration

**Rationale:** RLS policies reference `auth.uid()` and JWT claims. Auth must be configured and working before RLS policies can be validated or the frontend adapter can implement login flows. The pre-registration and Signicat flows are the highest-risk items in the entire migration and should be tackled early when there is maximum time to iterate.

**Delivers:** Supabase Auth configured (`config.toml` with email confirmations enabled), email/password login, password reset, custom pre-registration Edge Function (admin-initiated invite flow), candidate registration key validation and account creation, SvelteKit `hooks.server.ts` updated with per-request Supabase server client, Signicat OIDC bank auth preserved in SvelteKit server routes and integrated with Supabase session.

**Addresses features:** All authentication table stakes (login, password reset, pre-registration, bank auth, session management).

**Avoids:** SSR cookie/hydration mismatches (Pitfall 7), Signicat OIDC integration failure (Pitfall 4), candidate registration flow loss (Pitfall 12), email testing silent failures (Pitfall 11).

**Research flag:** Needs deeper research during planning. Signicat OIDC integration path (third-party auth vs. Edge Function) requires validating whether Signicat JWTs use asymmetric signing with JWKS endpoint. This should be verified against the existing `.env` `IDENTITY_PROVIDER_DECRYPTION_JWKS` configuration before implementation begins.

### Phase 3: Load Testing and Answer Storage Decision

**Rationale:** The answer storage approach — JSONB on the candidates table vs. a relational `candidate_answers` table — is explicitly contested between researchers and has cascading implications for the frontend adapter, RLS policies, and write performance. This decision must be made before the frontend adapter is written. Running load tests at this phase (after schema and auth are stable) provides the realistic baseline needed.

**Delivers:** k6 load test scripts comparing JSONB and relational approaches at realistic scale (200-10K candidates, 30-100 questions), pgbench scripts measuring raw PostgreSQL query performance, documented decision with supporting data, final schema migration applying the chosen answer storage approach.

**Addresses features:** Load test at 10K candidates (table stakes), answer storage performance validation.

**Avoids:** JSONB answer storage write amplification and GIN index bloat (Pitfall 5), performance trap of loading all candidates with all answers without validation.

**Research flag:** The load test methodology itself is well-documented (k6 + pgbench), but the threshold criteria for choosing JSONB vs relational should be defined before tests run. Recommended threshold: if relational bulk-read query (all candidates + all answers) is within 2x of JSONB bulk-read at 10K candidates, use relational. If more than 2x slower, use JSONB for migration simplicity.

### Phase 4: Storage and Edge Services

**Rationale:** Supabase Storage depends on auth (`auth.uid()` in storage RLS policies). Edge Functions for bulk admin operations depend on the verified schema. These can proceed in parallel after authentication is stable.

**Delivers:** Supabase Storage buckets (`public-assets`, `candidate-photos`, `party-images`) with RLS policies, candidate photo upload/serve, storage URLs replacing Strapi S3 URLs (localized to `parseImage()` utility), Edge Functions for bulk import/delete (Postgres RPC functions for transactional guarantee), batch email via Edge Function + AWS SES.

**Addresses features:** Storage (candidate photos, party images, public assets), admin bulk operations with transactional guarantee, custom email for non-auth flows.

**Avoids:** Storage policy mismatches (Pitfall 9), admin import losing atomicity.

**Research flag:** Storage RLS policies are not reliably captured by `supabase db pull` (CLI issue #3919). Migration files for storage policies must be written manually and verified. Standard patterns otherwise.

### Phase 5: Frontend Adapter Layer

**Rationale:** Depends on all previous phases. The adapter must be written against a verified schema, verified auth flow, and resolved answer storage design. Writing it last ensures it is not invalidated by upstream decisions.

**Delivers:** `SupabaseDataProvider` implementing all 7 read methods, `SupabaseDataWriter` implementing all 15+ write/auth methods, `SupabaseFeedbackWriter`, `supabaseAdapterMixin` with shared client helpers, data type parsers in `utils/` mapping Supabase rows to `DPDataType` types, feature flag in `staticSettings.ts` switching `dataAdapter.type` to `'supabase'`, type generation script wired into build pipeline.

**Addresses features:** All frontend adapter table stakes, feature flag for parallel Strapi/Supabase operation during transition.

**Avoids:** Rewriting the entire adapter at once — implement and test each method incrementally, validating against the running Supabase stack.

**Research flag:** Standard patterns. The `UniversalAdapter` interface is well-defined and the Strapi adapter provides a complete reference implementation. No research needed.

### Phase 6: Strapi Removal and Cleanup

**Rationale:** Only safe to remove Strapi after the Supabase adapter is verified in production or staging. The parallel operation period allows rollback. Removing too early creates irreversible risk.

**Delivers:** `backend/vaa-strapi/` workspace removed from monorepo, all Strapi-specific npm packages removed, LocalStack configuration removed, root docker-compose simplified to frontend-only, all Strapi-specific environment variables removed, E2E tests updated to use Mailpit API instead of mailparser/LocalStack SES polling.

**Avoids:** Big-bang cutover risk; the phased approach ensures Strapi stays available until Supabase is verified.

**Research flag:** Standard cleanup patterns. No research needed.

### Phase Ordering Rationale

- Schema before RLS policies before frontend adapter — hard technical dependency
- Auth before storage — storage RLS policies reference `auth.uid()`
- Load testing in Phase 3 (after schema is stable, before adapter is written) — ensures the answer storage decision does not require rewriting adapter code
- Strapi removal last — maximum safety window for rollback
- Parallel Strapi operation throughout Phases 1-5 — both Features and Architecture researchers recommend keeping Strapi running during migration via the feature flag

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Authentication):** Signicat OIDC third-party auth compatibility with Supabase needs validation against actual Signicat JWT format before committing to implementation path. The key question is whether Signicat issues RS256-signed JWTs with `kid` header and JWKS endpoint (enabling `signInWithIdToken()`) or uses JWE encryption (requiring a server-side decryption Edge Function).
- **Phase 3 (Load Testing):** Answer storage decision thresholds should be defined before tests run. Researchers disagree on default choice — load testing exists specifically to resolve this.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure):** Supabase CLI initialization, migration workflow, RLS boilerplate are all well-documented in official docs.
- **Phase 5 (Frontend Adapter):** The `UniversalAdapter` interface and Strapi adapter provide a complete implementation template. Supabase-js query patterns are well-documented.
- **Phase 6 (Cleanup):** Standard removal work, no research needed.

---

## Open Design Decision: Answer Storage

**Status: UNRESOLVED — requires load testing (Phase 3) to decide**

This is a genuine disagreement between researchers that cannot be resolved by research alone.

| Argument | JSONB (Features researcher) | Relational (Pitfalls researcher) |
|----------|----------------------------|----------------------------------|
| Bulk read for matching | Single SELECT, no joins, matches library format | JOIN + aggregate, up to 1M rows at 10K candidates |
| Write per candidate | Simple JSONB overwrite or `jsonb_set()` | Clean upsert on `(candidate_id, question_id)` |
| Write amplification | Full document rewrite per update | Partial update per answer row |
| RLS cost | One policy on candidates table | Policy on answers table plus join |
| Data integrity | No FK on question IDs | FK to questions table |
| GIN index behavior | Bitmap Index Scan only, limited operators | Standard B-tree on composite key |
| Supabase Studio usability | Can freeze at large JSONB volumes (documented issue #28361) | Clean table rows |
| Migration risk | Preserves existing pattern | New table, adapter code changes |

**Recommended resolution process:**
1. Build both schemas in Phase 1 as alternative migration files
2. Run pgbench scripts measuring bulk-read latency (voter app pattern: all candidates with answers) at 1K, 5K, and 10K candidates
3. Run pgbench scripts measuring write latency (candidate updates one answer) at 100 concurrent writers
4. If relational bulk-read is within 2x of JSONB at 10K candidates, choose relational (better long-term properties)
5. If relational bulk-read is more than 2x slower, choose JSONB and validate write performance separately

**Hybrid fallback:** Relational `candidate_answers` for writes + materialized JSONB column refreshed periodically for bulk reads. Use only if a single approach fails both write and read load tests.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against npm registry (supabase-js@2.99.1, ssr@0.9.0). CLI docs verified against official Supabase docs. k6 and pgbench are MEDIUM (combination for schema validation is a recommendation, not officially prescribed). |
| Features | MEDIUM-HIGH | Core mapping from Strapi to Supabase is thorough and based on direct codebase analysis. Authentication complexity (Signicat OIDC) has MEDIUM confidence — exact Signicat JWT format needs validation. Admin operations pattern (Postgres RPC) is correct approach but implementation details need careful design. |
| Architecture | MEDIUM-HIGH | Verified against official Supabase docs and direct codebase inspection. Multi-tenant RLS voter app anonymous-read pattern has two candidate approaches; recommended single-tenant-per-deployment starting point simplifies Phase 1. |
| Pitfalls | HIGH | Official Supabase docs, codebase analysis, verified GitHub issues (CLI bug #3723, storage pull #3919). Security statistics from January 2025/2026 scans. RLS performance advice is canonical from official troubleshooting docs. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Signicat JWT format:** Before Phase 2 begins, verify whether the existing `IDENTITY_PROVIDER_DECRYPTION_JWKS` configuration implies JWE-encrypted tokens (which blocks `signInWithIdToken()`) or standard RS256 tokens. This determines the bank auth implementation path.
- **Answer storage decision:** Cannot be resolved by research — requires load tests at realistic data volumes. Build both schema alternatives in Phase 1, test in Phase 3, decide before Phase 5.
- **Voter app anonymous RLS pattern:** The architecture researcher flags that anonymous (voter) reads with RLS multi-tenant filtering need a resolved approach. The recommended single-tenant-per-deployment starting point defers this complexity, but it must be designed before Phase 5 if multi-tenant is in scope for this migration.
- **Edge Function vs Postgres RPC for registration flow:** Architecture researcher prefers Edge Functions (TypeScript readability for complex logic); confirm against actual cold-start latency constraints for the candidate registration UX before implementation.

---

## Sources

### Primary (HIGH confidence)
- Supabase CLI getting started: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase SvelteKit SSR auth: https://supabase.com/docs/guides/auth/server-side/sveltekit
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase RLS troubleshooting: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase custom access token hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- Supabase database testing (pgTAP): https://supabase.com/docs/guides/database/testing
- Supabase type generation: https://supabase.com/docs/guides/api/rest/generating-types
- Supabase Security Advisor: https://supabase.com/docs/guides/database/database-advisors
- npm: @supabase/supabase-js: https://www.npmjs.com/package/@supabase/supabase-js
- npm: @supabase/ssr: https://www.npmjs.com/package/@supabase/ssr
- Supabase CLI bug #3723 (db reset): https://github.com/supabase/cli/issues/3723
- Supabase CLI issue #3919 (storage pull): https://github.com/supabase/cli/issues/3919
- OpenVAA codebase: direct inspection of Strapi schemas, adapter pattern, OIDC route, hooks.server.ts
- pgbench docs: https://www.postgresql.org/docs/current/pgbench.html
- pgTAP extension: https://supabase.com/docs/guides/database/extensions/pgtap

### Secondary (MEDIUM confidence)
- JSONB vs relational performance: https://medium.com/@sruthiganesh/comparing-query-performance-in-postgresql-jsonb-vs-join-queries-e4832342d750
- GIN index analysis: https://pganalyze.com/blog/gin-index
- Multi-tenant RLS patterns: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- Supabase OIDC discussion (generic provider): https://github.com/orgs/supabase/discussions/6547
- SvelteKit + Supabase local setup: https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp
- Security exposure report (Jan 2025/2026): https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/

### Tertiary (LOW-MEDIUM confidence)
- Candidate invite flow via Edge Functions: https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions
- Custom i18n auth emails: https://blog.mansueli.com/creating-customized-i18n-ready-authentication-emails-using-supabase-edge-functions-postgresql-and-resend

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*

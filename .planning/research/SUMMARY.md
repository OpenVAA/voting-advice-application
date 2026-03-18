# Project Research Summary

**Project:** v3.0 Frontend Adapter Migration (Strapi to Supabase)
**Domain:** SvelteKit adapter migration — replacing a Strapi REST backend with Supabase (PostgREST + GoTrue + Edge Functions)
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This migration replaces OpenVAA's Strapi REST API adapter with a native Supabase adapter in the SvelteKit frontend. The Supabase backend is already built and validated (schema, 79 RLS policies, 204 pgTAP tests, Edge Functions), so this is not a greenfield project — it is a frontend integration task. The recommended approach is to mirror the existing Strapi adapter's class hierarchy using a mixin pattern (`supabaseAdapterMixin`) that injects a typed supabase-js client instead of HTTP fetch helpers. All concrete adapter classes (`SupabaseDataProvider`, `SupabaseDataWriter`, `SupabaseFeedbackWriter`) extend existing abstract base classes, preserving the dynamic import switch and context system while replacing the transport layer. No new npm packages are required; all Supabase packages are already installed in the frontend.

The biggest architectural challenge is authentication. Strapi used an explicit JWT string (`authToken`) threaded through every DataWriter call. Supabase uses cookie-based sessions managed automatically by `@supabase/ssr`. This difference cascades through `hooks.server.ts`, page loaders, auth contexts, and every write operation. The recommended approach is pragmatic: the Supabase adapter accepts the existing `WithAuth` parameter for interface compliance but ignores it, relying instead on the per-request Supabase server client that carries the session via cookies. This avoids touching all 15+ call sites during v3.0 and defers a clean interface refactor to v4.0.

The key risks are not technical unknowns — they are implementation discipline issues. Developers must not use `getSession()` for server-side authorization (use `getClaims()` or `safeGetSession()`), must add `project_id` scoping to every query (anon RLS does not filter by project), must localize JSONB fields at the adapter boundary (not rely on Strapi-era `translate()` utils), and must avoid maintaining dual auth token state during migration. Four schema gaps need migration before adapter work can complete: a `customization` column on `app_settings`, a `feedback` table, a `terms_of_use_accepted` column on `candidates`, and an atomic `upsert_candidate_answer()` RPC function.

## Key Findings

### Recommended Stack

The project already has all required Supabase packages installed (`@supabase/supabase-js` 2.99.1, `@supabase/ssr` 0.9.0, `@openvaa/supabase-types` workspace). No new dependencies are needed. The one recommended action is bumping `@supabase/supabase-js` to 2.99.2 (patch only) at the start of work.

The local development environment changes: `supabase start` (already configured at `apps/supabase/`) replaces the Docker services for Strapi, Postgres, and LocalStack. Environment variables `PUBLIC_BROWSER_BACKEND_URL` and `PUBLIC_SERVER_BACKEND_URL` (Strapi endpoints) are removed; `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` take their place.

**Core technologies:**
- `@supabase/supabase-js` 2.99.x: PostgREST query builder, GoTrue auth, Storage client, Edge Function invoker — single replacement for Strapi's entire HTTP API layer
- `@supabase/ssr` 0.9.0: Cookie-based session management for SvelteKit — eliminates manual JWT cookie handling entirely
- `@openvaa/supabase-types` (workspace): Generated `Database` types, `COLUMN_MAP`, `PROPERTY_MAP` — type-safe queries and snake_case-to-camelCase mapping
- `supabase` CLI 2.78.1: Local dev stack already configured at `apps/supabase/` — no setup work needed

**Packages to remove after migration (not before):** `qs` (Strapi URL serialization), `jose` (Strapi JWT verification).

### Expected Features

The adapter must implement 7 DataProvider read methods, 14+ DataWriter write/auth methods, 1 FeedbackWriter method, and 1 AdminWriter method. Three Edge Functions (`invite-candidate`, `signicat-callback`, `send-email`) need frontend integration. All abstract method signatures are defined in existing base classes — no interface design needed, only implementations.

**Must have (table stakes):**
- `getAppSettings` — every page requires dynamic settings; simplest Supabase read, proves the adapter pattern works
- `getElectionData`, `getConstituencyData`, `getQuestionData`, `getEntityData`, `getNominationData` — core VAA voter app data; `getNominationData` is the most complex (unified nominations table with FK-based polymorphism + join-table relationships)
- Login / logout / session management — foundation for all candidate app operations; `@supabase/ssr` replaces manual JWT cookie management
- `getCandidateUserData`, `updateAnswers`, `overwriteAnswers`, `updateEntityProperties` — core candidate questionnaire and profile operations
- Password management (reset request, reset completion, change password) — GoTrue handles email delivery natively

**Should have (differentiators enabled by Supabase):**
- Type-safe PostgREST queries via `Database` type — eliminates all 17 Strapi parse utilities
- RLS-enforced access control — security lives in the database, not application code
- Session-based auth without manual token threading — the `WithAuth` pass-through pattern becomes a no-op for Supabase
- Atomic answer validation via JSONB trigger — invalid answers rejected at DB level (already built)
- Storage with path-based RLS — upload authorization enforced without adapter code (already built)

**Defer (post-v3.0):**
- `getAppCustomization` — requires schema migration (customization column on `app_settings`) first; once migration is done the implementation is trivial
- `SupabaseFeedbackWriter.postFeedback` — requires new `feedback` table migration
- Admin jobs / `insertJobResult` — no schema equivalent; out of scope per PROJECT.md; handled by universal API route handlers
- Multi-tenant project_id enforcement via anon RLS request headers — defense-in-depth, not MVP-blocking (app-level project_id filter is sufficient)

**Registration flows (deferred within v3.0, Phase 4 sub-phase):**
- `invite-candidate` Edge Function integration (GoTrue invite link flow replaces `registrationKey` two-step)
- `signicat-callback` Edge Function integration (Finnish bank auth OIDC callback flow)

### Architecture Approach

The Supabase adapter follows the mixin-based transport abstraction already established by the Strapi adapter. A `supabaseAdapterMixin` function injects a typed `SupabaseClient<Database>` into base adapter classes, providing a `this.supabase` getter for all concrete implementations. The mixin's `init()` override creates the Supabase client from SvelteKit's provided `fetch` (enabling existing `dataProvider.init({ fetch })` call sites to work unchanged), with an optional `supabaseClient` parameter in `AdapterConfig` for the server-side case where the per-request authenticated client from `event.locals.supabase` should be used directly.

**Major components:**
1. `supabaseAdapterMixin` — injects typed Supabase client; all concrete classes extend the mixed base class
2. `SupabaseDataProvider` — 7 read methods using PostgREST query builder with `COLUMN_MAP` transform and JSONB localization
3. `SupabaseDataWriter` — 14+ write/auth methods using GoTrue auth and PostgREST mutations; accepts `WithAuth` for interface compliance but uses client session instead
4. `SupabaseFeedbackWriter` — single `postFeedback` insert; depends on `feedback` table schema migration
5. Auth integration layer — `hooks.server.ts` simplified to Supabase-only session check; `candidate/+layout.server.ts` uses `safeGetSession()`; `authContext.ts` derives from `page.data.session`
6. Data transform utilities — generic `transformRow()` using `COLUMN_MAP` replaces all 17 Strapi parse functions; `localizeRow()` extracts locale strings from JSONB at the adapter boundary before they reach application code

### Critical Pitfalls

1. **`getSession()` used for server-side authorization** — `getSession()` trusts cookie contents without signature verification; a malicious client can spoof user ID or role claims. Enforce `safeGetSession()` or `getClaims()` for all server-side auth checks. Must be established in the auth phase before any data adapter work begins.

2. **Dual auth token state during migration** — having both `token` (Strapi JWT) and `sb-*` (Supabase) cookies active simultaneously creates phantom auth states. The `hooks.server.ts` OR-logic masks breakage in development. Make a clean break: remove all `AUTH_TOKEN_KEY` references when cutting over; do not maintain a compatibility layer beyond a bounded transition period.

3. **RLS returns empty arrays instead of errors** — PostgREST returns HTTP 200 with `[]` when RLS policies filter out all rows. The voter app shows "no candidates exist" instead of "session expired" or "wrong project_id." Build defensive "expected non-empty" assertions into `SupabaseDataProvider` methods from the start; test with both anon and authenticated clients.

4. **Missing JSONB localization at adapter boundary** — Supabase returns `{"en": "...", "fi": "..."}` JSONB objects for all translatable fields. The `@openvaa/data` types expect plain strings. `COLUMN_MAP` handles snake_case conversion but not localization. A `localizeRow()` utility must be built before the first DataProvider query, since every query uses localized fields. Implement the same fallback chain as the `get_localized()` SQL function.

5. **Missing `project_id` scoping in queries** — anon RLS does not filter by `project_id`. Without explicit `.eq('project_id', currentProjectId)` on every query, multi-project Supabase instances expose data from all projects to voter app users. Build a base query helper that automatically adds the project_id filter before implementing any specific query.

## Implications for Roadmap

Based on the combined research, a 5-phase structure is recommended. The ordering follows hard technical dependencies: schema migrations must precede the features that depend on them; auth must be fully resolved before writes begin; the transform/mixin foundation must exist before any concrete adapter class is written; and Strapi removal must come only after full end-to-end verification.

### Phase 1: Schema Migrations and Adapter Foundation

**Rationale:** Four schema gaps block specific adapter features. Building them at the start avoids mid-implementation context switches. The mixin and transform utilities are required by every concrete adapter class — they must exist first. This phase produces no user-visible changes but unblocks everything else.

**Delivers:** Schema migrations for `customization` JSONB column (app_settings), `feedback` table, `terms_of_use_accepted` column (candidates), and `upsert_candidate_answer()` RPC. `supabaseAdapterMixin` with `init()` override. `transformRow`, `localizeRow`, `parseImage`, `buildFilters` utilities. `SupabaseDataAdapter` type in staticSettings. `case 'supabase'` stubs in dynamic import switches (`dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`).

**Addresses:** Four schema gaps from FEATURES.md. Establishes project_id scoping base query helper (PITFALLS #5). Establishes localization utility (PITFALLS #4).

**Avoids:** Mid-feature schema surprises; JSONB leaking into UI; cross-project data exposure.

**Research flag:** Standard patterns — no research phase needed. Schema migrations follow the existing migration style in `apps/supabase/supabase/migrations/`.

### Phase 2: Auth Migration

**Rationale:** Every DataWriter method depends on correct auth state. SSR hydration correctness must be proven before DataProvider testing can be fully trusted (anon vs authenticated queries return different data via RLS). The dual auth token state is the highest-severity pitfall; resolving it completely before write-path work begins is non-negotiable.

**Delivers:** Login and logout server routes rewritten to use GoTrue. `candidate/+layout.server.ts` uses `safeGetSession()` instead of `cookies.get(AUTH_TOKEN_KEY)`. `authContext.ts` derives auth state from `page.data.session`. `hooks.server.ts` simplified to Supabase-only session check. `AUTH_TOKEN_KEY` cookie handling removed. `getUserData.ts` extracts role claims from JWT without a Strapi round-trip.

**Addresses:** Login/logout/session management from FEATURES.md. Pitfalls #1 (getSession misuse), #2 (dual auth token state), #6 (SSR hydration mismatch).

**Avoids:** Phantom auth states. Security vulnerability from trusting unverified cookie contents. Hydration flicker on candidate app pages.

**Research flag:** Standard patterns — the Supabase SvelteKit SSR guide is official and authoritative; the existing codebase is already partially aligned (hooks, server client, browser client are all wired correctly).

### Phase 3: DataProvider (Read Path)

**Rationale:** Voter app reads are anonymous, making this phase independently testable without auth complexity. It validates the mixin, query builder, and transform/localization pipeline before writes are added. The FEATURES.md recommended ordering (simplest to most complex) minimizes rework: if the pattern is wrong, it is discovered on `getAppSettings` not `getNominationData`.

**Delivers:** Full `SupabaseDataProvider` with all 7 read methods. Voter app functional end-to-end using Supabase backend.

**Order:** `_getAppSettings` → `_getElectionData` → `_getConstituencyData` → `_getQuestionData` → `_getEntityData` → `_getNominationData` → `_getAppCustomization`. Wire dynamic import switch and verify voter app end-to-end.

**Addresses:** All DataProvider features from FEATURES.md. Pitfalls #3 (defensive empty-result assertions), #4 (JSONB localization in every query), #5 (project_id scoping in every query).

**Avoids:** Implementing `getNominationData` before the pattern is validated on simpler queries. Deferring localization until later (it must be in the first query).

**Research flag:** `getNominationData` may benefit from a focused sub-phase spike. The nominations table uses FK-based polymorphism (nullable `candidate_id`, `organization_id`, etc.) and PostgREST join syntax for multiple related entity types may be awkward. Evaluate pure PostgREST select vs. RPC before committing to implementation.

### Phase 4: DataWriter (Write Path)

**Rationale:** Depends on Phase 2 (auth) and Phase 1 (mixin and transforms are proven). The core candidate operations (answer updates, profile edits) are the highest-value writes and have the clearest implementation path. Registration flows (invite + bank auth) have external dependencies (GoTrue email delivery, Signicat OIDC callback chain) that are harder to test locally; they come at the end of this phase.

**Delivers:** Full `SupabaseDataWriter` with candidate user data reads, answer updates, entity property updates (including Storage upload), and password management. `SupabaseFeedbackWriter`. Candidate app functional end-to-end. Optionally: `updateQuestion` AdminWriter method.

**Order:** `_getBasicUserData` → `_getCandidateUserData` → `_setAnswers` / `_overwriteAnswers` → `_updateEntityProperties` (Storage upload + record update) → password operations → registration flows (`invite-candidate`, `signicat-callback` Edge Functions) → `SupabaseFeedbackWriter`.

**Addresses:** All DataWriter and FeedbackWriter features from FEATURES.md. The `WithAuth` compatibility bridge (accept parameter for interface compliance, use client session instead).

**Avoids:** Implementing answer update without the `upsert_candidate_answer()` RPC (race condition on partial updates). Exposing `service_role` key to browser code for any purpose.

**Research flag:** Registration flow sub-phase needs targeted research. GoTrue invite link flow (token exchange → session establishment → password set) and the `signicat-callback` OIDC chain (Signicat redirect → id_token POST → magic link session exchange) are less commonly documented than standard email/password auth. A focused research task before implementing these is warranted.

### Phase 5: Cleanup and Strapi Removal

**Rationale:** Only after all adapter functionality is verified and E2E tests pass should Strapi code be removed. Premature removal eliminates the reference implementation and breaks the existing test suite. The E2E tests currently seed data via a `StrapiAdminClient` in `data.setup.ts` — this must be migrated to a Supabase service_role client before Strapi is removed.

**Delivers:** Strapi adapter directory deleted (`frontend/src/lib/api/adapters/strapi/`). `backend/vaa-strapi/` removed. `qs`, `jose` dependencies removed from `frontend/package.json`. `AUTH_TOKEN_KEY` references removed. Docker Compose Strapi/Postgres/LocalStack services removed. E2E test suite fully migrated to Supabase service_role seeding. Dev workflow simplified to `supabase start` + `vite dev`.

**Addresses:** STACK.md "packages to remove" list. PITFALLS.md "E2E test breakage after Strapi removal" recovery path.

**Avoids:** Removing Strapi before the E2E test suite passes with Supabase backend (would leave the project with no working integration test coverage).

**Research flag:** E2E migration is medium complexity but the patterns are well-understood (service_role client seeding). No research phase needed. The main work is mechanical: replace `StrapiAdminClient` calls with Supabase service_role client calls in `data.setup.ts` and `auth.setup.ts`.

### Phase Ordering Rationale

- Schema migrations precede adapter implementation because four features depend on new schema objects that do not exist yet.
- Auth migration precedes DataWriter because every write operation depends on correct session state; it also precedes full DataProvider testing because auth state determines which data RLS allows through.
- DataProvider before DataWriter because the mixin and transform utilities are proven on simpler read queries before the complexity of mutations and session-dependent operations is added.
- Edge Function integration (registration flows) comes last in the write phase because it has external dependencies (GoTrue email delivery, Signicat OIDC callback) that are harder to control in local testing.
- Strapi cleanup is strictly last — it is destructive and irreversible; the Strapi adapter serves as the reference implementation until all functionality is verified.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (`getNominationData`):** The nominations table uses FK-based polymorphism with a `generated` `entity_type` column. PostgREST can traverse FK relationships but the query for multiple nullable entity type FKs may be awkward. Evaluate whether a database view, a PostgREST-readable function, or raw RPC is the cleanest approach before implementing.
- **Phase 4 (registration flows):** GoTrue invite link flow and the `signicat-callback` OIDC chain involve multi-step token exchanges that are less documented. Run a targeted research task before implementing these two sub-features specifically.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Schema migrations follow established patterns in `apps/supabase/supabase/migrations/`; mixin pattern mirrors the existing Strapi mixin exactly.
- **Phase 2:** Supabase SvelteKit SSR auth guide is official and authoritative; existing codebase is already partially aligned.
- **Phase 3 (except `getNominationData`):** PostgREST select queries and FK joins have thorough official documentation.
- **Phase 5:** Strapi removal is mechanical; E2E migration patterns are understood.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages already installed; versions verified against npm registry; zero new dependencies required; dev environment already configured |
| Features | HIGH | Features derived from existing Strapi adapter interface (concrete contract, not speculative) and official Supabase docs for implementation approach; four schema gaps are precisely identified |
| Architecture | HIGH | Mixin pattern derived from direct codebase analysis of existing Strapi adapter; three existing adapter implementations confirm the pattern; supabase-js custom fetch support confirmed in official docs; AdapterConfig extension is a surgical change |
| Pitfalls | HIGH | All pitfalls grounded in official Supabase security documentation and direct codebase analysis; `getSession()` vulnerability backed by GitHub issue discussion; RLS silent failure backed by official Supabase troubleshooting doc |

**Overall confidence:** HIGH

### Gaps to Address

- **`getAppCustomization` schema decision:** Three options exist (embed in `app_settings.settings`, add separate table, or add `customization` JSONB column to `app_settings`). Research recommends adding a `customization` column (option C), but this needs sign-off before the Phase 1 migration is written.
- **`getNominationData` PostgREST query shape:** The nominations table's polymorphic entity structure may produce an awkward join query. Evaluate whether a database view or RPC function is cleaner before implementing in Phase 3.
- **`WithAuth` refactor scope:** The pragmatic v3.0 decision is to ignore `authToken` in the Supabase adapter. A v4.0 refactor that makes `WithAuth` adapter-generic is desirable but explicitly out of scope. Document as technical debt before Phase 4.
- **`terms_of_use_accepted` column type:** FEATURES.md recommends `timestamptz`. Confirm this matches how existing frontend code reads/writes this value (may expect boolean) before writing the Phase 1 migration.
- **JSONB localization fallback chain:** The TypeScript `localizeRow()` utility in Phase 1 must match the `get_localized()` SQL function's fallback chain (requested locale → project default → any available key → null) exactly. Verify the project default locale source (likely `app_settings.settings.defaultLocale`) before implementing.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `frontend/src/lib/api/` — adapter base classes and Strapi adapter implementation
- Codebase analysis: `apps/supabase/supabase/migrations/` — schema, RLS policies, triggers, functions
- Codebase analysis: `packages/supabase-types/` — COLUMN_MAP, Database generated types
- Codebase analysis: `frontend/src/hooks.server.ts`, `frontend/src/lib/supabase/` — existing Supabase client setup
- [Setting up Server-Side Auth for SvelteKit — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/sveltekit)
- [Creating a Supabase client for SSR — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [getClaims() API Reference — Supabase Docs](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [Why select returns empty array — Supabase Troubleshooting](https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr)

### Secondary (MEDIUM confidence)
- [Security issue: getSession vs getUser — supabase/auth-js#898](https://github.com/supabase/auth-js/issues/898)
- [Clarify getClaims vs getUser vs getSession — supabase/supabase#40985](https://github.com/supabase/supabase/issues/40985)
- [PostgREST Type Inference System — deepwiki](https://deepwiki.com/supabase/postgrest-js/3.3-query-type-inference)
- [Perfect Local SvelteKit Supabase Setup 2025 — DEV Community](https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp)
- [RLS Performance Best Practices — Supabase Docs](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [CORS for Edge Functions — Supabase Docs](https://supabase.com/docs/guides/functions/cors)

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*

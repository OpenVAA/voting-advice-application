# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, shared packages for matching algorithms, filters, and data management, and a Supabase backend with multi-tenant PostgreSQL schema, RLS-based access control, and GoTrue authentication. The project includes Claude Code skills that provide domain expertise for each major package.

## Core Value

A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## Requirements

### Validated

- ✓ SvelteKit 2 frontend with voter and candidate apps — existing
- ✓ Matching algorithm package with multiple distance metrics — existing
- ✓ Entity filtering package — existing
- ✓ Shared data model package — existing
- ✓ App-shared settings and utilities package — existing
- ✓ Docker-based development environment — existing
- ✓ Internationalization support — existing
- ✓ Extensible, modular E2E testing framework with full coverage — v1.0
- ✓ Supabase backend with 17-table multi-tenant schema and JSONB localization — v2.0
- ✓ JSONB answer storage (validated via load testing at 1K/5K/10K scale) — v2.0
- ✓ GoTrue authentication with 5 role types and 79 RLS policies — v2.0
- ✓ Storage, bulk import/delete, and transactional email services — v2.0
- ✓ 204 pgTAP tests covering tenant isolation, access control, and data integrity — v2.0
- ✓ Bank authentication (Signicat OIDC) via Edge Function — v2.0
- ✓ Load testing toolkit for schema validation decisions — v2.0
- ✓ Claude Skills: domain-expert skills for data, matching, filters, and database — v5.0

### Active

- [x] Supabase frontend adapter: DataProvider, DataWriter, and AdminWriter implementations — v3.0 Phase 22-27
- [x] Auth migration from Strapi JWT to Supabase session-based auth — v3.0 Phase 24
- [x] Edge Function frontend integration (invite-candidate, signicat-callback, send-email) — v3.0 Phase 28
- [x] Strapi removal (adapter code, backend/vaa-strapi/, Docker service) — v3.0 Phase 30
- [x] E2E test migration from Strapi to Supabase backend — v3.0 Phase 29
- [x] Local dev environment via supabase CLI — v3.0 Phase 30

### Out of Scope

- Mobile native apps — web-first approach, PWA works well
- GraphQL via pg_graphql — no current frontend need
- Supabase Realtime — no current use case in voter or candidate apps
- Schema-per-tenant isolation — disproportionate overhead for 10-50 tenants
- Admin app UI — deferred to separate milestone after adapter migration

## Context

The project is a mature monorepo used for real election deployments. The Supabase backend is fully functional with authentication, multi-tenant RLS, storage, bulk operations, and comprehensive test coverage. Phase 23 (Adapter Foundation) established the shared infrastructure for the Supabase frontend adapter — mixin, row mapping, localization utilities, and stub classes are in place.

Key technical state after Phase 30:
- **Backend:** Supabase (Postgres, GoTrue, PostgREST, Storage, Edge Functions) at `apps/supabase/`
- **Legacy backend:** Removed — Strapi v5 fully deleted in Phase 30
- **Types:** `@openvaa/supabase-types` with generated Database types and COLUMN_MAP/PROPERTY_MAP
- **Adapter foundation:** `supabaseAdapterMixin`, `mapRow`/`mapRowToDb`, `getLocalized` utilities, stub DataProvider/DataWriter/FeedbackWriter classes, switch wiring — all at `frontend/src/lib/api/adapters/supabase/`
- **DataProvider:** All 7 read methods implemented (`_getAppSettings`, `_getAppCustomization`, `_getElectionData`, `_getConstituencyData`, `_getEntityData`, `_getQuestionData`, `_getNominationData`) with `localizeRow`, `toDataObject`, `parseStoredImage` utilities and `get_nominations` RPC — 84 tests passing
- **Auth:** SvelteKit `hooks.server.ts` has Supabase client wired, cookie-based session auth implemented
- **AdminWriter:** `_updateQuestion` (merge_custom_data RPC) and `_insertJobResult` (admin_jobs table) implemented — all adapter stubs replaced
- **Tests:** 229 pgTAP tests + existing Playwright E2E + Vitest unit tests + 84 DataProvider/adapter tests
- **Edge Functions:** invite-candidate, signicat-callback, send-email (all backend-ready, awaiting frontend integration)
- **Claude Skills:** 4 active domain-expert skills (data, matching, filters, database) + 2 deferred stubs (architect, components) + skill drift CI check

## Current Milestone: v3.0 Frontend Adapter

**Goal:** Replace the Strapi frontend adapter with a Supabase adapter, migrate auth, integrate Edge Functions, update E2E tests, and remove all Strapi dependencies.

**Target features:**
- SupabaseDataProvider implementing all read operations (elections, constituencies, nominations, entities, questions, settings)
- SupabaseDataWriter implementing all write operations (registration, login, answers, profile, password)
- SupabaseAdminWriter implementing admin operations
- Auth migration from Strapi JWT tokens to Supabase cookie-based sessions
- Edge Function integration (candidate invite, bank auth, transactional email)
- Strapi complete removal (adapter code, backend/vaa-strapi/, Docker services)
- E2E test suite migrated to Supabase backend
- Local dev via supabase CLI replacing Docker compose for backend services

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 4, Supabase only, Postgres, Yarn 4 workspaces
- **Tech stack (target)**: Svelte 5, potentially Deno
- **Testing**: Playwright for E2E, Vitest for unit tests, pgTAP for database
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Dev environment**: `supabase start` + SvelteKit dev server (no Docker Compose for backend)

## Milestones

Each major initiative is a separate milestone:

1. ~~**v1.0 E2E Testing Framework**~~ — Modular test infrastructure with full candidate and voter app coverage
2. **v2.0 Supabase Migration** — ✅ Shipped 2026-03-15. Backend migration with schema, auth, RLS, storage, services, and 204 pgTAP tests
3. **v3.0 Frontend Adapter** — Supabase data provider/writer/admin writer, auth migration, Edge Functions, Strapi removal, E2E migration
4. **v4.0 Svelte 5 Migration** — Framework upgrade including Tailwind, DaisyUI, i18n rewrites
5. **v5.0 Claude Skills** — ✅ Shipped 2026-03-18. Domain-expert skills for data, matching, filters, database (architect, components, LLM deferred to post-Svelte 5)

For details see [MILESTONES](.planning/MILESTONES.md) and archived roadmaps in `.planning/milestones/`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSONB answer storage over relational | 2-10x faster reads at all scales; simpler schema; concurrent writes adequate | ✓ Good (v2.0) |
| JSONB localization with get_localized() | 3-tier fallback (requested→default→first key); avoids translation table joins | ✓ Good (v2.0) |
| Custom Access Token Hook for JWT roles | Roles injected at auth time; no per-query role lookups | ✓ Good (v2.0) |
| 79 per-operation RLS policies | Granular control; pgTAP-testable; clear security boundaries | ✓ Good (v2.0) |
| Remove question_templates table | Admin tooling will handle templates at project creation; avoids runtime merge complexity | ✓ Good (v2.0) |
| external_id for bulk import/export | Enables idempotent data sync without exposing internal UUIDs | ✓ Good (v2.0) |
| Edge Functions for auth flows | Candidate invite + Signicat bank auth run server-side in Deno | ✓ Good (v2.0) |
| Test IDs over text selectors | More resilient to content/i18n changes | ✓ Good (v1.0) |
| Inline skills over subagent skills | Domain knowledge loaded in context, not forked; lower latency, better for reference | ✓ Good (v5.0) |
| Defer architect/components/LLM skills | Frontend architecture will change with Svelte 5; skills would be immediately outdated | ✓ Good (v5.0) |
| Skill drift CI check | Automated detection of stale skills when source targets change | — Pending (v5.0) |

---

*Last updated: 2026-03-20 after Phase 30 (Strapi Removal and Dev Environment) complete — v3.0 Frontend Adapter milestone final phase*

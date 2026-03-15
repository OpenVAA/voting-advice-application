# OpenVAA Framework Evolution

## What This Is

OpenVAA is an open-source framework for building Voting Advice Applications (VAAs). It's a monorepo with a SvelteKit frontend, shared packages for matching algorithms, filters, and data management, and a Supabase backend with multi-tenant PostgreSQL schema, RLS-based access control, and GoTrue authentication. The project covers framework evolution: hardening test infrastructure, modernizing the backend, and preparing for frontend stack upgrades.

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

### Active

- [ ] Frontend Supabase data adapter (SupabaseDataProvider + SupabaseDataWriter)
- [ ] Strapi workspace removal from monorepo
- [ ] Admin App UI replacing Supabase Studio for election administrators
- [ ] Svelte 5 migration with Tailwind/DaisyUI/i18n rewrites

### Out of Scope

- Mobile native apps — web-first approach, PWA works well
- GraphQL via pg_graphql — no current frontend need
- Supabase Realtime — no current use case in voter or candidate apps
- Schema-per-tenant isolation — disproportionate overhead for 10-50 tenants

## Context

The project is a mature monorepo used for real election deployments. The Supabase backend is fully functional with authentication, multi-tenant RLS, storage, bulk operations, and comprehensive test coverage. The frontend still uses the Strapi adapter — migrating to Supabase requires building SupabaseDataProvider/DataWriter (v3+ scope).

Key technical state after v2.0:
- **Backend:** Supabase (Postgres, GoTrue, PostgREST, Storage, Edge Functions) at `apps/supabase/`
- **Legacy backend:** Strapi v5 at `backend/vaa-strapi/` — to be removed after frontend adapter migration
- **Types:** `@openvaa/supabase-types` with generated Database types and COLUMN_MAP/PROPERTY_MAP
- **Tests:** 204 pgTAP tests + existing Playwright E2E + Vitest unit tests
- **Auth hooks:** SvelteKit `hooks.server.ts` has Supabase client wired but routes still use Strapi auth
- **Edge Functions:** invite-candidate, signicat-callback, send-email (all backend-ready, awaiting frontend integration)

## Constraints

- **Tech stack (current)**: SvelteKit 2, Svelte 4, Supabase + Strapi v5 (dual), Postgres, Yarn 4 workspaces
- **Tech stack (target)**: Svelte 5, Supabase only, potentially Deno
- **Testing**: Playwright for E2E, Vitest for unit tests, pgTAP for database
- **Backward compatibility**: Framework is used by external deployers — changes must not break deployment patterns
- **Strapi sunset**: Remove after frontend adapter is verified in production

## Milestones

Each major initiative is a separate milestone:

1. ~~**v1.0 E2E Testing Framework**~~ — Modular test infrastructure with full candidate and voter app coverage
2. **v2.0 Supabase Migration** — ✅ Shipped 2026-03-15. Backend migration with schema, auth, RLS, storage, services, and 204 pgTAP tests
3. **v3.0 Frontend Adapter** — Supabase data provider/writer, Strapi removal, admin app UI
4. **v4.0 Svelte 5 Migration** — Framework upgrade including Tailwind, DaisyUI, i18n rewrites

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

---

*Last updated: 2026-03-15 after v2.0 Supabase Migration milestone shipped*

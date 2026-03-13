# Requirements: OpenVAA Supabase Migration

**Defined:** 2026-03-12
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## v2.0 Requirements

Requirements for Milestone 2: Supabase Migration. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Supabase CLI initialized in monorepo with `config.toml` configured for local development
- [x] **INFRA-02**: `supabase start` launches all backend services (Postgres, GoTrue, PostgREST, Storage, Mailpit, Studio)
- [x] **INFRA-03**: Seed data replaces Strapi's `GENERATE_MOCK_DATA_ON_INITIALISE` mechanism
- [x] **INFRA-04**: Type generation script produces TypeScript types from Supabase schema
- [x] **INFRA-05**: `supabase db lint` configured to block on missing RLS and unindexed columns

### Schema

- [x] **SCHM-01**: All content tables use snake_case naming with a type mapping layer for camelCase @openvaa/data alignment
- [x] **SCHM-02**: Schema models @openvaa/data entities (not Strapi content types) — elections, candidates, questions, answers, parties, constituencies, question_templates, app_settings
- [x] **SCHM-03**: Localization strategy evaluated (JSONB extraction, translation table, or hybrid) with requirement that only requested locale data is returned to frontend
- [x] **SCHM-04**: RLS enabled on every table with at least one policy per table
- [x] **SCHM-05**: B-tree indexes on all RLS-referenced columns (project_id, user references)
- [x] **SCHM-06**: Both JSONB and relational answer storage schemas drafted as alternative migrations
- [x] **SCHM-07**: App settings stored as typed table with JSONB columns per section (one row per project)

### Multi-Tenant

- [x] **MTNT-01**: `accounts` table representing organizations
- [x] **MTNT-02**: `projects` table linked to accounts (one account can have multiple projects/VAA deployments)
- [x] **MTNT-03**: All content tables linked to a project via `project_id`
- [x] **MTNT-04**: RLS policies enforce project-level data isolation via JWT role claims
- [x] **MTNT-05**: Candidate-to-auth-user link explicit in schema (which user owns which candidate record)
- [x] **MTNT-06**: Party-to-auth-user link in schema (party admin users)
- [x] **MTNT-07**: Single-tenant deployment works as a degenerate case (one account, one project)

### Authentication

- [x] **AUTH-01**: Email/password login for candidates via Supabase Auth
- [x] **AUTH-02**: Password reset for candidates via email link
- [x] **AUTH-03**: Candidate pre-registration invite flow via Edge Function (admin creates candidate, generates link, sends email)
- [x] **AUTH-04**: `user_roles` table with scoped role assignments (user_id, role, scope_type, scope_id)
- [x] **AUTH-05**: Five role types enforced via RLS: `candidate` (own data), `party` (party data + nomination confirmation), `project_admin` (one project), `account_admin` (one account), `super_admin` (all accounts)
- [x] **AUTH-06**: Custom Access Token Hook injects active roles and scopes into JWT claims
- [x] **AUTH-07**: SvelteKit `hooks.server.ts` creates per-request Supabase server client via `@supabase/ssr`
- [x] **AUTH-08**: Signicat OIDC bank auth integrated with Supabase session management

### Data Model

- [x] **DATA-01**: @openvaa/data extended with `QuestionTemplate` concept (renamed from Strapi's questionType)
- [x] **DATA-02**: QuestionTemplate defines default properties, answer type, and configuration for creating questions

### Services

- [ ] **SRVC-01**: Supabase Storage buckets configured for candidate photos, party images, and public assets with RLS
- [ ] **SRVC-02**: Candidate photo upload and serve works via Supabase Storage API
- [ ] **SRVC-03**: Mailpit accessible at localhost for dev email with human-readable web UI
- [ ] **SRVC-04**: Bulk data import via Postgres RPC function with transactional guarantee
- [ ] **SRVC-05**: Bulk data delete via Postgres RPC function with transactional guarantee
- [ ] **SRVC-06**: Transactional email for non-auth flows (candidate notifications) via Edge Function

### Load Testing

- [x] **LOAD-01**: k6 load test scripts comparing JSONB vs relational answer storage at 1K, 5K, and 10K candidates
- [x] **LOAD-02**: pgbench scripts measuring bulk-read latency (voter pattern: all candidates with answers)
- [x] **LOAD-03**: pgbench scripts measuring write latency (candidate updates one answer) at 100 concurrent writers
- [ ] **LOAD-04**: Answer storage decision documented with supporting benchmark data

### Quality

- [ ] **QUAL-01**: pgTAP tests verify project-level tenant isolation (Project A cannot read Project B's data)
- [ ] **QUAL-02**: pgTAP tests verify candidate can only edit own data
- [ ] **QUAL-03**: pgTAP tests verify public read access for voter-facing data

## v3+ Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Frontend Adapter

- **ADPT-01**: SupabaseDataProvider implementing all read methods from UniversalDataProvider
- **ADPT-02**: SupabaseDataWriter implementing all write/auth methods from UniversalDataWriter
- **ADPT-03**: SupabaseFeedbackWriter implementing feedback submission
- **ADPT-04**: Feature flag in staticSettings.ts for switching between Strapi and Supabase adapters

### Cleanup

- **CLNP-01**: Strapi workspace removed from monorepo
- **CLNP-02**: LocalStack configuration removed
- **CLNP-03**: All Strapi-specific environment variables removed
- **CLNP-04**: E2E tests updated to work with Supabase backend

### Future Capabilities

- **FUTR-01**: Supabase Realtime for live admin dashboard updates
- **FUTR-02**: Admin App UI replacing Supabase Studio for election administrators
- **FUTR-03**: GraphQL via pg_graphql (if frontend patterns shift)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend Supabase adapter | Separate milestone — backend must be validated first |
| Strapi removal | Only after frontend adapter is verified in production |
| Supabase Realtime | No current use case in voter or candidate apps |
| Admin App UI | Separate planned milestone (milestone 7) |
| Schema-per-tenant isolation | Disproportionate operational overhead for 10-50 tenants |
| Mobile native apps | Web-first approach unchanged |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 8 | Complete |
| INFRA-02 | Phase 8 | Complete |
| INFRA-03 | Phase 8 | Complete |
| INFRA-04 | Phase 8 | Complete |
| INFRA-05 | Phase 8 | Complete |
| SCHM-01 | Phase 9 | Complete |
| SCHM-02 | Phase 9 | Complete |
| SCHM-03 | Phase 9 | Complete |
| SCHM-04 | Phase 9 | Complete |
| SCHM-05 | Phase 9 | Complete |
| SCHM-06 | Phase 9 | Complete |
| SCHM-07 | Phase 9 | Complete |
| MTNT-01 | Phase 9 | Complete |
| MTNT-02 | Phase 9 | Complete |
| MTNT-03 | Phase 9 | Complete |
| MTNT-04 | Phase 10 | Complete |
| MTNT-05 | Phase 10 | Complete |
| MTNT-06 | Phase 10 | Complete |
| MTNT-07 | Phase 9 | Complete |
| AUTH-01 | Phase 10 | Complete |
| AUTH-02 | Phase 10 | Complete |
| AUTH-03 | Phase 10 | Complete |
| AUTH-04 | Phase 10 | Complete |
| AUTH-05 | Phase 10 | Complete |
| AUTH-06 | Phase 10 | Complete |
| AUTH-07 | Phase 10 | Complete |
| AUTH-08 | Phase 10 | Complete |
| DATA-01 | Phase 9 | Complete |
| DATA-02 | Phase 9 | Complete |
| SRVC-01 | Phase 12 | Pending |
| SRVC-02 | Phase 12 | Pending |
| SRVC-03 | Phase 12 | Pending |
| SRVC-04 | Phase 12 | Pending |
| SRVC-05 | Phase 12 | Pending |
| SRVC-06 | Phase 12 | Pending |
| LOAD-01 | Phase 11 | Complete |
| LOAD-02 | Phase 11 | Complete |
| LOAD-03 | Phase 11 | Complete |
| LOAD-04 | Phase 11 | Pending |
| QUAL-01 | Phase 13 | Pending |
| QUAL-02 | Phase 13 | Pending |
| QUAL-03 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation (phases 8-13)*

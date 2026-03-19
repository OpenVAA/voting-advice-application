# Roadmap: OpenVAA Framework Evolution

## Milestones

- ✅ **v1.0 E2E Testing Framework** — Phases 1-7 (partially shipped)
- ✅ **v2.0 Supabase Migration** — Phases 8-15 (shipped 2026-03-15)
- ✅ **v5.0 Claude Skills** — Phases 16-21 (shipped 2026-03-18)
- 🚧 **v3.0 Frontend Adapter** — Phases 22-30 (in progress)

## Phases

<details>
<summary>✅ v1.0 E2E Testing Framework (Phases 1-7)</summary>

- [x] Phase 1: Infrastructure Foundation (10/11 plans)
- [ ] Phase 2: Candidate App Coverage (0/4 plans)
- [ ] Phase 3: Voter App Core Journey (3/4 plans)
- [x] Phase 4: Voter App Settings and Edge Cases (5/5 plans) — 2026-03-09
- [x] Phase 5: Configuration Variants (3/3 plans) — 2026-03-09
- [ ] Phase 6: CI Integration and Test Organization (0/2 plans)
- [ ] Phase 7: Advanced Test Capabilities (1/2 plans)

</details>

<details>
<summary>✅ v2.0 Supabase Migration (Phases 8-15) — SHIPPED 2026-03-15</summary>

- [x] Phase 8: Infrastructure Setup (3/3 plans) — 2026-03-12
- [x] Phase 9: Schema and Data Model (3/3 plans) — 2026-03-13
- [x] Phase 10: Authentication and Roles (5/5 plans) — 2026-03-13
- [x] Phase 11: Load Testing (2/2 plans) — 2026-03-14
- [x] Phase 12: Services (3/3 plans) — 2026-03-14
- [x] Phase 13: Quality Assurance (3/3 plans) — 2026-03-15
- [x] Phase 14: Service & Auth Bug Fixes (1/1 plan) — 2026-03-15
- [x] Phase 15: QuestionTemplate & Verification Closure (manual) — 2026-03-15

</details>

<details>
<summary>✅ v5.0 Claude Skills (Phases 16-21) — SHIPPED 2026-03-18</summary>

- [x] Phase 16: Scaffolding and CLAUDE.md Refactoring (2/2 plans) — 2026-03-15
- [x] Phase 17: Data Skill (2/2 plans) — 2026-03-16
- [x] Phase 18: Matching Skill (2/2 plans) — 2026-03-16
- [x] Phase 19: Filters Skill (2/2 plans) — 2026-03-16
- [x] Phase 20: Database Skill (2/2 plans) — 2026-03-16
- [x] Phase 21: Quality and Validation (1/1 plan) — 2026-03-16

</details>

### 🚧 v3.0 Frontend Adapter (In Progress)

**Milestone Goal:** Replace the Strapi frontend adapter with a Supabase adapter, migrate auth, integrate Edge Functions, update E2E tests, and remove all Strapi dependencies.

- [x] **Phase 22: Schema Migrations** - Add missing schema objects that adapter features depend on (completed 2026-03-18)
- [x] **Phase 23: Adapter Foundation** - Build the mixin, transforms, and localization utilities that all adapter classes need (completed 2026-03-18)
- [x] **Phase 24: Auth Migration** - Replace Strapi JWT auth with Supabase cookie-based sessions (completed 2026-03-19)
- [x] **Phase 25: DataProvider** - Implement all read operations; voter app works end-to-end on Supabase (completed 2026-03-19)
- [ ] **Phase 26: DataWriter** - Implement candidate write operations; candidate app works end-to-end on Supabase
- [ ] **Phase 27: AdminWriter** - Implement admin operations for question and job management
- [ ] **Phase 28: Edge Functions** - Integrate candidate invite, bank auth, and email Edge Functions into frontend
- [ ] **Phase 29: E2E Test Migration** - Migrate test infrastructure and data seeding from Strapi to Supabase
- [ ] **Phase 30: Strapi Removal and Dev Environment** - Remove all Strapi code and switch to supabase CLI for local dev

## Phase Details

### Phase 22: Schema Migrations
**Goal**: All schema objects that adapter features depend on exist in the Supabase database
**Depends on**: Nothing (first phase of v3.0)
**Requirements**: SCHM-01, SCHM-02, SCHM-03, SCHM-04
**Success Criteria** (what must be TRUE):
  1. App customization data can be stored and retrieved from Supabase (customization JSONB column on app_settings or equivalent)
  2. User feedback can be submitted and stored in a dedicated feedback table with appropriate RLS
  3. Candidate terms-of-use acceptance is tracked with a timestamp column on the candidates table
  4. Candidate answers can be atomically upserted via an RPC function that handles both insert and update
**Plans**: 4 plans

Plans:
- [ ] 22-01-PLAN.md — Column additions (SCHM-01/03/04): customization on app_settings, terms_of_use_accepted on candidates, upsert_answers RPC
- [ ] 22-02-PLAN.md — Feedback table (SCHM-02): table DDL, rate limiting trigger, RLS policies, indexes
- [ ] 22-03-PLAN.md — pgTAP tests for all four requirements (SCHM-01 through SCHM-04)
- [ ] 22-04-PLAN.md — Type regeneration: database.ts regenerated, column-map.ts updated with termsOfUseAccepted

### Phase 23: Adapter Foundation
**Goal**: The shared utilities and infrastructure that all Supabase adapter classes depend on are built and tested
**Depends on**: Phase 22
**Requirements**: ADPT-01, ADPT-02, ADPT-03, ADPT-04
**Success Criteria** (what must be TRUE):
  1. A supabaseAdapterMixin creates a typed Supabase client from SvelteKit's fetch, and accepts an injected server client via AdapterConfig
  2. Row mapping utility transforms Supabase snake_case rows to camelCase domain objects using COLUMN_MAP/PROPERTY_MAP
  3. JSONB localization utility extracts locale-appropriate strings with 3-tier fallback (requested, default, first key) matching the SQL get_localized() behavior
  4. Setting staticSettings.dataAdapter.type to 'supabase' causes the dynamic import switch to load Supabase adapter classes
**Plans**: 2 plans

Plans:
- [ ] 23-01-PLAN.md — Types, constants, and utilities (ADPT-01/02/03/04): SupabaseDataAdapter type, env var constants, SupabaseAdapterConfig type, mapRow/mapRowToDb utilities, getLocalized utility, unit tests
- [ ] 23-02-PLAN.md — Mixin, stubs, and wiring (ADPT-01/04): supabaseAdapterMixin, stub DataProvider/DataWriter/FeedbackWriter classes, dynamic import switch cases

### Phase 24: Auth Migration
**Goal**: Users can securely authenticate using Supabase cookie-based sessions with no Strapi auth dependency
**Depends on**: Phase 23
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Candidate can log in with email/password and their session persists across page reloads via Supabase cookies
  2. Candidate can log out from any page and their session is fully terminated (no stale cookies)
  3. Protected candidate routes redirect unauthenticated users to login, using Supabase session verification (safeGetSession, not getSession)
  4. Candidate can request a password reset email and complete the reset flow via Supabase GoTrue
  5. No Strapi JWT (AUTH_TOKEN_KEY) cookies are read or written anywhere in the auth flow
**Plans**: 3 plans

Plans:
- [x] 24-01-PLAN.md -- SupabaseDataWriter auth methods + auth callback route + unit tests (AUTH-01, AUTH-04)
- [x] 24-02-PLAN.md -- Session infrastructure: hooks route guard, layout loaders, AuthContext rewrite (AUTH-02, AUTH-03)
- [x] 24-03-PLAN.md -- Route refactoring, admin page updates, Strapi auth cleanup (AUTH-01, AUTH-02, AUTH-03, AUTH-04)

### Phase 25: DataProvider
**Goal**: The voter app loads all data from Supabase and works end-to-end without Strapi
**Depends on**: Phase 23 (adapter foundation), Phase 24 (auth, for authenticated query testing)
**Requirements**: READ-01, READ-02, READ-03, READ-04, READ-05, READ-06
**Success Criteria** (what must be TRUE):
  1. Voter app displays app settings and customization loaded from Supabase
  2. Voter app displays elections with their constituency groups from Supabase
  3. Voter app displays constituencies with parent relationships from Supabase
  4. Voter app displays candidates and organizations with their answers and profile data from Supabase
  5. Voter app displays questions grouped by categories with correct question types from Supabase
  6. Voter app displays nomination data with correctly resolved candidate and organization entities from Supabase (polymorphic nominations table)
**Plans**: 4 plans

Plans:
- [ ] 25-01-PLAN.md — Shared utilities: localizeRow, toDataObject, storageUrl with unit tests
- [ ] 25-02-PLAN.md — get_nominations RPC migration + DPDataType extension for tree formats
- [ ] 25-03-PLAN.md — DataProvider methods: appSettings, appCustomization, elections, constituencies
- [ ] 25-04-PLAN.md — DataProvider methods: entities, questions, nominations with entity deduplication

### Phase 26: DataWriter
**Goal**: Candidates can manage their questionnaire answers, profile, and account through the Supabase adapter
**Depends on**: Phase 24 (auth), Phase 25 (DataProvider patterns established)
**Requirements**: WRIT-01, WRIT-02, WRIT-03, WRIT-04
**Success Criteria** (what must be TRUE):
  1. Candidate can save and update their answers (both partial update and full overwrite modes) via the atomic upsert RPC
  2. Candidate can update their profile fields and upload a profile image via Supabase Storage
  3. Candidate registration flow works end-to-end: invite link received, token exchanged, password set, session established
  4. Candidate user data (role, election, constituency, nomination) is correctly derived from the Supabase session and related tables
**Plans**: TBD

Plans:
- [ ] 26-01: TBD

### Phase 27: AdminWriter
**Goal**: Admin operations for question and job management work through the Supabase adapter
**Depends on**: Phase 26 (DataWriter patterns established)
**Requirements**: ADMN-01, ADMN-02
**Success Criteria** (what must be TRUE):
  1. Admin can create, update, and manage questions and entities through the AdminWriter adapter
  2. Admin can start, abort, and track progress of background jobs through the AdminWriter adapter
**Plans**: TBD

Plans:
- [ ] 27-01: TBD

### Phase 28: Edge Functions
**Goal**: Frontend integrates with all three Supabase Edge Functions for candidate invite, bank auth, and email
**Depends on**: Phase 24 (auth), Phase 26 (registration flow context)
**Requirements**: EDGE-01, EDGE-02, EDGE-03
**Success Criteria** (what must be TRUE):
  1. Admin can trigger candidate invitations that send invite emails via the invite-candidate Edge Function
  2. Candidate can authenticate using Finnish bank ID through the Signicat OIDC flow via the signicat-callback Edge Function
  3. Transactional emails (password reset, notifications) are sent via the send-email Edge Function instead of Strapi email
**Plans**: TBD

Plans:
- [ ] 28-01: TBD

### Phase 29: E2E Test Migration
**Goal**: The full E2E test suite runs against the Supabase backend with no Strapi dependency
**Depends on**: Phase 25 (DataProvider), Phase 26 (DataWriter), Phase 28 (Edge Functions)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. Test infrastructure uses a Supabase admin client (service_role) instead of StrapiAdminClient for all setup/teardown
  2. Test data is seeded via SQL or Supabase RPCs, not Strapi API calls
  3. Auth setup in Playwright tests creates and manages Supabase sessions (not Strapi JWT tokens)
  4. All existing E2E tests pass against the Supabase backend with equivalent coverage
**Plans**: TBD

Plans:
- [ ] 29-01: TBD

### Phase 30: Strapi Removal and Dev Environment
**Goal**: All Strapi code is removed and local development uses supabase CLI exclusively
**Depends on**: Phase 29 (E2E tests passing without Strapi)
**Requirements**: ENVR-01, ENVR-02, ENVR-03, ENVR-04, ENVR-05
**Success Criteria** (what must be TRUE):
  1. Local development starts with `supabase start` + `vite dev` with no Docker Compose needed for backend services
  2. The Strapi adapter directory (frontend/src/lib/api/adapters/strapi/) no longer exists
  3. The backend/vaa-strapi/ directory no longer exists
  4. Docker Compose files contain no Strapi, legacy Postgres, or LocalStack service definitions
  5. Strapi-specific packages (qs, jose) are removed from frontend/package.json (verified unused elsewhere)
**Plans**: TBD

Plans:
- [ ] 30-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 22 → 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 22. Schema Migrations | 4/4 | Complete    | 2026-03-18 | - |
| 23. Adapter Foundation | 2/2 | Complete    | 2026-03-18 | - |
| 24. Auth Migration | 3/3 | Complete   | 2026-03-19 | - |
| 25. DataProvider | 4/4 | Complete   | 2026-03-19 | - |
| 26. DataWriter | v3.0 | 0/? | Not started | - |
| 27. AdminWriter | v3.0 | 0/? | Not started | - |
| 28. Edge Functions | v3.0 | 0/? | Not started | - |
| 29. E2E Test Migration | v3.0 | 0/? | Not started | - |
| 30. Strapi Removal and Dev Environment | v3.0 | 0/? | Not started | - |

---

*Full phase details for completed milestones archived in `.planning/milestones/`*

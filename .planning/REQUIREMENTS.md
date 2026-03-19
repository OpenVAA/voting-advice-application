# Requirements: OpenVAA Frontend Adapter

**Defined:** 2026-03-18
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## v3.0 Requirements

Requirements for Supabase frontend adapter migration. Each maps to roadmap phases.

### Schema Migrations

- [x] **SCHM-01**: app_customization storage added to Supabase schema (customization JSONB column or equivalent)
- [x] **SCHM-02**: feedback table added to Supabase schema
- [x] **SCHM-03**: terms_of_use_accepted column added to candidates table
- [x] **SCHM-04**: Answer upsert RPC for atomic answer writes

### Adapter Foundation

- [x] **ADPT-01**: supabaseAdapterMixin providing typed Supabase client with init({ fetch }) compatibility
- [x] **ADPT-02**: Row mapping utility using COLUMN_MAP/PROPERTY_MAP for snake_case→camelCase transforms
- [x] **ADPT-03**: JSONB localization utility implementing 3-tier fallback (requested→default→first key)
- [x] **ADPT-04**: staticSettings.dataAdapter.type = 'supabase' support in dynamic import switch

### Auth Migration

- [x] **AUTH-01**: Login/logout server routes using Supabase cookie-based sessions instead of Strapi JWT
- [x] **AUTH-02**: Auth context updated to use Supabase session state
- [x] **AUTH-03**: Protected route guards using Supabase session verification
- [x] **AUTH-04**: Password reset and change flows via Supabase GoTrue

### Data Provider (Reads)

- [x] **READ-01**: getAppSettings and getAppCustomization from Supabase
- [x] **READ-02**: getElectionData with constituency groups
- [x] **READ-03**: getConstituencyData with parent relationships
- [x] **READ-04**: getNominationData with entity resolution (polymorphic nominations table)
- [x] **READ-05**: getEntityData for candidates and organizations
- [x] **READ-06**: getQuestionData with categories and question types

### Data Writer (Writes)

- [x] **WRIT-01**: Answer updates (partial and overwrite modes) via RPC
- [x] **WRIT-02**: Entity property updates (profile fields, image upload via Storage)
- [x] **WRIT-03**: Candidate registration flow (invite link → exchange token → set password)
- [ ] **WRIT-04**: getCandidateUserData and getBasicUserData from Supabase session

### Admin Writer

- [ ] **ADMN-01**: AdminWriter adapter for question/entity management operations
- [ ] **ADMN-02**: Job management operations (start, abort, progress)

### Edge Functions

- [ ] **EDGE-01**: invite-candidate Edge Function integrated into candidate invite flow
- [ ] **EDGE-02**: signicat-callback Edge Function integrated for bank authentication
- [ ] **EDGE-03**: send-email Edge Function integrated for transactional email

### E2E Test Migration

- [ ] **TEST-01**: Test infrastructure migrated from StrapiAdminClient to Supabase admin client
- [ ] **TEST-02**: Data seeding via SQL/RPCs instead of Strapi API
- [ ] **TEST-03**: Auth setup using Supabase sessions in Playwright tests
- [ ] **TEST-04**: All existing E2E tests passing against Supabase backend

### Dev Environment & Cleanup

- [ ] **ENVR-01**: Local dev via supabase CLI (supabase start) replacing Docker compose for backend
- [ ] **ENVR-02**: Strapi adapter code removed (frontend/src/lib/api/adapters/strapi/)
- [ ] **ENVR-03**: backend/vaa-strapi/ directory removed
- [ ] **ENVR-04**: Docker services for Strapi removed from compose files
- [ ] **ENVR-05**: Strapi-specific packages (qs, etc.) removed if unused elsewhere

## Future Requirements

### Admin App UI (post v3.0)

- **ADMIN-01**: Admin dashboard for election/project management
- **ADMIN-02**: Admin interface for candidate/organization management
- **ADMIN-03**: Admin interface for question/category management

### Merge App Settings

- **SETT-01**: Merge app_settings and app_customization into unified storage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin app UI | Separate milestone after adapter migration |
| Supabase Realtime subscriptions | No current use case in voter or candidate apps |
| Offline support | Not needed for election-period VAA usage |
| Multi-tenant UI switching | Single-project deployment is current model |
| WithAuth interface refactoring | Pragmatic: keep signatures, ignore token internally; revisit in v4.0 Svelte 5 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHM-01 | Phase 22 | Complete |
| SCHM-02 | Phase 22 | Complete |
| SCHM-03 | Phase 22 | Complete |
| SCHM-04 | Phase 22 | Complete |
| ADPT-01 | Phase 23 | Complete |
| ADPT-02 | Phase 23 | Complete |
| ADPT-03 | Phase 23 | Complete |
| ADPT-04 | Phase 23 | Complete |
| AUTH-01 | Phase 24 | Complete |
| AUTH-02 | Phase 24 | Complete |
| AUTH-03 | Phase 24 | Complete |
| AUTH-04 | Phase 24 | Complete |
| READ-01 | Phase 25 | Complete |
| READ-02 | Phase 25 | Complete |
| READ-03 | Phase 25 | Complete |
| READ-04 | Phase 25 | Complete |
| READ-05 | Phase 25 | Complete |
| READ-06 | Phase 25 | Complete |
| WRIT-01 | Phase 26 | Complete |
| WRIT-02 | Phase 26 | Complete |
| WRIT-03 | Phase 26 | Complete |
| WRIT-04 | Phase 26 | Pending |
| ADMN-01 | Phase 27 | Pending |
| ADMN-02 | Phase 27 | Pending |
| EDGE-01 | Phase 28 | Pending |
| EDGE-02 | Phase 28 | Pending |
| EDGE-03 | Phase 28 | Pending |
| TEST-01 | Phase 29 | Pending |
| TEST-02 | Phase 29 | Pending |
| TEST-03 | Phase 29 | Pending |
| TEST-04 | Phase 29 | Pending |
| ENVR-01 | Phase 30 | Pending |
| ENVR-02 | Phase 30 | Pending |
| ENVR-03 | Phase 30 | Pending |
| ENVR-04 | Phase 30 | Pending |
| ENVR-05 | Phase 30 | Pending |

**Coverage:**
- v3.0 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*

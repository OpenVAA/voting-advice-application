# Requirements: OpenVAA Frontend Adapter

**Defined:** 2026-03-18
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## v3.0 Requirements

Requirements for Supabase frontend adapter migration. Each maps to roadmap phases.

### Schema Migrations

- [ ] **SCHM-01**: app_customization storage added to Supabase schema (customization JSONB column or equivalent)
- [ ] **SCHM-02**: feedback table added to Supabase schema
- [ ] **SCHM-03**: terms_of_use_accepted column added to candidates table
- [ ] **SCHM-04**: Answer upsert RPC for atomic answer writes

### Adapter Foundation

- [ ] **ADPT-01**: supabaseAdapterMixin providing typed Supabase client with init({ fetch }) compatibility
- [ ] **ADPT-02**: Row mapping utility using COLUMN_MAP/PROPERTY_MAP for snake_case→camelCase transforms
- [ ] **ADPT-03**: JSONB localization utility implementing 3-tier fallback (requested→default→first key)
- [ ] **ADPT-04**: staticSettings.dataAdapter.type = 'supabase' support in dynamic import switch

### Auth Migration

- [ ] **AUTH-01**: Login/logout server routes using Supabase cookie-based sessions instead of Strapi JWT
- [ ] **AUTH-02**: Auth context updated to use Supabase session state
- [ ] **AUTH-03**: Protected route guards using Supabase session verification
- [ ] **AUTH-04**: Password reset and change flows via Supabase GoTrue

### Data Provider (Reads)

- [ ] **READ-01**: getAppSettings and getAppCustomization from Supabase
- [ ] **READ-02**: getElectionData with constituency groups
- [ ] **READ-03**: getConstituencyData with parent relationships
- [ ] **READ-04**: getNominationData with entity resolution (polymorphic nominations table)
- [ ] **READ-05**: getEntityData for candidates and organizations
- [ ] **READ-06**: getQuestionData with categories and question types

### Data Writer (Writes)

- [ ] **WRIT-01**: Answer updates (partial and overwrite modes) via RPC
- [ ] **WRIT-02**: Entity property updates (profile fields, image upload via Storage)
- [ ] **WRIT-03**: Candidate registration flow (invite link → exchange token → set password)
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
| SCHM-01 | - | Pending |
| SCHM-02 | - | Pending |
| SCHM-03 | - | Pending |
| SCHM-04 | - | Pending |
| ADPT-01 | - | Pending |
| ADPT-02 | - | Pending |
| ADPT-03 | - | Pending |
| ADPT-04 | - | Pending |
| AUTH-01 | - | Pending |
| AUTH-02 | - | Pending |
| AUTH-03 | - | Pending |
| AUTH-04 | - | Pending |
| READ-01 | - | Pending |
| READ-02 | - | Pending |
| READ-03 | - | Pending |
| READ-04 | - | Pending |
| READ-05 | - | Pending |
| READ-06 | - | Pending |
| WRIT-01 | - | Pending |
| WRIT-02 | - | Pending |
| WRIT-03 | - | Pending |
| WRIT-04 | - | Pending |
| ADMN-01 | - | Pending |
| ADMN-02 | - | Pending |
| EDGE-01 | - | Pending |
| EDGE-02 | - | Pending |
| EDGE-03 | - | Pending |
| TEST-01 | - | Pending |
| TEST-02 | - | Pending |
| TEST-03 | - | Pending |
| TEST-04 | - | Pending |
| ENVR-01 | - | Pending |
| ENVR-02 | - | Pending |
| ENVR-03 | - | Pending |
| ENVR-04 | - | Pending |
| ENVR-05 | - | Pending |

**Coverage:**
- v3.0 requirements: 36 total
- Mapped to phases: 0
- Unmapped: 36

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*

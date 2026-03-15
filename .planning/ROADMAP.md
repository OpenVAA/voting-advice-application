# Roadmap: OpenVAA Framework Evolution

## Overview

This roadmap spans two milestones of the OpenVAA framework evolution. Milestone 1 (phases 1-7) rebuilt the E2E test infrastructure. Milestone 2 (phases 8-13) migrates the backend from Strapi v5 to Supabase with a working schema, authentication, RLS, and supporting services -- validated by load tests to resolve key design decisions before the frontend adapter is written in a future milestone.

## Milestones

- [x] **v1.0 E2E Testing Framework** - Phases 1-7
- [ ] **v2.0 Supabase Migration** - Phases 8-15 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 E2E Testing Framework (Phases 1-7)</summary>

- [x] **Phase 1: Infrastructure Foundation** - Playwright upgrade, project dependencies pattern, API data management, testId attributes, fixture layer, ESLint plugin
- [ ] **Phase 2: Candidate App Coverage** - Restructure existing candidate tests and fill all missing flows using new infrastructure
- [ ] **Phase 3: Voter App Core Journey** - Cover landing through results for the primary user-facing surface currently at zero coverage
- [x] **Phase 4: Voter App Settings and Edge Cases** - Cover configuration-driven voter features, optional pages, and app-mode edge cases
- [x] **Phase 5: Configuration Variants** - Multi-dataset Playwright projects covering single vs. multi-election and constituency scenarios
- [ ] **Phase 6: CI Integration and Test Organization** - Wire CI pipeline, HTML report artifacts, and test tagging system
- [ ] **Phase 7: Advanced Test Capabilities** - Visual regression baseline suite and performance benchmark integration

</details>

### v2.0 Supabase Migration (Phases 8-13)

- [x] **Phase 8: Infrastructure Setup** - Supabase CLI initialized, local dev stack running, type generation, linting, seed data mechanism (completed 2026-03-12)
- [ ] **Phase 9: Schema and Data Model** - All database tables modeled on @openvaa/data entities with multi-tenant structure, localization, both answer storage alternatives, and QuestionTemplate package extension
- [x] **Phase 10: Authentication and Roles** - Candidate and admin auth via Supabase Auth, role-based RLS enforcement, JWT claims, SvelteKit integration, Signicat OIDC (completed 2026-03-13)
- [x] **Phase 11: Load Testing** - k6 and pgbench benchmarks comparing answer storage alternatives at realistic scale, producing a documented decision (completed 2026-03-14)
- [x] **Phase 12: Services** - Storage buckets with RLS, candidate photo upload, email for dev and transactional flows, bulk admin import/delete operations (completed 2026-03-14)
- [x] **Phase 13: Quality Assurance** - pgTAP tests verifying tenant isolation, candidate self-edit restrictions, and public read access (completed 2026-03-15)
- [x] **Phase 14: Service & Auth Bug Fixes** - Fix bulk_import, storage cleanup, password reset redirect, and env config gaps (gap closure) (completed 2026-03-15)
- [ ] **Phase 15: QuestionTemplate & Verification Closure** - Resolve DATA-01/DATA-02 and close Phase 11 verification gap (gap closure)

## Phase Details

<details>
<summary>v1.0 E2E Testing Framework (Phases 1-7)</summary>

### Phase 1: Infrastructure Foundation
**Goal**: A test framework where any single test can run in isolation, in any order, with stable selectors and visible setup failures
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):
  1. Running a single spec file in isolation produces the same result as running the full suite -- no shared state leaks between tests
  2. When the `data.setup.ts` project fails, the failure appears in the HTML report with a trace, not as a cryptic cascade of test failures
  3. Every interactive element in both voter and candidate apps can be selected via `data-testid` attribute without using text content or CSS classes
  4. The Admin Tools API can load and delete a complete test dataset in under 5 seconds, verified by a passing setup/teardown project
  5. The ESLint Playwright plugin flags `waitForTimeout` calls and text-based click targets as errors in CI
**Plans:** 11 plans

Plans:
- [x] 01-01-PLAN.md -- Playwright upgrade to 1.58.2, project dependencies config, strapiAdminClient.ts, testIds constants
- [x] 01-02-PLAN.md -- Default test dataset JSON, data setup/teardown projects, auth setup project
- [x] 01-03-PLAN.md -- Add data-testid attributes to voter app route pages (14 files)
- [x] 01-04-PLAN.md -- Add data-testid attributes to candidate auth/public pages and candidate-specific components (14 files)
- [x] 01-05-PLAN.md -- Fixture layer (index.ts, auth.fixture.ts) and page object model stubs (LoginPage, HomePage, QuestionsPage)
- [x] 01-06-PLAN.md -- ESLint Playwright plugin configuration (eslint-plugin-playwright)
- [x] 01-07-PLAN.md -- Add data-testid attributes to shared/dynamic components used by voter app (16 files)
- [x] 01-08-PLAN.md -- Add data-testid attributes to candidate protected pages including profile-submit rename (6 files)
- [x] 01-09-PLAN.md -- [GAP CLOSURE] Reconcile testIds.ts constants with component values, fix naming mismatches, update page objects
- [x] 01-10-PLAN.md -- [GAP CLOSURE] Add missing data-testid attributes to results, entity details, navigation, registration, settings, constituency components
- [ ] 01-11-PLAN.md -- [GAP CLOSURE] Fix Playwright config testIgnore, remove orphaned testIds, wire Loading.svelte testId

### Phase 2: Candidate App Coverage
**Goal**: Complete candidate app coverage organized by user story, with each spec file independently runnable and isolated
**Depends on**: Phase 1
**Requirements**: CAND-01, CAND-02, CAND-03, CAND-04, CAND-05, CAND-06, CAND-07, CAND-08, CAND-09, CAND-10, CAND-11, CAND-12, CAND-13, CAND-14, CAND-15
**Success Criteria** (what must be TRUE):
  1. A developer can run `candidate-auth.spec.ts` alone and it passes without any prior test having run
  2. The registration via email link flow is tested end-to-end
  3. All candidate question types are covered with test IDs as selectors
  4. The candidate preview page is tested and verifies all entered data displays correctly
  5. App-mode edge cases all redirect or show correct UI
**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md -- Foundation: emailHelper utility, StrapiAdminClient extensions, dataset extension, 7 page objects, fixture registration
- [ ] 02-02-PLAN.md -- Auth and registration specs
- [ ] 02-03-PLAN.md -- Profile and questions specs
- [ ] 02-04-PLAN.md -- Settings and app modes spec + legacy cleanup

### Phase 3: Voter App Core Journey
**Goal**: The voter happy path from landing page through results and candidate detail is covered with isolated, reproducible tests
**Depends on**: Phase 1
**Requirements**: VOTE-01, VOTE-02, VOTE-03, VOTE-04, VOTE-05, VOTE-06, VOTE-07, VOTE-08, VOTE-09, VOTE-10, VOTE-11, VOTE-12
**Success Criteria** (what must be TRUE):
  1. A voter can complete the full journey from landing page to results page in a single test run
  2. All three results section types are individually tested
  3. Candidate and party detail pages display all tabs
  4. Minimum answers threshold is enforced
  5. Election and constituency selection flows are tested
**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md -- Voter dataset, candidate addendum, data setup/teardown mods, page objects, voter fixture
- [x] 03-02-PLAN.md -- Voter journey spec
- [x] 03-03-PLAN.md -- Voter results and detail specs
- [x] 03-04-PLAN.md -- Voter matching spec

### Phase 4: Voter App Settings and Edge Cases
**Goal**: All configuration-driven voter features, optional pages, and UI behaviors are verified by tests
**Depends on**: Phase 3
**Requirements**: VOTE-13, VOTE-14, VOTE-15, VOTE-16, VOTE-17, VOTE-18, VOTE-19
**Success Criteria** (what must be TRUE):
  1. Category selection feature tested in both enabled and disabled states
  2. Feedback and survey popups appear after configured triggers
  3. Nominations page renders with candidate listings
  4. Results link appears only after minimum answers threshold
  5. Static pages render without errors
**Plans:** 5/5 plans complete

Plans:
- [x] 04-01-PLAN.md -- TestId infrastructure + voter-settings spec
- [x] 04-02-PLAN.md -- Voter popups spec
- [x] 04-03-PLAN.md -- Voter static pages spec
- [ ] 04-04-PLAN.md -- [GAP CLOSURE] Fix voter-settings and voter-popups specs
- [ ] 04-05-PLAN.md -- [GAP CLOSURE] Fix nominations test data loading and assertions

### Phase 5: Configuration Variants
**Goal**: Multiple Playwright projects, each with a distinct dataset, cover the major deployment configuration combinations
**Depends on**: Phase 3
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, CONF-07, CONF-08
**Success Criteria** (what must be TRUE):
  1. Single-election project executes without election selection step
  2. Multi-election project includes election selection step
  3. Constituency-enabled and constituency-disabled projects both pass independently
  4. Each variant has its own JSON dataset loaded by dedicated setup project
  5. Organizations-only and candidates-only results configurations verified
**Plans:** 3/3 plans complete

Plans:
- [ ] 05-01-PLAN.md -- Overlay datasets, merge utility, variant setup/teardown projects
- [ ] 05-02-PLAN.md -- Multi-election spec + results-sections spec
- [ ] 05-03-PLAN.md -- Constituency spec + startFromConstituencyGroup spec

### Phase 6: CI Integration and Test Organization
**Goal**: The full test suite runs automatically on every pull request with a visible HTML report and selective run capability
**Depends on**: Phase 2, Phase 3
**Requirements**: CI-01, CI-02, CI-03
**Success Criteria** (what must be TRUE):
  1. Pull request triggers full E2E suite with pass/fail status check
  2. HTML test report artifact available for download
  3. Grep-based tag filtering works for smoke, voter, and candidate subsets
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md -- GitHub Actions workflow update
- [ ] 06-02-PLAN.md -- Test tagging system

### Phase 7: Advanced Test Capabilities
**Goal**: Visual regression baselines and performance benchmarks are established as first-class test suite members
**Depends on**: Phase 2, Phase 3
**Requirements**: INFRA-10, INFRA-11
**Success Criteria** (what must be TRUE):
  1. Visual test captures or compares screenshots with diff-based failure
  2. Performance test asserts page load within time budget
  3. Both test types excluded from default test:e2e run
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md -- Visual regression spec
- [ ] 07-02-PLAN.md -- Performance budget spec + CI optional job

</details>

### v2.0 Supabase Migration

**Milestone Goal:** Migrate the backend from Strapi v5 to Supabase with a working schema, auth, RLS, and supporting services -- validated by load tests to resolve the answer storage design decision. Frontend adapter and Strapi removal are deferred to v3+.

### Phase 8: Infrastructure Setup
**Goal**: Developers can run `supabase start` and have a complete local backend with type generation, linting, and seed data
**Depends on**: Nothing (first phase of milestone)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Running `supabase start` from the monorepo root launches Postgres, GoTrue, PostgREST, Storage, Mailpit, and Studio without manual configuration
  2. Running the type generation script produces a TypeScript file reflecting the current database schema that can be imported by frontend code
  3. Running `supabase db lint` reports warnings for tables missing RLS policies or indexes on filtered columns
  4. Running `supabase db reset` executes seed.sql successfully, validating the seed mechanism (substantive test data added in Phase 9 when schema tables exist)
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md -- Supabase workspace, CLI init, config.toml, seed mechanism, root aliases
- [x] 08-02-PLAN.md -- @openvaa/supabase-types package with type generation pipeline
- [x] 08-03-PLAN.md -- Custom Splinter-derived lint script for RLS and index checks

### Phase 9: Schema and Data Model
**Goal**: All content tables exist in the database modeled on @openvaa/data entities, with multi-tenant structure, localization strategy, both answer storage alternatives, and the QuestionTemplate concept added to @openvaa/data
**Depends on**: Phase 8
**Requirements**: SCHM-01, SCHM-02, SCHM-03, SCHM-04, SCHM-05, SCHM-06, SCHM-07, MTNT-01, MTNT-02, MTNT-03, MTNT-07, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Every @openvaa/data entity (elections, candidates, questions, answers, parties, constituencies, question_templates, app_settings) has a corresponding database table visible in Supabase Studio with snake_case columns and a type mapping layer for camelCase alignment
  2. All content tables include a `project_id` foreign key linking to a `projects` table, and a single-tenant deployment works as a degenerate case with one account and one project
  3. Both JSONB and relational answer storage schemas exist as alternative migration files that can each be applied and rolled back independently
  4. The localization strategy is implemented and only the requested locale's data is returned when querying with a locale parameter
  5. @openvaa/data exports a QuestionTemplate class that defines default properties, answer type, and configuration for creating questions, with passing unit tests
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Multi-tenant tables (accounts, projects), localization functions (get_localized), and all content entity tables
- [ ] 09-02-PLAN.md -- App settings, answer storage alternatives (JSONB + relational with shared validation), indexes, RLS, seed data
- [ ] 09-03-PLAN.md -- QuestionTemplate class in @openvaa/data (TDD: type, class, DataRoot integration, unit tests)

### Phase 10: Authentication and Roles
**Goal**: Candidates and admins can authenticate via Supabase Auth, with role-based RLS policies enforcing data access at every level
**Depends on**: Phase 9
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, MTNT-04, MTNT-05, MTNT-06
**Success Criteria** (what must be TRUE):
  1. A candidate can sign up with email/password, log in, and reset their password via an email link -- all verified against the running Supabase Auth instance
  2. An admin can create a candidate record via the pre-registration invite flow (Edge Function generates link, sends email, candidate completes registration) and the new candidate appears in the database linked to their auth user
  3. RLS policies enforce that a candidate can only read/write their own data, a project admin can manage all data within their project, and cross-project access is denied -- verified by manual SQL queries as different authenticated users
  4. A Custom Access Token Hook injects active roles and scopes into the JWT, and SvelteKit `hooks.server.ts` creates a per-request Supabase server client that uses these claims
  5. Signicat OIDC bank authentication integrates with Supabase session management so that a bank-authenticated user receives a valid Supabase session
**Plans**: 5 plans

Plans:
- [ ] 10-01-PLAN.md -- Auth foundation: user_roles table, auth_user_id columns, published flags, Custom Access Token Hook, RLS helpers
- [ ] 10-02-PLAN.md -- Replace deny-all RLS with real role-based policies, column-level structural field protection
- [ ] 10-03-PLAN.md -- SvelteKit @supabase/ssr integration: client factories, hooks.server.ts, app.d.ts types
- [ ] 10-04-PLAN.md -- invite-candidate Edge Function for admin pre-registration flow
- [ ] 10-05-PLAN.md -- signicat-callback Edge Function for bank auth OIDC integration

### Phase 11: Load Testing
**Goal**: The answer storage design decision is resolved with benchmark data comparing JSONB vs relational at realistic candidate volumes
**Depends on**: Phase 9
**Requirements**: LOAD-01, LOAD-02, LOAD-03, LOAD-04
**Success Criteria** (what must be TRUE):
  1. k6 load test scripts exist that populate both JSONB and relational schemas with 1K, 5K, and 10K candidates and measure bulk-read latency (voter pattern) and write latency (candidate update pattern)
  2. pgbench scripts measure raw PostgreSQL query performance for bulk reads and concurrent writes (100 writers) on both schemas
  3. A written decision document in the planning directory states which answer storage approach is chosen, with supporting latency numbers at each scale tier and the reasoning for the choice
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md -- Benchmark infrastructure: data generation, pgbench scripts (8 patterns), k6 voter-read test, schema swap, orchestration
- [x] 11-02-PLAN.md -- Execute benchmarks at all scale tiers, write decision document, human review

### Phase 12: Services
**Goal**: Storage, email, and admin bulk operations work end-to-end on the Supabase backend
**Depends on**: Phase 10
**Requirements**: SRVC-01, SRVC-02, SRVC-03, SRVC-04, SRVC-05, SRVC-06
**Success Criteria** (what must be TRUE):
  1. A candidate can upload a photo via Supabase Storage API and the photo is served back at a public URL -- storage buckets have RLS policies restricting uploads to authenticated owners
  2. Emails sent during local development are captured by Mailpit and visible in its web UI at the configured localhost port
  3. An admin can trigger a bulk data import via a Postgres RPC function that either fully succeeds or fully rolls back (transactional guarantee), and similarly for bulk delete
  4. A transactional email for non-auth flows (candidate notification) can be sent via an Edge Function
**Plans**: 3 plans

Plans:
- [ ] 12-01-PLAN.md -- Storage buckets (public-assets, private-assets) with RLS policies, StoredImage validation, cleanup triggers via pg_net
- [ ] 12-02-PLAN.md -- external_id columns on all content tables, bulk_import() and bulk_delete() RPC functions
- [ ] 12-03-PLAN.md -- send-email Edge Function with template resolution RPC, migration regeneration, type generation

### Phase 13: Quality Assurance
**Goal**: Automated pgTAP tests verify that RLS policies correctly enforce tenant isolation, candidate self-edit, and public read access
**Depends on**: Phase 10
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Running `supabase test db` executes pgTAP tests that create data as Project A and verify zero results when querying as Project B -- tenant isolation is enforced
  2. pgTAP tests verify that a candidate user can read and update their own record but cannot read or update another candidate's record
  3. pgTAP tests verify that unauthenticated (anon) access can read voter-facing data (elections, candidates, questions, published answers) but cannot write to any table
**Plans**: 3 plans

Plans:
- [ ] 13-01-PLAN.md -- Test infrastructure (pgTAP helpers, fixtures, user switching) + tenant isolation + candidate self-edit tests
- [ ] 13-02-PLAN.md -- Anon read access + admin CRUD + party admin scope tests
- [ ] 13-03-PLAN.md -- Storage RLS + RPC security + trigger validation + column restriction tests

### Phase 14: Service & Auth Bug Fixes
**Goal**: Fix schema bugs and integration issues found in milestone audit
**Depends on**: Phase 10, Phase 12
**Requirements**: SRVC-01 (fix), SRVC-04 (fix), AUTH-02 (fix), INFRA-02 (fix)
**Gap Closure**: Closes integration and flow gaps from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. `bulk_import` ON CONFLICT works correctly with partial unique indexes (WHERE external_id IS NOT NULL)
  2. Entity DELETE triggers successfully clean up storage files (schema-qualified function calls)
  3. Password reset email redirects to existing `/candidate/password-reset` route
  4. `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` present in root `.env.example` and Docker compose
**Plans**: 1 plan

Plans:
- [ ] 14-01-PLAN.md -- Fix ON CONFLICT partial index, storage trigger search_path, password reset redirect, Supabase env vars

### Phase 15: QuestionTemplate & Verification Closure
**Goal**: Resolve QuestionTemplate requirement gap and close Phase 11 verification gap
**Depends on**: Phase 9, Phase 11
**Requirements**: DATA-01, DATA-02, LOAD-04
**Gap Closure**: Closes requirement and verification gaps from v2.0 audit
**Success Criteria** (what must be TRUE):
  1. DATA-01/DATA-02 resolved (re-implement QuestionTemplate class or defer requirements to v3+)
  2. Phase 11 has VERIFICATION.md confirming benchmark scripts exist and run
  3. LOAD-04 marked complete in REQUIREMENTS.md
**Plans**: 1 plan

Plans:
- [ ] 15-01-PLAN.md -- Restore QuestionTemplate class to @openvaa/data, create Phase 11 VERIFICATION.md, update REQUIREMENTS.md

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 9 -> 10 -> 11 -> 12 -> 13
(Phase 11 depends on Phase 9 only, so it can run in parallel with Phase 10 if desired)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Infrastructure Foundation | v1.0 | 10/11 | Gap closure | - |
| 2. Candidate App Coverage | v1.0 | 0/4 | Planned | - |
| 3. Voter App Core Journey | v1.0 | 3/4 | In Progress | - |
| 4. Voter App Settings and Edge Cases | v1.0 | 5/5 | Complete | 2026-03-09 |
| 5. Configuration Variants | v1.0 | 3/3 | Complete | 2026-03-09 |
| 6. CI Integration and Test Organization | v1.0 | 0/2 | Not started | - |
| 7. Advanced Test Capabilities | v1.0 | 1/2 | In Progress | - |
| 8. Infrastructure Setup | v2.0 | 3/3 | Complete | 2026-03-12 |
| 9. Schema and Data Model | v2.0 | 3/3 | Complete | 2026-03-13 |
| 10. Authentication and Roles | v2.0 | 5/5 | Complete | 2026-03-13 |
| 11. Load Testing | v2.0 | 2/2 | Complete | 2026-03-14 |
| 12. Services | v2.0 | 3/3 | Complete | 2026-03-14 |
| 13. Quality Assurance | v2.0 | 3/3 | Complete | 2026-03-15 |
| 14. Service & Auth Bug Fixes | v2.0 | 1/1 | Complete | 2026-03-15 |
| 15. QuestionTemplate & Verification Closure | v2.0 | 0/1 | Not started | - |

# Milestones

## v1.0 E2E Testing Framework (Shipped: 2026-03-22)

**Phases completed:** 24 phases, 79 plans, 148 tasks

**Key accomplishments:**

- Playwright 1.58.2 with 5-project dependency config, StrapiAdminClient API wrapper, and comprehensive testId constants covering both apps
- Complete data isolation layer with 9-collection test dataset, API-driven import/cleanup lifecycle, and candidate auth storageState for Playwright project dependencies
- 36 data-testid attributes added across all 14 voter app route pages using page-scoped kebab-case naming convention
- 46 data-testid attributes added across 14 candidate app Svelte files covering login, registration, password reset, preregistration, help, and privacy pages plus PasswordField and TermsOfUseForm components
- Extended Playwright test fixture with LoginPage/HomePage/QuestionsPage page objects providing typed locators and action methods as test parameters
- eslint-plugin-playwright configured with flat/recommended preset enforcing no-wait-for-timeout, no-raw-locators, and prefer-web-first-assertions as errors
- 31 data-testid attributes added across 6 candidate protected pages with submitButton renamed to profile-submit
- Reconciled 30+ testIds.ts constants with actual Svelte component data-testid values, fixing naming convention violations and index suffix patterns
- Wired 18 orphaned testIds.ts constants to DOM elements across voter results, entity details, candidate/voter navigation, password registration, and settings components
- Playwright testIgnore excluding 3 legacy specs and vitest files, plus 3 orphaned testIds removed and loading-indicator wired to Loading.svelte
- 7 candidate page objects, SES email helper, extended StrapiAdminClient, and dataset with unregistered candidate and all question types for downstream E2E specs
- Candidate auth E2E tests covering login/logout/password-change and registration/password-reset flows with SES email verification and password restoration
- Candidate profile E2E spec with fresh registration flow and opinion questions spec covering Likert answering, editing, category nav, persistence, and preview
- E2E spec covering all app modes (locked, disabled, maintenance), notification popup, help/privacy pages, and question visibility settings with legacy spec cleanup
- Voter E2E test foundation with 3 dataset files, 4 page objects, parameterizable answer fixture, and single-constituency auto-implication for simple voter journey path
- Serial E2E spec covering voter happy path from home through auto-implied election/constituency, intro page, and all 16 Likert questions with previous/skip/re-answer navigation to results
- E2E specs for voter results display (11 candidates, 4 parties, entity type tabs) and entity detail drawers with info/opinions/candidates tab navigation
- Independent @openvaa/matching algorithm verification E2E spec with tier-based ranking comparison across 16 questions and 11 visible candidates from combined datasets
- 16 new testId constants and voter-settings.spec.ts covering category selection, category/question intros, minimum answers threshold, and results link visibility
- E2E spec covering feedback popup timing, survey popup multi-setting config, disabled-state verification, and dismissal memory persistence
- E2E spec for about, info, privacy, and nominations pages with showAllNominations setting gate verification
- Fixed voter-settings and voter-popups specs with complete sibling settings, serial project execution, and global popup suppression
- Fixed nominations E2E test by adding null safety to EntityCard and entityCards.ts cardContents access, plus complete sibling settings in all updateAppSettings calls
- Overlay dataset merge utility, 3 variant JSON overlays (multi-election, constituency, startFromConstituencyGroup), 3 setup projects, shared teardown, and 8 Playwright config entries with sequential dependency chains
- Multi-election voter journey spec with election selection, per-election results accordion, disallowSelection bypass, and results-sections spec with candidates-only/organizations-only/both settings toggles
- Constituency selection E2E tests covering hierarchical constituency implication, multi-election+constituency combined flow, and startFromConstituencyGroup reversed flow with orphan municipality edge case
- Updated GitHub Actions e2e-tests job with Playwright --with-deps, mock data override, and removal of stale sleep/report steps
- Playwright tag metadata on all 16 spec files enabling selective --grep @smoke/@candidate/@voter/@variant test execution
- Playwright visual regression suite with 4 screenshot tests covering voter results and candidate preview at desktop/mobile viewports, env-gated for opt-in execution
- Navigation Timing performance budget for voter results page (8s/15s Docker dev thresholds) with non-blocking GitHub Actions CI job for visual and perf test execution
- Supabase CLI workspace at apps/supabase with fully operational local dev stack (Postgres, GoTrue, PostgREST, Storage, Mailpit, Studio) on ports 54320-54327
- @openvaa/supabase-types package with auto-generated Database types from local Supabase stack via supabase gen types CLI
- Two-layer database lint combining Supabase PL/pgSQL checks with custom Splinter-derived RLS and index coverage validation via `yarn supabase:lint`
- 15-table PostgreSQL schema with multi-tenant hierarchy (accounts/projects), JSONB localization via get_localized() with 3-tier fallback, and localized views returning resolved text for voter-facing queries
- App settings table, dual answer storage alternatives with shared 9-type trigger validation, B-tree indexes on all FK columns, RLS on all 17 tables, single-tenant seed data, and COLUMN_MAP/PROPERTY_MAP constants for snake_case/camelCase conversion
- QuestionTemplate class extending DataObject with type, settings, defaultChoices properties and full DataRoot integration following TDD
- user_roles table with Custom Access Token Hook injecting roles into JWT, SECURITY DEFINER RLS helpers (has_role, can_access_project, is_candidate_self), auth_user_id on entities, and published flags on 10 tables
- 79 per-operation RLS policies replacing 16 deny-all placeholders, with column-level structural field protection on candidates and organizations
- One-liner:
- Deno Edge Function for admin-initiated candidate pre-registration using inviteUserByEmail with JWT role verification and candidate record creation
- Signicat OIDC bank auth Edge Function with JWE decryption via jose, identity claim extraction, auto-provisioning of Supabase auth user + candidate record, and magic link session generation
- Complete pgbench + k6 benchmark toolkit for JSONB vs relational answer storage with data generation at 1K/5K/10K scale, schema swap automation, and orchestrated A/B comparison
- Executed JSONB vs relational benchmarks at 1K/5K/10K scale with concurrency scaling, wrote answer storage decision document choosing JSONB with HIGH confidence
- Storage buckets with 15 RLS policies, StoredImage validation, and pg_net cleanup triggers across 11 entity tables
- external_id columns on 12 content tables with immutability trigger, plus bulk_import/bulk_delete RPC functions using dynamic SQL upsert with external_id relationship resolution
- send-email Edge Function with multilingual template resolution via resolve_email_variables RPC, plus regenerated migration and TypeScript types for all Phase 12 schema work
- pgTAP test infrastructure with shared helpers plus 51 assertions verifying tenant isolation across 11 tables and candidate self-edit access control
- 103 pgTAP assertions covering anonymous read/write denial on all tables, three-tier admin CRUD with project scoping, and party admin organization/candidate visibility boundaries
- 55 pgTAP assertions covering storage bucket RLS, RPC function security models, data integrity triggers (answer/nomination/external_id), and column-level UPDATE protections on candidates and organizations
- Fixed bulk_import ON CONFLICT partial index, storage trigger search_path, password reset redirect, and missing Supabase env vars
- Three schema objects added for frontend adapter: app_settings.customization JSONB column, candidates.terms_of_use_accepted timestamp, and upsert_answers SECURITY INVOKER RPC with null-stripping merge semantics
- Anonymous feedback table with CHECK constraint, anon INSERT / admin SELECT+DELETE RLS, and IP-based rate limiting via private schema counter table
- 40 pgTAP tests verifying column existence/types, RLS policies, CHECK constraints, rate limiting, and upsert_answers RPC merge/overwrite/null-stripping behavior for all Phase 22 schema objects
- Regenerated @openvaa/supabase-types database.ts from Phase 22 schema and added termsOfUseAccepted to COLUMN_MAP for downstream adapter consumption
- SupabaseDataAdapter settings type, env constants, row mapping utilities (mapRow/mapRowToDb via COLUMN_MAP), and getLocalized JSONB 3-tier fallback utility with 20 unit tests
- supabaseAdapterMixin with typed SupabaseClient<Database>, 3 stub adapter classes (22 abstract methods), and dynamic import switch wiring
- Supabase GoTrue auth methods in SupabaseDataWriter with TDD (11 tests) and PKCE callback route handling recovery, invite, email, and signup redirects
- Session-based hooks route guard, layout loaders, and AuthContext replacing Strapi JWT token auth with safeGetSession-derived auth state
- All auth route consumers wired to DataWriter adapter, authToken replaced with isAuthenticated in all three consumer files, protected layouts session-based, and all Strapi auth files deleted for clean break
- localizeRow with nested dot-notation, toDataObject localize-then-map pipeline, and parseStoredImage Storage URL converter for all DataProvider methods
- get_nominations RPC joining 4 entity tables in single round trip, plus DPDataType extended with NominationVariantTree and EntityVariantTree union types
- _getAppSettings, _getAppCustomization, _getElectionData, and _getConstituencyData with PostgREST queries, localization, image URL conversion, and join table extraction
- Complete SupabaseDataProvider with _getEntityData (candidates/organizations with answers), _getQuestionData (categories with choice label localization), and _getNominationData (RPC with entity deduplication)
- Narrowed DataWriter write method return types to LocalizedAnswers/UpdatedEntityProps, removed checkRegistrationKey from entire interface chain, and implemented invite-based registration flow
- get_candidate_user_data RPC and _getBasicUserData/_getCandidateUserData methods extracting user data from JWT session and database entity row
- Implemented _setAnswers with upsert_answers RPC, File-to-Storage upload with UUID paths, and _updateEntityProperties for termsOfUseAccepted via PostgREST
- admin_jobs table with admin-only RLS and merge_custom_data SECURITY INVOKER RPC for shallow JSONB merge on questions.custom_data
- _updateQuestion calls merge_custom_data RPC with JSONB patch; _insertJobResult resolves project_id from elections then inserts into admin_jobs
- invite-candidate and send-email Edge Functions wired into SupabaseDataWriter with projectId resolution and camelCase-to-snake_case param mapping
- Dual-adapter preregister route with Supabase Edge Function invocation and verifyOtp session establishment for Signicat bank auth
- Stateless SupabaseAdminClient with 14 async methods wrapping @supabase/supabase-js service_role, plus jsonb_recursive_merge RPC for deep-merging app_settings
- Convert 6 test dataset files from Strapi camelCase to Supabase-native snake_case with questionType inlining, party->organization rename, and project_id/published additions
- Inbucket email helper, 6 Supabase-backed setup/teardown projects, and frontend data adapter switched to supabase
- Migrate all 10 E2E spec files from StrapiAdminClient to SupabaseAdminClient with simplified method signatures, removed Pitfall 2 workarounds, and eliminated login/dispose lifecycle
- Removed all Strapi adapter code, backend directory (59K+ lines), type definitions, workspace entries, and dead test files
- Docker compose rewritten as production-build test tool, .env.example stripped to Supabase-only essentials, dev scripts rewired to supabase CLI
- CI workflow purged of all Strapi references, E2E tests use supabase CLI, pgTAP job with path filtering, Render blueprint frontend-only with Supabase env vars
- CLAUDE.md rewritten for Supabase-only workflow, 22 docs pages updated with Strapi references removed or replaced with Supabase migration stubs

---

## v3.0 Frontend Adapter (Shipped: 2026-03-20)

**Phases completed:** 9 phases (22-30), 28 plans executed
**Timeline:** 2026-03-18 → 2026-03-20 (3 days)
**Requirements:** 36/36 satisfied
**Code:** 518 files changed, +39,224 / -86,367 lines (net -47,143 due to Strapi removal)

**Key accomplishments:**

- Supabase frontend adapter (DataProvider, DataWriter, AdminWriter) replacing Strapi across all read/write operations
- Auth migration from Strapi JWT to Supabase cookie-based sessions with PKCE flow
- Edge Function integration for candidate invite, bank authentication, and transactional email
- Full E2E test suite migrated from Strapi to Supabase backend (Playwright + Supabase admin client)
- Complete Strapi removal — 285 files deleted, backend/vaa-strapi/ and adapter directory gone
- Dev environment rewired to supabase CLI (supabase start + vite dev), Docker Compose reduced to production-build test tool

**Deferred items:**

- Admin app UI (ADMIN-01, ADMIN-02, ADMIN-03) — separate milestone
- Merge app_settings and app_customization (SETT-01) — future cleanup
- Comprehensive Supabase developer documentation — future docs effort

---

## v5.0 Claude Skills (Shipped: 2026-03-18)

**Phases completed:** 6 phases (16-21), 11 plans executed
**Timeline:** 2026-03-15 → 2026-03-16 (2 days)
**Requirements:** 26/26 satisfied
**Deliverables:** 6 skill directories, 15 skill files, ~2,200 LOC reference content

**Key accomplishments:**

- Domain-expert skills for data, matching, filters, and database packages with auto-triggering descriptions
- Step-by-step extension patterns for adding entity types, question types, distance metrics, filter types, and database objects
- Complete schema reference (17 tables), RLS policy map (97 policies), and algorithm reference for the matching package
- Object model reference with 21 concrete types, DataRoot collection getters, and factory function documentation
- Quality validation: cross-cutting scenario testing, triggering accuracy validation, content deduplication audit
- Skill drift audit script (`.claude/scripts/audit-skill-drift.sh`) with CI integration for detecting stale skills

**Deferred skills:**

- Architect skill (ARCH-01) — deferred to post-Svelte 5 migration (needs stabilized frontend architecture)
- Components skill (COMP-01) — deferred to post-Svelte 5 migration (component patterns will change)
- LLM skill (LLM-01) — deferred (lowest priority package)

---

## v2.0 Supabase Migration (Shipped: 2026-03-15)

**Phases completed:** 8 phases (8-15), 21 plans executed
**Timeline:** 2026-03-12 → 2026-03-15 (4 days)
**Requirements:** 40/40 satisfied
**Code:** ~10,100 LOC (schema SQL, test SQL, benchmarks, TS types, Edge Functions)

**Key accomplishments:**

- Full Supabase backend with 17-table multi-tenant schema, JSONB localization, and dual answer storage alternatives
- GoTrue authentication with 5 role types, 79 RLS policies, custom JWT claims via Access Token Hook
- Comprehensive load testing at 1K/5K/10K scale — JSONB answer storage chosen with HIGH confidence
- Storage buckets with RLS, bulk import/delete RPCs, and transactional email Edge Functions
- 204 pgTAP tests covering tenant isolation, access control, triggers, and column restrictions
- Bank authentication (Signicat OIDC) via Edge Function with JWE decryption and auto-provisioning

---

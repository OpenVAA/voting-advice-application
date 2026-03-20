# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Supabase Migration

**Shipped:** 2026-03-15
**Phases:** 8 | **Plans:** 21 | **Timeline:** 4 days

### What Was Built
- 17-table multi-tenant PostgreSQL schema with JSONB localization and dual answer storage alternatives
- GoTrue authentication with 5 role types, 79 RLS policies, and JWT custom claims via Access Token Hook
- Load testing toolkit (pgbench + k6) at 1K/5K/10K scale — JSONB answer storage chosen with HIGH confidence
- Storage buckets with RLS, bulk import/delete RPCs with external_id relationship resolution
- 3 Edge Functions: candidate invite, Signicat bank auth with JWE, transactional email
- 204 pgTAP tests across 10 test files covering tenant isolation, access control, triggers, and column restrictions

### What Worked
- Schema-first approach: designing tables, RLS, and indexes before services kept integration clean
- Load testing before committing to answer storage saved a potential rework
- pgTAP tests caught real bugs (ON CONFLICT partial index, search_path in SECURITY DEFINER) before they reached production
- Gap closure phases (14, 15) efficiently caught and fixed issues from the milestone audit
- Removing question_templates was the right call — it simplified the schema and deferred complexity to admin tooling

### What Was Inefficient
- Phase 15 plan was created to restore QuestionTemplate code from git history, then immediately invalidated by the decision to remove it entirely — the research/plan cycle could have been avoided with earlier discussion
- Phase 8 VERIFICATION.md was written when seed.sql was still empty (resolved later but created a persistent gap_found status)
- Some Edge Functions (invite-candidate, send-email) were built without frontend callers — they work but are untestable end-to-end until v3+

### Patterns Established
- Schema-qualified function calls in SECURITY DEFINER contexts (`public.delete_storage_object`, not `delete_storage_object`)
- ON CONFLICT WHERE predicates must exactly match partial unique index definitions
- external_id pattern for idempotent bulk import/export without exposing internal UUIDs
- COLUMN_MAP/PROPERTY_MAP for snake_case DB ↔ camelCase TypeScript conversion

### Key Lessons
1. Always run the milestone audit before gap closure planning — the audit identified 4 real bugs that were fixable in a single phase
2. Design decisions (like removing question_templates) should be surfaced early in discuss-phase, not discovered during planning
3. Edge Functions can be built and tested in isolation, but end-to-end verification requires the consuming frontend — accept this gap for backend-first milestones

### Cost Observations
- Model mix: ~60% opus (orchestration, execution), ~30% sonnet (verification, plan checking), ~10% haiku
- Notable: Single-plan phases (14, 15) executed very efficiently; multi-plan phases (9, 10) benefited from wave-based parallelization

---

## Milestone: v3.0 — Frontend Adapter

**Shipped:** 2026-03-20
**Phases:** 9 | **Plans:** 28 | **Timeline:** 3 days

### What Was Built
- Supabase frontend adapter replacing Strapi across all read/write/admin operations (DataProvider, DataWriter, AdminWriter)
- Auth migration from Strapi JWT to Supabase cookie-based sessions with PKCE flow
- Edge Function integration: candidate invite, bank auth (Signicat OIDC), transactional email
- Full E2E test suite migrated from Strapi to Supabase (admin client, data seeding, auth setup)
- Complete Strapi removal: 285 files deleted, backend/vaa-strapi/ gone, adapter directory gone
- Dev environment rewired to `supabase start` + SvelteKit dev server, Docker Compose reduced to production-build test tool
- CI pipeline updated: backend-validation removed, pgTAP job added, E2E uses supabase CLI

### What Worked
- Dependency-ordered phases (schema → foundation → auth → reads → writes → admin → edge → tests → cleanup) prevented rework
- The adapter mixin pattern (supabaseAdapterMixin) provided clean shared infrastructure for all three adapter classes
- Wave-based parallelization in Phase 30 (plans 02+03 in parallel) was efficient for independent infrastructure changes
- Phase 29 (E2E migration) proving Supabase-only workflow before Phase 30 (Strapi removal) eliminated risk
- Research identified that jose and qs packages must be kept — prevented a broken build

### What Was Inefficient
- Phase 30 documentation task (30-04) was the slowest plan despite being "just docs" — 22 pages to update is significant work
- Some plan checkboxes in ROADMAP.md were not updated by executors (stayed as `[ ]` instead of `[x]`)
- SUMMARY.md one_liner fields were not consistently populated, making milestone accomplishment extraction manual

### Patterns Established
- supabaseAdapterMixin with init({ fetch }) for SSR compatibility across all adapter classes
- Cookie-based PKCE sessions with httpOnly cookies and safeGetSession (not getSession) for route guards
- Stub docs pattern: removed Strapi pages replaced with stubs pointing to equivalent Supabase documentation
- get_candidate_user_data RPC for deriving user context (role, election, constituency, nomination) from session

### Key Lessons
1. Removal phases are deceptively complex — Strapi had references in 243+ files across code, config, CI, docs, and Docker
2. Research phase is critical even for "just delete" work — the exhaustive grep caught edge cases (Dockerfile COPY, dead test files)
3. Keep jose/qs analysis is the kind of nuance that prevents broken builds — always verify package usage before removal
4. Documentation cleanup should be a separate plan (as it was) — mixing code deletion with doc updates creates overly large commits

### Cost Observations
- Model mix: ~70% opus (execution), ~20% sonnet (verification, plan checking), ~10% research
- Notable: 9 phases with 28 plans completed in 3 days — dependency-ordered execution minimized wait time
- Phase 30 (removal) was fastest conceptually but slowest in docs cleanup

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v2.0 | 4 days | 8 | Schema-first backend build with load testing validation |
| v3.0 | 3 days | 9 | Dependency-ordered adapter migration with E2E proof before cleanup |

### Cumulative Quality

| Milestone | DB Tests | E2E Tests | Unit Tests |
|-----------|----------|-----------|------------|
| v2.0 | 204 pgTAP | (existing) | (existing) |
| v3.0 | 229 pgTAP | Migrated to Supabase | 84+ adapter tests |

### Top Lessons (Verified Across Milestones)

1. Test infrastructure before feature code — pgTAP tests caught 2 real bugs in schema functions
2. Load test before committing to storage patterns — avoided potential JSONB→relational rework
3. Prove new stack works end-to-end (E2E) before removing old stack — eliminates removal risk
4. Research phase catches edge cases even for "simple" removal work — 243+ Strapi references across codebase

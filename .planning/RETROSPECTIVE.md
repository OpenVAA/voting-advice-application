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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v2.0 | 4 days | 8 | Schema-first backend build with load testing validation |

### Cumulative Quality

| Milestone | DB Tests | E2E Tests | Unit Tests |
|-----------|----------|-----------|------------|
| v2.0 | 204 pgTAP | (existing) | (existing) |

### Top Lessons (Verified Across Milestones)

1. Test infrastructure before feature code — pgTAP tests caught 2 real bugs in schema functions
2. Load test before committing to storage patterns — avoided potential JSONB→relational rework

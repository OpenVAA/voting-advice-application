# Milestones

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

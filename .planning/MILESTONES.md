# Milestones

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


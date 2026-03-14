---
phase: 12
slug: services
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (Phase 13 scope) + manual verification |
| **Config file** | None yet -- Phase 13 will add pgTAP infrastructure |
| **Quick run command** | `supabase db reset` + verify in Studio / manual scripts |
| **Full suite command** | Full schema rebuild + all manual checks |
| **Estimated runtime** | ~30 seconds (schema rebuild) |

---

## Sampling Rate

- **After every task commit:** Run `supabase db reset` + manual verification
- **After every plan wave:** Run full schema rebuild + all manual checks
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | SRVC-01 | smoke | `supabase db reset` + verify buckets in Studio | No -- Wave 0 | ⬜ pending |
| 12-01-02 | 01 | 1 | SRVC-02 | manual | Upload via JS SDK + verify public URL | No -- Wave 0 | ⬜ pending |
| 12-02-01 | 02 | 1 | SRVC-03 | smoke | `curl http://127.0.0.1:54324` | No -- manual | ⬜ pending |
| 12-02-02 | 02 | 1 | SRVC-04 | integration | `SELECT bulk_import(...)` + verify rows | No -- Wave 0 | ⬜ pending |
| 12-02-03 | 02 | 1 | SRVC-05 | integration | `SELECT bulk_delete(...)` + verify rollback | No -- Wave 0 | ⬜ pending |
| 12-02-04 | 02 | 2 | SRVC-06 | integration | `curl` Edge Function + check Inbucket | No -- Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Schema file `014-storage.sql` -- storage bucket creation + RLS policies
- [ ] Schema file `015-external-id.sql` -- external_id columns + immutability trigger
- [ ] Schema file `016-bulk-operations.sql` -- RPC functions for bulk import/delete
- [ ] Edge Function `send-email/index.ts` -- email sending function
- [ ] Migration regenerated: `00001_initial_schema.sql` updated
- [ ] Type regeneration: `packages/supabase-types/` updated after schema changes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Candidate photo upload/serve | SRVC-02 | Requires JS SDK client + browser | Upload via SDK, verify public URL loads in browser |
| Mailpit web UI accessible | SRVC-03 | UI smoke test | Navigate to `http://127.0.0.1:54324`, verify inbox visible |
| Email arrives in Inbucket | SRVC-06 | Requires Edge Function invocation + Inbucket inspection | Invoke Edge Function via curl, check Inbucket inbox for message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

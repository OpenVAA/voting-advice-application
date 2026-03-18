---
phase: 23
slug: adapter-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^2.1.8 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && yarn vitest run src/lib/api/adapters/supabase` |
| **Full suite command** | `cd frontend && yarn test:unit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && yarn vitest run src/lib/api/adapters/supabase`
- **After every plan wave:** Run `cd frontend && yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | ADPT-02 | unit | `cd frontend && yarn vitest run src/lib/api/adapters/supabase/utils/mapRow.test.ts -x` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | ADPT-02 | unit | Same test file | ❌ W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | ADPT-02 | unit | Same test file | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 1 | ADPT-03 | unit | `cd frontend && yarn vitest run src/lib/api/adapters/supabase/utils/getLocalized.test.ts -x` | ❌ W0 | ⬜ pending |
| 23-02-02 | 02 | 1 | ADPT-03 | unit | Same test file | ❌ W0 | ⬜ pending |
| 23-02-03 | 02 | 1 | ADPT-03 | unit | Same test file | ❌ W0 | ⬜ pending |
| 23-02-04 | 02 | 1 | ADPT-03 | unit | Same test file | ❌ W0 | ⬜ pending |
| 23-03-01 | 03 | 1 | ADPT-01 | unit | `cd frontend && yarn vitest run src/lib/api/adapters/supabase/supabaseAdapter.test.ts -x` | ❌ W0 | ⬜ pending |
| 23-04-01 | 04 | 2 | ADPT-04 | manual | Visual inspection — runtime testing requires full app context | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts` — stubs for ADPT-02 (mapRow, mapRowToDb, mapRows)
- [ ] `frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts` — stubs for ADPT-03 (3-tier fallback, null handling)
- [ ] `frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts` — stubs for ADPT-01 (mixin creates typed class)

*Existing vitest infrastructure covers all phase requirements — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Switch files load supabase adapter | ADPT-04 | Requires full SvelteKit app context with env vars | Set `staticSettings.dataAdapter.type = 'supabase'`, start dev, verify no import errors in console |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

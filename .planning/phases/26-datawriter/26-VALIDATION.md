---
phase: 26
slug: datawriter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.0.5 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | WRIT-01 | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | ✅ (extend) | ⬜ pending |
| 26-01-02 | 01 | 1 | WRIT-02 | unit | same | ✅ (extend) | ⬜ pending |
| 26-02-01 | 02 | 1 | WRIT-03 | unit | same | ✅ (extend) | ⬜ pending |
| 26-03-01 | 03 | 2 | WRIT-04 | unit | same | ✅ (extend) | ⬜ pending |
| 26-03-02 | 03 | 2 | WRIT-04 | unit | same | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend mock Supabase client in `supabaseDataWriter.test.ts` with `rpc`, `from`, `storage.from.upload`, `auth.getSession` mocks

*Existing infrastructure covers most phase requirements. Only mock extension needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Registration flow end-to-end (invite link -> token exchange -> password set) | WRIT-03 | Requires Supabase auth flow with email invite | 1. Create invite via admin, 2. Click invite link, 3. Verify redirect to register page, 4. Set password, 5. Verify session established |
| Image upload via Storage in _setAnswers | WRIT-01 | Requires running Supabase Storage service | 1. Save answer containing File object, 2. Verify file appears in Storage bucket, 3. Verify answer value contains Storage path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

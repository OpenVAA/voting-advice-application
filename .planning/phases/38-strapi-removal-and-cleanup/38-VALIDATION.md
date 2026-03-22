---
phase: 38
slug: strapi-removal-and-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 38 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + grep verification (deletion) |
| **Config file** | `vitest.config.ts` (root and apps/frontend/) |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:unit && yarn build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit`
- **After every plan wave:** Run `yarn test:unit && yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 38-01-01 | 01 | 1 | CLEN-01 | deletion | `test ! -d apps/strapi/` | N/A | pending |
| 38-01-02 | 01 | 1 | CLEN-01 | grep | `grep -c 'strapi.*plugins' package.json` returns 0 | existing | pending |
| 38-02-01 | 02 | 1 | CLEN-02 | deletion | `test ! -d apps/frontend/src/lib/api/adapters/strapi/` | N/A | pending |
| 38-02-02 | 02 | 1 | CLEN-02 | deletion | `test ! -f apps/frontend/src/lib/auth/authToken.ts` | N/A | pending |
| 38-02-03 | 02 | 1 | CLEN-02 | unit | `yarn test:unit` | existing | pending |
| 38-03-01 | 03 | 2 | CLEN-03, CLEN-04 | grep | `grep 'supabase:start' package.json` | existing | pending |
| 38-03-02 | 03 | 2 | CLEN-05 | grep | `grep 'PUBLIC_SUPABASE_URL' .env.example` | N/A | pending |
| 38-04-01 | 04 | 2 | CLEN-02 | grep | `grep -ri 'strapi' --include='*.ts' apps/frontend/src/ \| grep -v node_modules` returns 0 non-comment matches | N/A | pending |
| 38-04-02 | 04 | 2 | CLEN-01 | build | `yarn build` | existing | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. This phase is primarily deletion and config rewriting — no new test stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No Strapi refs remain in non-planning files | CLEN-01..05 | Requires human judgment on historical mentions vs active code | Run `grep -ri strapi . --include='*.ts' --include='*.json' --include='*.yml' --include='*.md' \| grep -v .planning/ \| grep -v node_modules/` and verify only docs historical mentions remain |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

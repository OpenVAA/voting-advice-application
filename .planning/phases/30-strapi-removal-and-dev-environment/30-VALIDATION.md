---
phase: 30
slug: strapi-removal-and-dev-environment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (E2E) + Vitest 2.1.8 (unit) |
| **Config file** | `tests/playwright.config.ts` (E2E), `vitest.config.ts` (unit) |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | ~60 seconds (unit), ~180 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit` + `yarn workspace @openvaa/frontend build`
- **After every plan wave:** Run `yarn install && yarn build:shared && yarn workspace @openvaa/frontend build`
- **Before `/gsd:verify-work`:** Full suite must be green + `grep -r "strapi\|STRAPI\|vaa-strapi" --include='*.{ts,js,json,yaml,yml}' . | grep -v node_modules | grep -v .planning | grep -v .git` returns empty
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | ENVR-02 | smoke | `test ! -d frontend/src/lib/api/adapters/strapi && echo PASS` | N/A | ⬜ pending |
| 30-01-02 | 01 | 1 | ENVR-05 | unit | `yarn workspace @openvaa/frontend build` | ✅ | ⬜ pending |
| 30-02-01 | 02 | 2 | ENVR-03 | smoke | `test ! -d backend/vaa-strapi && echo PASS` | N/A | ⬜ pending |
| 30-03-01 | 03 | 3 | ENVR-04 | smoke | `! grep -q strapi docker-compose.dev.yml && echo PASS` | N/A | ⬜ pending |
| 30-03-02 | 03 | 3 | ENVR-01 | manual | Manual: `yarn dev` works with supabase start | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a removal phase — no new test framework or stubs needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Local dev starts with supabase start + vite dev | ENVR-01 | Requires running services and verifying full dev workflow | 1. Run `supabase start` 2. Run `yarn workspace @openvaa/frontend dev` 3. Verify app loads at localhost:5173 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

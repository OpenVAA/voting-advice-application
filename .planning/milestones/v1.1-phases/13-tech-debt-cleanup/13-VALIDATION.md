---
phase: 13
slug: tech-debt-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-15
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit), Playwright (E2E) |
| **Config file** | `vitest.config.ts` (root), `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run grep verification commands
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** All 5 grep checks must return 0
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | SC-1, SC-2 | grep | `grep 'cd \.\./\.\.' .husky/pre-commit && grep -r STRAPI_DIR tests/ \| wc -l` (cd depth match + count 0) | N/A | pending |
| 13-02-01 | 02 | 1 | SC-5 | grep | `grep -r 'yarn@4\.6\|YARN_VERSION=4\.6\|"4\.6"' apps/ package.json \| wc -l` (should be 0) | N/A | pending |
| 13-02-02 | 02 | 1 | SC-5 | grep | `grep 'setup-yarn-action' .github/workflows/docs.yml && grep 'frozen-lockfile' .github/workflows/docs.yml` | N/A | pending |
| 13-03-01 | 03 | 1 | SC-3 | grep | `grep -r 'backend/vaa-strapi' apps/docs/src/ \| wc -l` (should be 0) | N/A | pending |
| 13-03-02 | 03 | 1 | SC-4 | grep | `grep -r 'tsc-esm-fix' packages/*/README.md \| wc -l` (should be 0) | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

No test infrastructure needed -- all validations are grep-based verification commands for config/docs changes.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `.husky/pre-commit` cd depth | SC-1 | Config file, no test runner | Verify `cd ../..` in pre-commit hook |
| No STRAPI_DIR export | SC-2 | Dead code removal | Grep for STRAPI_DIR in tests/ |
| No old doc paths | SC-3 | Documentation update | Grep for backend/vaa-strapi in docs |
| No tsc-esm-fix refs | SC-4 | README update | Grep for tsc-esm-fix in package READMEs |
| Yarn version consistency | SC-5 | Config files | Grep for old 4.6 version strings |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 10
slug: version-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (CI/CD infrastructure — no unit test framework needed) |
| **Config file** | N/A — validation via file existence checks and CLI commands |
| **Quick run command** | `test -f .changeset/config.json && yarn changeset status` |
| **Full suite command** | `test -f .changeset/config.json && yarn changeset status && test -f .github/workflows/release.yml` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `test -f .changeset/config.json && yarn changeset status`
- **After every plan wave:** Run `test -f .changeset/config.json && yarn changeset status && test -f .github/workflows/release.yml`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | VER-01 | smoke | `test -f .changeset/config.json && yarn changeset status` | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | VER-01 | smoke | `grep -q '"changeset"' package.json` | N/A | ⬜ pending |
| 10-01-03 | 01 | 1 | VER-02 | smoke | `grep -q 'changelog-github' .changeset/config.json` | N/A | ⬜ pending |
| 10-02-01 | 02 | 1 | VER-03 | smoke | `test -f .github/workflows/release.yml` | N/A | ⬜ pending |
| 10-02-02 | 02 | 1 | VER-05 | smoke | `grep -q '# publish:' .github/workflows/release.yml` | N/A | ⬜ pending |
| 10-02-03 | 02 | 1 | VER-03 | smoke | `grep -q 'changesets/action' .github/workflows/release.yml` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase creates config files and CI workflows — no test framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Changeset bot comments on PRs | VER-04 | Requires GitHub App installation by org admin | 1. Install changeset-bot from https://github.com/apps/changeset-bot 2. Open a PR without a changeset 3. Verify bot posts a reminder comment |
| Version PR created on merge | VER-03 | Requires pushing changeset to main and observing workflow | 1. Create a changeset (`yarn changeset`) 2. Merge PR to main 3. Verify "Version Packages" PR is created |
| CHANGELOG.md generated correctly | VER-02 | Requires running `changeset version` with real changesets | 1. After version PR merges, inspect per-package CHANGELOG.md files 2. Verify PR links are present via changelog-github plugin |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

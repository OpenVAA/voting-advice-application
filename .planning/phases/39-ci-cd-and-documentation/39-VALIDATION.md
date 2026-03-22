---
phase: 39
slug: ci-cd-and-documentation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (grep/diff-based verification) + yamllint |
| **Config file** | none — CI/docs changes verified by structure/content checks |
| **Quick run command** | `grep -c 'supabase' .github/workflows/main.yaml` |
| **Full suite command** | `bash -c 'yamllint .github/workflows/main.yaml && grep -L "Strapi" apps/docs/src/lib/navigation.config.ts'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run grep-based content checks on modified files
- **After every plan wave:** Verify all CICD-* requirement checklist items
- **Before `/gsd:verify-work`:** Full content audit for Strapi references
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | CICD-01 | content | `grep -c 'skill-drift-check' .github/workflows/main.yaml` | N/A | pending |
| 39-01-02 | 01 | 1 | CICD-01 | content | `grep -c 'supabase-tests' .github/workflows/main.yaml` | N/A | pending |
| 39-01-03 | 01 | 1 | CICD-01 | content | `grep -c 'supabase start' .github/workflows/main.yaml` | N/A | pending |
| 39-02-01 | 02 | 1 | CICD-01 | file | `test -f .claude/scripts/audit-skill-drift.sh` | N/A | pending |
| 39-03-01 | 03 | 2 | CICD-02 | content | `grep -c 'supabase' CLAUDE.md` | N/A | pending |
| 39-04-01 | 04 | 2 | CICD-04 | content | `grep -rL 'legacy Strapi' apps/docs/src/routes` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — this phase modifies config and docs only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI workflow runs in GitHub Actions | CICD-01 | Requires GitHub Actions runner | Push branch and verify checks pass |
| Render blueprint deploys correctly | CICD-03 | Requires Render account | Deploy using render.example.yaml |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

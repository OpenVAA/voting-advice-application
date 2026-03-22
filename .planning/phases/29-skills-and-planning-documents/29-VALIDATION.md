---
phase: 29
slug: skills-and-planning-documents
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell commands (file presence + content grep) |
| **Config file** | none — no test framework needed for documentation phase |
| **Quick run command** | `ls .claude/skills/data/SKILL.md .claude/skills/matching/SKILL.md .claude/skills/filters/SKILL.md .claude/skills/database/SKILL.md` |
| **Full suite command** | `ls .claude/skills/**/*.md && grep -l "RLS" .agents/code-review-checklist.md && grep -c "Decision" .planning/PROJECT.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run quick file presence check
- **After every plan wave:** Run full suite — verify all files present and content correct
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | SKIL-01 | file presence | `ls .claude/skills/{data,matching,filters,database}/SKILL.md` | N/A | pending |
| 29-01-02 | 01 | 1 | SKIL-01 | content grep | `grep -l "targets:" .claude/skills/data/SKILL.md` | N/A | pending |
| 29-02-01 | 02 | 1 | SKIL-02 | content grep | `grep -l "RLS" .agents/code-review-checklist.md` | N/A | pending |
| 29-03-01 | 03 | 2 | PLAN-01 | content grep | `grep -c "JSONB answer storage" .planning/PROJECT.md` | N/A | pending |
| 29-03-02 | 03 | 2 | PLAN-02 | content grep | `grep -c "Skill drift CI check" .planning/REQUIREMENTS.md` | N/A | pending |
| 29-04-01 | 04 | 2 | PLAN-03 | content grep | `grep -c "v2.0 — Supabase Migration" .planning/RETROSPECTIVE.md` | N/A | pending |
| 29-04-02 | 04 | 2 | PLAN-04 | file presence | `ls .planning/milestones/sb-v2.0-ROADMAP.md` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework or stubs needed — this is a documentation-only phase verified by file presence and content grep.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skills content accuracy | SKIL-01 | Semantic correctness requires human review | Spot-check 2-3 skills against actual package source |
| Checklist item quality | SKIL-02 | Wording quality is subjective | Read new checklist items, verify they're actionable |
| Key Decisions consistency | PLAN-01 | Table formatting and deduplication | Verify no duplicate "Test IDs over text selectors" entry |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 20
slug: database-skill
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (docs-only phase -- no source code changes) |
| **Config file** | none |
| **Quick run command** | `test -f .claude/skills/database/SKILL.md && wc -l .claude/skills/database/SKILL.md` |
| **Full suite command** | `ls -la .claude/skills/database/ && wc -l .claude/skills/database/*.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run quick run command to verify file exists and size is reasonable
- **After every plan wave:** Run full suite command to verify all reference files present
- **Before `/gsd:verify-work`:** Full suite must show all expected files with correct section headers
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | DB-01, DB-02, DB-03, DB-04, DB-05 | file check | `grep -c "## Schema Conventions" .claude/skills/database/SKILL.md` | existing | pending |
| 20-02-01 | 02 | 1 | DB-06 | file check | `test -f .claude/skills/database/schema-reference.md` | new | pending |
| 20-02-02 | 02 | 1 | DB-06 | file check | `test -f .claude/skills/database/rls-policy-map.md` | new | pending |

*Status: pending -- all tasks awaiting execution*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a documentation-only phase creating Claude Code skill files. No test framework, source code changes, or build tooling needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skill auto-triggers on `apps/supabase/` work | DB-01 | Requires Claude Code runtime | Open a file in `apps/supabase/`, verify Claude loads database skill context |
| Conventions are actionable (not just descriptive) | DB-02 | Requires human judgment | Read conventions section, verify each rule uses imperative voice with DO/NEVER/ALWAYS |
| RLS patterns are complete | DB-03 | Requires domain expertise review | Compare documented policy patterns against actual 010-rls.sql |
| pgTAP patterns enable test writing | DB-05 | Requires human judgment | Read testing section, verify a developer could write a new test file from the guide |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

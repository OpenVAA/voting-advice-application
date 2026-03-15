---
phase: 16
slug: scaffolding-and-claude-md-refactoring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash / file existence checks |
| **Config file** | none — no test framework needed |
| **Quick run command** | `test -d .claude/skills && wc -l CLAUDE.md` |
| **Full suite command** | `bash -c 'test -d .claude/skills/data && test -d .claude/skills/matching && test -d .claude/skills/filters && test -d .claude/skills/database && test -f .claude/skills/BOUNDARIES.md && test -f .claude/skills/data/SKILL.md && test -f .claude/skills/matching/SKILL.md && test -f .claude/skills/filters/SKILL.md && test -f .claude/skills/database/SKILL.md && [ $(wc -l < CLAUDE.md) -le 200 ] && echo PASS || echo FAIL'` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `test -d .claude/skills && wc -l CLAUDE.md`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | SCAF-01 | file check | `test -d .claude/skills/data && test -f .claude/skills/data/SKILL.md` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | SCAF-01 | file check | `test -d .claude/skills/matching && test -f .claude/skills/matching/SKILL.md` | ✅ | ⬜ pending |
| 16-01-03 | 01 | 1 | SCAF-01 | file check | `test -d .claude/skills/filters && test -f .claude/skills/filters/SKILL.md` | ✅ | ⬜ pending |
| 16-01-04 | 01 | 1 | SCAF-01 | file check | `test -d .claude/skills/database && test -f .claude/skills/database/SKILL.md` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 1 | SCAF-02 | line count | `[ $(wc -l < CLAUDE.md) -le 200 ] && echo PASS` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 1 | SCAF-02 | content check | `grep -c "skill" CLAUDE.md` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 1 | SCAF-03 | file check | `test -f .claude/skills/BOUNDARIES.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No test framework needed — all validation is file existence and content checks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skill descriptions contain natural trigger phrases | SCAF-01 | Requires human judgment of description quality | Read each SKILL.md description, verify it contains phrases developers would naturally use |
| No domain-specific conventions remain in CLAUDE.md | SCAF-02 | Requires domain knowledge to identify domain-specific content | Read trimmed CLAUDE.md, verify data model, matching, filter, and schema details are absent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

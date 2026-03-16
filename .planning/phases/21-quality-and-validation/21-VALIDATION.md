---
phase: 21
slug: quality-and-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual audit + grep verification |
| **Config file** | none — validation is content audit, not code tests |
| **Quick run command** | `grep -r "MISSING_VALUE\|MISSING_FILTER_VALUE" .claude/skills/ CLAUDE.md` |
| **Full suite command** | `bash -c 'echo "=== Skill files ===" && find .claude/skills -name "*.md" -exec wc -l {} + && echo "=== Cross-refs ===" && grep -rn "cross-reference\|see.*skill\|data skill\|matching skill\|filters skill\|database skill" .claude/skills/'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick grep check
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full audit must be documented
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | QUAL-01 | manual | Cross-cutting scenario matrix execution | N/A | ⬜ pending |
| 21-01-02 | 01 | 1 | QUAL-02 | manual | Natural query trigger matrix execution | N/A | ⬜ pending |
| 21-01-03 | 01 | 1 | QUAL-03 | grep | `diff <(grep -roh '\b[A-Z][a-z]*[A-Z]\w*' CLAUDE.md \| sort -u) <(grep -roh '\b[A-Z][a-z]*[A-Z]\w*' .claude/skills/ \| sort -u)` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework installation needed — this phase is documentation audit.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-cutting scenario activation | QUAL-01 | Skill triggering requires live Claude Code session | Execute 5 cross-cutting scenarios, verify correct skill combination activates |
| Natural query triggering | QUAL-02 | Skill description matching is model-dependent | Test 16 natural queries, verify correct skill triggers |
| Content duplication audit | QUAL-03 | Semantic duplication requires human judgment | Compare CLAUDE.md sections against each skill's content for overlap |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

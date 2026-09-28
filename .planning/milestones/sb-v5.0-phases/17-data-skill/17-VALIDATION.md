---
phase: 17
slug: data-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual review (documentation-only phase) |
| **Config file** | N/A — no code tests needed |
| **Quick run command** | `cat .claude/skills/data/SKILL.md \| wc -l` |
| **Full suite command** | `ls -la .claude/skills/data/` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Verify file exists and is well-formed Markdown
- **After every plan wave:** Cross-reference all file paths mentioned in skill against actual codebase
- **Before `/gsd:verify-work`:** All 5 DATA requirements verified against source code
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | DATA-01, DATA-02, DATA-04 | manual | `test -f .claude/skills/data/SKILL.md && echo OK` | N/A | ⬜ pending |
| 17-02-01 | 02 | 1 | DATA-05 | manual | `test -f .claude/skills/data/object-model.md && echo OK` | N/A | ⬜ pending |
| 17-02-02 | 02 | 1 | DATA-03 | manual | `test -f .claude/skills/data/extension-patterns.md && echo OK` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. This phase creates documentation files, not code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SKILL.md triggers correctly on data work | DATA-01 | Skill triggering is conversation-based | Open new conversation, edit a file in packages/data/, verify skill loads |
| Conventions are actionable rules | DATA-02 | Content quality is subjective | Review each convention against source code; verify it tells Claude what TO DO not just what EXISTS |
| Extension patterns are step-by-step | DATA-03 | Guide completeness requires manual review | Follow the guide for a hypothetical new entity type; verify every file is listed |
| Review checklist catches issues | DATA-04 | Checklist effectiveness requires judgment | Review a sample data PR against the checklist; verify it catches real issues |
| Type hierarchies match source | DATA-05 | Accuracy requires manual cross-reference | Compare every type name and relationship in reference files against actual source code |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

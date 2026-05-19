---
phase: 18
slug: matching-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual review (documentation-only phase) |
| **Config file** | N/A — no code tests needed |
| **Quick run command** | `cat .claude/skills/matching/SKILL.md \| wc -l` |
| **Full suite command** | `ls -la .claude/skills/matching/` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Verify file exists and is well-formed Markdown
- **After every plan wave:** Cross-reference all file paths and formulas mentioned in skill against actual codebase
- **Before `/gsd:verify-work`:** All 5 MATC requirements verified against source code
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | MATC-01, MATC-02, MATC-04 | manual | `test -f .claude/skills/matching/SKILL.md && echo OK` | N/A | ⬜ pending |
| 18-02-01 | 02 | 1 | MATC-05 | manual | `test -f .claude/skills/matching/algorithm-reference.md && echo OK` | N/A | ⬜ pending |
| 18-02-02 | 02 | 1 | MATC-03 | manual | `test -f .claude/skills/matching/extension-patterns.md && echo OK` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. This phase creates documentation files, not code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SKILL.md triggers correctly on matching work | MATC-01 | Skill triggering is conversation-based | Open new conversation, edit a file in packages/matching/, verify skill loads |
| Algorithm conventions are actionable rules | MATC-02 | Content quality is subjective | Review each convention against source code; verify it tells Claude what TO DO not just what EXISTS |
| Extension patterns are step-by-step | MATC-03 | Guide completeness requires manual review | Follow the guide for a hypothetical new distance metric; verify every step is listed |
| Mathematical nuances are accurate | MATC-04 | Formula accuracy requires manual cross-reference | Verify CategoricalQuestion model, directional formula, weight compensation against source + tests |
| Match object structure matches source | MATC-05 | Accuracy requires manual cross-reference | Compare every type name, property, and formula in reference files against actual source code |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

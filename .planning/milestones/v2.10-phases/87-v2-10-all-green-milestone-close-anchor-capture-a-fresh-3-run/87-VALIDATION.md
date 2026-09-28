---
phase: 87
slug: v2-10-all-green-milestone-close-anchor-capture-a-fresh-3-run
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 87 — Validation Strategy

> Per-phase validation contract. Phase 87 is verification infrastructure for the v2.10 milestone-close — the 3-run cold-start gate IS the validation. Nyquist mapping documents how the requirement-level test happens; there are no Wave 0 framework gaps.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E only; pure infrastructure — no Vitest unit-level scope) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --workers=1 --reporter=json --grep "<scoped pattern>"` (diagnostic only) |
| **Full suite command** | `yarn test:e2e --workers=1 --reporter=json > .planning/phases/87-…/post-fix/run-N.json` |
| **Estimated runtime** | ~54 min per full-suite run; ~216 min for the 1-prep + 3-identity gate |

---

## Sampling Rate

- **Per task commit:** N/A — Phase 87 is a single-plan milestone-close. Only the atomic regen commit + final close commit produce code changes; all verification happens BEFORE the regen commit.
- **Per wave merge:** N/A (single plan).
- **Phase gate:** Full 3-run cold-start gate (~216 min wall-time) BEFORE any commit lands.
- **Before `/gsd-verify-work`:** 3-run SHA-identity must be PASS; `/gsd-audit-milestone v2.10` must be clean.
- **Max feedback latency:** ~54 min per run (gate is wall-time-bound, not feedback-bound).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 87-01-01 | 01 | 1 | DETERM-15 | — / — | Fresh 3-run cold-start SHA-identity on FIRST attempt | E2E full-suite × 3 cold-starts | per-run: `yarn test:e2e --workers=1 --reporter=json > post-fix/run-N.json`; verdict: `node sha-identity.mjs` (writes `sha256.txt` PASS/FAIL) | ✅ Existing pipeline — `sha-identity.mjs` forks from Phase 79 | ⬜ pending |
| 87-01-02 | 01 | 2 | DETERM-15 | — / — | Anchor target met (PL ~150-160 + DR exactly 3 + CASCADE 0 or ≤5 + FAILURE-CLASS 0 or ≤2 residual) | Post-regen array-size check | `node .planning/phases/79-…/post-fix/regen-constants.mjs` (writes `regen-output.txt` with `=== PASS_LOCKED_TESTS (N) ===` etc) + grep-verify counts | ✅ Existing pipeline | ⬜ pending |
| 87-01-03 | 01 | 2 | DETERM-15 | — / — | New anchor parity-gate-passes against itself (self-diff PASS) | Direct invocation | `tsx tests/scripts/diff-playwright-reports.ts post-fix/run-3.json post-fix/run-3.json` (expects `PARITY GATE: PASS`) | ✅ Phase 86 Plan 04 Task 4 precedent | ⬜ pending |
| 87-01-04 | 01 | 3 | DETERM-15 | — / — | `/gsd-audit-milestone v2.10` clean; status = shippable (or shippable-with-debt accepted) | Skill invocation | `/gsd-audit-milestone v2.10` → reads `.planning/v2.10-MILESTONE-AUDIT.md` | ✅ Skill at `$HOME/.claude/skills/gsd-audit-milestone/` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — existing test infrastructure (Phase 79 → 86) covers all phase requirements.
- `sha-identity.mjs` will be forked into `.planning/phases/87-…/post-fix/` (Phase 79 D-12 precedent).
- `regen-constants.mjs` lives in Phase 79's `post-fix/` and is edited in-place (Phase 84 D-05 precedent).
- `diff-playwright-reports.ts` lives at `tests/scripts/` and is edited in-place.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator review of v2.10 milestone-close SUMMARY for narrative completeness | DETERM-15 | SUMMARY is a human-readable artifact — completeness is a judgment call (audit lineage, deferrals, shipworthiness narrative) | Read `.planning/phases/87-…/87-SUMMARY.md`; confirm sections: anchor numbers, Phase 79→87 lineage, v2.11+ deferrals, audit-milestone verdict link |
| Operator sign-off on `tech_debt` vs `passed` audit verdict mapping to shippability | DETERM-15 | Per research finding: CASCADE=40 reality may force `tech_debt` verdict; operator decides whether `tech_debt + explicit deferrals` = shippable for v2.10 | Read `.planning/v2.10-MILESTONE-AUDIT.md`; operator confirms shippable disposition |

---

## Validation Sign-Off

- [ ] 3-run SHA-identity gate PASS (Task 87-01-01)
- [ ] Anchor target verified within tolerance (Task 87-01-02)
- [ ] Parity-gate self-check PASS (Task 87-01-03)
- [ ] `/gsd-audit-milestone v2.10` clean (Task 87-01-04)
- [ ] No "did not run" cells in cold-start baseline (`feedback_e2e_did_not_run.md` directive)
- [ ] `nyquist_compliant: true` set in frontmatter after gate completion

**Approval:** pending

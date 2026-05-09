---
phase: 72
slug: package-hygiene-trio
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (E2E parity baseline) |
| **Config file** | apps/frontend/vitest.config.ts, packages/*/vitest.config.ts; playwright.config.ts |
| **Quick run command** | `yarn build && yarn lint:check` |
| **Full suite command** | `yarn build && yarn lint:check && yarn test:unit && yarn supabase:lint:sql && yarn test:e2e` |
| **Estimated runtime** | ~6–10 min (full suite incl. Playwright; ~30s for build+lint+unit only) |

---

## Sampling Rate

- **After every task commit:** Run `yarn build` (workspace-scoped where possible) + targeted grep verifications declared in each task's `<acceptance_criteria>`.
- **After every plan wave:** Run `yarn build && yarn lint:check && yarn test:unit`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ≤30s for build + lint + unit; ≤10min for full suite incl. Playwright parity.

---

## Per-Task Verification Map

> Filled in by the planner per-task. Each row maps a task to its verification command and per-task acceptance criterion. Phase 72 is a refactor / package-hygiene phase — verification is dominated by `grep`-based criteria and existing `yarn build` / `yarn test:unit` / `yarn lint:check` / `yarn supabase:lint:sql` runs. No new test files are written by phase scope.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {filled in by planner} | {01–03} | {wave} | SHARED-01 / SHARED-02 / LINT-01 | — | N/A | grep/build/lint | `{command}` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No new test infrastructure required — existing `yarn build` / `yarn test:unit` / `yarn lint:check` / `yarn supabase:lint:sql` (after rename) / `yarn test:e2e` covers all phase requirements. The phase-close verification gate composes existing commands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dual ESM+CJS build outputs both formats correctly | SHARED-01 | Need to inspect `dist/` after build to confirm both ESM and CJS bundles emitted | After `yarn workspace @openvaa/app-shared build`: `ls packages/app-shared/dist/` should show both `.js` (ESM) and `.cjs` (CJS) files; or whatever the canonical paradigm produces |
| CI workflow run on feature branch verifies LINT-01 doesn't break CI | LINT-01 | CI files reference may be missed by static grep; pushing the branch and observing CI is the only ground truth | Push the phase branch to remote; verify GitHub Actions runs to green |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (N/A — none required)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (quick) / 10min (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

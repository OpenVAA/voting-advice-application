---
phase: 63
slug: e2e-template-extension-greening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 63 — Validation Strategy

> Per-phase validation contract. Source-of-truth Validation Architecture is in 63-RESEARCH.md §Validation Architecture; this file projects it onto the Nyquist compliance form.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | vitest 3.2.4 |
| **Framework (E2E)** | Playwright (catalog pin) — the parity-gate itself is the primary verification surface |
| **Config files** | `packages/dev-seed/vitest.config.ts` (if exists), `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit --run` (template shape) + `yarn workspace @openvaa/app-shared test:unit --run` (if merge utility relocated) |
| **Full suite command** | `yarn test:unit && yarn test:e2e` (E2E requires `yarn dev` + Supabase running) |
| **Parity-gate command** | `yarn playwright test -c ./tests/playwright.config.ts ./tests --workers=1 --reporter=json | python3 strip-banner.py > playwright-report.json && yarn tsx apps/frontend/scripts/diff-playwright-reports.ts ./.planning/phases/60-layout-runes-migration-hydration-fix/post-v2.5/playwright-report.json ./.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` |
| **Estimated runtime** | ~8-15 min for full parity Playwright run; ~30s for unit tests |

---

## Sampling Rate

- **Per task commit:** unit tests scoped to touched package (`dev-seed` / `app-shared` / frontend)
- **Per wave merge:** full unit suite + targeted Playwright spec smoke (1-2 specs)
- **Phase gate:** full parity Playwright run + diff vs post-v2.5 baseline
- **Max feedback latency:** 30s unit, 15min parity gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 63-01-* | 01 | 1 | E2E-02 (merge utility hoist + types) | — | unit | `yarn workspace @openvaa/app-shared test:unit --run` | ✅ existing | ⬜ pending |
| 63-02-* | 02 | 2 | E2E-02 (template population + setup deletes + audit) | — | unit + integration | `yarn workspace @openvaa/dev-seed test:unit --run` + targeted Playwright | ✅ existing | ⬜ pending |
| 63-03-* | 03 | 3 | E2E-01 (parity gate run + baseline capture + residual triage) | — | Playwright parity | parity-gate command above | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `apps/frontend/src/lib/utils/merge.ts` `mergeSettings` has unit coverage (or scaffold test in the hoisted location once moved).
- [ ] Verify `packages/dev-seed/src/templates/e2e/` has unit tests exercising `app_settings.fixed[]` shape (planner inspects — may scaffold new test if missing).
- [ ] Parity-gate Wave 0 prep: confirm post-v2.5 baseline JSON at `.planning/phases/60-layout-runes-migration-hydration-fix/post-v2.5/playwright-report.json` exists (verified via `ls`).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Parity-gate verdict interpretation | E2E-01 | Judgment call on Category A vs B classification for any residuals | After gate runs, human reviews `diff.md` → confirms any remaining failures are labeled with specific framework pointers (Playwright concurrency issue, upstream Svelte 5 bug, etc.), not generic "flake" |
| Residual-budget escalation decision | E2E-01 | Planner rule says single-file + <50 LoC + isolated; borderline cases need human review | If a residual fix exceeds the budget triple, escalate to human instead of applying |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (unit) / 15min (parity)
- [ ] `nyquist_compliant: true` set in frontmatter after plan-checker verification

**Approval:** pending

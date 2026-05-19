---
phase: 76
slug: profile-a11y
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.x (E2E) + vitest (unit, only for `@openvaa/dev-seed` template-shape tests if extended) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=list --grep "<spec-title-substring>"` |
| **Full suite command** | `yarn supabase:reset && yarn dev:seed --template e2e && yarn workspace @openvaa/tests test:e2e --workers=1` |
| **Estimated runtime** | ~10-12 min full; ~30-90 sec per spec quick |

---

## Sampling Rate

- **After every task commit:** Run quick command scoped to the spec under modification (`--grep "A11Y-01"` etc).
- **After every plan wave:** Run full suite command (post-seed reset).
- **Before `/gsd-verify-work`:** Full suite must be green; 3 consecutive `--workers=1` cold-start runs must produce identical pass/fail set (Phase 73 determinism contract).
- **Max feedback latency:** ~120 seconds for quick run; ~12 minutes for full suite.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 76-01-01 | 01 | 1 | A11Y-01 | — | Validation error UI surfaces; bad input preserved | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "A11Y-01"` | ❌ W0 | ⬜ pending |
| 76-02-01 | 02 | 2 | A11Y-02 | — | All editable fields persist after `page.reload()` | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "A11Y-02"` | ❌ W0 | ⬜ pending |
| 76-01-02 | 01 | 1 | A11Y-01, A11Y-02 | — | E2E fixture extended with displayName (Plan 01; maxlength anchor for A11Y-01 cell-3) + bio + social-link info questions with Alpha answers (Plan 02 extends additively bio + social-link) | E2E (template build) | `yarn build --filter=@openvaa/dev-seed && yarn supabase:reset && yarn dev:seed --template e2e` | ❌ W0 | ⬜ pending |
| 76-03-01 | 03 | 1 | A11Y-03 | — | `@axe-core/playwright` installed in root devDeps | shell | `node -e "console.log(require('./package.json').devDependencies['@axe-core/playwright'])"` (must print version, not undefined) | ❌ W0 | ⬜ pending |
| 76-03-02 | 03 | 1 | A11Y-03 | — | `PLAYWRIGHT_A11Y` conditional project registered in playwright.config.ts | source assert | `grep -q "PLAYWRIGHT_A11Y" tests/playwright.config.ts && grep -q "name: 'a11y-smoke'" tests/playwright.config.ts` | ❌ W0 | ⬜ pending |
| 76-03-03 | 03 | 1 | A11Y-03 | — | `tests/specs/a11y/a11y-smoke.spec.ts` runs against 5 routes | E2E (opt-in) | `PLAYWRIGHT_A11Y=1 yarn workspace @openvaa/tests test:e2e --project=a11y-smoke --workers=1` | ❌ W0 | ⬜ pending |
| 76-04-01 | 04 | 2 | A11Y-03 | — | `76-A11Y-BASELINE.md` captures per-route violation list (rule-id, impact, count) | artifact assert | `test -f .planning/phases/76-profile-a11y/76-A11Y-BASELINE.md && grep -q "## Route:" .planning/phases/76-profile-a11y/76-A11Y-BASELINE.md` | ❌ W0 | ⬜ pending |
| 76-04-02 | 04 | 2 | A11Y-03 | — | Cite-and-fix follow-up todo filed at `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` | artifact assert | `test -f .planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` | ❌ W0 | ⬜ pending |
| 76-04-03 | 04 | 2 | A11Y-01/02/03 | — | 3-run cold-start `--workers=1` identical pass/fail set (Phase 73 determinism) | shell | `for i in 1 2 3; do yarn supabase:reset && yarn dev:seed --template e2e && yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > /tmp/run-$i.json; done && diff <(jq '.suites' /tmp/run-1.json) <(jq '.suites' /tmp/run-2.json) && diff <(jq '.suites' /tmp/run-1.json) <(jq '.suites' /tmp/run-3.json)` | ❌ W0 | ⬜ pending |
| 76-04-04 | 04 | 2 | A11Y-03 | — | Axe smoke is deterministic — 2 successive scans against unchanged frontend produce identical violation lists | shell | `PLAYWRIGHT_A11Y=1 yarn workspace @openvaa/tests test:e2e --project=a11y-smoke --workers=1 --reporter=json > /tmp/axe-1.json && PLAYWRIGHT_A11Y=1 yarn workspace @openvaa/tests test:e2e --project=a11y-smoke --workers=1 --reporter=json > /tmp/axe-2.json && diff /tmp/axe-1.json /tmp/axe-2.json` (modulo timestamps) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — NEW spec for A11Y-01 cells (Plan 01)
- [ ] `tests/tests/specs/a11y/a11y-smoke.spec.ts` — NEW spec for A11Y-03 (Plan 03)
- [ ] `tests/tests/fixtures/not-an-image.txt` — NEW fixture for image-type rejection cell
- [ ] `tests/tests/fixtures/oversized.png` — NEW fixture for image-size rejection cell (>20MB)
- [ ] Root `package.json` — add `@axe-core/playwright@^4.11.3` to devDependencies (Plan 03)
- [ ] `packages/dev-seed/src/templates/e2e.ts` — extend info-question fixed[] (Plan 02; required for A11Y-02 and A11Y-01 cell-3)
- [ ] `tests/playwright.config.ts` — add `PLAYWRIGHT_A11Y` conditional-project block (Plan 03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First-run axe baseline review | A11Y-03 | First-run violation list must be sanity-checked by a human before filing the cite-and-fix todo (the smoke records what axe found; human confirms the findings are real WCAG issues, not false positives) | After Plan 04 captures `76-A11Y-BASELINE.md`, scan the per-route violation list; if any rule-id looks like a false positive, note it in the cite-and-fix todo |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s (quick) / 12min (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
